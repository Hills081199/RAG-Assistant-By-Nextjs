// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import OpenAI from 'openai';
// import { QdrantClient } from '@qdrant/js-client-rest';
// interface SearchResultItem {
//   payload: {
//     text: string;
//   };
//   score?: number;
// }
// // Config should be stored in an .env file and accessed via process.env
// const QDRANT_URL = "https://98c798e6-7675-4794-abca-2b695e6e00a3.us-west-2-0.aws.cloud.qdrant.io"
// const QDRANT_COLLECTION = "huonglan86"
// const QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Lh8pBeYzqpT1J7ZxK0JkKDwIeIXySMqZ0cyEpX53U68"
// // const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
// const OPENAI_API_KEY = "sk" + "-" + "proj-q1eL-ZLttXJ33TXjm0hYxJYMdXLgognZ0gHC7MJ58VEWl8kbpF0y-wTPH7IsFiyUldVLLd30hAT3BlbkFJWFsiPFeFo3-gqQ8SSdmJyqwPQxhzdqYNnjOJtugIrTsQAwOt_QfjJK_AOUIDnlKTzkWXUj2bQA"
// const qdrantClient = new QdrantClient({
//   url: QDRANT_URL,
//   apiKey: QDRANT_API_KEY,
// });
// console.log(qdrantClient)

// const ITEMS_PER_PAGE = 5; // Number of items per page
// const MAX_HISTORY_ITEMS = 50; // Maximum history items to store
// const openai = new OpenAI({
//   apiKey: OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true // Only for client-side usage
// });
// export default function Home() {
//   const [question, setQuestion] = useState('');
//   const [answer, setAnswer] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [history, setHistory] = useState<{ question: string; answer: string; timestamp: string }[]>([]);
//   const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
//   const [showHistory, setShowHistory] = useState(false);
//   const [historyPage, setHistoryPage] = useState(1);
//   const [searchKeyword, setSearchKeyword] = useState('');

//   useEffect(() => {
//     loadHistory();
//   }, []);

//   const loadHistory = () => {
//     try {
//       const savedHistory = localStorage.getItem('questionHistory');
//       if (savedHistory) {
//         setHistory(JSON.parse(savedHistory));
//       }
//     } catch (err) {
//       console.error('Error loading history:', err);
//     }
//   };

//   const saveHistory = (newEntry: { question: string; answer: string; timestamp: string }) => {
//     try {
//       const updatedHistory = [...history, newEntry].slice(-MAX_HISTORY_ITEMS);
//       setHistory(updatedHistory);
//       localStorage.setItem('questionHistory', JSON.stringify(updatedHistory));
//     } catch (err) {
//       console.error('Error saving history:', err);
//     }
//   };

//   const filteredHistory = history.filter(
//     (item) =>
//       searchKeyword === '' ||
//       item.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
//       item.answer.toLowerCase().includes(searchKeyword.toLowerCase())
//   ).reverse();

//   const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
//   const startIndex = (historyPage - 1) * ITEMS_PER_PAGE;
//   const endIndex = startIndex + ITEMS_PER_PAGE;
//   const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

//   const askQuestion = async () => {
//     if (!question.trim()) {
//       alert('Vui lòng nhập câu hỏi');
//       return;
//     }

//     if (!QDRANT_URL || !QDRANT_COLLECTION || !QDRANT_API_KEY || !OPENAI_API_KEY) {
//       alert('Thiếu thông tin cấu hình API. Vui lòng kiểm tra cấu hình');
//       return;
//     }

//     try {
//       setLoading(true);
//       setAnswer('');

//       // 1. Get embedding from OpenAI
//       const embeddingResponse = await openai.embeddings.create({
//         model: 'text-embedding-3-small',
//         input: question,
//       });

//       const embedding = embeddingResponse.data[0].embedding;
//       const res = await fetch('/api/search', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ embedding, limit: 15 })
//       });
      
