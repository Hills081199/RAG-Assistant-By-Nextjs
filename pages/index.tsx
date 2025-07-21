import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';
interface SearchResultItem {
  payload: {
    text: string;
  };
  score?: number;
}
// Config should be stored in an .env file and accessed via process.env
const QDRANT_URL = "https://98c798e6-7675-4794-abca-2b695e6e00a3.us-west-2-0.aws.cloud.qdrant.io"
const QDRANT_COLLECTION = "huonglan86"
const QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Lh8pBeYzqpT1J7ZxK0JkKDwIeIXySMqZ0cyEpX53U68"
// const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_KEY = "sk" + "-" + "proj-q1eL-ZLttXJ33TXjm0hYxJYMdXLgognZ0gHC7MJ58VEWl8kbpF0y-wTPH7IsFiyUldVLLd30hAT3BlbkFJWFsiPFeFo3-gqQ8SSdmJyqwPQxhzdqYNnjOJtugIrTsQAwOt_QfjJK_AOUIDnlKTzkWXUj2bQA"
const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});
console.log(qdrantClient)

const ITEMS_PER_PAGE = 5; // Number of items per page
const MAX_HISTORY_ITEMS = 50; // Maximum history items to store
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage
});
export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ question: string; answer: string; timestamp: string }[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const savedHistory = localStorage.getItem('questionHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const saveHistory = (newEntry: { question: string; answer: string; timestamp: string }) => {
    try {
      const updatedHistory = [...history, newEntry].slice(-MAX_HISTORY_ITEMS);
      setHistory(updatedHistory);
      localStorage.setItem('questionHistory', JSON.stringify(updatedHistory));
    } catch (err) {
      console.error('Error saving history:', err);
    }
  };

  const filteredHistory = history.filter(
    (item) =>
      searchKeyword === '' ||
      item.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchKeyword.toLowerCase())
  ).reverse();

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (historyPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  const askQuestion = async () => {
    if (!question.trim()) {
      alert('Vui lòng nhập câu hỏi');
      return;
    }

    if (!QDRANT_URL || !QDRANT_COLLECTION || !QDRANT_API_KEY || !OPENAI_API_KEY) {
      alert('Thiếu thông tin cấu hình API. Vui lòng kiểm tra cấu hình');
      return;
    }

    try {
      setLoading(true);
      setAnswer('');

      // 1. Get embedding from OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: question,
      });

      const embedding = embeddingResponse.data[0].embedding;
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding, limit: 15 })
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Search API error:', error);
        throw new Error(error.message || 'Failed to search');
      }
      
      const data = await res.json();
      console.log('Search results:', data);
      
      // // Filter results by score threshold (0.3)
      // const filteredResults = data.filter((item: { score?: number }) => (item.score ?? 0) >= 0.3);
      
      // if (filteredResults.length === 0) {
      //   setAnswer('Không tìm thấy thông tin liên quan trong cơ sở dữ liệu. Vui lòng thử lại với từ khóa khác hoặc mô tả chi tiết hơn.');
      //   setLoading(false);
      //   return;
      // }
      
      // // 3. Create context from filtered search results
      // const contexts = filteredResults
      // Nếu không filter score, chỉ lấy top N kết quả
      const topResults = data.slice(0, 5) as SearchResultItem[];

      // Tiếp tục xử lý với topResults, ví dụ:
      const contexts = topResults.map((item: SearchResultItem) => item.payload.text).join('\n---\n');

      if (!contexts) {
        setAnswer('Không tìm thấy thông tin liên quan đến câu hỏi của bạn.');
        saveHistory({ question, answer: 'Không tìm thấy thông tin liên quan.', timestamp: new Date().toISOString() });
        return;
      }

      const prompt = `Bạn là trợ lý nghiên cứu chuyên về quy hoạch đô thị và phát triển bền vững. Nhiệm vụ của bạn là phân tích CHÍNH XÁC thông tin từ tài liệu được cung cấp.

## NGUYÊN TẮC QUAN TRỌNG NHẤT:
- CHỈ sử dụng thông tin có trong tài liệu tham khảo
- KHÔNG bịa đặt, suy đoán hoặc thêm thông tin không có
- Nếu không đủ thông tin để trả lời, hãy NÓI RÕ điều này
- Phân biệt rõ giữa thông tin CHẮC CHẮN và thông tin CÓ THỂ

## THÔNG TIN THAM KHẢO:
${contexts}

## CÂU HỎI:
${question}

## YÊU CẦU TRẢ LỜI:

### 1. THÔNG TIN CÓ SẴN (từ tài liệu)
- Trình bày chính xác những gì tài liệu đã nêu
- Trích dẫn cụ thể các đoạn/số liệu liên quan
- Không diễn giải quá mức

### 2. PHÂN TÍCH DỰA TRÊN THÔNG TIN CÓ SẴN
- Chỉ phân tích dựa trên dữ liệu trong tài liệu
- Nếu có nhiều quan điểm khác nhau, nêu rõ từng quan điểm
- Không đưa ra kết luận vượt quá thông tin được cung cấp

### 3. NHỮNG ĐIỀU CHƯA RÕ HOẶC THIẾU
- Liệt kê rõ ràng những thông tin cần thiết nhưng không có trong tài liệu
- Những câu hỏi không thể trả lời được với thông tin hiện có
- Đề xuất cần tìm thêm nguồn thông tin nào cụ thể

## LƯU Ý BẮT BUỘC:
- Nếu tài liệu không đề cập đến câu hỏi: "Tài liệu không cung cấp thông tin về vấn đề này"
- Nếu thông tin không đủ để kết luận: "Dựa trên thông tin hiện có, chưa thể đưa ra kết luận chắc chắn"
- Sử dụng cụm từ: "Theo tài liệu...", "Tài liệu nêu rõ...", "Không có thông tin về..."
- Trả lời bằng tiếng Việt, ngôn ngữ rõ ràng, chính xác

BẮT ĐẦU PHÂN TÍCH NGAY, CHỈ DỰA TRÊN THÔNG TIN CÓ TRONG TÀI LIỆU:`;

      // 4. Call Chat Completion with GPT-3.5-turbo
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Bạn là chuyên gia nghiên cứu về quy hoạch đô thị và phát triển bền vững. Trả lời các câu hỏi bằng tiếng Việt với phong cách học thuật, chi tiết, và dễ hiểu, hỗ trợ người dùng trong việc nghiên cứu tài liệu.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.6,
      });

      const response = chatCompletion.choices[0].message.content;
      setAnswer(response || 'Không nhận được phản hồi từ hệ thống.');
      saveHistory({ question, answer: response || '', timestamp: new Date().toISOString() });
    } catch (err: Error | unknown) {
      console.error(
        'Error details:',
        err instanceof Error
          ? {
              message: err.message,
              ...(axios.isAxiosError(err)
                ? {
                    status: err.response?.status,
                    data: err.response?.data,
                  }
                : {}),
            }
          : 'An unknown error occurred'
      );

      let errorMessage = 'Có lỗi xảy ra khi truy vấn.';

      interface ApiError extends Error {
        code?: string;
        response?: {
          status?: number;
          data?: {
            error?: {
              message?: string;
            };
            message?: string;
          };
        };
      }

      if (err && typeof err === 'object') {
        const errorObj = err as ApiError;
        
        // Handle network errors
        if (errorObj.code === 'ERR_NETWORK' || errorObj.message?.includes('Network Error')) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        } 
        // Handle response errors
        else if (errorObj.response) {
          const status = errorObj.response.status;
          const data = errorObj.response.data;
          
          if (status === 401) {
            errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra lại.';
          } else if (status === 404) {
            errorMessage = 'Không tìm thấy collection trong Qdrant.';
          } else if (status === 429) {
            errorMessage = 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.';
          } else if (status === 400) {
            errorMessage = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra câu hỏi hoặc cấu hình.';
          } else {
            const errorMessageFromServer = data?.error?.message || data?.message;
            errorMessage = `Lỗi từ máy chủ: ${errorMessageFromServer || 'Không xác định'}`;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = `Lỗi: ${err.message}`;
      }

      setAnswer(errorMessage);
      saveHistory({ question, answer: errorMessage, timestamp: new Date().toISOString() });
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử câu hỏi?')) {
      try {
        localStorage.removeItem('questionHistory');
        setHistory([]);
        setExpandedItems(new Set());
        setHistoryPage(1);
        setSearchKeyword('');
        alert('Lịch sử câu hỏi đã được xóa.');
      } catch (err) {
        console.error('Error clearing history:', err);
        alert('Không thể xóa lịch sử câu hỏi.');
      }
    }
  };

  const toggleHistoryVisibility = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      setHistoryPage(1);
    }
  };

  const goToPage = (page: number) => {
    setHistoryPage(page);
    setExpandedItems(new Set());
  };

  const renderHistoryItem = (item: { question: string; answer: string; timestamp: string }, index: number) => {
    const actualIndex = startIndex + index;
    const isExpanded = expandedItems.has(actualIndex);
    const shouldTruncate = item.answer.length > 150;

    const toggleExpanded = () => {
      const newExpanded = new Set(expandedItems);
      if (isExpanded) {
        newExpanded.delete(actualIndex);
      } else {
        newExpanded.add(actualIndex);
      }
      setExpandedItems(newExpanded);
    };

    return (
      <div className="history-item" key={actualIndex}>
        <div className="history-item-header">
          <span className="history-question">Q: {item.question}</span>
          <span className="history-timestamp">
            {new Date(item.timestamp).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="history-answer-label">Trả lời:</div>
        <div className="history-answer">
          {isExpanded || !shouldTruncate ? item.answer : `${item.answer.substring(0, 150)}...`}
        </div>
        {shouldTruncate && (
          <button onClick={toggleExpanded} className="expand-button">
            {isExpanded ? '↑ Thu gọn' : '↓ Xem thêm'}
          </button>
        )}
      </div>
    );
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`page-button ${historyPage === i ? 'active-page-button' : ''}`}
          onClick={() => goToPage(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination-container">
        <button
          className={`nav-button ${historyPage === 1 ? 'nav-button-disabled' : ''}`}
          onClick={() => goToPage(Math.max(1, historyPage - 1))}
          disabled={historyPage === 1}
        >
          ← Trước
        </button>
        <div className="pages-container">{pages}</div>
        <button
          className={`nav-button ${historyPage === totalPages ? 'nav-button-disabled' : ''}`}
          onClick={() => goToPage(Math.min(totalPages, historyPage + 1))}
          disabled={historyPage === totalPages}
        >
          Sau →
        </button>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="header-title">Trợ lý Nghiên cứu Quy hoạch</h1>
        <p className="header-subtitle">Hỗ trợ nghiên cứu tài liệu quy hoạch đô thị</p>
      </div>

      <div className="input-section">
        <textarea
          className="input"
          placeholder="Nhập câu hỏi về quy hoạch đô thị hoặc phát triển bền vững..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <div className="button-container">
          <button
            className={`ask-button ${loading ? 'button-disabled' : ''}`}
            onClick={askQuestion}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-container">
                <span className="spinner"></span> Đang xử lý...
              </span>
            ) : (
              'Gửi câu hỏi'
            )}
          </button>
          <button
            className={`history-toggle-button ${loading ? 'button-disabled' : ''}`}
            onClick={toggleHistoryVisibility}
            disabled={loading}
          >
            {showHistory ? 'Ẩn lịch sử' : `Lịch sử (${history.length})`}
          </button>
          <button
            className={`clear-button ${loading ? 'button-disabled' : ''}`}
            onClick={clearHistory}
            disabled={loading}
          >
            Xóa lịch sử
          </button>
        </div>
      </div>

      <div className="answer-section">
        {answer && (
          <div className="answer-card">
            <div className="answer-label">Trả lời:</div>
            <div className="answer-text">{answer}</div>
          </div>
        )}

        {showHistory && (
          <div className="history-section">
            <div className="history-header">
              <h2 className="history-label">Lịch sử câu hỏi ({filteredHistory.length})</h2>
              <input
                className="search-input"
                placeholder="Tìm kiếm trong lịch sử..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setHistoryPage(1);
                }}
              />
            </div>

            {filteredHistory.length > 0 ? (
              <>
                <div className="history-list">
                  {paginatedHistory.map((item, index) => renderHistoryItem(item, index))}
                </div>
                {renderPaginationControls()}
                <div className="pagination-info">
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredHistory.length)} /{' '}
                  {filteredHistory.length} mục
                </div>
              </>
            ) : (
              <div className="empty-history-container">
                <p className="empty-history-text">
                  {searchKeyword ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử câu hỏi'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps = async () => {
  return {
    props: {}, // No server-side props needed
  };
};
