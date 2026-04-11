import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import ManagerPanel from './pages/ManagerPanel';
import Profile from './pages/Profile';
import { authService } from './services/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navigation user={user} setUser={setUser} />
        <div className="container">
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <Login setUser={setUser} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/" /> : <Register setUser={setUser} />
            } />
            <Route path="/" element={
              user ? <Dashboard user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/profile" element={
              user ? <Profile user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/admin" element={
              user && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />
            } />
            <Route path="/manager" element={
              user && (user.role === 'manager' || user.role === 'admin') ? 
              <ManagerPanel /> : <Navigate to="/" />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;