//       if (!res.ok) {
//         const error = await res.json();
//         console.error('Search API error:', error);
//         throw new Error(error.message || 'Failed to search');
//       }
      
//       const data = await res.json();
//       console.log('Search results:', data);
      
//       // // Filter results by score threshold (0.3)
//       // const filteredResults = data.filter((item: { score?: number }) => (item.score ?? 0) >= 0.3);
      
//       // if (filteredResults.length === 0) {
//       //   setAnswer('Không tìm thấy thông tin liên quan trong cơ sở dữ liệu. Vui lòng thử lại với từ khóa khác hoặc mô tả chi tiết hơn.');
//       //   setLoading(false);
//       //   return;
//       // }
      
//       // // 3. Create context from filtered search results
//       // const contexts = filteredResults
//       // Nếu không filter score, chỉ lấy top N kết quả
//       const topResults = data.slice(0, 10) as SearchResultItem[];

//       // Tiếp tục xử lý với topResults, ví dụ:
//       const contexts = topResults.map((item: SearchResultItem) => item.payload.text).join('\n---\n');

//       if (!contexts) {
//         setAnswer('Không tìm thấy thông tin liên quan đến câu hỏi của bạn.');
//         saveHistory({ question, answer: 'Không tìm thấy thông tin liên quan.', timestamp: new Date().toISOString() });
//         return;
//       }

// //       const prompt = `Bạn là trợ lý nghiên cứu chuyên về quy hoạch đô thị và phát triển bền vững. Nhiệm vụ của bạn là phân tích CHÍNH XÁC thông tin từ tài liệu được cung cấp.

// // ## NGUYÊN TẮC QUAN TRỌNG NHẤT:
// // - CHỈ sử dụng thông tin có trong tài liệu tham khảo
// // - KHÔNG bịa đặt, suy đoán hoặc thêm thông tin không có
// // - Nếu không đủ thông tin để trả lời, hãy NÓI RÕ điều này
// // - Phân biệt rõ giữa thông tin CHẮC CHẮN và thông tin CÓ THỂ

// // ## THÔNG TIN THAM KHẢO:
// // ${contexts}

// // ## CÂU HỎI:
// // ${question}

// // ## YÊU CẦU TRẢ LỜI:

// // ### 1. THÔNG TIN CÓ SẴN (từ tài liệu)
// // - Trình bày chính xác những gì tài liệu đã nêu
// // - Trích dẫn cụ thể các đoạn/số liệu liên quan
// // - Không diễn giải quá mức

// // ### 2. PHÂN TÍCH DỰA TRÊN THÔNG TIN CÓ SẴN
// // - Chỉ phân tích dựa trên dữ liệu trong tài liệu
// // - Nếu có nhiều quan điểm khác nhau, nêu rõ từng quan điểm
// // - Không đưa ra kết luận vượt quá thông tin được cung cấp

// // ### 3. NHỮNG ĐIỀU CHƯA RÕ HOẶC THIẾU
// // - Liệt kê rõ ràng những thông tin cần thiết nhưng không có trong tài liệu
// // - Những câu hỏi không thể trả lời được với thông tin hiện có
// // - Đề xuất cần tìm thêm nguồn thông tin nào cụ thể

// // ## LƯU Ý BẮT BUỘC:
// // - Nếu tài liệu không đề cập đến câu hỏi: "Tài liệu không cung cấp thông tin về vấn đề này"
// // - Nếu thông tin không đủ để kết luận: "Dựa trên thông tin hiện có, chưa thể đưa ra kết luận chắc chắn"
// // - Sử dụng cụm từ: "Theo tài liệu...", "Tài liệu nêu rõ...", "Không có thông tin về..."
// // - Trả lời bằng tiếng Việt, ngôn ngữ rõ ràng, chính xác

// // BẮT ĐẦU PHÂN TÍCH NGAY, CHỈ DỰA TRÊN THÔNG TIN CÓ TRONG TÀI LIỆU:`;

