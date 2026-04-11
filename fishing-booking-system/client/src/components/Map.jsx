import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import PlaceCard from './PlaceCard';
import BookingForm from './BookingForm';

const Map = ({ user }) => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaces();
    const interval = setInterval(loadPlaces, 30000); // Обновление каждые 30 секунд
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

  if (loading) {
    return <div className="loading">Загрузка карты...</div>;
  }

  return (
    <div className="map-container">
      <svg className="map-svg" viewBox="0 0 600 500">
        {/* Озеро */}
        <ellipse cx="300" cy="250" rx="250" ry="180" fill="#4A90E2" opacity="0.6" />
        <ellipse cx="300" cy="250" rx="230" ry="160" fill="#5BA3E6" opacity="0.4" />
        
        {/* Места для рыбалки */}
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
                fill="#333"
                fontSize="12"
              >
                🐟 {place.bookingInfo.catchAmount} кг
              </text>
            )}
          </g>
        ))}
      </svg>

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