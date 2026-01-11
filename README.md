# Iron Condor Alpha 🦅

**Version**: 1.0.0 "Aphelion Photon"
**Status**: Live / Continuous Intelligence Active

## Overview
A specialized trading agent dashboard designed for managing SPX Iron Condors. It features "Smart Skew" logic, dynamic capital allocation, and a continuous Alpha Intelligence engine that monitors simulated global feeds for risks and opportunities.

## Key Features
*   **Smart Skew**: Automatically adjusts vertical spreads (Call vs Put width) based on directional forecast probability (>70%).
*   **Capital Allocator**: "Alpha Solver" calculates the optimal contract size and width configuration for maximum yield based on available capital.
*   **Safe Zone Visualizer**: Interactive, resizable map showing the distance between current price and short strikes relative to the Market Maker Move (MMM).
*   **Alpha Intelligence Engine**:
    *   **Continuous Feed**: Simulates Macro, Geopolitical, and Corporate news.
    *   **Opportunity Scanner**: Detects "Better Trade" EV swaps.
    *   **Desktop Alerts**: Browser notifications and popups for critical signals (War, Fed, Crash).

## Usage
1.  **Local**: Open `index.html` in any modern browser.
2.  **Simulation**: Use the Chat Interface to inject scenarios:
    *   `simulate war` (Critical Risk)
    *   `simulate fed` (Macro Opportunity)
    *   `simulate crash` (Black Swan)

## Deployment (Remote Access)
To access this dashboard from another PC:
1.  Push this repository to GitHub.
2.  Enable **GitHub Pages** in Repository Settings -> Pages -> Source: `main` / root.
3.  Access via `https://your-username.github.io/your-repo-name`.

## Tech Stack
*   **Frontend**: Vanilla HTML5, CSS3 (Grid/Flexbox), JavaScript (ES6+).
*   **Data**: Local Simulation Modules (`data.js`, `alpha_feed.js`, `alpha_brain.js`).
*   **Theme**: Financial Terminal Dark Mode.

---
*Built by Antigravity Agent for High-Conviction Trading.*
