import telebot
import os
from dotenv import load_dotenv
from chat_agent import search_knowledge_base, ask_qwen

# Load environment variables from .env file
load_dotenv()

# The bot token securely loaded from .env
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Initialize the bot
bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = (
        "🤖 Hello! I am your Local AI Agent.\n\n"
        "I am connected directly to your laptop's brain (Qwen2.5-7B) and your local knowledge base.\n"
        "Ask me anything, and I'll search the knowledge base or use my general intelligence!"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    user_query = message.text
    
    # Send a "typing..." action so the user knows we are processing
    bot.send_chat_action(message.chat.id, 'typing')
    
    try:
        # Step 1: Search ChromaDB for relevant info
        context = search_knowledge_base(user_query)
        
        if context == "ERROR_NO_DB":
            bot.reply_to(message, "Error: Knowledge base not found. Please run 'python setup_knowledge.py' on the server first.")
            return

        # Step 2: Ask Qwen using the found context
        if context:
            answer = ask_qwen(user_query, context)
            bot.reply_to(message, answer)
        else:
            bot.reply_to(message, "I'm sorry, but my knowledge base is empty or couldn't be loaded.")
            
    except Exception as e:
        bot.reply_to(message, f"Oops! Something went wrong on the local server: {e}")

if __name__ == '__main__':
    print("🤖 Telegram Bot is starting...")
    print("Listening for messages...")
    # Start listening to Telegram forever
    bot.infinity_polling()
