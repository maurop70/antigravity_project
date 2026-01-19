import time
import yfinance as yf
from flask import Flask, jsonify
from flask_cors import CORS
import threading

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for the Dashboard

# Cache to prevent hitting Yahoo too hard
# Cache to prevent hitting Yahoo too hard
MARKET_CACHE = {
    "last_update": 0,
    "data": {
        "spx": 0.00,
        "vix": 0.00,
        "bias": "Neutral",
        "events": [] # Store News/Calendar events
    }
}

def fetch_market_data():
    """Fetches real data from Yahoo Finance."""
    try:
        print("BRIDGE: Fetching latest market data...")
        # Tickers: ^SPX (S&P 500), ^VIX (Volatility)
        tickers = yf.Tickers("^SPX ^VIX")
        
        # Use 1d period but 1m interval for "live" feel
        # If market is closed, this returns the last trading minutes
        # We need enough history for SMA20, so we fetch 1mo
        # 1. Fetch Daily Data for Trend (SMA20)
        # 1. Fetch Daily Data for Trend (SMA20)
        spx_daily = tickers.tickers["^SPX"].history(period="1mo", interval="1d")
        
        # 2. Fetch Minute Data for Live Price (Try 1m, fallback to 1d)
        spx_live = tickers.tickers["^SPX"].history(period="5d", interval="1m")
        vix_live = tickers.tickers["^VIX"].history(period="5d", interval="1m")
        
        # Initial values (Default to 0)
        spx_price = 0.0
        vix_price = 0.0
        
        # LOGIC: Try Live, else Daily
        if not spx_live.empty:
             spx_price = spx_live['Close'].iloc[-1]
        elif not spx_daily.empty:
             print("BRIDGE: Live SPX empty, using Daily close.")
             spx_price = spx_daily['Close'].iloc[-1]
             
        if not vix_live.empty:
             vix_price = vix_live['Close'].iloc[-1]
        else:
             # Try fetching daily VIX if live failed
             vix_daily = tickers.tickers["^VIX"].history(period="5d", interval="1d")
             if not vix_daily.empty:
                 vix_price = vix_daily['Close'].iloc[-1]

        # Only proceed if we have at least Prices
        if spx_price > 0 and vix_price > 0:
            
            # Simple Bias Logic based on VIX
            bias = "Neutral"
            if vix_price < 15:
                bias = "Bullish"
            elif vix_price > 20:
                bias = "Bearish"

            # Technical Analysis (Trend) - OPTIONAL
            trend = "Neutral"
            try:
                if not spx_daily.empty and len(spx_daily) >= 20:
                    sma_20 = spx_daily['Close'].tail(20).mean()
                    if spx_price > sma_20:
                        trend = "Bullish (Above 20MA)"
                    else:
                        trend = "Bearish (Below 20MA)"
            except Exception as e:
                print(f"BRIDGE: Trend Calc Error: {e}")

            # FETCH INTELLIGENCE (News/Calendar)
            # We fetch news for SPY as a proxy for the broad market
            spy_ticker = yf.Ticker("SPY")
            news_items = spy_ticker.news if spy_ticker.news else []
            
            # Formatted Events for Alpha Brain
            alpha_events = []
            
            for item in news_items[:5]: # Top 5 headlines for more context
                alpha_events.append({
                    "type": "NEWS",
                    "headline": item.get('title', 'Unknown News'),
                    "source": item.get('publisher', 'YFinance'),
                    "url": item.get('link', '#'),
                    "timestamp": item.get('providerPublishTime', 0)
                })

            MARKET_CACHE["data"] = {
                "spx": round(spx_price, 2),
                "vix": round(vix_price, 2),
                "bias": bias,
                "trend": trend,
                "events": alpha_events
            }
            MARKET_CACHE["last_update"] = time.time()
            print(f"BRIDGE: Success. SPX: {spx_price:.2f}, VIX: {vix_price:.2f}, News: {len(alpha_events)}")
        else:
            print("BRIDGE: Data empty, using cached/fallback.")

    except Exception as e:
        print(f"BRIDGE: Error fetching data: {e}")

@app.route('/market_data', methods=['GET'])
def get_data():
    # Refresh if data is older than 10 seconds
    if time.time() - MARKET_CACHE["last_update"] > 10:
        fetch_market_data()
    
    return jsonify(MARKET_CACHE["data"])

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "online", "message": "Alpha Bridge Active"})

if __name__ == '__main__':
    print("ALPHA DATA BRIDGE STARTING...")
    print("---------------------------------")
    print("Connects Alpha Dashboard to Yahoo Finance")
    print("Listening on http://localhost:5000")
    print("---------------------------------")
    
    # Initial Fetch
    fetch_market_data()
    
    app.run(port=5000, debug=False)
