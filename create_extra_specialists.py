import sys
import os
import json
import logging

# Configure Logging to Stdout
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

# Add project-local skills to path
SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    print("--- Deploying Extra Specialist Agents (Critic & Pitch) ---")

    def build_agent_from_blueprint(name, role, system_prompt, webhook_path):
        return {
            "name": name,
            "settings": {
                "executionOrder": "v1" 
            },
            "nodes": [
                {
                    "parameters": {
                        "httpMethod": "POST",
                        "path": webhook_path,
                        "responseMode": "responseNode"
                    },
                    "name": "Webhook_Trigger",
                    "type": "n8n-nodes-base.webhook",
                    "typeVersion": 1,
                    "position": [100, 300]
                },
                {
                    "parameters": {
                        "promptType": "define",
                        "text": "={{ $json.body.prompt }}",
                        "options": {
                            "systemMessage": system_prompt
                        }
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
                        "googlePalmApi": {
                            "id": "QWP5J4JcbFQKs34N"
                        }
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

    # 1. The Critic (Devil's Advocate)
    critic_prompt = """ROLE: You are the Devil's Advocate. Your ONLY job is to find flaws in the business plan.

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
* **Required Fix:** [What they must do to survive]"""

    critic_wf = build_agent_from_blueprint("Specialist - Critic", "Critic", critic_prompt, "critic")
    
    # 2. The Pitch Deck Director
    pitch_prompt = """ROLE: You are the Pitch Deck Director. You build the "Investor Story" and GENERATE the visuals.

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
    },
    {
      "slide_number": 2,
      "title": "The Solution",
      "script": "We unify the experience...",
      "image_prompt": "A perfectly smooth, glowing obsidian monolith rising from a chaotic digital landscape, symbolizing order and power, soft purple rim lighting."
    }
  ]
}"""

    pitch_wf = build_agent_from_blueprint("Specialist - Pitch Director", "Pitch Director", pitch_prompt, "pitch")
    
    # Deploy
    print("\nDeploying Critic...")
    try:
        critic_id = arch.create_workflow(critic_wf)
        print(f"Critic ID: {critic_id} -> https://humanresource.app.n8n.cloud/webhook/critic")
    except Exception as e: print(f"Critic Deploy Error: {e}")

    print("\nDeploying Pitch Director...")
    try:
        pitch_id = arch.create_workflow(pitch_wf)
        print(f"Pitch ID: {pitch_id} -> https://humanresource.app.n8n.cloud/webhook/pitch")
    except Exception as e: print(f"Pitch Deploy Error: {e}")

except Exception as e:
    print(f"Script Error: {e}")
