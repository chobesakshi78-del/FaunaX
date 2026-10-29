"""
FAUNA-X: Safe SQLite / PostgreSQL Schema Migration Script
Ensures multilingual fields, field officer assignments, and translation tables exist
without deleting or overwriting any existing data.
"""
import asyncio
import sqlite3
from pathlib import Path

from backend.app.core.config import settings

def run_sqlite_migration():
    db_path = Path("faunax.db")
    if not db_path.exists():
        print("[MIGRATE] faunax.db not found; will be created on server startup.")
        return

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # 1. Check and add preferred_language to users
    cursor.execute("PRAGMA table_info(users)")
    user_cols = [row[1] for row in cursor.fetchall()]
    if "preferred_language" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en' NOT NULL")
        print("[MIGRATE] Added 'preferred_language' to 'users' table.")
    else:
        print("[MIGRATE] 'preferred_language' already exists in 'users'.")

    # 2. Check and add primary_language & assigned_officer_id to cases
    cursor.execute("PRAGMA table_info(cases)")
    case_cols = [row[1] for row in cursor.fetchall()]
    if "primary_language" not in case_cols:
        cursor.execute("ALTER TABLE cases ADD COLUMN primary_language VARCHAR(10) DEFAULT 'en' NOT NULL")
        print("[MIGRATE] Added 'primary_language' to 'cases' table.")
    if "assigned_officer_id" not in case_cols:
        cursor.execute("ALTER TABLE cases ADD COLUMN assigned_officer_id INTEGER REFERENCES users(id)")
        print("[MIGRATE] Added 'assigned_officer_id' to 'cases' table.")

    # 3. Check and add columns to field_visits
    cursor.execute("PRAGMA table_info(field_visits)")
    visit_cols = [row[1] for row in cursor.fetchall()]
    if "field_officer_id" not in visit_cols:
        cursor.execute("ALTER TABLE field_visits ADD COLUMN field_officer_id INTEGER REFERENCES users(id)")
        print("[MIGRATE] Added 'field_officer_id' to 'field_visits'.")
    if "observations" not in visit_cols:
        cursor.execute("ALTER TABLE field_visits ADD COLUMN observations TEXT")
        print("[MIGRATE] Added 'observations' to 'field_visits'.")
    if "outcome" not in visit_cols:
        cursor.execute("ALTER TABLE field_visits ADD COLUMN outcome TEXT")
        print("[MIGRATE] Added 'outcome' to 'field_visits'.")
    if "containment_status" not in visit_cols:
        cursor.execute("ALTER TABLE field_visits ADD COLUMN containment_status VARCHAR(50) DEFAULT 'NOT_REQUIRED'")
        print("[MIGRATE] Added 'containment_status' to 'field_visits'.")
    if "sample_collected" not in visit_cols:
        cursor.execute("ALTER TABLE field_visits ADD COLUMN sample_collected BOOLEAN DEFAULT 0")
        print("[MIGRATE] Added 'sample_collected' to 'field_visits'.")

    # 4. Create case_translations table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS case_translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        field_name VARCHAR(50) NOT NULL,
        source_language VARCHAR(10) DEFAULT 'en',
        target_language VARCHAR(10) NOT NULL,
        original_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        is_machine_translated BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_case_translations_case_id ON case_translations(case_id)")
    print("[MIGRATE] Ensured 'case_translations' table and indices exist.")

    conn.commit()
    conn.close()
    print("[MIGRATE] Migration finished successfully without data loss!")

if __name__ == "__main__":
    run_sqlite_migration()
