import os
import json
from typing import Dict, List, Optional
import glob

class KnowledgeBase:
    def __init__(self, data_dir="data/knowledge"):
        self.data_dir = data_dir
        self._ensure_dir()

    def _ensure_dir(self):
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def _sanitize(self, name: str) -> str:
        return "".join([c for c in name if c.isalnum() or c in (' ', '_', '-')]).strip()

    def save_document(self, category: str, topic: str, filename: str, content: str) -> str:
        """
        Saves a document under Category/Topic.
        """
        cat_safe = self._sanitize(category)
        topic_safe = self._sanitize(topic)
        
        target_dir = os.path.join(self.data_dir, cat_safe, topic_safe)
        
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

        file_path = os.path.join(target_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return file_path

    def get_context(self, category: str, topic: str) -> str:
        """
        Retrieves all content for a given Category/Topic.
        """
        cat_safe = self._sanitize(category)
        topic_safe = self._sanitize(topic)
        
        target_dir = os.path.join(self.data_dir, cat_safe, topic_safe)
        
        if not os.path.exists(target_dir):
            return ""

        context_parts = []
        files = glob.glob(os.path.join(target_dir, "*"))
        for file in files:
            try:
                # Skip subdirectories if any
                if os.path.isdir(file): continue
                
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        context_parts.append(f"--- SOURCE: {os.path.basename(file)} (Topic: {topic}) ---\n{content}\n")
            except Exception as e:
                print(f"Error reading {file}: {e}")

        return "\n".join(context_parts)

    def search_by_keyword(self, query: str) -> Optional[Dict[str, str]]:
        """
        Searches within file contents for a keyword.
        Returns the first matching {'category': cat, 'topic': topic}
        """
        hierarchy = self.get_hierarchy()
        query = query.lower()
        
        for cat, topics in hierarchy.items():
            for topic in topics:
                content = self.get_context(cat, topic).lower()
                if query in content:
                    return {"category": cat, "topic": topic}
        return None

    def get_hierarchy(self) -> Dict[str, List[str]]:
        """
        Returns a dictionary representing the knowledge tree.
        Format: { "Category": ["Topic1", "Topic2"] }
        """
        if not os.path.exists(self.data_dir):
            return {}
        
        hierarchy = {}
        
        # Get Categories (Level 1)
        categories = [d for d in os.listdir(self.data_dir) if os.path.isdir(os.path.join(self.data_dir, d))]
        
        for cat in categories:
            cat_path = os.path.join(self.data_dir, cat)
            # Get Topics (Level 2)
            topics = [d for d in os.listdir(cat_path) if os.path.isdir(os.path.join(cat_path, d))]
            hierarchy[cat] = topics
            
        return hierarchy

    # Legacy support / Flattened search if needed
    def search_topic_path(self, topic_query: str) -> Optional[Dict[str, str]]:
        """
        Searches for a topic by name across all categories.
        Returns {'category': c, 'topic': t} if found.
        """
        hierarchy = self.get_hierarchy()
        topic_query = topic_query.lower()
        
        for cat, topics in hierarchy.items():
            for topic in topics:
                if topic.lower() == topic_query or topic_query in topic.lower():
                    return {"category": cat, "topic": topic}
        return None
