import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent.parent / "faunax.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("UPDATE users SET preferred_language = 'mr' WHERE email = 'farmer@faunax.gov.in'")
cur.execute("UPDATE users SET preferred_language = 'en' WHERE email = 'vet@faunax.gov.in'")
cur.execute("UPDATE users SET preferred_language = 'hi' WHERE email = 'field@faunax.gov.in'")

conn.commit()

rows = cur.execute("SELECT id, email, role, preferred_language FROM users").fetchall()
print("Updated user language preferences in database:")
for r in rows:
    print(f"  User {r[0]}: {r[1]} ({r[2]}) -> {r[3]}")
conn.close()
