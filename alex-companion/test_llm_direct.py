import os
print("Starting LLM Client Direct Test...")
try:
    from llm_client import alexa_client
    print("Alexa Client Imported.")
    
    print("Sending message...")
    response = alexa_client.send_message("Hello, are you there?")
    print(f"Response: {response}")

except Exception as e:
    print(f"ERROR: {e}")
