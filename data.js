// Simulated Agent Memory / Database
const AGENT_DATA = {
    market: {
        spx: 6966.28,
        vix: 14.49,
        iv_rank: 18,
        mmm: 118, // Market Maker Move
        trend: "Bullish",
        regime: "Event Volatility (CPI)"
    },
    forecast: {
        direction: "Bullish",
        probability: 0.72, // 72% Confidence
        skew_recommendation: "Widen Put Spread",
        conviction_summary: "Banks Earnings Rotation + Low Delta Hedging",
        conviction_full_report: `
            <h1>Alpha Intelligence: Conviction Report</h1>
            <hr>
            <h3>1. Macro Analysis (Weight: 40%)</h3>
            <p><strong>CPI Expectation:</strong> Consensus is 2.7%. Inflation Nowcast models suggest 2.6%, providing a potential "Cool CPI" catalyst for risk-on assets.</p>
            <p><strong>Sector Rotation:</strong> Financials (XLF) are showing relative strength ahead of JPM/BAC earnings. This rotation historically supports SPX floors.</p>
            
            <h3>2. Quantitative Flows (Weight: 35%)</h3>
            <p><strong>GEX (Gamma Exposure):</strong> Positive Gamma regime > 6900 means dealers are dampening volatility on dips. This supports a "Buy the Dip" bias.</p>
            <p><strong>Vanna/Charm flows:</strong> As we approach OpEx (Friday), decay of Vanna will force dealers to buy back shorts, creating a natural tailwind.</p>

            <h3>3. Technicals (Weight: 25%)</h3>
            <p><strong>Structure:</strong> SPX is holding the 20-day MA. RSI is neutral (55), allowing room for upside expansion to 7100.</p>
            
            <hr>
            <p><em>Conclusion: 72% Probability of Upside Drift. Recommendation: Aggressive Put Skew.</em></p>
        `
    },
    active_trade: {
        type: "Unbalanced Iron Condor", // Changed due to Skew
        status: "PENDING ENTRY",
        expiration: "Jan 16, 2026",
        dte: 5,
        legs: [
            { side: "Call", action: "Sell", strike: 7125, delta: 12 },
            { side: "Call", action: "Buy", strike: 7150, delta: 5 }, // 25pt Width
            { side: "Put", action: "Sell", strike: 6800, delta: 14 },
            { side: "Put", action: "Buy", strike: 6750, delta: 6 }  // 50pt Width (Simulated Skew)
        ],
        metrics: {
            max_profit: "$2.10 (Credit)", // Higher credit due to wider put spread
            max_risk: "$47.90",           // Risk based on 50pt width
            pop: "74%",
            break_even: "6752 / 7146"
        },
        // To track 'Actual' execution vs 'Recommended'
        actual_legs: [
            { side: "Call", action: "Sell", strike: 7000, delta: 0.12 },
            { side: "Call", action: "Buy", strike: 7025, delta: 0.08 },
            { side: "Put", action: "Sell", strike: 6800, delta: 0.12 },
            { side: "Put", action: "Buy", strike: 6750, delta: 0.07 }
        ],
        thesis: "Bullish Skew (>70% Prob). Widened Put Vertical to 50pts to maximize profit capture.",
        thesis_full_report: `
            <h1>Alpha Trade Strategy: Unbalanced Iron Condor</h1>
            <hr>
            <h3>1. Strike Selection Thesis</h3>
            <p><strong>Short Call (7125):</strong> Selected at 12 Delta. This is 30 points above the expected move (7084). We are fading the 'Call Wall' resistance at 7100.</p>
            <p><strong>Short Put (6800):</strong> Selected at 14 Delta. The 6800 level coincides with the JPM Ops 'Put Wall'. Breaking this level would require a 2.5% drop, deemed unlikely given the Positive GEX regime.</p>

            <h3>2. Execution Strategy</h3>
            <p><strong>Timing:</strong> Entry targeted for Monday 9:45 AM ('Monday Vrush'). We normally see IV stay elevated for 15 mins after open before crushing.</p>
            <p><strong>Smart Skew:</strong> Due to Bullish Bias, we widened the Put Width to 50pts. This allows us to collect $0.60 extra credit while keeping the Short Strike far OTM.</p>

            <h3>3. Management Rules</h3>
            <p><strong>Profit Target:</strong> Close at 50% profit ($1.05). If hit by Wednesday, we assume 'Gamma Risk' is too high to hold further.</p>
            <p><strong>Stop Loss:</strong> 200% of credit received ($4.20).</p>
            <p><strong>Adjustment Plan:</strong></p>
            <ul>
                <li>If SPX rallies > 7050: Roll Puts UP to 6900 to collect more credit/cut delta.</li>
                <li>If SPX drops < 6850: Liquidity Check. If VIX < 20, hold. If VIX > 20, close Puts.</li>
            </ul>
        `
    },
    chat_history: [
        { sender: "agent", text: "Welcome back, Alpha. Markets are closed (Saturday). I have prepared the Weekly Plan for Jan 12 expiration." },
        { sender: "agent", text: "Strategy: Iron Condor. Bias: Neutral/Bullish. I am targeting the 7125/6800 strikes to fade the CPI event." },
        { sender: "agent", text: "Update: Bullish conviction > 70%. I have widened the Put Vertical to 50pts to increase Profit Potential." }
    ]
};
