import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchTableMessages, subscribeToTableLive } from '../services/tableService.js';

function getPublicTableTerminalErrorStatus(error) {
  const status = Number(error?.response?.status || error?.response?.data?.data?.status || 0);
  return [401, 403, 410].includes(status) ? status : 0;
}

function sanitizeTableMessageError(value, status = 0) {
  if (status === 410) {
    return 'Este acceso de mesa ya venció. Escanea de nuevo el código de la mesa.';
  }

  if (status === 401 || status === 403) {
    return 'Este acceso de mesa ya no es válido. Escanea de nuevo el código de la mesa.';
  }

  const text = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text || 'No se pudo cargar la conversación de la mesa.';
}

export default function useTableMessages({
  tableToken = '',
  tableKey = '',
  enabled = true,
  refreshIntervalMs = 0,
  refreshIntervalMsVisible = 0,
  refreshIntervalMsHidden = 0,
  liveEnabled = true,
} = {}) {
  const [data, setData] = useState({ items: [], pending_count: 0, active_count: 0 });
  const [initialLoading, setInitialLoading] = useState(Boolean(enabled));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(0);
  const [terminalErrorStatus, setTerminalErrorStatus] = useState(0);
  const dataRef = useRef(data);
  const dataSignatureRef = useRef('');
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const sourceKey = useMemo(
    () => String(tableToken || tableKey || '').trim(),
    [tableKey, tableToken]
  );

  useEffect(() => {
    dataSignatureRef.current = '';
    hasLoadedOnceRef.current = false;
    dataRef.current = { items: [], pending_count: 0, active_count: 0 };
    setData({ items: [], pending_count: 0, active_count: 0 });
    setInitialLoading(Boolean(enabled && sourceKey));
    setRefreshing(false);
    setError('');
    setLastUpdatedAt(0);
    setTerminalErrorStatus(0);
  }, [enabled, sourceKey]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!enabled || !sourceKey || terminalErrorStatus) {
      setInitialLoading(false);
      setRefreshing(false);
      return null;
    }

    const hasVisibleData = hasLoadedOnceRef.current;

    try {
      if (hasVisibleData) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      if (!hasVisibleData && !silent) {
        setError('');
      }

      const nextData = await fetchTableMessages({ tableToken, tableKey });
      const normalizedData = {
        items: Array.isArray(nextData?.items) ? nextData.items : [],
        pending_count: Number(nextData?.pending_count ?? 0) || 0,
        active_count: Number(nextData?.active_count ?? 0) || 0,
      };
      const nextSignature = JSON.stringify(normalizedData);

      if (dataSignatureRef.current !== nextSignature) {
        dataSignatureRef.current = nextSignature;
        setData(normalizedData);
      }

      hasLoadedOnceRef.current = true;
      setLastUpdatedAt(Date.now());
      setError('');
      setInitialLoading(false);
      setRefreshing(false);
      return nextData;
    } catch (err) {
      const terminalStatus = getPublicTableTerminalErrorStatus(err);

      if (!hasVisibleData || terminalStatus) {
        setError(
          sanitizeTableMessageError(
            err?.response?.data?.message || err?.message || err?.response?.data,
            terminalStatus
          )
        );
      }

      if (terminalStatus) {
        setTerminalErrorStatus(terminalStatus);
        setData({ items: [], pending_count: 0, active_count: 0 });
      }

      setInitialLoading(false);
      setRefreshing(false);
      return null;
    }
  }, [enabled, sourceKey, tableKey, tableToken, terminalErrorStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const effectiveVisibleInterval = Number(refreshIntervalMsVisible || refreshIntervalMs || 0) || 0;
  const effectiveHiddenInterval =
    Number(refreshIntervalMsHidden || refreshIntervalMsVisible || refreshIntervalMs || 0) || 0;

  useEffect(() => {
    if (
      (!effectiveVisibleInterval && !effectiveHiddenInterval) ||
      !enabled ||
      !sourceKey ||
      terminalErrorStatus
    ) {
      return undefined;
    }

    let timerId = 0;

    const getCurrentInterval = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        return effectiveVisibleInterval;
      }

      return effectiveHiddenInterval;
    };

    const schedule = () => {
      const nextDelay = getCurrentInterval();
      if (!nextDelay) {
        return;
      }

      timerId = window.setTimeout(async () => {
        await load({ silent: true });
        schedule();
      }, nextDelay);
    };

    const handleVisibilityChange = () => {
      window.clearTimeout(timerId);

      if (document.visibilityState === 'visible') {
        load({ silent: true });
      }

      schedule();
    };

    schedule();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [effectiveHiddenInterval, effectiveVisibleInterval, enabled, load, sourceKey, terminalErrorStatus]);

  useEffect(() => {
    if (
      !liveEnabled ||
      !enabled ||
      !sourceKey ||
      terminalErrorStatus ||
      typeof window === 'undefined' ||
      typeof EventSource === 'undefined'
    ) {
      return undefined;
    }

    return subscribeToTableLive(
      {
        tableToken,
        tableKey,
      },
      {
        onSync: () => {
          load({ silent: true });
        },
      }
    );
  }, [enabled, liveEnabled, load, sourceKey, tableKey, tableToken, terminalErrorStatus]);

  return {
    messages: data.items,
    pendingCount: data.pending_count,
    activeCount: data.active_count,
    loading: initialLoading,
    initialLoading,
    refreshing,
    error,
    lastUpdatedAt,
    refresh: () =>
      load({
        silent:
          hasLoadedOnceRef.current,
      }),
  };
}
