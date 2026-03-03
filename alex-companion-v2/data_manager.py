import json
import os
import uuid
from typing import Dict, List, Any
from datetime import datetime

class DataManager:
    def __init__(self, data_file="data/user_data.json"):
        self.data_file = data_file
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.data_file):
            # Create default structure
            self.save_data({
                "parent_inputs": [],
                "progress_log": [],
                "learning_strategy": "Visual, Repetitive, Metaphor-based"
            })

    def load_data(self) -> Dict[str, Any]:
        try:
            with open(self.data_file, 'r') as f:
                return json.load(f)
        except:
             return {"parent_inputs": []}

    def save_data(self, data: Dict[str, Any]):
        # Ensure dir exists
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)

    def add_parent_input(self, content: str, input_type: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
        data = self.load_data()
        
        entry = {
            "id": str(uuid.uuid4()),
            "content": content,
            "type": input_type,
            "status": analysis.get("status", "accepted"),
            "alexa_response": analysis.get("alexa_response", ""),
            "timestamp": datetime.now().isoformat()
        }
        
        # Add to top
        if "parent_inputs" not in data:
            data["parent_inputs"] = []
            
        data["parent_inputs"].insert(0, entry)
        self.save_data(data)
        return entry

    def get_vocabulary(self) -> List[Dict[str, str]]:
        """
        Returns merged list of Core Vocabulary + Parent Vocabulary.
        """
        # 1. Core Vocabulary (Hardcoded Base)
        vocab = [
            {"word": "Evolution", "bridge": "Your guitar skills are having an **evolution**! You are getting better every day."},
            {"word": "Vestigial", "bridge": "That old rusty bolt on the Antenna Tower is **vestigial**—it's still there but doesn't do anything."},
            {"word": "Homologous", "bridge": "The exit sign at the YMCA and at school are **homologous**; they look the same because they are related."},
            {"word": "Unrelated", "bridge": "A tennis racket and a fire alarm are **unrelated**; they don't have anything in common."},
            {"word": "Diverge", "bridge": "At the end of the hallway, the path will **diverge**. One way goes to the gym, the other to the exit."},
            {"word": "Parabola", "bridge": "When you toss a tennis ball in the air, it moves in a **parabola** shape."},
            {"word": "Quadratic", "bridge": "Finding the perfect spot for an antenna is like a **quadratic** equation—you have to find the exact right point."}
        ]
        
        # 2. Parent Inputs (Filtered by type='vocabulary')
        data = self.load_data()
        for entry in data.get("parent_inputs", []):
            # We accept type='vocabulary' or if the content looks like "Word: Definition"
            if entry.get("type", "").lower() == "vocabulary" and ":" in entry["content"]:
                parts = entry["content"].split(":", 1)
                if len(parts) == 2:
                    vocab.append({
                        "word": parts[0].strip(), 
                        "bridge": parts[1].strip()
                    })
        
        return vocab

    def append_chat_log(self, role: str, content: str):
        data = self.load_data()
        if "chat_logs" not in data:
            data["chat_logs"] = []
            
        entry = {
            "timestamp": datetime.now().isoformat(),
            "role": role,
            "content": content
        }
        data["chat_logs"].append(entry)
        
        # Keep last 1000 messages to prevent bloat
        if len(data["chat_logs"]) > 1000:
            data["chat_logs"] = data["chat_logs"][-1000:]
            
        self.save_data(data)

    def get_recent_logs(self, limit=50) -> List[Dict[str, str]]:
        data = self.load_data()
        logs = data.get("chat_logs", [])
        return logs[-limit:]
