import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import RoomServiceRoundedIcon from '@mui/icons-material/RoomServiceRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import LocalBarRoundedIcon from '@mui/icons-material/LocalBarRounded';
import LocalPizzaRoundedIcon from '@mui/icons-material/LocalPizzaRounded';
import SoupKitchenRoundedIcon from '@mui/icons-material/SoupKitchenRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import TakeoutDiningRoundedIcon from '@mui/icons-material/TakeoutDiningRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import QuietInfoPanel from '../common/QuietInfoPanel.jsx';
import {
  getFulfillmentModeChipColor,
  getFulfillmentModeLabel,
  sanitizeFulfillmentMode,
} from '../../utils/fulfillment.js';
import {
  getFriendlyRequestStatus,
  getRequestOriginLabel,
} from '../../utils/teamStatus.js';
import {
  OP_CARD_RADIUS,
  OP_CONTROL_RADIUS,
  OP_INNER_RADIUS,
} from '../../theme/operationalRadii.js';

function getAreaLabel(area) {
  const value = String(area || '').trim();

  if (value === 'kitchen') return 'Cocina';
  if (value === 'horno') return 'Horno';
  if (value === 'bar') return 'Barra';
  return 'Servicio';
}

function getStatusColor(item) {
  const type = String(item?.type || '').trim();
  const status = String(item?.status_label || '').trim().toLowerCase();

  if (status === 'resuelto' || status === 'entregado') return 'default';
  if (type === 'new_request') return 'info';
  if (type === 'table_message_new') return 'warning';
  if (type === 'table_message_reply') return 'primary';
  if (type === 'request_claimed') return 'warning';
  if (type === 'service_partial_ready' || type === 'service_ready') return 'success';
  return 'primary';
}

function getNotificationVisual(item) {
  const type = String(item?.type || item?.meta?.kind || '').trim();
  const area = String(item?.area || '').trim();

  if (type === 'new_request') {
    return {
      icon: ReceiptLongRoundedIcon,
      color: 'info.main',
      bg: 'rgba(36, 181, 255, 0.14)',
      label: 'Pedido nuevo',
    };
  }

  if (type === 'request_claimed') {
    return {
      icon: AssignmentIndRoundedIcon,
      color: 'warning.main',
      bg: 'rgba(255, 188, 58, 0.14)',
      label: 'Pedido tomado',
    };
  }

  if (type === 'table_message_new') {
    return {
      icon: SupportAgentRoundedIcon,
      color: 'warning.main',
      bg: 'rgba(255, 188, 58, 0.16)',
      label: 'Solicitar al mesero',
    };
  }

  if (type === 'table_message_reply') {
    return {
      icon: ReplyRoundedIcon,
      color: 'primary.main',
      bg: 'rgba(230, 189, 23, 0.18)',
      label: 'Respuesta enviada',
    };
  }

  if (type === 'table_message_resolved') {
    return {
      icon: TaskAltRoundedIcon,
      color: 'success.main',
      bg: 'rgba(104, 214, 129, 0.16)',
      label: 'Solicitud resuelta',
    };
  }

  if (type === 'service_partial_ready') {
    const AreaIcon =
      area === 'bar'
        ? LocalBarRoundedIcon
        : area === 'horno'
          ? LocalPizzaRoundedIcon
          : SoupKitchenRoundedIcon;

    return {
      icon: AreaIcon,
      color: 'success.main',
      bg: 'rgba(104, 214, 129, 0.14)',
      label: 'Listo parcial',
    };
  }

  if (type === 'service_ready') {
    return {
      icon: RoomServiceRoundedIcon,
      color: 'success.main',
      bg: 'rgba(104, 214, 129, 0.16)',
      label: 'Listo para entregar',
    };
  }

  if (type === 'service_delivered') {
    return {
      icon: TaskAltRoundedIcon,
      color: 'text.secondary',
      bg: 'rgba(255,255,255,0.08)',
      label: 'Entregado',
    };
  }

  if (type === 'table_shared' || type === 'shared_table') {
    return {
      icon: GroupsRoundedIcon,
      color: 'primary.main',
      bg: 'rgba(230, 189, 23, 0.18)',
      label: 'Compartida',
    };
  }

  return {
    icon: NotificationsActiveRoundedIcon,
    color: 'primary.main',
    bg: 'rgba(230, 189, 23, 0.16)',
    label: 'Aviso',
  };
}

function formatDateTimeLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNotificationRequestId(item) {
  return Number(item?.meta?.request_id || 0) || 0;
}

function getRequestItemCount(request) {
  if (!Array.isArray(request?.payload?.items)) {
    return Number(request?.item_count || 0) || 0;
  }

  return request.payload.items.reduce(
    (sum, item) => sum + (Number(item?.qty ?? 0) || 0),
    0
  );
}

function getRequestBrandLabel(scope) {
  const value = String(scope || '').trim();

  if (value === 'isola') return 'ISOLA';
  if (value === 'common') return 'General';
  return 'Zona B';
}

function getRequestEntryState(entry) {
  return entry && typeof entry === 'object'
    ? entry
    : {
        loading: false,
        refreshing: false,
        data: null,
        error: '',
        actionError: '',
        busy: false,
      };
}

function getCanClaimRequest(item, requestDetail) {
  const isNewRequest = String(item?.type || '').trim() === 'new_request';
  const requestId = getNotificationRequestId(item);
  if (!isNewRequest || !item?.is_active || requestId < 1) {
    return false;
  }

  if (requestDetail && typeof requestDetail === 'object') {
    return requestDetail.available !== false && String(requestDetail.primary_action || '').trim() === 'claim';
  }

  const primaryAction = String(item?.meta?.primary_action || '').trim();
  if (primaryAction) {
    return primaryAction === 'claim';
  }

  return Boolean(item?.meta?.can_claim) || String(item?.meta?.request_status || '').trim() === 'pending';
}

function getCanAcceptRequest(item, requestDetail) {
  const isNewRequest = String(item?.type || '').trim() === 'new_request';
  const requestId = getNotificationRequestId(item);
  if (!isNewRequest || !item?.is_active || requestId < 1) {
    return false;
  }

  if (requestDetail && typeof requestDetail === 'object') {
    return requestDetail.available !== false && String(requestDetail.primary_action || '').trim() === 'accept';
  }

  const primaryAction = String(item?.meta?.primary_action || '').trim();
  if (primaryAction) {
    return primaryAction === 'accept';
  }

  return Boolean(item?.meta?.can_accept);
}

function RequestStatusChip({ request }) {
  const status = String(request?.status || '').trim();
  const color =
    status === 'claimed'
      ? 'warning'
      : status === 'error'
        ? 'error'
        : status === 'pending'
          ? 'info'
          : status === 'delivered'
            ? 'default'
            : 'primary';

  return (
    <Chip
      size="small"
      variant="outlined"
      color={color}
      label={request?.status_label || getFriendlyRequestStatus(status)}
    />
  );
}

