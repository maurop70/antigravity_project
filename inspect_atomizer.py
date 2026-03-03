import sys
import os
import json
import logging
import requests

# Configure Logging to Stdout
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

# Add project-local skills to path
SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    print("--- Inspecting Atomizer Workflow Structure ---")
    workflows = arch.list_workflows()
    
    target_wf = None
    for wf in workflows:
        if "Atomizer" in wf.get("name", ""):
            target_wf = wf
            break
            
    if target_wf:
        wid = target_wf['id']
        print(f"Fetching details for: {wid}")
        
        # Get Full Workflow JSON
        full_wf = arch.get_workflow(wid)
        
        # Find Webhook Node
        for node in full_wf.get("nodes", []):
            if node.get("type") == "n8n-nodes-base.webhook":
                print(f"WEBHOOK NODE FOUND: {node.get('name')}")
                print(f"  Path: {node.get('parameters', {}).get('path')}")
                print(f"  Method: {node.get('parameters', {}).get('httpMethod')}")
                print(f"  Auth: {node.get('parameters', {}).get('authentication')}")
                
        print("-" * 30)

    else:
        print("Atomizer Workflow NOT FOUND.")

except Exception as e:
    print(f"Script Error: {e}")
