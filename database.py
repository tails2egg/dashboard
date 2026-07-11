import sqlite3
from pathlib import Path


def connect(db_path):
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    # Foreign keys are off by default in SQLite; enable them for every
    # connection before any future relational tables are added.
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_auth_db(db_path):
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with connect(path) as connection:
        # UNIQUE(email) protects against duplicate accounts even if two signup
        # requests arrive at the same time.
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash BLOB NOT NULL,
                status TEXT NOT NULL DEFAULT 'unverified',
                employee_id TEXT NOT NULL DEFAULT '',
                employee_name TEXT NOT NULL DEFAULT '',
                department TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                verified_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS login_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                ip_address TEXT NOT NULL DEFAULT '',
                attempted_at TEXT NOT NULL,
                success INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        migrate_auth_db(connection)


def migrate_auth_db(connection):
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(users)").fetchall()}
    if "email" not in columns and "username" in columns:
        connection.execute("ALTER TABLE users RENAME COLUMN username TO email")
        columns.discard("username")
        columns.add("email")
    if "status" not in columns:
        connection.execute("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'unverified'")
    if "verified_at" not in columns:
        connection.execute("ALTER TABLE users ADD COLUMN verified_at TEXT")
