import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWaiterSession } from './WaiterSessionContext.jsx';
import { WaiterRealtimeContext } from './waiterRealtimeContextValue.js';
import { createWaiterRealtimeClient } from '../services/waiterRealtime.js';

export function WaiterRealtimeProvider({ children }) {
  const { session } = useWaiterSession();
  const clientRef = useRef(null);
  const [status, setStatus] = useState('disabled');

  if (!clientRef.current) {
    clientRef.current = createWaiterRealtimeClient({
      onStatusChange: setStatus,
    });
  }

  useEffect(() => {
    clientRef.current.setSession(session || null);
  }, [session]);

  useEffect(() => {
    const client = clientRef.current;

    return () => {
      client.destroy();
    };
  }, []);

  const subscribe = useCallback(
    (options) => clientRef.current?.subscribe(options) || (() => {}),
    []
  );

  const value = useMemo(
    () => ({
      status,
      enabled: Boolean(session?.realtime?.enabled && session?.realtime?.socket_url),
      subscribe,
    }),
    [session?.realtime?.enabled, session?.realtime?.socket_url, status, subscribe]
  );

  return <WaiterRealtimeContext.Provider value={value}>{children}</WaiterRealtimeContext.Provider>;
}
