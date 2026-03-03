from coordinator import Coordinator
import time

def verify_quiz_flow():
    print("--- Starting Quiz Verification ---")
    coord = Coordinator()
    
    # 1. Trigger Quiz
    print("\nUSER: Let's do a quiz about biology.")
    response = coord.process_message("Let's do a quiz about biology")
    print(f"ALEXA: {response}")
    
    if "question" not in response.lower() and "quiz" not in response.lower():
         print("WARNING: Response does not look like a quiz question.")
    
    # 2. Answer Question 1
    print("\nUSER: The answer is A")
    response = coord.process_message("The answer is A")
    print(f"ALEXA: {response}")
    
    # 3. Check State
    if coord.user_context.get("quiz_state", {}).get("current_q") > 1:
        print("SUCCESS: Quiz state incremented.")
    else:
        print("FAIL: Quiz state did not increment.")

    # 4. Stop Quiz
    print("\nUSER: Stop quiz")
    response = coord.process_message("Stop quiz")
    print(f"ALEX: {response}")
    
    if coord.active_skill_name == "chat":
        print("SUCCESS: Returned to Chat mode.")
    else:
        print(f"FAIL: Still in {coord.active_skill_name} mode.")

if __name__ == "__main__":
    verify_quiz_flow()
