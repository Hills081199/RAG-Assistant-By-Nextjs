// export interface PromptTemplate {
//     systemPrompt: string;
//     generatePrompt: (config: RAGPromptConfig) => string;
//   }
  
//   export interface RAGPromptConfig {
//     contexts: string;
//     question: string;
//     // Add other necessary config properties
//   }
  
export  interface RAGPromptConfig {
    contexts: string;
    question: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>; // THÊM MỚI
  }
  
export interface PromptTemplate {
    systemPrompt: string;
    generatePrompt: (config: RAGPromptConfig) => string;
    generateConversationalPrompt: (config: RAGPromptConfig) => string; // THÊM MỚI
  }