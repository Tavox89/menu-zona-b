import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

const TEAM_PUSH_CACHE = 'tavox-team-push-state-v2';
const TEAM_PUSH_STATE_URL = '/__tavox-team-push-state__';
const DEFAULT_TEAM_PATH = '/equipo/pedidos';
const TEAM_PUSH_ICON = '/apple-touch-icon.png';
const OPERATIONAL_PUSH_TYPES = ['new_request', 'table_message_new', 'service_partial_ready', 'service_ready'];
const RECENT_TEAM_PUSH_DELIVERIES = new Map();
const TEAM_PUSH_DEDUPE_WINDOW_MS = 90000;
const LEGACY_PUBLIC_TABLE_ENDPOINTS = ['/tavox/v1/table/context', '/tavox/v1/table/messages'];
const PUBLIC_TABLE_TERMINAL_STATUSES = new Set([401, 403, 410]);
const RECENT_TERMINAL_PUBLIC_TABLES = new Map();
const TERMINAL_PUBLIC_TABLE_WINDOW_MS = 15 * 60 * 1000;
const LEGACY_TEAM_ENDPOINTS = [
  '/tavox/v1/waiter/queue',
  '/tavox/v1/waiter/tables',
  '/tavox/v1/waiter/production',
  '/tavox/v1/waiter/notifications',
  '/tavox/v1/waiter/request-history',
  '/tavox/v1/waiter/push/inbox',
];
const TEAM_SESSION_TERMINAL_STATUSES = new Set([401, 403]);
const RECENT_TERMINAL_TEAM_SESSIONS = new Map();
const TERMINAL_TEAM_SESSION_WINDOW_MS = 10 * 60 * 1000;
const REALTIME_ENDPOINTS = [
  '/wp-json/tavox/v1/table/session',
  '/wp-json/tavox/v1/table/context',
  '/wp-json/tavox/v1/table/live',
  '/wp-json/tavox/v1/table/messages',
  '/wp-json/tavox/v1/waiter/queue',
  '/wp-json/tavox/v1/waiter/tables',
  '/wp-json/tavox/v1/waiter/production',
  '/wp-json/tavox/v1/waiter/live',
  '/wp-json/tavox/v1/waiter/notifications',
  '/wp-json/tavox/v1/waiter/push/inbox',
];

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function getOperationalRequestDescriptor(request) {
  if (!(request instanceof Request) || request.method !== 'GET') {
    return null;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return null;
  }

  if (REALTIME_ENDPOINTS.some((endpoint) => url.pathname.startsWith(endpoint))) {
    return { type: 'realtime', url };
  }

  if (url.pathname !== '/index.php') {
    return null;
  }

  const restRoute = String(url.searchParams.get('rest_route') || '').trim();
  if (!LEGACY_PUBLIC_TABLE_ENDPOINTS.includes(restRoute)) {
    if (LEGACY_TEAM_ENDPOINTS.includes(restRoute)) {
      return {
        type: 'legacy-team-session',
        url,
        restRoute,
      };
    }

    return null;
  }

  return {
    type: 'legacy-public-table',
    url,
    restRoute,
    tableToken: String(url.searchParams.get('table_token') || '').trim(),
  };
}

function buildNoStoreRequest(request) {
  return new Request(request, {
    cache: 'no-store',
  });
}

function pruneRecentTerminalPublicTables() {
  const now = Date.now();

  Array.from(RECENT_TERMINAL_PUBLIC_TABLES.entries()).forEach(([token, entry]) => {
    if (!token || now - Number(entry?.timestamp || 0) > TERMINAL_PUBLIC_TABLE_WINDOW_MS) {
      RECENT_TERMINAL_PUBLIC_TABLES.delete(token);
    }
  });
}

function rememberTerminalPublicTable(tableToken, status = 410) {
  const normalizedToken = String(tableToken || '').trim();
  if (!normalizedToken) {
    return;
  }

  pruneRecentTerminalPublicTables();
  RECENT_TERMINAL_PUBLIC_TABLES.set(normalizedToken, {
    status: Number(status || 410) || 410,
    timestamp: Date.now(),
  });
}

