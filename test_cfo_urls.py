import requests

# ID: 6A2o7atqNqyFWHqa
# Path: cfo

URLS = [
    "https://humanresource.app.n8n.cloud/webhook/cfo",
    "https://humanresource.app.n8n.cloud/webhook/6A2o7atqNqyFWHqa/cfo",
    "https://humanresource.app.n8n.cloud/webhook/6A2o7atqNqyFWHqa/webhook/cfo"
]

print("Testing CFO URLs...")
for url in URLS:
    print(f"Testing: {url} ...", end=" ")
    try:
        resp = requests.post(url, json={"prompt": "PING"}, timeout=5)
        print(f"{resp.status_code}")
        if resp.status_code == 200:
            print(f"✅ SUCCESS: {url}")
            break
    except Exception as e:
        print(f"Error: {e}")