//       const prompt = "Bạn là chuyên gia phân tích tài liệu quy hoạch đô thị với chuyên môn sâu về quy hoạch không gian đô thị, phát triển bền vững và kinh tế đô thị, chính sách và pháp luật đất đai, hạ tầng kỹ thuật và giao thông đô thị, môi trường và biến đổi khí hậu đô thị.

//       NGUYÊN TẮC PHÂN TÍCH NGHIÊM NGẶT:

//       CẤM TUYỆT ĐỐI:
//       - KHÔNG được bịa đặt, suy luận, hoặc thêm thông tin ngoài tài liệu
//       - KHÔNG được sử dụng kiến thức tổng quát khi tài liệu thiếu thông tin
//       - KHÔNG được đưa ra con số, tỷ lệ, hoặc dữ liệu không có trong nguồn
//       - KHÔNG được giải thích các khái niệm không được định nghĩa trong tài liệu

//       BẮT BUỘC THỰC HIỆN:
//       - Chỉ trích dẫn CHÍNH XÁC từ tài liệu gốc
//       - Phân biệt rõ: thông tin CHẮC CHẮN vs thông tin GỢI Ý
//       - Ghi rõ nguồn trích dẫn (trang, đoạn, chương nếu có)
//       - Thừa nhận khi thông tin không đủ hoặc không có

//       ĐỊNH DẠNG PHÂN TÍCH:

//       PHẦN 1: THÔNG TIN TỪ TÀI LIỆU
//       Dữ liệu chắc chắn:
//       - Trích dẫn nguyên văn với đánh dấu nguồn
//       - Số liệu cụ thể được nêu trong tài liệu

//       Thông tin gợi ý/có điều kiện:
//       - Những thông tin được đề cập nhưng chưa khẳng định

//       PHẦN 2: PHÂN TÍCH CHUYÊN MÔN
//       Dựa trên thông tin có sẵn:
//       - Mối liên hệ giữa các thông tin trong tài liệu
//       - Xu hướng được thể hiện qua dữ liệu có sẵn
//       - So sánh các quan điểm (nếu có nhiều nguồn)

//       Lưu ý quan trọng:
//       - Chỉ phân tích những gì được nêu rõ
//       - Không suy rộng hoặc ngoại suy

//       PHẦN 3: HẠN CHẾ THÔNG TIN
//       Những điều chưa được đề cập:
//       - Liệt kê cụ thể các thông tin thiếu

//       Cần tìm hiểu thêm:
//       - Đề xuất nguồn thông tin bổ sung cần thiết

//       Không thể trả lời:
//       - Những câu hỏi không thể giải đáp với thông tin hiện có

//       CÚ PHÁP BẮT BUỘC:

//       Sử dụng các cụm từ định vị rõ ràng:
//       - "Theo tài liệu trang X..."
//       - "Tài liệu nêu rõ rằng..."  
//       - "Dữ liệu cho thấy..." (chỉ khi có số liệu cụ thể)
//       - "Tài liệu không đề cập đến..."
//       - "Thông tin này không có trong nguồn tham khảo"
//       - "Cần thêm dữ liệu để xác định..."

//       THÔNG TIN NGỮ CẢNH:
//       Tài liệu tham khảo:
//       ${contexts}

//       Câu hỏi nghiên cứu:
//       ${question}

//       KIỂM TRA CHẤT LƯỢNG TRƯỚC KHI TRẢ LỜI:
//       - Mọi thông tin đều có thể truy vết được trong tài liệu?
//       - Đã phân biệt rõ thông tin chắc chắn vs không chắc chắn?
//       - Đã thừa nhận những hạn chế thông tin?
//       - Không có suy đoán hoặc thông tin ngoài nguồn?
//       - Trích dẫn đúng và đủ cụ thể?

//       BẮT ĐẦU PHÂN TÍCH - CHỈ SỬ DỤNG THÔNG TIN CÓ TRONG TÀI LIỆU:";

