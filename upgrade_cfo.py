import sys
import os
import json
import logging
import uuid
import requests

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    # Strategy: Find CFO, get its ID, replace Webhook node with v2.1
    workflows = arch.list_workflows()
    cfo_id = None
    for wf in workflows:
        if "CFO" in wf.get("name", "") and "Specialist" in wf.get("name", ""):
            cfo_id = wf['id']
            break
            
    if not cfo_id:
        print("CFO Not Found")
        sys.exit(1)
        
    print(f"--- Upgrading CFO ({cfo_id}) ---")
    
    # Fetch Data
    wf = arch.get_workflow(cfo_id)
    
    # Prepare New Node
    new_uuid = str(uuid.uuid4())
    new_node = {
        "parameters": {
            "httpMethod": "POST",
            "path": "cfo", # Keeping the simple path if possible
            "responseMode": "responseNode",
            "options": { "allowedOrigins": "*" }
        },
        "name": "Webhook_Trigger",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 2.1,
        "position": [100, 300],
        "id": str(uuid.uuid4()),
        "webhookId": new_uuid
    }
    
    # Replace
    new_nodes = []
    found = False
    for node in wf['nodes']:
        if node['type'] == 'n8n-nodes-base.webhook':
            print("Replacing legacy webhook node...")
            new_nodes.append(new_node)
            found = True
        else:
            new_nodes.append(node)
            
    if not found:
        print("No Webhook Node found to replace!")
        sys.exit(1)
            
    wf['nodes'] = new_nodes
    
    # Update & Activate
    arch.update_workflow(cfo_id, wf)
    requests.post(f"{arch.base_url}/api/v1/workflows/{cfo_id}/activate", headers=arch.headers)
    
    print("Upgrade Complete.")
    print(f"Testing: {arch.base_url}/webhook/cfo")
    try:
        resp = requests.post(f"{arch.base_url}/webhook/cfo", json={"prompt": "PING"}, timeout=5)
        print(f"Status: {resp.status_code}")
    except Exception as e:
        print(f"Error: {e}")

except Exception as e:
    print(f"Script Error: {e}")
