import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ManagerPanel = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [showAddPlaceForm, setShowAddPlaceForm] = useState(false);
  const [showEditPlaceForm, setShowEditPlaceForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [newPlace, setNewPlace] = useState({
    name: '',
    coordinates: { x: 300, y: 250 },
    description: '',
    maxCapacity: 2
  });
  const [catchData, setCatchData] = useState({
    userId: '',
    bookingId: '',
    amount: ''
  });
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookings, placesData, activeUsers, allBookings] = await Promise.all([
        apiService.getPendingBookings(),
        apiService.getPlaces(),
        apiService.getActiveUsers(),
        apiService.getAllBookings()
      ]);
      
      setPendingBookings(bookings);
      setPlaces(placesData);
      setUsers(activeUsers);
      console.log('Active users from server:', activeUsers);
      
      const now = new Date();
      const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
      
      console.log('Now string:', nowStr);
      console.log('All bookings from server:', allBookings);
      
      const active = allBookings.filter(b => {
        const isActive = b.status === 'approved' && b.local_start <= nowStr && b.local_end >= nowStr;
        if (b.status === 'approved') {
          console.log(`Booking ${b.id}: ${b.local_start} <= ${nowStr} = ${b.local_start <= nowStr}, ${b.local_end} >= ${nowStr} = ${b.local_end >= nowStr} => active: ${isActive}`);
        }
        return isActive;
      });
      
      console.log('Active bookings count:', active.length);
      setActiveBookings(active);
      
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

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Вы уверены, что хотите отменить это бронирование?')) {
      return;
    }
    
    try {
      await apiService.cancelBooking(bookingId);
      loadData();
      alert('Бронирование отменено');
    } catch (error) {
      alert('Ошибка при отмене бронирования');
      console.error('Error cancelling booking:', error);
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

  const handleEditPlace = (place) => {
    setEditingPlace(place);
    setNewPlace({
      name: place.name,
      coordinates: { ...place.coordinates },
      description: place.description || '',
      maxCapacity: place.maxCapacity
    });
    setShowEditPlaceForm(true);
  };

  const handleUpdatePlace = async (e) => {
    e.preventDefault();
    try {
      await apiService.updatePlace(editingPlace.id, newPlace);
      setShowEditPlaceForm(false);
      setEditingPlace(null);
      setNewPlace({
        name: '',
        coordinates: { x: 300, y: 250 },
        description: '',
        maxCapacity: 2
      });
      loadData();
    } catch (error) {
      alert('Ошибка при обновлении места');
      console.error('Error updating place:', error);
    }
  };

  const handleImageUpload = async (e, placeId) => {
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
      await apiService.uploadPlaceImage(placeId, compressedImage);
      loadData();
      alert('Фото места обновлено');
    } catch (error) {
      console.error('Error uploading place image:', error);
      alert('Ошибка при загрузке фото');
    } finally {
      setUploadingImage(false);
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
    
    const amount = parseFloat(catchData.amount);
    
    if (!catchData.userId || !catchData.bookingId || !catchData.amount) {
      alert('Заполните все поля');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректное количество улова (больше 0)');
      return;
    }
    
    try {
      await apiService.addCatch({
        userId: catchData.userId,
        bookingId: catchData.bookingId,
        amount: amount
      });
      
      const user = users.find(u => u.id === catchData.userId);
      const booking = activeBookings.find(b => b.id === catchData.bookingId);
      
      alert(`Улов добавлен!\nПользователь: ${user?.username || 'Неизвестно'}\nМесто: ${booking?.placeId || 'Неизвестно'}\nКоличество: ${amount} кг`);
      
      setCatchData({ userId: '', bookingId: '', amount: '' });
      loadData();
    } catch (error) {
      alert('Ошибка при добавлении улова');
      console.error('Error adding catch:', error);
    }
  };

  const getActiveUsers = () => {
    const activeUserIds = activeBookings.map(b => b.user_id);
    return users.filter(u => activeUserIds.includes(u.id));
  };

  const getBookingsForUser = (userId) => {
    return activeBookings.filter(b => b.user_id === userId);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  const activeUsers = getActiveUsers();

  return (
    <div className="card">
      <h2>Панель управления</h2>
      
      <div style={{ marginBottom: '20px', marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Заявки на бронирование ({pendingBookings.length})
        </button>
        <button 
          className={`btn ${activeTab === 'active' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Активные брони ({activeBookings.length})
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
                    <td>{(booking.local_start || booking.start_time || '').replace('T', ' ')}</td>
                    <td>{(booking.local_end || booking.end_time || '').replace('T', ' ')}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ marginRight: '10px', padding: '4px 8px' }}
                        onClick={() => handleApproveBooking(booking.id)}
                      >
                        Подтвердить
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleRejectBooking(booking.id)}
                      >
                        Отклонить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div>
          <h3>Активные бронирования</h3>
          {activeBookings.length === 0 ? (
            <p>Нет активных бронирований</p>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Место</th>
                  <th>Начало</th>
                  <th>Окончание</th>
                  <th>Улов</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {activeBookings.map(booking => {
                  const user = users.find(u => u.id === booking.user_id);
                  const place = places.find(p => p.id === booking.place_id);
                  return (
                    <tr key={booking.id}>
                      <td>{user?.username || 'Неизвестно'}</td>
                      <td>{place?.name || booking.place_id}</td>
                      <td>{(booking.local_start || booking.startTime || '').replace('T', ' ')}</td>
                      <td>{(booking.local_end || booking.endTime || '').replace('T', ' ')}</td>
                      <td>{booking.catch_amount || 0} кг</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Отменить бронь
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                  <label>Координаты X (0-600):</label>
                  <input
                    type="number"
                    min="0"
                    max="600"
                    value={newPlace.coordinates.x}
                    onChange={(e) => setNewPlace({
                      ...newPlace, 
                      coordinates: {...newPlace.coordinates, x: parseInt(e.target.value)}
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Координаты Y (0-500):</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
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
                    rows="3"
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

          {showEditPlaceForm && editingPlace && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3>Редактирование: {editingPlace.name}</h3>
              <form onSubmit={handleUpdatePlace}>
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
                  <label>Координаты X (0-600):</label>
                  <input
                    type="number"
                    min="0"
                    max="600"
                    value={newPlace.coordinates.x}
                    onChange={(e) => setNewPlace({
                      ...newPlace, 
                      coordinates: {...newPlace.coordinates, x: parseInt(e.target.value)}
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Координаты Y (0-500):</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
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
                    rows="3"
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
                  <button type="submit" className="btn btn-primary">Сохранить</button>
                  <button type="button" className="btn" onClick={() => {
                    setShowEditPlaceForm(false);
                    setEditingPlace(null);
                    setNewPlace({
                      name: '',
                      coordinates: { x: 300, y: 250 },
                      description: '',
                      maxCapacity: 2
                    });
                  }}>
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
                <th>Фото</th>
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
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {place.status === 'free' ? 'Свободно' :
                       place.status === 'occupied' ? 'Занято' : 'Ожидание'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {place.image ? (
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Есть</span>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                      <label style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer', fontSize: '16px' }}>
                        фото
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, place.id)}
                          style={{ display: 'none' }}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-warning"
                      style={{ padding: '4px 8px', marginRight: '5px' }}
                      onClick={() => handleEditPlace(place)}
                    >
                      ред.
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleDeletePlace(place.id)}
                    >
                      удалить
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
          
          {activeUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '12px', color: '#666' }}>
              <p style={{ fontSize: '18px', marginBottom: '10px' }}>Нет активных пользователей</p>
              <p>В данный момент никто не рыбачит. Дождитесь начала бронирования.</p>
            </div>
          ) : (
            <form onSubmit={handleAddCatch} style={{ maxWidth: '500px' }}>
              <div className="form-group">
                <label>Выберите пользователя:</label>
                <select
                  value={catchData.userId}
                  onChange={(e) => { setCatchData({ ...catchData, userId: e.target.value, bookingId: '' }); }}
                  required
                  style={{ width: '100%', padding: '12px' }}
                >
                  <option value="">-- Выберите пользователя --</option>
                  {activeUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
                  ))}
                </select>
              </div>
              
              {catchData.userId && (
                <div className="form-group">
                  <label>Выберите бронирование (место):</label>
                  <select
                    value={catchData.bookingId}
                    onChange={(e) => setCatchData({...catchData, bookingId: e.target.value})}
                    required
                    style={{ width: '100%', padding: '12px' }}
                  >
                    <option value="">-- Выберите бронирование --</option>
                    {getBookingsForUser(catchData.userId).map(booking => {
                      const place = places.find(p => p.id === booking.place_id);
                      return (
                        <option key={booking.id} value={booking.id}>
                          {place?.name || booking.place_id} - до {booking.local_end || booking.end_time}
                          {booking.catch_amount > 0 && ` (уже поймано: ${booking.catch_amount} кг)`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label>Количество улова (кг):</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={catchData.amount}
                  onChange={(e) => setCatchData({...catchData, amount: e.target.value})}
                  onKeyDown={(e) => {
                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
                    if (!/[0-9.,]/.test(e.key) && !allowedKeys.includes(e.key)) { e.preventDefault(); }
                    if (e.key === ',') { e.preventDefault(); const input = e.target; const start = input.selectionStart; const end = input.selectionEnd; const newValue = input.value.slice(0, start) + '.' + input.value.slice(end); setCatchData({...catchData, amount: newValue}); }
                    if ((e.key === '.' || e.key === ',') && e.target.value.includes('.')) { e.preventDefault(); }
                  }}
                  required
                  style={{ width: '100%', padding: '12px' }}
                  placeholder="Например: 0.2, 1.5, 3.7"
                />
                <small style={{ color: '#666', marginTop: '8px', display: 'block', fontSize: '13px' }}>Можно вводить дробные числа с точностью до 0.1 кг</small>
              </div>
              
              {catchData.amount && parseFloat(catchData.amount) > 0 && (
                <div style={{ padding: '12px', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
                  <p style={{ margin: 0, color: '#2c3e50' }}><strong>Будет добавлено:</strong> {parseFloat(catchData.amount).toFixed(1)} кг рыбы</p>
                </div>
              )}
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>Добавить улов</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerPanel;