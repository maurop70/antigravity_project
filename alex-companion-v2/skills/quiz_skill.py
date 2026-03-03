from .base_skill import BaseSkill
from typing import Dict, Any

class QuizSkill(BaseSkill):
    def __init__(self, client):
        super().__init__("quiz", client)
        self.base_prompt = self._load_prompt()
        # In a real app, state should be external (e.g. Redis or Session dict passed in)
        # For this prototype, we'll assume the Coordinator manages the high-level 'In Quiz' state,
        # but the specific question counter might need to be passed in Context.

    def _load_prompt(self):
        try:
            with open("prompts/quiz_system.md", "r", encoding="utf-8") as f:
                return f.read()
        except:
             return "You are a Quiz Master."

    def can_handle(self, message: str) -> bool:
        return "quiz" in message.lower()

    def handle_message(self, message: str, context: Dict[str, Any]) -> str:
        # 1. Get Quiz State
        quiz_state = context.get("quiz_state", {"current_q": 0, "score": 0, "total": 6, "topic": "General"})
        
        current_q = quiz_state["current_q"]
        
        # 2. Logic Step
        # If this is the start:
        if current_q == 0:
            quiz_state["current_q"] = 1
            context["quiz_state"] = quiz_state # Update State
            return self.client.generate_response(f"Generate Question 1 about {quiz_state['topic']}", system_instruction=self.base_prompt)
        
        # If answering a question (simple logic for now, relies on LLM to check answer + gen next)
        #Ideally, we separate "Check Answer" and "Gen Next" into two LLM calls for precision.
        
        response = self.client.generate_response(f"User Answer: {message}. If correct, increment score. Generate Question {current_q + 1} (or finish if > 6).", system_instruction=self.base_prompt)
        
        # Simple heuristic increment for the prototype
        quiz_state["current_q"] += 1
        if quiz_state["current_q"] > 6:
            # End of quiz
            context["state"] = "IDLE" # Tell coordinator to exit
            
        context["quiz_state"] = quiz_state
        return response
