import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

class SkillClient:
    """
    A lightweight wrapper for Skills to call the LLM using the new google-genai SDK.
    """
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not found.")
            
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = 'gemini-flash-latest' # Updated to use latest stable flash model

    def generate_response(self, message: str, system_instruction: str) -> str:
        """
        Generates a response using the localized system instruction.
        """
        try:
            # New SDK usage: client.models.generate_content
            # We pass system_instruction in the config
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=message,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction
                )
            )
            return response.text
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                return (
                    "I am taking a **quick break**! \n\n"
                    "I will be back in a minute to help you more. \n\n"
                    "**Boom!** You got this."
                )
            return f"Sorry, I am having a little trouble connecting right now. Let's try again in a moment!"

skill_client = SkillClient()