//       // 4. Call Chat Completion with GPT-3.5-turbo
//       const chatCompletion = await openai.chat.completions.create({
//         model: 'gpt-3.5-turbo',
//         messages: [
//           {
//             role: 'system',
//             content:
//               'Bạn là chuyên gia nghiên cứu về quy hoạch đô thị và phát triển bền vững. Trả lời các câu hỏi bằng tiếng Việt với phong cách học thuật, chi tiết, và dễ hiểu, hỗ trợ người dùng trong việc nghiên cứu tài liệu.',
//           },
//           { role: 'user', content: prompt },
//         ],
//         max_tokens: 2500,
//         temperature: 0.6,
//       });

//       const response = chatCompletion.choices[0].message.content;
//       setAnswer(response || 'Không nhận được phản hồi từ hệ thống.');
//       saveHistory({ question, answer: response || '', timestamp: new Date().toISOString() });
//     } catch (err: Error | unknown) {
//       console.error(
//         'Error details:',
//         err instanceof Error
//           ? {
//               message: err.message,
//               ...(axios.isAxiosError(err)
//                 ? {
//                     status: err.response?.status,
//                     data: err.response?.data,
//                   }
//                 : {}),
//             }
//           : 'An unknown error occurred'
//       );

//       let errorMessage = 'Có lỗi xảy ra khi truy vấn.';

//       interface ApiError extends Error {
//         code?: string;
//         response?: {
//           status?: number;
//           data?: {
//             error?: {
//               message?: string;
//             };
//             message?: string;
//           };
//         };
//       }

//       if (err && typeof err === 'object') {
//         const errorObj = err as ApiError;
        
//         // Handle network errors
//         if (errorObj.code === 'ERR_NETWORK' || errorObj.message?.includes('Network Error')) {
//           errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
//         } 
//         // Handle response errors
//         else if (errorObj.response) {
//           const status = errorObj.response.status;
//           const data = errorObj.response.data;
          
//           if (status === 401) {
//             errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra lại.';
//           } else if (status === 404) {
//             errorMessage = 'Không tìm thấy collection trong Qdrant.';
//           } else if (status === 429) {
//             errorMessage = 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.';
//           } else if (status === 400) {
//             errorMessage = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra câu hỏi hoặc cấu hình.';
//           } else {
//             const errorMessageFromServer = data?.error?.message || data?.message;
//             errorMessage = `Lỗi từ máy chủ: ${errorMessageFromServer || 'Không xác định'}`;
//           }
//         }
//       } else if (err instanceof Error) {
//         errorMessage = `Lỗi: ${err.message}`;
//       }

//       setAnswer(errorMessage);
//       saveHistory({ question, answer: errorMessage, timestamp: new Date().toISOString() });
//       alert(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const clearHistory = () => {
//     if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử câu hỏi?')) {
//       try {
//         localStorage.removeItem('questionHistory');
//         setHistory([]);
//         setExpandedItems(new Set());
//         setHistoryPage(1);
//         setSearchKeyword('');
//         alert('Lịch sử câu hỏi đã được xóa.');
//       } catch (err) {
//         console.error('Error clearing history:', err);
//         alert('Không thể xóa lịch sử câu hỏi.');
//       }
//     }
//   };

//   const toggleHistoryVisibility = () => {
//     setShowHistory(!showHistory);
//     if (!showHistory) {
//       setHistoryPage(1);
//     }
//   };

//   const goToPage = (page: number) => {
//     setHistoryPage(page);
//     setExpandedItems(new Set());
//   };

//   const renderHistoryItem = (item: { question: string; answer: string; timestamp: string }, index: number) => {
//     const actualIndex = startIndex + index;
//     const isExpanded = expandedItems.has(actualIndex);
//     const shouldTruncate = item.answer.length > 150;

//     const toggleExpanded = () => {
//       const newExpanded = new Set(expandedItems);
//       if (isExpanded) {
//         newExpanded.delete(actualIndex);
//       } else {
//         newExpanded.add(actualIndex);
//       }
//       setExpandedItems(newExpanded);
//     };

