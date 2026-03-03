from playwright.sync_api import sync_playwright
import time

def run():
    print("Launching Local Browser Probe for Alexa v2...")
    with sync_playwright() as p:
        # Launch browser (headless=True for agent execution)
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            print("Navigating to http://localhost:8002...")
            page.goto("http://localhost:8002")
            
            # Wait for load
            page.wait_for_load_state("networkidle")
            
            # Get Page Title
            title = page.title()
            print(f"Page Title: {title}")
            
            # Check for Chat Container
            if page.locator("#chat-container").is_visible():
                print("[PASS] Chat Container is VISIBLE.")
            else:
                print("[FAIL] Chat Container NOT found.")

            # Check for specific initial message
            initial_msg = page.locator(".alexa-message").first
            if initial_msg.is_visible():
                print(f"[PASS] Initial Message Found: '{initial_msg.inner_text()}'")
            else:
                print("[FAIL] Initial Message NOT found.")

            # Take Screenshot
            print("Capturing Screenshot -> ui_debug_v2.png")
            page.screenshot(path="ui_debug_v2.png")
            
            # Interact: Type Hello
            print("Attempting to type 'Hello'...")
            page.fill("#user-input", "Hello (Automated Test)")
            page.click("#send-btn")
            
            # Wait for response
            print("Waiting for response...")
            time.sleep(3)
            
            # Capture Chat Log
            messages = page.locator(".message").all_inner_texts()
            print("\n--- CHAT LOG ---")
            for msg in messages:
                print(f"- {msg}")
            print("----------------")
            
            page.screenshot(path="ui_debug_response_v2.png")
            print("Captured response screenshot -> ui_debug_response_v2.png")

        except Exception as e:
            print(f"[ERROR] ERROR: {e}")
            page.screenshot(path="ui_error_v2.png")
        
        finally:
            browser.close()
            print("Browser Closed.")

if __name__ == "__main__":
    run()
