import chromadb
import requests
import json
import sys

# The Ollama API endpoint for generating text
OLLAMA_API_URL = "http://localhost:11434/api/generate"
# The model we are going to use
MODEL_NAME = "qwen2.5:7b"

def search_knowledge_base(query):
    """Searches ChromaDB for relevant information based on the user's query."""
    # Connect to our local ChromaDB folder
    client = chromadb.PersistentClient(path="./chroma_db")
    
    try:
        # Get the collection we created earlier
        collection = client.get_collection(name="my_knowledge_base")
    except Exception:
        return "ERROR_NO_DB"
        
    # Search for the top 2 most relevant pieces of information
    results = collection.query(
        query_texts=[query],
        n_results=2
    )
    
    # ChromaDB returns a list of lists for documents. 
    # We get the first list since we only queried with 1 string.
    documents = results["documents"][0]
    
    if not documents:
        return None
        
    # Combine the found facts into a single string
    context = "\n".join(documents)
    return context

def ask_qwen(query, context):
    """Sends the prompt to Qwen2.5-7B via Ollama."""
    
    # We construct a prompt that allows the AI to use general knowledge if the context doesn't have the answer
    prompt = f"""You are a helpful AI assistant. 
First, check if the Context Information below contains the answer to the user's question. If it does, use it to answer.
If the Context Information does NOT contain the answer, you may use your general knowledge to answer the question helpfully.

Context Information:
{context}

User's Question: {query}
"""

    # Prepare the data payload for the Ollama API
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False # We set stream to False to get the whole answer at once
    }
    
    try:
        # Send a POST request to the local Ollama server
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status() # Check for errors (e.g. 404 if Ollama is not running)
        
        # Parse the JSON response
        data = response.json()
        return data.get("response", "No response received.")
        
    except requests.exceptions.ConnectionError:
        return "Error: Could not connect to Ollama. Is the Ollama app running on your computer?"
    except Exception as e:
        return f"An error occurred while talking to Ollama: {e}"

def start_chat():
    """Starts the terminal chat loop."""
    print("==================================================")
    print("🤖 Local AI Agent initialized!")
    print(f"Using model: {MODEL_NAME}")
    print("Type 'exit' or 'quit' to stop.")
    print("==================================================\n")
    
    while True:
        # Get user input
        user_input = input("\nYou: ")
        
        # Check if user wants to exit
        if user_input.lower() in ['exit', 'quit']:
            print("Agent: Goodbye!")
            break
            
        if not user_input.strip():
            continue
            
        print("Agent: Searching memory...")
        # Step 1: Search ChromaDB for relevant info
        context = search_knowledge_base(user_input)
        
        print("Agent: Thinking...")
        # Step 2: Ask Qwen using the found context
        if context:
            answer = ask_qwen(user_input, context)
            print(f"\n🤖 Agent:\n{answer}")
        else:
            print("\n🤖 Agent:\nI'm sorry, but my knowledge base is empty.")

if __name__ == "__main__":
    start_chat()
