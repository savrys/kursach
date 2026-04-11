import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

const Register = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      localStorage.setItem('token', response.token);
      setUser(response.user);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Регистрация</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Имя пользователя:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Введите имя"
          />
        </div>
        
        <div className="form-group">
          <label>Email:</label>
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
          <label>Пароль:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Введите пароль"
          />
        </div>
        
        <div className="form-group">
          <label>Подтверждение пароля:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Подтвердите пароль"
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login">Уже есть аккаунт? Войти</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;