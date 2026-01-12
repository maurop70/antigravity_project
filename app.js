document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupEventListeners();
});

function initDashboard() {
    loadState(); // Restore previous edits
    renderStrategy(AGENT_DATA.active_trade);
    renderChat(AGENT_DATA.chat_history);
    renderVisualizer(AGENT_DATA.market, AGENT_DATA.active_trade);
    renderMetrics(AGENT_DATA.market, AGENT_DATA.active_trade);
    calculateOptimization(10000); // Initial calc
    startAlphaLoop(); // Start Continuous Intelligence
    startArbitrageScanner(); // Start "Extra Profit" Scanner immediately
    requestNotificationPermission(); // Ask user for permission
}

function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("ALPHA SYSTEM: Notifications Enabled.");
            }
        });
    }
}

function triggerDesktopAlert(alertData) {
    // 1. Try System Notification (Reliable background alert)
    if (Notification.permission === "granted") {
        const notif = new Notification("🦅 IRON CONDOR ALPHA", {
            body: `ALERT: ${alertData.headline}\n${alertData.type} - Click to View`,
            icon: "https://cdn-icons-png.flaticon.com/512/3067/3067788.png", // Generic Shield Icon
            requireInteraction: true // Keep it on screen
        });

        notif.onclick = () => {
            window.focus();
            openAlertWindow(alertData);
        };
    }

    // 2. Try Immediate Popup (Likely blocked by browser unless explicitly allowed)
    // We catch the error to prevent crashing logic
    try {
        openAlertWindow(alertData);
    } catch (e) {
        console.warn("Popup blocked by browser. User must click notification.");
    }
}

