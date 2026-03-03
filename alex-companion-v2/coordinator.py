from skills.chat_skill import ChatSkill
from skills.tutor_skill import TutorSkill
from skills.quiz_skill import QuizSkill
from skills.parent_skill import ParentSkill
from knowledge_base import KnowledgeBase
from data_manager import DataManager
from llm_client import skill_client

class Coordinator:
    def __init__(self):
        self.kb = KnowledgeBase()
        self.dm = DataManager() # [NEW]
        self.client = skill_client
        
        # Initialize Skills
        self.skills = {
            "chat": ChatSkill(self.client),
            "tutor": TutorSkill(self.client, self.kb),
            "quiz": QuizSkill(self.client),
            "parent": ParentSkill(self.client) # [NEW]
        }
        
        self.active_skill_name = "chat"
        self.user_context = {
            "state": "IDLE", 
            "current_subject": None,
            "quiz_state": None,
            "parent_data": self.dm.load_data() # [NEW] Load parent directives
        }

    def process_message(self, message: str) -> str:
        """
        Main entry point. Routes message to valid skill based on context and intent.
        """
        message_lower = message.lower()
        
        # 1. TOPIC DETECTION (Always check if user mentions a school topic)
        found_match = False
        topic_match = None
        hierarchy = self.kb.get_hierarchy()
        
        # Name Match
        for category, topics in hierarchy.items():
            for topic in topics:
                if topic.lower() in message_lower:
                    topic_match = {"category": category, "topic": topic}
                    found_match = True
                    break
            if found_match: break
            
        # Keyword Fallback
        if not found_match:
            keywords = [w for w in message_lower.split() if len(w) > 3]
            for kw in keywords:
                match = self.kb.search_by_keyword(kw)
                if match:
                    topic_match = match
                    found_match = True
                    break

        if found_match:
            print(f"Coordinator: Detected Topic Context -> {topic_match['topic']}")
            self.user_context["current_subject"] = topic_match
            if self.active_skill_name != "tutor" and self.active_skill_name != "quiz":
                self.switch_skill("tutor")

        # 2. GLOBAL INTENT / COMMAND CHECK
        if self.user_context["state"] != "QUIZ" and "quiz" in message_lower:
            self.switch_skill("quiz")
            self.user_context["state"] = "QUIZ"
            self.user_context["quiz_state"] = {"current_q": 0, "score": 0, "total": 6, "topic": "General"}
        
        elif "chat" in message_lower or "talk" in message_lower or "conversational" in message_lower or ("stop" in message_lower and self.user_context["state"] != "QUIZ"):
            if self.active_skill_name != "chat":
                self.switch_skill("chat")
            self.user_context["current_subject"] = None
            self.user_context["state"] = "IDLE"

        elif self.user_context["state"] == "QUIZ" and ("stop" in message_lower or "quit" in message_lower):
             self.switch_skill("chat")
             self.user_context["state"] = "IDLE"
             return "Quiz stopped. What would you like to do?"

        # 2. Delegate to Active Skill
        active_skill = self.skills[self.active_skill_name]
        
        # [NEW] Log User Message
        self.dm.append_chat_log("user", message)
        
        response = active_skill.handle_message(message, self.user_context)
        
        # [NEW] Log Assistant Response
        self.dm.append_chat_log("assistant", response)
        
        # 3. Post-Process State Updates
        if self.user_context.get("state") == "IDLE" and self.active_skill_name == "quiz":
            # Quiz finished naturally
            self.switch_skill("chat")
            
        return response

    def switch_skill(self, skill_name: str):
        print(f"Coordinator: Switching from {self.active_skill_name} to {skill_name}")
        self.active_skill_name = skill_name
