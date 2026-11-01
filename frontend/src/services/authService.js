import api from './api';

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(userData) {
    const response = await api.patch('/auth/me', userData);
    return response.data;
  },

  async changePassword(passwordData) {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },

  async getSettings() {
    const response = await api.get('/auth/settings');
    return response.data;
  },

  async updateSettings(settingsData) {
    const response = await api.patch('/auth/settings', settingsData);
    return response.data;
  },

  async forgotPassword(emailData) {
    const response = await api.post('/auth/forgot-password', emailData);
    return response.data;
  },

  async resetPassword(resetData) {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  },

  async verifyEmail(token) {
    const response = await api.get('/auth/verify-auth-credentials', {
      params: { token },
    });
    return response.data;
  },
};