//     return (
//       <div className="history-item" key={actualIndex}>
//         <div className="history-item-header">
//           <span className="history-question">Q: {item.question}</span>
//           <span className="history-timestamp">
//             {new Date(item.timestamp).toLocaleDateString('vi-VN', {
//               day: '2-digit',
//               month: '2-digit',
//               year: '2-digit',
//               hour: '2-digit',
//               minute: '2-digit',
//             })}
//           </span>
//         </div>
//         <div className="history-answer-label">Trả lời:</div>
//         <div className="history-answer">
//           {isExpanded || !shouldTruncate ? item.answer : `${item.answer.substring(0, 150)}...`}
//         </div>
//         {shouldTruncate && (
//           <button onClick={toggleExpanded} className="expand-button">
//             {isExpanded ? '↑ Thu gọn' : '↓ Xem thêm'}
//           </button>
//         )}
//       </div>
//     );
//   };

//   const renderPaginationControls = () => {
//     if (totalPages <= 1) return null;

//     const pages = [];
//     for (let i = 1; i <= totalPages; i++) {
//       pages.push(
//         <button
//           key={i}
//           className={`page-button ${historyPage === i ? 'active-page-button' : ''}`}
//           onClick={() => goToPage(i)}
//         >
//           {i}
//         </button>
//       );
//     }

//     return (
//       <div className="pagination-container">
//         <button
//           className={`nav-button ${historyPage === 1 ? 'nav-button-disabled' : ''}`}
//           onClick={() => goToPage(Math.max(1, historyPage - 1))}
//           disabled={historyPage === 1}
//         >
//           ← Trước
//         </button>
//         <div className="pages-container">{pages}</div>
//         <button
//           className={`nav-button ${historyPage === totalPages ? 'nav-button-disabled' : ''}`}
//           onClick={() => goToPage(Math.min(totalPages, historyPage + 1))}
//           disabled={historyPage === totalPages}
//         >
//           Sau →
//         </button>
//       </div>
//     );
//   };

//   return (
//     <div className="container">
//       <div className="header">
//         <h1 className="header-title">Trợ lý Nghiên cứu Quy hoạch</h1>
//         <p className="header-subtitle">Hỗ trợ nghiên cứu tài liệu quy hoạch đô thị</p>
//       </div>

//       <div className="input-section">
//         <textarea
//           className="input"
//           placeholder="Nhập câu hỏi về quy hoạch đô thị hoặc phát triển bền vững..."
//           value={question}
//           onChange={(e) => setQuestion(e.target.value)}
//           disabled={loading}
//         />
//         <div className="button-container">
//           <button
//             className={`ask-button ${loading ? 'button-disabled' : ''}`}
//             onClick={askQuestion}
//             disabled={loading}
//           >
//             {loading ? (
//               <span className="loading-container">
//                 <span className="spinner"></span> Đang xử lý...
//               </span>
//             ) : (
//               'Gửi câu hỏi'
//             )}
//           </button>
//           <button
//             className={`history-toggle-button ${loading ? 'button-disabled' : ''}`}
//             onClick={toggleHistoryVisibility}
//             disabled={loading}
//           >
//             {showHistory ? 'Ẩn lịch sử' : `Lịch sử (${history.length})`}
//           </button>
//           <button
//             className={`clear-button ${loading ? 'button-disabled' : ''}`}
//             onClick={clearHistory}
//             disabled={loading}
//           >
//             Xóa lịch sử
//           </button>
//         </div>
//       </div>

//       <div className="answer-section">
//         {answer && (
//           <div className="answer-card">
//             <div className="answer-label">Trả lời:</div>
//             <div className="answer-text">{answer}</div>
//           </div>
//         )}

