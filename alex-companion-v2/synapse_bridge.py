import requests
import json
import os
from data_manager import DataManager

# Configuration
CONFIG_PATH = "c:\\Users\\mpetr\\.gemini\\antigravity\\mcp_config.json"

def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    return {"n8n_base_url": "http://localhost:5678"}

def push_logs_to_n8n():
    print("Synapse Bridge: Awakening...")
    
    config = load_config()
    base_url = config.get("n8n_base_url", "http://localhost:5678")
    # Clean URL
    if base_url.endswith('/'): base_url = base_url[:-1]
    
    N8N_WEBHOOK_URL = f"{base_url}/webhook/alex-insight-live"
    
    # 1. Fetch Logs
    dm = DataManager()
    logs = dm.get_recent_logs(limit=50)
    
    if not logs:
        print("Synapse Bridge: No logs found. Sleeping.")
        return

    print(f"Synapse Bridge: Found {len(logs)} log entries.")

    # 2. Construct Payload
    payload = {
        "source": "Alex-Companion-v2",
        "logs": logs
    }
    
    # 3. Send to N8N
    try:
        print(f"Synapse Bridge: Pushing to {N8N_WEBHOOK_URL}...")
        
        # LIVE TRANSMISSION
        response = requests.post(N8N_WEBHOOK_URL, json=payload)
        if response.status_code == 200:
            print("Synapse Bridge: Transmission Successful.")
        else:
            print(f"Synapse Bridge: Transmission Failed ({response.status_code})")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"Synapse Bridge: Connection Error: {e}")

if __name__ == "__main__":
    push_logs_to_n8n()
