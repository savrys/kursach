import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import PlaceCard from './PlaceCard';
import BookingForm from './BookingForm';

const Map = ({ user }) => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapImage, setMapImage] = useState(null);

  useEffect(() => {
    loadPlaces();
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

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedPlace(null);
    loadPlaces();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMapImage(e.target.result);
        localStorage.setItem('mapImage', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const savedMap = localStorage.getItem('mapImage');
    if (savedMap) {
      setMapImage(savedMap);
    }
  }, []);

  if (loading) {
    return <div className="loading">Загрузка карты...</div>;
  }

  return (
    <div>
      {(user.role === 'manager' || user.role === 'admin') && (
        <div style={{ marginBottom: '10px' }}>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
             Загрузить свою карту
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
          {mapImage && (
            <button 
              className="btn btn-warning" 
              onClick={() => {
                setMapImage(null);
                localStorage.removeItem('mapImage');
              }}
              style={{ marginLeft: '10px' }}
            >
              Сбросить карту
            </button>
          )}
        </div>
      )}

      <div 
        className="map-container" 
        style={{ 
          position: 'relative',
          backgroundImage: mapImage ? `url(${mapImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: mapImage ? 'transparent' : '#e8f4f8'
        }}
      >
        {!mapImage ? (
          <svg className="map-svg" viewBox="0 0 600 500">
            <ellipse cx="300" cy="250" rx="250" ry="180" fill="#4A90E2" opacity="0.6" />
            <ellipse cx="300" cy="250" rx="230" ry="160" fill="#5BA3E6" opacity="0.4" />
            
            {places.map(place => (
              <g key={place.id} onClick={() => handlePlaceClick(place)}>
                <circle
                  cx={place.coordinates.x}
                  cy={place.coordinates.y}
                  r="20"
                  className={`place-marker ${
                    place.status === 'free' ? 'place-free' :
                    place.status === 'occupied' ? 'place-occupied' : 'place-pending'
                  }`}
                />
                <text
                  x={place.coordinates.x}
                  y={place.coordinates.y}
                  textAnchor="middle"
                  dy=".3em"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {place.name}
                </text>
                {place.bookingInfo && place.bookingInfo.catchAmount > 0 && (
                  <text
                    x={place.coordinates.x}
                    y={place.coordinates.y + 30}
                    textAnchor="middle"
                    className="catch-amount-text"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    🐟 {place.bookingInfo.catchAmount} кг
                  </text>
                )}
                {place.status === 'occupied' && place.bookingInfo && (
                  <text
                    x={place.coordinates.x}
                    y={place.coordinates.y - 30}
                    textAnchor="middle"
                    fill="#333"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    ⏱️ {Math.ceil(place.bookingInfo.timeRemaining / 3600000)}ч
                  </text>
                )}
              </g>
            ))}
          </svg>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {places.map(place => (
              <div
                key={place.id}
                onClick={() => handlePlaceClick(place)}
                style={{
                  position: 'absolute',
                  left: `${(place.coordinates.x / 600) * 100}%`,
                  top: `${(place.coordinates.y / 500) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: place.status === 'free' ? '#4CAF50' :
                               place.status === 'occupied' ? '#f44336' : '#ff9800',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    border: '2px solid white'
                  }}
                >
                  <div>{place.name}</div>
                  {place.status === 'occupied' && place.bookingInfo && (
                    <div style={{ fontSize: '10px' }}>
                      {Math.ceil(place.bookingInfo.timeRemaining / 3600000)}ч
                    </div>
                  )}
                </div>
                {place.bookingInfo && place.bookingInfo.catchAmount > 0 && (
                  <div
                    className="catch-amount-badge"
                    style={{
                      position: 'absolute',
                      top: '50px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#1a2a3a',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      whiteSpace: 'nowrap',
                      border: '1px solid #4A90E2'
                    }}
                  >
                    🐟 {place.bookingInfo.catchAmount} кг
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPlace && (
        <PlaceCard
          place={selectedPlace}
          user={user}
          onClose={() => setSelectedPlace(null)}
          onBook={() => setShowBookingForm(true)}
          onRefresh={loadPlaces}
        />
      )}

      {showBookingForm && selectedPlace && (
        <BookingForm
          place={selectedPlace}
          user={user}
          onClose={() => setShowBookingForm(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default Map;