// Константы приложения

export const API_BASE_URL = '/api';

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

export const PLACE_STATUS = {
  FREE: 'free',
  OCCUPIED: 'occupied',
  PENDING: 'pending'
};

export const TIMER_COLORS = {
  NORMAL: '#333',
  WARNING: '#ff9800',  // меньше 2 часов
  DANGER: '#f44336'     // меньше 1 часа
};

export const TIMER_THRESHOLDS = {
  WARNING: 2 * 60 * 60 * 1000,  // 2 часа в миллисекундах
  DANGER: 1 * 60 * 60 * 1000     // 1 час в миллисекундах
};

export const MAP_DIMENSIONS = {
  WIDTH: 600,
  HEIGHT: 500,
  CENTER_X: 300,
  CENTER_Y: 250
};

export const DEFAULT_PLACE_COLORS = {
  FREE: '#4CAF50',
  OCCUPIED: '#f44336',
  PENDING: '#ff9800'
};

export const MESSAGES = {
  CONFIRM_CANCEL_BOOKING: 'Вы уверены, что хотите отменить бронирование?',
  CONFIRM_DELETE_CHAT: 'Вы уверены, что хотите удалить этот чат?',
  CONFIRM_DELETE_USER: 'Вы уверены, что хотите удалить этого пользователя?',
  CONFIRM_DELETE_PLACE: 'Вы уверены, что хотите удалить это место?',
  CONFIRM_CLEAR_STATS: 'Вы уверены, что хотите очистить статистику?',
  CONFIRM_CHANGE_ROLE: 'Изменить роль пользователя?',
  BOOKING_SUCCESS: 'Бронирование успешно создано и ожидает подтверждения',
  BOOKING_CANCELLED: 'Бронирование успешно отменено',
  PROFILE_UPDATED: 'Профиль успешно обновлен',
  CATCH_ADDED: 'Улов успешно добавлен',
  STATS_CLEARED: 'Статистика успешно очищена',
  CHAT_DELETED: 'Чат успешно удален',
  PLACE_DELETED: 'Место успешно удалено',
  USER_DELETED: 'Пользователь успешно удален',
  ROLE_UPDATED: 'Роль пользователя успешно обновлена'
};

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  BOOKING_MIN_DURATION: 1,  // часы
  BOOKING_MAX_DURATION: 24, // часы
  EXTEND_MIN_HOURS: 1,
  EXTEND_MAX_HOURS: 24,
  CATCH_MIN_AMOUNT: 0.1,    // кг
  PLACE_MAX_CAPACITY: 10
};

export const CHAT_CONFIG = {
  MESSAGE_MAX_LENGTH: 500,
  REFRESH_INTERVAL: 5000,    // 5 секунд
  TYPING_TIMEOUT: 3000       // 3 секунды
};

export const MAP_CONFIG = {
  REFRESH_INTERVAL: 30000,   // 30 секунд
  ANIMATION_DURATION: 300,   // миллисекунды
  MARKER_RADIUS: 20
};

export const STATS_CONFIG = {
  TOP_LIMIT: 10,             // количество в топе
  CACHE_DURATION: 60000      // 1 минута
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
  UNAUTHORIZED: 'Необходима авторизация',
  FORBIDDEN: 'Доступ запрещен',
  NOT_FOUND: 'Ресурс не найден',
  VALIDATION_ERROR: 'Проверьте правильность введенных данных',
  BOOKING_CONFLICT: 'Это место уже забронировано на выбранное время',
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  USER_EXISTS: 'Пользователь с таким email или именем уже существует',
  PLACE_HAS_ACTIVE_BOOKINGS: 'Невозможно удалить место с активными бронированиями',
  CANNOT_DELETE_ADMIN: 'Невозможно удалить администратора',
  CANNOT_CHANGE_ADMIN_ROLE: 'Невозможно изменить роль администратора'
};