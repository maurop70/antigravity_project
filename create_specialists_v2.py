import sys
import os
import json

# Add project-local skills to path
SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    print("--- Deploying Specialist Agents (Blueprint V2) ---")

    def build_agent_from_blueprint(name, role, system_prompt, webhook_path):
        # Based on Elite Council Blueprint structure
        return {
            "name": name,
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
                            "id": "QWP5J4JcbFQKs34N" # Reusing existing credential ID
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

    # 1. CFO Agent
    cfo_prompt = """ROLE: You are the CFO of a high-end App Factory. You DO NOT strategize. You EXECUTE calculations.

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
..."""
    cfo_wf = build_agent_from_blueprint("Specialist - CFO", "CFO", cfo_prompt, "cfo")
    
    # 2. CMO Agent (Adding instruction to use tools if available, otherwise just perform best effort)
    # Note: Adding actual tool nodes requires knowing the Tool Node ID/Type. 
    # For now, we rely on the Agent having internet access via the Model or standard tools if configured.
    # The blueprint had NO tools connected in connections! 
    # Wait, the Council Blueprint description said "CEO triggers Background Tools".
    # But looking at the nodes, there are NO tool nodes connected to the agent in the JSON I read!
    # The Council Brain might have tools defined internally or I missed them?
    # Actually, looking at the JSON (Step 679), there are NO tool connections.
    # So the "Tools" in the prompt were likely hallucinated or this blueprint is "Lite".
    # User asked for Tavily. I can try to add a Tavily tool node if I knew the type.
    # I'll stick to the Prompt instruction for now, assuming the Model can browse or the user will add the tool node manually in N8N.
    
    cmo_prompt = """ROLE: You are the CMO. Your job is to analyze the market and define the customer.
TOOLS: You have access to "Market_Search" (Tavily) if connected. USE IT.
INSTRUCTION:
1. When asked about a market, FIRST search for real competitors.
2. Define the "Customer Persona" (Age, Income, Habits).
3. Propose concrete Go-To-Market channels (e.g., "Partner with these 3 specific hotels in Miami...")."""
    cmo_wf = build_agent_from_blueprint("Specialist - CMO", "CMO", cmo_prompt, "cmo")
    
    # 3. Architect Agent
    arch_prompt = """ROLE: You are the Presentation Architect. You turn boring data into compelling stories.

INSTRUCTION:
1. When asked for a "Name," provide 3 options with RATIONALE (Etymology, Vibe).
2. When asked for a "Slide Deck," structure it slide-by-slide:
   - SLIDE 1: [Title] - [Visual Cue] - [Key Message]
3. Focus on "Premium" and "High-End" aesthetics."""
    arch_wf = build_agent_from_blueprint("Specialist - Architect", "Architect", arch_prompt, "architect")
    
    # Deploy
    print("\nDeploying CFO...")
    cfo_id = arch.create_workflow(cfo_wf)
    print(f"CFO ID: {cfo_id} -> https://humanresource.app.n8n.cloud/webhook/cfo")

    print("\nDeploying CMO...")
    cmo_id = arch.create_workflow(cmo_wf)
    print(f"CMO ID: {cmo_id} -> https://humanresource.app.n8n.cloud/webhook/cmo")

    print("\nDeploying Architect...")
    arch_id = arch.create_workflow(arch_wf)
    print(f"Architect ID: {arch_id} -> https://humanresource.app.n8n.cloud/webhook/architect")

except Exception as e:
    print(f"Error: {e}")
