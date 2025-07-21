

import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';

// Urban Planning RAG Prompt Configuration - CẢI TIẾN
interface RAGPromptConfig {
  contexts: string;
  question: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>; // THÊM MỚI
}

interface PromptTemplate {
  systemPrompt: string;
  generatePrompt: (config: RAGPromptConfig) => string;
  generateConversationalPrompt: (config: RAGPromptConfig) => string; // THÊM MỚI
}

const urbanPlanningRAGPrompt: PromptTemplate = {
  systemPrompt: `Bạn là chuyên gia cao cấp trong lĩnh vực quy hoạch đô thị, am hiểu sâu rộng về quy hoạch không gian, phát triển bền vững, kinh tế đô thị, chính sách đất đai, hạ tầng kỹ thuật, giao thông, môi trường và biến đổi khí hậu. 

Bạn đang tham gia vào một cuộc hội thoại liên tục với người dùng về các vấn đề quy hoạch đô thị. Hãy duy trì ngữ cảnh của cuộc trò chuyện, tham chiếu đến các câu hỏi và câu trả lời trước đó khi phù hợp, và tạo ra một cuộc đối thoại tự nhiên, mạch lạc.

Nhiệm vụ của bạn là:
1. Phân tích và trích xuất thông tin chính xác từ tài liệu quy hoạch
2. Duy trì tính liên kết trong hội thoại bằng cách tham chiếu đến các chủ đề đã thảo luận
3. Trả lời các câu hỏi tiếp theo dựa trên ngữ cảnh cuộc hội thoại
4. Cung cấp nhận định dựa trên dữ liệu và đảm bảo mọi lập luận đều có nguồn tham chiếu rõ ràng
5. Sử dụng ngôn ngữ tự nhiên, thân thiện nhưng chuyên nghiệp`,

  generatePrompt: (config: RAGPromptConfig): string => {
    return `Bạn là một trợ lý nghiên cứu chuyên về quy hoạch đô thị và phát triển bền vững, hỗ trợ người dùng trong việc nghiên cứu tài liệu. Dựa trên thông tin tham khảo dưới đây, hãy trả lời câu hỏi một cách chi tiết, rõ ràng và có cấu trúc, phù hợp với mục đích nghiên cứu học thuật. Câu trả lời cần bao gồm:
1. Một đoạn giới thiệu ngắn giải thích bối cảnh của câu hỏi.
2. Phân tích chi tiết dựa trên thông tin tham khảo, sử dụng các ví dụ cụ thể nếu có.
3. Kết luận ngắn gọn và gợi ý các tài liệu hoặc hướng nghiên cứu bổ sung nếu phù hợp.

Thông tin tham khảo:
${config.contexts}

Câu hỏi: ${config.question}

Hãy trả lời bằng tiếng Việt, sử dụng ngôn ngữ học thuật, dễ hiểu và chính xác.`;
  },

  // THÊM PHƯƠNG THỨC MỚI CHO HỘI THOẠI
  generateConversationalPrompt: (config: RAGPromptConfig): string => {
    const historyContext = config.conversationHistory && config.conversationHistory.length > 0
      ? `\n\nLịch sử hội thoại gần đây:\n${config.conversationHistory.map(msg =>
        `${msg.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${msg.content}`
      ).join('\n')}\n`
      : '';

    return `Bạn đang tham gia vào một cuộc hội thoại liên tục về quy hoạch đô thị. Hãy duy trì ngữ cảnh và tham chiếu đến các thông tin đã thảo luận khi phù hợp.

${historyContext}

Thông tin tham khảo từ tài liệu:
${config.contexts}

Câu hỏi/Tin nhắn hiện tại: ${config.question}

Hãy trả lời một cách tự nhiên, duy trì mạch hội thoại. Nếu câu hỏi liên quan đến những gì đã thảo luận trước đó, hãy tham chiếu rõ ràng. Đảm bảo câu trả lời dựa trên tài liệu tham khảo và sử dụng các cụm từ trích dẫn phù hợp.`;
  }
};

// CẢI TIẾN CLASS RAG
class UrbanPlanningRAG {
  private promptTemplate: PromptTemplate;

  constructor() {
    this.promptTemplate = urbanPlanningRAGPrompt;
  }

  generateAnalysisPrompt(contexts: string, question: string): string {
    if (!contexts || !contexts.trim()) {
      throw new Error("Contexts cannot be empty");
    }
    if (!question || !question.trim()) {
      throw new Error("Question cannot be empty");
    }
    return this.promptTemplate.generatePrompt({ contexts, question });
  }

  // THÊM PHƯƠNG THỨC MỚI
  generateConversationalPrompt(contexts: string, question: string, conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>): string {
    if (!contexts || !contexts.trim()) {
      throw new Error("Contexts cannot be empty");
    }
    if (!question || !question.trim()) {
      throw new Error("Question cannot be empty");
    }
    return this.promptTemplate.generateConversationalPrompt({
      contexts,
      question,
      conversationHistory: conversationHistory.slice(-6) // Chỉ lấy 6 tin nhắn gần nhất để tránh quá dài
    });
  }

  getSystemPrompt(): string {
    return this.promptTemplate.systemPrompt;
  }

  validateResponse(response: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const requiredPhrases = [
      "Theo tài liệu",
      "Tài liệu nêu rõ",
      "Dữ liệu cho thấy",
      "Tài liệu không đề cập",
      "Thông tin này không có",
      "Cần thêm dữ liệu",
      "Như đã thảo luận", // THÊM PHRASES CHO HỘI THOẠI
      "Tiếp tục từ",
      "Dựa trên những gì chúng ta đã"
    ];

    const hasRequiredPhrases = requiredPhrases.some(phrase =>
      response.toLowerCase().includes(phrase.toLowerCase())
    );

    if (!hasRequiredPhrases) {
      issues.push("Thiếu cụm từ trích dẫn bắt buộc");
    }

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
const QDRANT_URL = "https://98c798e6-7675-4794-abca-2b695e6e00a3.us-west-2-0.aws.cloud.qdrant.io"
const QDRANT_COLLECTION = "huonglan86"
const QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Lh8pBeYzqpT1J7ZxK0JkKDwIeIXySMqZ0cyEpX53U68"
const OPENAI_API_KEY = "sk" + "-" + "proj-q1eL-ZLttXJ33TXjm0hYxJYMdXLgognZ0gHC7MJ58VEWl8kbpF0y-wTPH7IsFiyUldVLLd30hAT3BlbkFJWFsiPFeFo3-gqQ8SSdmJyqwPQxhzdqYNnjOJtugIrTsQAwOt_QfjJK_AOUIDnlKTzkWXUj2bQA"

const ITEMS_PER_PAGE = 5;
const MAX_HISTORY_ITEMS = 50;
const MAX_CONVERSATION_CONTEXT = 10; // THÊM: Số tin nhắn tối đa trong ngữ cảnh hội thoại

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const ragSystem = new UrbanPlanningRAG();

export default function Home() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  // CẢI TIẾN: THAY ĐỔI STRUCTURE CỦA HISTORY
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [history, setHistory] = useState<{ question: string; answer: string; timestamp: string; isValidated?: boolean; validationIssues?: string[] }[]>([]);

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');

  // THÊM REF CHO AUTO SCROLL
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
    loadConversation(); // THÊM
  }, []);

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
      const trimmedMessages = messages.slice(-MAX_HISTORY_ITEMS); // Giới hạn số tin nhắn
      setConversationMessages(trimmedMessages);
      localStorage.setItem('conversationMessages', JSON.stringify(trimmedMessages));
    } catch (err) {
      console.error('Error saving conversation:', err);
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

    if (!QDRANT_URL || !QDRANT_COLLECTION || !QDRANT_API_KEY || !OPENAI_API_KEY) {
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
        model: 'gpt-4-turbo',
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
                    <span className="bubble-timestamp" style={{ }}>
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
`}</style>

    </div>
  );
}

export const getServerSideProps = async () => {
  return {
    props: {}, // No server-side props needed
  };
};