import chromadb

def setup_database():
    # 1. Initialize ChromaDB client. 
    # This creates a folder named 'chroma_db' in the current directory to store our data locally.
    client = chromadb.PersistentClient(path="./chroma_db")
    
    # 2. Create a "collection" (similar to a table in a database).
    # We name it 'my_knowledge_base'. If it already exists, we get it instead.
    collection = client.get_or_create_collection(name="my_knowledge_base")
    
    # 3. Read our local knowledge text file
    print("Reading knowledge.txt...")
    try:
        with open("knowledge.txt", "r", encoding="utf-8") as file:
            # Read all lines and remove any extra whitespace or empty lines
            lines = [line.strip() for line in file.readlines() if line.strip()]
    except FileNotFoundError:
        print("Error: knowledge.txt not found. Please create it first.")
        return

    # 4. Prepare the data for ChromaDB
    # ChromaDB needs unique IDs for each piece of text (document)
    documents = []
    ids = []
    
    for i, line in enumerate(lines):
        documents.append(line)
        # We create simple IDs like "doc_0", "doc_1", etc.
        ids.append(f"doc_{i}")
        
    # 5. Add the data to our collection
    # ChromaDB will automatically convert these text documents into "embeddings" (numbers)
    # using its default built-in AI embedding model so it can be searched later.
    print(f"Adding {len(documents)} facts to ChromaDB...")
    collection.add(
        documents=documents,
        ids=ids
    )
    
    print("Success! Knowledge base has been created and saved locally in the 'chroma_db' folder.")

if __name__ == "__main__":
    setup_database()
