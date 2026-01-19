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
    startArbitrageScanner(); // Start "Extra Profit" Scanner immediately
    startEventScanner(); // Start Macro Risk Scanner
    startSkewScanner(); // Start Skew Optimization Scanner
    startDataBridge(); // Start Python Bridge Polling
    requestNotificationPermission(); // Ask user for permission
}

// PYTHON BRIDGE CONNECTION
function startDataBridge() {
    console.log("ALPHA: Attempting to connect to Python Data Bridge...");
    setInterval(async () => {
        try {
            const response = await fetch('http://localhost:5000/market_data');
            if (response.ok) {
                const data = await response.json();

                if (data.spx !== AGENT_DATA.market.spx) {
                    console.log(`BRIDGE: New Data Received. SPX: ${data.spx}`);

                    // FIRST LOAD: Generate Initial Strategy if none exists
                    const isFirstLoad = AGENT_DATA.market.spx === 0;

                    // Update Agent Data
                    AGENT_DATA.market.spx = data.spx;
                    AGENT_DATA.market.vix = data.vix;
                    if (data.bias) AGENT_DATA.forecast.direction = data.bias;
                    if (data.trend) AGENT_DATA.market.trend = data.trend; // New Trend Data

                    // GENERATE LIVE STRATEGY (The "Alpha Brain" moment)
                    if (isFirstLoad) {
                        generateLiveRecommendation(AGENT_DATA.market);
                    }

                    // PROCESS EVENTS (Real News from Bridge)
                    try {
                        if (data.events && data.events.length > 0) {
                            data.events.forEach(event => {
                                // Pass through Alpha Brain
                                const brainResult = ALPHA_BRAIN.processEvent(event, AGENT_DATA.active_trade);
                                if (brainResult && brainResult.type !== "INFO") {
                                    showInAppAlert(brainResult.type, `MARKET NEWS: ${event.source}`, brainResult.message);
                                    appendMessage('agent', `📰 <strong>News Detected:</strong> ${event.headline}<br>${brainResult.message}`);
                                }
                            });
                        }
                    } catch (err) {
                        console.error("ALPHA: Event Processing Error", err);
                    }

                    // Update UI
                    const spxEl = document.getElementById('ticker-spx');
                    const vixEl = document.getElementById('ticker-vix');

                    if (spxEl) {
                        spxEl.innerText = data.spx.toFixed(2);
                        spxEl.style.color = "#00ff9d"; // Live Indicator
                    }
                    if (vixEl) vixEl.innerText = data.vix.toFixed(2);

                    // Update Inputs
                    const inputSpx = document.getElementById('input-spx');
                    const inputVix = document.getElementById('input-vix');
                    const inputBias = document.getElementById('input-bias');

                    if (inputSpx) inputSpx.value = data.spx;
                    if (inputVix) inputVix.value = data.vix;
                    if (inputBias && data.bias) inputBias.value = data.bias;

                    // Trigger Calculation
                    calculateOptimization(parseFloat(document.getElementById('capital-input')?.value) || 10000);
                }
            }
        } catch (e) {
            // Bridge not running, silent fail (Manual Mode takes over)
            // console.log("Bridge offline, using manual/simulated data.");
        }
    }, 5000); // Poll every 5 seconds
}

