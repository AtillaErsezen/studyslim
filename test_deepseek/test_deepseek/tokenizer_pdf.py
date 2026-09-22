import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pathlib import Path
import PyPDF2

# --- 1. SETUP: Define Document and Model ---

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            print(f"📄 PDF has {num_pages} pages")
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                page_text = page.extract_text()
                text += page_text + "\n"
                print(f"  ✓ Extracted page {page_num}/{num_pages}")
        
        return text
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
        return None

# Load the PDF document
script_dir = Path(__file__).parent
pdf_path = script_dir / "Studyguide.pdf"

if not pdf_path.exists():
    print(f"❌ Error: PDF file not found at {pdf_path}")
    exit(1)

print(f"📖 Loading PDF: {pdf_path}")
DOCUMENT_TEXT = extract_text_from_pdf(pdf_path)

if not DOCUMENT_TEXT or not DOCUMENT_TEXT.strip():
    print("❌ Error: No text extracted from PDF")
    exit(1)

print(f"✅ Extracted {len(DOCUMENT_TEXT)} characters from PDF\n")

# Use a lightning-fast, small embedding model for the MVP
EMBEDDING_MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2' # Smallest model that gives good performance
MODEL = SentenceTransformer(EMBEDDING_MODEL_NAME)


def run_rag_pipeline(document_text, query, chunk_size=300, chunk_overlap=50, top_k=2):
    """Executes the 4 core RAG steps: Ingest, Index, Retrieve, Augment/Generate."""

    # --- STEP 1: INGEST & CHUNK ---
    # Break the document into smaller, manageable pieces (chunks)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len
    )
    chunks = text_splitter.split_text(document_text)
    print(f"1. Ingest & Chunk: Document split into {len(chunks)} chunks.")

    # --- STEP 2: EMBED & INDEX (FAISS) ---
    # Convert text chunks into vectors (embeddings)
    chunk_embeddings = MODEL.encode(chunks, convert_to_numpy=True)
    
    # Get the dimension of the vectors
    dimension = chunk_embeddings.shape[1]
    
    # Build a simple FAISS index (IndexFlatL2 uses Euclidean distance)
    index = faiss.IndexFlatL2(dimension)
    index.add(chunk_embeddings.astype('float32'))
    print(f"2. Embed & Index: FAISS index created with dimension {dimension}.")

    # --- STEP 3: RETRIEVE RELEVANT CONTEXT ---
    
    # Convert the user query into a vector
    query_vector = MODEL.encode([query], convert_to_numpy=True).astype('float32')

    # Search the FAISS index for the top_k nearest neighbors
    distances, indices = index.search(query_vector, top_k)
    
    # Extract the original text chunks corresponding to the indices
    retrieved_chunks = [chunks[i] for i in indices[0]]
    
    print(f"3. Retrieve: Found {len(retrieved_chunks)} relevant chunks.")

    # --- STEP 4: AUGMENT & GENERATE (Simulated) ---

    # Combine retrieved chunks and the query into a single prompt for the LLM
    context_string = "\n---\n".join(retrieved_chunks)
    
    # This is the final prompt you would send to a model like GPT-4 or Llama-3
    final_prompt = f"""
    You are an expert academic assistant. Use ONLY the provided context below to answer the user's question.
    If the answer is not in the context, state that you cannot find the information.

    CONTEXT:
    {context_string}

    QUESTION: {query}
    """
    
    return final_prompt, retrieved_chunks

# --- Execute the Pipeline ---

USER_QUERY = "Who is the course coordinator and what are the assessment weights?"

final_prompt_to_llm, retrieved_context = run_rag_pipeline(
    DOCUMENT_TEXT, 
    USER_QUERY, 
    chunk_size=300, 
    chunk_overlap=50,
    top_k=3
)

print("\n" + "="*50)
print("🔑 Retrieved Context Chunks:")
print("="*50)
for i, chunk in enumerate(retrieved_context):
    print(f"Chunk {i+1}:\n{chunk}\n")

print("="*50)
print("📝 Final LLM Prompt (The output you send to GPT-4/Llama-3):")
print("="*50)
print(final_prompt_to_llm)