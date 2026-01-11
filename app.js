document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupEventListeners();
});

function initDashboard() {
    renderStrategy(AGENT_DATA.active_trade);
    renderChat(AGENT_DATA.chat_history);
    renderVisualizer(AGENT_DATA.market, AGENT_DATA.active_trade);
    renderMetrics(AGENT_DATA.market, AGENT_DATA.active_trade);
    calculateOptimization(10000); // Initial calc
    startAlphaLoop(); // Start Continuous Intelligence
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

function openAlertWindow(data) {
    const w = window.open("", "AlphaAlert", "width=500,height=400,alwaysRaised=yes");
    if (w) {
        w.document.write(`
            <html><body style="background:#0a0b0e; color:#fff; font-family:sans-serif; text-align:center; padding:30px; border: 2px solid #ff0055;">
                <h1 style="color:#ff0055; font-size:2rem;">⚠️ ${data.type}</h1>
                <h3 style="color:#e0e0e0;">${data.headline}</h3>
                <p style="color:#b0b0b0;">${data.message}</p>
                <div style="margin-top:20px; font-size:3rem;">🦅</div>
            </body></html>
        `);
    }
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

function renderMetrics(market, trade) {
    document.getElementById('mmm-val').innerText = `+/- ${market.mmm}`;
    document.getElementById('pop-val').innerText = trade.metrics.pop;
    document.getElementById('dte-val').innerText = trade.dte;
}

function renderStrategy(trade) {
    const container = document.getElementById('active-strategy-container');
    const spx = AGENT_DATA.market.spx;
    const mmm = AGENT_DATA.market.mmm;

    // Create Legs HTML with DELTA and DISTANCE
    const legsHtml = trade.legs.map(leg => {
        let distInfo = "";
        if (leg.action === "Sell") {
            const dist = Math.abs(leg.strike - spx).toFixed(0);
            distInfo = `<span style="color: ${dist > mmm ? '#00ff9d' : '#ff0055'}; font-size: 0.75rem; margin-right: 8px;">(buffer: ${dist})</span>`;
        }

        return `
        <div class="leg">
            <label>${leg.action} ${leg.side}</label>
            <div style="display: flex; align-items: center;">
                ${distInfo}
                <span style="color: #64748b; font-size: 0.75rem; font-family: 'JetBrains Mono'; margin-right: 15px;">Δ ${leg.delta}</span>
                <span style="font-weight: 600; color: #ffcc00;">${leg.strike}</span>
            </div>
        </div>
    `}).join('');

    // Dynamic Buffer Rationale
    const shortCall = trade.legs.find(l => l.side === "Call" && l.action === "Sell");
    const shortPut = trade.legs.find(l => l.side === "Put" && l.action === "Sell");
    const callDist = (shortCall.strike - spx).toFixed(0);
    const putDist = (spx - shortPut.strike).toFixed(0);

    // Width Calculation
    const longCall = trade.legs.find(l => l.side === "Call" && l.action === "Buy");
    const longPut = trade.legs.find(l => l.side === "Put" && l.action === "Buy");
    const callWidth = Math.abs(shortCall.strike - longCall.strike);
    const putWidth = Math.abs(shortPut.strike - longPut.strike);

    const bufferNote = `<strong>Smart Skew Active:</strong><br>
    • Call Width: ${callWidth} pts (Standard)<br>
    • <span style="color: #00ff9d">Put Width: ${putWidth} pts (Widened)</span><br><br>
    <em>Why? Forecast probability > 70% Bullish. We widened the Put vertical to maximize credit capture on the advantaged side.</em>`;

    const html = `
        <div class="strategy-card">
            <div class="strategy-title">${trade.type}</div>
            <div style="font-size: 0.8rem; color: #8b9bb4; margin-bottom: 10px;">
                Exp: ${trade.expiration} | Status: <span style="color: #ffcc00">${trade.status}</span>
            </div>
            
            <div class="strategy-legs">
                ${legsHtml}
            </div>

            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div class="leg"><label>Est. Credit</label> <span style="color: #00ff9d">${trade.metrics.max_profit}</span></div>
                <div class="leg"><label>PoP</label> <span>${trade.metrics.pop}</span></div>
            </div>
        </div>

        <div class="alpha-insight">
            <div class="alpha-insight-header">
                <span class="icon">⚡</span> ALPHA INTELLIGENCE
            </div>
            <div class="alpha-insight-body">
                "${trade.thesis}"
                <br>
                <button onclick="openStrategyReport()" style="background: none; border: none; color: #00ff9d; text-decoration: underline; cursor: pointer; font-family: 'JetBrains Mono'; font-size: 0.7rem; margin-top: 8px; padding: 0;">>> OPEN TRADE STRATEGY REPORT</button>
                <br><br>
                ${bufferNote}
            </div>
        </div>

        <button class="action-btn" onclick="copyTrade()">COPY ORDER TO CLIPBOARD</button>
    `;

    container.innerHTML = html;
}

function openStrategyReport() {
    const reportWindow = window.open("", "StrategyReport", "width=600,height=800");
    const reportContent = AGENT_DATA.active_trade.thesis_full_report;

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
        // Add credit for extra width on Put side:
        // +25 width = +$0.60
        // +50 width = +$1.00
        // +75 width = +$1.30

        let baseCredit = 150;
        let extraCredit = 0;

        if (cfg.pW === 50) extraCredit = 60;
        if (cfg.pW === 75) extraCredit = 100;
        if (cfg.pW === 100) extraCredit = 130;

        const totalCredit = baseCredit + extraCredit; // e.g. 210 for 25/50

        // Margin Requirement is determined by the WIDEST leg - credit collected? 
        // Or strictly the max risk of the structure.
        // For IC, margin is usually Max(CallWidth, PutWidth) * 100 - Credit.

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
            <div style="background: rgba(0, 255, 157, 0.1); border: 1px solid #00ff9d; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.75rem; color: #00ff9d; font-weight: 700;">ALPHA SOLVER: MAX YIELD</div>
                    <div style="font-size: 0.7rem; color: #8b9bb4;">BIAS: ${direction.toUpperCase()} (${(AGENT_DATA.forecast.probability * 100).toFixed(0)}%)</div>
                </div>
                
                <div style="font-size: 0.8rem; color: #e0e0e0; margin-top: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                     <strong>Conviction:</strong> ${AGENT_DATA.forecast.conviction_summary}
                     <br>
                     <button onclick="openConvictionReport()" style="background: none; border: none; color: #00ff9d; text-decoration: underline; cursor: pointer; font-family: 'JetBrains Mono'; font-size: 0.7rem; margin-top: 4px; padding: 0;">>> OPEN FULL INTELLIGENCE REPORT</button>
                </div>

                <div style="font-size: 0.9rem; color: #e0e0e0; margin-top: 8px; line-height: 1.4;">
                    Optimal Config: <strong>Call ${bestConfig.cW}w / Put ${bestConfig.pW}w</strong>
                </div>
            </div>

            <div class="leg">
                <label>Rec. Contracts</label>
                <span style="font-size: 1.2rem; color: #fff; font-weight: 700;">${bestConfig.contracts}</span>
            </div>
            <div class="leg">
                <label>Total Exposure</label>
                <span>$${bestConfig.exposure.toLocaleString()}</span>
            </div>
            <div class="leg">
                <label>Max Profit</label>
                <span style="color: #ffcc00; font-weight: 700;">$${bestConfig.profit.toLocaleString()}</span>
            </div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 8px; font-style: italic;">
                *Solver maximized profit by utilizing 100% of capital on the asymmetric ${bestConfig.cW}/${bestConfig.pW} structure.
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

    // Calculate percentages for visual bars (simplified)
    const rangeStart = 6700;
    const rangeTotal = 500;

    // Safety clamp (0-100) logic implied
    const curPct = Math.max(0, Math.min(100, ((market.spx - rangeStart) / rangeTotal) * 100));
    const callPct = Math.max(0, Math.min(100, ((trade.legs[0].strike - rangeStart) / rangeTotal) * 100));
    const putPct = Math.max(0, Math.min(100, ((trade.legs[2].strike - rangeStart) / rangeTotal) * 100));

    container.innerHTML = `
        <div style="position: relative; height: 100%; min-height: 300px; background: rgba(0,0,0,0.2); border-left: 1px solid #333; border-bottom: 1px solid #333; margin: 20px;">
            <!-- Current Price -->
            <div style="position: absolute; bottom: ${curPct}%; left: 0; width: 100%; border-bottom: 2px dashed #00ff9d;">
                <span style="position: absolute; right: 0; bottom: 2px; color: #00ff9d; font-size: 0.7rem; font-family: 'JetBrains Mono';">CURRENT: ${market.spx}</span>
            </div>

            <!-- Call Wall -->
            <div style="position: absolute; bottom: ${callPct}%; left: 0; width: 100%; height: ${100 - callPct}%; background: rgba(255, 0, 85, 0.1); border-bottom: 2px solid #ff0055;">
                <span style="position: absolute; left: 10px; bottom: 5px; color: #ff0055; font-size: 0.7rem; font-weight: bold;">SHORT CALL: ${trade.legs[0].strike} (Δ${trade.legs[0].delta})</span>
            </div>

            <!-- Put Wall -->
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: ${putPct}%; background: rgba(255, 0, 85, 0.1); border-top: 2px solid #ff0055;">
                <span style="position: absolute; left: 10px; top: 5px; color: #ff0055; font-size: 0.7rem; font-weight: bold;">SHORT PUT: ${trade.legs[2].strike} (Δ${trade.legs[2].delta})</span>
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
            if (text.toLowerCase().includes("simulate war")) {
                const event = ALPHA_FEED.injectEvent("WAR_ESCALATION");
                const result = ALPHA_BRAIN.processEvent(event, AGENT_DATA.active_trade);
                response = result ? result.message : "Event logged.";

                // TRIGGER DESKTOP ALERT
                if (result) triggerDesktopAlert({
                    type: "CRITICAL ALERT",
                    headline: event.headline,
                    message: "Thesis Invalidated. Immediate Exit Recommended."
                });
            }
            else if (text.toLowerCase().includes("simulate fed")) {
                const event = ALPHA_FEED.injectEvent("FED_HAWKISH");
                const result = ALPHA_BRAIN.processEvent(event, AGENT_DATA.active_trade);
                response = result ? result.message : "Event logged.";

                // TRIGGER DESKTOP ALERT
                if (result) triggerDesktopAlert({
                    type: "OPPORTUNITY",
                    headline: event.headline,
                    message: "New Short Setup available."
                });
            }
            else if (text.toLowerCase().includes("simulate crash")) {
                // Custom "Black Swan" injection
                const event = { type: "MACRO", headline: "Flash Crash: SPX down 3% in minutes.", severity: "CRITICAL", impact_score: -10 };
                const result = ALPHA_BRAIN.processEvent(event, AGENT_DATA.active_trade);
                response = result ? result.message : "Alert sent.";
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
            appendMessage('agent', response);
        }, 1000); // Reduced latency for snappy feel
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
}

function copyTrade() {
    alert("Order copied to clipboard: UNBALANCED IC SPX... [Full Chain]");
}
