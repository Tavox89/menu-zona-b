import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchTableContext,
  fetchTableSession,
  subscribeToTableLive,
} from '../services/tableService.js';

function getPublicTableTerminalErrorStatus(error) {
  const status = Number(error?.response?.status || error?.response?.data?.data?.status || 0);
  return [401, 403, 410].includes(status) ? status : 0;
}

function sanitizeTableErrorMessage(value, status = 0) {
  if (status === 410) {
    return 'Este acceso de mesa ya venció. Escanea de nuevo el código de la mesa.';
  }

  if (status === 401 || status === 403) {
    return 'Este acceso de mesa ya no es válido. Escanea de nuevo el código de la mesa.';
  }

  const raw = String(value || '').trim();
  const normalized = raw.toLowerCase();

  if (normalized.includes('timeout')) {
    return 'La mesa tardó más de lo normal en responder. Vuelve a intentar en unos segundos.';
  }

  const text = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text || 'No se pudo cargar la mesa en este momento.';
}

export default function useTableContext({
  tableToken = '',
  tableKey = '',
  enabled = true,
  refreshIntervalMs = 0,
  refreshIntervalMsVisible = 0,
  refreshIntervalMsHidden = 0,
  liveEnabled = true,
} = {}) {
  const [context, setContext] = useState(null);
  const [resolvedTableToken, setResolvedTableToken] = useState(tableToken || '');
  const [initialLoading, setInitialLoading] = useState(Boolean(enabled));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(0);
  const [terminalErrorStatus, setTerminalErrorStatus] = useState(0);
  const contextRef = useRef(null);
  const contextSignatureRef = useRef('');
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const sourceKey = useMemo(
    () => String(tableToken || tableKey || '').trim(),
    [tableToken, tableKey]
  );

  useEffect(() => {
    contextSignatureRef.current = '';
    hasLoadedOnceRef.current = false;
    contextRef.current = null;
    setContext(null);
    setResolvedTableToken(String(tableToken || '').trim());
    setInitialLoading(Boolean(enabled && sourceKey));
    setRefreshing(false);
    setError('');
    setLastUpdatedAt(0);
    setTerminalErrorStatus(0);
  }, [enabled, sourceKey, tableToken]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!enabled || !sourceKey || terminalErrorStatus) {
      setInitialLoading(false);
      setRefreshing(false);
      return null;
    }

    const hasVisibleData = hasLoadedOnceRef.current;

    if (hasVisibleData) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }

    if (!hasVisibleData && !silent) {
      setError('');
    }

    try {
      const nextContext = tableToken
        ? await fetchTableContext({ tableToken })
        : await fetchTableSession({ key: tableKey });
      const nextToken = String(nextContext?.table_token || tableToken || '').trim();
      const nextSignature = JSON.stringify({
        tableToken: nextToken,
        context: nextContext,
      });

      if (contextSignatureRef.current !== nextSignature) {
        contextSignatureRef.current = nextSignature;
        setContext(nextContext);
      }

      setResolvedTableToken(nextToken);
      hasLoadedOnceRef.current = true;
      setLastUpdatedAt(Date.now());
      setError('');
      setInitialLoading(false);
      setRefreshing(false);
      return nextContext;
    } catch (err) {
      const terminalStatus = getPublicTableTerminalErrorStatus(err);
      const message = sanitizeTableErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        err?.response?.data ||
        'No se pudo cargar la mesa en este momento.',
        terminalStatus
      );

      if (!hasVisibleData || terminalStatus) {
        setError(message);
      }

      if (terminalStatus) {
        setTerminalErrorStatus(terminalStatus);
        setContext(null);
        setResolvedTableToken('');
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

    const unsubscribe = subscribeToTableLive(
      {
        tableToken: resolvedTableToken || tableToken,
        tableKey: resolvedTableToken || tableToken ? '' : tableKey,
      },
      {
        onSync: () => {
          load({ silent: true });
        },
      }
    );

    return unsubscribe;
  }, [enabled, liveEnabled, load, resolvedTableToken, sourceKey, tableKey, tableToken, terminalErrorStatus]);

  return {
    context,
    tableToken: resolvedTableToken,
    loading: initialLoading,
    initialLoading,
    refreshing,
    error,
    lastUpdatedAt,
    refresh: () => load({ silent: hasLoadedOnceRef.current }),
  };
}
