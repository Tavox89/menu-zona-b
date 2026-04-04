import http from 'node:http';
import process from 'node:process';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 4100);
const HOST = process.env.HOST || '127.0.0.1';
const SOCKET_PATH = process.env.SOCKET_PATH || '/socket';
const WP_AUTH_URL = String(process.env.WP_AUTH_URL || '').trim();
const PUBLISH_SECRET = String(process.env.PUBLISH_SECRET || '').trim();
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const HEARTBEAT_MS = 30000;

const clients = new Map();

function normalizeChannel(value) {
  return String(value || '').trim();
}

function normalizeChannels(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizeChannel).filter(Boolean))];
}

function sendJson(socket, payload) {
  if (!socket || socket.readyState !== 1) {
    return;
  }

  socket.send(JSON.stringify(payload));
}

function isOriginAllowed(origin) {
  if (!ALLOWED_ORIGINS.length) {
    return true;
  }

  return ALLOWED_ORIGINS.includes(String(origin || '').trim());
}

function matchesTargets(subscriptions, targets) {
  if (!targets.length) {
    return true;
  }

  return targets.some((target) => subscriptions.has(target));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

async function authenticateWaiterSession(sessionToken) {
  if (!WP_AUTH_URL || !PUBLISH_SECRET) {
    throw new Error('realtime_auth_not_configured');
  }

  const response = await fetch(WP_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tavox-Realtime-Secret': PUBLISH_SECRET,
    },
    body: JSON.stringify({
      session_token: String(sessionToken || '').trim(),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    throw new Error(String(payload?.message || `auth_failed_${response.status}`));
  }

  return payload;
}

function broadcastEvent(payload) {
  const targets = normalizeChannels(payload?.targets);
  let delivered = 0;

  for (const [socket, client] of clients.entries()) {
    if (!client?.authenticated || !matchesTargets(client.subscriptions, targets)) {
      continue;
    }

    sendJson(socket, {
      type: 'event',
      event: String(payload?.event || '').trim(),
      targets,
      table_token: String(payload?.table_token || '').trim(),
      scope: String(payload?.scope || '').trim(),
      changed_at: String(payload?.changed_at || '').trim(),
      meta: payload?.meta && typeof payload.meta === 'object' ? payload.meta : {},
    });
    delivered += 1;
  }

  return delivered;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname === '/health') {
      const healthPayload = JSON.stringify({
        ok: true,
        clients: clients.size,
        socket_path: SOCKET_PATH,
      });

      response.writeHead(200, { 'Content-Type': 'application/json' });

      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      response.end(healthPayload);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/publish') {
      const providedSecret = String(request.headers['x-tavox-realtime-secret'] || '').trim();
      if (!PUBLISH_SECRET || providedSecret !== PUBLISH_SECRET) {
        response.writeHead(403, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ ok: false, message: 'forbidden' }));
        return;
      }

      const payload = await readJsonBody(request);
      const event = String(payload?.event || '').trim();
      const targets = normalizeChannels(payload?.targets);

      if (!event || !targets.length) {
        response.writeHead(422, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ ok: false, message: 'invalid_payload' }));
        return;
      }

      const delivered = broadcastEvent({
        event,
        targets,
        table_token: payload?.table_token,
        scope: payload?.scope,
        changed_at: payload?.changed_at || new Date().toISOString(),
        meta: payload?.meta,
      });

      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ ok: true, delivered }));
      return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ ok: false, message: 'not_found' }));
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : 'server_error',
      })
    );
  }
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (socket) => {
  const client = {
    authenticated: false,
    waiterId: 0,
    allowedChannels: new Set(),
    subscriptions: new Set(),
    isAlive: true,
  };

  clients.set(socket, client);
  sendJson(socket, { type: 'hello' });

  socket.on('pong', () => {
    client.isAlive = true;
  });

  socket.on('message', async (raw) => {
    let payload = null;

    try {
      payload = JSON.parse(String(raw || '{}'));
    } catch {
      sendJson(socket, { type: 'error', message: 'invalid_json' });
      return;
    }

    const messageType = String(payload?.type || '').trim();

    if (messageType === 'ping') {
      sendJson(socket, { type: 'pong' });
      return;
    }

    if (messageType === 'auth') {
      try {
        const result = await authenticateWaiterSession(payload?.sessionToken);
        client.authenticated = true;
        client.waiterId = Number(result?.waiter?.id || 0) || 0;
        client.allowedChannels = new Set(normalizeChannels(result?.allowed_channels));
        client.subscriptions = new Set();

        sendJson(socket, {
          type: 'ready',
          waiter: result?.waiter || null,
          allowed_channels: [...client.allowedChannels],
          shared_tables_enabled: Boolean(result?.shared_tables_enabled),
        });
      } catch (error) {
        sendJson(socket, {
          type: 'error',
          message: error instanceof Error ? error.message : 'auth_failed',
        });
        socket.close(4001, 'auth-failed');
      }
      return;
    }

    if (messageType === 'subscribe') {
      if (!client.authenticated) {
        sendJson(socket, { type: 'error', message: 'not_authenticated' });
        return;
      }

      const requested = normalizeChannels(payload?.channels);
      const filtered = requested.filter((channel) => client.allowedChannels.has(channel));
      client.subscriptions = new Set(filtered);

      sendJson(socket, {
        type: 'subscribed',
        channels: filtered,
      });
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
  });

  socket.on('error', () => {
    clients.delete(socket);
  });
});

server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (url.pathname !== SOCKET_PATH) {
      socket.destroy();
      return;
    }

    if (!isOriginAllowed(request.headers.origin)) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (upgradedSocket) => {
      wss.emit('connection', upgradedSocket, request);
    });
  } catch {
    socket.destroy();
  }
});

const heartbeatInterval = setInterval(() => {
  for (const [socket, client] of clients.entries()) {
    if (!client.isAlive) {
      socket.terminate();
      clients.delete(socket);
      continue;
    }

    client.isAlive = false;
    socket.ping();
  }
}, HEARTBEAT_MS);

heartbeatInterval.unref();

server.listen(PORT, HOST, () => {
  console.log(
    JSON.stringify({
      ok: true,
      host: HOST,
      port: PORT,
      socket_path: SOCKET_PATH,
      auth_url: WP_AUTH_URL,
    })
  );
});
