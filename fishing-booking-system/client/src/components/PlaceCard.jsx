import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const PlaceCard = ({ place, user, onClose, onBook, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendHours, setExtendHours] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [placeImage, setPlaceImage] = useState(place.image || null);

  useEffect(() => {
    if (place.bookingInfo?.timeRemaining) {
      setTimeRemaining(place.bookingInfo.timeRemaining);
      
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            clearInterval(timer);
            onRefresh();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [place.bookingInfo]);

  useEffect(() => {
    setPlaceImage(place.image);
  }, [place.image]);

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

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5 МБ');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    setUploadingImage(true);
    
    try {
      const compressedImage = await compressImage(file);
      const response = await apiService.uploadPlaceImage(place.id, compressedImage);
      setPlaceImage(response.image);
      onRefresh();
      alert('Фото места сохранено');
    } catch (error) {
      console.error('Error uploading place image:', error);
      alert('Ошибка при сохранении фото');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm('Удалить фото этого места?')) {
      return;
    }

    try {
      await apiService.deletePlaceImage(place.id);
      setPlaceImage(null);
      onRefresh();
      alert('Фото удалено');
    } catch (error) {
      console.error('Error deleting place image:', error);
      alert('Ошибка при удалении фото');
    }
  };

  const canBook = place.status === 'free' && user.role === 'user';
  const canExtend = place.status === 'occupied' && 
                    (user.role === 'manager' || user.role === 'admin');
  const canCancel = place.status === 'occupied' && 
                    place.bookingInfo?.username === user.username;
  const canManageImages = user.role === 'manager' || user.role === 'admin';

  const getTimerClass = () => {
    if (!timeRemaining) return 'timer';
    if (timeRemaining < 3600000) return 'timer danger';
    if (timeRemaining < 7200000) return 'timer warning';
    return 'timer';
  };

  return (
    <>
      <div className="modal">
        <div className="modal-content" style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <h2 className="modal-title">{place.name}</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Фото места */}
            <div style={{ 
              width: '100%', 
              minHeight: '200px', 
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {placeImage ? (
                <img 
                  src={placeImage} 
                  alt={place.name}
                  style={{ 
                    width: '100%', 
                    maxHeight: '300px', 
                    objectFit: 'contain',
                    background: '#1a2a3a'
                  }}
                />
              ) : (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#999',
                  fontSize: '48px'
                }}>
                  🎣
                </div>
              )}
              
              {canManageImages && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '10px', 
                  right: '10px',
                  display: 'flex',
                  gap: '5px'
                }}>
                  <label 
                    className="btn btn-primary" 
                    style={{ 
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer',
                      opacity: uploadingImage ? 0.7 : 1
                    }}
                  >
                    {uploadingImage ? 'секунду...' : 'сменить фото'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                    />
                  </label>
                  {placeImage && (
                    <button 
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={handleDeleteImage}
                    >
                      удалить
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ padding: '20px' }}>
              <p><strong>Описание:</strong> {place.description || 'Нет описания'}</p>
              <p><strong>Вместимость:</strong> {place.maxCapacity} человек</p>
              <p><strong>Статус:</strong> {
                place.status === 'free' ? ' Свободно' :
                place.status === 'occupied' ? ' Занято' : ' Ожидает подтверждения'
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
                    <p><strong>Улов:</strong>  {place.bookingInfo.catchAmount} кг</p>
                  )}
                </>
              )}
            </div>
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
            <p>Текущее время окончания: {place.bookingInfo?.endTime ? new Date(place.bookingInfo.endTime).toLocaleString() : ''}</p>
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
              Новое время окончания: {place.bookingInfo?.endTime ? new Date(new Date(place.bookingInfo.endTime).getTime() + extendHours * 3600000).toLocaleString() : ''}
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