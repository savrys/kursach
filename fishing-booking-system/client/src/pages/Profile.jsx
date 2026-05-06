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
      pending: 'Ожидает',
      approved: 'Подтверждено',
      pending_cancel: 'Запрос на отмену',
      rejected: 'Отклонено',
      cancelled: 'Отменено'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'rgba(255, 193, 7, 0.9)',
      approved: 'rgba(72, 199, 142, 0.9)',
      pending_cancel: 'rgba(255, 152, 0, 0.9)',
      rejected: 'rgba(220, 53, 69, 0.9)',
      cancelled: 'rgba(255, 255, 255, 0.3)'
    };
    return colorMap[status] || 'rgba(255, 255, 255, 0.3)';
  };

  if (loading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>Профиль пользователя</h2>
        
        {message && (
          <div style={{ 
            padding: '14px 18px', 
            background: 'rgba(72, 199, 142, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid rgba(72, 199, 142, 0.3)',
            color: '#ffffff'
          }}>
            {message}
          </div>
        )}
        
        {editing ? (
          <form onSubmit={handleUpdate} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Имя пользователя</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
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
            <p><strong>Имя пользователя</strong> {profile?.username}</p>
            <p><strong>Email</strong> {profile?.email}</p>
            <p><strong>Роль</strong> {
              profile?.role === 'admin' ? 'Администратор' :
              profile?.role === 'manager' ? 'Управляющий' : 'Пользователь'
            }</p>
            <p><strong>Дата регистрации</strong> {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'}</p>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              Редактировать профиль
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Мои бронирования</h3>
        {bookings.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '40px 20px' }}>
            У вас пока нет бронирований
          </p>
        ) : (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Место</th>
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
                  <td>№{booking.place_id}</td>
                  <td>{(booking.local_start || booking.start_time || '').replace('T', ' ')}</td>
                  <td>{(booking.local_end || booking.end_time || '').replace('T', ' ')}</td>
                  <td>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '100px',
                      background: getStatusColor(booking.status),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {getStatusText(booking.status)}
                    </span>
                  </td>
                  <td>
                    {booking.catch_amount > 0 ? `${booking.catch_amount} кг` : '—'}
                  </td>
                  <td>
                    {booking.status === 'approved' && (
                      <button
                        className="btn btn-warning"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleRequestCancel(booking.id)}
                      >
                        Запросить отмену
                      </button>
                    )}
                    {booking.status === 'pending' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleRequestCancel(booking.id)}
                      >
                        Отменить заявку
                      </button>
                    )}
                    {booking.status === 'pending_cancel' && (
                      <span style={{ color: 'rgba(255,152,0,0.8)', fontSize: '12px' }}>Ожидает решения</span>
                    )}
                    {booking.status === 'cancelled' && (
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Отменено</span>
                    )}
                    {booking.status === 'rejected' && (
                      <span style={{ color: 'rgba(220,53,69,0.8)' }}>Отклонено</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Статистика</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div style={{ 
            padding: '28px 20px', 
            background: 'rgba(15, 25, 35, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '13px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Всего бронирований
            </div>
            <div style={{ fontSize: '42px', fontWeight: '300', letterSpacing: '-0.02em' }}>
              {bookings.length}
            </div>
          </div>
          
          <div style={{ 
            padding: '28px 20px', 
            background: 'rgba(15, 25, 35, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '13px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Активных броней
            </div>
            <div style={{ fontSize: '42px', fontWeight: '300', letterSpacing: '-0.02em' }}>
              {bookings.filter(b => b.status === 'approved').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;