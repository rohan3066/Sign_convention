import pickle
import sqlite3
import json
import os

# Paths
SETUP_DIR = "SETUP"
LANDMARKS_FILE = os.path.join(SETUP_DIR, "landmarks_data.pkl")
RECOGNITION_FILE = os.path.join(SETUP_DIR, "recognition_data.pkl")
DB_FILE = "signs_db.sqlite"

def migrate():
    print(f"Connecting to {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Create tables
    cursor.execute("DROP TABLE IF EXISTS avatar_signs")
    cursor.execute("CREATE TABLE avatar_signs (id INTEGER PRIMARY KEY AUTOINCREMENT, lang TEXT, word TEXT, frames TEXT)")
    
    cursor.execute("DROP TABLE IF EXISTS recognition_signs")
    cursor.execute("CREATE TABLE recognition_signs (id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT, variation_idx INTEGER, frames TEXT)")

    # 1. Migrate Avatar Data
    if os.path.exists(LANDMARKS_FILE):
        print(f"Loading {LANDMARKS_FILE}...")
        with open(LANDMARKS_FILE, 'rb') as f:
            landmarks_db = pickle.load(f)
        
        print("Migrating Avatar Data...")
        for lang, words in landmarks_db.items():
            for word, frames in words.items():
                cursor.execute("INSERT INTO avatar_signs (lang, word, frames) VALUES (?, ?, ?)", (lang, word, json.dumps(frames)))
        conn.commit()
        print(f"Migrated {len(landmarks_db)} languages for Avatar.")

    # 2. Migrate Recognition Data
    if os.path.exists(RECOGNITION_FILE):
        print(f"Loading {RECOGNITION_FILE}...")
        with open(RECOGNITION_FILE, 'rb') as f:
            recognition_db = pickle.load(f)
        
        print("Migrating Recognition Data...")
        count = 0
        for word, variations in recognition_db.items():
            for idx, frames in enumerate(variations):
                cursor.execute("INSERT INTO recognition_signs (word, variation_idx, frames) VALUES (?, ?, ?)", (word, idx, json.dumps(frames)))
                count += 1
        conn.commit()
        print(f"Migrated {count} sign variations for Recognition.")

    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
