import { api } from '../lib/axios.js';
import { buildMenuOrderPayload } from '../utils/menuOrderPayload.js';

const DEFAULT_API_BASE = 'https://zonabclub.com';
const PUBLIC_TABLE_TIMEOUT_MS = 20000;
const PUBLIC_TABLE_RETRY_DELAY_MS = 900;
const TABLE_LIVE_CLOSE_DELAY_MS = 1200;
const tableLiveStreams = new Map();

function getResolvedApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return DEFAULT_API_BASE;
}

function buildApiUrl(path, params = {}) {
  const url = new URL(path, getResolvedApiBaseUrl());

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || typeof value === 'undefined') {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function buildTableLiveStreamKey({ tableToken = '', tableKey = '' }) {
  return `${String(tableToken || '').trim()}::${String(tableKey || '').trim()}`;
}

function withSessionHeader(sessionToken) {
  const headers = {
    'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
    Pragma: 'no-cache',
  };

  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }

  return { headers };
}

function normalizeObject(data) {
  return data && typeof data === 'object' ? data : {};
}

function isRetriablePublicTableError(error) {
  const status = Number(error?.response?.status || error?.response?.data?.data?.status || 0);
  const code = String(error?.code || '').trim().toUpperCase();
  const message = String(error?.message || '').toLowerCase();

  if (code === 'ECONNABORTED' || message.includes('timeout')) {
    return true;
  }

  if (!error?.response) {
    return true;
  }

  return status >= 500;
}

