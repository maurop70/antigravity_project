from playwright.sync_api import sync_playwright
import time
import os

def test_all_features():
    print("Launching Comprehensive Feature Test for Alexa v2...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # 1. Loading
            print("Navigating to http://localhost:8002...")
            page.goto("http://localhost:8002")
            page.wait_for_load_state("networkidle")
            
            # 2. Initial Chat Verification
            print("Testing Initial Chat...")
            page.fill("#user-input", "Hi Alexa, how's it going?")
            page.click("#send-btn")
            time.sleep(3)
            page.screenshot(path="verify_initial_chat.png")
            
            # 3. Tutor Mode Trigger (Topic: Evolution)
            print("Testing Automatic Tutor Mode Entry...")
            page.fill("#user-input", "I want to learn about evolution")
            page.click("#send-btn")
            time.sleep(5)
            page.screenshot(path="verify_tutor_mode_entry.png")
            
            # 4. View Classroom
            print("Switching to Classroom View...")
            page.click("button:has-text('Classroom')")
            time.sleep(2)
            page.screenshot(path="verify_classroom_view.png")
            
            # 5. Test Voice Button
            print("Testing Voice Mode Button...")
            voice_btn = page.locator("button:has-text('Voice')")
            if voice_btn.is_visible():
                print("[PASS] Voice Mode button is visible.")
                voice_btn.click()
                time.sleep(1)
                page.screenshot(path="verify_voice_mode_click.png")
            else:
                print("[FAIL] Voice Mode button NOT found.")

            # 6. Check for KB specifics in response
            chat_log = page.locator(".message").all_inner_texts()
            print("\n--- Feature Test Chat Log ---")
            for msg in chat_log:
                print(f"- {msg}")
            print("----------------------------\n")

        except Exception as e:
            print(f"[ERROR] Testing failed: {e}")
            page.screenshot(path="verify_error.png")
        
        finally:
            browser.close()
            print("Verification Complete.")

if __name__ == "__main__":
    test_all_features()
