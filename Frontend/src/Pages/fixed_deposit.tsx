import React from 'react';
import { API_URL } from '../config';

type DealPeriod = '1 Month' | '3 Month' | '6 Month' | '12 Month' | '24 Month';
type InterestMethod = 'Maturity' | 'Monthly';

const FixedDeposit: React.FC = () => {
  const [sourceAccount, setSourceAccount] = React.useState('');
  const [sourceOfFund, setSourceOfFund] = React.useState('');
  const [interestMethod, setInterestMethod] = React.useState<InterestMethod>('Maturity');
  const [dealPeriod, setDealPeriod] = React.useState<DealPeriod>('3 Month');
  const [renewalMethod, setRenewalMethod] = React.useState('Capital & Interest');
  const [amount, setAmount] = React.useState('');
  const [calculatedInterest, setCalculatedInterest] = React.useState(0);
  const [message, setMessage] = React.useState('');

  // ✅ rateTable with typed keys
  const rateTable: Record<DealPeriod, { Maturity: number; Monthly: number }> = {
    '1 Month': { Maturity: 0.07, Monthly: 0.068 },
    '3 Month': { Maturity: 0.08, Monthly: 0.077 },
    '6 Month': { Maturity: 0.09, Monthly: 0.085 },
    '12 Month': { Maturity: 0.105, Monthly: 0.098 },
    '24 Month': { Maturity: 0.115, Monthly: 0.105 },
  };

  // ✅ Interest calculation (no error now)
  React.useEffect(() => {
    if (!amount) {
      setCalculatedInterest(0);
      return;
    }
    const principal = parseFloat(amount);
    const months = parseInt(dealPeriod.split(' ')[0]);
    const rate = rateTable[dealPeriod][interestMethod];
    const interest = principal * rate * (months / 12);
    setCalculatedInterest(parseFloat(interest.toFixed(2)));
  }, [amount, dealPeriod, interestMethod]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');

    if (!sourceAccount || !amount || !sourceOfFund) {
      setMessage('Please fill all required fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/fixed-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceAccount,
          sourceOfFund,
          interestMethod,
          dealPeriod,
          renewalMethod,
          amount,
        }),
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

  const handleReset = () => {
    setSourceAccount('');
    setSourceOfFund('');
    setInterestMethod('Maturity');
    setDealPeriod('3 Month');
    setRenewalMethod('Capital & Interest');
    setAmount('');
    setCalculatedInterest(0);
    setMessage('');
  };

  return (
    <div className="fd-page">
      {/* Header */}
      <header className="fd-header">
        <div>
          <h1><p>Create Fixed Deposit Account</p></h1>
        </div>
      </header>

      {/* FD Cards Section */}
      <div className="fd-cards">
        {(Object.keys(rateTable) as DealPeriod[]).map((period, index) => (
          <div key={index} className="fd-card">
            <h2>{period}</h2>
            <div className="interest-options">
              <div className="interest-box">
                <h4>Maturity Interest</h4>
                <p>{(rateTable[period].Maturity * 100).toFixed(1)}%</p>
              </div>
              <div className="interest-box">
                <h4>Monthly Interest</h4>
                <p>{(rateTable[period].Monthly * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="terms">Terms & Conditions apply</div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="fd-info">
        This permits to create new Fixed Deposit accounts.
      </div>

      {/* Form */}
      <div className="fd-form-container">
        <form className="fd-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Source Account Number *</label>
              <select value={sourceAccount} onChange={e => setSourceAccount(e.target.value)} required>
                <option value="">Select account</option>
                <option value="002000768129001">002000768129001 - Current Account LKR</option>
                <option value="002000768129002">002000768129002 - Savings Account LKR</option>
              </select>
              <span className="balance">Available LKR 33,723.00</span>
            </div>

            <div className="form-group">
              <label>Source of Fund *</label>
              <select value={sourceOfFund} onChange={e => setSourceOfFund(e.target.value)} required>
                <option value="">Select source</option>
                <option value="Salary">Salary</option>
                <option value="Business">Business</option>
                <option value="Savings">Savings</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Interest Settlement Method</label>
              <select value={interestMethod} onChange={e => setInterestMethod(e.target.value)}>
                <option value="Maturity">Maturity</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div className="form-group">
              <label>Deal Period</label>
              <select value={dealPeriod} onChange={e => setDealPeriod(e.target.value)}>
                {Object.keys(rateTable).map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Renewal Method *</label>
              <select value={renewalMethod} onChange={e => setRenewalMethod(e.target.value)} required>
                <option value="Capital & Interest">Capital & Interest</option>
                <option value="Capital Only">Capital Only</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Amount *</label>
              <div className="amount-input">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                <span>LKR</span>
              </div>
              {amount && (
                <div className="calculated-interest">
                  Calculated Interest: <strong>LKR {calculatedInterest}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-btn">Proceed</button>
            <button type="button" className="secondary-btn" onClick={handleReset}>Reset</button>
          </div>

          {message && <div className="form-message">{message}</div>}
        </form>
      </div>

      <style>{`
        .fd-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          font-family: Arial, sans-serif;
          padding: 0 20px;
          background-color: #d1d7ddff;
        }
        .fd-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
        }
        .fd-header h1 { margin: 0; font-size: 1.8rem; }

        /* Cards */
        .fd-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 50px 0;
        }
        .fd-card {
          background-color: #f8f9fa;
          border: 4px solid #86b4e5ff;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transition: 0.3s;
        }
        .fd-card:hover { transform: translateY(-5px); }
        .fd-card h2 { font-size: 1.3rem; color: #2c3e50; margin-bottom: 10px; }
        .interest-options { display: flex; justify-content: space-around; margin: 15px 0; }
        .interest-box {
          background: #fff; border-radius: 8px; border: 1px solid #ddd;
          padding: 10px; width: 45%; font-size: 0.9rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .interest-box h4 { margin: 0 0 5px 0; color: #007bff; }
        .terms { margin-top: 10px; font-size: 0.85rem; color: #555; }

        /* Info */
        .fd-info {
          background-color: #f8f9fa;
          border-left: 4px solid #007bff;
          padding: 10px 15px;
          margin: auto 0 20px 0;
          font-size: 0.95rem;
        }

        /* Form */
        .fd-form-container {
          background-color: #fff;
          padding: 25px;
          border-top: 2px solid #ddd;
          border-radius: 10px;
          box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
        }
        .fd-form { display: flex; flex-direction: column; gap: 15px; margin: auto; }
        .form-row { display: flex; gap: 20px; }
        .form-group { flex: 1; display: flex; flex-direction: column; }
        .form-group.full-width { flex: 1 1 100%; }
        label { margin-bottom: 5px; font-weight: bold; }
        select, input { padding: 8px; font-size: 1rem; border-radius: 4px; border: 1px solid #ccc; }
        .balance { font-size: 0.9rem; color: green; margin-top: 3px; }
        .amount-input { display: flex; }
        .amount-input span {
          display: inline-flex; align-items: center; padding: 0 10px;
          background: #eee; border-left: 1px solid #ccc; border-radius: 0 4px 4px 0;
        }
        .amount-input input { flex: 1; border-radius: 4px 0 0 4px; border-right: none; }
        .calculated-interest { margin-top: 5px; color: #2c3e50; font-weight: bold; }
        .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px; }
        .primary-btn { background-color: #e74c3c; color: #fff; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; }
        .secondary-btn { background-color: #ccc; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; }
        .form-message { margin-top: 10px; font-weight: bold; }
        @media (max-width: 600px) { .form-row { flex-direction: column; } }
      `}</style>
    </div>
  );
};

export default FixedDeposit;
