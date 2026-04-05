import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import WaiterShell from '../components/waiter/WaiterShell.jsx';
import QuietInfoPanel from '../components/common/QuietInfoPanel.jsx';
import { useWaiterSession } from '../context/WaiterSessionContext.jsx';
import useSerializedRefresh from '../hooks/useSerializedRefresh.js';
import useWaiterLiveStream from '../hooks/useWaiterLiveStream.js';
import {
  acceptWaiterRequest,
  claimWaiterRequest,
  fetchWaiterQueue,
  fetchWaiterRequestHistory,
  releaseWaiterRequest,
} from '../services/tableService.js';
import {
  emitWaiterOperationalRefresh,
  subscribeWaiterOperationalRefresh,
} from '../utils/waiterOperationalRefresh.js';
import { subscribeToTeamPushMessages } from '../utils/teamPush.js';
import { getFriendlyRequestStatus, getRequestOriginLabel } from '../utils/teamStatus.js';
import { OP_CARD_RADIUS } from '../theme/operationalRadii.js';

function getRequestItemCount(request) {
  return Array.isArray(request?.payload?.items)
    ? request.payload.items.reduce((sum, item) => sum + (Number(item?.qty ?? 0) || 0), 0)
    : 0;
}

function parseOperationalDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return 0;
  }

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const parsed = new Date(normalized).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRequestDate(value) {
  const parsed = parseOperationalDate(value);
  if (!parsed) {
    return '';
  }

  return new Date(parsed).toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusChip({ status }) {
  const normalized = String(status || 'pending').trim();
  const color =
    normalized === 'claimed'
      ? 'warning'
      : normalized === 'error'
        ? 'error'
        : normalized === 'pending'
          ? 'info'
          : normalized === 'expired'
            ? 'default'
          : normalized === 'delivered'
            ? 'default'
            : 'primary';

  return <Chip size="small" label={getFriendlyRequestStatus(normalized)} color={color} variant="outlined" />;
}

function pushAlert(setAlerts, nextAlert) {
  setAlerts((prev) => {
    const deduped = prev.filter((alert) => alert.message !== nextAlert.message);
    return [nextAlert, ...deduped].slice(0, 4);
  });
}

export default function WaiterQueuePage() {
  const { session } = useWaiterSession();
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [busyId, setBusyId] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const expiryRefreshTimeoutRef = useRef(0);

  const loadQueue = useCallback(async () => {
    if (!session?.session_token) {
      return;
    }

    const hasVisibleData = hasLoadedOnceRef.current;

    if (!hasVisibleData) {
      setLoading(true);
    }

    try {
      const [queueData, historyData] = await Promise.all([
        fetchWaiterQueue({ sessionToken: session.session_token }),
        fetchWaiterRequestHistory({ sessionToken: session.session_token, limit: 24 }).catch(() => ({
          items: [],
        })),
      ]);
      const nextQueue = Array.isArray(queueData?.items) ? queueData.items : [];
      const nextHistory = Array.isArray(historyData?.items) ? historyData.items : [];
      hasLoadedOnceRef.current = true;
      setQueue(nextQueue);
      setHistory(nextHistory);
      setError('');
    } catch (err) {
      if (!hasVisibleData) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'No se pudieron cargar los pedidos.';
        setError(String(message));
      }
    } finally {
      setLoading(false);
    }
  }, [session?.session_token]);
  const scheduleQueueRefresh = useSerializedRefresh(loadQueue, { minGapMs: 500 });

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useWaiterLiveStream({
    sessionToken: session?.session_token || '',
    scope: 'queue',
    enabled: Boolean(session?.session_token),
    onSync: scheduleQueueRefresh,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      scheduleQueueRefresh();
    }, 20000);
    return () => window.clearInterval(intervalId);
  }, [scheduleQueueRefresh]);

  useEffect(() => subscribeToTeamPushMessages(() => scheduleQueueRefresh()), [scheduleQueueRefresh]);

  useEffect(
    () => subscribeWaiterOperationalRefresh(() => scheduleQueueRefresh(), { scopes: ['queue'] }),
    [scheduleQueueRefresh]
  );

  useEffect(() => {
    if (expiryRefreshTimeoutRef.current) {
      window.clearTimeout(expiryRefreshTimeoutRef.current);
      expiryRefreshTimeoutRef.current = 0;
    }

    const nextExpiryAt = queue.reduce((closest, request) => {
      if (String(request?.status || '').trim() !== 'pending') {
        return closest;
      }

      const expiryAt = parseOperationalDate(request?.expires_at);
      if (!expiryAt || expiryAt <= Date.now()) {
        return closest;
      }

      if (!closest || expiryAt < closest) {
        return expiryAt;
      }

      return closest;
    }, 0);

    if (!nextExpiryAt) {
      return undefined;
    }

    const delayMs = Math.max(800, nextExpiryAt - Date.now() + 800);
    expiryRefreshTimeoutRef.current = window.setTimeout(() => {
      expiryRefreshTimeoutRef.current = 0;
      scheduleQueueRefresh();
    }, delayMs);

    return () => {
      if (expiryRefreshTimeoutRef.current) {
        window.clearTimeout(expiryRefreshTimeoutRef.current);
        expiryRefreshTimeoutRef.current = 0;
      }
    };
  }, [queue, scheduleQueueRefresh]);

  const sortedQueue = useMemo(
    () =>
      [...queue].sort((a, b) => {
        const weight = { pending: 0, claimed: 1, error: 2, pushed: 3, delivered: 4 };
        const diff = (weight[a.status] ?? 9) - (weight[b.status] ?? 9);
        if (diff !== 0) return diff;
        return String(a.created_at || '').localeCompare(String(b.created_at || ''));
      }),
    [queue]
  );
  const sortedHistory = useMemo(
    () =>
      [...history].sort((a, b) => {
        const weight = { expired: 0, pushed: 1, delivered: 2 };
        const diff = (weight[a.status] ?? 9) - (weight[b.status] ?? 9);
        if (diff !== 0) return diff;
        return parseOperationalDate(b.updated_at || b.pushed_at || b.created_at) - parseOperationalDate(a.updated_at || a.pushed_at || a.created_at);
      }),
    [history]
  );

  const handleAction = async (requestId, action) => {
    if (!session?.session_token) {
      return;
    }

    setBusyId(requestId);
    setError('');

    try {
      if (action === 'claim') {
        await claimWaiterRequest({ sessionToken: session.session_token, requestId });
        emitWaiterOperationalRefresh({
          scopes: ['queue', 'service', 'notifications'],
          reason: 'request-claimed',
          requestId,
        });
        pushAlert(setAlerts, {
          id: `flash-claim-${requestId}-${Date.now()}`,
          severity: 'success',
          message: 'Pedido tomado correctamente.',
        });
      }
      if (action === 'accept') {
        await acceptWaiterRequest({ sessionToken: session.session_token, requestId });
        emitWaiterOperationalRefresh({
          scopes: ['queue', 'service', 'notifications'],
          reason: 'request-accepted',
          requestId,
        });
        pushAlert(setAlerts, {
          id: `flash-accept-${requestId}-${Date.now()}`,
          severity: 'success',
          message: 'El pedido quedó agregado.',
        });
      }
      if (action === 'release') {
        await releaseWaiterRequest({ sessionToken: session.session_token, requestId });
        emitWaiterOperationalRefresh({
          scopes: ['queue', 'service', 'notifications'],
          reason: 'request-released',
          requestId,
        });
        pushAlert(setAlerts, {
          id: `flash-release-${requestId}-${Date.now()}`,
          severity: 'success',
          message: 'El pedido volvió a quedar disponible.',
        });
      }
      await loadQueue();
    } catch (err) {
      if (action === 'accept') {
        emitWaiterOperationalRefresh({
          scopes: ['queue', 'service', 'notifications'],
          reason: 'request-accept-failed',
          requestId,
        });
        await loadQueue().catch(() => {});
      }
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo procesar el pedido.';
      setError(String(message));
    } finally {
      setBusyId(0);
    }
  };

  return (
    <WaiterShell title="Pedidos por revisar" subtitle="Confirma los pedidos nuevos y súmalos a su mesa o para llevar.">
      <Stack spacing={2}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity}>
            {alert.message}
          </Alert>
        ))}
        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : null}

        {!loading && sortedQueue.length === 0 ? (
          <QuietInfoPanel description="No hay pedidos por revisar en este momento." />
        ) : null}

        {!loading &&
          sortedQueue.map((request) => {
            const primaryAction = String(request?.primary_action || '').trim();
            const canClaim = primaryAction === 'claim' && Boolean(request?.can_claim);
            const canAccept = primaryAction === 'accept' && Boolean(request?.can_accept);
            const canRelease = Boolean(request?.can_release);
            const showActionReason = Boolean(request?.action_reason) && primaryAction !== 'claim';
            const isClaimedByOther =
              primaryAction === 'none' &&
              (String(request?.table_availability || '').trim() === 'busy' ||
                (request.status === 'claimed' && !request?.request_is_mine));
            const itemCount = getRequestItemCount(request);

            return (
              <Card
                key={request.id}
                sx={{
                  borderRadius: OP_CARD_RADIUS,
                  border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                  background: (theme) => theme.appBrand.dialogBackground,
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack spacing={1.2}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 24 }}>
                          {request.table_name || 'Sin nombre'}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                          {itemCount} artículos · {getRequestOriginLabel(request.request_source)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <StatusChip status={request.status} />
                        <Chip
                          size="small"
                          label={
                            request.table_type === 'takeaway'
                              ? 'Para llevar'
                              : request.brand_scope === 'isola'
                                ? 'ISOLA'
                                : request.brand_scope === 'common'
                                  ? 'General'
                                  : 'Zona B'
                          }
                          variant="outlined"
                        />
                      </Stack>
                    </Stack>

                    {request.global_note ? (
                      <Typography sx={{ color: 'text.secondary' }}>
                        Indicaciones: {request.global_note}
                      </Typography>
                    ) : null}

                    {request.waiter_name ? (
                      <Typography sx={{ color: 'text.secondary' }}>
                        Atiende <strong>{request.waiter_name}</strong>
                      </Typography>
                    ) : null}

                    {showActionReason ? (
                      <Typography sx={{ color: 'text.secondary' }}>
                        {request.action_reason}
                      </Typography>
                    ) : null}

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {canClaim ? (
                        <Button
                          variant="contained"
                          disabled={busyId === request.id}
                          onClick={() => handleAction(request.id, 'claim')}
                        >
                          Tomar pedido
                        </Button>
                      ) : null}

                      {canAccept ? (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            disabled={busyId === request.id}
                            onClick={() => handleAction(request.id, 'accept')}
                          >
                            Agregar a la mesa
                          </Button>
                        </>
                      ) : null}

                      {canRelease ? (
                        <Button
                          variant="outlined"
                          disabled={busyId === request.id}
                          onClick={() => handleAction(request.id, 'release')}
                        >
                          Volver a pedidos
                        </Button>
                      ) : null}

                      {isClaimedByOther ? (
                        <Button variant="outlined" disabled>
                          Ya lo atiende otra persona del equipo
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}

        {!loading ? (
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<HistoryRoundedIcon />}
              onClick={() => setHistoryOpen((current) => !current)}
              sx={{ alignSelf: 'flex-start' }}
            >
              {historyOpen ? 'Ocultar historial' : `Ver historial${sortedHistory.length ? ` (${sortedHistory.length})` : ''}`}
            </Button>

            <Collapse in={historyOpen} unmountOnExit>
              <Stack spacing={1.5}>
                {sortedHistory.length === 0 ? (
                  <QuietInfoPanel
                    title="Sin historial reciente"
                    description="Aquí aparecerán los pedidos vencidos o ya procesados para consulta rápida."
                  />
                ) : (
                  sortedHistory.map((request) => {
                    const itemCount = getRequestItemCount(request);
                    const mainTimestamp =
                      formatRequestDate(request.updated_at || request.pushed_at || request.created_at) || 'Sin fecha';
                    const expiryLabel =
                      request.status === 'expired'
                        ? formatRequestDate(request.expires_at)
                        : '';

                    return (
                      <Card
                        key={`history-${request.id}`}
                        sx={{
                          borderRadius: OP_CARD_RADIUS,
                          border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                          background: 'rgba(255,255,255,0.035)',
                        }}
                      >
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Stack spacing={1.1}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              justifyContent="space-between"
                            >
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {request.table_name || 'Sin nombre'}
                                </Typography>
                                <Typography sx={{ color: 'text.secondary' }}>
                                  {itemCount} artículos · {getRequestOriginLabel(request.request_source)}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <StatusChip status={request.status} />
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={
                                    request.table_type === 'takeaway'
                                      ? 'Para llevar'
                                      : request.brand_scope === 'isola'
                                        ? 'ISOLA'
                                        : request.brand_scope === 'common'
                                          ? 'General'
                                          : 'Zona B'
                                  }
                                />
                              </Stack>
                            </Stack>

                            <Typography sx={{ color: 'text.secondary' }}>
                              {request.status === 'expired'
                                ? expiryLabel
                                  ? `Venció ${expiryLabel}.`
                                  : 'Este pedido venció antes de ser tomado.'
                                : `Último cambio ${mainTimestamp}.`}
                            </Typography>

                            {request.waiter_name ? (
                              <Typography sx={{ color: 'text.secondary' }}>
                                Atiende <strong>{request.waiter_name}</strong>
                              </Typography>
                            ) : null}

                            {request.global_note ? (
                              <Typography sx={{ color: 'text.secondary' }}>
                                Indicaciones: {request.global_note}
                              </Typography>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </Stack>
            </Collapse>
          </Stack>
        ) : null}
      </Stack>
    </WaiterShell>
  );
}
