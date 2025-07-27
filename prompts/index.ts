import { urbanPlanningRAGPrompt } from './urbanPlanningPrompt';
import { javascriptInterviewRAGPrompt } from './javascriptInterviewPrompt';
// Import hskPrompt when it's created
// import { hskPrompt } from './hskPrompt';
import { PromptTemplate } from './types';

export const PROMPT_MAP = {
    'thuyetminh_qhc-hanoi_26_10_2023_dau': urbanPlanningRAGPrompt,
    'programming_collection': javascriptInterviewRAGPrompt,
    // Add hskPrompt when available
    // 'hsk_collection': hskPrompt,
};

export const getPromptForCollection = (collectionName: string): PromptTemplate => {
    if (collectionName.startsWith('quyhoach') || collectionName == "thuyetminh_qhc-hanoi_26_10_2023_dau") {
        return urbanPlanningRAGPrompt;
    }
    if (collectionName.startsWith('interviewJavascript')) {
        return javascriptInterviewRAGPrompt;
    }
    if (collectionName.startsWith('tiengtrung_')) {
        // Return hskPrompt when available
        // return hskPrompt;
        return urbanPlanningRAGPrompt; // Default to urbanPlanningRAGPrompt for now
    }

    // Default to urbanPlanningRAGPrompt if no pattern matches
    return urbanPlanningRAGPrompt;
};

// CẢI TIẾN CLASS RAG
export class RAGTemplate {
    private promptTemplate: PromptTemplate;

    constructor(promptTemplate: PromptTemplate) {
        this.promptTemplate = promptTemplate;
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