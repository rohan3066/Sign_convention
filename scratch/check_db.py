import sqlite3
import json

db_path = 'signs_db.sqlite'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

words_to_check = ['hello', 'actor', 'aeroplane', 'apple', 'zebra']

for word in words_to_check:
    cursor.execute("SELECT word, frames FROM avatar_signs WHERE word = ?", (word,))
    row = cursor.fetchone()
    if row:
        word_found, frames_str = row
        try:
            frames = json.loads(frames_str)
            num_frames = len(frames)
            points_per_frame = len(frames[0]) if num_frames > 0 else 0
            print(f"Word: {word_found} | Frames: {num_frames} | Points per frame: {points_per_frame}")
        except Exception as e:
            print(f"Word: {word_found} | Error parsing frames: {e}")
    else:
        print(f"Word: {word} | NOT FOUND")

conn.close()
