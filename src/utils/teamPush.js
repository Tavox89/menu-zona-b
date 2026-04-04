function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(normalized);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function withTimeout(promise, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('push_sw_timeout'));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function getActiveServiceWorker(registration) {
  return registration?.active || registration?.waiting || registration?.installing || navigator.serviceWorker?.controller || null;
}

export function isTeamPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getTeamPushRegistration() {
  if (!isTeamPushSupported()) {
    return null;
  }

  return withTimeout(navigator.serviceWorker.ready, 6000);
}

export async function getTeamPushSubscription() {
  const registration = await getTeamPushRegistration();
  if (!registration) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

export function getTeamPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }

  return Notification.permission;
}

export async function requestTeamPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }

  return Notification.requestPermission();
}

export async function subscribeBrowserToPush(publicKey) {
  const registration = await getTeamPushRegistration();
  if (!registration || !publicKey) {
    return null;
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return existing;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

export function serializeTeamPushSubscription(subscription) {
  if (!subscription || typeof subscription.toJSON !== 'function') {
    return {};
  }

  const json = subscription.toJSON();
  const supportedContentEncodings =
    typeof PushManager !== 'undefined' && Array.isArray(PushManager.supportedContentEncodings)
    ? PushManager.supportedContentEncodings
    : [];

  return {
    ...json,
    contentEncoding: supportedContentEncodings[0] || 'aes128gcm',
  };
}

export async function unsubscribeBrowserFromPush() {
  const existing = await getTeamPushSubscription();
  if (!existing) {
    return true;
  }

  return existing.unsubscribe();
}

async function postMessageToServiceWorker(message) {
  const registration = await getTeamPushRegistration();
  const target = getActiveServiceWorker(registration);
  if (!target) {
    return;
  }

  target.postMessage(message);
}

export async function syncTeamPushSession(sessionToken, { scope = 'service', deviceLabel = '' } = {}) {
  if (!isTeamPushSupported()) {
    return;
  }

  await postMessageToServiceWorker({
    type: 'TEAM_PUSH_SET_SESSION',
    sessionToken: String(sessionToken || ''),
    scope: String(scope || 'service'),
    deviceLabel: String(deviceLabel || ''),
  });
}

export async function syncTeamPushContext({ scope = 'service', deviceLabel = '' } = {}) {
  if (!isTeamPushSupported()) {
    return;
  }

  await postMessageToServiceWorker({
    type: 'TEAM_PUSH_CONTEXT',
    scope: String(scope || 'service'),
    deviceLabel: String(deviceLabel || ''),
  });
}

export async function clearTeamPushSession() {
  if (!isTeamPushSupported()) {
    return;
  }

  await postMessageToServiceWorker({
    type: 'TEAM_PUSH_CLEAR_SESSION',
  });
}

export async function requestTeamPushSync() {
  if (!isTeamPushSupported()) {
    return;
  }

  await postMessageToServiceWorker({
    type: 'TEAM_PUSH_SYNC',
  });
}

export function subscribeToTeamPushMessages(onMessage) {
  if (!isTeamPushSupported() || typeof onMessage !== 'function') {
    return () => {};
  }

  const handler = (event) => {
    const payload = event?.data;
    if (!payload || payload.type !== 'TEAM_PUSH_EVENT') {
      return;
    }

    onMessage(payload.payload || {});
  };

  navigator.serviceWorker.addEventListener('message', handler);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}
