from .base_skill import BaseSkill
from typing import Dict, Any

class TutorSkill(BaseSkill):
    def __init__(self, client, knowledge_base):
        super().__init__("tutor", client)
        self.kb = knowledge_base
        self.base_prompt = self._load_prompt()

    def _load_prompt(self):
        try:
            with open("prompts/alex_apd.md", "r", encoding="utf-8") as f:
                return f.read()
        except:
             return "You are a helpful Tutor."

    def can_handle(self, message: str) -> bool:
        triggers = ["teach me", "what is", "explain", "how does", "help with school", "homework"]
        return any(t in message.lower() for t in triggers)

    def handle_message(self, message: str, context: Dict[str, Any]) -> str:
        # 1. Determine Subject Context
        active_subject = context.get("current_subject")

        # 2. Retrieve Parent Directives
        parent_data = context.get("parent_data", {})
        learning_strategy = parent_data.get("learning_strategy", "General academic support.")
        parent_inputs = parent_data.get("parent_inputs", [])
        
        parent_context = f"\n[USER LEARNING STRATEGY]: {learning_strategy}\n"
        if parent_inputs:
            latest_directive = parent_inputs[0].get("content", "")
            parent_context += f"[PARENT DIRECTIVE]: {latest_directive}\n"

        # 3. Retrieve KB Content
        kb_content = ""
        topic_name = "General"
        
        if active_subject and isinstance(active_subject, dict):
            category = active_subject.get("category", "")
            topic = active_subject.get("topic", "")
            topic_name = topic
            print(f"DEBUG: TutorSkill fetching context for {category}/{topic}")
            kb_content = self.kb.get_context(category, topic)
            print(f"DEBUG: KB Content Length: {len(kb_content)}")
        
        # 4. Construct Specific Prompt
        # [NEW] Inject Dynamic Vocabulary
        from data_manager import DataManager
        dm = DataManager()
        vocab_list = dm.get_vocabulary()
        
        # Build Table
        vocab_table = "| Target Word | Reinforcement Example / Bridge |\n| :--- | :--- |\n"
        for v in vocab_list:
            vocab_table += f"| **{v['word']}** | {v['bridge']} |\n"
            
        # Replace Placeholder
        final_prompt = self.base_prompt.replace("{{DYNAMIC_VOCABULARY}}", vocab_table)
        
        system_injection = final_prompt + parent_context
        
        if kb_content:
             print(f"DEBUG: Injecting KB content for topic '{topic_name}' into system prompt.")
             system_injection += (
                 f"\n\n--- OFFICIAL SCHOOL MATERIAL START (TOPIC: {topic_name}) ---\n{kb_content}\n--- OFFICIAL SCHOOL MATERIAL END ---\n\n"
                 "CRITICAL INSTRUCTION: You MUST prioritize the definitions, examples, and terminology from the OFFICIAL SCHOOL MATERIAL above.\n"
                 "If the user asks for something not fully covered here, use your general knowledge but DO NOT CONTRADICT the material above."
             )
        
        return self.client.generate_response(message, system_instruction=system_injection)