function RequestInlineDetail({
  item,
  requestState,
  onRefreshRequest,
  onTakeRequest,
  onAcceptRequest,
}) {
  const request = requestState?.data;
  const requestId = getNotificationRequestId(item);
  const itemCount = getRequestItemCount(request);
  const requestItems = Array.isArray(request?.payload?.items) ? request.payload.items : [];
  const canClaim = getCanClaimRequest(item, request);
  const canAccept = getCanAcceptRequest(item, request);

  return (
    <Box
      sx={{
        mt: 1.2,
        p: 1.35,
        borderRadius: OP_INNER_RADIUS,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={1.15}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Typography sx={{ fontWeight: 700 }}>
              {request?.table_name || item?.meta?.table_name || 'Pedido sin cuenta'}
            </Typography>
            {request ? <RequestStatusChip request={request} /> : null}
            {request?.table_type ? (
              <Chip
                size="small"
                variant="outlined"
                label={request.table_type === 'takeaway' ? 'Para llevar' : 'Mesa'}
              />
            ) : null}
            {request?.brand_scope ? (
              <Chip size="small" variant="outlined" label={getRequestBrandLabel(request.brand_scope)} />
            ) : null}
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              startIcon={
                requestState?.loading || requestState?.refreshing ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <RefreshRoundedIcon />
                )
              }
              onClick={() => onRefreshRequest(requestId, { force: true })}
              disabled={requestState?.busy}
              sx={{ borderRadius: OP_CONTROL_RADIUS }}
            >
              Actualizar
            </Button>
            {canClaim ? (
              <Button
                size="small"
                variant="contained"
                startIcon={<AssignmentTurnedInRoundedIcon />}
                onClick={() => onTakeRequest(item)}
                disabled={requestState?.busy}
                sx={{ borderRadius: OP_CONTROL_RADIUS }}
              >
                Tomar pedido
              </Button>
            ) : null}
            {canAccept ? (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<RoomServiceRoundedIcon />}
                onClick={() => onAcceptRequest(item)}
                disabled={requestState?.busy}
                sx={{ borderRadius: OP_CONTROL_RADIUS }}
              >
                Agregar a la mesa
              </Button>
            ) : null}
          </Stack>
        </Stack>

        {requestState?.actionError ? (
          <Alert severity="warning">{requestState.actionError}</Alert>
        ) : null}

        {requestState?.loading && !request ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
            <CircularProgress size={16} />
            <Typography sx={{ fontSize: 14 }}>Revisando el pedido…</Typography>
          </Stack>
        ) : null}

        {!requestState?.loading && request?.available === false ? (
          <QuietInfoPanel description="Este pedido ya no está disponible en la cola actual." />
        ) : null}

        {!requestState?.loading && !request && requestState?.error ? (
          <Alert severity="warning">{requestState.error}</Alert>
        ) : null}

        {request?.action_reason ? (
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
            {request.action_reason}
          </Typography>
        ) : null}

        {request && request.available !== false ? (
          <>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                {itemCount} artículos
              </Typography>
              {request.request_source ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {getRequestOriginLabel(request.request_source)}
                </Typography>
              ) : null}
              {request.created_at ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  Llegó {formatDateTimeLabel(request.created_at)}
                </Typography>
              ) : null}
              {request.updated_at ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  Último cambio {formatDateTimeLabel(request.updated_at)}
                </Typography>
              ) : null}
            </Stack>

            {request.global_note ? (
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                Indicaciones: <strong>{request.global_note}</strong>
              </Typography>
            ) : null}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              {request.client_label ? (
                <Box
                  sx={{
                    flex: 1,
                    p: 1.1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(255,255,255,0.025)',
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Cliente
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{request.client_label}</Typography>
                </Box>
              ) : null}
              {request.waiter_name ? (
                <Box
                  sx={{
                    flex: 1,
                    p: 1.1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(255,255,255,0.025)',
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Atiende
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{request.waiter_name}</Typography>
                </Box>
              ) : null}
            </Stack>

            {requestItems.length ? (
              <Stack spacing={0.85}>
                <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>
                  Productos del pedido
                </Typography>
                {requestItems.map((product, index) => (
                  <Box
                    key={`${product?.id || product?.name || 'item'}-${index}`}
                    sx={{
                      p: 1.1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                      <Typography sx={{ fontWeight: 700 }}>
                        {product?.name || 'Producto'} x{Number(product?.qty ?? 0) || 0}
                      </Typography>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={getFulfillmentModeChipColor(product?.fulfillment_mode)}
                        label={getFulfillmentModeLabel(product?.fulfillment_mode)}
                        icon={
                          sanitizeFulfillmentMode(product?.fulfillment_mode) === 'takeaway' ? (
                            <TakeoutDiningRoundedIcon />
                          ) : (
                            <RoomServiceRoundedIcon />
                          )
                        }
                      />
                    </Stack>
                    {product?.note ? (
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                        {product.note}
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            ) : (
              <QuietInfoPanel description="Este pedido no tiene productos visibles en este momento." />
            )}
          </>
        ) : null}
      </Stack>
    </Box>
  );
}

export default function NotificationCenterDialog({
  open,
  items = [],
  unreadCount = 0,
  loading = false,
  error = '',
  onClose,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onFetchRequestDetail,
  onTakeRequest,
  onAcceptRequest,
  onAttendTableMessage,
}) {
  const [expandedRequestId, setExpandedRequestId] = useState(0);
  const [requestStates, setRequestStates] = useState({});
  const [actionNotice, setActionNotice] = useState(null);
  const [retainedRequestItems, setRetainedRequestItems] = useState({});
  const requestStatesRef = useRef({});

  const setRequestState = useCallback((requestId, updater) => {
    if (!requestId) {
      return;
    }

    setRequestStates((prev) => {
      const current = getRequestEntryState(prev[requestId]);
      const nextPartial = typeof updater === 'function' ? updater(current) : updater;
      const nextState = {
        ...prev,
        [requestId]: {
          ...current,
          ...nextPartial,
        },
      };
      requestStatesRef.current = nextState;
      return nextState;
    });
  }, []);

  const requestItemsById = useMemo(() => {
    const map = new Map();
    const liveRequestIds = new Set();

    items.forEach((item) => {
      const requestId = getNotificationRequestId(item);
      if (requestId > 0 && !map.has(requestId)) {
        map.set(requestId, item);
        liveRequestIds.add(requestId);
      }
    });

    Object.values(retainedRequestItems).forEach((item) => {
      const requestId = getNotificationRequestId(item);
      if (requestId > 0 && !liveRequestIds.has(requestId) && !map.has(requestId)) {
        map.set(requestId, item);
      }
    });

    return map;
  }, [items, retainedRequestItems]);

  const visibleItems = useMemo(() => {
    const nextItems = [...items];
    const liveRequestIds = new Set(
      items
        .map((item) => getNotificationRequestId(item))
        .filter((requestId) => requestId > 0)
    );

    Object.values(retainedRequestItems).forEach((item) => {
      const requestId = getNotificationRequestId(item);
      if (requestId < 1 || liveRequestIds.has(requestId)) {
        return;
      }

      nextItems.unshift(item);
    });

    return nextItems;
  }, [items, retainedRequestItems]);

  const loadRequestDetail = useCallback(
    async (requestId, { force = false } = {}) => {
      if (typeof onFetchRequestDetail !== 'function' || requestId < 1) {
        return null;
      }

      const current = getRequestEntryState(requestStatesRef.current[requestId]);
      if (current.loading || current.busy) {
        return current.data || null;
      }
      if (!force && current.data && !current.error) {
        return current.data;
      }

      setRequestState(requestId, {
        loading: !current.data,
        refreshing: Boolean(current.data),
        error: '',
        actionError: '',
      });

      try {
        const detail = await onFetchRequestDetail(requestId);
        setRequestState(requestId, {
          loading: false,
          refreshing: false,
          data: detail,
          error: '',
        });
        return detail;
      } catch (requestError) {
        const message =
          requestError?.response?.data?.message ||
          requestError?.message ||
          'No se pudo revisar este pedido.';
        setRequestState(requestId, {
          loading: false,
          refreshing: false,
          error: String(message),
        });
        return null;
      }
    },
    [onFetchRequestDetail, setRequestState]
  );

  useEffect(() => {
    if (!open) {
      setExpandedRequestId(0);
      setRequestStates({});
      requestStatesRef.current = {};
      setActionNotice(null);
      setRetainedRequestItems({});
    }
  }, [open]);

  useEffect(() => {
    if (!expandedRequestId) {
      return;
    }

    if (!requestItemsById.has(expandedRequestId)) {
      setExpandedRequestId(0);
      return;
    }

    loadRequestDetail(expandedRequestId, { force: true });
  }, [expandedRequestId, loadRequestDetail, requestItemsById]);

  const handleToggleRequest = useCallback(
    async (item) => {
      const requestId = getNotificationRequestId(item);
      if (requestId < 1) {
        return;
      }

      setActionNotice(null);

      if (expandedRequestId === requestId) {
        setExpandedRequestId(0);
        return;
      }

      setExpandedRequestId(requestId);
      await loadRequestDetail(requestId);
    },
    [expandedRequestId, loadRequestDetail]
  );

  const handleTakeRequest = useCallback(
    async (item) => {
      const requestId = getNotificationRequestId(item);
      if (requestId < 1 || typeof onTakeRequest !== 'function') {
        return;
      }

      setActionNotice(null);
      setExpandedRequestId(requestId);
      setRetainedRequestItems((prev) => ({
        ...prev,
        [requestId]: item,
      }));
      setRequestState(requestId, {
        busy: true,
        actionError: '',
      });

      try {
        const result = await onTakeRequest({
          notificationId: Number(item?.id || 0) || 0,
          requestId,
        });
        const nextRequest = result?.request && typeof result.request === 'object' ? result.request : null;

        setRequestState(requestId, (current) => ({
          busy: false,
          data: nextRequest || current.data,
          actionError: '',
        }));

        setActionNotice({
          severity: 'success',
          message: 'Pedido tomado correctamente.',
        });

        await loadRequestDetail(requestId, { force: true });
      } catch (requestError) {
        const message =
          requestError?.response?.data?.message ||
          requestError?.message ||
          'No se pudo tomar este pedido.';

        setRequestState(requestId, {
          busy: false,
          actionError: String(message),
        });
        await loadRequestDetail(requestId, { force: true });
      }
    },
    [loadRequestDetail, onTakeRequest, setRequestState]
  );

  const handleAcceptRequest = useCallback(
    async (item) => {
      const requestId = getNotificationRequestId(item);
      if (requestId < 1 || typeof onAcceptRequest !== 'function') {
        return;
      }

      setActionNotice(null);
      setExpandedRequestId(requestId);
      setRequestState(requestId, {
        busy: true,
        actionError: '',
      });

      try {
        const result = await onAcceptRequest({
          notificationId: Number(item?.id || 0) || 0,
          requestId,
        });
        const nextRequest = result?.request && typeof result.request === 'object' ? result.request : null;

        setRequestState(requestId, (current) => ({
          busy: false,
          data: nextRequest || current.data,
          actionError: '',
        }));

        setActionNotice({
          severity: 'success',
          message: 'El pedido quedó agregado a la mesa.',
        });

        await loadRequestDetail(requestId, { force: true });
        setRetainedRequestItems((prev) => {
          if (!(requestId in prev)) {
            return prev;
          }

          const nextState = { ...prev };
          delete nextState[requestId];
          return nextState;
        });
        if (expandedRequestId === requestId) {
          setExpandedRequestId(0);
        }
      } catch (requestError) {
        const message =
          requestError?.response?.data?.message ||
          requestError?.message ||
          'No se pudo autorizar este pedido.';

        setRequestState(requestId, {
          busy: false,
          actionError: String(message),
        });
        await loadRequestDetail(requestId, { force: true });
      }
    },
    [expandedRequestId, loadRequestDetail, onAcceptRequest, setRequestState]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
          background: (theme) => theme.appBrand.dialogBackground,
          boxShadow: '0 28px 64px rgba(0,0,0,0.32)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1.2,
          background:
            'radial-gradient(circle at top right, rgba(230, 189, 23, 0.12) 0%, transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.2}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Avatar
                variant="rounded"
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: 'rgba(230, 189, 23, 0.16)',
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <NotificationsActiveRoundedIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Centro de avisos
                </Typography>
                <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                  Revisa lo que sigue pendiente, lo que ya está listo y lo que todavía no has visto.
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={onClose}
              aria-label="Cerrar centro de avisos"
              sx={{
                alignSelf: 'flex-start',
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'rgba(255,255,255,0.03)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Box />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip variant="outlined" color={unreadCount > 0 ? 'warning' : 'default'} label={`${unreadCount} sin ver`} />
              <Chip variant="outlined" label={`${items.length} vigentes`} />
            </Stack>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={1.5}>
          {error ? <Alert severity="warning">{error}</Alert> : null}
          {actionNotice ? <Alert severity={actionNotice.severity}>{actionNotice.message}</Alert> : null}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              onClick={onRefresh}
              disabled={loading}
              sx={{ borderRadius: OP_CONTROL_RADIUS }}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              onClick={() => onMarkAllRead?.()}
              disabled={loading || unreadCount < 1}
              sx={{ borderRadius: OP_CONTROL_RADIUS }}
            >
              Marcar todo visto
            </Button>
          </Stack>

          {!visibleItems.length ? (
            <QuietInfoPanel description="No hay avisos vigentes en este momento." />
          ) : null}

          {visibleItems.map((item, index) => {
            const visual = getNotificationVisual(item);
            const Icon = visual.icon;
            const requestId = getNotificationRequestId(item);
            const isExpanded = expandedRequestId === requestId && requestId > 0;
            const requestState = getRequestEntryState(requestStates[requestId]);
            const canViewRequest = String(item?.type || '').trim() === 'new_request' && requestId > 0;
            const canClaimRequest = getCanClaimRequest(item, requestState.data);
            const canAcceptRequest = getCanAcceptRequest(item, requestState.data);

            return (
              <Box
                key={item.id || `${item.tag}-${index}`}
                sx={{
                  p: 1.5,
                  borderRadius: OP_CARD_RADIUS,
                  border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: '0 12px 26px rgba(0,0,0,0.16)',
                }}
              >
                <Stack spacing={1}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="flex-start">
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: visual.bg,
                          color: visual.color,
                          border: '1px solid',
                          borderColor: 'divider',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                        }}
                      >
                        <Icon />
                      </Avatar>
                      <Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                          <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                          <Chip
                            size="small"
                            label={visual.label}
                            sx={{
                              borderRadius: 999,
                              bgcolor: visual.bg,
                              color: visual.color,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          />
                        </Stack>
                        {item.body ? (
                          <Typography sx={{ mt: 0.4, color: 'text.secondary' }}>{item.body}</Typography>
                        ) : null}
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" variant="outlined" label={getAreaLabel(item.area)} />
                      <Chip size="small" variant="outlined" color={getStatusColor(item)} label={item.status_label || 'Nuevo'} />
                      {!item.is_read ? <Chip size="small" color="warning" label="Sin ver" /> : null}
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: OP_INNER_RADIUS,
                      background: (theme) => theme.appBrand.frostedPanel,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                          {formatDateTimeLabel(item.created_at)}
                        </Typography>
                        {item.meta?.table_name ? (
                          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                            Cuenta: <strong>{item.meta.table_name}</strong>
                          </Typography>
                        ) : null}
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {canViewRequest ? (
                          <Button
                            variant={isExpanded ? 'contained' : 'outlined'}
                            size="small"
                            startIcon={<VisibilityRoundedIcon />}
                            onClick={() => handleToggleRequest(item)}
                            sx={{ borderRadius: OP_CONTROL_RADIUS }}
                          >
                            {isExpanded ? 'Ocultar pedido' : 'Ver pedido'}
                          </Button>
                        ) : null}
                        {canClaimRequest ? (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AssignmentTurnedInRoundedIcon />}
                            onClick={() => handleTakeRequest(item)}
                            disabled={requestState.busy}
                            sx={{ borderRadius: OP_CONTROL_RADIUS }}
                          >
                            Tomar pedido
                          </Button>
                        ) : null}
                        {canAcceptRequest ? (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<RoomServiceRoundedIcon />}
                            onClick={() => handleAcceptRequest(item)}
                            disabled={requestState.busy}
                            sx={{ borderRadius: OP_CONTROL_RADIUS }}
                          >
                            Agregar a la mesa
                          </Button>
                        ) : null}
                        {item.url ? (
                          <Button
                            variant="outlined"
                            size="small"
                            href={item.url}
                            startIcon={<OpenInNewRoundedIcon />}
                            sx={{ borderRadius: OP_CONTROL_RADIUS }}
                          >
                            Abrir
                          </Button>
                        ) : null}
                        {item.type === 'table_message_new' && item.is_active !== false ? (
                          <Button
                            variant="contained"
                            size="small"
                            color="warning"
                            startIcon={<TaskAltRoundedIcon />}
                            onClick={async () => {
                              try {
                                await onAttendTableMessage?.(item);
                              } catch {
                                // El shell ya muestra el error operativo.
                              }
                            }}
                            sx={{ borderRadius: OP_CONTROL_RADIUS }}
                          >
                            Atender y cerrar
                          </Button>
                        ) : null}
                        {!item.is_read && item.type !== 'table_message_new' ? (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => onMarkRead?.(item.id)}
                            sx={{ borderRadius: OP_CONTROL_RADIUS }}
                          >
                            Marcar visto
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>

                    <Collapse in={isExpanded} mountOnEnter unmountOnExit>
                      <RequestInlineDetail
                        item={item}
                        requestState={requestState}
                        onRefreshRequest={loadRequestDetail}
                        onTakeRequest={handleTakeRequest}
                        onAcceptRequest={handleAcceptRequest}
                      />
                    </Collapse>
                  </Box>

                  {index < visibleItems.length - 1 ? <Divider sx={{ borderColor: 'divider' }} /> : null}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
