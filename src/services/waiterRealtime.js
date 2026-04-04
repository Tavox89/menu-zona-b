const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 10000];

function normalizeChannel(value) {
  return String(value || '').trim();
}

function normalizeChannels(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizeChannel).filter(Boolean))];
}

function normalizeSocketUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value || typeof window === 'undefined') {
    return '';
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol === 'https:') {
      url.protocol = 'wss:';
    } else if (url.protocol === 'http:') {
      url.protocol = 'ws:';
    }

    return url.toString();
  } catch {
    return '';
  }
}

function getSessionKey(session) {
  const token = String(session?.session_token || '').trim();
  const socketUrl = normalizeSocketUrl(session?.realtime?.socket_url);
  const enabled = Boolean(session?.realtime?.enabled && token && socketUrl);

  return enabled ? `${token}::${socketUrl}` : '';
}

function channelsMatch(subscriptionChannels, eventTargets) {
  if (!Array.isArray(eventTargets) || eventTargets.length < 1) {
    return true;
  }

  return subscriptionChannels.some((channel) => eventTargets.includes(channel));
}

export function getWaiterRealtimeUserChannel(waiterId) {
  const numericId = Number(waiterId || 0) || 0;
  return numericId > 0 ? `user:${numericId}` : '';
}

export function createWaiterRealtimeClient({ onStatusChange } = {}) {
  let socket = null;
  let session = null;
  let sessionKey = '';
  let reconnectTimerId = 0;
  let helloTimerId = 0;
  let reconnectIndex = 0;
  let authenticated = false;
  let helloReceived = false;
  let authRequested = false;
  let allowedChannels = [];
  let lastSubscribedChannelsKey = '';
  let status = 'disabled';
  const subscriptions = new Set();

  function setStatus(nextStatus) {
    if (status === nextStatus) {
      return;
    }

    status = nextStatus;
    if (typeof onStatusChange === 'function') {
      onStatusChange(nextStatus);
    }
  }

  function clearReconnectTimer() {
    if (reconnectTimerId) {
      window.clearTimeout(reconnectTimerId);
      reconnectTimerId = 0;
    }
  }

  function clearHelloTimer() {
    if (helloTimerId) {
      window.clearTimeout(helloTimerId);
      helloTimerId = 0;
    }
  }

  function resetConnectionState() {
    authenticated = false;
    helloReceived = false;
    authRequested = false;
    allowedChannels = [];
    lastSubscribedChannelsKey = '';
  }

  function getMergedChannels() {
    const merged = [];

    subscriptions.forEach((subscription) => {
      subscription.channels.forEach((channel) => {
        merged.push(channel);
      });
    });

    const uniqueChannels = normalizeChannels(merged);
    if (!allowedChannels.length) {
      return uniqueChannels;
    }

    return uniqueChannels.filter((channel) => allowedChannels.includes(channel));
  }

  function sendJson(payload) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(payload));
  }

  function refreshSubscriptions({ force = false } = {}) {
    if (!authenticated) {
      return;
    }

    const channels = getMergedChannels();
    const channelsKey = channels.join('|');

    if (!force && channelsKey === lastSubscribedChannelsKey) {
      return;
    }

    lastSubscribedChannelsKey = channelsKey;
    sendJson({
      type: 'subscribe',
      channels,
    });
  }

  function cleanupSocket() {
    if (!socket) {
      return;
    }

    clearHelloTimer();
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket = null;
  }

  function scheduleReconnect() {
    clearReconnectTimer();

    if (!sessionKey) {
      setStatus('disabled');
      return;
    }

    const delay = RETRY_DELAYS_MS[Math.min(reconnectIndex, RETRY_DELAYS_MS.length - 1)];
    reconnectIndex += 1;
    setStatus('reconnecting');

    reconnectTimerId = window.setTimeout(() => {
      reconnectTimerId = 0;
      connect();
    }, delay);
  }

  function handleMessage(event) {
    let payload = null;

    try {
      payload = JSON.parse(String(event?.data || '{}'));
    } catch {
      return;
    }

    const type = String(payload?.type || '').trim();

    if (type === 'hello') {
      helloReceived = true;
      clearHelloTimer();

      if (!authRequested) {
        authRequested = true;
        setStatus('authorizing');
        sendJson({
          type: 'auth',
          sessionToken: String(session?.session_token || '').trim(),
        });
      }
      return;
    }

    if (type === 'ready') {
      authenticated = true;
      reconnectIndex = 0;
      allowedChannels = normalizeChannels(payload?.allowed_channels);
      lastSubscribedChannelsKey = '';
      setStatus('ready');
      refreshSubscriptions({ force: true });
      return;
    }

    if (type === 'event') {
      const eventTargets = normalizeChannels(payload?.targets);

      subscriptions.forEach((subscription) => {
        if (!channelsMatch(subscription.channels, eventTargets)) {
          return;
        }

        subscription.onEvent(payload);
      });
      return;
    }

    if (type === 'error') {
      setStatus('error');
    }
  }

  function connect() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      setStatus('disabled');
      return;
    }

    if (!sessionKey || !session?.realtime?.socket_url || !session?.session_token) {
      setStatus('disabled');
      return;
    }

    const socketUrl = normalizeSocketUrl(session.realtime.socket_url);
    if (!socketUrl) {
      setStatus('disabled');
      return;
    }

    clearReconnectTimer();

    if (socket) {
      const previousSocket = socket;
      clearHelloTimer();
      previousSocket.onopen = null;
      previousSocket.onmessage = null;
      previousSocket.onerror = null;
      previousSocket.onclose = null;
      if (previousSocket.readyState < WebSocket.CLOSING) {
        previousSocket.close(1000, 'reconnect');
      }
      socket = null;
    }

    resetConnectionState();
    setStatus(reconnectIndex > 0 ? 'reconnecting' : 'connecting');

    socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      setStatus('connecting');
      clearHelloTimer();
      helloTimerId = window.setTimeout(() => {
        if (!helloReceived && socket && socket.readyState === WebSocket.OPEN) {
          socket.close(4002, 'hello-timeout');
        }
      }, 5000);
    };

    socket.onmessage = handleMessage;

    socket.onerror = () => {
      setStatus('error');
    };

    socket.onclose = () => {
      cleanupSocket();
      resetConnectionState();
      scheduleReconnect();
    };
  }

  function disconnect() {
    clearReconnectTimer();
    clearHelloTimer();
    reconnectIndex = 0;
    session = null;
    sessionKey = '';
    resetConnectionState();

    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close(1000, 'session-ended');
    }

    cleanupSocket();
    setStatus('disabled');
  }

  return {
    setSession(nextSession) {
      const nextSessionKey = getSessionKey(nextSession);

      if (!nextSessionKey) {
        disconnect();
        return;
      }

      session = nextSession;

      if (nextSessionKey === sessionKey) {
        if (!socket && !reconnectTimerId) {
          reconnectIndex = 0;
          connect();
        }
        return;
      }

      sessionKey = nextSessionKey;
      reconnectIndex = 0;
      connect();
    },

    subscribe({ channels = [], onEvent } = {}) {
      const normalizedChannels = normalizeChannels(channels);
      if (!normalizedChannels.length || typeof onEvent !== 'function') {
        return () => {};
      }

      const subscription = {
        channels: normalizedChannels,
        onEvent,
      };

      subscriptions.add(subscription);
      refreshSubscriptions();

      return () => {
        subscriptions.delete(subscription);
        refreshSubscriptions({ force: true });
      };
    },

    getStatus() {
      return status;
    },

    destroy() {
      subscriptions.clear();
      disconnect();
    },
  };
}
