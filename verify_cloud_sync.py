import sys
import os
import time

# Add paths
sys.path.append(r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\Meta_App_Factory\Adv_Autonomous_Agent")
sys.path.append(r"C:\Users\mpetr\My Drive\Antigravity-AI Agents\skills")

from google_suite import GoogleSuiteManager

def test_cloud_sync():
    print("--- STARTING CLOUD SYNC VERIFICATION ---")
    
    project = "Cloud_Native_Test_Protocol"
    mgr = GoogleSuiteManager(project)
    
    # 1. Test Folder Creation
    print(f"\n[1] Requesting Workspace for '{project}'...")
    folder_id = mgr.ensure_project_folder()
    
    if folder_id:
        print(f"[OK] PASSED: Folder ID = {folder_id}")
    else:
        print("[ERR] FAILED: Could not create/find folder. Check N8N logs.")
        return

    # 2. Test File Upload
    print(f"\n[2] Uploading Test Artifact...")
    dummy_file = "test_artifact.txt"
    with open(dummy_file, "w") as f:
        f.write("This is a test of the Antigravity Cloud Sync Protocol.\nTimestamp: " + str(time.time()))
        
    try:
        link = mgr.upload_file(dummy_file)
        if link:
            print(f"[OK] PASSED: File Uploaded.")
            print(f"URL: {link}")
        else:
            print("[ERR] FAILED: Upload returned no link.")
    except Exception as e:
        print(f"[ERR] ERROR: {e}")
    finally:
        if os.path.exists(dummy_file):
            os.remove(dummy_file)

if __name__ == "__main__":
    test_cloud_sync()
