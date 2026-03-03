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
    
    print("--- Workflow Comparison Tool ---")
    workflows = arch.list_workflows()
    
    atomizer = None
    hr = None
    
    for wf in workflows:
        if "Atomizer" in wf.get("name", ""):
            atomizer = wf
        if "HR" in wf.get("name", "") and "Specialist" not in wf.get("name", ""): 
            # Try to find the "original" HR or one that works
            hr = wf
            
    if not hr:
        # Fallback to finding "Elite Council" which we know works
        for wf in workflows:
             if "Elite Council" in wf.get("name", ""):
                 hr = wf
                 print("(Using Elite Council as Reference)")
                 break

    if atomizer and hr:
        print(f"\nATOMIZER ({atomizer['id']}) vs REFERENCE ({hr['id']})")
        print(f"Atomizer Active: {atomizer['active']}")
        print(f"Reference Active: {hr['active']}")
        
        # Deep Dive
        full_atomizer = arch.get_workflow(atomizer['id'])
        full_ref = arch.get_workflow(hr['id'])
        
        def get_webhook_node(wf):
            for node in wf['nodes']:
                if node['type'] == 'n8n-nodes-base.webhook':
                    return node
            return None
            
        w_atomizer = get_webhook_node(full_atomizer)
        w_ref = get_webhook_node(full_ref)
        
        print("\n--- ATOMIZER WEBHOOK ---")
        print(json.dumps(w_atomizer, indent=2))
        
        print("\n--- REFERENCE WEBHOOK ---")
        print(json.dumps(w_ref, indent=2))
        
    else:
        print("Could not find both workflows.")

except Exception as e:
    print(f"Script Error: {e}")
