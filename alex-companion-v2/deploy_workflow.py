import requests
import json
import os

# Mirrors activate_n8n.py logic for config
CONFIG_PATH = "c:\\Users\\mpetr\\.gemini\\antigravity\\mcp_config.json"

def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    print("Config file not found. Assuming default localhost:5678 without auth.")
    return {"n8n_base_url": "http://localhost:5678", "n8n_api_key": ""}

def deploy():
    config = load_config()
    base_url = config.get("n8n_base_url", "http://localhost:5678")
    api_key = config.get("n8n_api_key", "")
    
    headers = {
        "Content-Type": "application/json"
    }
    if api_key:
        headers["X-N8N-API-KEY"] = api_key

    # Load Workflow Definition
    wf_path = "workflows/alex_insight_engine.json"
    try:
        with open(wf_path, 'r') as f:
            workflow_json = json.load(f)
    except Exception as e:
        print(f"Error loading workflow file: {e}")
        return

    # Prepare for Import
    # N8N API expects { "name": "...", "nodes": [], "connections": {} }
    # Our file is already in that format.
    
    print(f"Deploying '{workflow_json['name']}' to {base_url}...")
    
    url = f"{base_url}/api/v1/workflows"
    response = requests.post(url, headers=headers, json=workflow_json)
    
    if response.status_code == 200:
        data = response.json()
        print(f"DEBUG RESPONSE: {json.dumps(data, indent=2)}")
        
        wf_id = data.get("id") # Try direct access
        if not wf_id:
             wf_id = data.get("data", {}).get("id")
             
        print(f"SUCCESS: Workflow created with ID: {wf_id}")
        
        # Activate it
        print("Activating...")
        # Try explicit POST /activate
        act_resp = requests.post(f"{base_url}/api/v1/workflows/{wf_id}/activate", headers=headers)
        
        if act_resp.status_code == 200:
             print("Workflow ACTIVATED (POST method).")
        else:
             print(f"Activation Failed (POST): {act_resp.status_code} - {act_resp.text}")
             # Fallback to PATCH if POST fails (common in different versions)
             print("Attempting PATCH activation...")
             patch_resp = requests.patch(f"{base_url}/api/v1/workflows/{wf_id}", headers=headers, json={"active": True})
             if patch_resp.status_code == 200:
                 print("Workflow ACTIVATED (PATCH method).")
             else:
                 print(f"Activation Failed (PATCH): {patch_resp.status_code} - {patch_resp.text}")

        # READ BACK
        print("Reading back workflow details...")
        get_resp = requests.get(f"{base_url}/api/v1/workflows/{wf_id}", headers=headers)
        if get_resp.status_code == 200:
             final_wf = get_resp.json()
             print(f"READ BACK STATUS: Active={final_wf.get('active')}")
             nodes = final_wf.get("nodes", [])
             for node in nodes:
                  if node.get("type", "").endswith("webhook"):
                       print(f"WEBHOOK NODE DUMP: {json.dumps(node, indent=2)}")
        else:
             print("Failed to read back workflow.")
        
    else:
        print(f"Deployment Failed: {response.text}")

if __name__ == "__main__":
    deploy()