function getRecentTerminalPublicTable(tableToken) {
  const normalizedToken = String(tableToken || '').trim();
  if (!normalizedToken) {
    return null;
  }

  pruneRecentTerminalPublicTables();
  return RECENT_TERMINAL_PUBLIC_TABLES.get(normalizedToken) || null;
}

function getPublicTableTerminalMessage(status = 410) {
  if (Number(status) === 410) {
    return 'Este acceso de mesa ya venció. Escanea de nuevo el código de la mesa.';
  }

  return 'Este acceso de mesa ya no es válido. Escanea de nuevo el código de la mesa.';
}

function buildTerminalPublicTableResponse(status = 410) {
  const normalizedStatus = PUBLIC_TABLE_TERMINAL_STATUSES.has(Number(status)) ? Number(status) : 410;
  const code = normalizedStatus === 410 ? 'expired_token' : 'invalid_table_access';

  return new Response(
    JSON.stringify({
      code,
      message: getPublicTableTerminalMessage(normalizedStatus),
      data: {
        status: normalizedStatus,
      },
    }),
    {
      status: normalizedStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

function pruneRecentTerminalTeamSessions() {
  const now = Date.now();

  Array.from(RECENT_TERMINAL_TEAM_SESSIONS.entries()).forEach(([sessionKey, entry]) => {
    if (!sessionKey || now - Number(entry?.timestamp || 0) > TERMINAL_TEAM_SESSION_WINDOW_MS) {
      RECENT_TERMINAL_TEAM_SESSIONS.delete(sessionKey);
    }
  });
}

function rememberTerminalTeamSession(sessionKey, status = 401) {
  const normalizedKey = String(sessionKey || '').trim();
  if (!normalizedKey) {
    return;
  }

  pruneRecentTerminalTeamSessions();
  RECENT_TERMINAL_TEAM_SESSIONS.set(normalizedKey, {
    status: Number(status || 401) || 401,
    timestamp: Date.now(),
  });
}

function getRecentTerminalTeamSession(sessionKey) {
  const normalizedKey = String(sessionKey || '').trim();
  if (!normalizedKey) {
    return null;
  }

  pruneRecentTerminalTeamSessions();
  return RECENT_TERMINAL_TEAM_SESSIONS.get(normalizedKey) || null;
}

function clearRecentTerminalTeamSession(sessionKey = '') {
  const normalizedKey = String(sessionKey || '').trim();
  if (!normalizedKey) {
    return;
  }

  RECENT_TERMINAL_TEAM_SESSIONS.delete(normalizedKey);
}

function getTeamSessionTerminalMessage(status = 401) {
  if (Number(status) === 403) {
    return 'Este acceso del equipo ya no tiene permiso para continuar. Vuelve a entrar.';
  }

  return 'Tu acceso del equipo venció. Vuelve a entrar.';
}

function buildTerminalTeamSessionResponse(status = 401) {
  const normalizedStatus = TEAM_SESSION_TERMINAL_STATUSES.has(Number(status)) ? Number(status) : 401;

  return new Response(
    JSON.stringify({
      code: 'invalid_waiter_session',
      message: getTeamSessionTerminalMessage(normalizedStatus),
      data: {
        status: normalizedStatus,
      },
    }),
    {
      status: normalizedStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

function isPublicMesaClientForToken(client, tableToken) {
  const normalizedToken = String(tableToken || '').trim();
  if (!normalizedToken || !client?.url) {
    return false;
  }

  try {
    const url = new URL(client.url);
    if (url.origin !== self.location.origin) {
      return false;
    }

    if (!url.pathname.startsWith('/mesa')) {
      return false;
    }

    return String(url.searchParams.get('table_token') || '').trim() === normalizedToken;
  } catch {
    return false;
  }
}

async function notifyPublicTableTermination({ tableToken = '', status = 410 } = {}) {
  const normalizedToken = String(tableToken || '').trim();
  if (!normalizedToken) {
    return;
  }

  const clients = await getWindowClients();
  const matchingClients = clients.filter((client) => isPublicMesaClientForToken(client, normalizedToken));

  for (const client of matchingClients) {
    client.postMessage({
      type: 'PUBLIC_TABLE_ACCESS_TERMINATED',
      payload: {
        status: Number(status || 410) || 410,
        tableToken: normalizedToken,
        message: getPublicTableTerminalMessage(status),
      },
    });

    if (typeof client.navigate === 'function') {
      try {
        await client.navigate(client.url);
      } catch {
        // Ignore navigation failures for already closing or cross-origin clients.
      }
    }
  }
}

async function getLegacyTeamSessionKey() {
  const state = await readState();
  return String(state?.sessionToken || '').trim() || 'legacy-team';
}

function isTeamClient(client) {
  if (!client?.url) {
    return false;
  }

  try {
    const url = new URL(client.url);
    return url.origin === self.location.origin && url.pathname.startsWith('/equipo');
  } catch {
    return false;
  }
}

async function notifyTeamSessionTermination({ status = 401 } = {}) {
  const clients = await getWindowClients();
  const teamClients = clients.filter((client) => isTeamClient(client));
  const loginUrl = new URL('/equipo', self.location.origin).href;

  for (const client of teamClients) {
    client.postMessage({
      type: 'TEAM_SESSION_TERMINATED',
      payload: {
        status: Number(status || 401) || 401,
        message: getTeamSessionTerminalMessage(status),
      },
    });

    if (typeof client.navigate === 'function') {
      try {
        await client.navigate(loginUrl);
      } catch {
        // Ignore navigation failures for already closing or cross-origin clients.
      }
    }
  }
}

async function handleLegacyPublicTableRequest(descriptor, request) {
  const recentTerminal = getRecentTerminalPublicTable(descriptor?.tableToken);
  if (recentTerminal) {
    return {
      response: buildTerminalPublicTableResponse(recentTerminal.status),
      notify: false,
      status: recentTerminal.status,
    };
  }

  const response = await fetch(buildNoStoreRequest(request));
  const status = Number(response.status || 0);

  if (PUBLIC_TABLE_TERMINAL_STATUSES.has(status) && descriptor?.tableToken) {
    rememberTerminalPublicTable(descriptor.tableToken, status);
    return {
      response,
      notify: true,
      status,
    };
  }

  return {
    response,
    notify: false,
    status,
  };
}

async function handleLegacyTeamSessionRequest(request) {
  const sessionKey = await getLegacyTeamSessionKey();
  const recentTerminal = getRecentTerminalTeamSession(sessionKey);
  if (recentTerminal) {
    return {
      response: buildTerminalTeamSessionResponse(recentTerminal.status),
      notify: false,
      status: recentTerminal.status,
    };
  }

  const response = await fetch(buildNoStoreRequest(request));
  const status = Number(response.status || 0);

  if (TEAM_SESSION_TERMINAL_STATUSES.has(status)) {
    rememberTerminalTeamSession(sessionKey, status);
    return {
      response,
      notify: true,
      status,
    };
  }

  clearRecentTerminalTeamSession(sessionKey);

  return {
    response,
    notify: false,
    status,
  };
}

self.addEventListener('fetch', (event) => {
  const descriptor = getOperationalRequestDescriptor(event.request);
  if (!descriptor) {
    return;
  }

  if (descriptor.type === 'legacy-public-table') {
    event.respondWith(
      handleLegacyPublicTableRequest(descriptor, event.request).then(({ response, notify, status }) => {
        if (notify && descriptor?.tableToken) {
          event.waitUntil(
            notifyPublicTableTermination({
              tableToken: descriptor.tableToken,
              status,
            })
          );
        }

        return response;
      })
    );
    return;
  }

  if (descriptor.type === 'legacy-team-session') {
    event.respondWith(
      handleLegacyTeamSessionRequest(event.request).then(({ response, notify, status }) => {
        if (notify) {
          event.waitUntil(
            notifyTeamSessionTermination({
              status,
            })
          );
        }

        return response;
      })
    );
    return;
  }

  event.respondWith(fetch(buildNoStoreRequest(event.request)));
});

async function openStateCache() {
  return caches.open(TEAM_PUSH_CACHE);
}

async function readState() {
  const response = await (await openStateCache()).match(TEAM_PUSH_STATE_URL);
  if (!response) {
    return { sessionToken: '', scope: 'service', deviceLabel: 'Tablet de Zona B' };
  }

  try {
    const data = await response.json();
    return {
      sessionToken: typeof data?.sessionToken === 'string' ? data.sessionToken : '',
      scope: sanitizeScope(typeof data?.scope === 'string' ? data.scope : 'service'),
      deviceLabel:
        typeof data?.deviceLabel === 'string' && data.deviceLabel.trim() !== ''
          ? data.deviceLabel.trim()
          : 'Tablet de Zona B',
    };
  } catch {
    return { sessionToken: '', scope: 'service', deviceLabel: 'Tablet de Zona B' };
  }
}

async function writeState(nextState) {
  const normalized = {
    sessionToken: typeof nextState?.sessionToken === 'string' ? nextState.sessionToken.trim() : '',
    scope: sanitizeScope(typeof nextState?.scope === 'string' ? nextState.scope : 'service'),
    deviceLabel:
      typeof nextState?.deviceLabel === 'string' && nextState.deviceLabel.trim() !== ''
        ? nextState.deviceLabel.trim()
        : 'Tablet de Zona B',
  };

  const cache = await openStateCache();

  if (!normalized.sessionToken) {
    await cache.delete(TEAM_PUSH_STATE_URL);
    return normalized;
  }

  await cache.put(
    TEAM_PUSH_STATE_URL,
    new Response(JSON.stringify(normalized), {
      headers: { 'Content-Type': 'application/json' },
    })
  );

  return normalized;
}

function isSameTeamPushState(currentState, nextState) {
  return (
    String(currentState?.sessionToken || '').trim() === String(nextState?.sessionToken || '').trim() &&
    sanitizeScope(currentState?.scope) === sanitizeScope(nextState?.scope) &&
    String(currentState?.deviceLabel || '').trim() === String(nextState?.deviceLabel || '').trim()
  );
}

function sanitizeScope(scope) {
  const normalized = String(scope || 'service').trim().toLowerCase();
  return ['all', 'service', 'kitchen', 'horno', 'bar'].includes(normalized) ? normalized : 'service';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const outputArray = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    outputArray[index] = raw.charCodeAt(index);
  }

  return outputArray;
}

async function fetchPushConfig(sessionToken) {
  if (!sessionToken) {
    return null;
  }

  const url = new URL('/wp-json/tavox/v1/waiter/push/config', self.location.origin);
  url.searchParams.set('session_token', sessionToken);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    cache: 'no-store',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function syncSubscription(source = 'manual') {
  const state = await readState();
  if (!state.sessionToken || !self.registration.pushManager) {
    return false;
  }

  let subscription = await self.registration.pushManager.getSubscription();

  if (!subscription) {
    const config = await fetchPushConfig(state.sessionToken);
    if (!config?.enabled || typeof config?.public_key !== 'string' || config.public_key.trim() === '') {
      return false;
    }

    subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.public_key.trim()),
    });
  }

  const url = new URL('/wp-json/tavox/v1/waiter/push/subscribe', self.location.origin);
  url.searchParams.set('session_token', state.sessionToken);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.sessionToken}`,
      'X-Tavox-Push-Source': source,
    },
    body: JSON.stringify({
      subscription,
      device_label: state.deviceLabel,
      scope: state.scope,
    }),
    credentials: 'same-origin',
    cache: 'no-store',
  });

  return response.ok;
}

async function fetchInbox() {
  const { sessionToken } = await readState();
  if (!sessionToken) {
    return [];
  }

  const response = await fetch('/wp-json/tavox/v1/waiter/push/inbox', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    cache: 'no-store',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    return [];
  }

  try {
    const payload = await response.json();
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch {
    return [];
  }
}

async function getWindowClients() {
  return self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
}

function hasVisibleClient(clientList) {
  return clientList.some((client) => client.visibilityState === 'visible');
}

function isAlwaysVisibleNotification(message) {
  const kind = String(message?.meta?.kind || message?.type || '').trim();
  return kind === 'push_test' || kind === 'push_enabled';
}

function shouldForceOperationalNotification(message, source = 'manual') {
  const type = String(message?.meta?.kind || message?.type || '').trim();
  return source === 'push' && OPERATIONAL_PUSH_TYPES.includes(type);
}

function buildPushMessageKey(message) {
  const type = String(message?.type || '').trim();
  const tag = String(message?.tag || '').trim();
  const url = String(message?.url || '').trim();
  const title = String(message?.title || '').trim();
  const body = String(message?.body || '').trim();

  return tag || `${type}::${url}::${title}::${body}`;
}

function shouldSkipRecentPushDelivery(message) {
  const key = buildPushMessageKey(message);
  if (!key) {
    return false;
  }

  const now = Date.now();

  Array.from(RECENT_TEAM_PUSH_DELIVERIES.entries()).forEach(([entryKey, timestamp]) => {
    if (now - Number(timestamp || 0) > TEAM_PUSH_DEDUPE_WINDOW_MS) {
      RECENT_TEAM_PUSH_DELIVERIES.delete(entryKey);
    }
  });

  const previousTimestamp = Number(RECENT_TEAM_PUSH_DELIVERIES.get(key) || 0);
  if (previousTimestamp > 0 && now - previousTimestamp < TEAM_PUSH_DEDUPE_WINDOW_MS) {
    return true;
  }

  RECENT_TEAM_PUSH_DELIVERIES.set(key, now);
  return false;
}

function normalizePushPayload(payload) {
  const raw = payload && typeof payload === 'object' ? payload : {};
  const message =
    raw?.message && typeof raw.message === 'object' && !Array.isArray(raw.message)
      ? raw.message
      : raw;

  return {
    type: String(message?.type || '').trim(),
    title: String(message?.title || '').trim(),
    body: String(message?.body || '').trim(),
    url: String(message?.url || DEFAULT_TEAM_PATH).trim() || DEFAULT_TEAM_PATH,
    tag: String(message?.tag || '').trim(),
    meta: message?.meta && typeof message.meta === 'object' && !Array.isArray(message.meta)
      ? message.meta
      : {},
  };
}

async function readPushPayload(event) {
  if (!event?.data) {
    return null;
  }

  try {
    const json = await event.data.json();
    return normalizePushPayload(json);
  } catch {
    try {
      const text = await event.data.text();
      if (!text) {
        return null;
      }

      return normalizePushPayload(JSON.parse(text));
    } catch {
      return null;
    }
  }
}

async function showTeamNotification(message) {
  const title = String(message?.title || 'Nuevo aviso').trim() || 'Nuevo aviso';
  const body = String(message?.body || '').trim();
  const url = String(message?.url || DEFAULT_TEAM_PATH).trim() || DEFAULT_TEAM_PATH;
  const tag = String(message?.tag || `team-push-${message?.id || Date.now()}`).trim();

  await self.registration.showNotification(title, {
    body,
    tag,
    renotify: true,
    icon: TEAM_PUSH_ICON,
    badge: TEAM_PUSH_ICON,
    vibrate: [180, 70, 240, 70, 320],
    data: { url },
  });
}

async function broadcastPushMessage(message, source = 'manual') {
  if (shouldSkipRecentPushDelivery(message)) {
    return;
  }

  const clients = await getWindowClients();
  const visible = hasVisibleClient(clients);

  for (const client of clients) {
    client.postMessage({
      type: 'TEAM_PUSH_EVENT',
      payload: {
        ...message,
        delivery_source: source,
      },
    });
  }

  const shouldShowSystemNotification =
    source === 'push'
      ? (!visible || isAlwaysVisibleNotification(message) || shouldForceOperationalNotification(message, source))
      : isAlwaysVisibleNotification(message);

  if (shouldShowSystemNotification) {
    await showTeamNotification(message);
  }
}

async function syncInbox(source = 'manual', { skipKeys = [] } = {}) {
  const items = await fetchInbox();
  if (!items.length) {
    return;
  }

  const skipped = new Set(
    (Array.isArray(skipKeys) ? skipKeys : [])
      .map((key) => String(key || '').trim())
      .filter(Boolean)
  );

  for (const item of items) {
    if (skipped.has(buildPushMessageKey(item))) {
      continue;
    }

    await broadcastPushMessage(item, source);
  }
}

self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data?.type === 'TEAM_PUSH_SET_SESSION') {
    event.waitUntil(
      (async () => {
        const currentState = await readState();
        const nextState = {
          sessionToken: String(data.sessionToken || ''),
          scope: sanitizeScope(data.scope),
          deviceLabel: String(data.deviceLabel || 'Tablet de Zona B'),
        };

        if (isSameTeamPushState(currentState, nextState)) {
          return;
        }

        await writeState(nextState);
        clearRecentTerminalTeamSession(nextState.sessionToken);

        await syncSubscription('set-session');

        await syncInbox('set-session');
      })()
    );
    return;
  }

  if (data?.type === 'TEAM_PUSH_CLEAR_SESSION') {
    event.waitUntil(
      (async () => {
        const currentState = await readState();
        clearRecentTerminalTeamSession(currentState.sessionToken);
        await writeState({ sessionToken: '', scope: 'service', deviceLabel: 'Tablet de Zona B' });
      })()
    );
    return;
  }

  if (data?.type === 'TEAM_PUSH_CONTEXT') {
    event.waitUntil(
      (async () => {
        const state = await readState();
        const nextState = {
          sessionToken: state.sessionToken,
          scope: sanitizeScope(data.scope),
          deviceLabel:
            typeof data.deviceLabel === 'string' && data.deviceLabel.trim() !== ''
              ? data.deviceLabel
              : state.deviceLabel,
        };

        if (isSameTeamPushState(state, nextState)) {
          return;
        }

        await writeState(nextState);
        clearRecentTerminalTeamSession(nextState.sessionToken);
        await syncSubscription('context');
      })()
    );
    return;
  }

  if (data?.type === 'TEAM_PUSH_SYNC') {
    event.waitUntil(syncInbox('manual-sync'));
  }
});

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const payload = await readPushPayload(event);

      if (payload?.title || payload?.body) {
        await broadcastPushMessage(payload, 'push');
        await syncInbox('push', { skipKeys: [buildPushMessageKey(payload)] });
        return;
      }

      await syncInbox('push');
    })()
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    syncSubscription('subscription-change').then(() => syncInbox('subscription-change'))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = String(event.notification?.data?.url || DEFAULT_TEAM_PATH).trim() || DEFAULT_TEAM_PATH;

  event.waitUntil(
    (async () => {
      const absoluteUrl = new URL(targetUrl, self.location.origin).href;
      const clients = await getWindowClients();

      for (const client of clients) {
        if ('focus' in client) {
          if (client.url === absoluteUrl && typeof client.focus === 'function') {
            await client.focus();
            return;
          }

          if (typeof client.navigate === 'function') {
            await client.navigate(absoluteUrl);
            await client.focus();
            return;
          }
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(absoluteUrl);
      }
    })()
  );
});
