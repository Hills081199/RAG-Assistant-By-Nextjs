import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OpenAI from 'openai';
// import { QdrantClient } from '@qdrant/js-client-rest';

// Urban Planning RAG Prompt Configuration
interface RAGPromptConfig {
  contexts: string;
  question: string;
}

interface PromptTemplate {
  systemPrompt: string;
  generatePrompt: (config: RAGPromptConfig) => string;
}
const urbanPlanningRAGPrompt: PromptTemplate = {
  systemPrompt: `Bạn là chuyên gia cao cấp trong lĩnh vực quy hoạch đô thị, am hiểu sâu rộng về quy hoạch không gian, phát triển bền vững, kinh tế đô thị, chính sách đất đai, hạ tầng kỹ thuật, giao thông, môi trường và biến đổi khí hậu. Nhiệm vụ của bạn là phân tích và trích xuất thông tin chính xác từ tài liệu quy hoạch, cung cấp nhận định dựa trên dữ liệu, đồng thời đảm bảo mọi lập luận đều dựa trên nguồn tham chiếu rõ ràng và kiến thức chuyên môn được kiểm chứng.`,

  generatePrompt: (config: RAGPromptConfig): string => {
    return `Bạn là một trợ lý nghiên cứu chuyên về quy hoạch đô thị và phát triển bền vững, hỗ trợ người dùng trong việc nghiên cứu tài liệu. Dựa trên thông tin tham khảo dưới đây, hãy trả lời câu hỏi một cách chi tiết, rõ ràng và có cấu trúc, phù hợp với mục đích nghiên cứu học thuật. Câu trả lời cần bao gồm:
1. Một đoạn giới thiệu ngắn giải thích bối cảnh của câu hỏi.
2. Phân tích chi tiết dựa trên thông tin tham khảo, sử dụng các ví dụ cụ thể nếu có.
3. Kết luận ngắn gọn và gợi ý các tài liệu hoặc hướng nghiên cứu bổ sung nếu phù hợp.

Thông tin tham khảo:
${config.contexts}

Câu hỏi: ${config.question}

Hãy trả lời bằng tiếng Việt, sử dụng ngôn ngữ học thuật, dễ hiểu và chính xác.`;

  }
};
/**
 * Utility class for Urban Planning RAG System
 */
class UrbanPlanningRAG {
  private promptTemplate: PromptTemplate;

  constructor() {
    this.promptTemplate = urbanPlanningRAGPrompt;
  }

  /**
   * Generate analysis prompt for urban planning documents
   */
  generateAnalysisPrompt(contexts: string, question: string): string {
    if (!contexts || !contexts.trim()) {
      throw new Error("Contexts cannot be empty");
    }

    if (!question || !question.trim()) {
      throw new Error("Question cannot be empty");
    }

    return this.promptTemplate.generatePrompt({ contexts, question });
  }

  /**
   * Get system prompt for initializing the assistant
   */
  getSystemPrompt(): string {
    return this.promptTemplate.systemPrompt;
  }

