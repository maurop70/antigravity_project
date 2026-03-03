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
    
    print("--- Checking Atomizer Status ---")
    workflows = arch.list_workflows()
    
    target_wf = None
    for wf in workflows:
        if "Atomizer" in wf.get("name", ""):
            target_wf = wf
            break
            
    if target_wf:
        wid = target_wf['id']
        active = target_wf.get('active', False)
        print(f"Found Atomizer: {wid} | Active: {active}")
        
        if not active:
            print(f"Attempting to ACTIVATE {wid}...")
            # Direct API call to ensure it activates
            url = f"{arch.base_url}/api/v1/workflows/{wid}/activate"
            resp = requests.post(url, headers=arch.headers)
            if resp.status_code == 200:
                print("Activation SUCCESS.")
            else:
                print(f"Activation FAILED: {resp.text}")
        else:
            print("Atomizer is already ACTIVE. Validating Webhook Path...")
            # We can't easy see the path without fetching the full WF
            # But we can try to re-activate just in case
            pass
            
    else:
        print("Atomizer Workflow NOT FOUND.")

except Exception as e:
    print(f"Script Error: {e}")
