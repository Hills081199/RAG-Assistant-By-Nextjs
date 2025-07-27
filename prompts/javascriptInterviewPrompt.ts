import { PromptTemplate, RAGPromptConfig } from './types';

export const programmingRAGPrompt: PromptTemplate = {
  systemPrompt: `You are a senior programming assistant...`,
  generatePrompt: (config: RAGPromptConfig): string => {
    return `[Programming-specific prompt generation logic]`;
  },
  generateConversationalPrompt: (config: RAGPromptConfig): string => {
    return `[Programming-specific conversational prompt generation logic]`;
  }
};
