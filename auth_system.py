import re
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import bcrypt

from database import connect


BCRYPT_ROUNDS = 12
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,}$")
LOGIN_RATE_LIMIT_ATTEMPTS = 5
LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60
ADMIN_EMAILS = {"basil@gmail.com"}


def is_admin_email(email):
    return normalize_email(email) in ADMIN_EMAILS


def set_admin_emails(emails):
    normalized = {normalize_email(email) for email in emails if normalize_email(email)}
    ADMIN_EMAILS.clear()
    ADMIN_EMAILS.update(normalized)


class AuthError(ValueError):
    """Base class for authentication errors that are safe to show to users."""


class ValidationError(AuthError):
    pass


class UserAlreadyExists(AuthError):
    pass


class UserNotFound(AuthError):
    pass


class InvalidCredentials(AuthError):
    pass


class AccountNotVerified(AuthError):
    pass


class RateLimitExceeded(AuthError):
    def __init__(self, retry_after_seconds):
        self.retry_after_seconds = retry_after_seconds
        super().__init__(f"Too many login attempts. Try again in {retry_after_seconds} seconds.")


@dataclass(frozen=True)
class AuthUser:
    email: str
    employee_id: str = ""
    employee_name: str = ""
    department: str = ""
    created_at: str = ""
    verified_at: str = ""

    def public_dict(self):
        return {
            "email": self.email,
            "username": self.email,
            "employeeId": self.employee_id,
            "employeeName": self.employee_name,
            "department": self.department,
            "createdAt": self.created_at,
            "isVerified": bool(self.verified_at),
            "isAdmin": is_admin_email(self.email),
        }


@dataclass(frozen=True)
class RegistrationResult:
    user: AuthUser


def utc_now():
    return datetime.now(timezone.utc)


def iso_now():
    return utc_now().isoformat()


def parse_iso(value):
    return datetime.fromisoformat(value)


def normalize_email(email):
    return str(email or "").strip().lower()


def validate_email(email):
    normalized = normalize_email(email)
    if not EMAIL_RE.fullmatch(normalized):
        raise ValidationError("Enter a valid email address.")
    local, _, domain = normalized.partition("@")
    if local.startswith(".") or local.endswith(".") or ".." in local or ".." in domain:
        raise ValidationError("Enter a valid email address.")
    return normalized


def validate_password(password):
    if not isinstance(password, str):
        raise ValidationError("Password is required.")
    if len(password) < 8:
        raise ValidationError("Use at least 8 characters.")
    if len(password) > 128:
        raise ValidationError("Use 128 characters or fewer.")
    if password.strip() != password:
        raise ValidationError("Password cannot start or end with spaces.")
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        raise ValidationError("Use at least one letter and one number.")
    return password


def hash_password(password):
    validate_password(password)
    # bcrypt.gensalt() creates a unique random salt for each password and stores
    # the salt plus cost factor in the hash. No plaintext password is stored.
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=BCRYPT_ROUNDS))


def verify_password(password, password_hash):
    if not isinstance(password, str) or not password:
        return False
    try:
        # bcrypt.checkpw() verifies using the salt embedded in the stored hash.
        return bcrypt.checkpw(password.encode("utf-8"), bytes(password_hash))
    except (TypeError, ValueError):
        return False


def row_to_user(row):
    return AuthUser(
        email=row["email"],
        employee_id=row["employee_id"],
        employee_name=row["employee_name"],
        department=row["department"],
        created_at=row["created_at"],
        verified_at=row["verified_at"] or "",
    )


def register_user(db_path, email, password, *, employee_id="", employee_name="", department=""):
    normalized = validate_email(email)
    password_hash = hash_password(password)
    created_at = iso_now()
    verified_at = created_at
    try:
        with connect(db_path) as connection:
            connection.execute(
                """
                INSERT INTO users (email, password_hash, status, employee_id, employee_name, department, created_at, verified_at)
                VALUES (?, ?, 'verified', ?, ?, ?, ?, ?)
                """,
                (
                    normalized,
                    password_hash,
                    employee_id or "",
                    employee_name or "",
                    department or "",
                    created_at,
                    verified_at,
                ),
            )
    except sqlite3.IntegrityError as error:
        raise UserAlreadyExists("An account with this email already exists.") from error

    user = AuthUser(normalized, employee_id or "", employee_name or "", department or "", created_at, verified_at)
    return RegistrationResult(user)


def rate_limit_key(email, ip_address=""):
    return validate_email(email), str(ip_address or "")


def check_login_rate_limit(connection, email, ip_address=""):
    normalized, ip = rate_limit_key(email, ip_address)
    cutoff = (utc_now() - timedelta(seconds=LOGIN_RATE_LIMIT_WINDOW_SECONDS)).isoformat()
    row = connection.execute(
        """
        SELECT COUNT(*) AS failures, MIN(attempted_at) AS first_attempt
        FROM login_attempts
        WHERE email = ? AND ip_address = ? AND success = 0 AND attempted_at >= ?
        """,
        (normalized, ip, cutoff),
    ).fetchone()
    failures = int(row["failures"] or 0)
    if failures < LOGIN_RATE_LIMIT_ATTEMPTS:
        return
    retry_at = parse_iso(row["first_attempt"]) + timedelta(seconds=LOGIN_RATE_LIMIT_WINDOW_SECONDS)
    retry_after = max(1, int((retry_at - utc_now()).total_seconds()))
    raise RateLimitExceeded(retry_after)


def record_login_attempt(connection, email, ip_address="", success=False):
    normalized, ip = rate_limit_key(email, ip_address)
    connection.execute(
        """
        INSERT INTO login_attempts (email, ip_address, attempted_at, success)
        VALUES (?, ?, ?, ?)
        """,
        (normalized, ip, iso_now(), 1 if success else 0),
    )


def clear_failed_login_attempts(connection, email, ip_address=""):
    normalized, ip = rate_limit_key(email, ip_address)
    connection.execute(
        "DELETE FROM login_attempts WHERE email = ? AND ip_address = ? AND success = 0",
        (normalized, ip),
    )


def login_user(db_path, email, password, *, ip_address=""):
    normalized = validate_email(email)
    validate_password(password)
    with connect(db_path) as connection:
        check_login_rate_limit(connection, normalized, ip_address)
        row = connection.execute(
            """
            SELECT email, password_hash, status, employee_id, employee_name, department, created_at, verified_at
            FROM users
            WHERE email = ?
            """,
            (normalized,),
        ).fetchone()
        if row is None:
            record_login_attempt(connection, normalized, ip_address, success=False)
            connection.commit()
            raise UserNotFound("We couldn't find an account for this email.")
        if row["status"] != "verified" or not row["verified_at"]:
            record_login_attempt(connection, normalized, ip_address, success=False)
            connection.commit()
            raise AccountNotVerified("Verify your email before logging in.")
        if not verify_password(password, row["password_hash"]):
            record_login_attempt(connection, normalized, ip_address, success=False)
            connection.commit()
            raise InvalidCredentials("Incorrect password.")
        record_login_attempt(connection, normalized, ip_address, success=True)
        clear_failed_login_attempts(connection, normalized, ip_address)
        return row_to_user(row)


def clear_users(db_path):
    with connect(db_path) as connection:
        # Local demo maintenance helper: removes accounts and login attempts.
        connection.execute("DELETE FROM login_attempts")
        connection.execute("DELETE FROM users")