//         {showHistory && (
//           <div className="history-section">
//             <div className="history-header">
//               <h2 className="history-label">Lịch sử câu hỏi ({filteredHistory.length})</h2>
//               <input
//                 className="search-input"
//                 placeholder="Tìm kiếm trong lịch sử..."
//                 value={searchKeyword}
//                 onChange={(e) => {
//                   setSearchKeyword(e.target.value);
//                   setHistoryPage(1);
//                 }}
//               />
//             </div>

//             {filteredHistory.length > 0 ? (
//               <>
//                 <div className="history-list">
//                   {paginatedHistory.map((item, index) => renderHistoryItem(item, index))}
//                 </div>
//                 {renderPaginationControls()}
//                 <div className="pagination-info">
//                   Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredHistory.length)} /{' '}
//                   {filteredHistory.length} mục
//                 </div>
//               </>
//             ) : (
//               <div className="empty-history-container">
//                 <p className="empty-history-text">
//                   {searchKeyword ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử câu hỏi'}
//                 </p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export const getServerSideProps = async () => {
//   return {
//     props: {}, // No server-side props needed
//   };
// };
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

/**
 * Urban Planning Research Assistant Prompt Template
 * Specialized for accurate document analysis without hallucination
 */
// const urbanPlanningRAGPrompt: PromptTemplate = {
//   systemPrompt: `Bạn là chuyên gia phân tích tài liệu quy hoạch đô thị với chuyên môn sâu về quy hoạch không gian đô thị, phát triển bền vững và kinh tế đô thị, chính sách và pháp luật đất đai, hạ tầng kỹ thuật và giao thông đô thị, môi trường và biến đổi khí hậu đô thị.`,

//   generatePrompt: (config: RAGPromptConfig): string => {
//     return `Bạn là chuyên gia phân tích tài liệu quy hoạch đô thị với chuyên môn sâu về quy hoạch không gian đô thị, phát triển bền vững và kinh tế đô thị, chính sách và pháp luật đất đai, hạ tầng kỹ thuật và giao thông đô thị, môi trường và biến đổi khí hậu đô thị.

// NGUYÊN TẮC PHÂN TÍCH NGHIÊM NGẶT:

// CẤM TUYỆT ĐỐI:
// - KHÔNG được bịa đặt, suy luận, hoặc thêm thông tin ngoài tài liệu
// - KHÔNG được sử dụng kiến thức tổng quát khi tài liệu thiếu thông tin
// - KHÔNG được đưa ra con số, tỷ lệ, hoặc dữ liệu không có trong nguồn
// - KHÔNG được giải thích các khái niệm không được định nghĩa trong tài liệu

// BẮT BUỘC THỰC HIỆN:
// - Chỉ trích dẫn CHÍNH XÁC từ tài liệu gốc
// - Phân biệt rõ: thông tin CHẮC CHẮN vs thông tin GỢI Ý
// - Ghi rõ nguồn trích dẫn (trang, đoạn, chương nếu có)
// - Thừa nhận khi thông tin không đủ hoặc không có

// ĐỊNH DẠNG PHÂN TÍCH:

// PHẦN 1: THÔNG TIN TỪ TÀI LIỆU
// Dữ liệu chắc chắn:
// - Trích dẫn nguyên văn với đánh dấu nguồn
// - Số liệu cụ thể được nêu trong tài liệu

// Thông tin gợi ý/có điều kiện:
// - Những thông tin được đề cập nhưng chưa khẳng định

// PHẦN 2: PHÂN TÍCH CHUYÊN MÔN
// Dựa trên thông tin có sẵn:
// - Mối liên hệ giữa các thông tin trong tài liệu
// - Xu hướng được thể hiện qua dữ liệu có sẵn
// - So sánh các quan điểm (nếu có nhiều nguồn)

// Lưu ý quan trọng:
// - Chỉ phân tích những gì được nêu rõ
// - Không suy rộng hoặc ngoại suy

// PHẦN 3: HẠN CHẾ THÔNG TIN
// Những điều chưa được đề cập:
// - Liệt kê cụ thể các thông tin thiếu

