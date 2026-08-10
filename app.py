from flask import Flask, render_template, request, jsonify
from chat_agent import search_knowledge_base, ask_qwen

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    
    if not user_message:
        return jsonify({'error': 'Empty message'}), 400
        
    # Step 1: Search ChromaDB for relevant info
    context = search_knowledge_base(user_message)
    
    if context == "ERROR_NO_DB":
        return jsonify({
            'response': "Error: Knowledge base not found. Please run 'python setup_knowledge.py' in the terminal first to load the data.", 
            'context_found': False
        })
    
    # Step 2: Ask Qwen using the found context
    if context:
        answer = ask_qwen(user_message, context)
        return jsonify({'response': answer, 'context_found': True})
    else:
        return jsonify({
            'response': "I'm sorry, but my knowledge base is empty or the database wasn't found.", 
            'context_found': False
        })

if __name__ == '__main__':
    print("🤖 Local AI Web Agent starting...")
    app.run(debug=True, port=5000)
