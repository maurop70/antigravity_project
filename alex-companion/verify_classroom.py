from classroom_client import classroom_client

def verify():
    print("Testing Google Classroom Authentication...")
    if classroom_client.authenticate():
        print("Authentication Successful!")
        
        print("\nFetching Courses...")
        courses = classroom_client.list_courses()
        for c in courses:
            print(f"- {c.get('name')} ({c.get('courseState')})")
            
        print("\nFetching Summary for LLM...")
        print(classroom_client.get_summary())
    else:
        print("Authentication Failed.")

if __name__ == "__main__":
    verify()
