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
    
    print("--- Deploying Atomizer V2 (Workflow 2.1) ---")
    
    new_uuid = str(uuid.uuid4())
    path_slug = "atomizer-v2"
    
    # 1. Define Protocol compatible with v2
    wf_v2 = {
        "name": "System - Atomizer V2",
        "settings": { "executionOrder": "v1" },
        "nodes": [
            {
                "parameters": {
                    "httpMethod": "POST",
                    "path": path_slug,
                    "responseMode": "responseNode",
                    "options": {
                        "allowedOrigins": "*"
                    }
                },
                "name": "Webhook_Trigger",
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 2.1, # Modern Version
                "position": [100, 300],
                "webhookId": new_uuid
            },
            {
                "parameters": {
                    "promptType": "define",
                    "text": "={{ $json.body.prompt }}",
                    "options": {
                        "systemMessage": "ROLE: You are the ATOMIZER.\nTASK: Deconstruct user requests into a logical sequence of sub-tasks.\n\nINPUT: A complex user request.\nOUTPUT: A raw JSON list of strings.\n\nCRITERIA: \n- If the request has >3 distinct deliverables (e.g., Research, Financials, Branding, Strategy), you MUST break it down.\n- If the request is simple, return an empty list [].\n\nFORMAT: \nReturn ONLY a raw JSON list. NO MARKDOWN. NO CODE BLOCKS.\nExample: [\"Step 1: Research competitor...\", \"Step 2: Calculate financials...\"]"
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

    # Deploy
    wf_id = arch.create_workflow(wf_v2)
    
    if wf_id:
        print(f"Workflow ID: {wf_id}")
        
        # Construct URLs
        url_path = f"{arch.base_url}/webhook/{path_slug}"
        url_id = f"{arch.base_url}/webhook/{new_uuid}"
        
        print(f"Testing URL (Path): {url_path}")
        print(f"Testing URL (UUID): {url_id}")
        
        # Test Path
        try:
            resp = requests.post(url_path, json={"prompt": "Test Atomizer V2 Path"}, timeout=5)
            print(f"PATH TEST: {resp.status_code}")
        except Exception as e: print(f"Path Error: {e}")

        # Test UUID
        try:
            resp = requests.post(url_id, json={"prompt": "Test Atomizer V2 UUID"}, timeout=5)
            print(f"UUID TEST: {resp.status_code}")
            if resp.status_code == 200:
                 print("UUID URL is VALID.")
                 print(f"Response: {resp.text}")
        except Exception as e: print(f"UUID Error: {e}")
        
except Exception as e:
    print(f"Script Error: {e}")
