/**
 * Black-Scholes Option Pricing Utility
 * Used for T+0 P&L Visualization
 */

const BS_MATH = {
    // Cumulative Normal Distribution Function
    // Precision: ~1e-7
    cumulativeDistribution: function (x) {
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989423 * Math.exp(-x * x / 2);
        let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        if (x > 0) prob = 1 - prob;
        return prob;
    },

    // Calculate Greeks (Price & Delta)
    // S: Spot, K: Strike, T: Time(Years), r: Rate, v: Volatility
    calculateGreeks: function (type, S, K, T, r, v) {
        if (T <= 0) {
            const val = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
            const delta = type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0);
            return { price: val, delta: delta };
        }

        const d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * Math.sqrt(T));
        const d2 = d1 - v * Math.sqrt(T);

        let price = 0;
        let delta = 0;

        if (type === 'call') {
            price = S * this.cumulativeDistribution(d1) - K * Math.exp(-r * T) * this.cumulativeDistribution(d2);
            delta = this.cumulativeDistribution(d1);
        } else {
            price = K * Math.exp(-r * T) * this.cumulativeDistribution(-d2) - S * this.cumulativeDistribution(-d1);
            delta = this.cumulativeDistribution(d1) - 1;
        }

        return { price: price, delta: delta };
    },

    // Legacy single price function (wraps the new one)
    calculateOptionPrice: function (type, S, K, T, r, v) {
        return this.calculateGreeks(type, S, K, T, r, v).price;
    },

    // Calculate Net Price of a Complex Strategy (e.g. Iron Condor)
    // legs: Array of { type: 'call'|'put', action: 'sell'|'buy', strike: number }
    // currentSpot: number
    // daysToExpiration: number
    // volatility: number (decimal)
    calculateStrategyPrice: function (legs, currentSpot, daysToExpiration, volatility) {
        let netPrice = 0;
        const T = Math.max(0.0001, daysToExpiration / 365); // Avoid div by zero
        const r = 0.05; // Fixed 5% risk free rate for simplicity

        legs.forEach(leg => {
            const price = this.calculateOptionPrice(leg.type.toLowerCase(), currentSpot, leg.strike, T, r, volatility);
            // If we are LONG (Buy), the value is POSITIVE for us (asset).
            // If we are SHORT (Sell), the value is NEGATIVE we have to buy it back (liability).
            // BUT: This function returns the "Mark Price" of the bundle.
            // If we want the "Cost to Close", it's Sum(Longs) - Sum(Shorts)? 
            // Standard convention: Strategy Price is the debit to buy it. 
            // So Short legs decrease value, Long legs increase value? 
            // Actually, usually we track "Liquidation Value". 
            // Value = (Price * (+1 for Long, -1 for Short)).

            // Correction: leg.action 'buy' means we own it (+). 'sell' means we owe it (-).
            const sign = (leg.action.toLowerCase().includes('buy')) ? 1 : -1;
            netPrice += (price * sign);
        });

        // If result is negative, it means we have a Net Credit position (Liability > Assets).
        // e.g. Iron Condor is usually a credit trade, so we owe money to close it.
        // The "Market Value" of an Iron Condor is typically positive (cost to buy back).
        // Let's return the "Cost to Close" (always positive for a short strategy).

        // Wait, calculateStrategyPrice should return the current "Fair Value" of the package.
        // For a credit spread, fair value is (Long Price - Short Price). 
        // e.g. Sell @ $1.00, Buy @ $0.80. Net Credit $0.20.
        // Later, Short is $0.50, Long is $0.40. Net Debit to Close is $0.10.
        // The P&L is (Initial Credit - Current Debit).
        // So we need this function to return the "Current Debit" (Cost to Buy Back).

        let costToClose = 0;
        legs.forEach(leg => {
            const price = this.calculateOptionPrice(leg.type.toLowerCase(), currentSpot, leg.strike, T, r, volatility);
            if (leg.action.toLowerCase().includes('sell')) {
                costToClose += price; // Cost to buy back short
            } else {
                costToClose -= price; // Proceeds from selling long
            }
        });

        return costToClose;
    }
};
