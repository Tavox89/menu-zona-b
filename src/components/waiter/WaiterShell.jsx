import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Chip from '@mui/material/Chip';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useWaiterSession } from '../../context/WaiterSessionContext.jsx';
import { useWaiterRealtime } from '../../context/useWaiterRealtime.js';
import useSerializedRefresh from '../../hooks/useSerializedRefresh.js';
import { useTeamPushNotifications } from '../../hooks/useTeamPushNotifications.js';
import { fetchSettings } from '../../services/tavox.js';
import {
  acceptWaiterRequest,
  claimWaiterRequest,
  fetchWaiterRequestDetail,
  fetchWaiterNotifications,
  markWaiterNotificationsRead,
  resolveTableMessages,
} from '../../services/tableService.js';
import { subscribeToTeamPushMessages } from '../../utils/teamPush.js';
import { triggerTeamAttentionFeedback } from '../../utils/teamNotifications.js';
import { rememberTeamLaunchPath } from '../../utils/appLaunchPreference.js';
import {
  emitWaiterOperationalRefresh,
  subscribeWaiterOperationalRefresh,
} from '../../utils/waiterOperationalRefresh.js';
import { getWaiterAllowedNavigation } from '../../utils/waiterAccess.js';
import TabletSetupCard from './TabletSetupCard.jsx';
import NotificationCenterDialog from './NotificationCenterDialog.jsx';
import { OP_PANEL_RADIUS } from '../../theme/operationalRadii.js';
import { getWaiterRealtimeUserChannel } from '../../services/waiterRealtime.js';

const PUSH_FEEDBACK_DEDUPE_WINDOW_MS = 18000;

function NavButton({ to, label, search = '' }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <Button
      component={RouterLink}
      to={{ pathname: to, search }}
      variant={isActive ? 'contained' : 'outlined'}
      size="small"
      sx={{ minHeight: 38, borderRadius: 999, px: 1.7 }}
    >
      {label}
    </Button>
  );
}

function getNavigationSearch(pathname = '', currentSearch = '') {
  const params = new URLSearchParams(String(currentSearch || '').trim());
  const tableToken = String(params.get('table_token') || '').trim();

  if (!tableToken) {
    return '';
  }

  if (pathname === '/equipo/servicio' || pathname === '/equipo/menu') {
    return `?table_token=${encodeURIComponent(tableToken)}`;
  }

  return '';
}

function showBrowserWindowNotification({ title, body, tag }) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    const notice = new Notification(title, {
      body,
      tag,
      requireInteraction: tag === 'push-test',
      silent: false,
      icon: '/apple-touch-icon.png',
    });

    notice.onclick = () => {
      window.focus();
      notice.close();
    };
  } catch {
    // Ignore browser notification failures.
  }
}

function normalizeDisplayHandle(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const base = raw.includes('@') ? raw.split('@')[0] : raw;
  const cleaned = base.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    return raw;
  }

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getSessionWaiterDisplayName(waiter) {
  if (!waiter || typeof waiter !== 'object') {
    return '';
  }

  const primary = String(waiter.display_name || '').trim();
  if (primary && !primary.includes('@')) {
    return primary;
  }

  const login = String(waiter.login || '').trim();
  if (login) {
    return normalizeDisplayHandle(login);
  }

  return normalizeDisplayHandle(primary);
}

function getPushScopeFromPath(pathname = '') {
  if (pathname.startsWith('/equipo/cocina')) {
    return 'kitchen';
  }

  if (pathname.startsWith('/equipo/horno')) {
    return 'horno';
  }

  if (pathname.startsWith('/equipo/barra')) {
    return 'bar';
  }

  return 'service';
}

function getPushScopeLabel(scope = 'service') {
  const normalized = String(scope || 'service').trim();

  if (normalized === 'kitchen') {
    return 'cocina';
  }

  if (normalized === 'horno') {
    return 'horno';
  }

  if (normalized === 'bar') {
    return 'barra';
  }

  return 'pedidos, servicio y entrega';
}

function getPushFeedbackProfile(scope = 'service', type = '') {
  const normalizedScope = String(scope || 'service').trim();

  if (normalizedScope === 'kitchen' || normalizedScope === 'horno' || normalizedScope === 'bar') {
    return normalizedScope;
  }

  return type === 'push_test' ? 'test' : 'service';
}

