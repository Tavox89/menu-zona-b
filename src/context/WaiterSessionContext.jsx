import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { waiterHeartbeat, waiterLogin, waiterLogout } from '../services/tableService.js';
import { clearTeamPushSession, syncTeamPushSession } from '../utils/teamPush.js';

const STORAGE_KEY = 'tavox_waiter_session_v1';
const WaiterSessionContext = createContext(null);

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mergeSessionSnapshot(currentSession, nextSnapshot) {
  if (!currentSession) {
    return currentSession;
  }

  const nextWaiter = nextSnapshot?.waiter && typeof nextSnapshot.waiter === 'object'
    ? {
        ...currentSession.waiter,
        ...nextSnapshot.waiter,
      }
    : currentSession.waiter;
  const nextRealtime = nextSnapshot?.realtime && typeof nextSnapshot.realtime === 'object'
    ? {
        ...currentSession.realtime,
        ...nextSnapshot.realtime,
      }
    : currentSession.realtime;
  const nextSession = {
    ...currentSession,
    waiter: nextWaiter,
    realtime: nextRealtime,
    shared_tables_enabled:
      typeof nextSnapshot?.shared_tables_enabled === 'boolean'
        ? nextSnapshot.shared_tables_enabled
        : currentSession.shared_tables_enabled,
  };

  if (JSON.stringify(nextSession) === JSON.stringify(currentSession)) {
    return currentSession;
  }

  return nextSession;
}

export function WaiterSessionProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (session) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, [session]);

  useEffect(() => {
    if (!session?.session_token) {
      clearTeamPushSession();
      return;
    }

    syncTeamPushSession(session.session_token);
  }, [session?.session_token]);

  useEffect(() => {
    if (!session?.session_token) {
      return undefined;
    }

    let intervalId = 0;

    const heartbeat = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      try {
        const snapshot = await waiterHeartbeat({ sessionToken: session.session_token });
        setSession((currentSession) => mergeSessionSnapshot(currentSession, snapshot));
      } catch {
        setError('Tu acceso del equipo venció por inactividad. Vuelve a entrar.');
        setSession(null);
      }
    };

    heartbeat();
    intervalId = window.setInterval(heartbeat, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        heartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session?.session_token]);

  const login = useCallback(async ({ login: userLogin = '', pin, deviceLabel }) => {
    setSubmitting(true);
    setError('');

    try {
      const nextSession = await waiterLogin({
        login: userLogin,
        pin,
        deviceLabel,
      });
      setSession(nextSession);
      setSubmitting(false);
      return nextSession;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo abrir tu acceso en este momento.';

      setError(String(message));
      setSubmitting(false);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    const currentToken = String(session?.session_token || '').trim();

    clearTeamPushSession().catch(() => {});
    setSession(null);
    setError('');

    if (currentToken) {
      waiterLogout({ sessionToken: currentToken }).catch(() => {});
    }
  }, [session?.session_token]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const value = useMemo(
    () => ({
      session,
      login,
      logout,
      submitting,
      error,
      clearError,
      isAuthenticated: Boolean(session?.session_token),
    }),
    [session, login, logout, submitting, error, clearError]
  );

  return <WaiterSessionContext.Provider value={value}>{children}</WaiterSessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWaiterSession() {
  const context = useContext(WaiterSessionContext);

  if (!context) {
    throw new Error('useWaiterSession must be used within WaiterSessionProvider');
  }

  return context;
}
