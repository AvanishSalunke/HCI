import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../api';
import { syncSubscription } from '../push';
import './CommitteeLogin.css';
import './Login.css';

// Where each kind of account lands after signing in.
const HOME_FOR_ROLE = {
  student: '/student-dashboard',
  teacher: '/teacher-dashboard',
  admin: '/admin-dashboard',
};

// One panel for everyone: the server works out who you are from the username.
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      syncSubscription(); // link this phone to the account for notifications
      navigate(HOME_FOR_ROLE[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-fullscreen-wrapper">
      <div className="parallax-grid-bg" />

      <div className="card login-card-layout login-card-single">
        <div className="login-single-head">
          <img src="/vjti-logo.jpg" alt="VJTI" className="login-single-logo" />
          <h2>Sign in</h2>
          <p>Student treasurers, faculty advisors and the dean</p>
        </div>

        <div className="login-form-panel">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="login-error-message">{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="login-footer">
            You will be taken to your own dashboard automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
