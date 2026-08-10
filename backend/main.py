from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI()

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:7b"

class TaskRequest(BaseModel):
    task: str

class TaskResponse(BaseModel):
    response: str

@app.post("/api/task", response_model=TaskResponse)
def execute_task(request: TaskRequest):
    prompt = f"You are a helpful AI assistant. The user wants you to complete the following task:\n\n{request.task}"
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        ollama_res = requests.post(OLLAMA_URL, json=payload)
        ollama_res.raise_for_status()
        data = ollama_res.json()
        return TaskResponse(response=data.get("response", "No response received."))
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Could not connect to Ollama. Is it running?")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
