import requests
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('SentryDebugger')

class SentryDebugger:
    def __init__(self, auth_token=None, organization_slug=None, project_slug=None):
        self.auth_token = auth_token or os.getenv("SENTRY_AUTH_TOKEN")
        self.organization_slug = organization_slug or os.getenv("SENTRY_ORG_SLUG")
        self.project_slug = project_slug or os.getenv("SENTRY_PROJECT_SLUG")
        self.base_url = "https://sentry.io/api/0"

    def get_issue_summary(self, issue_id):
        """
        Retrieves the issue summary from Sentry/Seer for a given issue ID.
        In a real integration, this would query the Sentry API or the Seer service.
        """
        if not self.auth_token:
            logger.warning("Sentry Auth Token not provided. Cannot fetch issue summary.")
            return "Sentry Debugger: Auth Token missing. Unable to fetch remote summary."

        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }

        try:
            # Hypothetical endpoint for retrieving an issue's AI summary or details
            # Using the standard issues endpoint for now
            url = f"{self.base_url}/issues/{issue_id}/"
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            title = data.get("title", "Unknown Error")
            culprit = data.get("culprit", "Unknown Culprit")
            
            # If Sentry has a specific 'seer' or 'ai_summary' field, access it here
            # For now, we construct a basic summary
            summary = f"Issue: {title}\nLoc: {culprit}\nStatus: {data.get('status')}"
            return summary

        except Exception as e:
            logger.error(f"Failed to fetch issue summary: {e}")
            return f"Error fetching summary for Issue {issue_id}: {str(e)}"

# Example usage
if __name__ == "__main__":
    debugger = SentryDebugger(auth_token="PLACEHOLDER_TOKEN", organization_slug="org", project_slug="proj")
    print(debugger.get_issue_summary("12345"))
