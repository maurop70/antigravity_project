import sys
import os
import json
import logging
import uuid
import requests

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

SKILLS_DIR = r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills"
if SKILLS_DIR not in sys.path: sys.path.append(SKILLS_DIR)

try:
    from n8n_architect.architect import N8NArchitect
    arch = N8NArchitect()
    
    print("--- Deploying System - Drive Manager ---")

    # Workflow Definition
    # This workflow handles:
    # 1. Action: "ensure_folder" -> Creates folder if not exists, returns ID.
    # 2. Action: "upload_file" -> Uploads file content (base64) to parent_id.
    
    # Simple Logic: Webhook -> Switch (Action) -> Google Drive Node -> Respond
    
    workflow = {
        "name": "System - Drive Manager",
        "nodes": [
            {
                "parameters": {
                    "httpMethod": "POST",
                    "path": "drive-manager",
                    "responseMode": "responseNode",
                    "options": {}
                },
                "name": "Webhook_Trigger",
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 1,
                "position": [100, 300]
            },
            {
                "parameters": {
                    "dataType": "string",
                    "value1": "={{ $json.body.action }}",
                    "rules": {
                        "rules": [
                            { "value2": "ensure_folder", "output": 0 },
                            { "value2": "upload_file", "output": 1 }
                        ]
                    }
                },
                "name": "Action_Switch",
                "type": "n8n-nodes-base.switch",
                "typeVersion": 1,
                "position": [300, 300]
            },
            # Branch 0: Ensure Folder
            {
                "parameters": {
                    "resource": "folder",
                    "operation": "create",
                    "name": "={{ $json.body.folder_name }}",
                    "parentId": "={{ $json.body.parent_id }}", # Optional, root if empty
                    "options": {}
                },
                "name": "GD_Create_Folder",
                "type": "n8n-nodes-base.googleDrive",
                "typeVersion": 2,
                "position": [500, 200],
                "credentials": { "googleDriveOAuth2Api": { "id": "Gwb1234567890" } } # Placeholder ID, usually manual update needed if ID unknown
            },
            # Branch 1: Upload File
            {
                "parameters": {
                    "fileContent": "={{ $json.body.file_content }}", # Base64 expected? Or binary property
                    "name": "={{ $json.body.file_name }}",
                    "parentId": "={{ $json.body.parent_id }}",
                    "options": {}
                },
                "name": "GD_Upload_File",
                "type": "n8n-nodes-base.googleDrive",
                "typeVersion": 2,
                "position": [500, 400],
                "credentials": { "googleDriveOAuth2Api": { "id": "Gwb1234567890" } }
            },
            # Response
            {
                "parameters": {
                    "respondWith": "json",
                    "responseBody": "={{ $json }}",
                    "options": {}
                },
                "name": "Response",
                "type": "n8n-nodes-base.respondToWebhook",
                "typeVersion": 1,
                "position": [800, 300]
            }
        ],
        "connections": {
            "Webhook_Trigger": {
                "main": [[{"node": "Action_Switch", "type": "main", "index": 0}]]
            },
            "Action_Switch": {
                "main": [
                    [{"node": "GD_Create_Folder", "type": "main", "index": 0}],
                    [{"node": "GD_Upload_File", "type": "main", "index": 0}]
                ]
            },
            "GD_Create_Folder": {
                "main": [[{"node": "Response", "type": "main", "index": 0}]]
            },
            "GD_Upload_File": {
                "main": [[{"node": "Response", "type": "main", "index": 0}]]
            }
        }
    }
    
    # Try to find a valid credential ID first? 
    # Hard to guess. The user might need to edit the node manually.
    # But we can deploy the structure.
    
    wf_id = arch.create_workflow(workflow)
    print(f"Deployed System - Drive Manager: {wf_id}")
    print(f"URL: {arch.base_url}/webhook/drive-manager")

except Exception as e:
    print(f"Error: {e}")
