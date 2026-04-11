import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navigation = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
           Рыболовная база
        </Link>
        
        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/" className="navbar-item">Карта</Link>
              <Link to="/profile" className="navbar-item">Профиль</Link>
              
              {(user.role === 'manager' || user.role === 'admin') && (
                <Link to="/manager" className="navbar-item">Управление</Link>
              )}
              
              {user.role === 'admin' && (
                <Link to="/admin" className="navbar-item">Админ</Link>
              )}
              
              <span className="navbar-item">
                {user.username} ({user.role})
              </span>
              
              <button onClick={handleLogout} className="btn btn-danger">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-item">Войти</Link>
              <Link to="/register" className="navbar-item">Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;