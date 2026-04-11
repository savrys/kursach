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
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Ошибка при обновлении профиля');
      console.error('Error updating profile:', error);
      setTimeout(() => setMessage(''), 3000);
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
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Ошибка при отмене бронирования');
      console.error('Error cancelling booking:', error);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRequestCancel = async (bookingId) => {
    if (!window.confirm('Отправить запрос на отмену бронирования менеджеру?')) {
      return;
    }

    try {
      await apiService.requestCancelBooking(bookingId);
      loadProfile();
      setMessage('Запрос на отмену отправлен менеджеру');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Ошибка при отправке запроса');
      console.error('Error requesting cancel:', error);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Ожидает подтверждения',
      approved: 'Подтверждено',
      rejected: 'Отклонено',
      cancelled: 'Отменено'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: '#ff9800',
      approved: '#4CAF50',
      rejected: '#f44336',
      cancelled: '#999'
    };
    return colorMap[status] || '#999';
  };

  if (loading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>👤 Профиль пользователя</h2>
        
        {message && <div className="success" style={{ 
          padding: '10px', 
          background: '#d4edda', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>{message}</div>}
        
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
              <button type="button" className="btn" onClick={() => {
                setEditing(false);
                setFormData({
                  username: profile?.username || '',
                  email: profile?.email || ''
                });
              }}>
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <p><strong>Имя пользователя:</strong> {profile?.username}</p>
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Роль:</strong> {
              profile?.role === 'admin' ? 'Администратор' :
              profile?.role === 'manager' ? 'Управляющий' : 'Пользователь'
            }</p>
            <p><strong>Дата регистрации:</strong> {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'}</p>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              Редактировать профиль
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>📅 Мои бронирования</h3>
        {bookings.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            У вас пока нет бронирований
          </p>
        ) : (
          <table className="stats-table">
            <thead>
              <tr>
                <th>ID места</th>
                <th>Начало</th>
                <th>Окончание</th>
                <th>Статус</th>
                <th>Улов</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>Место #{booking.placeId}</td>
                  <td>{new Date(booking.startTime).toLocaleString('ru-RU')}</td>
                  <td>{new Date(booking.endTime).toLocaleString('ru-RU')}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: getStatusColor(booking.status),
                      color: 'white'
                    }}>
                      {getStatusText(booking.status)}
                    </span>
                    {booking.cancelRequested && (
                      <div style={{ fontSize: '12px', color: '#ff9800', marginTop: '5px' }}>
                        Запрос на отмену отправлен
                      </div>
                    )}
                  </td>
                  <td>
                    {booking.catchAmount > 0 ? `🐟 ${booking.catchAmount} кг` : '-'}
                  </td>
                  <td>
                    {booking.status === 'approved' && !booking.cancelRequested && (
                      <>
                        <button
                          className="btn btn-warning"
                          style={{ padding: '4px 8px', marginRight: '5px', fontSize: '12px' }}
                          onClick={() => handleRequestCancel(booking.id)}
                        >
                          Запросить отмену
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Отменить сразу
                        </button>
                      </>
                    )}
                    {booking.status === 'pending' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Отменить заявку
                      </button>
                    )}
                    {booking.status === 'cancelled' && (
                      <span style={{ color: '#999' }}>Отменено</span>
                    )}
                    {booking.status === 'rejected' && (
                      <span style={{ color: '#f44336' }}>Отклонено</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>📊 Моя статистика</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Всего бронирований</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>
              {bookings.length}
            </div>
          </div>
          
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Активных броней</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>
              {bookings.filter(b => b.status === 'approved').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;