  /**
   * Validate if response follows the required format
   */
  validateResponse(response: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const requiredPhrases = [
      "Theo tài liệu",
      "Tài liệu nêu rõ",
      "Dữ liệu cho thấy",
      "Tài liệu không đề cập",
      "Thông tin này không có",
      "Cần thêm dữ liệu"
    ];

    // Check if response contains required citation phrases
    const hasRequiredPhrases = requiredPhrases.some(phrase =>
      response.toLowerCase().includes(phrase.toLowerCase())
    );

    if (!hasRequiredPhrases) {
      issues.push("Thiếu cụm từ trích dẫn bắt buộc");
    }

    // Check for potential hallucination indicators
    const hallucinationIndicators = [
      "theo kinh nghiệm",
      "thông thường",
      "như chúng ta biết",
      "theo lý thuyết chung",
      "dựa trên kinh nghiệm"
    ];

    const hasHallucination = hallucinationIndicators.some(indicator =>
      response.toLowerCase().includes(indicator.toLowerCase())
    );

    if (hasHallucination) {
      issues.push("Có dấu hiệu sử dụng kiến thức ngoài tài liệu");
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Interfaces
interface SearchResultItem {
  payload: {
    text: string;
    source_file?: string;  // Make optional with ?
    start_page?: string | number;
    end_page?: string | number;
  }
  text: string
  score?: number
}

// Config should be stored in an .env file and accessed via process.env
const QDRANT_URL = "https://98c798e6-7675-4794-abca-2b695e6e00a3.us-west-2-0.aws.cloud.qdrant.io"
const QDRANT_COLLECTION = "huonglan86"
const QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Lh8pBeYzqpT1J7ZxK0JkKDwIeIXySMqZ0cyEpX53U68"
const OPENAI_API_KEY = "sk" + "-" + "proj-q1eL-ZLttXJ33TXjm0hYxJYMdXLgognZ0gHC7MJ58VEWl8kbpF0y-wTPH7IsFiyUldVLLd30hAT3BlbkFJWFsiPFeFo3-gqQ8SSdmJyqwPQxhzdqYNnjOJtugIrTsQAwOt_QfjJK_AOUIDnlKTzkWXUj2bQA"

// const qdrantClient = new QdrantClient({
//   url: QDRANT_URL,
//   apiKey: QDRANT_API_KEY,
// });

const ITEMS_PER_PAGE = 5; // Number of items per page
const MAX_HISTORY_ITEMS = 50; // Maximum history items to store

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage
});

// Initialize RAG system
const ragSystem = new UrbanPlanningRAG();

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ question: string; answer: string; timestamp: string; isValidated?: boolean; validationIssues?: string[] }[]>([]);
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

  const saveHistory = (newEntry: { question: string; answer: string; timestamp: string; isValidated?: boolean; validationIssues?: string[] }) => {
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
        model: 'text-embedding-3-large',
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
      const sortedDataByScore = data.sort((a: SearchResultItem, b: SearchResultItem) => (b.score ?? 0) - (a.score ?? 0));
      console.log('Search results:', sortedDataByScore);

      // Get top results
      const topResults = sortedDataByScore.slice(0, 8) as SearchResultItem[];
      const contexts = topResults.map((item: SearchResultItem) => item.payload.text).join('\n---\n');

      if (!contexts) {
        const noResultsMessage = 'Không tìm thấy thông tin liên quan đến câu hỏi của bạn.';
        setAnswer(noResultsMessage);
        saveHistory({
          question,
          answer: noResultsMessage,
          timestamp: new Date().toISOString(),
          isValidated: true,
          validationIssues: []
        });
        return;
      }

      // 3. Generate prompt using RAG system
      const prompt = ragSystem.generateAnalysisPrompt(contexts, question);

      // 4. Call Chat Completion with GPT-3.5-turbo using the new system prompt
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: ragSystem.getSystemPrompt()
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2500,
        temperature: 0.7,
      });

      const response = chatCompletion.choices[0].message.content;

      // Format source information
      const formatSourceInfo = (result: SearchResultItem) => {
        const sourceFile = result.payload?.source_file || 'N/A';
        const startPage = result.payload?.start_page || 'N/A';
        const endPage = result.payload?.end_page || 'N/A';
        return `Nguồn: ${sourceFile} (Trang ${startPage}-${endPage})`;
      };

      // Get unique sources
      const uniqueSources = Array.from(
        new Set(
          topResults
            .filter(result => result.payload?.source_file)
            .map(result => formatSourceInfo(result))
        )
      );

      // Add sources to the answer
      const sourcesSection = uniqueSources.length > 0
        ? `\n\n**Nguồn tham khảo:**\n${uniqueSources.join('\n')}`
        : '';

      setSources(uniqueSources);

      const finalAnswer = (response || 'Không nhận được phản hồi từ hệ thống.')

      // 5. Validate the response
      const validation = ragSystem.validateResponse(finalAnswer);

      // Log validation results for debugging
      if (!validation.isValid) {
        console.warn('Response validation issues:', validation.issues);
      }

      setAnswer(finalAnswer);
      saveHistory({
        question,
        answer: finalAnswer + sourcesSection,
        timestamp: new Date().toISOString(),
        isValidated: validation.isValid,
        validationIssues: validation.issues
      });

      // Show validation warning if needed (optional)
      if (!validation.isValid && validation.issues.length > 0) {
        console.warn('Chú ý: Phản hồi có thể không tuân thủ đầy đủ nguyên tắc phân tích:', validation.issues.join(', '));
      }

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
      saveHistory({
        question,
        answer: errorMessage,
        timestamp: new Date().toISOString(),
        isValidated: false,
        validationIssues: ['System error']
      });
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

  const renderHistoryItem = (item: { question: string; answer: string; timestamp: string; isValidated?: boolean; validationIssues?: string[] }, index: number) => {
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
          <div className="history-metadata">
            {item.isValidated === false && (
              <span className="validation-warning" title={`Vấn đề: ${item.validationIssues?.join(', ')}`}>
                ⚠️
              </span>
            )}
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
        <h1 className="header-title">Trợ lý Nghiên cứu Quy hoạch của Hương Lan</h1>
        <p className="header-subtitle">Hỗ trợ nghiên cứu tài liệu quy hoạch đô thị với phân tích chính xác</p>
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
                <span className="spinner"></span> Đang phân tích...
              </span>
            ) : (
              'Phân tích câu hỏi'
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
            <div className="answer-label">Kết quả phân tích:</div>
            <div className="answer-text">{answer}</div>
            <div className="answer-text">Nguồn tham khảo:</div>
            <div className="answer-text">
              {sources.map((source: string, index: number) => (
                <div key={index}>{source}</div>
              ))}
            </div>
          </div>
        )}

        {showHistory && (
          <div className="history-section">
            <div className="history-header">
              <h2 className="history-label">Lịch sử phân tích ({filteredHistory.length})</h2>
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
                  {searchKeyword ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử phân tích'}
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