import pickle
import os

LANDMARKS_FILE = r"c:\Users\chava\Desktop\Sign_convention\SETUP\landmarks_data.pkl"
RECOGNITION_FILE = r"c:\Users\chava\Desktop\Sign_convention\SETUP\recognition_data.pkl"

def peek():
    if os.path.exists(LANDMARKS_FILE):
        with open(LANDMARKS_FILE, 'rb') as f:
            data = pickle.load(f)
        print("--- LANDMARKS_DATA.PKL ---")
        for lang, words in data.items():
            print(f"Language: {lang}, Word count: {len(words)}")
            print(f"Words: {list(words.keys())[:20]}...")
    else:
        print(f"{LANDMARKS_FILE} not found")

    if os.path.exists(RECOGNITION_FILE):
        with open(RECOGNITION_FILE, 'rb') as f:
            data = pickle.load(f)
        print("\n--- RECOGNITION_DATA.PKL ---")
        print(f"Word count: {len(data)}")
        print(f"Words: {list(data.keys())[:20]}...")
    else:
        print(f"{RECOGNITION_FILE} not found")

if __name__ == "__main__":
    peek()
