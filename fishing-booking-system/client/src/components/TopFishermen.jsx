import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const TopFishermen = ({ user }) => {
  const [fishermen, setFishermen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopFishermen();
  }, []);

  const loadTopFishermen = async () => {
    try {
      const data = await apiService.getTopFishermen();
      setFishermen(data);
    } catch (error) {
      console.error('Error loading top fishermen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStats = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить статистику улова?')) {
      return;
    }

    try {
      await apiService.clearFishingStats();
      loadTopFishermen();
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
        <h2> Топ рыбаков</h2>
        {(user.role === 'manager' || user.role === 'admin') && (
          <button className="btn btn-warning" onClick={handleClearStats}>
            Очистить статистику
          </button>
        )}
      </div>

      {fishermen.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          Пока нет данных об улове
        </div>
      ) : (
        <table className="stats-table">
          <thead>
            <tr>
              <th>Место</th>
              <th>Рыбак</th>
              <th>Улов (кг)</th>
            </tr>
          </thead>
          <tbody>
            {fishermen.map((fisherman, index) => (
              <tr key={fisherman.userId}>
                <td>
                  {index === 0 && '1. '}
                  {index === 1 && '2. '}
                  {index === 2 && '3. '}
                  {index + 1}
                </td>
                <td>{fisherman.username}</td>
                <td><strong>{fisherman.totalCatch} кг</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TopFishermen;