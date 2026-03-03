import os
import json
import logging

# Deployment Configuration
FACTORY_CONFIG = {
    "module_name": "Claude_N8N_Automation_Bridge",
    "version": "1.0.0",
    "components": [
        "supervisor.py",
        "utils/claude_relay.py",
        "utils/debugger.py",
        "registry.json"
    ],
    "env_vars_required": [
        "SENTRY_DSN",
        "SENTRY_AUTH_TOKEN"
    ]
}

def check_readiness():
    logging.info("Checking factory readiness...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    missing = []
    for f in FACTORY_CONFIG["components"]:
        full_path = os.path.join(base_dir, f)
        if not os.path.exists(full_path):
            missing.append(f)
    
    if missing:
        logging.error(f"Missing components: {missing}")
        return False
    
    logging.info("Factory is ready for deployment!")
    return True

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if check_readiness():
        print("Deployment sequence can proceed.")
    else:
        print("Deployment halted.")
