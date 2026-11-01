import api from './api';

export const chatService = {
  async getConversations() {
    const response = await api.get('/conversations');
    return response.data;
  },

  async createConversation(data) {
    const response = await api.post('/conversations', data);
    return response.data;
  },

  async deleteConversation(conversationId) {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
  },

  async getMessages(conversationId) {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  async sendMessage(conversationId, messageData, signal, requestId) {
    const response = await api.post(`/conversations/${conversationId}/messages`, messageData, {
      signal,
      headers: { 'X-Request-ID': requestId },
    });
    return response.data;
  },

  async stopMessage(conversationId, requestId) {
    const response = await api.post(
      `/conversations/${conversationId}/messages/${requestId}/stop`,
    );
    return response.data;
  },

  async regenerateAnswer(conversationId, question, previousAnswer) {
    const response = await api.post(`/conversations/${conversationId}/regenerate`, {
      question,
      improv_answer: previousAnswer,
    });
    return response.data;
  },

  async getConversationSummary(conversationId) {
    const response = await api.get(`/conversations/${conversationId}/summary`);
    return response.data;
  },
};
