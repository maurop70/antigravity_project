import requests

# ID from previous step: vjnwlzPjAl5La37Y
# Path: atomizer

URLS_TO_TEST = [
    "https://humanresource.app.n8n.cloud/webhook/vjnwlzPjAl5La37Y/webhook/atomizer",
    "https://humanresource.app.n8n.cloud/webhook/vjnwlzPjAl5La37Y/atomizer",
    "https://humanresource.app.n8n.cloud/webhook-test/vjnwlzPjAl5La37Y/webhook/atomizer"
]

print("Testing ID-based URLs...")

for url in URLS_TO_TEST:
    print(f"\nTrying: {url}")
    try:
        resp = requests.post(url, json={"prompt": "Test Atomizer"}, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("SUCCESS!")
            try: print(resp.json())
            except: print(resp.text)
            break
    except Exception as e:
        print(f"Error: {e}")
