import sys
import os
import json

# Add project-local skills to path
SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    print("--- Fetching Workflows ---")
    workflows = arch.list_workflows()
    print(f"Found {len(workflows)} workflows.")
    
    specialists = {
        "CFO": ["cfo", "finance"],
        "CMO": ["cmo", "marketing"],
        "HR": ["hr", "human resource"],
        "PRODUCT": ["product", "mvp"],
        "SALES": ["sales", "b2b"],
        "PRESENTATION_ARCHITECT": ["architect", "presentation", "creative"],
        "ANALYST": ["analyst", "memory"]
    }
    
    registry = {}
    
    for wf in workflows:
        name = wf.get("name", "")
        wf_id = wf.get("id")
        active = wf.get("active")
        
        # Check if this workflow matches a role
        matched_role = None
        for role, keywords in specialists.items():
            if any(k in name.lower() for k in keywords):
                matched_role = role
                break
        
        if matched_role:
            print(f"Inspecting candidate for {matched_role}: {name} ({wf_id})")
            # Get full details to find webhook path
            details = arch.get_workflow(wf_id)
            if details:
                nodes = details.get("nodes", [])
                webhook_node = next((n for n in nodes if "webhook" in n.get("type", "").lower()), None)
                
                if webhook_node:
                    path = webhook_node.get("parameters", {}).get("path")
                    if path:
                        # Construct URL
                        # Production URL format: https://[instance]/webhook/[path]  OR https://[instance]/webhook/[id]/[path]
                        # N8N v1 often uses /webhook/[id]/[path] to avoid collisions? 
                        # Or just /webhook/[path] if unique.
                        # Let's assume unique path first, but usually safer to include ID if we can?
                        # Actually the standard is just /webhook/[path] for production.
                        
                        url = f"https://humanresource.app.n8n.cloud/webhook/{path}"
                        print(f"  -> Found Webhook: {url}")
                        
                        # Use the most specific one if multiple?
                        registry[matched_role] = url
                    else:
                        print("  -> No path in webhook node.")
                else:
                    print("  -> No webhook node found.")
            else:
                print("  -> Could not get details.")

    print("\n\n--- SUGGESTED AGENT_REGISTRY ---")
    print(json.dumps(registry, indent=4))

except Exception as e:
    print(f"Error: {e}")