export default function WaiterShell({
  title,
  subtitle = '',
  actions = null,
  children,
  navigationMode = 'full',
  maxWidth = 'lg',
}) {
  const location = useLocation();
  const { session, logout } = useWaiterSession();
  const { subscribe: subscribeRealtime } = useWaiterRealtime();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const previousActiveNotificationsCountRef = useRef(0);
  const handledPushFeedbackRef = useRef(new Map());
  const isStationMode = navigationMode === 'station';
  const currentPushScope = getPushScopeFromPath(location.pathname);
  const currentPushScopeLabel = getPushScopeLabel(currentPushScope);
  const {
    supported,
    permission,
    loading,
    error,
    statusText,
    checked,
    enabled,
    active,
    activatePush,
    sendTestPush,
    clearPushError,
  } = useTeamPushNotifications({
    sessionToken: session?.session_token,
    waiterName: getSessionWaiterDisplayName(session?.waiter),
    scope: currentPushScope,
  });
  const allowedNavigation = useMemo(
    () => getWaiterAllowedNavigation(session),
    [session]
  );
  const waiterDisplayName = getSessionWaiterDisplayName(session?.waiter);
  const notificationChannels = useMemo(() => {
    const userChannel = getWaiterRealtimeUserChannel(session?.waiter?.id);
    const scopeChannels = allowedNavigation
      .map(({ scope }) => (scope === 'menu' ? 'scope:service' : `scope:${scope}`))
      .filter(Boolean);

    return Array.from(new Set([...scopeChannels, userChannel].filter(Boolean)));
  }, [allowedNavigation, session?.waiter?.id]);

  const showPushSetup =
    checked &&
    (!supported || !enabled || permission === 'denied' || (!active && !loading) || Boolean(error));
  const activeNotificationsCount = useMemo(
    () => notifications.filter((item) => item?.is_active !== false).length,
    [notifications]
  );

  const wasPushFeedbackHandledRecently = useCallback((deliveryKey) => {
    const key = String(deliveryKey || '').trim();
    if (!key) {
      return false;
    }

    const now = Date.now();
    const registry = handledPushFeedbackRef.current;

    Array.from(registry.entries()).forEach(([entryKey, timestamp]) => {
      if (now - Number(timestamp || 0) > PUSH_FEEDBACK_DEDUPE_WINDOW_MS) {
        registry.delete(entryKey);
      }
    });

    const previousTimestamp = Number(registry.get(key) || 0);
    if (previousTimestamp > 0 && now - previousTimestamp < PUSH_FEEDBACK_DEDUPE_WINDOW_MS) {
      return true;
    }

    registry.set(key, now);
    return false;
  }, []);

  useEffect(() => {
    rememberTeamLaunchPath(location.pathname, location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    let mounted = true;

    fetchSettings()
      .then((data) => {
        if (mounted) {
          setSoundEnabled(Boolean(data?.notification_sound_enabled ?? true));
        }
      })
      .catch(() => {
        if (mounted) {
          setSoundEnabled(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loadNotifications = useCallback(
    async ({ quiet = false } = {}) => {
      if (!session?.session_token) {
        setNotifications([]);
        setNotificationsUnreadCount(0);
        return;
      }

      if (!quiet) {
        setNotificationsLoading(true);
      }

      try {
        const data = await fetchWaiterNotifications({
          sessionToken: session.session_token,
          limit: 40,
        });
        const items = Array.isArray(data?.items) ? data.items : [];

        setNotifications(items);
        setNotificationsUnreadCount(Number(data?.unread_count || 0) || 0);
        setNotificationsError('');
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'No se pudieron revisar los avisos del equipo.';
        setNotificationsError(String(message));
      } finally {
        if (!quiet) {
          setNotificationsLoading(false);
        }
      }
    },
    [session?.session_token]
  );
  const scheduleNotificationsRefresh = useSerializedRefresh(
    () => loadNotifications({ quiet: true }),
    { minGapMs: 500 }
  );

  const handleMarkNotificationsRead = useCallback(
    async (ids = []) => {
      if (!session?.session_token) {
        return;
      }

      setNotificationsLoading(true);

      try {
        await markWaiterNotificationsRead({
          sessionToken: session.session_token,
          ids,
        });
        await loadNotifications({ quiet: true });
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'No se pudieron actualizar los avisos.';
        setNotificationsError(String(message));
      } finally {
        setNotificationsLoading(false);
      }
    },
    [loadNotifications, session?.session_token]
  );

  const handleFetchNotificationRequestDetail = useCallback(
    async (requestId) => {
      if (!session?.session_token) {
        throw new Error('Tu acceso del equipo ya no está activo.');
      }

      return fetchWaiterRequestDetail({
        sessionToken: session.session_token,
        requestId,
      });
    },
    [session?.session_token]
  );

  const handleClaimNotificationRequest = useCallback(
    async ({ notificationId, requestId }) => {
      if (!session?.session_token) {
        throw new Error('Tu acceso del equipo ya no está activo.');
      }

      try {
        const result = await claimWaiterRequest({
          sessionToken: session.session_token,
          requestId,
        });

        const markReadTask =
          notificationId > 0
            ? markWaiterNotificationsRead({
                sessionToken: session.session_token,
                ids: [notificationId],
              })
            : Promise.resolve(null);

        await Promise.allSettled([markReadTask]);
        emitWaiterOperationalRefresh({
          scopes: ['queue', 'service', 'notifications'],
          reason: 'request-claimed',
          requestId,
        });
        await loadNotifications({ quiet: true });

        return result;
      } catch (error) {
        await loadNotifications({ quiet: true });
        throw error;
      }
    },
    [loadNotifications, session?.session_token]
  );

  const handleAcceptNotificationRequest = useCallback(
    async ({ notificationId, requestId }) => {
      if (!session?.session_token) {
        throw new Error('Tu acceso del equipo ya no está activo.');
      }

      try {
        const result = await acceptWaiterRequest({
          sessionToken: session.session_token,
          requestId,
        });

        const markReadTask =
          notificationId > 0
            ? markWaiterNotificationsRead({
                sessionToken: session.session_token,
                ids: [notificationId],
              })
            : Promise.resolve(null);

        await Promise.allSettled([markReadTask]);
        emitWaiterOperationalRefresh({
          scopes: ['queue', 'service', 'notifications'],
          reason: 'request-accepted',
          requestId,
        });
        await loadNotifications({ quiet: true });

        return result;
      } catch (error) {
        emitWaiterOperationalRefresh({
          scopes: ['queue', 'service', 'notifications'],
          reason: 'request-accept-failed',
          requestId,
        });
        await loadNotifications({ quiet: true });
        throw error;
      }
    },
    [loadNotifications, session?.session_token]
  );

  const handleAttendNotificationTableMessage = useCallback(
    async (item) => {
      if (!session?.session_token) {
        throw new Error('Tu acceso del equipo ya no está activo.');
      }

      const tableToken = String(item?.meta?.table_token || '').trim();
      if (!tableToken) {
        throw new Error('No pudimos ubicar la cuenta de esta solicitud.');
      }

      setNotificationsLoading(true);

      try {
        const result = await resolveTableMessages({
          sessionToken: session.session_token,
          tableToken,
          messageId: Number(item?.meta?.message_id || 0) || 0,
          notificationId: Number(item?.id || 0) || 0,
        });

        emitWaiterOperationalRefresh({
          scopes: ['service', 'notifications'],
          reason: 'table-message-attended',
          tableToken,
        });
        await loadNotifications({ quiet: true });

        return result;
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'No se pudo atender esta solicitud.';
        setNotificationsError(String(message));
        throw err;
      } finally {
        setNotificationsLoading(false);
      }
    },
    [loadNotifications, session?.session_token]
  );

  const handlePushMessage = useCallback(
    async (message) => {
      const title = String(message?.title || '').trim();
      const body = String(message?.body || '').trim();
      const type = String(message?.type || '').trim();
      const key = String(message?.tag || message?.id || `${type}-${title}-${body}`).trim();
      const metaTable = String(message?.meta?.table_token || message?.meta?.table_name || '').trim();
      const metaRequest = String(message?.meta?.request_id || '').trim();
      const metaScope = String(message?.meta?.scope || '').trim();
      const deliveryKey = [key, type, metaTable, metaRequest, metaScope].filter(Boolean).join('::');
      const deliverySource = String(message?.delivery_source || '').trim();
      const isSessionHydration =
        deliverySource === 'set-session' || deliverySource === 'subscription-change';
      const cameFromServiceWorkerPush = deliverySource === 'push';
      const isPushTest = type === 'push_test';
      const shouldPlayFeedback = !isSessionHydration && (cameFromServiceWorkerPush || isPushTest);
      const isDuplicateFeedback = shouldPlayFeedback && wasPushFeedbackHandledRecently(deliveryKey);

      if (!title && !body) {
        return;
      }

      if (!cameFromServiceWorkerPush && isPushTest && !isSessionHydration && !isDuplicateFeedback) {
        showBrowserWindowNotification({
          title: title || 'Nuevo aviso',
          body,
          tag: type === 'push_test' ? 'push-test' : key,
        });
      }

      if (type !== 'push_enabled' && shouldPlayFeedback && !isDuplicateFeedback) {
        await triggerTeamAttentionFeedback({
          soundEnabled,
          vibrationEnabled: true,
          profile: getPushFeedbackProfile(currentPushScope, type),
        });
      }

      scheduleNotificationsRefresh();
    },
    [
      currentPushScope,
      scheduleNotificationsRefresh,
      soundEnabled,
      wasPushFeedbackHandledRecently,
    ]
  );

  useEffect(() => subscribeToTeamPushMessages(handlePushMessage), [handlePushMessage]);

  useEffect(
    () =>
      subscribeWaiterOperationalRefresh(() => scheduleNotificationsRefresh(), {
        scopes: ['notifications'],
      }),
    [scheduleNotificationsRefresh]
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!session?.session_token || !notificationChannels.length) {
      return undefined;
    }

    return subscribeRealtime({
      channels: notificationChannels,
      onEvent: () => {
        scheduleNotificationsRefresh();
      },
    });
  }, [
    notificationChannels,
    scheduleNotificationsRefresh,
    session?.session_token,
    subscribeRealtime,
  ]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      scheduleNotificationsRefresh();
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [scheduleNotificationsRefresh]);

  useEffect(() => {
    const previousCount = previousActiveNotificationsCountRef.current;

    if (notificationsOpen && previousCount > 0 && activeNotificationsCount === 0) {
      setNotificationsOpen(false);
    }

    previousActiveNotificationsCountRef.current = activeNotificationsCount;
  }, [activeNotificationsCount, notificationsOpen]);

  return (
    <Box sx={{ minHeight: '100dvh', py: { xs: 2, sm: 3 }, px: { xs: 1.25, sm: 2 } }}>
      <Container maxWidth={isStationMode ? false : maxWidth} sx={{ px: 0 }}>
        <Stack spacing={2}>
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: OP_PANEL_RADIUS,
              border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
              background: (theme) => theme.appBrand.frostedPanel,
              p: { xs: 1.5, sm: 2 },
              backdropFilter: 'blur(18px)',
              boxShadow: '0 18px 42px rgba(0,0,0,0.2)',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at top right, rgba(230, 189, 23, 0.12) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(255,255,255,0.05) 0%, transparent 36%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontSize: { xs: 28, sm: 34 }, fontWeight: 700 }}>
                  {title}
                </Typography>
                {subtitle ? (
                  <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>{subtitle}</Typography>
                ) : null}
              </Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {waiterDisplayName ? (
                  <Chip
                    icon={<BadgeRoundedIcon />}
                    label={waiterDisplayName}
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 999, px: 0.4 }}
                  />
                ) : null}
                <Button variant="text" color="inherit" onClick={() => logout()}>
                  Cerrar sesión
                </Button>
              </Stack>
            </Stack>
            {error ? (
              <Alert
                severity="warning"
                onClose={clearPushError}
                sx={{ mt: 1.5 }}
              >
                {error}
              </Alert>
            ) : null}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              {allowedNavigation.map((item) => (
                <NavButton
                  key={item.path}
                  to={item.path}
                  label={item.label}
                  search={getNavigationSearch(item.path, location.search)}
                />
              ))}
              <Button
                size="small"
                variant={notificationsOpen || notificationsUnreadCount > 0 ? 'contained' : 'outlined'}
                onClick={() => {
                  setNotificationsOpen(true);
                  loadNotifications({ quiet: true });
                }}
                startIcon={
                  <Badge color="warning" badgeContent={notificationsUnreadCount} max={99}>
                    <NotificationsRoundedIcon />
                  </Badge>
                }
                sx={{ minHeight: 38, borderRadius: 999, px: 1.7 }}
              >
                Avisos
              </Button>
              {actions}
            </Stack>
            {(showPushSetup || loading) && statusText ? (
              <Typography sx={{ mt: 0.75, fontSize: 13, color: 'text.secondary' }}>
                {statusText}
              </Typography>
            ) : null}
          </Box>

          {showPushSetup ? (
            <TabletSetupCard
              showInstallStep
              showPushStep
              pushEnabled={enabled}
              pushActive={active}
              pushLoading={loading}
              pushSupported={supported}
              pushPermission={permission}
              pushScopeLabel={currentPushScopeLabel}
              onActivatePush={activatePush}
              onTestPush={sendTestPush}
            />
          ) : null}
          {children}
        </Stack>
      </Container>

      <NotificationCenterDialog
        open={notificationsOpen}
        items={notifications}
        unreadCount={notificationsUnreadCount}
        loading={notificationsLoading}
        error={notificationsError}
        onClose={() => setNotificationsOpen(false)}
        onRefresh={() => loadNotifications()}
        onMarkRead={(id) => handleMarkNotificationsRead(id ? [id] : [])}
        onMarkAllRead={() => handleMarkNotificationsRead([])}
        onFetchRequestDetail={handleFetchNotificationRequestDetail}
        onTakeRequest={handleClaimNotificationRequest}
        onAcceptRequest={handleAcceptNotificationRequest}
        onAttendTableMessage={handleAttendNotificationTableMessage}
      />
    </Box>
  );
}
