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

    // 4. Continuous Arbitrage Scanner (New)
    scanForArbitrage: function (currentTrade) {
        // Only run if LIVE
        if (currentTrade.status !== 'LIVE') return null;

        // Logic: Check if a "roll" would generate risk-free profit
        // Simulation: 5% chance per scan to find a "Better Trade"
        if (Math.random() < 0.05) {
            const extraProfit = 145; // Hardcoded simulation value per user story
            const currentShortPut = currentTrade.actual_legs[2].strike;
            const betterStrike = currentShortPut - 40; // e.g. 6850 vs 6890

            return {
                type: "SUPERIOR_TRADE",
                message: `I've found a more efficient structure. Your current ${currentShortPut} Put has captured 30% of its value, but the Jan 23 cycle just saw an IV spike.<br><br>
                By rolling now to the ${betterStrike} Put, you maintain the same risk profile but increase your Max Profit by $${extraProfit}.<br><br>
                <strong>Extra Profit Opportunity: +$${extraProfit}</strong>. Should I prepare the roll order for you?`
            };
        }
        return null;
    },

    // Helper: Calculate EV
    calculateEV: function (trade) {
        // Mock EV calc
        const profit = parseFloat(trade.metrics.max_profit.replace("$", ""));
        const loss = parseFloat(trade.metrics.max_risk.replace("$", ""));
        const pop = parseFloat(trade.metrics.pop) / 100;
        return (profit * pop) - (loss * (1 - pop));
    },

    // 5. Memory & Learning (New)
    memory: {
        alphaGapHistory: [], // Stores {date, recommended, actual, gap}
        biasAdjustment: 0 // +Delta or -Delta adjustment based on user history
    },

    logAlphaGap: function (recommended, actual) {
        // Calculate diff in delta/risk profile
        const gap = actual.strike - recommended.strike;

        this.memory.alphaGapHistory.push({
            timestamp: new Date().toISOString(),
            rec: recommended.strike,
            act: actual.strike,
            gap: gap
        });

        // Simple Learning: If user consistently chooses safer (lower) strikes
        if (this.memory.alphaGapHistory.length > 2) {
            const avgGap = this.memory.alphaGapHistory.reduce((a, b) => a + b.gap, 0) / this.memory.alphaGapHistory.length;
            if (avgGap < -10) {
                this.memory.biasAdjustment = -0.05; // Lower delta target
                console.log("ALPHA LEARNING: User prefers safer strikes. Adjusting future bias.");
            }
        }
        return gap;
    },

    // Feature: Contextual Recall
    generateContextMessage: function () {
        if (this.memory.alphaGapHistory.length > 0) {
            const last = this.memory.alphaGapHistory[this.memory.alphaGapHistory.length - 1];
            return `(Recall: Last time you preferred the ${last.act} strike, which was ${Math.abs(last.gap)} pts from my target. I have adjusted this recommendation accordingly.)`;
        }
        return "";
    }
};

console.log("ALPHA BRAIN: Logic Engine Loaded.");
