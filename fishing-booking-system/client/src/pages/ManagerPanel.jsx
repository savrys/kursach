import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ManagerPanel = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [places, setPlaces] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [showAddPlaceForm, setShowAddPlaceForm] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: '',
    coordinates: { x: 300, y: 250 },
    description: '',
    maxCapacity: 2
  });
  const [catchData, setCatchData] = useState({
    userId: '',
    bookingId: '',
    amount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookings, placesData] = await Promise.all([
        apiService.getPendingBookings(),
        apiService.getPlaces()
      ]);
      setPendingBookings(bookings);
      setPlaces(placesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await apiService.approveBooking(bookingId);
      loadData();
    } catch (error) {
      alert('Ошибка при подтверждении бронирования');
      console.error('Error approving booking:', error);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await apiService.rejectBooking(bookingId);
      loadData();
    } catch (error) {
      alert('Ошибка при отклонении бронирования');
      console.error('Error rejecting booking:', error);
    }
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    try {
      await apiService.createPlace(newPlace);
      setShowAddPlaceForm(false);
      setNewPlace({
        name: '',
        coordinates: { x: 300, y: 250 },
        description: '',
        maxCapacity: 2
      });
      loadData();
    } catch (error) {
      alert('Ошибка при создании места');
      console.error('Error creating place:', error);
    }
  };

  const handleDeletePlace = async (placeId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это место?')) {
      return;
    }

    try {
      await apiService.deletePlace(placeId);
      loadData();
    } catch (error) {
      alert('Ошибка при удалении места');
      console.error('Error deleting place:', error);
    }
  };

  const handleAddCatch = async (e) => {
    e.preventDefault();
    try {
      await apiService.addCatch(catchData);
      setCatchData({ userId: '', bookingId: '', amount: 0 });
      loadData();
      alert('Улов добавлен успешно!');
    } catch (error) {
      alert('Ошибка при добавлении улова');
      console.error('Error adding catch:', error);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="card">
      <h2>📋 Панель управления</h2>
      
      <div style={{ marginBottom: '20px', marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button 
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Заявки на бронирование
        </button>
        <button 
          className={`btn ${activeTab === 'places' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('places')}
        >
          Управление местами
        </button>
        <button 
          className={`btn ${activeTab === 'catch' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('catch')}
        >
          Добавить улов
        </button>
      </div>

      {activeTab === 'bookings' && (
        <div>
          <h3>Ожидают подтверждения</h3>
          {pendingBookings.length === 0 ? (
            <p>Нет заявок на бронирование</p>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Место</th>
                  <th>Начало</th>
                  <th>Окончание</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.username}</td>
                    <td>{booking.placeName}</td>
                    <td>{new Date(booking.startTime).toLocaleString()}</td>
                    <td>{new Date(booking.endTime).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ marginRight: '10px', padding: '4px 8px' }}
                        onClick={() => handleApproveBooking(booking.id)}
                      >
                        ✓ Подтвердить
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleRejectBooking(booking.id)}
                      >
                        ✕ Отклонить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'places' && (
        <div>
          <button 
            className="btn btn-primary" 
            style={{ marginBottom: '20px' }}
            onClick={() => setShowAddPlaceForm(true)}
          >
            + Добавить место
          </button>

          {showAddPlaceForm && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3>Новое место</h3>
              <form onSubmit={handleAddPlace}>
                <div className="form-group">
                  <label>Название:</label>
                  <input
                    type="text"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Координаты X:</label>
                  <input
                    type="number"
                    value={newPlace.coordinates.x}
                    onChange={(e) => setNewPlace({
                      ...newPlace, 
                      coordinates: {...newPlace.coordinates, x: parseInt(e.target.value)}
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Координаты Y:</label>
                  <input
                    type="number"
                    value={newPlace.coordinates.y}
                    onChange={(e) => setNewPlace({
                      ...newPlace, 
                      coordinates: {...newPlace.coordinates, y: parseInt(e.target.value)}
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Описание:</label>
                  <textarea
                    value={newPlace.description}
                    onChange={(e) => setNewPlace({...newPlace, description: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Вместимость:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newPlace.maxCapacity}
                    onChange={(e) => setNewPlace({...newPlace, maxCapacity: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary">Создать</button>
                  <button type="button" className="btn" onClick={() => setShowAddPlaceForm(false)}>
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}

          <table className="stats-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Координаты</th>
                <th>Вместимость</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {places.map(place => (
                <tr key={place.id}>
                  <td>{place.name}</td>
                  <td>({place.coordinates.x}, {place.coordinates.y})</td>
                  <td>{place.maxCapacity}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 
                        place.status === 'free' ? '#4CAF50' :
                        place.status === 'occupied' ? '#f44336' : '#ff9800',
                      color: 'white'
                    }}>
                      {place.status === 'free' ? 'Свободно' :
                       place.status === 'occupied' ? 'Занято' : 'Ожидание'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleDeletePlace(place.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'catch' && (
        <div>
          <h3>Добавить улов</h3>
          <form onSubmit={handleAddCatch} style={{ maxWidth: '400px' }}>
            <div className="form-group">
              <label>ID пользователя:</label>
              <input
                type="text"
                value={catchData.userId}
                onChange={(e) => setCatchData({...catchData, userId: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>ID бронирования:</label>
              <input
                type="text"
                value={catchData.bookingId}
                onChange={(e) => setCatchData({...catchData, bookingId: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Количество (кг):</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={catchData.amount}
                onChange={(e) => setCatchData({...catchData, amount: parseFloat(e.target.value)})}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Добавить улов</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagerPanel;