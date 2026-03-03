import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found.")
    exit(1)

client = genai.Client(api_key=api_key)

print("Listing available models...")
try:
    # The new SDK might use a different method, but let's try the standard one or the one hinted in the error
    # The error message mentioned: "Call ListModels to see the list of available models"
    # In the new SDK (google-genai), checking documentation style usage:
    for model in client.models.list():
        print(f"Model: {model.name}")
        # print(f"  DisplayName: {model.display_name}")
        print("-" * 20)

except Exception as e:
    print(f"Error listing models: {e}")
