import requests
import sys
import os
import json

AGENT_REGISTRY = {
    "CFO": "https://humanresource.app.n8n.cloud/webhook/cfo-v2", 
    "CMO": "https://humanresource.app.n8n.cloud/webhook/cmo-v2",
    "HR": "https://humanresource.app.n8n.cloud/webhook/hr",
    "CRITIC": "https://humanresource.app.n8n.cloud/webhook/critic-v2",
    "PITCH": "https://humanresource.app.n8n.cloud/webhook/pitch-v2",
    "ATOMIZER": "https://humanresource.app.n8n.cloud/webhook/atomizer-v2",
    "ARCHITECT": "https://humanresource.app.n8n.cloud/webhook/architect-v2"
}

print("--- AGENT HEALTH CHECK (DCC DIAGNOSTIC) ---")
print(f"Scanning {len(AGENT_REGISTRY)} Neural Nodes...\n")

active_count = 0
for role, url in AGENT_REGISTRY.items():
    print(f"Ping: {role}...", end=" ")
    try:
        # Send a harmless 'PING' prompt
        resp = requests.post(url, json={"prompt": "PING (Health Check)"}, timeout=5)
        
        if resp.status_code == 200:
            print("[OK] ONLINE (200 OK)")
            active_count += 1
        elif resp.status_code == 404:
            print("[FAIL] OFFLINE (404 Not Found)")
        else:
            print(f"[WARN] ERROR ({resp.status_code})")
            
    except Exception as e:
        print(f"[ERR] NETWORK ERROR: {e}")

print("-" * 30)
print(f"SYSTEM STATUS: {active_count}/{len(AGENT_REGISTRY)} Agents Online.")
