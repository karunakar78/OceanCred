import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "sql_app.db")

def migrate():
    print(f"Connecting to database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    columns = [
        ("users", "phone VARCHAR", "phone"),
        ("users", "location VARCHAR", "location"),
        ("users", "verified BOOLEAN DEFAULT 0", "verified"),
        ("users", "otp_secret VARCHAR", "otp_secret"),
        ("credits", "device_hash VARCHAR", "device_hash"),
        ("credits", "photo_path VARCHAR", "photo_path"),
        ("credits", "ai_confidence FLOAT", "ai_confidence"),
        ("credits", "credit_amount INTEGER DEFAULT 0", "credit_amount")
    ]
    
    for table, col_def, col_name in columns:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
            print(f"Added {col_name} to {table}.")
        except sqlite3.OperationalError as e:
            print(f"Skipping {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Mobile Migration complete.")

if __name__ == "__main__":
    migrate()
