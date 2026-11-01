import api from './api';

export const docService = {
  async getConversationDocuments(conversationId) {
    const response = await api.get(`/conversations/${conversationId}/documents`);
    return response.data;
  },

  async uploadDocuments(conversationId, files, onUploadProgress) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(`/conversations/${conversationId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  async attachDocument(conversationId, documentId) {
    const response = await api.post(`/conversations/${conversationId}/documents/${documentId}`);
    return response.data;
  },

  async deleteDocument(documentId) {
    const response = await api.delete(`/conversations/documents/${documentId}`);
    return response.data;
  },

  async getDocumentSummary(documentId) {
    const response = await api.get(`/conversations/documents/${documentId}/summary`);
    return response.data;
  },
};
