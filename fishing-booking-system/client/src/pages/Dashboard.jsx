import React, { useState, useEffect } from 'react';
import Map from '../components/Map';
import StatsTable from '../components/StatsTable';
import Chat from '../components/Chat';
import { apiService } from '../services/api';

const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('map');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5000); // Проверяем каждые 5 секунд
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const chats = await apiService.getChats();
      let count = 0;
      
      for (const chat of chats) {
        const messages = await apiService.getMessages(chat.id);
        // Считаем только НЕПРОЧИТАННЫЕ сообщения от других пользователей
        const unread = messages.filter(m => 
          m.senderId !== user.id && m.read === false
        );
        count += unread.length;
      }
      
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleChatClick = () => {
    setActiveTab('chat');
    // НЕ сбрасываем счётчик здесь - он сбросится только после прочтения сообщений
  };

  const handleMessagesRead = () => {
    // Этот колбэк вызывается когда сообщения реально отмечены как прочитанные
    loadUnreadCount();
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          className={`btn ${activeTab === 'map' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('map')}
        >
           Карта мест
        </button>
        <button 
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
           Статистика
        </button>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button 
            className={`btn ${activeTab === 'chat' ? 'btn-primary' : ''}`}
            onClick={handleChatClick}
          >
             Чат
          </button>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#e74c3c',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              border: '2px solid white',
              animation: 'pulse 1.5s infinite'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {activeTab === 'map' && <Map user={user} />}
      {activeTab === 'stats' && <StatsTable user={user} />}
      {activeTab === 'chat' && <Chat user={user} onMessagesRead={handleMessagesRead} />}
    </div>
  );
};

export default Dashboard;