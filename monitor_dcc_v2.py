import sys
import os
import time
import json
from datetime import datetime

# Path Configuration
PROJECT_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\Meta_App_Factory\Adv_Autonomous_Agent"
CACHE_FILE = os.path.join(PROJECT_DIR, ".Gemini_state", ".sentry_cache.json")

def cleanup():
    os.system('cls' if os.name == 'nt' else 'clear')

def load_cache():
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        else:
            return []
    except Exception as e:
        return ["ERROR: " + str(e)]

if __name__ == "__main__":
    print(f"--- DCC ACTIVITY MONITOR [Interval: 10s] ---")
    print(f"Watching: {CACHE_FILE}\n")
    
    try:
        while True:
            timestamp = datetime.now().strftime("%H:%M:%S")
            data = load_cache()
            
            # Data is a list of strings (Tasks/Context)
            
            print(f"[{timestamp}] ACTIVE TASKS / CONTEXT:")
            if isinstance(data, list):
                if not data:
                    print("  (No active tasks in cache)")
                for i, item in enumerate(data):
                    # Truncate long items
                    preview = (item[:100] + '...') if len(item) > 100 else item
                    print(f"  {i+1}. {preview}")
            else:
                 print(f"  Unknown Data Format: {type(data)}")

            print("-" * 50)

            # In a real terminal, we'd loop. Here, I'll run ONCE to demonstrate.
            break 
            
            # time.sleep(10) 

    except KeyboardInterrupt:
        print("\nMonitor Stopped.")
