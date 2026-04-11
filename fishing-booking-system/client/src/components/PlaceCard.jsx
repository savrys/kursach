import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const PlaceCard = ({ place, user, onClose, onBook, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendHours, setExtendHours] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (place.bookingInfo?.timeRemaining) {
      setTimeRemaining(place.bookingInfo.timeRemaining);
      
      // Обновляем таймер каждую секунду
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            clearInterval(timer);
            onRefresh(); // Обновляем данные когда время истекло
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [place.bookingInfo]);

  const formatTimeRemaining = (ms) => {
    if (!ms || ms <= 0) return '00:00:00';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtend = async () => {
    if (!place.bookingInfo) return;
    
    setLoading(true);
    try {
      await apiService.extendBooking(place.bookingInfo.bookingId, extendHours);
      onRefresh();
      setShowExtendModal(false);
    } catch (error) {
      console.error('Error extending booking:', error);
      alert('Ошибка при продлении бронирования');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!place.bookingInfo) return;
    
    if (!window.confirm('Вы уверены, что хотите отменить бронирование?')) {
      return;
    }
    
    setLoading(true);
    try {
      await apiService.cancelBooking(place.bookingInfo.bookingId);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Ошибка при отмене бронирования');
    } finally {
      setLoading(false);
    }
  };

  const canBook = place.status === 'free' && user.role === 'user';
  const canExtend = place.status === 'occupied' && 
                    (user.role === 'manager' || user.role === 'admin');
  const canCancel = place.status === 'occupied' && 
                    place.bookingInfo?.username === user.username;

  const getTimerClass = () => {
    if (!timeRemaining) return 'timer';
    if (timeRemaining < 3600000) return 'timer danger'; // меньше 1 часа
    if (timeRemaining < 7200000) return 'timer warning'; // меньше 2 часов
    return 'timer';
  };

  return (
    <>
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">{place.name}</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          
          <div className="card">
            <p><strong>Описание:</strong> {place.description}</p>
            <p><strong>Вместимость:</strong> {place.maxCapacity} человек</p>
            <p><strong>Статус:</strong> {
              place.status === 'free' ? '🟢 Свободно' :
              place.status === 'occupied' ? '🔴 Занято' : '🟡 Ожидает подтверждения'
            }</p>
            
            {place.bookingInfo && (
              <>
                <p><strong>Забронировано:</strong> {place.bookingInfo.username}</p>
                <p><strong>Оставшееся время:</strong> 
                  <span className={getTimerClass()}>
                    {' '}{formatTimeRemaining(timeRemaining)}
                  </span>
                </p>
                {place.bookingInfo.catchAmount > 0 && (
                  <p><strong>Улов:</strong> 🐟 {place.bookingInfo.catchAmount} кг</p>
                )}
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {canBook && (
              <button className="btn btn-primary" onClick={onBook}>
                Забронировать
              </button>
            )}
            
            {canExtend && place.bookingInfo && (
              <button 
                className="btn btn-warning" 
                onClick={() => setShowExtendModal(true)}
              >
                Продлить бронь
              </button>
            )}
            
            {canCancel && (
              <button className="btn btn-danger" onClick={handleCancelBooking}>
                Отменить бронь
              </button>
            )}
            
            <button className="btn" onClick={onClose} style={{ background: '#ddd' }}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
      
      {showExtendModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Продлить бронирование</h3>
            <p>Текущее время окончания: {new Date(place.bookingInfo?.endTime || Date.now()).toLocaleString()}</p>
            <div className="form-group">
              <label>Продлить на (часов):</label>
              <select
                value={extendHours}
                onChange={(e) => setExtendHours(parseInt(e.target.value))}
                style={{ width: '100%', padding: '10px' }}
              >
                <option value="1">1 час</option>
                <option value="2">2 часа</option>
                <option value="3">3 часа</option>
                <option value="4">4 часа</option>
                <option value="6">6 часов</option>
                <option value="12">12 часов</option>
              </select>
            </div>
            <p style={{ marginTop: '10px', color: '#666' }}>
              Новое время окончания: {new Date(new Date(place.bookingInfo?.endTime || Date.now()).getTime() + extendHours * 3600000).toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleExtend} disabled={loading}>
                {loading ? 'Продление...' : 'Продлить'}
              </button>
              <button className="btn" onClick={() => setShowExtendModal(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlaceCard;