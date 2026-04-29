import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавление токена к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Не делаем редирект если мы на странице логина или регистрации
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Карта и места
  getPlaces: () => api.get('/map/places').then(res => res.data),
  getPlaceById: (id) => api.get(`/map/places/${id}`).then(res => res.data),
  getPlaceStatus: (id) => api.get(`/map/places/${id}/status`).then(res => res.data),
  
  // Бронирования
  getAllBookings: () => api.get('/bookings').then(res => res.data),
  createBooking: (data) => api.post('/bookings', data).then(res => res.data),
  updateBooking: (id, data) => api.put(`/bookings/${id}`, data).then(res => res.data),
  cancelBooking: (id) => api.delete(`/bookings/${id}`).then(res => res.data),
  extendBooking: (id, additionalHours) => 
    api.post(`/bookings/${id}/extend`, { additionalHours }).then(res => res.data),
  getMyBookings: () => api.get('/bookings/my-bookings').then(res => res.data),
  
  // Заявки на отмену
  requestCancelBooking: (id) => 
    api.post(`/bookings/${id}/request-cancel`).then(res => res.data),
  approveCancelRequest: (id) => 
    api.put(`/manager/bookings/${id}/approve-cancel`).then(res => res.data),
  rejectCancelRequest: (id) => 
    api.put(`/manager/bookings/${id}/reject-cancel`).then(res => res.data),
  
  // Чаты
  getChats: () => api.get('/chats').then(res => res.data),
  markMessageAsRead: (messageId) => api.put(`/chats/messages/${messageId}/read`).then(res => res.data),
  createChat: () => api.post('/chats').then(res => res.data),
  getMessages: (chatId) => api.get(`/chats/${chatId}/messages`).then(res => res.data),
  sendMessage: (chatId, text) => 
    api.post(`/chats/${chatId}/messages`, { text }).then(res => res.data),
  deleteChat: (chatId) => api.delete(`/chats/${chatId}`).then(res => res.data),
  
  // Админ
  getAllUsers: () => api.get('/admin/users').then(res => res.data),
  updateUserRole: (userId, role) => 
    api.put(`/admin/users/${userId}/role`, { role }).then(res => res.data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`).then(res => res.data),
  
  // Менеджер
  getPendingBookings: () => api.get('/manager/pending-bookings').then(res => res.data),
  approveBooking: (id) => api.put(`/manager/bookings/${id}/approve`).then(res => res.data),
  rejectBooking: (id) => api.put(`/manager/bookings/${id}/reject`).then(res => res.data),
  createPlace: (data) => api.post('/manager/places', data).then(res => res.data),
  updatePlace: (id, data) => api.put(`/manager/places/${id}`, data).then(res => res.data),
  deletePlace: (id) => api.delete(`/manager/places/${id}`).then(res => res.data),
  addCatch: (data) => api.post('/manager/catches', data).then(res => res.data),
  clearFishingStats: () => api.delete('/manager/stats/fishing').then(res => res.data),
  clearVisitsStats: () => api.delete('/manager/stats/visits').then(res => res.data),
  getActiveUsers: () => api.get('/manager/active-users').then(res => res.data),
  uploadPlaceImage: (placeId, image) => api.post(`/manager/places/${placeId}/image`, { image }).then(res => res.data),
  deletePlaceImage: (placeId) => api.delete(`/manager/places/${placeId}/image`).then(res => res.data),
  
  // Изображение карты
  uploadMapImage: (image) => api.post('/manager/map-image', { image }).then(res => res.data),
  getMapImage: () => api.get('/settings/map-image').then(res => res.data),
  deleteMapImage: () => api.delete('/manager/map-image').then(res => res.data),
  
  // Пользователь
  getProfile: () => api.get('/user/profile').then(res => res.data),
  updateProfile: (data) => api.put('/user/profile', data).then(res => res.data),
  createBookingRequest: (data) => api.post('/user/booking-requests', data).then(res => res.data),
  
  // Статистика
  getTopFishermen: () => api.get('/stats/fishing/top').then(res => res.data),
  getTopVisitors: () => api.get('/stats/visits/top').then(res => res.data),
  updateVisitTime: (hours) => api.post('/stats/visits/update', { hours }).then(res => res.data)
};