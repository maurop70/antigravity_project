import sys
import json
import logging
import os
import sentry_sdk
from utils.claude_relay import ClaudeRelay
from utils.debugger import SentryDebugger

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('Supervisor')

class Supervisor:
    def __init__(self):
        self.load_config()
        self.setup_sentry()
        self.relay = ClaudeRelay(self.config['services']['CLAUDE_CODE_SERVICE']['url'], self.sentry_dsn)
        self.debugger = SentryDebugger(auth_token=os.getenv("SENTRY_AUTH_TOKEN")) # Ensure env var is set

    def load_config(self):
        try:
            with open('registry.json', 'r') as f:
                self.config = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load registry.json: {e}")
            sys.exit(1)

    def setup_sentry(self):
        service_config = self.config['services'].get('DEBUG_SERVICE_SENTRY', {})
        self.sentry_dsn = service_config.get('dsn')
        # Sentry init is handled in ClaudeRelay or here if global tracking is needed
        # We pass DSN to relay to initialize it there, but we can also init here for Supervisor logic
        if self.sentry_dsn:
            sentry_sdk.init(dsn=self.sentry_dsn, traces_sample_rate=1.0)

    def parse_permission_request(self, output):
        """
        Parses the output for permission requests.
        Returns the command to verify if found, else None.
        """
        if "Permission Request" in output or "Do you want to run" in output:
            # Naive parsing logic - in real scenario, regex would be better
            lines = output.split('\n')
            for line in lines:
                if "CMD:" in line: # Hypothetical marker
                    return line.split("CMD:")[1].strip()
        return None

    def execute_task(self, task):
        logger.info(f"Supervisor starting task: {task}")
        
        # 1. First Attempt
        result = self.relay.send_task(task)
        
        if result.get('success'):
            output = result['data'].get('body', {}).get('stdout', '') # Adjust based on n8n webhook response structure
            
            # 2. Check for Permissions
            command_request = self.parse_permission_request(output)
            if command_request:
                user_input = input(f"Claude wants to execute: '{command_request}'. Allow? (y/n): ")
                if user_input.lower() == 'y':
                    # Send approval back - this requires a stateful conversation or specific format
                    # For this bridge, we might just re-run with force flag or similar
                    logger.info("User approved command. Re-running...")
                    return self.relay.send_task(f"CONFIRMED: {task}")
                else:
                    logger.warning("User denied command.")
                    return None
            return result
        
        else:
            # 3. specific handling for failures & Feedback Loop
            logger.error("Task failed. Initiating feedback loop.")
            
            # Capture failure context
            issue_id = result.get('last_event_id')
            if issue_id:
                issue_summary = self.debugger.get_issue_summary(issue_id)
                logger.info(f"Retrieved Sentry Issue Summary: {issue_summary}")
                
                # 4. Retry with context
                retry_task = f"PREVIOUS FAILED with error: {issue_summary}. RETRYING TASK: {task}"
                logger.info("Retrying task with debug context...")
                return self.relay.send_task(retry_task)
            
            return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python supervisor.py <TASK_STRING>")
        sys.exit(1)
        
    supervisor = Supervisor()
    supervisor.execute_task(sys.argv[1])
