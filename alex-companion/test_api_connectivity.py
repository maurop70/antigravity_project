import requests
import json

try:
    print("Testing /api/chat endpoint...")
    response = requests.post(
        "http://localhost:8000/api/chat",
        json={"message": "Hello, assume this is a test.", "context": None},
        timeout=10
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
