import os.path
import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import json

# If modifying these scopes, delete the file token.json.
SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    'https://www.googleapis.com/auth/classroom.announcements.readonly'
]

class ClassroomClient:
    def __init__(self, credentials_file="credentials.json", token_file="token.json"):
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.creds = None
        self.service = None

    def authenticate(self):
        """Authenticates the user using OAuth2 flow."""
        self.creds = None
        
        # 1. Load existing token if available
        if os.path.exists(self.token_file):
            try:
                self.creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
            except Exception as e:
                print(f"Error loading token: {e}")
                self.creds = None

        # 2. Refresh or Login if not valid
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                try:
                    self.creds.refresh(Request())
                except Exception as e:
                    print(f"Error refreshing token: {e}")
                    self.creds = None
            
            if not self.creds:
                if not os.path.exists(self.credentials_file):
                    print("Credentials file not found.")
                    return False
                
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_file, SCOPES)
                    self.creds = flow.run_local_server(port=0)
                except Exception as e:
                    print(f"Error during OAuth flow: {e}")
                    return False

            # Save the credentials for the next run
            with open(self.token_file, 'w') as token:
                token.write(self.creds.to_json())

        try:
            self.service = build('classroom', 'v1', credentials=self.creds)
            return True
        except Exception as e:
            print(f"Error building service: {e}")
            return False

    def list_courses(self):
        """Lists the user's courses."""
        if not self.service: return []
        try:
            results = self.service.courses().list(pageSize=10).execute()
            courses = results.get('courses', [])
            return courses
        except Exception as e:
            print(f"Error listing courses: {e}")
            return []

    def list_course_work(self, course_id):
        """Lists coursework for a specific course."""
        if not self.service: return []
        try:
            results = self.service.courses().courseWork().list(
                courseId=course_id, pageSize=10).execute()
            course_work = results.get('courseWork', [])
            return course_work
        except Exception as e:
            print(f"Error listing course work for {course_id}: {e}")
            return []

    def get_summary(self):
        """
        Generates a summary string of active courses and due assignments 
        for the LLM context.
        """
        if not self.authenticate():
            return "Google Classroom: Not Authenticated (Ask user to setup/login)"

        summary = "Google Classroom Data:\n"
        courses = self.list_courses()

        if not courses:
            return summary + "No active courses found."

        for course in courses:
            name = course.get('name')
            status = course.get('courseState')
            if status != 'ACTIVE': continue
            
            summary += f"- Course: {name}\n"
            
            # Get Assignments
            work = self.list_course_work(course['id'])
            if not work:
                summary += "  (No assignments)\n"
            else:
                for item in work:
                    title = item.get('title')
                    # Check for due date
                    due_date = item.get('dueDate') # {'year': 2023, 'month': 10, 'day': 5}
                    
                    if due_date:
                        due_str = f"{due_date.get('month')}/{due_date.get('day')}"
                        summary += f"  - [Assignment] {title} (Due: {due_str})\n"
                    else:
                        summary += f"  - [Assignment] {title} (No Due Date)\n"
        
        return summary

    def get_courses_and_coursework(self):
        """
        Returns a structured dictionary of courses and their assignments.
        """
        if not self.authenticate():
            return {"authenticated": False, "courses": []}

        data = {"authenticated": True, "courses": []}
        courses = self.list_courses()

        if not courses:
            return data

        for course in courses:
            status = course.get('courseState')
            if status != 'ACTIVE': continue
            
            course_data = {
                "id": course.get('id'),
                "name": course.get('name'),
                "alternateLink": course.get('alternateLink'),
                "section": course.get('section', ''),
                "assignments": []
            }
            
            # Get Assignments (Only incomplete ones ideally, but let's get all active)
            work = self.list_course_work(course['id'])
            if work:
                for item in work:
                    # Filter? Maybe only if not graded? 
                    # For now, return all to let UI decide/filter or just show top 5
                    
                    course_data["assignments"].append({
                        "id": item.get('id'),
                        "title": item.get('title'),
                        "dueDate": item.get('dueDate'),
                        "alternateLink": item.get('alternateLink'),
                        "description": item.get('description', '')
                    })
            
            data["courses"].append(course_data)
        
        return data

# Singleton instance
classroom_client = ClassroomClient()
