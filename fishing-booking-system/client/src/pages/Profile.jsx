import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const Profile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiService.getProfile();
      setProfile(data.user);
      setBookings(data.bookings);
      setFormData({
        username: data.user.username,
        email: data.user.email
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateProfile(formData);
      setMessage('Профиль успешно обновлен');
      setEditing(false);
      loadProfile();
    } catch (error) {
      setMessage('Ошибка при обновлении профиля');
      console.error('Error updating profile:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Вы уверены, что хотите отменить бронирование?')) {
      return;
    }

    try {
      await apiService.cancelBooking(bookingId);
      loadProfile();
      setMessage('Бронирование отменено');
    } catch (error) {
      setMessage('Ошибка при отмене бронирования');
      console.error('Error cancelling booking:', error);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>👤 Профиль пользователя</h2>
        
        {message && <div className="success">{message}</div>}
        
        {editing ? (
          <form onSubmit={handleUpdate} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Имя пользователя:</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn" onClick={() => setEditing(false)}>
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <p><strong>Имя:</strong> {profile?.username}</p>
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Роль:</strong> {profile?.role}</p>
            <p><strong>Дата регистрации:</strong> {new Date(profile?.createdAt).toLocaleDateString()}</p>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              Редактировать
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>📅 Мои бронирования</h3>
        {bookings.length === 0 ? (
          <p>У вас пока нет бронирований</p>
        ) : (
          <table className="stats-table">
            <thead>
              <tr>
                <th>ID места</th>
                <th>Начало</th>
                <th>Окончание</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>{booking.placeId}</td>
                  <td>{new Date(booking.startTime).toLocaleString()}</td>
                  <td>{new Date(booking.endTime).toLocaleString()}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 
                        booking.status === 'approved' ? '#4CAF50' :
                        booking.status === 'pending' ? '#ff9800' :
                        booking.status === 'rejected' ? '#f44336' : '#999',
                      color: 'white'
                    }}>
                      {booking.status === 'approved' ? 'Подтверждено' :
                       booking.status === 'pending' ? 'Ожидает' :
                       booking.status === 'rejected' ? 'Отклонено' : 'Отменено'}
                    </span>
                  </td>
                  <td>
                    {(booking.status === 'approved' || booking.status === 'pending') && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Отменить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Profile;