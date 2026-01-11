// alpha_feed.js - Simulated Global Data Stream

const ALPHA_FEED = {
    // 1. Defined Scenarios (for Testing)
    scenarios: {
        "FED_HAWKISH": {
            type: "MACRO",
            headline: "FOMC Minutes: Members discuss 50bps rate hike possibility.",
            source: "Bloomberg Terminal",
            severity: "HIGH",
            impact_score: -8 // Negative for Equities
        },
        "WAR_ESCALATION": {
            type: "GEOPOLITICAL",
            headline: "Middle East Tension: Strait of Hormuz closure threatened.",
            source: "Reuters",
            severity: "CRITICAL",
            impact_score: -10 // Massive Volatility Spike
        },
        "TECH_EARNINGS_BEAT": {
            type: "CORPORATE",
            headline: "NVDA reports 150% YoY growth, guides higher.",
            source: "Earnings Call",
            severity: "MEDIUM",
            impact_score: 6 // Bullish for SPX
        },
        "LOW_VOL_DRIFT": {
            type: "MARKET_INTERNAL",
            headline: "VIX drops below 13. Dealers in long gamma regime.",
            source: "Alpha Quant Model",
            severity: "LOW",
            impact_score: 2 // Stabilizing
        }
    },

    // 2. Event Queue (Simulates real-time incoming websocket)
    queue: [],

    // 3. Methods to Inject Events
    injectEvent: function (scenarioKey) {
        if (this.scenarios[scenarioKey]) {
            const event = {
                ...this.scenarios[scenarioKey],
                timestamp: new Date().toLocaleTimeString()
            };
            this.queue.push(event);
            return event;
        }
        return null;
    },

    // 4. Random Noise Generator to simulate "Constant Feed"
    generateNoise: function () {
        const noises = [
            "Oil slight up 0.5% on demand hopes.",
            "10Y Treasury Yield flat at 4.2%.",
            "Jobless Claims align with expectations.",
            "EUR/USD holding 1.05 support."
        ];
        return {
            type: "NOISE",
            headline: noises[Math.floor(Math.random() * noises.length)],
            source: "News Wire",
            severity: "NEUTRAL",
            impact_score: 0,
            timestamp: new Date().toLocaleTimeString()
        };
    }
};

console.log("ALPHA FEED: Module Loaded. Ready to inject scenarios.");
