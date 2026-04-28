import pickle
import os

LANDMARKS_FILE = r"c:\Users\chava\Desktop\Sign_convention\SETUP\landmarks_data.pkl"

def check_words():
    with open(LANDMARKS_FILE, 'rb') as f:
        data = pickle.load(f)
    isl = data.get('ISL', {})
    target_words = ['nurse', 'hospital', 'brother', 'buy', 'buys', 'laptop', 'train', 'late', 'today', 'work', 'works']
    print("--- ISL VOCABULARY CHECK ---")
    for w in target_words:
        print(f"'{w}': {'FOUND' if w in isl else 'NOT FOUND'}")

if __name__ == "__main__":
    check_words()
