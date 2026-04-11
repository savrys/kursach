import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

const Chat = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
    const interval = setInterval(() => {
      if (selectedChat) {
        loadMessages(selectedChat.id);
      }
      loadChats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const data = await apiService.getChats();
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const data = await apiService.getMessages(chatId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createChat = async () => {
    try {
      const chat = await apiService.createChat();
      setChats([...chats, chat]);
      setSelectedChat(chat);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const message = await apiService.sendMessage(selectedChat.id, newMessage);
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const deleteChat = async (chatId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот чат?')) {
      return;
    }

    try {
      await apiService.deleteChat(chatId);
      setChats(chats.filter(c => c.id !== chatId));
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка чатов...</div>;
  }

  return (
    <div className="card">
      <h2>Чат с администрацией</h2>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Список чатов */}
        <div style={{ width: '250px', borderRight: '1px solid #ddd', paddingRight: '20px' }}>
          {user.role === 'user' && chats.length === 0 && (
            <button className="btn btn-primary" onClick={createChat}>
              Начать чат
            </button>
          )}
          
          <div style={{ marginTop: '10px' }}>
            {chats.map(chat => (
              <div
                key={chat.id}
                style={{
                  padding: '10px',
                  marginBottom: '5px',
                  background: selectedChat?.id === chat.id ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => {
                  setSelectedChat(chat);
                  loadMessages(chat.id);
                }}
              >
                <div>
                  <strong>{chat.username}</strong>
                  {chat.lastMessage && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      {chat.lastMessage.text.substring(0, 20)}...
                    </div>
                  )}
                </div>
                {(user.role === 'manager' || user.role === 'admin') && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: '2px 8px', fontSize: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Окно чата */}
        <div style={{ flex: 1 }}>
          {selectedChat ? (
            <div className="chat-container">
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                    Нет сообщений. Начните общение!
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`chat-message ${
                        message.senderId === user.id ? 'sent' : 'received'
                      }`}
                    >
                      <div style={{ fontSize: '12px', marginBottom: '5px', opacity: 0.8 }}>
                        {message.senderId === user.id ? 'Вы' : selectedChat.username}
                      </div>
                      <div>{message.text}</div>
                      <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={sendMessage} className="chat-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                />
                <button type="submit" className="btn btn-primary">
                  Отправить
                </button>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '50px' }}>
              Выберите чат или создайте новый
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;