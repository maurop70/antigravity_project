import time
import winsound
import ctypes
import alpha_core
from datetime import datetime

# CONFIGURATION
CHECK_INTERVAL_SECONDS = 300  # 5 Minutes
# CHECK_INTERVAL_SECONDS = 60 # 1 Minute (Aggressive)

def play_alert_sound():
    # Play a sequence of beeps
    winsound.Beep(1000, 200) # Freq, Duration
    winsound.Beep(1500, 200)
    winsound.Beep(1000, 200)

def show_popup(title, message):
    # Windows Native Message Box
    # 0x10 = Icon Hand (Stop/Error)
    # 0x40000 = TopMost (Force to top)
    ctypes.windll.user32.MessageBoxW(0, message, title, 0x10 | 0x40000)

def watchdog_loop():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] ALPHA WATCHDOG: ACTIVE")
    print(f"Monitoring Portfolio every {CHECK_INTERVAL_SECONDS} seconds...")
    print("Minimizing to tray... (Keep this window open)")

    while True:
        try:
            # 1. Fetch Data & Check Health
            data = alpha_core.fetch_data()
            active_trade = alpha_core.load_portfolio()
            
            status, msg, level = alpha_core.check_health(
                active_trade, 
                data['spx'], 
                data['vix'], 
                data['trend']
            )

            timestamp = datetime.now().strftime('%H:%M:%S')
            
            # 2. Log Status
            if level == "CRITICAL":
                print(f"[{timestamp}] 🚨 CRITICAL ALERT DETECTED!")
                play_alert_sound()
                show_popup("ALPHA ADVISOR ALERT", f"CRITICAL MARKET EVENT:\n\n{msg}")
            
            elif level == "WARNING":
                print(f"[{timestamp}] ⚠️ WARNING: {msg}")
                # Optional: Softer beep for warnings?
                # winsound.Beep(500, 100)
            
            else:
                print(f"[{timestamp}] ✅ Stable. SPX: {data['spx']:.2f}")

        except Exception as e:
            print(f"Watchdog Error: {e}")

        # Sleep
        time.sleep(CHECK_INTERVAL_SECONDS)

if __name__ == "__main__":
    watchdog_loop()
