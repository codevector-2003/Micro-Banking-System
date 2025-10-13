import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPiggyBank } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../config';

const FixedDeposit = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = React.useState('');
  const [rate, setRate] = React.useState('');
  const [tenure, setTenure] = React.useState('');
  const [maturityAmount, setMaturityAmount] = React.useState('');
  const [message, setMessage] = React.useState('');

 const calculateMaturity = (p: number, r: number, t: number): string => {
  return (p * Math.pow(1 + r / 100, t)).toFixed(2);
};


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');

    if (!amount || !rate || !tenure) {
      setMessage('Please fill all fields.');
      return;
    }

    const maturity = calculateMaturity(parseFloat(amount), parseFloat(rate), parseFloat(tenure));
    setMaturityAmount(maturity);

    // Example API call if you want to store FD details
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/fixed-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, rate, tenure, maturityAmount: maturity }),
      });

      if (response.ok) {
        setMessage('Fixed Deposit successfully created!');
      } else {
        setMessage('Error creating Fixed Deposit.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <>
      <div className='fd-container'>
        <FontAwesomeIcon icon={faPiggyBank} size="4x" color="#ffffff" style={{ marginBottom: '5px' }} />
        <h1>Fixed Deposit</h1>

        <form onSubmit={handleSubmit} className='fd-form'>
          <div>
            <label>Deposit Amount (LKR):</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Interest Rate (% per year):</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Tenure (Years):</label>
            <input
              type="number"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              required
            />
          </div>

          <button type="submit">Calculate & Create</button>

          {maturityAmount && (
            <div className="result-box">
              <p><strong>Maturity Amount:</strong> LKR {maturityAmount}</p>
            </div>
          )}

          {message && (
            <div className={message.includes('success') ? 'success-message' : 'error-message'}>
              {message}
            </div>
          )}
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

        .fd-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          box-sizing: border-box;
        }

        .fd-container h1 {
          color: #fff;
          margin-bottom: 10px;
          font-size: 2rem;
          font-weight: 600;
          text-align: center;
        }

        .fd-form {
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
          background-color: rgba(255, 255, 255, 0.8);
        }

        .fd-form label {
          color: #333;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .fd-form input {
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f8f9fa;
          outline: none;
        }

        .fd-form input:focus {
          border-color: #667eea;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }

        .fd-form button {
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .fd-form button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        .result-box {
          background: rgba(255, 255, 255, 0.8);
          border-radius: 10px;
          padding: 10px;
          text-align: center;
          font-weight: bold;
          color: #333;
        }

        .success-message {
          color: #27ae60;
          background: rgba(39, 174, 96, 0.1);
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid #27ae60;
          font-size: 0.9rem;
          margin-top: 10px;
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
          .fd-form {
            padding: 30px 20px;
            margin: 0 20px;
          }
        }
        `}
      </style>
    </>
  );
};

export default FixedDeposit;
