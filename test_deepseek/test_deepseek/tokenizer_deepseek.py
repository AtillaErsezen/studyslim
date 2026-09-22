import torch
from transformers import AutoModel, AutoTokenizer
from pdf2image import convert_from_path
import os

def pdf_to_markdown_deepseek(pdf_path, page_number=1):
    # 1. Load the DeepSeek-OCR Model
    # Note: trust_remote_code=True is required as this uses custom DeepSeek architecture
    print("Loading DeepSeek-OCR model... (this may take a moment)")
    model_name = "deepseek-ai/DeepSeek-OCR"
    
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    model = AutoModel.from_pretrained(
        model_name, 
        trust_remote_code=True, 
        torch_dtype=torch.bfloat16,  # Use bfloat16 for efficiency
        device_map="cuda"            # Requires NVIDIA GPU
    )

    # 2. Convert the Specific PDF Page to an Image
    print(f"Converting Page {page_number} of {pdf_path} to image...")
    images = convert_from_path(pdf_path, first_page=page_number, last_page=page_number)
    
    if not images:
        raise ValueError("Could not convert PDF page to image.")
    
    target_image = images[0]
    # Save temporarily if the model requires a file path, or pass object if supported
    temp_img_path = "temp_page_input.png"
    target_image.save(temp_img_path)

    # 3. Define the "Super-OCR" Prompt
    # The <|grounding|> token triggers the specific layout-aware processing
    prompt = "<image>\n<|grounding|>Convert the document to markdown."

    # 4. Run Inference (Optical Compression -> Text Reconstruction)
    print("Running Optical Compression & Reconstruction...")
    
    # The 'infer' method is part of DeepSeek's custom code loaded via trust_remote_code
    result = model.infer(
        tokenizer=tokenizer,
        prompt=prompt,
        image_file=temp_img_path,
        output_path="./output",      # Where to save visualizations (optional)
        base_size=1024,              # Resolution for the visual encoder
        image_size=640,
        crop_mode=True,              # Helps with scanning whole pages
        save_results=False
    )

    # Clean up
    if os.path.exists(temp_img_path):
        os.remove(temp_img_path)

    return result['text']

# --- Usage Example ---
if __name__ == "__main__":
    pdf_filename = "Studyguide.pdf" # Replace with your actual file path
    
    try:
        markdown_output = pdf_to_markdown_deepseek(pdf_filename, page_number=1)
        
        print("\n--- DeepSeek-OCR Output ---\n")
        print(markdown_output)
        
        # Save to file for your RAG system
        with open("page_2_structured.md", "w", encoding="utf-8") as f:
            f.write(markdown_output)
            
    except Exception as e:
        print(f"Error: {e}")