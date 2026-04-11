import React, { useState } from 'react';
import { apiService } from '../services/api';

const BookingForm = ({ place, user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    duration: 2
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDurationChange = (duration) => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 3600000); // Через час
    const endTime = new Date(startTime.getTime() + duration * 3600000);
    
    setFormData({
      duration,
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16)
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
        endTime: new Date(formData.endTime).toISOString()
      });
      
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при создании бронирования');
    } finally {
      setLoading(false);
    }
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
            <label>Длительность (часы):</label>
            <select
              value={formData.duration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value))}
            >
              <option value="1">1 час</option>
              <option value="2">2 часа</option>
              <option value="3">3 часа</option>
              <option value="4">4 часа</option>
              <option value="6">6 часов</option>
              <option value="8">8 часов</option>
              <option value="12">12 часов</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Начало:</label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Окончание:</label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              min={formData.startTime}
              required
            />
          </div>
          
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