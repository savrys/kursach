import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const TopVisitors = ({ user }) => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopVisitors();
  }, []);

  const loadTopVisitors = async () => {
    try {
      const data = await apiService.getTopVisitors();
      setVisitors(data);
    } catch (error) {
      console.error('Error loading top visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStats = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить статистику посещений?')) {
      return;
    }

    try {
      await apiService.clearVisitsStats();
      loadTopVisitors();
    } catch (error) {
      console.error('Error clearing stats:', error);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка статистики...</div>;
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Топ по времени посещения</h2>
        {(user.role === 'manager' || user.role === 'admin') && (
          <button className="btn btn-warning" onClick={handleClearStats}>
            Очистить статистику
          </button>
        )}
      </div>

      {visitors.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          Пока нет данных о посещениях
        </div>
      ) : (
        <table className="stats-table">
          <thead>
            <tr>
              <th>Место</th>
              <th>Посетитель</th>
              <th>Время (часы)</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((visitor, index) => (
              <tr key={visitor.user_id || index}>
                <td>
                  {index + 1}
                </td>
                <td>{visitor.username}</td>
                <td><strong>{(visitor.total_hours || 0).toFixed(1)} ч</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TopVisitors;