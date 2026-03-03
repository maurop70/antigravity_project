from .base_skill import BaseSkill
from typing import Dict, Any

class ChatSkill(BaseSkill):
    def __init__(self, client):
        super().__init__("chat", client)
        self.system_prompt = self._load_prompt()

    def _load_prompt(self):
        try:
            with open("prompts/alex_apd.md", "r", encoding="utf-8") as f:
                return f.read()
        except:
             return "You are Alexa, a helpful companion."

    def can_handle(self, message: str) -> bool:
        # Chat is the default fallback
        return True

    def handle_message(self, message: str, context: Dict[str, Any]) -> str:
        # Inject Parent Directives for consistency
        parent_data = context.get("parent_data", {})
        learning_strategy = parent_data.get("learning_strategy", "General academic support.")
        parent_inputs = parent_data.get("parent_inputs", [])
        
        # [NEW] Inject Dynamic Vocabulary
        from data_manager import DataManager
        dm = DataManager()
        vocab_list = dm.get_vocabulary()
        
        # Build Table
        vocab_table = "| Target Word | Reinforcement Example / Bridge |\n| :--- | :--- |\n"
        for v in vocab_list:
            vocab_table += f"| **{v['word']}** | {v['bridge']} |\n"
            
        # Replace Placeholder
        final_prompt = self.system_prompt.replace("{{DYNAMIC_VOCABULARY}}", vocab_table)
        
        parent_context = f"\n[USER LEARNING STRATEGY]: {learning_strategy}\n"
        if parent_inputs:
            latest_directive = parent_inputs[0].get("content", "")
            parent_context += f"[PARENT DIRECTIVE]: {latest_directive}\n"

        return self.client.generate_response(message, system_instruction=final_prompt + parent_context)
