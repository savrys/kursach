import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData);
      localStorage.setItem('token', response.token);
      setUser(response.user);
    } catch (error) {
      setError(error.response?.data?.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Вход в систему</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Введите email"
          />
        </div>
        
        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Введите пароль"
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
        
        <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
          <p style={{ margin: '5px 0', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            Тестовый аккаунт: admin@fishing.com / admin123
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;