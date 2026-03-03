from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseSkill(ABC):
    """
    Abstract Base Class for all Alexa Skills (Micro-Brains).
    """
    
    def __init__(self, name: str, client: Any):
        self.name = name
        self.client = client # The LLM Client wrapper

    @abstractmethod
    def handle_message(self, message: str, context: Dict[str, Any]) -> str:
        """
        Process the user message and return a response.
        :param message: The user's input text.
        :param context: Shared state dictionary (e.g. user profile, history).
        :return: The string response to send back.
        """
        pass

    @abstractmethod
    def can_handle(self, message: str) -> bool:
        """
        Returns True if this skill strongly believes it should handle the message.
        Used by the Coordinator for dynamic routing logic if state is ambiguous.
        """
        pass
