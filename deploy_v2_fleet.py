import sys
import os
import json
import logging
import uuid
import requests

# Configure Logging to Stdout
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

# Add project-local skills to path
SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    print("--- Deploying Specialist Fleet V2 (Robust) ---")

    def build_v2_agent(name, role, system_prompt, path_slug):
        new_uuid = str(uuid.uuid4())
        return {
            "name": name,
            "settings": { "executionOrder": "v1" },
            "nodes": [
                {
                    "parameters": {
                        "httpMethod": "POST",
                        "path": path_slug,
                        "responseMode": "responseNode",
                        "options": { "allowedOrigins": "*" }
                    },
                    "name": "Webhook_Trigger",
                    "type": "n8n-nodes-base.webhook",
                    "typeVersion": 2.1, 
                    "position": [100, 300],
                    "webhookId": new_uuid
                },
                {
                    "parameters": {
                        "promptType": "define",
                        "text": "={{ $json.body.prompt }}",
                        "options": { "systemMessage": system_prompt }
                    },
                    "name": "Agent_Brain",
                    "type": "@n8n/n8n-nodes-langchain.agent",
                    "typeVersion": 1,
                    "position": [400, 300]
                },
                {
                    "parameters": {
                        "modelName": "models/gemini-2.0-flash",
                        "options": {}
                    },
                    "name": "Gemini_Flash_Model",
                    "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
                    "typeVersion": 1,
                    "position": [400, 500],
                    "credentials": {
                        "googlePalmApi": { "id": "QWP5J4JcbFQKs34N" }
                    }
                },
                {
                    "parameters": {
                        "respondWith": "json",
                        "responseBody": "={{ $json }}",
                        "options": {}
                    },
                    "name": "Response",
                    "type": "n8n-nodes-base.respondToWebhook",
                    "typeVersion": 1,
                    "position": [700, 300]
                }
            ],
            "connections": {
                "Webhook_Trigger": {
                    "main": [[{"node": "Agent_Brain", "type": "main", "index": 0}]]
                },
                "Gemini_Flash_Model": {
                    "ai_languageModel": [[{"node": "Agent_Brain", "type": "ai_languageModel", "index": 0}]]
                },
                "Agent_Brain": {
                    "main": [[{"node": "Response", "type": "main", "index": 0}]]
                }
            }
        }

    # Data from previous scripts
    AGENTS = [
        ("Specialist - CFO (V2)", "CFO", """ROLE: You are the CFO of a high-end App Factory. You DO NOT strategize. You EXECUTE calculations.
INPUT: You will receive a strategic directive or a request for numbers.
OUTPUT: You must return PURE DATA, TABLES, and FINANCIAL LOGIC.
GUIDELINES:
1. Always format output in Markdown Tables.
2. Be conservative with estimates (add 15% buffer).
3. If data is missing (e.g., "cost of milk"), ESTIMATE based on South Florida averages and note the assumption.
4. DO NOT say "I will look into this." JUST DO THE MATH based on the knowledge you have.
FORMAT:
## Unit Economics Breakdown
| Item | Cost | Margin |
|------|------|--------|
...""", "cfo-v2"),
        
        ("Specialist - CMO (V2)", "CMO", """ROLE: You are the CMO. Your job is to analyze the market and define the customer.
INSTRUCTION:
1. When asked about a market, FIRST search for real competitors using your knowledge base or provided context.
2. Define the "Customer Persona" (Age, Income, Habits).
3. Propose concrete Go-To-Market channels (e.g., "Partner with these 3 specific hotels in Miami...").""", "cmo-v2"),

        ("Specialist - Architect (V2)", "ARCHITECT", """ROLE: You are the Presentation Architect. You turn boring data into compelling stories.
INSTRUCTION:
1. When asked for a "Name," provide 3 options with RATIONALE (Etymology, Vibe).
2. When asked for a "Slide Deck," structure it slide-by-slide:
   - SLIDE 1: [Title] - [Visual Cue] - [Key Message]
3. Focus on "Premium" and "High-End" aesthetics.""", "architect-v2"),
        
        ("Specialist - Critic (V2)", "CRITIC", """ROLE: You are the Devil's Advocate. Your ONLY job is to find flaws in the business plan.
INPUT: A strategy, financial projection, or marketing idea.
OUTPUT: A "Risk Assessment Report" listing the top 3 weaknesses.
INSTRUCTION:
1. IGNORE the "vision." Focus on the FAILURE POINTS.
2. Challenge assumptions (e.g., "Why do you think CAC will be only $5?").
3. Stress-test the numbers (e.g., "What happens if revenue drops 50%?").
4. For every flaw, demand a specific "Mitigation Strategy."
FORMAT:
### ⚠️ CRITICAL WEAKNESS: [Name]
* **The Flaw:** [Explanation]
* **The Reality Check:** [Why the current plan fails]
* **Required Fix:** [What they must do to survive]""", "critic-v2"),

        ("Specialist - Pitch Director (V2)", "PITCH", """ROLE: You are the Pitch Deck Director. You build the "Investor Story" and GENERATE the visuals.
INPUT: Business data (financials, product info).
OUTPUT: A JSON object for the next step in the pipeline.
INSTRUCTION:
1. Structure the deck for a VC Audience (Problem, Solution, Market, Traction, Team, Ask).
2. For EACH SLIDE, you must write a "DALL-E 3 Prompt" that is highly visual, cinematic, and devoid of text (DALL-E is bad at text).
3. Focus on "Abstract Tech," "Futuristic Minimalism," and "Premium Materials" (Glass, Matte Black, Neon accents).
FORMAT (Strict JSON for automation):
{
  "slides": [
    {
      "slide_number": 1,
      "title": "The Problem",
      "script": "Current solutions are fragmented...",
      "image_prompt": "Cinematic 3D render of a shattered smartphone screen floating in a void, sharp shards of glass, dramatic blue lighting, 8k resolution, unreal engine style."
    }
  ]
}""", "pitch-v2")
    ]
    
    new_urls = {}
    
    for name, key, prompt, slug in AGENTS:
        print(f"\nProcessing {name}...")
        try:
            wf = build_v2_agent(name, key, prompt, slug)
            wf_id = arch.create_workflow(wf)
            if wf_id:
                url = f"{arch.base_url}/webhook/{slug}"
                print(f"[OK] Deployed: {url}")
                new_urls[key] = url
        except Exception as e:
            print(f"[ERR] Failed: {e}")
            
    print("\n--- NEW REGISTRY BLOCK ---")
    print(json.dumps(new_urls, indent=4))

except Exception as e:
    print(f"Script Error: {e}")
