const TEAM_LAUNCH_MODE_KEY = 'tavox_app_launch_mode_v1';
const TEAM_LAUNCH_PATH_KEY = 'tavox_app_launch_path_v1';

function isAllowedTeamPath(pathname = '') {
  return (
    pathname === '/equipo' ||
    pathname === '/equipo/pedidos' ||
    pathname === '/equipo/servicio' ||
    pathname === '/equipo/menu' ||
    pathname === '/equipo/cocina' ||
    pathname === '/equipo/horno' ||
    pathname === '/equipo/barra' ||
    pathname === '/mesero' ||
    pathname === '/mesero/cola' ||
    pathname === '/mesero/mesas' ||
    pathname === '/mesero/menu'
  );
}

export function isAllowedAppEntry(pathname = '') {
  return (
    pathname === '/' ||
    pathname === '/mesa' ||
    pathname === '/mesa/menu' ||
    isAllowedTeamPath(pathname)
  );
}

export function isStandaloneTeamApp() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true
  );
}

export function rememberTeamLaunchPath(pathname = '/equipo', search = '') {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedPath = String(pathname || '').trim();
  if (!isAllowedTeamPath(normalizedPath)) {
    return;
  }

  const normalizedSearch = String(search || '').trim();

  try {
    window.localStorage.setItem(TEAM_LAUNCH_MODE_KEY, 'team');
    window.localStorage.setItem(TEAM_LAUNCH_PATH_KEY, `${normalizedPath}${normalizedSearch}`);
  } catch {
    // Ignore storage failures.
  }
}

export function getPreferredStandaloneEntry() {
  if (typeof window === 'undefined' || !isStandaloneTeamApp()) {
    return '';
  }

  try {
    const mode = String(window.localStorage.getItem(TEAM_LAUNCH_MODE_KEY) || '').trim();
    const rawPath = String(window.localStorage.getItem(TEAM_LAUNCH_PATH_KEY) || '').trim();
    const [pathname = '', search = ''] = rawPath.split('?');

    if (mode !== 'team' || !isAllowedTeamPath(pathname)) {
      return '';
    }

    return search ? `${pathname}?${search}` : pathname;
  } catch {
    return '';
  }
}

export function getRequestedAppEntry(search = '') {
  if (typeof window === 'undefined') {
    return '';
  }

  const params = new URLSearchParams(String(search || '').trim());
  const rawTarget = String(params.get('open') || '').trim();

  if (!rawTarget || rawTarget.startsWith('http://') || rawTarget.startsWith('https://')) {
    return '';
  }

  try {
    const nextUrl = new URL(rawTarget, window.location.origin);
    if (nextUrl.origin !== window.location.origin || !isAllowedAppEntry(nextUrl.pathname)) {
      return '';
    }

    return `${nextUrl.pathname}${nextUrl.search}`;
  } catch {
    return '';
  }
}
