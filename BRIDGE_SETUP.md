# Iron Condor Alpha - Data Bridge Setup

To enable real-time market data from Yahoo Finance, you need to run the Python Data Bridge.

## 1. Prerequisites
You need **Python** installed on your system.
- Download it from [python.org](https://www.python.org/downloads/) or via the Microsoft Store.
- **IMPORTANT:** During installation, check the box that says **"Add Python to PATH"**.

## 2. Setup (One-time)
Open a terminal in this folder and run:
```powershell
pip install -r requirements.txt
```

## 3. Running the Bridge
Double-click **`run_alpha_with_bridge.bat`**.

This will:
1. Start the Python Bridge (Black window, port 5000).
2. Launch the Alpha Dashboard.

## Troubleshooting
If you see "Python was not found", it means Python is not in your system PATH.
1. Re-install Python and ensure "Add to PATH" is checked.
2. Restart your computer.
