import os
import sys
import uuid
import json
from datetime import datetime
import fitz  # PyMuPDF
import requests
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
import dotenv
from transformers import GPT2TokenizerFast
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

# Load env
tokenizer = GPT2TokenizerFast.from_pretrained("gpt2")
dotenv.load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
QDRANT_URL = os.getenv('QDRANT_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')

# Khởi tạo Qdrant client
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)


def embed_text_openai(text: str):
    """Gọi API OpenAI để embed text"""
    headers = {
        'Authorization': f'Bearer {OPENAI_API_KEY}',
        'Content-Type': 'application/json'
    }
    data = {"input": text, "model": "text-embedding-3-small"}
    response = requests.post('https://api.openai.com/v1/embeddings', headers=headers, json=data)
    response.raise_for_status()
    return response.json()['data'][0]['embedding']


def simple_chunking(text: str, chunk_size: int = 1000, chunk_overlap: int = 100) -> List[str]:
    """Chunk text để dễ embedding"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return splitter.split_text(text)


def create_collection_if_not_exists(collection_name: str, vector_size: int = 1536):
    """Tạo collection mới nếu chưa tồn tại"""
    try:
        collections = qdrant.get_collections().collections
        if any(c.name == collection_name for c in collections):
            print(f"✅ Collection '{collection_name}' đã tồn tại, dùng lại.")
            return
    except Exception:
        pass

    print(f"📂 Tạo collection mới: {collection_name}")
    qdrant.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
    )


def find_chunk_pages(chunk: str, full_text: str, page_boundaries: List, chunk_start_in_full_text: int):
    """Tìm trang bắt đầu và kết thúc của chunk dựa trên vị trí thực tế trong full_text"""
    chunk_end_in_full_text = chunk_start_in_full_text + len(chunk)
    
    start_page = None
    end_page = None
    
    for page_num, page_start, page_end in page_boundaries:
        # Tìm trang bắt đầu: trang có chứa ký tự đầu tiên của chunk
        if start_page is None and page_start <= chunk_start_in_full_text < page_end:
            start_page = page_num
        
        # Tìm trang kết thúc: trang có chứa ký tự cuối cùng của chunk
        if page_start < chunk_end_in_full_text <= page_end:
            end_page = page_num
    
    # Nếu không tìm thấy end_page, có thể chunk kết thúc ở cuối document
    if end_page is None and start_page is not None:
        end_page = start_page
    
    return start_page, end_page


def process_pdf_to_qdrant(file_path: str, collection_name: str, chunk_size: int = 800, chunk_overlap: int = 200):
    print(f"Đang xử lý file: {file_path}")

    # Đảm bảo collection đã tồn tại
    create_collection_if_not_exists(collection_name)

    doc = fitz.open(file_path)
    full_text = ''
    page_boundaries = []
    offset = 0

    for page_num, page in enumerate(doc):
        text = page.get_text()
        start = offset
        end = start + len(text)
        page_boundaries.append((page_num + 1, start, end))
        full_text += text
        offset = end

    print(f"Đã đọc {len(doc)} trang, tổng cộng {len(full_text)} ký tự")

    # Chunking text
    chunks = simple_chunking(full_text, chunk_size, chunk_overlap)
    print(f"Đã tạo {len(chunks)} chunks")

    # Tìm vị trí thực tế của từng chunk trong full_text
    for i, chunk in enumerate(chunks):
        # Tìm vị trí bắt đầu của chunk trong full_text
        chunk_start_in_full_text = full_text.find(chunk)
        
        # Nếu không tìm thấy exact match, tìm gần đúng bằng cách tìm substring đầu tiên
        if chunk_start_in_full_text == -1:
            # Thử tìm với 50 ký tự đầu của chunk
            chunk_preview = chunk[:50] if len(chunk) > 50 else chunk
            chunk_start_in_full_text = full_text.find(chunk_preview)
            
            # Nếu vẫn không tìm thấy, ước tính dựa trên vị trí chunk
            if chunk_start_in_full_text == -1:
                estimated_start = i * (chunk_size - chunk_overlap)
                chunk_start_in_full_text = min(estimated_start, len(full_text) - len(chunk))

        start_page, end_page = find_chunk_pages(chunk, full_text, page_boundaries, chunk_start_in_full_text)

        print(f"Embedding + Upsert chunk {i + 1}/{len(chunks)} (pages {start_page}-{end_page}): {chunk[:80]}...")

        try:
            vector = embed_text_openai(chunk)
            
            # Upsert ngay từng chunk
            qdrant.upsert(
                collection_name=collection_name,
                points=[{
                    'id': str(uuid.uuid4()),
                    'vector': vector,
                    'payload': {
                        'text': chunk,
                        'chunk_index': i,
                        'chunk_size': len(chunk),
                        'start_page': start_page,
                        'end_page': end_page,
                        'source_file': os.path.basename(file_path),
                        'source_path': file_path,
                        'chunk_position': chunk_start_in_full_text  # Thêm thông tin vị trí để debug
                    }
                }]
            )
        except Exception as e:
            print(f"❌ Lỗi khi embedding chunk {i}: {e}")


def process_documents_for_collection(collection_name: str, base_folder: str = './documents'):
    folder_path = os.path.join(base_folder, collection_name)

    if not os.path.exists(folder_path):
        print(f"❌ Folder '{folder_path}' không tồn tại!")
        return

    pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
    if not pdf_files:
        print(f"⚠️ Không tìm thấy file PDF nào trong '{folder_path}'")
        return

    print(f"📁 Found {len(pdf_files)} PDF trong collection '{collection_name}'")
    for i, pdf_file in enumerate(pdf_files, 1):
        print(f"{i}. {pdf_file}")

    for pdf_file in pdf_files:
        file_path = os.path.join(folder_path, pdf_file)
        print(f"\n{'=' * 50}\nProcessing: {pdf_file}\nCollection: {collection_name}\nFull path: {file_path}\n{'=' * 50}")

        try:
            process_pdf_to_qdrant(file_path, collection_name)
            print(f"✅ Done: {pdf_file}")
        except Exception as e:
            print(f"❌ Error processing {pdf_file}: {e}")

def export_collection_list(output_folder: str = './exports') -> str:
    """Export danh sách tên collections ra file JSON cho frontend"""
    try:
        # Tạo folder export nếu chưa có
        os.makedirs(output_folder, exist_ok=True)
        
        # Lấy danh sách collections
        collections = qdrant.get_collections().collections
        
        # Tạo danh sách tên collections
        collection_list = {
            "exported_at": datetime.now().isoformat(),
            "total_collections": len(collections),
            "collections": [collection.name for collection in collections]
        }
        
        # Export ra file JSON
        export_filename = "collections.json"
        export_path = os.path.join(output_folder, export_filename)
        
        with open(export_path, 'w', encoding='utf-8') as f:
            json.dump(collection_list, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Đã export danh sách collections ra: {export_path}")
        print(f"📊 Tổng cộng {len(collections)} collections")
        
        return export_path
        
    except Exception as e:
        print(f"❌ Lỗi khi export collections: {e}")
        return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("⚠️ Hãy nhập tên collection cần xử lý!")
        print("Ví dụ: python3 embedding.py ten_collection")
        print("Hoặc: python3 embedding.py export - để export danh sách collections")
        sys.exit(1)

    command = sys.argv[1]
    if command == "export":
        # Export danh sách collections
        export_collection_list()
    else:
        # Process collection bình thường
        collection_name = command
        process_documents_for_collection(collection_name)
