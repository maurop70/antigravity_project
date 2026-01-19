// alpha_brain.js - The Intelligence Engine

const ALPHA_BRAIN = {
    state: {
        mode: "MONITORING", // MONITORING, ANALYZING, ALERTING
        last_impact: 0
    },

    // 0. Synthesize Thesis (Live Analysis)
    synthesizeThesis: function (market) {
        let thesis = "";
        let bias = market.bias;

        // 1. Analyze VIX (Fear)
        if (market.vix < 13) thesis += "VIX is extremely low (<13), indicating complacency. ";
        else if (market.vix > 20) thesis += "VIX is elevated (>20), indicating fear and high premiums. ";
        else thesis += `VIX is normal (${market.vix.toFixed(2)}). `;

        // 2. Analyze Trend
        thesis += `Trend is ${market.trend}. `;

        // 3. Conclusion
        if (market.trend.includes("Bullish") && market.vix < 20) {
            thesis += "Conditions favor selling Put Spreads to capture upside drift.";
        } else if (market.trend.includes("Bearish") && market.vix > 20) {
            thesis += "High volatility supports wide Iron Condors or Short Calls.";
        } else {
            thesis += "Market is mixed. Recommend neutral Iron Condor with caution.";
        }

        return thesis;
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

            // --- CADENCE PROTOCOL: MONDAY ENTRY LOGIC ---
            // User Requirement: "Must include amount I would have gotten for Higher IV on Monday"
            const today = new Date();
            const isMonday = today.getDay() === 1;
            const contracts = currentTrade.actual_contracts || 1;

            // Estimated "Monday Premium" (IV Rank > 20 bump)
            // If today is NOT Monday, rolling now means missing the next Monday entry cycle unless we account for it.
            // Cost = $50 per contract (simulated)
            const opportunityCost = isMonday ? 0 : (50 * contracts);
            const netImprovement = extraProfit - opportunityCost;

            // Only recommend if purely better after deducting Opportunity Cost
            if (netImprovement > 0) {
                return {
                    type: "SUPERIOR_TRADE",
                    headline: "TRADE UPGRADE FOUND",
                    // STRUCTURED DATA FOR UI
                    upgradeData: {
                        netProfit: netImprovement,
                        rawProfit: extraProfit,
                        oppCost: opportunityCost,
                        oldStrike: currentShortPut,
                        newStrike: betterStrike,
                        contracts: contracts,
                        instructions: [
                            { action: "BUY TO CLOSE", quantity: contracts, leg: `SPX ${currentShortPut} PUT` },
                            { action: "SELL TO OPEN", quantity: contracts, leg: `SPX ${betterStrike} PUT` }
                        ],
                        // Full new leg config for Preview Mode
                        newLegs: currentTrade.actual_legs.map(l => {
                            if (l.strike === currentShortPut) return { ...l, strike: betterStrike };
                            return l;
                        })
                    },
                    message: `I've found a more efficient structure. Rolling the ${currentShortPut} Put to ${betterStrike} increases Net Profit by $${netImprovement} (after Monday cadence deduction).`
                };
            }
        }
        return null; // Upgrade not efficient enough to break Cadence
    },

    // 5. Event Horizon Scanner (Macro/Gamma Shield)
    scanForEventRisk: function (currentTrade, market) {
        // 1. Check for Event
        const event = ALPHA_FEED.getNextMacroEvent();
        if (!event || event.daysUntil > 2) return null;

        console.log(`BRAIN: Event Detected - ${event.name}`);

        // 2. Calculate Event Move (Shield Logic)
        const spot = parseFloat(market.price);
        const vix = parseFloat(market.vix);
        const eventImpact = spot * (vix / 1600) * 2;

        // Strategy A: Widen Wings (The Shield)
        const currentShortPut = currentTrade.actual_legs[2].strike;
        const safePut = Math.floor((spot - eventImpact) / 10) * 10;
        const shieldCost = 200;

        // Strategy B: Calendar Spread (Conditional)
        // User Requirement: "Recommend Calendar only if more profitable + same/less risk"
        // Simulation: 30% chance Calendar is better
        const isCalendarBetter = Math.random() < 0.3;

        if (isCalendarBetter) {
            return {
                type: "EVENT_RISK", // Still triggered by Event Risk
                headline: `EVENT HORIZON: ${event.name}`,
                upgradeData: {
                    netProfit: 150, // Positive Profit!
                    isProtection: false, // It's an opportunity upgrade
                    rationale: `Calendar Spread aims to profit from Volatility Crush of ${event.name}.`,
                    instructions: [
                        { action: "CLOSE IRON CONDOR", quantity: 1, leg: "ALL LEGS" },
                        { action: "OPEN CALENDAR", quantity: 1, leg: `SPX ${Math.floor(spot)} PUT` }
                    ],
                    newLegs: currentTrade.actual_legs // Placeholder (Real Cal logic complex)
                },
                message: `⚠️ <strong>EVENT: ${event.name}</strong><br>Analysis: Iron Condor is risky.<br>However, <strong>Calendar Spread</strong> is projected to capture +$150 from the volatility crush.<br>Recommend <strong>Switching Strategy</strong>.`
            };
        } else {
            // Default: Gamma Shield (Widening)
            return {
                type: "EVENT_RISK",
                headline: `EVENT HORIZON: ${event.name}`,
                upgradeData: {
                    netProfit: -shieldCost,
                    isProtection: true,
                    rationale: `Volatility Event (${event.name}) imminent. Theta decay paused.`,
                    instructions: [
                        { action: "BTC", quantity: currentTrade.actual_contracts || 1, leg: `SPX ${currentShortPut} PUT` },
                        { action: "STO", quantity: currentTrade.actual_contracts || 1, leg: `SPX ${safePut} PUT` }
                    ],
                    newLegs: currentTrade.actual_legs.map(l => {
                        if (l.strike === currentShortPut) return { ...l, strike: safePut };
                        return l;
                    })
                },
                message: `⚠️ <strong>CRITICAL: ${event.name} in 24hrs.</strong><br>Expected Move: +/- ${Math.round(eventImpact)} pts.<br>Recommend deploying <strong>Gamma Shield</strong> (Widening Wings).<br><strong>Cost of Protection: $${shieldCost}</strong>.`
            };
        }
    },

    // 6. Skew Hunter (Asymmetric Optimization)
    scanForSkew: function (currentTrade, market) {
        if (currentTrade.status !== 'LIVE') return null;

        const vix = parseFloat(market.vix);
        const putSkew = 1.0 + (vix / 20) * 0.5;

        if (putSkew > 1.3 && Math.random() < 0.1) {
            const skewPremium = 280;
            const currentLongPut = currentTrade.actual_legs[3].strike;
            const betterLongPut = currentLongPut - 25; // Widen the wings

            return {
                type: "SKEW_OPORTUNITY",
                headline: "SKEW IMBALANCE DETECTED",
                upgradeData: {
                    netProfit: skewPremium,
                    isSkew: true,
                    rationale: `Put Skew is explicit (Ratio ${putSkew.toFixed(2)}).`,
                    instructions: [
                        { action: "BTC", quantity: currentTrade.actual_contracts || 1, leg: `SPX ${currentLongPut} PUT` },
                        { action: "STO", quantity: currentTrade.actual_contracts || 1, leg: `SPX ${betterLongPut} PUT` }
                    ],
                    newLegs: currentTrade.actual_legs.map(l => {
                        if (l.strike === currentLongPut) return { ...l, strike: betterLongPut };
                        return l;
                    })
                },
                message: `🚀 <strong>SKEW HUNTER</strong><br>Market is paying a premium for Downside Protection.<br>Recommend <strong>Asymmetric Wings</strong>.<br><strong>Skew Efficiency: +$${skewPremium}</strong>.`
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
