import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

const Chat = ({ user, onMessagesRead }) => {
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
      
      // Отмечаем непрочитанные сообщения как прочитанные
      const unreadMessages = data.filter(m => m.senderId !== user.id && !m.read);
      if (unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          await apiService.markMessageAsRead(msg.id);
        }
        // Уведомляем родительский компонент что сообщения прочитаны
        if (onMessagesRead) {
          onMessagesRead();
        }
      }
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

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  if (loading) {
    return <div className="loading">Загрузка чатов...</div>;
  }

  return (
    <div className="card">
      <h2>💬 Чат с администрацией</h2>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Список чатов */}
        <div className="chat-list">
          {user.role === 'user' && chats.length === 0 && (
            <button className="create-chat-btn" onClick={createChat}>
              ✨ Начать чат
            </button>
          )}
          
          {user.role === 'user' && chats.length > 0 && (
            <button className="create-chat-btn" onClick={createChat} style={{ marginBottom: '15px' }}>
              ✨ Новый чат
            </button>
          )}
          
          <div>
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`chat-list-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => handleChatSelect(chat)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{chat.username}</strong>
                  {(user.role === 'manager' || user.role === 'admin') && (
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {chat.lastMessage && (
                  <div className="last-message">
                    {chat.lastMessage.text.substring(0, 25)}
                    {chat.lastMessage.text.length > 25 ? '...' : ''}
                  </div>
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
                  <div className="chat-empty">
                    <div className="chat-empty-icon">💬</div>
                    <p>Нет сообщений</p>
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>Напишите первое сообщение!</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`chat-message ${
                        message.senderId === user.id ? 'sent' : 'received'
                      }`}
                    >
                      <div className="message-sender">
                        {message.senderId === user.id ? 'Вы' : selectedChat.username}
                      </div>
                      <div>{message.text}</div>
                      <div className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
                <button type="submit" disabled={!newMessage.trim()}>
                  Отправить
                </button>
              </form>
            </div>
          ) : (
            <div className="chat-empty">
              <div className="chat-empty-icon">👥</div>
              <p>Выберите чат</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>или создайте новый</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;