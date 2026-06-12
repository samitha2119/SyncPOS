import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import logo from '../assets/logo.png';

export default function Login() {
  const [isPinMode, setIsPinMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, pinLogin, authError } = useStore();

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pin || pin.length !== 4) return;
    setLoading(true);
    try {
      await pinLogin(pin);
    } catch (err) {
      console.error(err);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePinNumClick = (num) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const clearPin = () => setPin('');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src={logo} alt="SyncPOS Logo" style={styles.logo} />
          <h1 style={styles.title}>SyncPOS</h1>
          <p style={styles.subtitle}>Smart Real-Time Point of Sale</p>
        </div>

        {authError && <div style={styles.error}>{authError}</div>}

        <div style={styles.tabContainer}>
          <button
            style={{ ...styles.tabButton, ...(isPinMode ? {} : styles.activeTab) }}
            onClick={() => { setIsPinMode(false); clearPin(); }}
          >
            Email Login
          </button>
          <button
            style={{ ...styles.tabButton, ...(isPinMode ? styles.activeTab : {}) }}
            onClick={() => setIsPinMode(true)}
          >
            Quick PIN Code
          </button>
        </div>

        {!isPinMode ? (
          <form onSubmit={handleStandardSubmit} style={styles.form}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="cashier@syncpos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} style={styles.form}>
            <div style={styles.pinDisplayContainer}>
              <div style={styles.dotsContainer}>
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.dot,
                      backgroundColor: pin.length > idx ? '#14b8a6' : '#374151',
                    }}
                  />
                ))}
              </div>
              {pin.length > 0 && (
                <button type="button" onClick={clearPin} style={styles.clearPinBtn}>
                  Clear
                </button>
              )}
            </div>

            <div style={styles.numpad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinNumClick(num)}
                  style={styles.numpadBtn}
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handlePinNumClick(0)}
                style={styles.numpadBtn}
              >
                0
              </button>
              <div />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={loading || pin.length !== 4}
            >
              {loading ? 'Verifying PIN...' : 'Submit PIN'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#090d16',
    padding: '20px',
  },
  card: {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
  },
  logo: {
    width: '90px',
    height: '90px',
    objectFit: 'contain',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '0.85rem',
    marginTop: '4px',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginBottom: '20px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid #374151',
    marginBottom: '24px',
  },
  tabButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#14b8a6',
    borderBottom: '2px solid #14b8a6',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  submitBtn: {
    marginTop: '12px',
    width: '100%',
  },
  pinDisplayContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '12px',
  },
  dotsContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  dot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    transition: 'all 0.15s',
  },
  clearPinBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  numpad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px',
    justifyItems: 'center',
  },
  numpadBtn: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    color: '#f3f4f6',
    fontSize: '1.25rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
};
