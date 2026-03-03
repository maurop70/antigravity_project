"""
Resonance — Auto-Generated Skill
Wraps the app's bridge.py for use as a Meta App Factory tool.
"""
import os
import sys
import requests

WEBHOOK_URL = "https://humanresource.app.n8n.cloud/webhook/Resonance-webhook"
APP_DIR = r"C:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\Meta_App_Factory\Resonance"

def invoke(prompt: str, context: str = "", agent: str = "") -> str:
    """Invoke this skill with a prompt."""
    payload = {
        "prompt": prompt,
        "chatInput": prompt,
        "input": prompt,
    }
    if context:
        payload["context"] = context
    if agent:
        payload["agent"] = agent

    try:
        response = requests.post(WEBHOOK_URL, json=payload, timeout=90)
        response.raise_for_status()
        data = response.json()
        return data.get("text", data.get("output", str(data)))
    except Exception as e:
        return f"Skill Error ({APP_DIR}): {e}"


def get_capabilities():
    """Return the list of capabilities this skill provides."""
    return ['multi agent core', 'multi-agent']


def get_info():
    """Return skill metadata."""
    return {
        "name": "Resonance",
        "description": "Multi-agent educational app for teenagers with auditory processing challenges",
        "webhook": WEBHOOK_URL,
        "app_dir": APP_DIR,
        "capabilities": get_capabilities()
    }
