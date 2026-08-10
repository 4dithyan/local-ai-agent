# 2D Local AI Agent Workspace

Welcome to your completely private, fully local AI agent workspace! 🚀 

This project provides a web interface where a 2D agent character receives tasks and passes them securely to your local AI model (Qwen2.5-7B) using Ollama. Everything runs on your machine—no data is sent to the cloud, and no API keys are required.

## ❓ Does this agent create images?
**No.** The AI model powering this agent is **Qwen2.5-7B**, which is a Large Language Model (LLM). This means it can only generate **text** (like answering questions, writing code, summarizing text, etc.). 

If you want an agent that can generate images (like Midjourney or DALL-E), you would need to run a different type of local AI model called a *Diffusion Model* (like Stable Diffusion) and connect it to this workspace.

---

## 🛠️ How It Works (The Architecture)

Even though it looks like one cohesive app, it's actually made of three separate parts talking to each other:

1. **Ollama (The AI Brain):** This runs in the background of your computer and hosts the `qwen2.5:7b` model.
2. **FastAPI Backend (The Bridge):** This is a Python server. It receives requests from the web interface and passes them to Ollama.
3. **React + Tailwind Frontend (The UI):** This is the web page you see in your browser. It contains the 2D animated character and the chat panel.

---

## 🚀 How to Start the Application

You must start the components in order. **Open three separate terminal windows in VS Code.**

### Step 1: Ensure Ollama is Running
Make sure the **Ollama** application is open and running in the background on your Windows machine. (You should see its icon in your system tray).

### Step 2: Start the Python Backend
Open your first terminal in VS Code and run:
```bash
cd backend
python main.py
```
*You will see a message saying "Uvicorn running on http://127.0.0.1:8000". Leave this terminal open!*

### Step 3: Start the React Frontend
Open your second terminal in VS Code and run:
```bash
cd frontend
npm run dev
```
*You will see a message with a link like `http://localhost:5173`. Hold CTRL and click that link, or type it into your browser.*

---

## 🎮 Using the Workspace

Once you open `http://localhost:5173` in your browser:
1. You will see a 2D workspace with a character standing next to a computer.
2. The character will bounce slightly to indicate it is **Idle**.
3. Type a task (e.g., "Write a poem about the ocean") into the Task Control panel on the right.
4. Click **Submit Task**.
5. The character will start wobbling (indicating it is **Thinking**) and then move to the computer to type (indicating it is **Working**).
6. Once Ollama generates the text, the response will appear in the Agent Output area, and the character will return to **Idle**.

Enjoy your private, local AI companion!