// REAL DATA UPDATE LOGIC
window.updateMarketData = function () {
    const spx = parseFloat(document.getElementById('input-spx').value);
    const vix = parseFloat(document.getElementById('input-vix').value);
    const bias = document.getElementById('input-bias').value;

    if (spx && vix) {
        // Update Agent Data
        AGENT_DATA.market.spx = spx;
        AGENT_DATA.market.vix = vix;
        AGENT_DATA.forecast.direction = bias;

        // Update UI IDs if they match new IDs
        document.getElementById('ticker-spx').innerText = spx.toFixed(2);
        document.getElementById('ticker-vix').innerText = vix.toFixed(2);

        // Smart Recalculation
        alert(`ALPHA UPDATED: Market Data Ingested (SPX ${spx}). Recalculating Strategy...`);

        // Update Strike Selection based on new SPX (Simulated logic for now, but dynamic)
        // e.g. If SPX moves up, move strikes up.
        // For this demo, we just trigger the re-render which uses the new market data for the Visualizer.

        renderVisualizer(AGENT_DATA.market, AGENT_DATA.active_trade);
        calculateOptimization(parseFloat(document.getElementById('capital-input').value) || 10000);

        // Note: Real strike updates would require backend, but Visualizer will align with new SPX.
    }
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

// GLOBAL STATE FOR PREVIEW
let PENDING_UPGRADE = null;
let ORIGINAL_TRADE_BACKUP = null;

function showInAppAlert(type, headline, messageOrData) {
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

    const color = type.includes("CRITICAL") ? "#ff0055" : (messageOrData.upgradeData && messageOrData.upgradeData.isSkew ? "#bf00ff" : "#00ff9d");
    let contentHtml = "";

    // CHECK IF THIS IS A STRUCTURED UPGRADE ALERT
    if (messageOrData.upgradeData) {
        const data = messageOrData.upgradeData;
        PENDING_UPGRADE = data; // Store for preview

        let headerLabel = "NET IMPROVEMENT";
        if (data.isProtection) headerLabel = "PROTECTION COST";
        if (data.isSkew) headerLabel = "SKEW EFFICIENCY";

        contentHtml = `
            <div style="background: #0a0b0e; border: 2px solid ${color}; padding: 30px; max-width: 600px; text-align: left; box-shadow: 0 0 50px ${color}44; font-family: 'Inter', sans-serif;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:15px; margin-bottom:15px;">
                    <h1 style="color: ${color}; font-family: 'JetBrains Mono'; margin: 0; font-size: 1.5rem;">${headline}</h1>
                    <div style="text-align:right;">
                        <span style="display:block; font-size:0.7rem; color:#8b9bb4;">${headerLabel}</span>
                        <span style="font-size:1.2rem; color:${data.isProtection ? "#ffcc00" : color}; font-weight:bold;">${data.isProtection ? "-" : "+"}$${Math.abs(data.netProfit)}</span>
                    </div>
                </div>
// ... (rest is same) ...

// New Scanner for "Skew Hunter"
function startSkewScanner() {
    console.log("ALPHA: Skew Hunter Active.");
    setInterval(() => {
        // Stop scanning if simulation active
        if (AGENT_DATA.active_trade.status === 'SIMULATING_UPGRADE') return;

        const skewOpp = ALPHA_BRAIN.scanForSkew(AGENT_DATA.active_trade, AGENT_DATA.market);
        
        if (skewOpp) {
             showInAppAlert(skewOpp.type, skewOpp.headline, skewOpp);
             appendMessage('agent', skewOpp.message);
        }
    }, 12000); // Check every 12s
}

// ... (existing loops) ...

                <p style="color: #e0e0e0; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px;">
                    ${messageOrData.message.split("<br>")[0]}
                </p>

                <div style="background: #1e293b; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <div style="font-size: 0.75rem; color: #8b9bb4; margin-bottom: 10px; font-weight:bold;">EXECUTION PLAN:</div>
                    <table style="width:100%; border-collapse: collapse; font-size: 0.8rem; font-family: 'JetBrains Mono';">
                        <tr style="color: #64748b; text-align: left;">
                            <th style="padding-bottom:5px;">ACTION</th>
                            <th style="padding-bottom:5px;">QTY</th>
                            <th style="padding-bottom:5px;">LEG</th>
                        </tr>
                        ${data.instructions.map(inst => `
                            <tr>
                                <td style="color: ${inst.action.includes("BUY") ? "#ffcc00" : "#ff0055"}; padding: 4px 0;">${inst.action}</td>
                                <td style="color: #fff; padding: 4px 0;">${inst.quantity}</td>
                                <td style="color: #fff; padding: 4px 0;">${inst.leg}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="document.getElementById('alpha-alert-overlay').remove()" 
                            style="background: transparent; border: 1px solid #333; color: #8b9bb4; padding: 10px 20px; cursor: pointer;">
                        DISMISS
                    </button>
                    <button onclick="previewTradeUpgrade()" 
                            style="background: ${color}; color: #000; border: none; padding: 10px 25px; font-weight: bold; cursor: pointer; box-shadow: 0 0 15px ${color}66;">
                        PREVIEW & EDIT
                    </button>
                </div>
            </div>
        `;
    } else {
        // STANDARD ALERT (Keep existing)
        contentHtml = `
            <div style="background: #0a0b0e; border: 2px solid ${color}; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 0 50px ${color}44;">
                <h1 style="color: ${color}; font-family: 'JetBrains Mono'; margin: 0 0 10px 0;">⚠️ ${type}</h1>
                <h3 style="color: #fff; margin: 0 0 20px 0;">${headline}</h3>
                <p style="color: #b0b0b0; font-size: 1.1rem;">${messageOrData}</p>
                <button onclick="document.getElementById('alpha-alert-overlay').remove()" 
                        style="background: ${color}; color: #000; border: none; padding: 12px 30px; font-weight: bold; margin-top: 20px; cursor: pointer;">
                    ACKNOWLEDGE
                </button>
            </div>
        `;
    }

    overlay.innerHTML = contentHtml;
    document.body.appendChild(overlay);
}

// ... (keep preview/commit/cancel logic) ...

// New Scanner for "Skew Hunter"
function startSkewScanner() {
    console.log("ALPHA: Skew Hunter Active.");
    setInterval(() => {
        // Stop scanning if simulation active
        if (!AGENT_DATA.active_trade || AGENT_DATA.active_trade.status === 'SIMULATING_UPGRADE') return;

        const skewOpp = ALPHA_BRAIN.scanForSkew(AGENT_DATA.active_trade, AGENT_DATA.market);

        if (skewOpp) {
            showInAppAlert(skewOpp.type, skewOpp.headline, skewOpp);
            appendMessage('agent', skewOpp.message);
        }
    }, 12000); // Check every 12s
}

// ... (existing startEventScanner) ...
// Scanner for "Event Horizon" (Risk)
function startEventScanner() {
    console.log("ALPHA: Event Shield Scanner Active.");
    setInterval(() => {
        // Stop scanning if simulation active
        if (AGENT_DATA.active_trade.status === 'SIMULATING_UPGRADE') return;

        const risk = ALPHA_BRAIN.scanForEventRisk(AGENT_DATA.active_trade, AGENT_DATA.market);

        if (risk) {
            // Priority Alert
            showInAppAlert(risk.type, risk.headline, risk);
            appendMessage('agent', risk.message);
        }
    }, 15000); // Check every 15s
}

// ... (existing startArbitrageScanner) ...

// SIMULATION / PREVIEW LOGIC
window.previewTradeUpgrade = function () {
    if (!PENDING_UPGRADE) return;

    // 1. Close Modal
    document.getElementById('alpha-alert-overlay').remove();

    // 2. Backup Current State
    ORIGINAL_TRADE_BACKUP = JSON.parse(JSON.stringify(AGENT_DATA.active_trade));

    // 3. Apply Upgrade to Active State (TEMPORARY)
    AGENT_DATA.active_trade.actual_legs = PENDING_UPGRADE.newLegs;
    AGENT_DATA.active_trade.status = 'SIMULATING_UPGRADE';

    // 4. Force Render
    // (This triggers the "Comparison View", effectively showing the "New Scenario")
    calculateOptimization(parseFloat(document.getElementById('capital-input').value) || 10000);
    renderStrategy(AGENT_DATA.active_trade);
    renderVisualizer(AGENT_DATA.market, AGENT_DATA.active_trade);

    // 5. Show "COMMIT" Floating Panel
    showCommitPanel();

    console.log("ALPHA: Entering Simulation Mode.");
    appendMessage('agent', "I have loaded the <strong>Proposed Upgrade</strong> into the dashboard. You can tweak the strikes or contracts now. <br>Click <strong>CONFIRM UPGRADE</strong> to execute.");
}

function showCommitPanel() {
    const existing = document.getElementById('commit-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'commit-panel';
    panel.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        background: #0f172a; border: 1px solid #00ff9d; padding: 20px; 
        border-radius: 8px; box-shadow: 0 0 30px rgba(0,255,157,0.2);
        z-index: 999; display: flex; flex-direction: column; gap: 10px;
        animation: slideUp 0.3s ease;
    `;

    panel.innerHTML = `
        <div style="font-size: 0.8rem; color: #00ff9d; font-weight: bold; font-family: 'JetBrains Mono';">
            MODE: SIMULATION
        </div>
        <div style="font-size: 0.7rem; color: #b0b0b0;">
            Reviewing Trade Upgrade.<br>Edit inputs directly in the dashboard.
        </div>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button onclick="cancelUpgrade()" style="background: transparent; border: 1px solid #ff0055; color: #ff0055; padding: 5px 10px; cursor: pointer; font-size: 0.7rem;">DISCARD</button>
            <button onclick="commitUpgrade()" style="background: #00ff9d; border: none; color: #000; padding: 5px 15px; font-weight: bold; cursor: pointer; font-size: 0.7rem;">CONFIRM UPGRADE</button>
        </div>
    `;
    document.body.appendChild(panel);
}

window.commitUpgrade = function () {
    // 1. Finalize State
    AGENT_DATA.active_trade.status = 'LIVE';
    saveState();

    // 2. Cleanup UI
    document.getElementById('commit-panel').remove();
    PENDING_UPGRADE = null;
    ORIGINAL_TRADE_BACKUP = null;

    // 3. Feedback
    renderStrategy(AGENT_DATA.active_trade);
    calculateOptimization(parseFloat(document.getElementById('capital-input').value) || 10000); // Refreshes Tracker

    appendMessage('agent', "✅ <strong>ORDER PLACED.</strong> New structure is active and being monitored.");
    triggerDesktopAlert({ type: "SUCCESS", headline: "Trade Adjusted", message: "Portfolio updated successfully." });
}

window.cancelUpgrade = function () {
    if (ORIGINAL_TRADE_BACKUP) {
        AGENT_DATA.active_trade = ORIGINAL_TRADE_BACKUP;
        renderStrategy(AGENT_DATA.active_trade);
        calculateOptimization(parseFloat(document.getElementById('capital-input').value) || 10000);
        renderVisualizer(AGENT_DATA.market, AGENT_DATA.active_trade);
    }
    document.getElementById('commit-panel').remove();
    PENDING_UPGRADE = null;
    ORIGINAL_TRADE_BACKUP = null;
    appendMessage('user', "I discarded the proposed upgrade.");
    appendMessage('agent', "Understood. Resuming monitoring of original position.");
}




// New Scanner for "Extra Profit"
function startArbitrageScanner() {
    console.log("ALPHA: Arbitrage Scanner Active.");
    setInterval(() => {
        // Stop scanning if we are in the middle of a simulation
        if (AGENT_DATA.active_trade.status === 'SIMULATING_UPGRADE') return;

        // Brain Logic
        const opportunity = ALPHA_BRAIN.scanForArbitrage(AGENT_DATA.active_trade);

        if (opportunity) {
            // DIFFERENTIATE ALERT TYPES via Object check
            if (opportunity.upgradeData) {
                showInAppAlert("TRADE UPGRADE", opportunity.headline, opportunity);
                appendMessage('agent', opportunity.message);
            } else {
                const alertType = opportunity.type === "BETTER_ENTRY" ? "OPPORTUNITY" : "TRADE UPGRADE";
                showInAppAlert(alertType, opportunity.headline, opportunity.message);
                appendMessage('agent', opportunity.message);
            }
        }
    }, 10000); // Scan every 10 seconds for demo
}

function renderMetrics(market, trade) {
    document.getElementById('mmm-val').innerText = `+/- ${market.mmm}`;
    document.getElementById('pop-val').innerText = trade.metrics.pop;
    document.getElementById('dte-val').innerText = trade.dte;
}

function renderStrategy(trade) {
    const container = document.getElementById('optimization-results').parentElement.querySelector("#active-strategy-container") || document.getElementById('active-strategy-container');
    const spx = AGENT_DATA.market.spx;

    // ACTUAL CONFIG CALCULATION
    const activeLegs = trade.actual_legs || trade.legs;
    const putWidth = Math.abs(activeLegs[2].strike - activeLegs[3].strike);
    const callWidth = Math.abs(activeLegs[0].strike - activeLegs[1].strike);

    // Determine Aggression for ACTUAL column
    let aggressionLabel = "Standard";
    let aggressionColor = "#00ff9d";

    if (putWidth > 25) {
        aggressionLabel = "Aggressive (High Skew)";
        aggressionColor = "#ff0055";
    }

    // Expiration Recommendation Logic
    const recExpiration = getRecommendedExpiration();
    const expiration = trade.expiration || recExpiration; // Default to recommended if null

    let html = `
    <div class="strategy-card">
        <div class="strategy-title">
            ${trade.type} 
            <span style="font-size: 0.6em; float: right; color: ${trade.status === 'LIVE' ? '#00ff9d' : '#ffcc00'}">
                ${trade.status}
                ${trade.status === 'LIVE' ? '<span class="pulse">●</span>' : '<span class="blink">SCANNING...</span>'}
            </span>
        </div>
        
        <!-- EXPIRATION ROW -->
        <div style="font-size: 0.75rem; color: #b0b0b0; margin-bottom: 12px; font-family: 'JetBrains Mono'; border-bottom: 1px solid #333; padding-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <span style="color:#64748b; font-size:0.7rem;">RECOMMENDED:</span> <span style="color:#00ff9d; font-weight:bold;">${recExpiration}</span>
            </div>
            <div style="display: flex; gap: 10px;">
                <div>
                   <span style="color:#64748b; font-size:0.7rem;">EXP:</span>
                   <input type="text" value="${expiration}" 
                       style="background: #1e293b; border: 1px solid #333; color: #fff; padding: 2px 6px; font-family: 'JetBrains Mono'; width: 80px;"
                       onchange="updateActualExpiration(this.value)"> 
                </div>
                <div>
                   <span style="color:#64748b; font-size:0.7rem;">QTY:</span>
                   <input type="number" value="${trade.actual_contracts || 0}" 
                       id="actual-contracts-input"
                       style="background: #1e293b; border: 1px solid #333; color: #fff; padding: 2px 6px; font-family: 'JetBrains Mono'; width: 50px;"
                       onchange="updateActualContracts(this.value)"> 
                </div>
            </div>
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
                       onchange="updateActualStrike(${index}, this.value)"
                >
            </div>
            <div style="color: #64748b; font-family: 'JetBrains Mono';">${leg.delta}</div>
        </div>
    `}).join('');

    html += legsHtml;

    // Aggression Meter for ACTUAL
    html += `
        <div style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.02); border-left: 2px solid ${aggressionColor}; font-size: 0.75rem;">
            <span style="color: #64748b;">Actual Aggression:</span> 
            <span style="color: ${aggressionColor}; font-weight: bold; margin-left: 5px;">${aggressionLabel}</span>
            <br>
            <span style="font-size: 0.65em; color: #555;">(Based on ${putWidth}w Put / ${callWidth}w Call)</span>
        </div>
    `;

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

    if (container) container.innerHTML = html;
}

