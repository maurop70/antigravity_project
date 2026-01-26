import os
import google.generativeai as genai
from typing import List, Dict, Any, Union
from dotenv import load_dotenv

load_dotenv()

# Check for API Key
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=API_KEY)

class AlexaClient:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        self.chat = None
        self.system_instruction = self._load_system_instruction()
        self._init_chat()

    def reset(self):
        """Forces a hard reset of the chat history."""
        self._init_chat()

    def _load_system_instruction(self) -> str:
        try:
            with open("system_instruction.md", "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return "You are Alexa, a helpful AI assistant."

    def _init_chat(self):
        """Initializes the chat with the system instruction."""
        # Gemini Pro doesn't support 'system' role in history directly in the same way as some others,
        # but we can prime it with the first message or use the system_instruction parameter if using a newer lib version.
        # For broad compatibility, we will append the system instruction to the first prompt or maintain it conceptually.
        # BETTER APPROACH: Gemini 1.5 Pro supports system instructions.
        # For standard Gemini Pro/1.0, we prepend it.
        # We'll try to use the system_instruction argument if available (newer SDK compliant).
        
        try:
             self.model = genai.GenerativeModel('gemini-2.0-flash', system_instruction=self.system_instruction)
             self.chat = self.model.start_chat(history=[])
        except Exception:
            # Fallback for older SDKs or models without explicit system_instruction param
            self.chat = self.model.start_chat(history=[])
            # We will manually inject it into the context if needed, but let's assume valid SDK.

            return f"Error communicating with Alexa: {str(e)}"

    def analyze_parent_input(self, input_text: str, input_type: str) -> dict:
        """
        Analyzes parent input to decide how to integrate it.
        Returns a dict with 'status' (accepted/modified/rejected) and 'alexa_response' (justification).
        """
        analysis_prompt = f"""
        You are acting as a Special Education Planner.
        A parent has provided the following input for the user's learning plan:
        Type: {input_type}
        Content: "{input_text}"

        Your Goal:
        1. Evaluate if this is appropriate for the user involves (16yo, learning disabilities, loves antennas/exit signs).
        2. Decide HOW to integrate it.
        3. Formulate a short response to the parent explaining your plan.

        Output ONLY a JSON string like this:
        {{
            "status": "accepted",  # or "modified", "rejected"
            "alexa_response": "Reasoning and plan..."
        }}
        """
        try:
            # We use a separate model call or a fresh chat for this analysis to not pollute the main chat history
            # But here we can just use the generative model directly.
            response = self.model.generate_content(analysis_prompt)
            # Simple cleanup to ensure we get JSON
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3]
            
            import json
            return json.loads(text)
        except Exception as e:
            return {
                "status": "error",
                "alexa_response": f"I couldn't fully analyze this, but I've saved it. Error: {str(e)}"
            }

    def send_message(self, message: str, file_content: str = None, user_data: dict = None) -> str:
        """Sends a message to the agent and returns the response."""
        
        # Construct the prompt with any active Learning Goals and Strategy
        system_injection = ""
        
        if user_data:
            # 1. Learning Strategy (Adaptive Memory)
            strategy = user_data.get("learning_strategy", "")
            if strategy:
                system_injection += f"\n[ADAPTIVE MEMORY - CURRENT STRATEGY]:\n{strategy}\n"

            # 2. Parent Inputs
            parent_inputs = user_data.get("parent_inputs", [])
            active_goals = [f"- {p['content']} (Plan: {p['alexa_response']})" for p in parent_inputs if p.get('status') in ['accepted', 'modified']]
            if active_goals:
                system_injection += "\n[CURRENT PARENT DIRECTIVES (Integration Mode)]:\n" + "\n".join(active_goals) + "\n(NOTE: Integrate these naturally. DO NOT violate the Negative Constraints.)\n"

        # Final Constraint Reinforcement
        system_injection += "\n[CRITICAL CONSTRAINT]: Do NOT ask for full sentences immediately after asking a question. Wait for the user to answer first. Only correct AFTER a fragment response.\n"

        # VISUAL INJECTION CHECK
        visual_triggers = ["show me", "see", "look like", "picture", "image", "photo", "diagram", "map of"]
        if any(trigger in message.lower() for trigger in visual_triggers):
             system_injection += "\n[VISUAL REQUEST DETECTED]: The user explicitly asked to SEE something. You MUST include a [SEARCH: query] or [IMAGE: prompt] tag in your response. Do not refuse. Show first, then explain.\n"

        prompt = system_injection + "\n\nUser Message: " + message
        if file_content:
            prompt = f"{system_injection}\nUser uploaded a file content:\n---\n{file_content}\n---\n\nUser Message: {message}"

        # If chat is not initialized (or reset), init it
        if not self.chat:
            self._init_chat()

        try:
            response_text = self.chat.send_message(prompt).text
            
            # ---------------------------------------------------------
            # GUARDRAIL: Force Visual Tag if LLM forgot
            # ---------------------------------------------------------
            message_lower = message.lower()
            
            creative_triggers = ["paint", "draw", "generate", "imagine", "create an image", "make an image"]
            visual_triggers = ["show me", "see", "look like", "picture", "image", "photo", "diagram", "map of"]
            
            is_creative = any(t in message_lower for t in creative_triggers)
            is_visual = any(t in message_lower for t in visual_triggers)
            
            # STRICT CHECK
            has_tag = "[SEARCH:" in response_text or "[IMAGE:" in response_text
            
            if (is_creative or is_visual) and not has_tag:
                # Heuristic: Clean the query
                clean_query = message_lower
                for trash in ["can you", "could you", "show me", "give me", "please", "image of", "picture of", "map of", "diagram of", "the", "a", "an", "generate", "create", "paint", "draw"]:
                    clean_query = clean_query.replace(trash, "")
                
                clean_query = clean_query.strip()
                if len(clean_query) < 2: clean_query = message # Fallback
                
                # Decision: Creative vs Search
                if is_creative:
                    response_text += f"\n[IMAGE: {clean_query}]"
                    print(f"GUARDRAIL: Appended [IMAGE: {clean_query}] (Creative Mode)")
                else:
                    response_text += f"\n[SEARCH: {clean_query}]"
                    print(f"GUARDRAIL: Appended [SEARCH: {clean_query}] (Search Mode)")

            return response_text

        except Exception as e:
            return f"Error communicating with Alexa: {str(e)}"

    def upload_image(self, image_data):
        # Placeholder for image handling if we use gemini-pro-vision
        pass

alexa_client = AlexaClient()
