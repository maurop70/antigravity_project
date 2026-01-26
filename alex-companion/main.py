import os
import shutil
import edge_tts
from fastapi.responses import Response
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from llm_client import alexa_client
from classroom_client import classroom_client
from duckduckgo_search import DDGS

app = FastAPI(title="Alexa Companion")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

class SpeakRequest(BaseModel):
    text: str

class ParentInputRequest(BaseModel):
    content: str
    type: str # 'vocabulary' or 'comment'

class SearchRequest(BaseModel):
    query: str

# Data Manager
class DataManager:
    def __init__(self, filename="user_data.json"):
        self.filename = filename
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.filename):
            with open(self.filename, 'w') as f:
                json.dump({"parent_inputs": [], "progress_log": []}, f)

    def load_data(self):
        try:
            with open(self.filename, 'r') as f:
                return json.load(f)
        except:
             return {"parent_inputs": [], "progress_log": []}

    def save_data(self, data):
        with open(self.filename, 'w') as f:
            json.dump(data, f, indent=2)

    def add_parent_input(self, content, type, status, alexa_response):
        data = self.load_data()
        new_entry = {
            "id": str(uuid.uuid4()),
            "content": content,
            "type": type,
            "status": status,
            "alexa_response": alexa_response,
            "timestamp": datetime.now().isoformat()
        }
        data["parent_inputs"].insert(0, new_entry) # Add to top
        self.save_data(data)
        return new_entry

import json
import uuid
from datetime import datetime

data_manager = DataManager()

# API Endpoints
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Standard chat endpoint.
    """
    try:
        # Load active parent inputs and strategy to inject into context
        data = data_manager.load_data()
        
        # Check for Classroom triggers (simple keyword check for now, or always inject if auth'd)
        # We'll inject it if it's explicitly asked or if we want to be proactive.
        # For now, let's keep it proactive but lightweight - maybe valid for a session?
        # Actually, let's just fetch it. If it's slow, we might need caching.
        classroom_context = None
        if "homework" in request.message.lower() or "assignment" in request.message.lower() or "class" in request.message.lower() or "school" in request.message.lower():
             classroom_context = classroom_client.get_summary()

        response_text = alexa_client.send_message(request.message, user_data=data, local_context=classroom_context)
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reset")
async def reset_endpoint():
    """
    Clears chat history to start fresh.
    """
    try:
        alexa_client.reset()
        return {"status": "success", "message": "Memory wiped."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), message: str = Form(...)):
    """
    Uploads a file and sends a message with it.
    """
    try:
        content = ""
        if file.filename.endswith(".txt") or file.filename.endswith(".md"):
            content = (await file.read()).decode("utf-8")
        else:
            content = f"[File uploaded: {file.filename} - Content extraction not fully implemented]"
        
        # Load active parent inputs and strategy
        data = data_manager.load_data()
        
        response_text = alexa_client.send_message(message, file_content=content, user_data=data)
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/parent/data")
async def get_parent_data():
    return data_manager.load_data()

@app.post("/api/parent/input")
async def add_parent_input(request: ParentInputRequest):
    """
    Receives parent input, asks Alexa to analyze it, and saves the result.
    """
    try:
        # 1. Analyze with LLM
        analysis = alexa_client.analyze_parent_input(request.content, request.type)
        
        # 2. Save to DB
        entry = data_manager.add_parent_input(
            request.content, 
            request.type, 
            analysis.get("status", "pending"), 
            analysis.get("alexa_response", "Analysis failed.")
        )
        return entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/speak")
async def speak_endpoint(request: SpeakRequest):
    """
    Generates audio from text using Edge TTS.
    Returns audio/mpeg.
    """
    try:
        voice = "en-US-AvaNeural" # Young adult/teen voice (Expressive, Caring, Pleasant)
        communicate = edge_tts.Communicate(request.text, voice)
        
        # We need to collect the audio bytes
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
                
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search_image")
async def search_image_endpoint(request: SearchRequest):
    """
    Searches DuckDuckGo for a real image URL.
    Fallbacks to Pollinations AI if search fails (Rate Limit) or finds nothing.
    """
    query = request.query
    print(f"Searching for image: {query}")
    
    try:
        with DDGS() as ddgs:
            # max_results=1 forces getting the top result
            results = list(ddgs.images(query, max_results=1))
            if results and results[0].get('image'):
                image_url = results[0]['image']
                print(f"FOUND real image: {image_url}")
                return {"url": image_url}
            
    except Exception as e:
        print(f"Search failed ({e}). Using Fallback.")
    
    # Fallback: Generate URL
    encoded_query = query.replace(" ", "%20")
    fallback_url = f"https://pollinations.ai/p/{encoded_query}?width=800&height=600&nologo=true"
    print(f"FALLBACK to Pollinations: {fallback_url}")
    return {"url": fallback_url}

@app.get("/api/auth/classroom")
async def auth_classroom():
    """
    Triggers the Google Classroom OAuth2 flow locally.
    This will open a browser window on the server side (localhost).
    """
    try:
        success = classroom_client.authenticate()
        if success:
            return {"status": "success", "message": "Authenticated with Google Classroom."}
        else:
            return {"status": "error", "message": "Authentication failed. Check server logs."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/classroom/summary")
async def get_classroom_summary():
    """
    Returns the current classroom summary text.
    """
    try:
        return {"summary": classroom_client.get_summary()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/classroom/data")
async def get_classroom_data():
    """
    Returns structured JSON data for the UI.
    """
    try:
        return classroom_client.get_courses_and_coursework()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Static Files (Frontend)
# We mount this LAST so API routes take precedence
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
