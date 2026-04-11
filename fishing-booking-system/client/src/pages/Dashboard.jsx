import React, { useState } from 'react';
import Map from '../components/Map';
import StatsTable from '../components/StatsTable';
import Chat from '../components/Chat';

const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          className={`btn ${activeTab === 'map' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          🗺️ Карта мест
        </button>
        <button 
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Статистика
        </button>
        <button 
          className={`btn ${activeTab === 'chat' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Чат
        </button>
      </div>

      {activeTab === 'map' && <Map user={user} />}
      {activeTab === 'stats' && <StatsTable user={user} />}
      {activeTab === 'chat' && <Chat user={user} />}
    </div>
  );
};

export default Dashboard;