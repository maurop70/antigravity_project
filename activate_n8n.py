import requests
import json

CONFIG_PATH = "c:\\Users\\mpetr\\.gemini\\antigravity\\mcp_config.json"

def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def activate_workflows():
    config = load_config()
    api_key = config['n8n_api_key']
    base_url = config['n8n_base_url']
    headers = {
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    # List workflows
    url = f"{base_url}/api/v1/workflows"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Error fetching workflows: {response.text}")
        return

    workflows = response.json().get('data', [])
    target_names = ["Formulation Engine", "Ingredient Library", "Ice Cream R&D"]
    
    for wf in workflows:
        if wf['name'] in target_names:
            print(f"Found {wf['name']} (ID: {wf['id']}). Activating...")
            # Activate using POST /activate
            activate_url = f"{base_url}/api/v1/workflows/{wf['id']}/activate"
            # No body needed for POST /activate usually, or just empty
            post_response = requests.post(activate_url, headers=headers)
            
            if post_response.status_code == 200:
                print(f"Successfully activated {wf['name']}")
            else:
                print(f"Failed to activate {wf['name']}: {post_response.text}")

if __name__ == "__main__":
    activate_workflows()
