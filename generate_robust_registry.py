import sys
import os
import json
import logging
import requests

# Configure Logging to Stdout
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    print("--- Generating Robust Agent Registry ---")
    workflows = arch.list_workflows()
    
    # Mapping of Role -> Search Term
    TARGETS = {
        "CFO": "Specialist - CFO",
        "CMO": "Specialist - CMO",
        "CRITIC": "Specialist - Critic",
        "PITCH": "Specialist - Pitch",
        "ATOMIZER": "System - Atomizer V2",
        "ARCHITECT": "Specialist - Architect"
    }
    
    new_registry = {}
    
    for role, search_term in TARGETS.items():
        found = False
        for wf in workflows:
            if search_term in wf.get("name", ""):
                wid = wf.get("id")
                # Construct ID-based URL (most robust)
                # Structure: https://[instance]/webhook/[workflow_id]/[path_slug]
                # We need to know the 'path' parameter from the webhook node
                
                # Fetch full workflow to get path
                full = arch.get_workflow(wid)
                path = "webhook" # Default
                for node in full.get("nodes", []):
                    if node.get("type") == "n8n-nodes-base.webhook":
                        path = node.get("parameters", {}).get("path", "webhook")
                        break
                
                # N8N v1 vs v2 URL structure can vary
                # Try: /webhook/WF_ID/PATH
                url = f"https://humanresource.app.n8n.cloud/webhook/{wid}/{path}"
                
                print(f"[OK] {role}: {wid} -> {url}")
                new_registry[role] = url
                found = True
                break
        
        if not found:
            print(f"[FAIL] {role}: Not Found")
            
    print("\n--- SUGGESTED BRIDGE UPDATE ---")
    print(json.dumps(new_registry, indent=4))

except Exception as e:
    print(f"Script Error: {e}")
