import requests

URL = "https://humanresource.app.n8n.cloud/webhook/atomizer"

print(f"Testing direct hit to: {URL}")
try:
    resp = requests.post(URL, json={"prompt": "Test Atomizer"}, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
