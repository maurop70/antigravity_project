from .base_skill import BaseSkill
from typing import Dict, Any
import json

class ParentSkill(BaseSkill):
    def __init__(self, client):
        super().__init__("parent", client)
        self.system_prompt = self._load_prompt()

    def _load_prompt(self):
        # We can inline this prompt as it's a tool, not a chat persona
        return """
        You are acting as a Special Education Planner.
        A parent has provided input for the user's learning plan.
        
        Your Goal:
        1. Evaluate if this is appropriate for a 16yo with learning disabilities.
        2. Decide HOW to integrate it.
        3. Formulate a short response explaining your plan.

        Output ONLY a JSON string like this:
        {
            "status": "accepted",  # or "modified", "rejected"
            "alexa_response": "Reasoning and plan..."
        }
        """

    def can_handle(self, message: str) -> bool:
        # Parent skill is usually called explicitly via API, not via chat routing
        return False

    def handle_message(self, message: str, context: Dict[str, Any]) -> str:
        # Not used for standard chat
        return "Parent Skill is for analysis only."

    def analyze_input(self, content: str, input_type: str) -> Dict[str, Any]:
        """
        Analyzes parent input and returns structured plan.
        """
        prompt = f"Type: {input_type}\nContent: '{content}'"
        response_text = self.client.generate_response(prompt, system_instruction=self.system_prompt)
        
        # Cleanup JSON
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:-3]
            
        try:
            return json.loads(clean_text)
        except:
            return {
                "status": "error",
                "alexa_response": f"Raw analysis: {response_text}"
            }
