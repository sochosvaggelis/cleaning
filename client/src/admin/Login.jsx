import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { api } from '../lib/api.js';

export function Login({ configured, onSuccess }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/admin/login', { method: 'POST', body: { password } });
      onSuccess();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="panel login">
      <span className="login__icon">
        <Icon name="lock" size={26} />
      </span>
      <h1 className="page__title">Team dashboard</h1>
      {!configured ? (
        <p>
          The dashboard is switched off. Add <code>ADMIN_PASSWORD=…</code> to the <code>.env</code> file in the project
          folder and restart the server.
        </p>
      ) : (
        <form onSubmit={submit} className="login__form">
          <div className={`field ${error ? 'field--error' : ''}`}>
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <span className="field__error">{error}</span>}
          </div>
          <button type="submit" className="btn btn--primary btn--block" disabled={busy || !password}>
            {busy ? 'Checking…' : 'Log in'}
          </button>
        </form>
      )}
    </div>
  );
}
