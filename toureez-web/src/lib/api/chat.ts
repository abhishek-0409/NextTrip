import { apiClient } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(message: string, history: ChatMessage[]) {
  return apiClient.post<{ reply: string }>('/chat', { message, history }, false);
}
