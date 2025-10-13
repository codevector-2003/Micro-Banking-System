import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      });

      if (!response.ok) {
        setError('Login failed. Please check your credentials.');
        return;
      }

      const data = await response.json();
      const token = data.access_token;
      localStorage.setItem('token', token);

      const decoded: any = jwtDecode(token);
      if (decoded.type === 'admin') navigate('/admin/dashboard');
      else if (decoded.type === 'agent') navigate('/agent/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <FontAwesomeIcon icon={faUser} size="4x" color="#667eea" style={{ marginBottom: '10px' }} />
        <h1>Login</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="primary-btn">Login</button>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>

      <style>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-family: Arial, sans-serif;
          background-color: #d1d7ddff;
          padding: 20px;
        }

        .login-card {
          background: #fff;
          border-radius: 12px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          transition: 0.3s;
          border: 4px solid #86b4e5ff;
        }
        .login-card:hover { transform: translateY(-3px); }

        .login-card h1 {
          margin: 10px 0 20px;
          font-size: 2rem;
          color: #2c3e50;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 5px;
        }

        .form-group input {
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          outline: none;
        }

        .primary-btn {
          background-color: #667eea;
          color: #fff;
          border: none;
          padding: 12px;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(102,126,234,0.3);
        }

        .error-message {
          color: #e74c3c;
          margin-top: 10px;
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .login-card { padding: 30px 20px; }
        }
      `}</style>
    </div>
  );
};

export default Login;
