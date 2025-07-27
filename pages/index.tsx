

import React, { useState, useEffect, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import {RAGTemplate} from '../prompts';
import { getPromptForCollection } from '@/prompts/index';
// Urban Planning RAG Prompt Configuration - CẢI TIẾN

// Interfaces giữ nguyên
interface SearchResultItem {
  payload: {
    text: string;
    source_file?: string;
    start_page?: string | number;
    end_page?: string | number;
  }
  text: string
  score?: number
}

// THÊM INTERFACE CHO MESSAGE
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
  isValidated?: boolean;
  validationIssues?: string[];
}

// Config giữ nguyên
const QDRANT_URL = process.env.NEXT_PUBLIC_QDRANT_URL;
const QDRANT_API_KEY = process.env.NEXT_PUBLIC_QDRANT_API_KEY;
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const ITEMS_PER_PAGE = 5;
const MAX_HISTORY_ITEMS = 50;
const MAX_CONVERSATION_CONTEXT = 10; // THÊM: Số tin nhắn tối đa trong ngữ cảnh hội thoại

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});


export default function Home() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  // CẢI TIẾN: THAY ĐỔI STRUCTURE CỦA HISTORY
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [history, setHistory] = useState<{ question: string; answer: string; timestamp: string; isValidated?: boolean; validationIssues?: string[] }[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  // THÊM REF CHO AUTO SCROLL
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // THÊM PHƯƠNG THỨC LOAD COLLECTIONS
  const loadCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) {
        throw new Error('Failed to load collections');
      }
      const data = await response.json();
      setCollections(data.collections);
      if (data.collections.length > 0 && !selectedCollection) {
        setSelectedCollection(data.collections[0]);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      setCollections([]);
    }
  }, [selectedCollection]);
  useEffect(() => {
    const initializeApp = async () => {
      loadHistory();
      loadConversation();
      await loadCollections();
    };
    initializeApp();
  }, [loadCollections]);

  // THÊM AUTO SCROLL
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  // THÊM PHƯƠNG THỨC LOAD CONVERSATION
  const loadConversation = () => {
    try {
      const savedConversation = localStorage.getItem('conversationMessages');
      if (savedConversation) {
        setConversationMessages(JSON.parse(savedConversation));
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };



  // THÊM PHƯƠNG THỨC SAVE CONVERSATION
  const saveConversation = (messages: ConversationMessage[]) => {
    try {
      const trimmedMessages = messages.slice(-MAX_HISTORY_ITEMS);

      // Thử lưu vào localStorage
      try {
        localStorage.setItem('conversationMessages', JSON.stringify(trimmedMessages));
      } catch (error) {
        // Nếu vượt quá dung lượng, xóa bớt tin nhắn cũ
        if (error instanceof DOMException &&
          (error.name === 'QuotaExceededError' ||
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            error.toString().includes('QuotaExceededError'))) {

          console.warn('LocalStorage full, removing older messages...');

          // Giảm số lượng tin nhắn còn 1 nửa và thử lại
          const halfMessages = trimmedMessages.slice(Math.floor(trimmedMessages.length / 2));

          if (halfMessages.length > 0) {
            // Thử lưu lại với số lượng tin nhắn ít hơn
            localStorage.setItem('conversationMessages', JSON.stringify(halfMessages));
            setConversationMessages(halfMessages);
            return;
          }

          // Nếu vẫn lỗi, xóa hết
          console.warn('Clearing all messages due to storage limit');
          localStorage.removeItem('conversationMessages');
          setConversationMessages([]);
          return;
        }

        // Nếu lỗi khác, ném ra ngoài để xử lý ở catch bên ngoài
        throw error;
      }

      // Cập nhật state nếu lưu thành công
      setConversationMessages(trimmedMessages);

    } catch (err) {
      console.error('Error saving conversation:', err);
      // Thông báo cho người dùng nếu cần
      // alert('Không thể lưu cuộc hội thoại do giới hạn bộ nhớ. Vui lòng xóa bớt tin nhắn cũ.');
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

  // CẢI TIẾN HÀM askQuestion
  const askQuestion = async () => {
    if (!question.trim()) {
      alert('Vui lòng nhập câu hỏi');
      return;
    }

    if (!QDRANT_URL || !QDRANT_API_KEY || !OPENAI_API_KEY) {
      alert('Thiếu thông tin cấu hình API. Vui lòng kiểm tra cấu hình');
      return;
    }

    // THÊM USER MESSAGE VÀO CONVERSATION
    const userMessage: ConversationMessage = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...conversationMessages, userMessage];
    saveConversation(updatedMessages);

    try {
      setLoading(true);

      // 1. Get embedding từ OpenAI (giữ nguyên)
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: question,
      });

      const embedding = embeddingResponse.data[0].embedding;
      const ragSystem = new RAGTemplate(getPromptForCollection(selectedCollection!));

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding, limit: 5, collection: selectedCollection! })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Search API error:', error);
        throw new Error(error.message || 'Failed to search');
      }

      const data = await res.json();
      const sortedDataByScore = data.sort((a: SearchResultItem, b: SearchResultItem) => (b.score ?? 0) - (a.score ?? 0));

      const topResults = sortedDataByScore.slice(0, 5) as SearchResultItem[];
      const contexts = topResults.map((item: SearchResultItem) => item.payload.text).join('\n---\n');

      if (!contexts) {
        const noResultsMessage = 'Không tìm thấy thông tin liên quan đến câu hỏi của bạn.';

        // THÊM ASSISTANT MESSAGE VÀO CONVERSATION
        const assistantMessage: ConversationMessage = {
          role: 'assistant',
          content: noResultsMessage,
          timestamp: new Date().toISOString(),
          isValidated: true,
          validationIssues: []
        };

        saveConversation([...updatedMessages, assistantMessage]);

        saveHistory({
          question,
          answer: noResultsMessage,
          timestamp: new Date().toISOString(),
          isValidated: true,
          validationIssues: []
        });
        return;
      }

      // CẢI TIẾN: SỬ DỤNG CONVERSATIONAL PROMPT
      const conversationHistory = conversationMessages.slice(-MAX_CONVERSATION_CONTEXT).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const prompt = ragSystem.generateConversationalPrompt(contexts, question, conversationHistory);

      // CẢI TIẾN: BUILD MESSAGES ARRAY CHO OPENAI VỚI FULL CONTEXT
      const openaiMessages = [
        {
          role: 'system' as const,
          content: ragSystem.getSystemPrompt()
        },
        ...conversationMessages.slice(-6).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: openaiMessages,
        max_tokens: 2500,
        temperature: 0.4,
      });

      const response = chatCompletion.choices[0].message.content;

      // Format source information (giữ nguyên)
      const formatSourceInfo = (result: SearchResultItem) => {
        const sourceFile = result.payload?.source_file || 'N/A';
        const startPage = result.payload?.start_page || 'N/A';
        const endPage = result.payload?.end_page || 'N/A';
        return `Nguồn: ${sourceFile} (Trang ${startPage}-${endPage})`;
      };

      const uniqueSources = Array.from(
        new Set(
          topResults
            .filter(result => result.payload?.source_file)
            .map(result => formatSourceInfo(result))
        )
      );


      const finalAnswer = (response || 'Không nhận được phản hồi từ hệ thống.')
      const validation = ragSystem.validateResponse(finalAnswer);

      if (!validation.isValid) {
        console.warn('Response validation issues:', validation.issues);
      }

      // THÊM ASSISTANT MESSAGE VÀO CONVERSATION
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: finalAnswer,
        timestamp: new Date().toISOString(),
        sources: uniqueSources,
        isValidated: validation.isValid,
        validationIssues: validation.issues
      };

      saveConversation([...updatedMessages, assistantMessage]);

      // Vẫn lưu vào history cũ để tương thích
      const sourcesSection = uniqueSources.length > 0
        ? `\n\n**Nguồn tham khảo:**\n${uniqueSources.join('\n')}`
        : '';

      saveHistory({
        question,
        answer: finalAnswer + sourcesSection,
        timestamp: new Date().toISOString(),
        isValidated: validation.isValid,
        validationIssues: validation.issues
      });

      if (!validation.isValid && validation.issues.length > 0) {
        console.warn('Chú ý: Phản hồi có thể không tuân thủ đầy đủ nguyên tắc phân tích:', validation.issues.join(', '));
      }

    } catch (err: Error | unknown) {
      // Error handling giữ nguyên
      console.error('Error details:', err instanceof Error ? { message: err.message } : 'An unknown error occurred');

      let errorMessage = 'Có lỗi xảy ra khi truy vấn.';

      // Xử lý lỗi giống như cũ...
      if (err && typeof err === 'object') {
        const errorObj = err as Error;
        if (errorObj.message === 'ERR_NETWORK' || errorObj.message?.includes('Network Error')) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        } else if (errorObj.message) {
          const status = errorObj.message;
          if (status === '401') {
            errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra lại.';
          } else if (status === '404') {
            errorMessage = 'Không tìm thấy collection trong Qdrant.';
          } else if (status === '429') {
            errorMessage = 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.';
          }
        }
      }

      // THÊM ERROR MESSAGE VÀO CONVERSATION
      const errorAssistantMessage: ConversationMessage = {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isValidated: false,
        validationIssues: ['System error']
      };

      saveConversation([...updatedMessages, errorAssistantMessage]);

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
      setQuestion(''); // Clear input sau khi gửi
    }
  };

  // CẢI TIẾN clearHistory
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

  // THÊM clearConversation
  const clearConversation = () => {
    if (confirm('Bạn có chắc chắn muốn xóa cuộc hội thoại hiện tại?')) {
      try {
        localStorage.removeItem('conversationMessages');
        setConversationMessages([]);
        alert('Cuộc hội thoại đã được xóa.');
      } catch (err) {
        console.error('Error clearing conversation:', err);
        alert('Không thể xóa cuộc hội thoại.');
      }
    }
  };

  // Các phương thức khác giữ nguyên
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

  // Render methods giữ nguyên...
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

  // THÊM RENDER METHOD CHO CONVERSATION
  // const renderConversationMessage = (message: ConversationMessage, index: number) => {
  //   return (
  //     <div key={index} className={`message ${message.role}-message`}>
  //       <div className="message-header">
  //         <span className="message-role">
  //           {message.role === 'user' ? '👤 Bạn' : '🤖 Trợ lý'}
  //         </span>
  //         <span className="message-timestamp">
  //           {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
  //             hour: '2-digit',
  //             minute: '2-digit',
  //           })}
  //         </span>
  //         {message.isValidated === false && (
  //           <span className="validation-warning" title={`Vấn đề: ${message.validationIssues?.join(', ')}`}>
  //             ⚠️
  //           </span>
  //         )}
  //       </div>
  //       <div className="message-content">{message.content}</div>
  //       {message.sources && message.sources.length > 0 && (
  //         <div className="message-sources">
  //           <strong>Nguồn tham khảo:</strong>
  //           {message.sources.map((source, idx) => (
  //             <div key={idx} className="source-item">{source}</div>
  //           ))}
  //         </div>
  //       )}
  //     </div>
  //   );
  // };

  // FUNCTION XỬ LÝ ENTER KEY
  // const handleKeyPress = (e: React.KeyboardEvent) => {
  //   if (e.key === 'Enter' && !e.shiftKey) {
  //     e.preventDefault();
  //     askQuestion();
  //   }
  // };

  return (
    <div className="container">
      <div className="header">
        <h1 className="header-title">Trợ lý Nghiên cứu Quy hoạch của Hương Lan</h1>
        <p className="header-subtitle">Trò chuyện tự nhiên về quy hoạch đô thị với phân tích chính xác</p>
        <div className="collection-selector">
          <label className="collection-label">Chọn bộ sưu tập</label>
          <div className="select-wrapper">
            <select
              value={selectedCollection || ''}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="collection-dropdown"
              disabled={collections.length === 0}
            >
              {collections.length > 0 ? (
                collections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))
              ) : (
                <option value="">Đang tải bộ sưu tập...</option>
              )}
            </select>
            <span className="dropdown-arrow">▼</span>
          </div>
          {collections.length > 0 && (
            <p className="collection-count">Đã tải {collections.length} bộ sưu tập</p>
          )}
        </div>
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
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ff6b6b',
              background: '#fff',
              color: '#ff6b6b',
              fontWeight: 500,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Xóa lịch sử
          </button>
        </div>
      </div>

      <div className="answer-section">
        {/* {answer && (
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
        )} */}
        {/* THÊM CONVERSATION VIEW */}
        {conversationMessages.length > 0 && (
          <div className="conversation-section enhanced-conversation">
            <div className="conversation-header">
              <h2>🗨️ Cuộc hội thoại</h2>
              <button
                className={`clear-conversation-button ${loading ? 'button-disabled' : ''}`}
                onClick={clearConversation}
                disabled={loading}
              >
                ✨ Bắt đầu cuộc hội thoại mới
              </button>
            </div>
            <div className="conversation-messages">
              {conversationMessages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-bubble ${message.role}-bubble`}
                >
                  <div className="bubble-header">
                    <span className="bubble-role">
                      {message.role === 'user' ? '👤 Bạn' : '🤖 Trợ lý'}
                    </span>
                    <span className="bubble-timestamp" style={{}}>
                      {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="bubble-content">{message.content}</div>
                  {/* {message.sources && message.sources.length > 0 && (
                    <div className="bubble-sources">
                      <strong>Nguồn tham khảo:</strong>
                      {message.sources.map((source, idx) => (
                        <div key={idx} className="source-item">
                          {source}
                        </div>
                      ))}
                    </div>
                  )} */}
                </div>
              ))}
              <div ref={messagesEndRef} />
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

      <style jsx>{`
  .enhanced-conversation {
    border: 1px solid #ccc;
    border-radius: 10px;
    padding: 15px;
    background: #f9f9f9;
    margin-bottom: 20px;
  }
  .chat-bubble {
    max-width: 70%;
    padding: 10px 15px;
    border-radius: 20px;
    margin-bottom: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    position: relative;
    display: inline-block;
    clear: both;
  }
  .user-bubble {
    background: #a3d8f4;
    margin-left: auto;
    text-align: right;
    border-bottom-right-radius: 5px;
  }
  .assistant-bubble {
    background: #e7f1ff;
    margin-right: auto;
    text-align: left;
    border-bottom-left-radius: 5px;
  }
  .bubble-header {
    font-size: 0.8em;
    color: #555;
    margin-bottom: 5px;
  }
  .bubble-content {
    white-space: pre-wrap;
  }
  .bubble-sources {
    margin-top: 5px;
    font-size: 0.75em;
    color: #333;
  }
  .conversation-messages {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
    .collection-selector {
  max-width: 600px;
  margin: 0 auto 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.collection-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.collection-dropdown {
  width: 100%;
  padding: 10px 36px 10px 12px;
  font-size: 16px;
  color: #111827;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.collection-dropdown:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.collection-dropdown:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.8;
}

.dropdown-arrow {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
}

.collection-count {
  margin: 6px 0 0;
  font-size: 12px;
  color: #6b7280;
  text-align: left;
}
`}</style>

    </div>
  );
}

export const getServerSideProps = async () => {
  return {
    props: {}, // No server-side props needed
  };
};