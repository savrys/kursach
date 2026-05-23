import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await apiService.getAllUsers();
      setUsers(data);
    } catch (error) {
      setError('Ошибка загрузки пользователей');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Изменить роль пользователя на "${newRole}"?`)) {
      return;
    }

    try {
      await apiService.updateUserRole(userId, newRole);
      loadUsers();
    } catch (error) {
      alert('Ошибка при изменении роли');
      console.error('Error changing role:', error);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя "${username}"?`)) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      loadUsers();
    } catch (error) {
      alert('Ошибка при удалении пользователя');
      console.error('Error deleting user:', error);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="card">
      <h2> Панель администратора</h2>
      
      {error && <div className="error">{error}</div>}
      
      <div style={{ marginTop: '20px' }}>
        <h3>Управление пользователями</h3>
        
        <table className="stats-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Дата регистрации</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 
                      user.role === 'admin' ? '#f44336' :
                      user.role === 'manager' ? '#ff9800' : '#4CAF50',
                    color: 'white'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}</td>
                <td>
                  {user.role !== 'admin' && (
                    <>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{ marginRight: '10px', padding: '4px' }}
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                      </select>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleDeleteUser(user.id, user.username)}
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;