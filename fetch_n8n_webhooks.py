import sys
import os
import json

# Add skills to path - Using absolute path to skills
SKILLS_DIR = r"C:\Users\mpetr\.gemini\antigravity\skills" 
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

# Also need to add the factory dir if N8NArchitect depends on other things there?
# Usually skills are self-contained or depend on pip packages.

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    print("--- Fetching Workflows ---")
    workflows = arch.list_workflows()
    
    specialists = ["CFO", "CMO", "HR", "Product", "Sales", "Architect", "Analyst"]
    found = {}
    
    print(f"Found {len(workflows)} workflows.")
    
    for wf in workflows:
        name = wf.get("name", "")
        # print(f"Workflow: {name} (ID: {wf.get('id')}, Active: {wf.get('active')})")
        
        # Check if this workflow IS a specialist agent
        for role in specialists:
            if role.lower() in name.lower():
                found[role] = wf
                
        # Also check nodes inside? The architect list_workflows might not return nodes.
        # We might need to get_workflow(id)
        
    print("\n--- Found Specialists (Workflows) ---")
    print(json.dumps(found, indent=2, default=str))

except Exception as e:
    print(f"Error: {e}")
