import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const BaseInfoModal = ({ user, onClose }) => {
  const [info, setInfo] = useState({ left: '', right: '' });
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ left: '', right: '' });
  const [saving, setSaving] = useState(false);
  const canEdit = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const data = await apiService.getBaseInfo();
      setInfo(data);
      setEditData(data);
    } catch (error) {
      console.error('Error loading info:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateBaseInfo(editData);
      setInfo(editData);
      setEditing(false);
    } catch (error) {
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '100px',
      pointerEvents: 'none'
    }}>
      <div style={{
        animation: 'fadeIn 0.4s ease-out',
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        width: '95%',
        maxWidth: '1400px',
        maxHeight: '80vh',
        overflow: 'hidden',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Заголовок */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px 40px 28px',
          background: 'transparent',
          borderBottom: 'none',
          flexShrink: 0,
          position: 'relative'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '300',
            color: '#ffffff',
            letterSpacing: '1px',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}>
            {canEdit && editing ? 'Редактирование информации' : 'О базе отдыха'}
          </h2>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '40px',
              cursor: 'pointer',
              width: '52px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
          >
            &times;
          </button>
        </div>

        {/* Контент */}
        <div style={{ display: 'flex', minHeight: 0, flex: 1 }}>
          {/* Левая колонка */}
          <div style={{ flex: '100%', padding: '16px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '20px',
              flex: 1,
              minHeight: 0,
              border: '1px solid rgba(255, 255, 255, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {canEdit && editing ? (
                <textarea
                  value={editData.left}
                  onChange={(e) => setEditData({ ...editData, left: e.target.value })}
                  style={{
                    width: '100%',
                    flex: 1,
                    minHeight: '300px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '16px',
                    resize: 'none',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    outline: 'none',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                  placeholder="Введите текст..."
                />
              ) : (
                <div style={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  lineHeight: '1.8',
                  color: '#e0e8f0',
                  fontSize: '15px',
                  flex: 1,
                  overflow: 'auto',
                  minHeight: 0,
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)'
                }}>
                  {info.left || 'Информация не добавлена'}
                </div>
              )}
            </div>
          </div>

          {/* Прозрачный центр */}
          <div style={{ flex: '120%', minWidth: 0 }} />

          {/* Правая колонка */}
          <div style={{ flex: '100%', padding: '16px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '20px',
              flex: 1,
              minHeight: 0,
              border: '1px solid rgba(255, 255, 255, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {canEdit && editing ? (
                <textarea
                  value={editData.right}
                  onChange={(e) => setEditData({ ...editData, right: e.target.value })}
                  style={{
                    width: '100%',
                    flex: 1,
                    minHeight: '300px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '16px',
                    resize: 'none',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    outline: 'none',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                  placeholder="Введите текст..."
                />
              ) : (
                <div style={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  lineHeight: '1.8',
                  color: '#e0e8f0',
                  fontSize: '15px',
                  flex: 1,
                  overflow: 'auto',
                  minHeight: 0,
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)'
                }}>
                  {info.right || 'Информация не добавлена'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Кнопки */}
        {canEdit && (
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            padding: '20px 40px',
            background: 'transparent',
            borderTop: 'none',
            flexShrink: 0
          }}>
            {editing ? (
              <>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button className="btn" onClick={() => { setEditing(false); setEditData(info); }}>
                  Отмена
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                Редактировать
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseInfoModal;