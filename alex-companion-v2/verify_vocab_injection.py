from data_manager import DataManager
from skills.chat_skill import ChatSkill
from llm_client import SkillClient
import json

class MockClient:
    def generate_response(self, message, system_instruction):
        try:
            print(f"\n[INTERCEPTED SYSTEM INSTRUCTION]\n{system_instruction.encode('utf-8', errors='ignore').decode('utf-8')}\n")
        except:
             print("[INTERCEPTED SYSTEM INSTRUCTION] (Unicode Error - Content Hidden)")
        
        if "Mitosis" in system_instruction and "cell divides" in system_instruction:
            return "SUCCESS: Dynamic vocabulary 'Mitosis' found in system prompt."
        return "FAIL: Dynamic vocabulary not found."

def run_test():
    print("TEST: Injecting Parent Vocabulary...")
    
    # 1. Inject Fake Parent Data
    dm = DataManager()
    dm.add_parent_input("Mitosis: The process where a cell divides into two identical copies. Bridge: 'Just like making a copy of a file on your computer.'", "vocabulary", {"status": "accepted"})
    
    print(f"DEBUG: Vocab List from DM: {dm.get_vocabulary()}")

    # 2. Initialize Skill with Mock Client
    skill = ChatSkill(MockClient())
    print(f"DEBUG: Raw System Prompt Template (First 500 chars): {skill.system_prompt[:500]}...")
    if "{{DYNAMIC_VOCABULARY}}" in skill.system_prompt:
        print("DEBUG: Placeholder FOUND in template.")
    else:
        print("DEBUG: Placeholder NOT FOUND in template.")
    
    # 3. Handle Message
    response = skill.handle_message("Hello", {})
    print(response)

if __name__ == "__main__":
    run_test()
