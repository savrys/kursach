import React, { useState } from 'react';
import { apiService } from '../services/api';

const BookingForm = ({ place, user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    startTime: '',
    duration: 2
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Автоматический расчет времени окончания
  const calculateEndTime = (startTime, duration) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 3600000);
    return end.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDurationChange = (duration) => {
    setFormData({
      ...formData,
      duration: parseInt(duration)
    });
  };

  const handleStartTimeChange = (startTime) => {
    setFormData({
      ...formData,
      startTime: startTime
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiService.createBooking({
        placeId: place.id,
        startTime: new Date(formData.startTime).toISOString(),
        duration: formData.duration
      });
      
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при создании бронирования');
    } finally {
      setLoading(false);
    }
  };

  // Получаем минимальное время (текущее + 1 час)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  // Получаем максимальное время (30 дней вперед)
  const getMaxDateTime = () => {
    const now = new Date();
    now.setDate(now.getDate() + 30);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Бронирование {place.name}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Дата и время начала:</label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              min={getMinDateTime()}
              max={getMaxDateTime()}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Длительность:</label>
            <select
              value={formData.duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              required
            >
              <option value="1">1 час</option>
              <option value="2">2 часа</option>
              <option value="3">3 часа</option>
              <option value="4">4 часа</option>
              <option value="6">6 часов</option>
              <option value="8">8 часов</option>
              <option value="12">12 часов</option>
              <option value="24">24 часа</option>
            </select>
          </div>
          
          {formData.startTime && (
            <div className="form-group">
              <label>Время окончания:</label>
              <div style={{ 
                padding: '10px', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                fontWeight: 'bold',
                color: '#4CAF50'
              }}>
                {calculateEndTime(formData.startTime, formData.duration)}
              </div>
            </div>
          )}
          
          {error && <div className="error">{error}</div>}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Создание...' : 'Забронировать'}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;