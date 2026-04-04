import { useEffect, useMemo, useRef } from 'react';
import { useWaiterSession } from '../context/WaiterSessionContext.jsx';
import { useWaiterRealtime } from '../context/useWaiterRealtime.js';
import { getWaiterRealtimeUserChannel } from '../services/waiterRealtime.js';

export default function useWaiterLiveStream({
  sessionToken = '',
  scope = 'service',
  enabled = true,
  onSync = null,
}) {
  const { session } = useWaiterSession();
  const { subscribe } = useWaiterRealtime();
  const onSyncRef = useRef(onSync);
  const syncTimerRef = useRef(0);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  const channels = useMemo(() => {
    const scopedChannel = `scope:${String(scope || 'service').trim() || 'service'}`;
    const userChannel = getWaiterRealtimeUserChannel(session?.waiter?.id);
    const nextChannels = [scopedChannel];

    if (userChannel && (scope === 'service' || scope === 'queue')) {
      nextChannels.push(userChannel);
    }

    return [...new Set(nextChannels.filter(Boolean))];
  }, [scope, session?.waiter?.id]);

  useEffect(() => {
    if (!enabled || !sessionToken || !channels.length) {
      return undefined;
    }

    return subscribe({
      channels,
      onEvent: () => {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = window.setTimeout(() => {
          if (typeof onSyncRef.current === 'function') {
            onSyncRef.current();
          }
        }, 220);
      },
    });
  }, [channels, enabled, sessionToken, subscribe]);

  useEffect(
    () => () => {
      window.clearTimeout(syncTimerRef.current);
    },
    []
  );
}
