import axios from 'axios';

const API_URL = '/api/auth';

export const authService = {
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.user;
    } catch (error) {
      localStorage.removeItem('token');
      return null;
    }
  }
};