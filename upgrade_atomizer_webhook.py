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
    
    # ID of the Atomizer workflow found previously
    ATOMIZER_ID = "vjnwlzPjAl5La37Y"
    
    print(f"--- Upgrading Atomizer Webhook ({ATOMIZER_ID}) ---")
    
    # generate a new UUID for the webhookId
    new_uuid = str(uuid.uuid4())
    
    # New Node Structure (based on Reference)
    new_node = {
      "parameters": {
        "httpMethod": "POST",
        "path": "atomizer",
        "responseMode": "responseNode",
        "options": {
            "allowedOrigins": "*"
        }
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1, # UPGRADE
      "position": [100, 300],
      "id": str(uuid.uuid4()), # Node ID (internal)
      "name": "Webhook_Trigger",
      "webhookId": new_uuid # Critical for v2
    }
    
    # Fetch Data
    wf = arch.get_workflow(ATOMIZER_ID)
    
    # Replace Node
    new_nodes = []
    for node in wf['nodes']:
        if node['type'] == 'n8n-nodes-base.webhook':
            print("Replacing legacy webhook node...")
            new_nodes.append(new_node)
        else:
            new_nodes.append(node)
            
    wf['nodes'] = new_nodes
    
    # Update
    print("Sending Update...")
    updated_wf = arch.update_workflow(ATOMIZER_ID, wf)
    print("Update Complete.")
    
    # Re-Activate (Updating usually deactivates)
    print("Re-Activating...")
    url = f"{arch.base_url}/api/v1/workflows/{ATOMIZER_ID}/activate"
    requests.post(url, headers=arch.headers)
    
    print(f"DONE. Tried to set webhookId: {new_uuid}")
    print(f"Test URL: {arch.base_url}/webhook/atomizer")
    print(f"Test URL (ID): {arch.base_url}/webhook/{new_uuid}")

except Exception as e:
    print(f"Script Error: {e}")
