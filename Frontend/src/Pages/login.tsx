import React from 'react'
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';


const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {

        }
        catch (err) {
            setError('Login failed. Please try again.');
        }
    }
    return (
        <>
            <div className='login-container'>
                <FontAwesomeIcon icon={faUser} size="4x" color="#ffffffff" style={{ marginBottom: '5px' }} />
                <h1>Login</h1>
                <form onSubmit={handleSubmit} className='login-form'>
                    <div>
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            required
                            value={username}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">Login</button>
                    {error && <div className="error-message">{error}</div>}
                </form>
            </div>
            <style>
                {`
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-image: url('embedded-finance.jpg');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    min-height: 100vh;
                    overflow: hidden;
                }

                .login-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                    box-sizing: border-box;
                }

                .login-container img {
                    width: 80px;
                    height: 80px;
                    margin-bottom: 20px;
                    border-radius: 50%;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .login-container h1 {
                    color: #fff;
                    margin-bottom: 10px;
                    font-size: 2rem;
                    font-weight: 600;
                    text-align: center;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    width: 100%;
                    max-width: 400px;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .login-form > div {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .login-form label {
                    color: #333;
                    font-weight: 600;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .login-form input {
                    padding: 15px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                    outline: none;
                }

                .login-form input:focus {
                    border-color: #667eea;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    transform: translateY(-2px);
                }

                .login-form button {
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .login-form button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                }

                .login-form button:active {
                    transform: translateY(-1px);
                }

                .error-message {
                    color: #e74c3c;
                    background: rgba(231, 76, 60, 0.1);
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 4px solid #e74c3c;
                    font-size: 0.9rem;
                    margin-top: 10px;
                }

                @media (max-width: 480px) {
                    .login-form {
                        padding: 30px 20px;
                        margin: 0 20px;
                    }
                    
                    .login-container h2 {
                        font-size: 1.5rem;
                    }
                }
                `}
            </style>
        </>
    )
}

export default Login
