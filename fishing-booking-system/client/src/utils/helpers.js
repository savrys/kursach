// Вспомогательные функции

import { TIMER_THRESHOLDS, TIMER_COLORS } from './constants';

// Форматирование даты и времени
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
};

// Форматирование оставшегося времени
export const formatTimeRemaining = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return '00:00:00';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Получение цвета для таймера в зависимости от оставшегося времени
export const getTimerColor = (timeRemaining) => {
  if (!timeRemaining) return TIMER_COLORS.NORMAL;
  
  if (timeRemaining <= TIMER_THRESHOLDS.DANGER) {
    return TIMER_COLORS.DANGER;
  } else if (timeRemaining <= TIMER_THRESHOLDS.WARNING) {
    return TIMER_COLORS.WARNING;
  }
  return TIMER_COLORS.NORMAL;
};

// Форматирование длительности в часах
export const formatDuration = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} мин`;
  }
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours} ч`;
  }
  return `${wholeHours} ч ${minutes} мин`;
};

// Вычисление длительности между двумя датами в часах
export const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diff = end - start;
  return diff / (1000 * 60 * 60);
};

// Проверка валидности email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Проверка валидности пароля
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Проверка совпадения паролей
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

// Получение текста статуса бронирования
export const getBookingStatusText = (status) => {
  const statusMap = {
    pending: 'Ожидает подтверждения',
    approved: 'Подтверждено',
    rejected: 'Отклонено',
    cancelled: 'Отменено'
  };
  return statusMap[status] || status;
};

// Получение цвета для статуса бронирования
export const getBookingStatusColor = (status) => {
  const colorMap = {
    pending: '#ff9800',
    approved: '#4CAF50',
    rejected: '#f44336',
    cancelled: '#999'
  };
  return colorMap[status] || '#999';
};

// Получение текста статуса места
export const getPlaceStatusText = (status) => {
  const statusMap = {
    free: 'Свободно',
    occupied: 'Занято',
    pending: 'Ожидает'
  };
  return statusMap[status] || status;
};

// Получение цвета для статуса места
export const getPlaceStatusColor = (status) => {
  const colorMap = {
    free: '#4CAF50',
    occupied: '#f44336',
    pending: '#ff9800'
  };
  return colorMap[status] || '#999';
};

// Получение текста роли пользователя
export const getRoleText = (role) => {
  const roleMap = {
    admin: 'Администратор',
    manager: 'Управляющий',
    user: 'Пользователь'
  };
  return roleMap[role] || role;
};

// Получение цвета для роли пользователя
export const getRoleColor = (role) => {
  const colorMap = {
    admin: '#f44336',
    manager: '#ff9800',
    user: '#4CAF50'
  };
  return colorMap[role] || '#999';
};

// Сокращение текста с многоточием
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Генерация случайного ID (для тестов)
export const generateId = () => {
  return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
};

// Группировка бронирований по дате
export const groupBookingsByDate = (bookings) => {
  const groups = {};
  
  bookings.forEach(booking => {
    const date = new Date(booking.startTime).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(booking);
  });
  
  return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
};

// Сортировка пользователей по роли и имени
export const sortUsers = (users) => {
  const roleOrder = { admin: 0, manager: 1, user: 2 };
  
  return [...users].sort((a, b) => {
    if (a.role !== b.role) {
      return roleOrder[a.role] - roleOrder[b.role];
    }
    return a.username.localeCompare(b.username);
  });
};

// Проверка, может ли пользователь управлять бронированием
export const canManageBooking = (user, booking) => {
  if (!user || !booking) return false;
  
  return user.role === 'admin' || 
         user.role === 'manager' || 
         user.id === booking.userId;
};

// Проверка, может ли пользователь редактировать место
export const canManagePlace = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'manager';
};

// Проверка, может ли пользователь видеть админ-панель
export const canAccessAdminPanel = (user) => {
  if (!user) return false;
  return user.role === 'admin';
};

// Проверка, может ли пользователь видеть панель менеджера
export const canAccessManagerPanel = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'manager';
};

// Получение инициалов из имени
export const getInitials = (username) => {
  if (!username) return '?';
  return username.charAt(0).toUpperCase();
};

// Форматирование числа с единицей измерения
export const formatWeight = (kg) => {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} т`;
  }
  return `${kg.toFixed(1)} кг`;
};

// Получение класса для анимации в зависимости от статуса
export const getStatusAnimation = (status) => {
  const animationMap = {
    free: 'pulse-green',
    occupied: 'pulse-red',
    pending: 'pulse-orange'
  };
  return animationMap[status] || '';
};

// Дебаунс функция для оптимизации частых вызовов
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Получение сообщения об ошибке
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Произошла неизвестная ошибка';
};

// Проверка, активно ли бронирование в данный момент
export const isBookingActive = (booking) => {
  if (!booking || booking.status !== 'approved') return false;
  
  const now = new Date();
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  
  return now >= start && now <= end;
};

// Получение оставшегося времени бронирования
export const getBookingTimeRemaining = (booking) => {
  if (!isBookingActive(booking)) return 0;
  
  const now = new Date();
  const end = new Date(booking.endTime);
  return Math.max(0, end - now);
};