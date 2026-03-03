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
    
    print("--- Deploying Atomizer Agent ---")

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

    # The Atomizer Prompt
    # Strict JSON Output. No conversational filler.
    atomizer_prompt = """ROLE: You are the ATOMIZER.
TASK: Deconstruct user requests into a logical sequence of sub-tasks.

INPUT: A complex user request.
OUTPUT: A raw JSON list of strings.

CRITERIA: 
- If the request has >3 distinct deliverables (e.g., Research, Financials, Branding, Strategy), you MUST break it down.
- If the request is simple, return an empty list [].

FORMAT: 
Return ONLY a raw JSON list. NO MARKDOWN. NO CODE BLOCKS.
Example: ["Step 1: Research competitor...", "Step 2: Calculate financials..."]
"""

    atomizer_wf = build_agent_from_blueprint("System - Atomizer", "Atomizer", atomizer_prompt, "atomizer")
    
    # Deploy
    print("\nDeploying Atomizer...")
    try:
        atomizer_id = arch.create_workflow(atomizer_wf)
        print(f"Atomizer ID: {atomizer_id} -> https://humanresource.app.n8n.cloud/webhook/atomizer")
    except Exception as e: print(f"Atomizer Deploy Error: {e}")

except Exception as e:
    print(f"Script Error: {e}")
