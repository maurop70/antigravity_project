// MOCK DATA MANUALLY TO AVOID IMPORT ISSUES
const AGENT_DATA = {
    active_trade: {
        thesis: "Bullish Skew (>70% Prob). Widened Put Vertical to 50pts to maximize profit capture.",
    }
};

global.AGENT_DATA = AGENT_DATA;
global.window = {};

// Load Brain
// Simple mock of brain logic since modules aren't commonJS
const ALPHA_BRAIN = {
    processChat: (text) => {
        if (text.toLowerCase().includes("status")) return "SYSTEM ONLINE. Monitoring SPX 6966. Risk Levels: LOW.";
        if (text.toLowerCase().includes("risk")) return "Current Gamma Risk is elevated. Recommend keeping Short Puts below 6850.";
        return "I am listening. Command?";
    }
};

console.log("\n🦅 ALPHA TERMINAL UPLINK ESTABLISHED");
console.log("-------------------------------------");
console.log("Alpha: I am ready. You can speak to me directly here.\n");

// Simulate User Chat
const query = "What is the status?";
console.log(`[USER]: ${query}`);
console.log(`[ALPHA]: ${ALPHA_BRAIN.processChat(query)}`);
console.log("\n[SYSTEM]: Active Trade Thesis -> " + AGENT_DATA.active_trade.thesis);
