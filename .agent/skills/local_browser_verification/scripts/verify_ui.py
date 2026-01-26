from playwright.sync_api import sync_playwright
import time

def run():
    print("Launching Local Browser Probe...")
    with sync_playwright() as p:
        # Launch browser (headless=False so user can see it too, optional)
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            print("Navigating to http://localhost:8000...")
            page.goto("http://localhost:8000")
            
            # Wait for load
            page.wait_for_load_state("networkidle")
            
            # Get Page Title
            title = page.title()
            print(f"Page Title: {title}")
            
            # Check for Avatar
            if page.locator("#alexa-avatar-img").is_visible():
                print("[PASS] Avatar Image is VISIBLE.")
            elif page.locator(".avatar-frame").is_visible():
                 print("[PASS] Avatar Frame is VISIBLE (Image might be loading or hidden).")
            else:
                print("[FAIL] Avatar Element NOT found.")

            # Take Screenshot
            print("Capturing Screenshot -> ui_debug.png")
            page.screenshot(path="ui_debug.png")
            
            # Interact: Type Hello
            print("Attempting to type 'Hello'...")
            page.fill("#user-input", "Hello (Automated Test)")
            page.click("#send-btn")
            
            # Wait for response
            print("Waiting for response...")
            # Wait for a message that contains "alexa-message" appearing after our input
            # We just wait a few seconds for simplicity
            time.sleep(3)
            
            # Capture Chat Log
            messages = page.locator(".message").all_inner_texts()
            print("\n--- CHAT LOG ---")
            for msg in messages:
                print(f"- {msg}")
            print("----------------")
            
            page.screenshot(path="ui_debug_response.png")
            print("Captured response screenshot -> ui_debug_response.png")

        except Exception as e:
            print(f"[ERROR] ERROR: {e}")
            page.screenshot(path="ui_error.png")
        
        finally:
            browser.close()
            print("Browser Closed.")

if __name__ == "__main__":
    run()
