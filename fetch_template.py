import sys
import os
import json

SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    # ID of "HR Q&A Assistant" found earlier
    template_id = "lv7XvBZkrxokUkX8" 
    
    print(f"--- Fetching Template Workflow {template_id} ---")
    wf = arch.get_workflow(template_id)
    
    if wf:
        # Save to file for easy reading
        with open("n8n_template.json", "w") as f:
            json.dump(wf, f, indent=2)
        print("Template saved to n8n_template.json")
    else:
        # Fallback: list workflows to find another if that one is gone
        wfs = arch.list_workflows()
        if wfs:
            first_id = wfs[0]['id']
            print(f"Fetching fallback {first_id}...")
            wf = arch.get_workflow(first_id)
            with open("n8n_template.json", "w") as f:
                json.dump(wf, f, indent=2)
            print("Fallback template saved.")

except Exception as e:
    print(f"Error: {e}")
