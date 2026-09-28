import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { business } from '@shared/business.js';
import { Dashboard } from '../admin/Dashboard.jsx';
import { Login } from '../admin/Login.jsx';
import { Icon } from '../components/Icon.jsx';
import { SimpleHeader } from '../components/SimpleHeader.jsx';
import { api } from '../lib/api.js';

export default function Admin() {
  const [session, setSession] = useState({ status: 'loading' });
  const [refreshSignal, setRefreshSignal] = useState(0);

  const check = useCallback(async () => {
    try {
      const s = await api('/admin/session');
      setSession({ status: 'ready', ...s });
    } catch (err) {
      setSession({ status: 'error', error: err.message });
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const logout = async () => {
    await api('/admin/logout', { method: 'POST' }).catch(() => {});
    setSession((s) => ({ ...s, authenticated: false }));
  };

  const onUnauthorized = useCallback(() => setSession((s) => ({ ...s, authenticated: false })), []);

  const authed = session.status === 'ready' && session.authenticated;

  return (
    <div className="page page--plain page--admin">
      <title>{`Dashboard · ${business.name}`}</title>
      <meta name="robots" content="noindex" />
      <SimpleHeader>
        {authed ? (
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRefreshSignal((n) => n + 1)}>
              <Icon name="refresh" size={16} /> Refresh
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
              <Icon name="logout" size={16} /> Log out
            </button>
          </>
        ) : (
          <Link className="btn btn--ghost btn--sm" to="/">
            View website
          </Link>
        )}
      </SimpleHeader>
      <main className={`container page__main ${authed ? '' : 'container--narrow'}`}>
        {session.status === 'loading' && <p className="muted">Loading…</p>}
        {session.status === 'error' && (
          <div className="notice notice--error">
            <Icon name="alert" />
            <p>{session.error} Is the API server running?</p>
          </div>
        )}
        {session.status === 'ready' && !session.authenticated && (
          <Login configured={session.configured} onSuccess={check} />
        )}
        {authed && <Dashboard refreshSignal={refreshSignal} onUnauthorized={onUnauthorized} />}
      </main>
    </div>
  );
}
