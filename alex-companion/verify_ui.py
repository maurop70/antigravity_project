from playwright.sync_api import sync_playwright
import time

def run():
    print("Launching Local Browser Probe...")
    with sync_playwright() as p:
        # Launch browser (headless=False so user can see it too, optional)
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Capture Console Logs
        page.on("console", lambda msg: print(f"BROWSER_LOG: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"BROWSER_ERROR: {exc}"))

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
            
            # Interact: Request Image
            print("Attempting to ask for an image...")
            page.fill("#user-input", "Show me the map of France")
            page.click("#send-btn")
            
            # Wait for response (longer for image gen)
            print("Waiting for response and image...")
            # Wait for img tag to appear in the chat
            try:
                page.wait_for_selector(".message img", timeout=10000)
                print("[PASS] Image element detected in chat!")
            except:
                print("[FAIL] No image appeared within timeout.")

            
            # Capture Chat Log
            messages = page.locator(".message").all_inner_texts()
            print("\n--- CHAT LOG ---")
            for msg in messages:
                print(f"- {msg}")
            print("----------------")
            
            page.screenshot(path="ui_animal_cell.png")
            print("Captured response screenshot -> ui_animal_cell.png")

        except Exception as e:
            print(f"[ERROR] ERROR: {e}")
            page.screenshot(path="ui_error.png")
        
        finally:
            browser.close()
            print("Browser Closed.")

if __name__ == "__main__":
    run()
