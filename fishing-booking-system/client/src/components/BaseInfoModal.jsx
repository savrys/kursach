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
      alignItems: 'center'
    }}>
      <div style={{
        background: 'transparent',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '85vh',
        overflow: 'hidden'
      }}>
        {/* Заголовок */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 28px',
          background: 'transparent',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '300',
            color: '#ffffff',
            letterSpacing: '-0.02em'
          }}>
            {canEdit && editing ? 'Редактирование информации' : 'О базе отдыха'}
          </h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '28px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
          >
            &times;
          </button>
        </div>

        {/* Контент */}
        <div style={{ display: 'flex', minHeight: '400px' }}>
          {/* Левая колонка с текстом */}
          <div style={{ flex: '30%', padding: '28px' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              padding: '24px',
              height: '100%',
              minHeight: '300px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {canEdit && editing ? (
                <textarea
                  value={editData.left}
                  onChange={(e) => setEditData({ ...editData, left: e.target.value })}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '300px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '16px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    outline: 'none'
                  }}
                  placeholder="Введите текст..."
                />
              ) : (
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.8',
                  color: '#e0e8f0',
                  fontSize: '15px',
                  height: '100%',
                  overflow: 'auto'
                }}>
                  {info.left || 'Информация не добавлена'}
                </div>
              )}
            </div>
          </div>

          {/* Прозрачный центр */}
          <div style={{ flex: '40%' }} />

          {/* Правая колонка с текстом */}
          <div style={{ flex: '30%', padding: '28px' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              padding: '24px',
              height: '100%',
              minHeight: '300px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {canEdit && editing ? (
                <textarea
                  value={editData.right}
                  onChange={(e) => setEditData({ ...editData, right: e.target.value })}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '300px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '16px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    outline: 'none'
                  }}
                  placeholder="Введите текст..."
                />
              ) : (
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.8',
                  color: '#e0e8f0',
                  fontSize: '15px',
                  height: '100%',
                  overflow: 'auto'
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
            padding: '20px 28px',
            background: 'transparent',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
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