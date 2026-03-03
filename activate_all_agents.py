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
    
    print("--- Activating Specialist Agents ---")
    workflows = arch.list_workflows()
    
    # Target Agents
    TARGETS = ["CFO", "CMO", "Critic", "Pitch", "Architect"]
    
    for wf in workflows:
        name = wf.get("name", "")
        wid = wf.get("id")
        active = wf.get("active", False)
        
        # Check if this workflow matches one of our targets
        is_target = any(t in name for t in TARGETS)
        
        if is_target:
            print(f"Found {name} ({wid}) | Active: {active}")
            
            if not active:
                print(f"   -> Activating...")
                url = f"{arch.base_url}/api/v1/workflows/{wid}/activate"
                resp = requests.post(url, headers=arch.headers)
                if resp.status_code == 200:
                    print("   -> SUCCESS.")
                else:
                    print(f"   -> FAILED: {resp.text}")
            else:
                print("   -> Already Active.")
                
except Exception as e:
    print(f"Script Error: {e}")
