import json
import os
import time
from llm_client import alexa_client

# --- MOCK DATA MANAGER (for Isolation) ---
class MockDataManager:
    def __init__(self, filename="test_user_data.json"):
        self.filename = filename
        # Start clean
        if os.path.exists(self.filename):
            os.remove(self.filename)
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.filename):
            with open(self.filename, 'w') as f:
                json.dump({
                    "parent_inputs": [], 
                    "progress_log": [],
                    "learning_strategy": "Test Strategy: User loves space and rockets."
                }, f)

    def load_data(self):
        with open(self.filename, 'r') as f:
            return json.load(f)

    def add_parent_input(self, content, type, status="accepted", alexa_response="Test Plan"):
        data = self.load_data()
        new_entry = {
            "id": "test_id",
            "content": content,
            "type": type,
            "status": status,
            "alexa_response": alexa_response,
            "timestamp": "2023-01-01T00:00:00"
        }
        data["parent_inputs"].insert(0, new_entry)
        with open(self.filename, 'w') as f:
            json.dump(data, f)
        print(f"\n[DASHBOARD] Added Parent Input: {content}")

# --- TEST SUITE ---
def run_tests():
    print("=== STARTING ALEXA COMPANION TEST SUITE (ISOLATED) ===")
    dm = MockDataManager()
    
    # TEST 1: HOSTILE PREEMPTIVE CORRECTION CHECK
    print("\n--- TEST 1: Preemptive Correction Check ---")
    print("User: 'Hi Alexa'")
    resp1 = alexa_client.send_message("Hi Alexa", user_data=dm.load_data())
    print(f"Alexa: {resp1}")
    
    if "full sentence" in resp1.lower():
        print("[FAIL] FAILED: Alexa corrected before user answered!")
    else:
        print("[PASS] PASSED: No preemptive correction.")

    # TEST 2: PARENT ADAPTATION
    print("\n--- TEST 2: Parent Directive Injection ---")
    # Add directive
    dm.add_parent_input("Teach him the word 'Nebula'", "vocabulary")
    
    print("User: 'Tell me a story'")
    resp2 = alexa_client.send_message("Tell me a story", user_data=dm.load_data())
    print(f"Alexa: {resp2}")
    
    if "nebula" in resp2.lower():
        print("[PASS] PASSED: Alexa used the injected vocabulary word 'Nebula'.")
    else:
        print("[WARN] WARNING: Alexa might not have used 'Nebula'. Check response manually.")

    # TEST 3: REACTIVE CORRECTION (Fragment)
    print("\n--- TEST 3: Reactive Correction ---")
    # Alexa asked a question in resp2 presumably. Let's reply with a fragment.
    print("User: 'Rocket'")
    resp3 = alexa_client.send_message("Rocket", user_data=dm.load_data())
    print(f"Alexa: {resp3}")
    
    if "full sentence" in resp3.lower():
        print("[PASS] PASSED: Alexa correctly prompted for a full sentence AFTER a fragment.")
    else:
        print("[WARN] WARNING: Alexa missed the fragment correction. (This is soft-fail, she might have chosen to be rigorous on academic topic instead).")

    # TEST 4: IMAGE GENERATION
    print("\n--- TEST 4: Image Generation Capability ---")
    print("User: 'Show me what a Nebula looks like'")
    resp4 = alexa_client.send_message("Show me what a Nebula looks like", user_data=dm.load_data())
    print(f"Alexa: {resp4}")
    
    if "[IMAGE:" in resp4:
        print("[PASS] PASSED: Alexa generated an image tag.")
    else:
        print("[FAIL] FAILED: No image tag generated.")

    print("\n=== TEST SUITE COMPLETE ===")
    
    # Cleanup
    if os.path.exists("test_user_data.json"):
        os.remove("test_user_data.json")
        print("Cleanup: Removed test_user_data.json")

if __name__ == "__main__":
    run_tests()
