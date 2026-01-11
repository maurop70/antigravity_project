// alpha_brain.js - The Intelligence Engine

const ALPHA_BRAIN = {
    state: {
        mode: "MONITORING", // MONITORING, ANALYZING, ALERTING
        last_impact: 0
    },

    // 1. Process Incoming Events
    processEvent: function (event, currentTrade) {
        console.log(`BRAIN: Processing ${event.type}: ${event.headline}`);

        // Severity Logic
        if (event.severity === "CRITICAL") {
            return this.generateEmergencyAlert(event);
        }

        // Impact Logic
        if (Math.abs(event.impact_score) > 5) {
            return this.analyzeOpportunity(event, currentTrade);
        }

        return null; // Noise, ignore
    },

    // 2. Opportunity Scanner (The "Swap" Logic)
    analyzeOpportunity: function (event, currentTrade) {
        // Calculate Expected Value of Current Trade
        // Simplified EV = (MaxProfit * PoP) - (MaxLoss * (1-PoP))
        const currentEV = this.calculateEV(currentTrade);

        // Calculate EV of Hypothetical New Trade based on Event
        // e.g. If Volatility Spike (Negative Score), Iron Condor becomes bad, Debit Spread becomes good.
        let newSetup = null;

        if (event.impact_score < -5) {
            // Bearish/Volatile Event -> Suggest Long Puts or Wide Bear Spreads
            newSetup = {
                type: "Long Put Vertical",
                thesis: `Volatility Spike detected (${event.headline}). Switching to Directional Hedge.`,
                ev: currentEV * 1.8 // Simulated better EV
            };
        } else if (event.impact_score > 5) {
            // Bullish Event -> Suggest Long Calls
            newSetup = {
                type: "Long Call Vertical",
                thesis: `Bullish Catalyst (${event.headline}). Switching to Upside Capture.`,
                ev: currentEV * 1.5
            };
        }

        if (newSetup && newSetup.ev > currentEV * 1.3) {
            return {
                type: "OPPORTUNITY",
                message: `🚀 <strong>ALPHA OPPORTUNITY</strong><br>New Event: ${event.headline}<br>Analysis: Current Trade EV is degrading. New Setup (${newSetup.type}) offers <strong>${((newSetup.ev / currentEV - 1) * 100).toFixed(0)}% higher Expected Value</strong>.<br><button class='action-btn' style='margin-top:5px; font-size:0.7rem;'>EXECUTE SWAP</button>`
            };
        }

        return {
            type: "INFO",
            message: `ℹ️ <strong>Market Update</strong>: ${event.headline}. Impact is manageable. Holding current trade.`
        };
    },

    // 3. Emergency Logic
    generateEmergencyAlert: function (event) {
        return {
            type: "DANGER",
            message: `🚨 <strong>CRITICAL ALERT</strong>: ${event.headline}<br>Thesis Invalidated. Immediate Exit Recommended.<br><button class='action-btn' style='background: #ff0055; margin-top:5px;'>CLOSE POSITIONS</button>`
        };
    },

    // Helper: Calculate EV
    calculateEV: function (trade) {
        // Mock EV calc
        const profit = parseFloat(trade.metrics.max_profit.replace("$", ""));
        const loss = parseFloat(trade.metrics.max_risk.replace("$", ""));
        const pop = parseFloat(trade.metrics.pop) / 100;
        return (profit * pop) - (loss * (1 - pop));
    }
};

console.log("ALPHA BRAIN: Logic Engine Loaded.");
