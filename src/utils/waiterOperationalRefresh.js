const WAITER_OPERATIONAL_REFRESH_EVENT = 'tavox:waiter-operational-refresh';

function normalizeScopes(scopes) {
  if (!Array.isArray(scopes)) {
    return [];
  }

  return [...new Set(scopes.map((scope) => String(scope || '').trim()).filter(Boolean))];
}

export function emitWaiterOperationalRefresh(detail = {}) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  const payload = {
    ...detail,
    scopes: normalizeScopes(detail?.scopes),
    emittedAt: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent(WAITER_OPERATIONAL_REFRESH_EVENT, {
      detail: payload,
    })
  );
}

export function subscribeWaiterOperationalRefresh(handler, { scopes = [] } = {}) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function' || typeof handler !== 'function') {
    return () => {};
  }

  const allowedScopes = normalizeScopes(scopes);

  const listener = (event) => {
    const detail = event?.detail && typeof event.detail === 'object' ? event.detail : {};
    const eventScopes = normalizeScopes(detail?.scopes);

    if (allowedScopes.length > 0 && !eventScopes.some((scope) => allowedScopes.includes(scope))) {
      return;
    }

    handler(detail);
  };

  window.addEventListener(WAITER_OPERATIONAL_REFRESH_EVENT, listener);

  return () => {
    window.removeEventListener(WAITER_OPERATIONAL_REFRESH_EVENT, listener);
  };
}
