import React, { useState } from 'react';
import { apiService } from '../services/api';

const PlaceCard = ({ place, user, onClose, onBook, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendHours, setExtendHours] = useState(1);

  const formatTimeRemaining = (ms) => {
    if (!ms) return '00:00:00';
    
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
    } finally {
      setLoading(false);
    }
  };

  const canBook = place.status === 'free' && user.role === 'user';
  const canExtend = place.status === 'occupied' && 
                    place.bookingInfo?.username === user.username &&
                    (user.role === 'manager' || user.role === 'admin');
  const canCancel = place.status === 'occupied' && 
                    place.bookingInfo?.username === user.username;

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
              place.status === 'free' ? 'Свободно' :
              place.status === 'occupied' ? 'Занято' : 'Ожидает подтверждения'
            }</p>
            
            {place.bookingInfo && (
              <>
                <p><strong>Забронировано:</strong> {place.bookingInfo.username}</p>
                <p><strong>Оставшееся время:</strong> 
                  <span className={`timer ${
                    place.bookingInfo.timeRemaining < 3600000 ? 'danger' :
                    place.bookingInfo.timeRemaining < 7200000 ? 'warning' : ''
                  }`}>
                    {formatTimeRemaining(place.bookingInfo.timeRemaining)}
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
            
            {canExtend && (
              <button className="btn btn-warning" onClick={() => setShowExtendModal(true)}>
                Продлить
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
            <div className="form-group">
              <label>Количество часов:</label>
              <input
                type="number"
                min="1"
                max="24"
                value={extendHours}
                onChange={(e) => setExtendHours(parseInt(e.target.value))}
              />
            </div>
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