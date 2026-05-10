import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import PlaceCard from './PlaceCard';
import BookingForm from './BookingForm';

const Map = ({ user, onOpenInfo }) => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapImage, setMapImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPlaces();
    loadMapImage();
    const interval = setInterval(loadPlaces, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPlaces = async () => {
    try {
      const data = await apiService.getPlaces();
      setPlaces(data);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMapImage = async () => {
    try {
      const response = await apiService.getMapImage();
      if (response.image) {
        setMapImage(response.image);
      }
    } catch (error) {
      console.error('Error loading map image:', error);
    }
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedPlace(null);
    loadPlaces();
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
        
          let width = img.width;
          let height = img.height;
        
          const maxDimension = 2000;
        
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
          resolve(canvas.toDataURL('image/jpeg', 0.7));
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

    setUploading(true);
    
    try {
      const compressedImage = await compressImage(file);
      await apiService.uploadMapImage(compressedImage);
      setMapImage(compressedImage);
      alert('Изображение карты сохранено');
    } catch (error) {
      console.error('Error uploading map image:', error);
      alert('Ошибка при сохранении изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleResetMap = async () => {
    if (!window.confirm('Удалить карту и вернуть стандартную?')) return;
    try {
      await apiService.deleteMapImage();
      setMapImage(null);
      alert('Карта сброшена');
    } catch (error) {
      console.error('Error deleting map image:', error);
      alert('Ошибка при сбросе карты');
    }
  };

  if (loading) return <div className="loading">Загрузка карты...</div>;

  return (
    <div>
      {(user.role === 'manager' || user.role === 'admin') && (
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label className="btn btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? 'Загрузка...' : 'Загрузить карту'}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
          {mapImage && <button className="btn" onClick={handleResetMap}>Сбросить</button>}
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginLeft: '8px' }}>
            {mapImage ? 'Пользовательская карта' : 'Стандартная карта'}
          </span>
        </div>
      )}

      <div className="map-container">
        {!mapImage ? (
          <svg className="map-svg" viewBox="0 0 600 500" width="100%" height="100%">
            <ellipse cx="300" cy="250" rx="250" ry="180" fill="rgba(74, 144, 226, 0.15)" />
            <ellipse cx="300" cy="250" rx="230" ry="160" fill="rgba(91, 163, 230, 0.1)" />
            
            {places.map(place => (
              <g key={place.id} onClick={() => handlePlaceClick(place)}>
                <circle cx={place.coordinates.x} cy={place.coordinates.y} r="20" className={`place-marker ${place.status === 'free' ? 'place-free' : place.status === 'occupied' ? 'place-occupied' : place.status === 'pending_cancel' ? 'place-pending-cancel' : 'place-pending'}`} />
                <text x={place.coordinates.x} y={place.coordinates.y} textAnchor="middle" dy=".3em" fill="rgba(255, 255, 255, 0.9)" fontSize="12" fontWeight="500">{place.name}</text>
                {place.bookingInfo && place.bookingInfo.catchAmount > 0 && (
                  <text x={place.coordinates.x} y={place.coordinates.y + 30} textAnchor="middle" className="catch-amount-text" fontSize="12" fontWeight="500">{place.bookingInfo.catchAmount} кг</text>
                )}
                {(place.status === 'occupied' || place.status === 'pending_cancel') && place.bookingInfo && (
                  <text x={place.coordinates.x} y={place.coordinates.y - 30} textAnchor="middle" fill="rgba(255, 255, 255, 0.8)" fontSize="11" fontWeight="400">{Math.ceil(place.bookingInfo.timeRemaining / 3600000)}ч</text>
                )}
              </g>
            ))}
          </svg>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={mapImage} alt="Карта" width="600" height="500" loading="lazy" style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', aspectRatio: '600 / 500' }} />
            {places.map(place => (
              <div key={place.id} onClick={() => handlePlaceClick(place)} style={{ position: 'absolute', left: `${(place.coordinates.x / 600) * 100}%`, top: `${(place.coordinates.y / 500) * 100}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: place.status === 'free' ? 'rgba(72, 199, 142, 0.8)' : place.status === 'occupied' ? 'rgba(220, 53, 69, 0.8)' : place.status === 'pending_cancel' ? 'rgba(66, 133, 244, 0.8)' : 'rgba(255, 193, 7, 0.8)', backdropFilter: 'blur(8px)', color: 'white', fontWeight: '500', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <div>{place.name}</div>
                  {(place.status === 'occupied' || place.status === 'pending_cancel') && place.bookingInfo && <div style={{ fontSize: '10px', opacity: 0.9 }}>{Math.ceil(place.bookingInfo.timeRemaining / 3600000)}ч</div>}
                </div>
                {place.bookingInfo && place.bookingInfo.catchAmount > 0 && (
                  <div className="catch-amount-badge" style={{ position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 25, 35, 0.7)', backdropFilter: 'blur(8px)', color: '#ffffff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.15)' }}>{place.bookingInfo.catchAmount} кг</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопка под картой */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        {user.role === 'manager' || user.role === 'admin' ? (
          <button className="btn btn-primary" onClick={onOpenInfo}>
            Редактировать информацию
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onOpenInfo}>
            Дополнительная информация
          </button>
        )}
      </div>

      {selectedPlace && (
        <PlaceCard place={selectedPlace} user={user} onClose={() => setSelectedPlace(null)} onBook={() => setShowBookingForm(true)} onRefresh={loadPlaces} />
      )}
      {showBookingForm && selectedPlace && (
        <BookingForm place={selectedPlace} user={user} onClose={() => setShowBookingForm(false)} onSuccess={handleBookingSuccess} />
      )}
    </div>
  );
};

export default Map;