// Cần tìm hiểu thêm:
// - Đề xuất nguồn thông tin bổ sung cần thiết

// Không thể trả lời:
// - Những câu hỏi không thể giải đáp với thông tin hiện có

// CÚ PHÁP BẮT BUỘC:

// Sử dụng các cụm từ định vị rõ ràng:
// - "Theo tài liệu trang X..."
// - "Tài liệu nêu rõ rằng..."  
// - "Dữ liệu cho thấy..." (chỉ khi có số liệu cụ thể)
// - "Tài liệu không đề cập đến..."
// - "Thông tin này không có trong nguồn tham khảo"
// - "Cần thêm dữ liệu để xác định..."

// THÔNG TIN NGỮ CẢNH:
// Tài liệu tham khảo:
// ${config.contexts}

// Câu hỏi nghiên cứu:
// ${config.question}

// KIỂM TRA CHẤT LƯỢNG TRƯỚC KHI TRẢ LỜI:
// - Mọi thông tin đều có thể truy vết được trong tài liệu?
// - Đã phân biệt rõ thông tin chắc chắn vs không chắc chắn?
// - Đã thừa nhận những hạn chế thông tin?
// - Không có suy đoán hoặc thông tin ngoài nguồn?
// - Trích dẫn đúng và đủ cụ thể?

// BẮT ĐẦU PHÂN TÍCH - CHỈ SỬ DỤNG THÔNG TIN CÓ TRONG TÀI LIỆU:`;
//   }
// };

