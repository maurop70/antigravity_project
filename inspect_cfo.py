import sys
import os
import json
import logging
import requests

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    print("--- Inspecting CFO Workflow ---")
    workflows = arch.list_workflows()
    
    target_wf = None
    for wf in workflows:
        if "CFO" in wf.get("name", "") and "Specialist" in wf.get("name", ""):
            target_wf = wf
            break
            
    if target_wf:
        wid = target_wf['id']
        print(f"Found CFO: {wid}")
        full = arch.get_workflow(wid)
        
        for node in full.get("nodes", []):
            if node.get("type") == "n8n-nodes-base.webhook":
                print(f"WEBHOOK NODE: {node.get('name')}")
                print(f"  Path: {node.get('parameters', {}).get('path')}")
                print(f"  Method: {node.get('parameters', {}).get('httpMethod')}")
                print(f"  ID Pattern: {arch.base_url}/webhook/{wid}/{node.get('parameters', {}).get('path')}")
                
    else:
        print("CFO Not Found")

except Exception as e:
    print(f"Script Error: {e}")