// Helper to calc best expiration (Next Friday > 3 days away)
function getRecommendedExpiration() {
    const today = new Date();
    // Logic: Find next Friday. If next Friday is < 3 days, skip to next.
    // Standard IC DTE is ~30-45, but this is an "Alpha" active trader.
    // Let's target 7-14 days DTE.

    let target = new Date(today);
    target.setDate(today.getDate() + 7); // Start 1 week out

    // Adjust to Friday
    const day = target.getDay();
    const diff = 5 - day; // 5 is Friday
    target.setDate(target.getDate() + diff);

    // Formatting: "Jan 19, 2026"
    // Use user locale or hardcode 'en-US'
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return target.toLocaleDateString('en-US', options);
}

// Logic to handle "Actual" updates
window.updateActualContracts = function (val) {
    if (!val) return;
    const qty = parseInt(val);
    AGENT_DATA.active_trade.actual_contracts = qty;
    console.log("Updated Actual Contracts:", qty);
    saveState();

    // Trigger Recalc of Optimizer to show Used Capital
    calculateOptimization(parseFloat(document.getElementById('capital-input').value) || 10000);
}


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
    // Re-render strategy to update aggression labels
    renderStrategy(AGENT_DATA.active_trade);

    // Trigger Optimizer Recalc (Widths might have changed)
    calculateOptimization(parseFloat(document.getElementById('capital-input').value) || 10000);
}

