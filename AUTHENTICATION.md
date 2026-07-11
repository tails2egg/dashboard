# Authentication

Install the external dependency:

```bash
pip install bcrypt
```

SQLite is included with Python.

## Current Flow

- Signup validates the email and password.
- The password is hashed with bcrypt before storage.
- SQLite stores only `password_hash`, never plaintext.
- New accounts are marked `verified` immediately.
- The browser receives only public account metadata, saves a local session, and opens `/dashboard`.
- Login verifies the password with `bcrypt.checkpw()`.
- SQL queries use `?` placeholders to prevent SQL injection.
- Failed login attempts are rate-limited per email/IP.

## Example

```python
from database import init_auth_db
from auth_system import register_user, login_user

db_path = ".dashboard-auth.sqlite3"
init_auth_db(db_path)

account = register_user(db_path, "person@example.com", "CorrectPass123")
print(account.user.public_dict())

user = login_user(db_path, "person@example.com", "CorrectPass123", ip_address="127.0.0.1")
print(user.public_dict())
```