function wait(delayMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function getPublicTableResource(path, params = {}, options = {}) {
  const retries = Math.max(0, Number(options?.retries ?? 1) || 0);
  const timeout = Math.max(8000, Number(options?.timeout ?? PUBLIC_TABLE_TIMEOUT_MS) || PUBLIC_TABLE_TIMEOUT_MS);
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { data } = await api.get(path, {
        ...withSessionHeader(''),
        params: {
          ...params,
          _ts: Date.now(),
        },
        timeout,
      });

      return normalizeObject(data);
    } catch (error) {
      lastError = error;

      if (attempt >= retries || !isRetriablePublicTableError(error)) {
        throw error;
      }

      await wait(PUBLIC_TABLE_RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
}

export async function fetchTableSession({ key }) {
  return getPublicTableResource('/wp-json/tavox/v1/table/session', { key });
}

export async function fetchTableContext({ tableToken }) {
  return getPublicTableResource('/wp-json/tavox/v1/table/context', {
    table_token: tableToken,
  });
}

export function getTableLiveStreamUrl({ tableToken = '', tableKey = '' }) {
  return buildApiUrl('/wp-json/tavox/v1/table/live', {
    table_token: tableToken,
    key: tableKey,
    _ts: Date.now(),
  });
}

export function subscribeToTableLive(
  { tableToken = '', tableKey = '' },
  { onSync, onError } = {}
) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const normalizedTableToken = String(tableToken || '').trim();
  const normalizedTableKey = String(tableKey || '').trim();
  const streamKey = buildTableLiveStreamKey({
    tableToken: normalizedTableToken,
    tableKey: normalizedTableKey,
  });

  if (!normalizedTableToken && !normalizedTableKey) {
    return () => {};
  }

  let entry = tableLiveStreams.get(streamKey);

  if (!entry) {
    const source = new EventSource(
      getTableLiveStreamUrl({
        tableToken: normalizedTableToken,
        tableKey: normalizedTableKey,
      })
    );

    entry = {
      source,
      listeners: new Set(),
      closeTimerId: 0,
    };

    tableLiveStreams.set(streamKey, entry);
  }

  if (entry.closeTimerId) {
    window.clearTimeout(entry.closeTimerId);
    entry.closeTimerId = 0;
  }

  const listener = {
    onSync: typeof onSync === 'function' ? onSync : null,
    onError: typeof onError === 'function' ? onError : null,
  };

  entry.listeners.add(listener);

  const handleSync = (event) => {
    entry.listeners.forEach((currentListener) => {
      currentListener.onSync?.(event);
    });
  };

  const handleError = (event) => {
    entry.listeners.forEach((currentListener) => {
      currentListener.onError?.(event);
    });
  };

  if (!entry.handleSync) {
    entry.handleSync = handleSync;
    entry.handleError = handleError;
    entry.source.addEventListener('sync', entry.handleSync);
    entry.source.addEventListener('error', entry.handleError);
  }

  return () => {
    const currentEntry = tableLiveStreams.get(streamKey);
    if (!currentEntry) {
      return;
    }

    currentEntry.listeners.delete(listener);

    if (currentEntry.listeners.size > 0 || currentEntry.closeTimerId) {
      return;
    }

    currentEntry.closeTimerId = window.setTimeout(() => {
      const latestEntry = tableLiveStreams.get(streamKey);
      if (!latestEntry || latestEntry.listeners.size > 0) {
        return;
      }

      latestEntry.source.removeEventListener('sync', latestEntry.handleSync);
      latestEntry.source.removeEventListener('error', latestEntry.handleError);
      latestEntry.source.close();
      tableLiveStreams.delete(streamKey);
    }, TABLE_LIVE_CLOSE_DELAY_MS);
  };
}

export async function fetchTableMessages({ tableToken = '', tableKey = '' }) {
  const { data } = await api.get('/wp-json/tavox/v1/table/messages', {
    ...withSessionHeader(''),
    params: {
      table_token: tableToken,
      key: tableKey,
      _ts: Date.now(),
    },
  });

  return normalizeObject(data);
}

export async function postTableMessage({
  tableToken = '',
  tableKey = '',
  messageText = '',
  messageType = 'free_text',
}) {
  const { data } = await api.post('/wp-json/tavox/v1/table/messages', {
    table_token: tableToken,
    key: tableKey,
    message_text: messageText,
    message_type: messageType,
  });

  return normalizeObject(data);
}

export function getWaiterLiveStreamUrl({ sessionToken, scope = 'service' }) {
  return buildApiUrl('/wp-json/tavox/v1/waiter/live', {
    session_token: sessionToken,
    scope,
    _ts: Date.now(),
  });
}

export async function submitTableRequest({
  tableToken,
  items,
  note = '',
  brandScope = 'zona_b',
  clientLabel = '',
  requestKey = '',
  fulfillmentMode = 'dine_in',
}) {
  const payload = buildMenuOrderPayload({
    items,
    note,
    brandScope,
    clientLabel,
    requestKey,
    fulfillmentMode,
  });

  const { data } = await api.post('/wp-json/tavox/v1/table/request', {
    ...payload,
    table_token: tableToken,
  });

  return normalizeObject(data);
}

export async function waiterLogin({ login, pin, deviceLabel = '' }) {
  const { data } = await api.post('/wp-json/tavox/v1/waiter/login', {
    login,
    pin,
    device_label: deviceLabel,
  });

  return normalizeObject(data);
}

export async function waiterHeartbeat({ sessionToken }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/heartbeat',
    { session_token: sessionToken },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function waiterLogout({ sessionToken }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/logout',
    { session_token: sessionToken },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function fetchWaiterQueue({ sessionToken }) {
  const { data } = await api.get('/wp-json/tavox/v1/waiter/queue', {
    ...withSessionHeader(sessionToken),
    params: {
      _ts: Date.now(),
    },
  });
  return normalizeObject(data);
}

export async function fetchWaiterRequestHistory({ sessionToken, limit = 24 }) {
  const { data } = await api.get('/wp-json/tavox/v1/waiter/request-history', {
    ...withSessionHeader(sessionToken),
    params: {
      limit,
      _ts: Date.now(),
    },
  });

  return normalizeObject(data);
}

export async function fetchWaiterTables({ sessionToken }) {
  const { data } = await api.get('/wp-json/tavox/v1/waiter/tables', {
    ...withSessionHeader(sessionToken),
    params: {
      _ts: Date.now(),
    },
  });
  return normalizeObject(data);
}

export async function fetchWaiterProductionBoard({ sessionToken, station }) {
  const { data } = await api.get('/wp-json/tavox/v1/waiter/production', {
    ...withSessionHeader(sessionToken),
    params: {
      station,
      _ts: Date.now(),
    },
  });

  return normalizeObject(data);
}

export async function fetchWaiterPushConfig({ sessionToken }) {
  const { data } = await api.get('/wp-json/tavox/v1/waiter/push/config', {
    ...withSessionHeader(sessionToken),
    params: {
      _ts: Date.now(),
    },
  });
  return normalizeObject(data);
}

export async function subscribeWaiterPush({ sessionToken, subscription, deviceLabel = '', scope = 'service' }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/push/subscribe',
    {
      subscription,
      device_label: deviceLabel,
      scope,
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function unsubscribeWaiterPush({ sessionToken }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/push/unsubscribe',
    {},
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function testWaiterPush({ sessionToken }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/push/test',
    {},
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function scheduleWaiterPushTest({ sessionToken, delaySeconds = 10 }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/push/test-delayed',
    {
      delay_seconds: delaySeconds,
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function updateWaiterPushContext({ sessionToken, scope }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/push/context',
    {
      scope,
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function fetchWaiterNotifications({ sessionToken, limit = 40 }) {
  const { data } = await api.get('/wp-json/tavox/v1/waiter/notifications', {
    ...withSessionHeader(sessionToken),
    params: {
      limit,
      _ts: Date.now(),
    },
  });

  return normalizeObject(data);
}

export async function fetchWaiterRequestDetail({ sessionToken, requestId }) {
  const { data } = await api.get('/wp-json/tavox/v1/waiter/request', {
    ...withSessionHeader(sessionToken),
    params: {
      request_id: requestId,
      _ts: Date.now(),
    },
  });

  return normalizeObject(data);
}

export async function replyTableMessage({ sessionToken, tableToken, messageText }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/table-message/reply',
    {
      table_token: tableToken,
      message_text: messageText,
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function readTableMessages({ sessionToken, tableToken }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/table-message/read',
    {
      table_token: tableToken,
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function resolveTableMessages({ sessionToken, tableToken, messageId = 0, notificationId = 0 }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/table-message/resolve',
    {
      table_token: tableToken,
      message_id: Number(messageId || 0) || 0,
      notification_id: Number(notificationId || 0) || 0,
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function markWaiterNotificationsRead({ sessionToken, ids = [] }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/notifications/read',
    {
      ids: Array.isArray(ids) ? ids : [],
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function claimWaiterRequest({ sessionToken, requestId }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/request/claim',
    { request_id: requestId },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function acceptWaiterRequest({ sessionToken, requestId }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/request/accept',
    { request_id: requestId },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function releaseWaiterRequest({ sessionToken, requestId }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/request/release',
    { request_id: requestId },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function submitWaiterDirectOrder({
  sessionToken,
  tableToken,
  items,
  note = '',
  brandScope = 'zona_b',
  clientLabel = '',
  requestKey = '',
  fulfillmentMode = 'dine_in',
}) {
  const payload = buildMenuOrderPayload({
    items,
    note,
    brandScope,
    clientLabel,
    requestKey,
    fulfillmentMode,
  });

  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/direct-order',
    {
      ...payload,
      table_token: tableToken,
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function markWaiterTableDelivered({ sessionToken, tableToken }) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/table/deliver-ready',
    { table_token: tableToken },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function markWaiterStationReady({
  sessionToken,
  tableToken,
  station,
  mode = 'all_pending',
  lineIds = [],
}) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/production/ready',
    {
      table_token: tableToken,
      station,
      mode,
      line_ids: Array.isArray(lineIds) ? lineIds : [],
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function markWaiterStationPreparing({
  sessionToken,
  tableToken,
  station,
  mode = 'all_pending',
  lineIds = [],
}) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/production/preparing',
    {
      table_token: tableToken,
      station,
      mode,
      line_ids: Array.isArray(lineIds) ? lineIds : [],
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}

export async function updateWaiterTableFulfillment({
  sessionToken,
  tableToken,
  fulfillmentMode,
  mode = 'all',
  lineIds = [],
}) {
  const { data } = await api.post(
    '/wp-json/tavox/v1/waiter/table/fulfillment',
    {
      table_token: tableToken,
      fulfillment_mode: fulfillmentMode,
      mode,
      line_ids: Array.isArray(lineIds) ? lineIds : [],
    },
    withSessionHeader(sessionToken)
  );

  return normalizeObject(data);
}