window.updateActualExpiration = function (val) {
    if (!val) return;
    AGENT_DATA.active_trade.expiration = val;
    console.log("Updated Expiration:", val);
    saveState();
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

    // Auto-set contracts if 0 (Simulate fill based on capital)
    if (!AGENT_DATA.active_trade.actual_contracts || AGENT_DATA.active_trade.actual_contracts === 0) {
        // Default to what optimizer said was 'best' - we'll just grab from the DOM or calc
        // For now, let's just prompt user or set to 10
        AGENT_DATA.active_trade.actual_contracts = 10;
        document.getElementById('actual-contracts-input').value = 10;
    }

    alert("ORDER CONFIRMED. Switching to LIVE MONITORING. Alpha is now scanning for Arbitrage opportunities.");
    renderStrategy(AGENT_DATA.active_trade);

    // Start the Arbitrage Scanner
    startArbitrageScanner();
}


function openStrategyReport() {
    const reportWindow = window.open("", "StrategyReport", "width=600,height=800");
    const trade = AGENT_DATA.active_trade;
    const market = AGENT_DATA.market;

    // Calculate Metrics
    const recMetrics = calculateTradeMetrics(trade.legs, trade.actual_contracts || 10, market);
    const actMetrics = calculateTradeMetrics(trade.actual_legs || trade.legs, trade.actual_contracts || 10, market);
    const activeLegs = trade.actual_legs || trade.legs;

    // Generate Management Plan (EXACT INSTRUCTIONS)
    // We mock the "next week" date for rolling
    const today = new Date();
    const nextExp = new Date(today);
    nextExp.setDate(today.getDate() + 7);
    const nextExpStr = nextExp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const reportContent = `
        <h1>Alpha Strategy Intelligence</h1>
        <div style="font-size: 0.8rem; color: #8b9bb4; margin-bottom: 20px;">
            REPORT GENERATED: ${new Date().toLocaleTimeString()} | THESIS: ${AGENT_DATA.forecast.direction}
        </div>

        <h3>1. Alpha Rationale (The "Why")</h3>
        <p>
            I recommended this <strong>Iron Condor</strong> structure because the market is exhibiting 
            <strong>${AGENT_DATA.market.vix > 20 ? 'High Volatility' : 'Normal Volatility'}</strong> with a 
            <strong>${AGENT_DATA.forecast.direction}</strong> bias.
        </p>
        <p>
            The selected Short Strikes (${trade.legs[2].strike} / ${trade.legs[0].strike}) were chosen to sit 
            outside the expected "Market Maker Move" range, theoretically offering a <strong>${recMetrics.pop} Probability of Success</strong>.
        </p>
        <hr>

        <h3>2. Deviation Analysis (Rec vs Actual)</h3>
        ${actMetrics.popVal < recMetrics.popVal - 0.05 ?
            `<p style="color: #ff0055; border-left: 3px solid #ff0055; padding-left: 10px;">
                <strong>⚠️ RISK ALERT:</strong> You have deviated significantly from the safe zone. 
                Your Probability of Profit has dropped to <strong>${actMetrics.pop}</strong> (vs ${recMetrics.pop} recommended).
                You are accepting higher Gamma risk for a potential profit increase of $${(actMetrics.maxProfit - recMetrics.maxProfit).toFixed(0)}.
            </p>` :
            `<p style="color: #00ff9d;">
                <strong>✅ ALIGNMENT CONFIRMED:</strong> Your actual execution aligns well with the optimal math. 
                PoP is stable at <strong>${actMetrics.pop}</strong>.
            </p>`
        }
        <hr>

        <h3>3. Execution Profile</h3>
        <ul>
            <li><strong>Actual Contracts:</strong> ${trade.actual_contracts || "--"}</li>
            <li><strong>Max Risk:</strong> $${actMetrics.maxRisk.toLocaleString()}</li>
            <li><strong>Max Profit:</strong> $${actMetrics.maxProfit.toLocaleString()}</li>
            <li><strong>Break Even:</strong> ${activeLegs[2].strike - actMetrics.credit} / ${activeLegs[0].strike + parseFloat(actMetrics.credit)}</li>
        </ul>
        <hr>

        <h3>4. Management Plan (Cadence Protocol)</h3>
        <p><strong>PROFIT TAKING:</strong></p>
        <ul>
            <li>Close entire position at <strong>50% Max Profit</strong> ($${(actMetrics.maxProfit * 0.5).toFixed(0)}).</li>
        </ul>

        <p><strong>DEFENSE (ROLLING & OPPORTUNITY COST):</strong></p>
        <ul>
            <li>
                <strong>IF SPX Touches ${activeLegs[2].strike} (Put Side):</strong><br>
                ROLL [Short Put ${activeLegs[2].strike}] → [Short Put ${activeLegs[2].strike - 25}] (Same Exp).<br>
                <em>Target Credit: Receive $0.20 or Pay max $0.10 debit.</em>
            </li>
            <li style="margin-top:10px;">
                <strong>IF TESTING CONTINUES > 2 Days:</strong><br>
                <!-- CADENCE PROTOCOL LOGIC -->
                <strong>CADENCE CHECK:</strong> Rolling to ${nextExpStr} disrupts the Monday Entry Cycle.<br>
                <em>Formula: NewCredit vs (CurrentLoss + MissedMondayOppCost)</em><br><br>
                <strong>RECOMMENDATION:</strong> <span style="color:${actMetrics.maxProfit > 500 ? '#00ff9d' : '#ff0055'}">
                ${actMetrics.maxProfit > 500 ? 'ROLL ALLOWED' : 'DO NOT ROLL - CLOSE TRADE'}</span>.<br>
                ${actMetrics.maxProfit <= 500 ? 'Projected roll credit does not exceed Opportunity Cost of missing next Monday\'s entry. Take loss and reset.' : 'Volatility premium is high enough to justify breaking the weekly cadence.'}
            </li>
        </ul>

        <hr>
        <p><em>Alpha Intelligence Engine v2.2 (Cadence Protocol Active)</em></p>
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

function calculateOptimization(capital, autoUpdateQty = false) {
    const container = document.getElementById('optimization-results');
    const direction = AGENT_DATA.forecast.direction;
    const trade = AGENT_DATA.active_trade;
    const market = AGENT_DATA.market;

    // Ensure actual_legs exists
    if (!trade.actual_legs) {
        trade.actual_legs = JSON.parse(JSON.stringify(trade.legs));
    }

    // 1. Get Metrics for RECOMMENDED
    const recMetrics = calculateTradeMetrics(trade.legs, trade.actual_contracts || 10, market);

    // 2. Get Metrics for ACTUAL (User Input)
    const activeLegs = trade.actual_legs || trade.legs;
    const actMetrics = calculateTradeMetrics(activeLegs, trade.actual_contracts || 10, market);

    // DANGER CHECK
    const riskIncrease = (actMetrics.popVal < recMetrics.popVal - 0.05);
    const isDangerous = riskIncrease || (actMetrics.putWidth < 20);

    // RENDER COMPARISON VIEW
    const isModified = JSON.stringify(trade.legs) !== JSON.stringify(trade.actual_legs) || (trade.actual_contracts && trade.actual_contracts > 0);

    if ((isModified || trade.status === 'LIVE') && !autoUpdateQty) {
        const diffProfit = actMetrics.maxProfit - recMetrics.maxProfit;
        const diffRisk = actMetrics.maxRisk - recMetrics.maxRisk;

        container.innerHTML = `
            <div style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
                ${isDangerous ? `
                <div class="blink" style="background: rgba(255, 0, 85, 0.2); border: 1px solid #ff0055; padding: 8px; border-radius: 4px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.2rem;">⚠️</span>
                    <div style="font-size: 0.75rem; color: #ff0055; font-weight: bold;">
                        HIGH RISK DETECTED<br>
                        <span style="font-weight: normal; color: #e0e0e0;">Probability of Profit dropped by ${(recMetrics.popVal * 100 - actMetrics.popVal * 100).toFixed(0)}%. Thesis may be compromised.</span>
                    </div>
                </div>` : ''}

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                     <div style="font-size: 0.75rem; color: #00ff9d; font-weight: 700;">ALPHA TRACKER: RECOMMENDATION vs ACTUAL</div>
                     ${trade.status === 'LIVE' ? '<span style="font-size: 0.65rem; color: #00ff9d; border: 1px solid #00ff9d; padding: 1px 4px; border-radius: 4px;">LIVE TRACKING</span>' : ''}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.75rem;">
                    <div style="opacity: 0.6;">
                        <div style="color: #64748b; margin-bottom: 4px; font-size: 0.65rem;">RECOMMENDED</div>
                        <div style="border-left: 2px solid #00ff9d; padding-left: 8px;">
                            <div>Profit: <span style="color:#fff;">$${recMetrics.maxProfit.toLocaleString()}</span></div>
                            <div>Risk: <span style="color:#fff;">$${recMetrics.maxRisk.toLocaleString()}</span></div>
                            <div>PoP: <span style="color:#00ff9d;">${recMetrics.pop}</span></div>
                        </div>
                    </div>

                    <div>
                        <div style="color: #64748b; margin-bottom: 4px; font-size: 0.65rem;">YOUR PORTFOLIO</div>
                        <div style="border-left: 2px solid ${isDangerous ? '#ff0055' : '#ffcc00'}; padding-left: 8px;">
                            <div>Profit: <span style="color:#fff; font-weight:bold;">$${actMetrics.maxProfit.toLocaleString()}</span> 
                                <span style="font-size:0.7em; color: ${diffProfit >= 0 ? '#00ff9d' : '#ff0055'}">(${diffProfit >= 0 ? '+' : ''}${diffProfit.toFixed(0)})</span>
                            </div>
                            <div>Risk: <span style="color:#fff;">$${actMetrics.maxRisk.toLocaleString()}</span>
                                <span style="font-size:0.7em; color: ${diffRisk > 0 ? '#ff0055' : '#00ff9d'}">(${diffRisk > 0 ? '+' : ''}${diffRisk.toFixed(0)})</span>
                            </div>
                            <div>PoP: <span style="color:${isDangerous ? '#ff0055' : '#ffcc00'}; font-weight:bold;">${actMetrics.pop}</span></div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 10px; font-size: 0.7rem; color: #8b9bb4; border-top: 1px dotted #333; padding-top: 5px;">
                    <strong>ALPHA ANALYSIS:</strong> ${generateAlphaCommentary(recMetrics, actMetrics)}
                </div>
            </div>
        `;
        return;
    }

    // OLD LOGIC (Kept but unreachable if conditions meet above)
    // IF LIVE OR MANUAL ENTRY DETECTED, SHOW ACTUAL METRICS
    // We prioritize the "Actuals" view if the user has started entering data.
    if ((trade.status === 'LIVE' || (trade.actual_contracts && trade.actual_contracts > 0))) {

        // Calculate based on Actuals
        const activeLegs = trade.actual_legs || trade.legs;
        const putWidth = Math.abs(activeLegs[2].strike - activeLegs[3].strike);
        const callWidth = Math.abs(activeLegs[0].strike - activeLegs[1].strike);

        // Accurate Margin Calculation for Iron Condor (Max Width * 100) - Credit
        // We assume a standard credit estimate if not tracked (~$1.50)
        const maxWidth = Math.max(putWidth, callWidth);
        const estimatedCredit = 150;
        const marginPerContract = (maxWidth * 100) - estimatedCredit;

        const totalExposure = (trade.actual_contracts || 0) * marginPerContract;
        const utilization = capital > 0 ? (totalExposure / capital) * 100 : 0;

        container.innerHTML = `
            <div style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
                <div style="background: rgba(0, 255, 157, 0.1); border: 1px solid #00ff9d; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 0.75rem; color: #00ff9d; font-weight: 700;">ALPHA TRACKER: PORTFOLIO MODEL</div>
                        <div style="font-size: 0.7rem; color: #8b9bb4;">USED: ${utilization.toFixed(1)}%</div>
                    </div>
                    
                    <div style="font-size: 0.8rem; color: #e0e0e0; margin-top: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                         <strong>Structure:</strong> ${putWidth}pt / ${callWidth}pt Iron Condor
                         <br>
                         <strong>Contracts:</strong> <span style="color:#fff; font-size:1.1em; font-weight:bold;">${trade.actual_contracts}</span>
                         <br>
                         <strong>Total Risk:</strong> <span style="color:#ffcc00">$${totalExposure.toLocaleString()}</span>
                    </div>
                    <div style="font-size: 0.65rem; color: #64748b; margin-top: 4px; font-family: 'JetBrains Mono';">
                        BASED ON ACTUAL INPUTS
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // CONFIGURATIONS GENERATOR
    // User Requirement: "Decide width to utilize all availability"

    // We test widths from 25 up to 100 (stepped) to find the absolute best EV/Profit combo.
    let configs = [];

    // Test widths: 25, 30, 40, 50, 60, 75, 100
    [25, 30, 40, 50, 60, 75, 100].forEach(w => {
        // Aggression: 0 (Safe), 1 (Aggressive)
        [0, 1].forEach(a => {
            configs.push({ pW: w, cW: 25, aggression: a });
        });
    });

    // Initialize bestConfig with safe defaults to prevent render crash
    let bestConfig = {
        score: -Infinity,
        desc: "Initializing...",
        winRate: 0,
        contracts: 0,
        exposure: 0,
        profit: 0,
        cW: 25,
        pW: 25,
        unitCredit: 0,
        aggression: 0
    };

    configs.forEach(cfg => {
        // 1. CREDIT ESTIMATION
        let credit = 150;

        // Dynamic Credit Scaling
        if (cfg.pW > 25) {
            const extraWidth = cfg.pW - 25;
            credit += (extraWidth * 4);
        }

        // Aggression Bonus
        if (cfg.aggression === 1) credit += 100;

        // 2. RISK & CAPITAL
        const maxWidth = Math.max(cfg.cW, cfg.pW);
        const marginPerContract = (maxWidth * 100) - credit;

        // Skip invalid
        if (marginPerContract > capital || marginPerContract <= 0) return;

        const contracts = Math.floor(capital / marginPerContract);
        if (contracts <= 0) return;

        // 3. EXPECTED VALUE (EV)
        const totalProfit = contracts * credit;
        const totalExposure = contracts * marginPerContract;

        let winRate = 0.74; // Base
        if (cfg.aggression === 1) winRate -= 0.10; // 64%
        if (cfg.pW > 50) winRate -= 0.05; // 69% 

        const lossRate = 1 - winRate;
        const effectiveRisk = totalExposure * 0.5; // Avg loss on stop out

        const ev = (totalProfit * winRate) - (effectiveRisk * lossRate);

        // Generate Description
        const desc = `Put Width ${cfg.pW}` + (cfg.aggression === 1 ? " (Aggressive)" : " (Standard)");

        if (ev > bestConfig.score) {
            bestConfig = {
                score: ev,
                pW: cfg.pW,
                cW: 25,
                contracts: contracts,
                profit: totalProfit,
                exposure: totalExposure,
                winRate: winRate,
                unitCredit: credit,
                desc: desc,
                aggression: cfg.aggression
            };
        }
    });

    if (bestConfig.score === -Infinity) {
        container.innerHTML = `<div style="padding:10px; color:#64748b; font-size:0.8rem;">Insufficient capital for trade.</div>`;
        return;
    }

    // AUTO-UPDATE LOGIC
    if (autoUpdateQty && bestConfig.contracts > 0) {
        trade.actual_contracts = bestConfig.contracts;
        saveState();
        renderStrategy(trade); // Reflect in Top Panel
    }

    // Render Best Configuration
    container.innerHTML = `
        <div style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
            <div style="background: rgba(0, 255, 157, 0.05); border: 1px solid #00ff9d; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.75rem; color: #00ff9d; font-weight: 700;">ALPHA SOLVER: HIGHEST EV</div>
                    <div style="font-size: 0.7rem; color: #8b9bb4;">UTILIZATION: ${capital > 0 ? ((bestConfig.exposure / capital) * 100).toFixed(0) : 0}%</div>
                </div>
                
                <div style="font-size: 0.8rem; color: #e0e0e0; margin-top: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                     <strong>Structure:</strong> ${bestConfig.desc}
                     <br>
                     <strong>Aggression:</strong> ${bestConfig.aggression === 1 ? "<span style='color:#ff0055'>High (Closer Strikes)</span>" : "<span style='color:#00ff9d'>Standard (Safe Zone)</span>"}
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
    msgDiv.innerHTML = text; // Changed to innerHTML to support HTML formatting in responses
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

    // Use Actual Leg Deltas
    const callDelta = activeLegs[0].delta || "?";
    const putDelta = activeLegs[2].delta || "?";

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

// Helper to calc best expiration (Target ~7 Days out, nearest Mon/Wed/Fri)
function getRecommendedExpiration() {
    const today = new Date();
    // SPX has daily expirations, but liquidity is best Mon/Wed/Fri.
    // We target ~5-7 days out for this Gamma/Theta play.

    let target = new Date(today);
    target.setDate(today.getDate() + 5); // Minimum 5 days out

    // Find next valid M/W/F
    while (true) {
        const day = target.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
        if (day === 1 || day === 3 || day === 5) {
            break; // Found Mon, Wed, or Fri
        }
        target.setDate(target.getDate() + 1);
    }

    // Formatting: "Jan 19, 2026"
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return target.toLocaleDateString('en-US', options) + ` (${target.toLocaleDateString('en-US', { weekday: 'short' })})`;
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
            // INTELLIGENT RESPONSES (Context Aware)
            // Matches: "Why...", "Is this good", "Trade analysis", "Compare"
            else if (
                text.toLowerCase().includes("why") ||
                text.toLowerCase().includes("good") ||
                text.toLowerCase().includes("analysis") ||
                text.toLowerCase().includes("compare") ||
                text.toLowerCase().includes("safe")
            ) {
                // Run Analysis on Current Inputs
                const trade = AGENT_DATA.active_trade;
                const rec = calculateTradeMetrics(trade.legs, trade.actual_contracts || 10, AGENT_DATA.market);
                const act = calculateTradeMetrics(trade.actual_legs || trade.legs, trade.actual_contracts || 10, AGENT_DATA.market);

                let analysis = "";

                // 1. DANGER CHECK
                if (act.popVal < 0.60) {
                    analysis = `⚠️ <strong>CRITICAL WARNING:</strong> Your proposed trade has a low Probability of Profit (${act.pop}). You are essentially gambling on direction rather than selling volatility. I recommend widening the strikes.`;
                }
                // 2. COMPARISON
                else if (act.popVal < rec.popVal - 0.05) {
                    analysis = `<strong>Comparison:</strong> You are taking on ${((act.maxRisk / rec.maxRisk - 1) * 100).toFixed(0)}% more risk than I recommended. While profit is higher, your "Safety Buffer" (Delta) is significantly reduced.`;
                }
                // 3. RATIONALE
                else {
                    analysis = `<strong>Alpha Rationale:</strong> The Recommended strategy targets a 75% Win Rate by selling the 12-15 Delta strikes. Your current setup (${act.pop} PoP) aligns well with this thesis.`;
                }

                if (text.toLowerCase().includes("why")) {
                    analysis += `<br><br><em>I chose the original strikes to maximize Theta (Time Decay) while keeping Gamma risk low.</em>`;
                }

                response = analysis;
            }
            else if (text.toLowerCase().includes("risk")) {
                const act = calculateTradeMetrics(AGENT_DATA.active_trade.actual_legs || AGENT_DATA.active_trade.legs, AGENT_DATA.active_trade.actual_contracts || 10, AGENT_DATA.market);
                response = `Current risk is defined at <strong>$${act.maxRisk.toLocaleString()}</strong> max loss (Capital at Risk).<br>Breakevens: ${AGENT_DATA.active_trade.metrics.break_even}`;
            } else if (text.toLowerCase().includes("width") || text.toLowerCase().includes("skew")) {
                response = "I have detected a 72% Bullish bias. I widened the Put Vertical to 50pts (Standard is 25pts) to capture more credit.";
            } else if (text.toLowerCase().includes("monday")) {
                response = "The plan: Wait for the 'Monday Vrush' (9:30-10:00 AM). Targeting entry if IV Rank > 15.";
            } else if (text.toLowerCase().includes("close")) {
                response = "I will alert you when we reach 50% profit. If we hit that on Wednesday, we will close and rescan.";
            }
            // DATE / EXPIRATION LOGIC
            // User: "What if I change the expiration date to..."
            else if (text.toLowerCase().includes("expiration") || text.toLowerCase().includes("date") || text.toLowerCase().includes("january")) {
                response = "<strong>Expiration Analysis:</strong><br>Changing expiration impacts <strong>Gamma</strong> and <strong>Theta</strong>.<br><br>Moving closer (e.g., Jan 19) increases Gamma risk (price sensitivity). Moving further out increases Theta decay benefits but requires more patience. <br><br><em>You can now edit the Expiration Date directly in the strategy card to test this.</em>";
            }

            // CATCH-ALL
            else {
                response = "I didn't quite catch that. I am scanning global feeds, but I can discuss <strong>Strikes</strong>, <strong>Risk</strong>, or run <strong>Simulations</strong>.";
            }
            appendMessage('agent', response);
        }, 800); // Reduced latency for snappy feel
    };

    // Capital Input Listener
    // Capital Input Listener
    capitalInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (val && val > 0) {
            calculateOptimization(val, true); // Auto-update QTY when capital changes
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

// Helper: Calculate Metrics (PoP, Risk, Profit)
function calculateTradeMetrics(legs, contracts, market) {
    // 1. Calculate Widths
    const putWidth = Math.abs(legs[2].strike - legs[3].strike);
    const callWidth = Math.abs(legs[0].strike - legs[1].strike);
    const maxWidth = Math.max(putWidth, callWidth);

    // 2. Estimate Credit (Simulated Model)
    // Base Credit ($1.20) + Skew Bonus + Width Bonus
    let credit = 1.20;
    if (putWidth > 25) credit += ((putWidth - 25) / 5) * 0.15; // More credit for wider put spread
    if (callWidth > 25) credit += ((callWidth - 25) / 5) * 0.10;

    // 3. PoP Estimation (Based on Delta)
    const shortCallDelta = legs[0].delta || 0.12;
    const shortPutDelta = legs[2].delta || 0.12;

    // Dynamic Delta Adjustment (Simulated logic simplification)
    // We assume default delta is "safe", higher delta lowers PoP.
    // Base PoP for standard 15 delta is ~75%.

    const pop = (1 - (shortCallDelta + shortPutDelta) - 0.05).toFixed(2); // -5% edge buffer

    // 4. Totals
    const marginPerContract = (maxWidth * 100) - (credit * 100);
    const maxRisk = marginPerContract * contracts;
    const maxProfit = (credit * 100) * contracts;

    return {
        credit: credit.toFixed(2),
        pop: (pop * 100).toFixed(0) + "%",
        popVal: parseFloat(pop),
        maxRisk: maxRisk,
        maxProfit: maxProfit,
        putWidth: putWidth,
        callWidth: callWidth
    };
}

function generateLiveRecommendation(market) {
    console.log("ALPHA: Generating Live Strategy based on:", market);

    // 1. Synthesize Thesis
    const thesis = ALPHA_BRAIN.synthesizeThesis(market);
    AGENT_DATA.forecast.conviction_summary = thesis;
    AGENT_DATA.forecast.probability = market.vix < 20 ? 0.72 : 0.65; // Lower confidence in high vol

    // 2. Synthesize Strikes (The "Real" Work)
    // Simple Rule-Based Engine for Playground
    const spx = market.spx;
    let strategyType = "Iron Condor";
    let shortPut, shortCall, longPut, longCall;

    // Calculate ATM (At The Money)
    const atm = Math.round(spx / 5) * 5; // Round to nearest 5

    if (market.trend.includes("Bullish")) {
        // Bullish Bias: Skew Puts Higher, Calls Further Away
        shortPut = Math.floor((spx * 0.98) / 5) * 5; // 2% OTM
        shortCall = Math.ceil((spx * 1.03) / 5) * 5; // 3% OTM
    } else {
        // Bearish/Neutral: Balanced or lower
        shortPut = Math.floor((spx * 0.96) / 5) * 5; // 4% OTM
        shortCall = Math.ceil((spx * 1.02) / 5) * 5; // 2% OTM
    }

    // Defined Wings (Width)
    const width = market.vix > 20 ? 50 : 25; // Wider in high vol
    longPut = shortPut - width;
    longCall = shortCall + width;

    // 3. Construct Trade Object using Black-Scholes Pricing
    const r = 0.045; // Risk Free Rate 4.5%
    const t = 7 / 365; // 7 DTE
    const vol = market.vix / 100;

    // Define Legs Config
    const legConfigs = [
        { side: "Call", action: "Sell", strike: shortCall },
        { side: "Call", action: "Buy", strike: longCall },
        { side: "Put", action: "Sell", strike: shortPut },
        { side: "Put", action: "Buy", strike: longPut }
    ];

    // Calculate Greeks for each leg
    const calculatedLegs = legConfigs.map(cfg => {
        const type = cfg.side.toLowerCase();
        const greeks = BS_MATH.calculateGreeks(type, spx, cfg.strike, t, r, vol);
        return {
            side: cfg.side,
            action: cfg.action,
            strike: cfg.strike,
            delta: parseFloat(greeks.delta.toFixed(2)),
            price: greeks.price
        };
    });

    // Calculate Totals
    let totalCredit = 0;
    calculatedLegs.forEach(leg => {
        if (leg.action === "Sell") totalCredit += leg.price;
        else totalCredit -= leg.price;
    });

    // Defined Wings (Width)
    const actualWidth = Math.abs(shortPut - longPut);

    const trade = {
        type: strategyType,
        status: "PENDING ENTRY",
        expiration: getRecommendedExpiration(),
        dte: 7,
        legs: calculatedLegs,
        metrics: {
            max_profit: `$${Math.max(0.10, totalCredit).toFixed(2)}`, // Ensure non-negative display
            max_risk: `$${((actualWidth * 100) - (totalCredit * 100)).toFixed(2)}`,
            pop: "70%", // Still estimated based on Delta (1 - Short Deltas)
            break_even: `${(shortPut - totalCredit).toFixed(0)} / ${(shortCall + totalCredit).toFixed(0)}`
        },
        thesis: thesis
    };

    AGENT_DATA.active_trade = trade;

    // Force Render
    renderStrategy(trade);
    renderMetrics(market, trade);
    appendMessage('agent', `<strong>Analysis Complete.</strong><br>${thesis}<br>Calculated Credit: $${totalCredit.toFixed(2)} based on VIX ${market.vix}.`);
}

function updateMarketTickerUI(data) {
    const spxEl = document.getElementById('ticker-spx');
    const vixEl = document.getElementById('ticker-vix');
    if (spxEl) {
        spxEl.innerText = data.spx.toFixed(2);
        spxEl.style.color = "#00ff9d";
    }
    if (vixEl) vixEl.innerText = data.vix.toFixed(2);
}

function updateManualInputs(data) {
    const inputSpx = document.getElementById('input-spx');
    const inputVix = document.getElementById('input-vix');
    if (inputSpx) inputSpx.value = data.spx;
    if (inputVix) inputVix.value = data.vix;
}
// EFFICIENCY DELTA CALCULATION
function generateAlphaCommentary(rec, act) {
    // We score the trade on 3 axes: Risk (Gamma/Delta), Probability (PoP), Profit (Credit)

    // 1. Profit Score (+1 if higher)
    const profitScore = act.maxProfit > rec.maxProfit ? 1 : 0;
    const profitDiff = act.maxProfit - rec.maxProfit;

    // 2. Risk Score (-1 if riskier)
    // We use PoP as a proxy for Gamma risk here (Lower PoP = Closer to strikes = Higher Gamma)
    const popDiff = act.popVal - rec.popVal;
    const riskScore = popDiff < -0.05 ? -1 : 0; // Penalize if PoP drops by >5%

    // 3. Efficiency Verdict
    let verdict = "NEUTRAL";
    let explanation = "";

    if (profitScore === 1 && riskScore === 0) {
        verdict = "<span style='color:#00ff9d; font-weight:bold;'>SUPERIOR</span>";
        explanation = `You optimized for higher profit (+$${profitDiff.toFixed(0)}) without significantly increasing Gamma risk. Efficient structure.`;
    } else if (profitScore === 1 && riskScore === -1) {
        verdict = "<span style='color:#ff0055; font-weight:bold;'>INFERIOR</span>";
        explanation = `You increased profit by $${profitDiff.toFixed(0)}, but accepted a ${(Math.abs(popDiff) * 100).toFixed(0)}% drop in Probability. <br>The added premium does not justify the exponential increase in Gamma Risk.`;
    } else if (profitScore === 0 && riskScore === 0) {
        verdict = "<span style='color:#ffcc00; font-weight:bold;'>ALIGNED</span>";
        explanation = "Your proposed structure aligns closely with Alpha's optimal thesis.";
    } else {
        verdict = "<span style='color:#ffcc00; font-weight:bold;'>SUB-OPTIMAL</span>";
        explanation = "This structure offers lower reward for similar or higher risk. Revert to recommended strikes.";
    }

    return `
        <div style="margin-top:4px;">
            <strong>VERDICT:</strong> ${verdict}
        </div>
        <div style="margin-top:2px;">
            ${explanation}
        </div>
    `;
}