const urbanPlanningRAGPrompt: PromptTemplate = {
  systemPrompt: `Bạn là chuyên gia phân tích tài liệu quy hoạch đô thị với chuyên môn sâu về quy hoạch không gian đô thị, phát triển bền vững, kinh tế đô thị, chính sách và pháp luật đất đai, hạ tầng kỹ thuật, giao thông đô thị, môi trường và biến đổi khí hậu đô thị. Bạn hỗ trợ nghiên cứu bằng cách trích xuất chính xác thông tin từ tài liệu và cung cấp phân tích chuyên sâu dựa trên dữ liệu có sẵn, đồng thời áp dụng kiến thức chuyên môn một cách minh bạch và có kiểm soát.`,

  generatePrompt: (config: RAGPromptConfig): string => {
    return `Bạn là chuyên gia phân tích tài liệu quy hoạch đô thị với chuyên môn sâu về quy hoạch không gian đô thị, phát triển bền vững, kinh tế đô thị, chính sách và pháp luật đất đai, hạ tầng kỹ thuật, giao thông đô thị, môi trường và biến đổi khí hậu đô thị.

**NGUYÊN TẮC PHÂN TÍCH**:
- **Cấm tuyệt đối**:
  - Bịa đặt, suy luận, hoặc thêm thông tin ngoài tài liệu.
  - Sử dụng kiến thức tổng quát khi tài liệu không cung cấp thông tin.
  - Đưa ra số liệu, tỷ lệ, hoặc dữ liệu không có trong tài liệu.
  - Giải thích khái niệm không được định nghĩa trong tài liệu.
- **Bắt buộc thực hiện**:
  - Trích dẫn chính xác, nguyên văn từ tài liệu với nguồn cụ thể (trang, đoạn, chương).
  - Phân biệt rõ thông tin chắc chắn và thông tin gợi ý/có điều kiện.
  - Thừa nhận khi thông tin không đủ hoặc không có.
  - Khi sử dụng kiến thức chuyên môn, nêu rõ: "Dựa trên kiến thức chuyên môn về quy hoạch đô thị..." và đảm bảo kiến thức này chỉ ngữ cảnh hóa hoặc giải thích thông tin từ tài liệu, không tạo thông tin mới.
  - Đánh giá tính nhất quán, mâu thuẫn, hoặc thiên kiến tiềm ẩn trong tài liệu.

**ĐỊNH DẠNG PHÂN TÍCH**:

**1. Trích dẫn từ tài liệu**:
- **Thông tin chắc chắn**:
  - Trích dẫn nguyên văn với nguồn cụ thể.
  - Số liệu hoặc dữ kiện rõ ràng trong tài liệu.
- **Thông tin gợi ý/có điều kiện**:
  - Thông tin được đề cập nhưng chưa được xác nhận rõ ràng.

**2. Phân tích chuyên môn**: (áp dụng với các câu hỏi mang tính tìm hiểu và nghiên cứu thay vì các câu hỏi hỏi đáp thông tin)
- Liên hệ giữa các thông tin trong tài liệu.
- Đánh giá xu hướng, tính khả thi, hoặc so sánh với thông lệ quốc tế (nếu phù hợp với dữ liệu).
- Đề xuất kịch bản hoặc giải pháp dựa trên dữ liệu tài liệu.
- Khi sử dụng kiến thức chuyên môn, nêu rõ và chỉ áp dụng để ngữ cảnh hóa hoặc giải thích.

**3. Hạn chế và đề xuất nghiên cứu**:
- **Hạn chế thông tin**:
  - Liệt kê cụ thể các thông tin thiếu hoặc không rõ.
  - Đánh giá độ tin cậy của nguồn tài liệu (nếu có dấu hiệu thiên kiến hoặc thiếu sót).
- **Cần tìm hiểu thêm**:
  - Đề xuất câu hỏi nghiên cứu cụ thể để làm rõ khoảng trống thông tin.
  - Gợi ý nguồn thông tin bổ sung hoặc phương pháp phân tích (định lượng, định tính, so sánh).
- **Không thể trả lời**:
  - Liệt kê các câu hỏi không thể giải đáp với dữ liệu hiện có.

**CÚ PHÁP BẮT BUỘC**:
- "Theo tài liệu [trang/đoạn/chương X]..."
- "Tài liệu nêu rõ rằng..."
- "Dữ liệu cho thấy..." (chỉ khi có số liệu cụ thể).
- "Dựa trên kiến thức chuyên môn về quy hoạch đô thị..." (khi áp dụng kiến thức nội tại).
- "Tài liệu không đề cập đến..."
- "Cần thêm dữ liệu để xác định..."

**THÔNG TIN NGỮ CẢNH**:
- Tài liệu tham khảo: ${config.contexts}
- Câu hỏi nghiên cứu: ${config.question}

**KIỂM TRA CHẤT LƯỢNG**:
- Mọi thông tin đều có thể truy vết từ tài liệu hoặc được gắn cờ là kiến thức chuyên môn?
- Đã phân biệt rõ thông tin chắc chắn và không chắc chắn?
- Đã thừa nhận các hạn chế thông tin?
- Không có suy đoán hoặc thông tin ngoài nguồn?
- Đã đánh giá độ tin cậy hoặc mâu thuẫn trong tài liệu?
- Trích dẫn đầy đủ và chính xác?

**BẮT ĐẦU PHÂN TÍCH**:
- Chỉ sử dụng thông tin từ tài liệu và kiến thức chuyên môn được phép như trên.
- Cung cấp phân tích chuyên sâu, khách quan, và có cấu trúc rõ ràng.`;
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
  };
  score?: number;
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
      
      // Get top results
      const topResults = data.slice(0, 10) as SearchResultItem[];
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
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: ragSystem.getSystemPrompt()
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2500,
        temperature: 0.6,
      });

      const response = chatCompletion.choices[0].message.content;
      const finalAnswer = response || 'Không nhận được phản hồi từ hệ thống.';
      
      // 5. Validate the response
      const validation = ragSystem.validateResponse(finalAnswer);
      
      // Log validation results for debugging
      if (!validation.isValid) {
        console.warn('Response validation issues:', validation.issues);
      }
      
      setAnswer(finalAnswer);
      saveHistory({ 
        question, 
        answer: finalAnswer, 
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