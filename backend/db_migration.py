import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "sql_app.db")

def migrate():
    print(f"Connecting to database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT 1")
        print("Added email_notifications_enabled column.")
    except sqlite3.OperationalError as e:
        print(f"Skipping email_notifications_enabled: {e}")

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN notification_email VARCHAR")
        print("Added notification_email column.")
    except sqlite3.OperationalError as e:
        print(f"Skipping notification_email: {e}")

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN expo_push_token VARCHAR")
        print("Added expo_push_token column.")
    except sqlite3.OperationalError as e:
        print(f"Skipping expo_push_token: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
