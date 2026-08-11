import asyncio
from backend.llm import ollama_client

async def test_planning():
    print("Testing planning prompt with format='json'...")
    prompt = """You are a research planner. Analyze this request: "test"
Generate 2-3 specific web search queries to find the best modern UI patterns, libraries, and design inspiration for this.
Output ONLY JSON in this format: {"queries": ["query 1", "query 2"]}"""

    raw = ""
    try:
        async for token in ollama_client.generate_stream(prompt=prompt, system="You output only JSON.", temperature=0.3, format="json"):
            raw += token
            print(token, end="", flush=True)
        print(f"\n\nRAW OUTPUT REPR: {repr(raw)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_planning())
