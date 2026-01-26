---
name: Local Browser Verification
description: A capability to launch a real local browser (Chromium) to verify UI elements, take screenshots, and interact with a localhost web application when cloud-based browser tools fail or lack access.
---

# Local Browser Verification Skill

This skill allows the agent to verify a web application running on the USER'S machine by executing a local Python script that uses Playwright. This gives "eyes" on the actual UI as it renders locally.

## Prerequisites

The user's environment must have:
1.  Python installed.
2.  `playwright` and `pytest-playwright` installed (`pip install playwright pytest-playwright`).
3.  Playwright browsers installed (`playwright install chromium`).

## Usage

1.  **Generate the Script**: Use the provided template (or the `verify_ui.py` script) to define what you want to check (screenshots, element visibility, interaction).
2.  **Run the Script**: Execute the script using the user's Python environment.
3.  **Analyze Results**: Read the console output (PASS/FAIL logs) and ask the user to view the generated screenshots (`ui_debug.png`).

## Script Template

The script `verify_ui.py` (located in `scripts/`) provides a robust starting point. It includes:
-   Headless mode configuration.
-   Screenshot capture.
-   Element visibility checks.
-   Basic interaction (typing/clicking).
-   Error handling.

## When to use

Use this skill when:
-   The `browser_subagent` tool fails due to environment issues.
-   You need to verify `localhost` servers that are not exposed to the internet.
-   You need to verify visual elements (via screenshots) that code inspection cannot reveal.
