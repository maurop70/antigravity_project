# Alpha Advisor Suite 🦅

**Version:** 1.0.0 PRODUCTION
**Status:** ACTIVE | Live Intelligence & Monitoring

## Overview
Alpha Advisor is a comprehensive SPX Iron Condor intelligence suite. It combines a powerful Python backend (for Black-Scholes math and data fetching) with multiple user interfaces to suit your trading style.

## 🚀 Three Ways to Run

### 1. Alpha Advisor (The Report)
**"I just want the numbers."**
*   **Launch:** Desktop Shortcut `Alpha Advisor`
*   **What it does:** Runs a quick diagnostic, fetches live SPX/VIX data, and prints a strategy report recommending optimal strikes.
*   **Tech:** `python alpha_core.py` (Local)

### 2. Alpha Watchdog (The Guardian)
**"Watch my back while I work."**
*   **Launch:** Desktop Shortcut `Alpha Watchdog`
*   **What it does:** Runs silently in the background. Checks the market every 5 minutes.
*   **Alerts:** Plays a sound and pops up a warning box if Critical Risk is detected.
*   **Tech:** `python alpha_watchdog.py` (Visual/Audio Alerts)

### 3. Command Center (The Dashboard)
**"I want to see the battlefield."**
*   **Launch:** Desktop Shortcut `Antigravity Launch` (or `Alpha Dashboard`)
*   **What it does:** Launches the **Data Bridge** and the **Web UI**.
*   **Features:**
    *   Live Price Tickers
    *   Safe Zone Visualization Map
    *   Interactive Chat with Antigravity
*   **Tech:** `Launch Suite` -> Python Bridge + HTML5 Dashboard.

---

## Technical Architecture
*   **Core Brain:** `alpha_core.py` - The central logic engine.
*   **Bridge:** `alpha_bridge.py` - Flask server connecting Python to the Browser.
*   **Frontend:** `index.html` - Vanilla JS Dashboard.
*   **Automation:** `alpha_watchdog.py` - Independent monitoring loop.

## Installation
Dependencies required:
```bash
pip install yfinance flask flask-cors
```
(The launch scripts will attempt to install these automatically).

---
*Built by Antigravity Agent.*
