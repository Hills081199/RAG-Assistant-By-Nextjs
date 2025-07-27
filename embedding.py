import os
import sys
import uuid
import json
from datetime import datetime
import fitz  # PyMuPDF
import requests
from typing import List, Dict, Set
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

# Constants cho file tracking
TRACKING_FOLDER = './tracking'
COLLECTIONS_EXPORT_FOLDER = './exports'


def load_processed_files(collection_name: str) -> Dict:
    """Load danh sách các file đã được embedding cho collection"""
    tracking_file = os.path.join(TRACKING_FOLDER, f"{collection_name}_processed.json")
    
    if not os.path.exists(tracking_file):
        return {
            "collection_name": collection_name,
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "processed_files": {}
        }
    
    try:
        with open(tracking_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Lỗi đọc file tracking {tracking_file}: {e}")
        return {
            "collection_name": collection_name,
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "processed_files": {}
        }


def save_processed_files(collection_name: str, processed_data: Dict):
    """Lưu danh sách các file đã được embedding"""
    os.makedirs(TRACKING_FOLDER, exist_ok=True)
    tracking_file = os.path.join(TRACKING_FOLDER, f"{collection_name}_processed.json")
    
    processed_data["last_updated"] = datetime.now().isoformat()
    
    try:
        with open(tracking_file, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, ensure_ascii=False, indent=2)
        print(f"💾 Đã lưu trạng thái tracking vào: {tracking_file}")
    except Exception as e:
        print(f"❌ Lỗi lưu file tracking: {e}")


def get_file_hash(file_path: str) -> str:
    """Tạo hash từ file path, size và modified time để detect changes"""
    try:
        stat = os.stat(file_path)
        file_info = f"{file_path}_{stat.st_size}_{stat.st_mtime}"
        return str(hash(file_info))
    except Exception:
        return str(hash(file_path))


def is_file_already_processed(file_path: str, processed_files: Dict) -> bool:
    """Kiểm tra xem file đã được embedding chưa (chỉ kiểm tra tên file)"""
    file_name = os.path.basename(file_path)
    return file_name in processed_files


def mark_file_as_processed(file_path: str, processed_files: Dict, chunks_count: int):
    """Đánh dấu file đã được embedding"""
    file_name = os.path.basename(file_path)
    processed_files[file_name] = {
        "file_path": file_path,
        "file_hash": get_file_hash(file_path),
        "processed_at": datetime.now().isoformat(),
        "chunks_count": chunks_count,
        "file_size": os.path.getsize(file_path)
    }


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
    
    return len(chunks)


def process_documents_for_collection(collection_name: str, base_folder: str = './documents'):
    folder_path = os.path.join(base_folder, collection_name)

    if not os.path.exists(folder_path):
        print(f"❌ Folder '{folder_path}' không tồn tại!")
        return

    pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
    if not pdf_files:
        print(f"⚠️ Không tìm thấy file PDF nào trong '{folder_path}'")
        return

    # Load tracking data
    processed_data = load_processed_files(collection_name)
    processed_files = processed_data["processed_files"]

    print(f"📁 Found {len(pdf_files)} PDF trong collection '{collection_name}'")
    
    # Kiểm tra files đã được processed
    skipped_files = []
    files_to_process = []
    
    for pdf_file in pdf_files:
        file_path = os.path.join(folder_path, pdf_file)
        print(is_file_already_processed(file_path, processed_files))
        if is_file_already_processed(file_path, processed_files):
            print("ĐÃ BỎ QUA")
            skipped_files.append(pdf_file)
            print(f"⏭️ Bỏ qua file đã embedding: {pdf_file}")
        else:
            files_to_process.append((pdf_file, file_path))

    print(f"\n📊 Tổng quan:")
    print(f"  - Tổng files: {len(pdf_files)}")
    print(f"  - Đã embedding: {len(skipped_files)}")
    print(f"  - Cần embedding: {len(files_to_process)}")

    if skipped_files:
        print(f"\n⏭️ Files đã embedding (bỏ qua):")
        for i, file in enumerate(skipped_files, 1):
            processed_info = processed_files[file]
            print(f"  {i}. {file} (processed: {processed_info['processed_at'][:19]}, chunks: {processed_info['chunks_count']})")

    if not files_to_process:
        print(f"\n✅ Tất cả files trong collection '{collection_name}' đã được embedding!")
        return

    print(f"\n🔄 Files cần embedding:")
    for i, (pdf_file, _) in enumerate(files_to_process, 1):
        print(f"  {i}. {pdf_file}")

    # Process các files chưa được embedding
    for pdf_file, file_path in files_to_process:
        print(f"\n{'=' * 50}\nProcessing: {pdf_file}\nCollection: {collection_name}\nFull path: {file_path}\n{'=' * 50}")

        try:
            chunks_count = process_pdf_to_qdrant(file_path, collection_name)
            
            # Mark file as processed
            mark_file_as_processed(file_path, processed_files, chunks_count)
            
            # Save tracking data after each file
            save_processed_files(collection_name, processed_data)
            
            print(f"✅ Done: {pdf_file} ({chunks_count} chunks)")
            
        except Exception as e:
            print(f"❌ Error processing {pdf_file}: {e}")

    print(f"\n🎉 Hoàn thành xử lý collection '{collection_name}'!")


def export_collection_list(output_folder: str = COLLECTIONS_EXPORT_FOLDER) -> str:
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


def show_tracking_status(collection_name: str = None):
    """Hiển thị trạng thái tracking của collection(s)"""
    if collection_name:
        # Hiển thị cho 1 collection cụ thể
        processed_data = load_processed_files(collection_name)
        processed_files = processed_data["processed_files"]
        
        print(f"\n📊 Trạng thái collection '{collection_name}':")
        print(f"  - Created: {processed_data.get('created_at', 'N/A')[:19]}")
        print(f"  - Last updated: {processed_data.get('last_updated', 'N/A')[:19]}")
        print(f"  - Processed files: {len(processed_files)}")
        
        if processed_files:
            print(f"\n📁 Files đã embedding:")
            for i, (filename, info) in enumerate(processed_files.items(), 1):
                print(f"  {i}. {filename}")
                print(f"     - Size: {info.get('file_size', 0):,} bytes")
                print(f"     - Chunks: {info.get('chunks_count', 0)}")
                print(f"     - Processed: {info.get('processed_at', 'N/A')[:19]}")
    else:
        # Hiển thị tất cả collections
        if not os.path.exists(TRACKING_FOLDER):
            print("⚠️ Chưa có data tracking nào!")
            return
            
        tracking_files = [f for f in os.listdir(TRACKING_FOLDER) if f.endswith('_processed.json')]
        
        if not tracking_files:
            print("⚠️ Không tìm thấy file tracking nào!")
            return
            
        print(f"\n📊 Tổng quan tracking ({len(tracking_files)} collections):")
        
        for tracking_file in sorted(tracking_files):
            collection_name = tracking_file.replace('_processed.json', '')
            processed_data = load_processed_files(collection_name)
            processed_files = processed_data["processed_files"]
            
            print(f"\n  📁 {collection_name}:")
            print(f"     - Files: {len(processed_files)}")
            print(f"     - Last updated: {processed_data.get('last_updated', 'N/A')[:19]}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("⚠️ Hãy nhập lệnh cần thực hiện!")
        print("Cách sử dụng:")
        print("  python3 embedding.py <collection_name>     - Xử lý collection")
        print("  python3 embedding.py export               - Export danh sách collections")
        print("  python3 embedding.py status               - Hiển thị trạng thái tracking tất cả")
        print("  python3 embedding.py status <collection>  - Hiển thị trạng thái collection cụ thể")
        sys.exit(1)

    command = sys.argv[1]
    
    if command == "export":
        # Export danh sách collections
        export_collection_list()
    elif command == "status":
        # Hiển thị trạng thái tracking
        if len(sys.argv) > 2:
            show_tracking_status(sys.argv[2])
        else:
            show_tracking_status()
    else:
        # Process collection bình thường
        collection_name = command
        process_documents_for_collection(collection_name)