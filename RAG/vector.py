import os
import glob
from pathlib import Path
import PyPDF2
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import openai
from typing import List, Tuple
import time

# Set your OpenAI API key

# Directory containing PDFs
PDF_DIR = Path("C:\\user\\ersez\\studyslim\\RAG\\Hoge\\pdfs")

# Model for embeddings
EMBEDDING_MODEL = SentenceTransformer('all-MiniLM-L6-v2')

# FAISS index file
INDEX_FILE = 'faiss_index.idx'
TEXTS_FILE = 'texts.npy'

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file."""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
    return text

def load_and_process_pdfs(pdf_dir: Path) -> List[str]:
    """Load all PDFs, extract text, and split into chunks."""
    all_texts = []
    pdf_files = glob.glob(str(pdf_dir / '*.pdf'))
    print(f"Found {len(pdf_files)} PDF files in {pdf_dir}")
    for pdf_file in pdf_files:
        print(f"Processing {pdf_file}")
        start_time = time.time()
        text = extract_text_from_pdf(pdf_file)
        chunks = [text[i:i+500] for i in range(0, len(text), 500)]
        all_texts.extend(chunks)
        print(f"Extracted {len(chunks)} chunks from {pdf_file} in {time.time() - start_time:.2f} seconds")
    print(f"Total chunks: {len(all_texts)}")
    return all_texts

def create_embeddings(texts: List[str]) -> np.ndarray:
    """Create embeddings for the texts."""
    print(f"Creating embeddings for {len(texts)} text chunks...")
    start_time = time.time()
    embeddings = EMBEDDING_MODEL.encode(texts, convert_to_tensor=False)
    print(f"Embeddings created in {time.time() - start_time:.2f} seconds")
    return np.array(embeddings)

def build_faiss_index(embeddings: np.ndarray, texts: List[str]):
    """Build and save FAISS index."""
    print("Building FAISS index...")
    start_time = time.time()
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    faiss.write_index(index, INDEX_FILE)
    np.save(TEXTS_FILE, texts)
    print(f"FAISS index built and saved in {time.time() - start_time:.2f} seconds.")

def load_faiss_index() -> Tuple[faiss.Index, np.ndarray]:
    """Load FAISS index and texts."""
    print("Loading FAISS index and texts...")
    index = faiss.read_index(INDEX_FILE)
    texts = np.load(TEXTS_FILE, allow_pickle=True)
    print(f"Loaded index with {index.ntotal} vectors and {len(texts)} texts.")
    return index, texts

def retrieve_relevant_texts(query: str, index: faiss.Index, texts: np.ndarray, k: int = 5) -> List[str]:
    """Retrieve top-k relevant texts for the query."""
    print(f"Retrieving top-{k} relevant texts for query: '{query}'")
    query_embedding = EMBEDDING_MODEL.encode([query], convert_to_tensor=False)
    distances, indices = index.search(query_embedding, k)
    relevant_texts = [texts[i] for i in indices[0]]
    print(f"Retrieved {len(relevant_texts)} texts.")
    return relevant_texts

from openai import OpenAI

client = OpenAI(api_key="api_key")

def generate_response(query: str, context: list[str]) -> str:
    """Generate a response using OpenAI with retrieved context."""
    print("Generating response using OpenAI...")
    context_str = '\n'.join(context)
    prompt = f"Context:\n{context_str}\n\nQuestion: {query}\nAnswer:"
    response = client.completions.create(
        model="gpt-3.5-turbo-instruct",  # Updated to a current model
        prompt=prompt,
        max_tokens=150,
        temperature=0.7
    )
    print("Response generated.")
    return response.choices[0].text.strip()

def main():
    total_start = time.time()
    # Check if index exists
    if not os.path.exists(INDEX_FILE):
        print("Building FAISS index...")
        build_start = time.time()
        texts = load_and_process_pdfs(PDF_DIR)
        embeddings = create_embeddings(texts)
        build_faiss_index(embeddings, texts)
        print(f"Total index building time: {time.time() - build_start:.2f} seconds")
    else:
        print("Loading existing FAISS index...")

    index, texts = load_faiss_index()

    # Example query
    query = "what is the studiepunten of Adviseren?"
    query_start = time.time()
    relevant_texts = retrieve_relevant_texts(query, index, texts)
    response = generate_response(query, relevant_texts)
    print(f"Query processing time: {time.time() - query_start:.2f} seconds")
    print(f"Query: {query}")
    print(f"Response: {response}")
    print(f"Total runtime: {time.time() - total_start:.2f} seconds")

if __name__ == "__main__":
    main()