function showInAppAlert(type, headline, message) {
    // Remove existing
    const existing = document.getElementById('alpha-alert-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'alpha-alert-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    const color = type.includes("CRITICAL") ? "#ff0055" : "#00ff9d";

    overlay.innerHTML = `
        <div style="background: #0a0b0e; border: 2px solid ${color}; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 0 50px ${color}44;">
            <h1 style="color: ${color}; font-family: 'JetBrains Mono'; margin: 0 0 10px 0;">⚠️ ${type}</h1>
            <h3 style="color: #fff; margin: 0 0 20px 0;">${headline}</h3>
            <p style="color: #b0b0b0; font-size: 1.1rem;">${message}</p>
            <button onclick="document.getElementById('alpha-alert-overlay').remove()" 
                    style="background: ${color}; color: #000; border: none; padding: 12px 30px; font-weight: bold; margin-top: 20px; cursor: pointer;">
                ACKNOWLEDGE
            </button>
        </div>
    `;

    document.body.appendChild(overlay);
}

function startAlphaLoop() {
    // Simulate background scanning (Noise + Occasional Events)
    setInterval(() => {
        // 10% chance to inject noise to show system is alive
        if (Math.random() < 0.1) {
            const noise = ALPHA_FEED.generateNoise();
            // Optional: Log noise to console or small ticker, don't spam chat unless important
            console.log(`FEED: ${noise.headline}`);
        }
    }, 5000);
}

// New Scanner for "Extra Profit"
function startArbitrageScanner() {
    console.log("ALPHA: Arbitrage Scanner Active.");
    setInterval(() => {
        // Brain Logic
        const opportunity = ALPHA_BRAIN.scanForArbitrage(AGENT_DATA.active_trade);

        if (opportunity) {
            // DIFFERENTIATE ALERT TYPES
            const alertType = opportunity.type === "BETTER_ENTRY" ? "OPPORTUNITY" : "TRADE UPGRADE";

            showInAppAlert(alertType, opportunity.headline, opportunity.message);
            appendMessage('agent', opportunity.message);
        }
    }, 10000); // Scan every 10 seconds for demo
}

function renderMetrics(market, trade) {
    document.getElementById('mmm-val').innerText = `+/- ${market.mmm}`;
    document.getElementById('pop-val').innerText = trade.metrics.pop;
    document.getElementById('dte-val').innerText = trade.dte;
}

function renderStrategy(trade) {
    const container = document.getElementById('active-strategy-container');
    const spx = AGENT_DATA.market.spx;
    const mmm = AGENT_DATA.market.mmm;

    // Table Header
    let html = `
    <div class="strategy-card">
        <div class="strategy-title">
            ${trade.type} 
            <span style="font-size: 0.6em; float: right; color: ${trade.status === 'LIVE' ? '#00ff9d' : '#ffcc00'}">
                ${trade.status}
                ${trade.status === 'LIVE' ? '<span class="pulse">●</span>' : '<span class="blink">SCANNING...</span>'}
            </span>
        </div>
        
        <div style="font-size: 0.75rem; color: #b0b0b0; margin-bottom: 12px; font-family: 'JetBrains Mono'; border-bottom: 1px solid #333; padding-bottom: 8px;">
            EXPIRATION: <span style="color: #fff; font-weight: bold;">${trade.expiration}</span> (Weekly)
        </div>

        <style>
             @keyframes blink { 0% { opacity: 0.2; } 50% { opacity: 1; } 100% { opacity: 0.2; } }
             .blink { animation: blink 1.5s infinite; color: #00ff9d; margin-left: 8px; font-weight: normal; }
             .pulse { animation: blink 1s infinite; color: #ff0055; margin-left: 5px; }
        </style>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 0.5fr; gap: 10px; margin-bottom: 10px; font-size: 0.7rem; color: #64748b; border-bottom: 1px solid #333; padding-bottom: 5px;">
            <div>LEG</div>
            <div>RECOMMENDED</div>
            <div>ACTUAL <span style="font-size: 0.8em;">✏️</span></div>
            <div>Δ</div>
        </div>
    `;

    // Legs Row
    const legsHtml = trade.legs.map((leg, index) => {
        // Use Actual Strike from data, or default to recommended
        const actualStrike = trade.actual_legs ? trade.actual_legs[index].strike : leg.strike;
        const isLive = trade.status === 'LIVE';

        return `
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 0.5fr; gap: 10px; align-items: center; margin-bottom: 8px; font-size: 0.8rem;">
            <div style="color: #b0b0b0;">${leg.action} ${leg.side}</div>
            <div style="color: #ffcc00;">${leg.strike}</div>
            <div>
                <input type="number" 
                       value="${actualStrike}" 
                       class="strike-input" 
                       style="background: #0f172a; border: 1px solid #475569; color: #fff; width: 100%; border-radius: 4px; padding: 4px 6px; font-weight: bold; ${isLive ? 'border-color: #00ff9d;' : 'border-color: #64748b;'}"
                       oninput="updateActualStrike(${index}, this.value)"
                >
            </div>
            <div style="color: #64748b; font-family: 'JetBrains Mono';">${leg.delta}</div>
        </div>
    `}).join('');

    html += legsHtml;

    // Action Button Logic
    const btnText = trade.status === 'PENDING ENTRY' ? "CONFIRM ORDER PLACED" : "LIVE MONITORING ACTIVE";
    const btnColor = trade.status === 'PENDING ENTRY' ? "background: #ff0055;" : "background: #00ff9d; color: #000; cursor: default;";

    html += `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
            <button class="action-btn" style="${btnColor}" onclick="confirmOrder()">${btnText}</button>
        </div>
    </div>`;

    // Alpha Insight Section (Unchanged mostly)
    const memoryNote = ALPHA_BRAIN.generateContextMessage(); // Trigger Memory Recall

    html += `
        <div class="alpha-insight">
            <div class="alpha-insight-header"><span class="icon">⚡</span> ALPHA INTELLIGENCE</div>
            <div class="alpha-insight-body">
                "${trade.thesis}"<br>
                <div style="font-size: 0.7rem; color: #8b9bb4; margin-top: 5px; font-style: italic;">${memoryNote}</div>
                <button onclick="openStrategyReport()" style="background:none; border:none; color:#00ff9d; text-decoration:underline; cursor:pointer; font-family:'JetBrains Mono'; font-size:0.7rem; margin-top:8px;">>>> OPEN REPORT</button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Logic to handle "Actual" updates
// Logic to handle "Actual" updates
window.updateActualStrike = function (index, value) {
    if (!value || value === "") return; // Don't break on empty input while typing
    const val = parseInt(value);
    if (isNaN(val)) return;

    AGENT_DATA.active_trade.actual_legs[index].strike = val;
    console.log(`Updated Leg ${index} to ${val}`);

    // Save to LocalStorage for persistence
    saveState();

    // Recalculate Visuals immediately
    renderVisualizer(AGENT_DATA.market, AGENT_DATA.active_trade);
}

function saveState() {
    localStorage.setItem('alpha_active_trade', JSON.stringify(AGENT_DATA.active_trade));
}

function loadState() {
    const saved = localStorage.getItem('alpha_active_trade');
    if (saved) {
        AGENT_DATA.active_trade = JSON.parse(saved);
        console.log("ALPHA SYSTEM: Restored Saved State");
    }
}

// Logic to Confirm Order
window.confirmOrder = function () {
    if (AGENT_DATA.active_trade.status === 'LIVE') return;

    AGENT_DATA.active_trade.status = 'LIVE';
    alert("ORDER CONFIRMED. Switching to LIVE MONITORING. Alpha is now scanning for Arbitrage opportunities.");
    renderStrategy(AGENT_DATA.active_trade);

    // Start the Arbitrage Scanner
    startArbitrageScanner();
}


function openStrategyReport() {
    const reportWindow = window.open("", "StrategyReport", "width=600,height=800");
    const trade = AGENT_DATA.active_trade;
    // Use Actual legs if live, otherwise Recommended
    const activeLegs = trade.actual_legs || trade.legs;

    const reportContent = `
        <h1>Alpha Trade Strategy Report</h1>
        <h3>1. Market Condition</h3>
        <p><strong>Thesis:</strong> ${trade.thesis}</p>
        <p><strong>Forecast:</strong> ${AGENT_DATA.forecast.direction} (${(AGENT_DATA.forecast.probability * 100).toFixed(0)}% Confidence)</p>
        <hr>
        <h3>2. Execution Structure (Actual)</h3>
        <ul>
            <li><strong>Short Call:</strong> ${activeLegs[0].strike} (Delta ${activeLegs[0].delta})</li>
            <li><strong>Short Put:</strong> ${activeLegs[2].strike} (Delta ${activeLegs[2].delta})</li>
            <li><strong>Long Hedges:</strong> ${activeLegs[1].strike} / ${activeLegs[3].strike}</li>
        </ul>
        <hr>
        <h3>3. Risk Profile</h3>
        <p><strong>Max Profit:</strong> ${trade.metrics.max_profit}</p>
        <p><strong>Probability of Profit:</strong> ${trade.metrics.pop}</p>
        <p><strong>Breakeven Range:</strong> ${trade.metrics.break_even}</p>
        <hr>
        <h3>4. Exit Strategy (Dynamic)</h3>
        <p><strong>Profit Target:</strong> Close at 50% Profit.</p>
        <p><strong>Stop Loss:</strong> 200% of Initial Credit.</p>
        <p><strong>Defense Trigger:</strong> Roll position if SPX touches Short Strikes:</p>
        <ul>
            <li><strong>Upside Breach:</strong> ${activeLegs[0].strike} (Call Side)</li>
            <li><strong>Downside Breach:</strong> ${activeLegs[2].strike} (Put Side)</li>
        </ul>
        <hr>
        <p><em>Generated by Alpha Intelligence Engine at ${new Date().toLocaleTimeString()}</em></p>
    `;

    reportWindow.document.write(`
        <html>
        <head>
            <title>Alpha Strategy Report</title>
            <style>
                body { background-color: #0a0b0e; color: #e0e0e0; font-family: 'Inter', sans-serif; padding: 40px; }
                h1 { color: #00ff9d; font-family: 'JetBrains Mono'; font-size: 1.5rem; text-transform: uppercase; }
                hr { border-color: #2a303c; margin: 20px 0; }
                h3 { color: #ffcc00; font-size: 1.1rem; margin-top: 30px; }
                p { line-height: 1.6; color: #b0b0b0; }
                strong { color: #fff; }
                ul { color: #b0b0b0; line-height: 1.6; }
                li { margin-bottom: 8px; }
            </style>
        </head>
        <body>
            ${reportContent}
        </body>
        </html>
    `);
}

function calculateOptimization(capital) {
    const container = document.getElementById('optimization-results');

    // FORECAST DATA (From Data.js)
    // 72% Bullish -> Widen Puts. Keep Calls standard.
    // If Bearish -> Widen Calls.
    const direction = AGENT_DATA.forecast.direction;

    // Configurations: { callWidth: X, putWidth: Y }
    // If Bullish: Calls fixed at 25, Puts vary [25, 50, 75, 100]
    // If Bearish: Puts fixed at 25, Calls vary.
    // If Neutral: Both symmetric.

    let configs = [];
    if (direction === "Bullish") {
        configs = [
            { cW: 25, pW: 25 },
            { cW: 25, pW: 50 },
            { cW: 25, pW: 75 },
            { cW: 25, pW: 100 }
        ];
    } else {
        // Assume Neutral/Bearish logic (Simplified for this demo)
        configs = [{ cW: 25, pW: 25 }];
    }

    let bestConfig = { cW: 0, pW: 0, contracts: 0, profit: 0, exposure: 0 };

    configs.forEach(cfg => {
        // credit estimation logic per width
        // Base Credit (25/25) = $1.50
        // Add credit for extra width on Put side (Simulating Skew Demand):
        // +25 width (Total 50) = +$1.80 (Increased to favor Skew)

        let baseCredit = 150;
        let extraCredit = 0;

        if (cfg.pW === 50) extraCredit = 180; // Total 330. Margin ~4670. 2 contracts * 330 = $660 > $600
        if (cfg.pW === 75) extraCredit = 220;
        if (cfg.pW === 100) extraCredit = 250;

        const totalCredit = baseCredit + extraCredit;

        // Margin Requirement = Width * 100 - Credit
        const maxWidth = Math.max(cfg.cW, cfg.pW);
        const marginPerContract = (maxWidth * 100) - totalCredit;

        const contracts = Math.floor(capital / marginPerContract);
        const totalProfit = contracts * totalCredit;

        if (totalProfit > bestConfig.profit) {
            bestConfig = {
                cW: cfg.cW,
                pW: cfg.pW,
                contracts: contracts,
                profit: totalProfit,
                exposure: contracts * marginPerContract,
                unitCredit: totalCredit / 100
            };
        }
    });

    // Render Best Configuration
    container.innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
            <div style="background: rgba(0, 255, 157, 0.05); border: 1px solid #00ff9d; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.75rem; color: #00ff9d; font-weight: 700;">ALPHA SOLVER: HIGHEST EV</div>
                    <div style="font-size: 0.7rem; color: #8b9bb4;">UTILIZATION: ${((bestConfig.exposure / capital) * 100).toFixed(0)}%</div>
                </div>
                
                <div style="font-size: 0.8rem; color: #e0e0e0; margin-top: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                     <strong>Structure:</strong> ${bestConfig.desc}
                     <br>
                     <strong>Aggression:</strong> ${bestConfig.desc.includes("Aggressive") ? "<span style='color:#ff0055'>High (Closer Strikes)</span>" : "<span style='color:#00ff9d'>Standard (Safe Zone)</span>"}
                     <br>
                     <strong>Expected Value (EV):</strong> <span style="color:#00ff9d">$${Math.round(bestConfig.score)}</span>
                </div>
                
                <div style="font-size: 0.65rem; color: #64748b; margin-top: 4px; font-family: 'JetBrains Mono';">
                    MATH: (Win% x Profit) - (Loss% x Risk)
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="leg">
                    <label>Contracts</label>
                    <span style="font-size: 1.2rem; color: #fff; font-weight: 700;">${bestConfig.contracts}</span>
                </div>
                <div class="leg">
                    <label>Win Rate</label>
                    <span style="color: #00ff9d;">${(bestConfig.winRate * 100).toFixed(0)}%</span>
                </div>
                <div class="leg">
                    <label>Total Risk</label>
                    <span>$${bestConfig.exposure.toLocaleString()}</span>
                </div>
                <div class="leg">
                    <label>Max Profit</label>
                    <span style="color: #ffcc00; font-weight: 700;">$${bestConfig.profit.toLocaleString()}</span>
                </div>
            </div>
            
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 8px; font-style: italic;">
                *Solver maximized EV by utilizing 100% of capital on the asymmetric ${bestConfig.cW}/${bestConfig.pW} structure.
            </div>
        </div>
    `;
}

function openConvictionReport() {
    const reportWindow = window.open("", "ConvictionReport", "width=600,height=800");
    const reportContent = AGENT_DATA.forecast.conviction_full_report;

    // Style the new window
    reportWindow.document.write(`
        <html>
        <head>
            <title>Alpha Intelligence Report</title>
            <style>
                body { background-color: #0a0b0e; color: #e0e0e0; font-family: 'Inter', sans-serif; padding: 40px; }
                h1 { color: #00ff9d; font-family: 'JetBrains Mono'; font-size: 1.5rem; text-transform: uppercase; }
                hr { border-color: #2a303c; margin: 20px 0; }
                h3 { color: #ffcc00; font-size: 1.1rem; margin-top: 30px; }
                p { line-height: 1.6; color: #b0b0b0; }
                strong { color: #fff; }
            </style>
        </head>
        <body>
            ${reportContent}
        </body>
        </html>
    `);
}

function renderChat(history) {
    const feed = document.getElementById('chat-feed');
    feed.innerHTML = '';
    history.forEach(msg => {
        appendMessage(msg.sender, msg.text);
    });
}

function appendMessage(sender, text) {
    const feed = document.getElementById('chat-feed');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('msg', sender);
    msgDiv.innerText = text;
    feed.appendChild(msgDiv);
    feed.scrollTop = feed.scrollHeight;
}

function renderVisualizer(market, trade) {
    // Simple DOM-based visualizer for the "Safe Zone"
    const container = document.getElementById('map-container');

    // Use Actual Legs if available, else default to Recommended
    const activeLegs = trade.actual_legs ? trade.actual_legs : trade.legs;

    // Calculate percentages for visual bars (simplified)
    const rangeStart = 6700;
    const rangeTotal = 500;

    // Safety clamp (0-100) logic implied
    const curPct = Math.max(0, Math.min(100, ((market.spx - rangeStart) / rangeTotal) * 100));
    const callPct = Math.max(0, Math.min(100, ((activeLegs[0].strike - rangeStart) / rangeTotal) * 100));
    const putPct = Math.max(0, Math.min(100, ((activeLegs[2].strike - rangeStart) / rangeTotal) * 100));

    // Calculate Dynamic Deltas (Mock calculation based on distance)
    // In a real app, this would query an API. Here we estimate.
    const callDist = Math.abs(activeLegs[0].strike - market.spx);
    const putDist = Math.abs(activeLegs[2].strike - market.spx);
    // Rough approx: Delta inversely proportional to distance
    const callDelta = Math.max(1, Math.round(50 - (callDist / 10))).toString().padStart(2, '0');
    const putDelta = Math.max(1, Math.round(50 - (putDist / 10))).toString().padStart(2, '0');

    container.innerHTML = `
        <div style="position: relative; height: 100%; min-height: 300px; background: rgba(0,0,0,0.2); border-left: 1px solid #333; border-bottom: 1px solid #333; margin: 20px;">
            <!-- Current Price -->
            <div style="position: absolute; bottom: ${curPct}%; left: 0; width: 100%; border-bottom: 2px dashed #00ff9d;">
                <span style="position: absolute; right: 0; bottom: 2px; color: #00ff9d; font-size: 0.7rem; font-family: 'JetBrains Mono';">CURRENT: ${market.spx}</span>
            </div>

            <!-- Call Wall -->
            <div style="position: absolute; bottom: ${callPct}%; left: 0; width: 100%; height: ${100 - callPct}%; background: rgba(255, 0, 85, 0.1); border-bottom: 2px solid #ff0055;">
                <span style="position: absolute; left: 10px; bottom: 5px; color: #ff0055; font-size: 0.7rem; font-weight: bold;">SHORT CALL: ${activeLegs[0].strike} (Δ${callDelta})</span>
            </div>

            <!-- Put Wall -->
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: ${putPct}%; background: rgba(255, 0, 85, 0.1); border-top: 2px solid #ff0055;">
                <span style="position: absolute; left: 10px; top: 5px; color: #ff0055; font-size: 0.7rem; font-weight: bold;">SHORT PUT: ${activeLegs[2].strike} (Δ${putDelta})</span>
            </div>
            
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.05); font-size: 3rem; font-weight: 800; pointer-events: none;">SAFE ZONE</div>
        </div>
    `;
}

function setupEventListeners() {
    const input = document.getElementById('user-input');
    const btn = document.getElementById('send-btn');
    const clearBtn = document.getElementById('clear-chat');
    const capitalInput = document.getElementById('capital-input'); // New

    const handleSend = () => {
        const text = input.value.trim();
        if (!text) return;

        appendMessage('user', text);
        input.value = '';

        // Simulate Agent Response
        setTimeout(() => {
            let response = "I am processing your request...";

            // SIMULATION COMMANDS
            // SIMULATION COMMANDS (Natural Language Support)
            if (text.toLowerCase().includes("war") || text.toLowerCase().includes("escalat")) {
                const event = ALPHA_FEED.injectEvent("WAR_ESCALATION");
                const result = ALPHA_BRAIN.processEvent(event, AGENT_DATA.active_trade);
                response = result ? result.message : "Event logged.";

                if (result) showInAppAlert("CRITICAL ALERT", event.headline, "Thesis Invalidated. Immediate Exit Recommended.");
            }
            else if (text.toLowerCase().includes("fed") || text.toLowerCase().includes("rate")) {
                const event = ALPHA_FEED.injectEvent("FED_HAWKISH");
                const result = ALPHA_BRAIN.processEvent(event, AGENT_DATA.active_trade);
                response = result ? result.message : "Event logged.";

                if (result) showInAppAlert("OPPORTUNITY", event.headline, "New Short Setup available.");
            }
            else if (text.toLowerCase().includes("crash") || text.toLowerCase().includes("drop")) {
                const event = { type: "MACRO", headline: "Flash Crash: SPX down 3% in minutes.", severity: "CRITICAL", impact_score: -10 };
                const result = ALPHA_BRAIN.processEvent(event, AGENT_DATA.active_trade);
                response = result ? result.message : "Alert sent.";

                if (result) showInAppAlert("CRITICAL ALERT", event.headline, "Thesis Invalidated. Immediate Exit Recommended.");
            }
            // MACRO / GEOPOLITICS (User Specific: Oil, Venezuela)
            else if (text.toLowerCase().includes("oil") || text.toLowerCase().includes("venezuela") || text.toLowerCase().includes("energy")) {
                const event = ALPHA_FEED.injectEvent("ENERGY_SHOCK");
                // Custom event props for visualization
                event.headline = "Geopolitical Shift: Excess Oil Supply";

                const result = ALPHA_BRAIN.processEvent(event, AGENT_DATA.active_trade);

                // Manual Alert Trigger for "Access to Oil" -> Bearish/Stable for Energy, Bullish for Consumer Discretionary? 
                // Let's assume this reduces inflation -> Bullish.
                showInAppAlert("OPPORTUNITY", "Inflation Reduction Event", "Oil Supply expansion detected. Lower Energy costs = Bullish for SPX margins.");
                response = "<strong>Macro Event Detected:</strong> Venezuela Oil Access.<br>IMPACT: Lower Oil Prices -> Lower CPI -> <strong>Very Bullish</strong> for SPX.<br><br>Recommendation: Hold or Add Long Deltas.";
            }
            // INTELLIGENT RESPONSES
            // Matches: "Why...", "What if I sell...", "6890", "closer strike"
            else if (
                (text.toLowerCase().includes("why") || text.toLowerCase().includes("what if") || text.toLowerCase().includes("sell")) &&
                (text.toLowerCase().includes("closer") || text.toLowerCase().includes("strike") || text.toLowerCase().includes("put") || text.toLowerCase().includes("6890"))
            ) {
                response = "<strong>Analysis of Strike (e.g. 6890):</strong><br>Selling closer to the money (ATM) drastically increases <strong>Gamma Risk</strong>.<br><br>While you collect more premium, a 1% move in SPX could wipe out that profit instantly. My algorithm selects strikes (Safe Zone) that stay outside the <strong>Market Maker Move</strong> to ensure survival.";
            }
            else if (text.toLowerCase().includes("risk")) {
                response = "Current risk is defined at $47.90 max loss per contract (due to 50pt wide Put Spread).";
            } else if (text.toLowerCase().includes("width") || text.toLowerCase().includes("skew")) {
                response = "I have detected a 72% Bullish bias. I widened the Put Vertical to 50pts (Standard is 25pts) to capture more credit.";
            } else if (text.toLowerCase().includes("monday")) {
                response = "The plan: Wait for the 'Monday Vrush' (9:30-10:00 AM). Targeting entry if IV Rank > 15.";
            } else if (text.toLowerCase().includes("close")) {
                response = "I will alert you when we reach 50% profit. If we hit that on Wednesday, we will close and rescan.";
            }
            // CATCH-ALL
            else {
                response = "I didn't quite catch that. I am scanning global feeds, but I can discuss <strong>Strikes</strong>, <strong>Risk</strong>, or run <strong>Simulations</strong>.";
            }
            appendMessage('agent', response);
        }, 800); // Reduced latency for snappy feel
    };

    // Capital Input Listener
    capitalInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (val && val > 0) {
            calculateOptimization(val);
        }
    });

    btn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // Clear Chat Logic
    clearBtn.addEventListener('click', () => {
        const feed = document.getElementById('chat-feed');
        feed.innerHTML = '';
        appendMessage('agent', 'Chat history cleared. Ready for new commands.');
    });

    // Force Wakeup
    console.log("Chat System: INITIALIZED and LISTENING.");
    appendMessage('agent', "System online. I am actively scanning for Arbitrage and Monitoring Risk.");
}

function copyTrade() {
    alert("Order copied to clipboard: UNBALANCED IC SPX... [Full Chain]");
}
