const WAITER_SCOPE_ORDER = ['queue', 'service', 'menu', 'kitchen', 'bar', 'horno'];
const LEGACY_FULL_ACCESS = {
  scopes: [...WAITER_SCOPE_ORDER],
  default_path: '/equipo/pedidos',
};

const WAITER_SCOPE_MAP = {
  queue: {
    label: 'Pedidos',
    path: '/equipo/pedidos',
  },
  service: {
    label: 'Servicio',
    path: '/equipo/servicio',
  },
  menu: {
    label: 'Menú',
    path: '/equipo/menu',
  },
  kitchen: {
    label: 'Cocina',
    path: '/equipo/cocina',
  },
  bar: {
    label: 'Barra',
    path: '/equipo/barra',
  },
  horno: {
    label: 'Horno',
    path: '/equipo/horno',
  },
};

function normalizeScopes(scopes = []) {
  const values = Array.isArray(scopes) ? scopes : [];
  const allowed = new Set(WAITER_SCOPE_ORDER);
  const seen = new Set();
  const normalized = [];

  values.forEach((scope) => {
    const value = String(scope || '').trim().toLowerCase();
    if (!value || !allowed.has(value) || seen.has(value)) {
      return;
    }

    seen.add(value);
    normalized.push(value);
  });

  return normalized;
}

function resolveAccessSource(source = null) {
  if (
    source &&
    typeof source === 'object' &&
    Object.prototype.hasOwnProperty.call(source, 'scopes') &&
    Array.isArray(source.scopes)
  ) {
    return source;
  }

  if (
    source &&
    typeof source === 'object' &&
    source.access &&
    typeof source.access === 'object' &&
    Object.prototype.hasOwnProperty.call(source.access, 'scopes') &&
    Array.isArray(source.access.scopes)
  ) {
    return source.access;
  }

  return LEGACY_FULL_ACCESS;
}

export function getWaiterPathScope(pathname = '') {
  const normalizedPath = String(pathname || '').trim();

  if (normalizedPath === '/equipo/pedidos' || normalizedPath.startsWith('/equipo/pedidos/')) {
    return 'queue';
  }

  if (normalizedPath === '/equipo/servicio' || normalizedPath.startsWith('/equipo/servicio/')) {
    return 'service';
  }

  if (normalizedPath === '/equipo/menu' || normalizedPath.startsWith('/equipo/menu/')) {
    return 'menu';
  }

  if (normalizedPath === '/equipo/cocina' || normalizedPath.startsWith('/equipo/cocina/')) {
    return 'kitchen';
  }

  if (normalizedPath === '/equipo/barra' || normalizedPath.startsWith('/equipo/barra/')) {
    return 'bar';
  }

  if (normalizedPath === '/equipo/horno' || normalizedPath.startsWith('/equipo/horno/')) {
    return 'horno';
  }

  return '';
}

export function hasWaiterScope(source, scope) {
  const normalizedScope = String(scope || '').trim().toLowerCase();
  if (!normalizedScope) {
    return false;
  }

  const access = resolveAccessSource(source);
  return normalizeScopes(access.scopes).includes(normalizedScope);
}

export function getWaiterDefaultPath(source) {
  const access = resolveAccessSource(source);
  const scopes = normalizeScopes(access.scopes);
  const requestedPath = String(access.default_path || '').trim();

  if (requestedPath && hasWaiterScope({ scopes }, getWaiterPathScope(requestedPath))) {
    return requestedPath;
  }

  for (const scope of WAITER_SCOPE_ORDER) {
    if (scopes.includes(scope) && WAITER_SCOPE_MAP[scope]?.path) {
      return WAITER_SCOPE_MAP[scope].path;
    }
  }

  return '/equipo/pedidos';
}

export function resolveWaiterTarget(source, target = '') {
  const rawTarget = String(target || '').trim();
  if (!rawTarget) {
    return getWaiterDefaultPath(source);
  }

  const [pathname = '', ...searchParts] = rawTarget.split('?');
  const search = searchParts.length > 0 ? `?${searchParts.join('?')}` : '';

  if (isWaiterPathAllowed(source, pathname)) {
    return `${pathname}${search}`;
  }

  return `${getWaiterDefaultPath(source)}${search}`;
}

export function isWaiterPathAllowed(source, pathname = '') {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath || normalizedPath === '/equipo') {
    return true;
  }

  const requiredScope = getWaiterPathScope(normalizedPath);
  if (!requiredScope) {
    return false;
  }

  return hasWaiterScope(source, requiredScope);
}

export function getWaiterAllowedNavigation(source) {
  const access = resolveAccessSource(source);
  const scopes = normalizeScopes(access.scopes);

  return WAITER_SCOPE_ORDER
    .filter((scope) => scopes.includes(scope) && WAITER_SCOPE_MAP[scope])
    .map((scope) => ({
      scope,
      label: WAITER_SCOPE_MAP[scope].label,
      path: WAITER_SCOPE_MAP[scope].path,
    }));
}
