import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import TakeoutDiningRoundedIcon from '@mui/icons-material/TakeoutDiningRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import FastfoodRoundedIcon from '@mui/icons-material/FastfoodRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Chip from '@mui/material/Chip';
import { useLocation, useNavigate } from 'react-router-dom';
import WaiterShell from '../components/waiter/WaiterShell.jsx';
import QuietInfoPanel from '../components/common/QuietInfoPanel.jsx';
import { useWaiterSession } from '../context/WaiterSessionContext.jsx';
import useWaiterLiveStream from '../hooks/useWaiterLiveStream.js';
import {
  fetchTableMessages,
  fetchWaiterTables,
  markWaiterTableDelivered,
  replyTableMessage,
  resolveTableMessages,
  updateWaiterTableFulfillment,
} from '../services/tableService.js';
import {
  emitWaiterOperationalRefresh,
  subscribeWaiterOperationalRefresh,
} from '../utils/waiterOperationalRefresh.js';
import { subscribeToTeamPushMessages } from '../utils/teamPush.js';
import { formatPrice } from '../utils/price.js';
import {
  formatPrepElapsed,
  getFulfillmentModeChipColor,
  getFulfillmentModeLabel,
  sanitizeFulfillmentMode,
} from '../utils/fulfillment.js';
import {
  getAvailabilityLabel,
  getAvailabilitySeverity,
  getFriendlyRequestStatus,
  getItemServiceLabel,
  getRequestOriginLabel,
  getServiceStageLabel,
  getServiceStageSeverity,
  getTableKindLabel,
} from '../utils/teamStatus.js';
import {
  OP_CARD_RADIUS,
  OP_CONTROL_RADIUS,
  OP_INNER_RADIUS,
  OP_ITEM_RADIUS,
  OP_PANEL_RADIUS,
} from '../theme/operationalRadii.js';

const TABLE_FILTERS = [
  { id: 'all', label: 'Todo' },
  { id: 'tables', label: 'Mesas' },
  { id: 'takeaway', label: 'Para llevar' },
  { id: 'mine', label: 'A mi cargo' },
  { id: 'review', label: 'Por revisar' },
  { id: 'partial_ready', label: 'Listo parcial' },
  { id: 'ready', label: 'Listo para entregar' },
];

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
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function formatItemTime(item) {
  const label = String(item?.order_label || '').trim();
  const raw = item?.order_time;

  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 1000) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  if (label) {
    return label;
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }

  return '';
}

function buildTableKey(table) {
  return `${table?.type || 'dine_in'}-${table?.id || 0}`;
}

function pushAlert(setAlerts, nextAlert) {
  setAlerts((prev) => {
    const deduped = prev.filter((alert) => alert.message !== nextAlert.message);
    return [nextAlert, ...deduped].slice(0, 4);
  });
}

function getCustomerLabel(table) {
  const directLabel = String(table?.customer_label || '').trim();
  if (directLabel) {
    return directLabel;
  }

  const pickupCustomer = String(table?.pickup?.customer_name || '').trim();
  if (pickupCustomer) {
    return pickupCustomer;
  }

  const realCustomer =
    table?.consumption?.customer?.name || table?.consumption?.customer?.email || '';

  if (realCustomer) {
    const normalizedCustomer = String(realCustomer).trim().toLowerCase();
    const normalizedTable = String(table?.name || '').trim().toLowerCase();

    if (normalizedCustomer && normalizedCustomer !== normalizedTable) {
      return realCustomer;
    }
  }

  const fallbackRequest =
    table?.current_request?.request_source === 'customer'
      ? table.current_request
      : table?.latest_request?.request_source === 'customer'
        ? table.latest_request
        : null;
  const fallbackLabel = String(fallbackRequest?.client_label || '').trim();

  if (!fallbackLabel) {
    return '';
  }

  const normalizedFallback = fallbackLabel.toLowerCase();
  const normalizedTable = String(table?.name || '').trim().toLowerCase();

  if (normalizedFallback === normalizedTable) {
    return '';
  }

  return fallbackLabel;
}

function getCustomerPhone(table) {
  return String(table?.pickup?.phone || table?.consumption?.customer?.phone || '').trim();
}

function normalizePrimaryPersonLabel(value) {
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

function getCustomerDisplayName(table) {
  return normalizePrimaryPersonLabel(table?.customer_display_name || getCustomerLabel(table) || '');
}

function getCustomerSecondaryLabel(table) {
  return String(
    table?.customer_secondary_label ||
      table?.consumption?.customer?.secondary_label ||
      getCustomerPhone(table) ||
      table?.consumption?.customer?.email ||
      ''
  ).trim();
}

function getPickupWindowLabel(table) {
  return String(table?.pickup?.window_label || '').trim();
}

function getOwnerDisplayName(table) {
  return normalizePrimaryPersonLabel(table?.owner_display_name || table?.managed_by || '');
}

function getSharedStaffNames(table) {
  return Array.isArray(table?.shared_staff_display_names)
    ? table.shared_staff_display_names
        .map((value) => normalizePrimaryPersonLabel(value))
        .filter((value, index, values) => value && values.indexOf(value) === index)
    : [];
}

function getPreviewItems(table, limit = 4) {
  return Array.isArray(table?.consumption?.items) ? table.consumption.items.slice(0, limit) : [];
}

function getTableHeaderIcon(table) {
  return String(table?.type || '').trim() === 'takeaway'
    ? TakeoutDiningRoundedIcon
    : TableRestaurantOutlinedIcon;
}

function getTableHeaderBackground(table) {
  const stage = String(table?.service_stage || '').trim();

  if (stage === 'ready' || stage === 'partial_ready') {
    return 'linear-gradient(135deg, rgba(89, 197, 112, 0.24) 0%, rgba(89, 197, 112, 0.08) 100%)';
  }

  if (stage === 'review') {
    return 'linear-gradient(135deg, rgba(36, 181, 255, 0.22) 0%, rgba(36, 181, 255, 0.07) 100%)';
  }

  if (String(table?.type || '').trim() === 'takeaway') {
    return 'linear-gradient(135deg, rgba(230, 189, 23, 0.24) 0%, rgba(230, 189, 23, 0.08) 100%)';
  }

  return 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)';
}

function getItemStateColor(item) {
  const state = String(item?.service_state || '').trim();

  if (state === 'ready') return 'success';
  if (state === 'delivered') return 'default';
  if (state === 'preparing') return 'warning';
  return 'info';
}

function formatMessageTimeLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTableMessageTone(message) {
  const role = String(message?.sender_role || '').trim();

  if (role === 'customer') {
    return {
      align: 'flex-start',
      background: 'rgba(36, 181, 255, 0.09)',
      borderColor: 'rgba(36, 181, 255, 0.18)',
    };
  }

  if (role === 'system') {
    return {
      align: 'center',
      background: 'rgba(89, 197, 112, 0.1)',
      borderColor: 'rgba(89, 197, 112, 0.2)',
    };
  }

  return {
    align: 'flex-end',
    background: 'rgba(230, 189, 23, 0.12)',
    borderColor: 'rgba(230, 189, 23, 0.2)',
  };
}

function ProductPill({ item }) {
  const imageUrl = String(item?.image_url || '').trim();
  const actorLabel = normalizePrimaryPersonLabel(item?.staff_display_name || item?.seller_name || '');

  return (
    <Box
      sx={{
        minWidth: 180,
        maxWidth: 220,
        p: 1,
        borderRadius: OP_ITEM_RADIUS,
        border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar
          variant="rounded"
          src={imageUrl || undefined}
          alt={item?.display_name || item?.name || 'Producto'}
          sx={{
            width: 54,
            height: 54,
            bgcolor: (theme) => theme.appBrand.imageFallbackBg,
            color: 'primary.main',
          }}
        >
          <FastfoodRoundedIcon />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 700 }}>
            {item?.display_name || item?.name}
          </Typography>
          <Typography noWrap sx={{ color: 'text.secondary', fontSize: 13 }}>
            x{item?.qty || 0} · {item?.display_state || getItemServiceLabel(item)}
          </Typography>
          {actorLabel ? (
            <Typography noWrap sx={{ color: 'text.secondary', fontSize: 12 }}>
              {actorLabel}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

function InfoPanel({ icon, label, value, secondary = '', accent = 'rgba(255,255,255,0.03)' }) {
  const IconComponent = icon;

  return (
    <Box
      sx={{
        flex: 1,
        p: 1.25,
        borderRadius: OP_INNER_RADIUS,
        border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
        background: `linear-gradient(180deg, ${accent} 0%, rgba(255,255,255,0.02) 100%)`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', fontSize: 13 }}>
        {IconComponent ? <IconComponent fontSize="small" /> : null}
        <Typography sx={{ fontSize: 13 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ mt: 0.55, fontWeight: 700 }}>{value}</Typography>
      {secondary ? (
        <Typography sx={{ mt: 0.35, color: 'text.secondary', fontSize: 13 }}>{secondary}</Typography>
      ) : null}
    </Box>
  );
}

function SectionPanel({ title, eyebrow = '', children }) {
  return (
    <Box
      sx={{
        p: 1.6,
        borderRadius: OP_INNER_RADIUS,
        border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
        background: (theme) => theme.appBrand.frostedPanel,
        boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
      }}
    >
      <Box sx={{ mb: 1.1 }}>
        {eyebrow ? (
          <Typography sx={{ fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: 'text.secondary' }}>
            {eyebrow}
          </Typography>
        ) : null}
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}

function ProductRow({ item, compact = false }) {
  const imageSize = compact ? 58 : 64;
  const label = item.display_name || item.name;
  const stateLabel = item.display_state || getItemServiceLabel(item);
  const actorLabel = normalizePrimaryPersonLabel(item.staff_display_name || item.seller_name || '');
  const fulfillmentMode = sanitizeFulfillmentMode(item?.fulfillment_mode);
  const prepTimer =
    String(item?.service_state || '').trim() === 'preparing' && Number(item?.preparing_started_at || 0) > 0
      ? formatPrepElapsed(Math.max(0, Math.floor((Date.now() - Number(item.preparing_started_at || 0)) / 1000)))
      : Number(item?.elapsed_prep_seconds || 0) > 0
        ? formatPrepElapsed(item.elapsed_prep_seconds)
        : '';

  return (
    <Box
      sx={{
        p: compact ? 1.15 : 1.3,
        borderRadius: OP_ITEM_RADIUS,
        border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1.2} alignItems="flex-start">
        <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
          <Avatar
            variant="rounded"
            src={item.image_url || undefined}
            alt={label || 'Producto'}
            sx={{
              width: imageSize,
              height: imageSize,
              bgcolor: (theme) => theme.appBrand.imageFallbackBg,
              color: 'primary.main',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <FastfoodRoundedIcon />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography sx={{ fontWeight: 700 }}>
                {label} x{item.qty}
              </Typography>
              {stateLabel ? (
                <Chip
                  size="small"
                  color={getItemStateColor(item)}
                  variant="outlined"
                  label={stateLabel}
                  sx={{ height: 24 }}
                />
              ) : null}
              <Chip
                size="small"
                color={getFulfillmentModeChipColor(fulfillmentMode)}
                variant="outlined"
                icon={fulfillmentMode === 'takeaway' ? <TakeoutDiningRoundedIcon /> : <TableRestaurantOutlinedIcon />}
                label={getFulfillmentModeLabel(fulfillmentMode)}
                sx={{ height: 24 }}
              />
            </Stack>
            {item.note ? (
              <Typography sx={{ mt: 0.3, color: 'text.secondary', fontSize: 13 }}>
                {item.note}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap" sx={{ mt: 0.7 }}>
              {actorLabel ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  Agregado por <strong>{actorLabel}</strong>
                </Typography>
              ) : null}
              {formatItemTime(item) ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  Hora <strong>{formatItemTime(item)}</strong>
                </Typography>
              ) : null}
              {prepTimer ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  Preparando <strong>{prepTimer}</strong>
                </Typography>
              ) : null}
            </Stack>
          </Box>
        </Stack>
        <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatPrice(item.total ?? 0)}</Typography>
      </Stack>
    </Box>
  );
}

function getTableDescription(table) {
  const pickupWindow = getPickupWindowLabel(table);
  if (String(table?.type || '').trim() === 'takeaway' && pickupWindow) {
    return `Retiro previsto ${pickupWindow}.`;
  }

  if (table?.service_note) {
    return table.service_note;
  }

  if (table?.availability_reason) {
    return table.availability_reason;
  }

  return 'Lista para seguir trabajando.';
}

function getReadyItems(table) {
  return Array.isArray(table?.consumption?.items)
    ? table.consumption.items.filter((item) => String(item?.service_state || '').trim() === 'ready')
    : [];
}

function getReadyCountsLabel(table) {
  const readyCount = Number(table?.service_counts?.ready_count ?? 0) || 0;
  const pendingCount = Number(table?.service_counts?.pending_count ?? 0) || 0;
  const deliveredCount = Number(table?.service_counts?.delivered_count ?? 0) || 0;
  const parts = [];

  if (readyCount > 0) {
    parts.push(`${readyCount} listos`);
  }

  if (pendingCount > 0) {
    parts.push(`${pendingCount} en atención`);
  }

  if (deliveredCount > 0) {
    parts.push(`${deliveredCount} entregados`);
  }

  return parts.join(' · ');
}

export default function WaiterTablesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useWaiterSession();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [tableMessages, setTableMessages] = useState([]);
  const [tableMessagesError, setTableMessagesError] = useState('');
  const [tableMessagesLoading, setTableMessagesLoading] = useState(false);
  const [tableMessagesPendingCount, setTableMessagesPendingCount] = useState(0);
  const [tableMessageAction, setTableMessageAction] = useState('');
  const selectedTableRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);
  const handledQueryTableTokenRef = useRef('');
  const requestedTableToken = useMemo(
    () => new URLSearchParams(location.search).get('table_token') || '',
    [location.search]
  );

  const loadSelectedTableMessages = useCallback(
    async (table) => {
      const nextTable = table || selectedTableRef.current;
      if (!nextTable?.table_token) {
        setTableMessages([]);
        setTableMessagesPendingCount(0);
        setTableMessagesError('');
        return;
      }

      try {
        setTableMessagesLoading(true);
        setTableMessagesError('');
        const data = await fetchTableMessages({ tableToken: nextTable.table_token });
        setTableMessages(Array.isArray(data?.items) ? data.items : []);
        setTableMessagesPendingCount(Number(data?.pending_count ?? 0) || 0);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'No se pudo cargar la conversación de esta cuenta.';
        setTableMessagesError(String(message));
      } finally {
        setTableMessagesLoading(false);
      }
    },
    []
  );

  const loadTables = useCallback(async () => {
    if (!session?.session_token) {
      return;
    }

    const hasVisibleData = hasLoadedOnceRef.current;

    if (!hasVisibleData) {
      setLoading(true);
    }

    try {
      const data = await fetchWaiterTables({ sessionToken: session.session_token });
      const nextTables = Array.isArray(data?.items) ? data.items : [];

      setTables(nextTables);
      setSelectedTable((current) => {
        if (!current) {
          return current;
        }

        const updated = nextTables.find((table) => buildTableKey(table) === buildTableKey(current));
        selectedTableRef.current = updated || current;
        return updated || current;
      });
      hasLoadedOnceRef.current = true;
      setError('');
    } catch (err) {
      if (!hasVisibleData) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'No se pudo cargar el estado del servicio.';
        setError(String(message));
      }
    } finally {
      setLoading(false);
    }
  }, [session?.session_token]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    selectedTableRef.current = selectedTable;
  }, [selectedTable]);

  useEffect(() => {
    if (!requestedTableToken || !tables.length) {
      return;
    }

    if (handledQueryTableTokenRef.current === requestedTableToken) {
      return;
    }

    const matchedTable = tables.find(
      (table) => String(table?.table_token || '').trim() === requestedTableToken
    );

    if (!matchedTable) {
      return;
    }

    handledQueryTableTokenRef.current = requestedTableToken;
    selectedTableRef.current = matchedTable;
    setSelectedTable(matchedTable);
  }, [requestedTableToken, tables]);

  const handleServiceRealtimeSync = useCallback(() => {
    loadTables();

    if (selectedTableRef.current?.table_token) {
      loadSelectedTableMessages(selectedTableRef.current);
    }
  }, [loadSelectedTableMessages, loadTables]);

  useWaiterLiveStream({
    sessionToken: session?.session_token || '',
    scope: 'service',
    enabled: Boolean(session?.session_token),
    onSync: handleServiceRealtimeSync,
  });

  useEffect(() => {
    const intervalId = window.setInterval(loadTables, 20000);
    return () => window.clearInterval(intervalId);
  }, [loadTables]);

  useEffect(
    () =>
      subscribeToTeamPushMessages(() => {
        handleServiceRealtimeSync();
      }),
    [handleServiceRealtimeSync]
  );

  useEffect(
    () =>
      subscribeWaiterOperationalRefresh(() => {
        handleServiceRealtimeSync();
      }, { scopes: ['service'] }),
    [handleServiceRealtimeSync]
  );

  useEffect(() => {
    const activeTable = selectedTable;

    if (!activeTable?.table_token) {
      setTableMessages([]);
      setTableMessagesPendingCount(0);
      setTableMessagesError('');
      setMessageDraft('');
      return;
    }

    loadSelectedTableMessages(activeTable);
  }, [loadSelectedTableMessages, selectedTable]);

  useEffect(() => {
    if (!selectedTable?.table_token) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadSelectedTableMessages(selectedTableRef.current);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [loadSelectedTableMessages, selectedTable?.table_token]);

  const filteredTables = useMemo(() => {
    const sorted = [...tables].sort((a, b) => {
      const serviceWeight = {
        review: 0,
        partial_ready: 1,
        ready: 2,
        working: 3,
        added: 4,
        delivered: 5,
        '': 6,
      };
      const availabilityWeight = {
        pending: 0,
        mine: 1,
        shared: 2,
        available: 3,
        busy: 4,
        view_only: 5,
      };

      const serviceDiff =
        (serviceWeight[String(a?.service_stage || '')] ?? 9) -
        (serviceWeight[String(b?.service_stage || '')] ?? 9);

      if (serviceDiff !== 0) {
        return serviceDiff;
      }

      const availabilityDiff =
        (availabilityWeight[String(a?.availability || '')] ?? 9) -
        (availabilityWeight[String(b?.availability || '')] ?? 9);

      if (availabilityDiff !== 0) {
        return availabilityDiff;
      }

      return String(a?.name || '').localeCompare(String(b?.name || ''), 'es');
    });

    return sorted.filter((table) => {
      const type = String(table?.type || '').trim();
      const availability = String(table?.availability || '').trim();
      const serviceStage = String(table?.service_stage || '').trim();

      if (activeFilter === 'tables') {
        return type === 'dine_in';
      }

      if (activeFilter === 'takeaway') {
        return type === 'takeaway';
      }

      if (activeFilter === 'mine') {
        return availability === 'mine';
      }

      if (activeFilter === 'review') {
        return serviceStage === 'review' || availability === 'pending';
      }

      if (activeFilter === 'partial_ready') {
        return serviceStage === 'partial_ready';
      }

      if (activeFilter === 'ready') {
        return serviceStage === 'ready';
      }

      return true;
    });
  }, [activeFilter, tables]);

  const handleDeliver = async (table) => {
    if (!session?.session_token || !table?.table_token) {
      return;
    }

    const actionKey = buildTableKey(table);
    setActionLoading(actionKey);
    setError('');

    try {
      const result = await markWaiterTableDelivered({
        sessionToken: session.session_token,
        tableToken: table.table_token,
      });

      pushAlert(setAlerts, {
        id: `${actionKey}-delivered-${Date.now()}`,
        severity: 'success',
        message:
          Number(result?.updated_lines || 0) > 0
            ? `${table.name} quedó marcada como entregada.`
            : `Entrega confirmada en ${table.name}.`,
      });
      emitWaiterOperationalRefresh({
        scopes: ['service', 'notifications'],
        reason: 'table-delivered',
        tableToken: table.table_token,
      });
      await loadTables();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo confirmar la entrega.';
      setError(String(message));
    } finally {
      setActionLoading('');
    }
  };

  const handleUpdateTableFulfillment = async ({
    table,
    fulfillmentMode,
    mode = 'all',
    lineIds = [],
  }) => {
    if (!session?.session_token || !table?.table_token) {
      return;
    }

    const actionKey = `${buildTableKey(table)}-fulfillment-${mode}-${lineIds.join(',')}`;
    setActionLoading(actionKey);
    setError('');

    try {
      await updateWaiterTableFulfillment({
        sessionToken: session.session_token,
        tableToken: table.table_token,
        fulfillmentMode,
        mode,
        lineIds,
      });

      pushAlert(setAlerts, {
        id: `${actionKey}-${Date.now()}`,
        severity: 'success',
        message:
          mode === 'selected'
            ? `Línea actualizada a ${getFulfillmentModeLabel(fulfillmentMode).toLowerCase()} en ${table.name}.`
            : `${table.name} quedó en modo ${getFulfillmentModeLabel(fulfillmentMode).toLowerCase()}.`,
      });
      emitWaiterOperationalRefresh({
        scopes: ['service'],
        reason: 'table-fulfillment-updated',
        tableToken: table.table_token,
      });
      await loadTables();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo actualizar este modo de consumo.';
      setError(String(message));
    } finally {
      setActionLoading('');
    }
  };

  const handleReplyToTable = async () => {
    if (!session?.session_token || !selectedTable?.table_token || !messageDraft.trim()) {
      return;
    }

    setTableMessageAction('reply');
    setTableMessagesError('');

    try {
      await replyTableMessage({
        sessionToken: session.session_token,
        tableToken: selectedTable.table_token,
        messageText: messageDraft.trim(),
      });

      setMessageDraft('');
      emitWaiterOperationalRefresh({
        scopes: ['service', 'notifications'],
        reason: 'table-message-replied',
        tableToken: selectedTable.table_token,
      });
      await Promise.all([loadSelectedTableMessages(selectedTable), loadTables()]);
      pushAlert(setAlerts, {
        id: `reply-${buildTableKey(selectedTable)}-${Date.now()}`,
        severity: 'success',
        message: `Respuesta enviada a ${selectedTable.name}.`,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo enviar la respuesta.';
      setTableMessagesError(String(message));
    } finally {
      setTableMessageAction('');
    }
  };

  const handleResolveTableThread = async () => {
    if (!session?.session_token || !selectedTable?.table_token) {
      return;
    }

    setTableMessageAction('resolve');
    setTableMessagesError('');

    try {
      await resolveTableMessages({
        sessionToken: session.session_token,
        tableToken: selectedTable.table_token,
      });

      setMessageDraft('');
      emitWaiterOperationalRefresh({
        scopes: ['service', 'notifications'],
        reason: 'table-message-resolved',
        tableToken: selectedTable.table_token,
      });
      await Promise.all([loadSelectedTableMessages(selectedTable), loadTables()]);
      pushAlert(setAlerts, {
        id: `resolved-${buildTableKey(selectedTable)}-${Date.now()}`,
        severity: 'success',
        message: `Solicitud cerrada en ${selectedTable.name}.`,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo cerrar la solicitud.';
      setTableMessagesError(String(message));
    } finally {
      setTableMessageAction('');
    }
  };

  const selectedCustomerName = selectedTable ? getCustomerDisplayName(selectedTable) : '';
  const selectedCustomerSecondary = selectedTable ? getCustomerSecondaryLabel(selectedTable) : '';
  const selectedOwnerDisplayName = selectedTable ? getOwnerDisplayName(selectedTable) : '';
  const selectedSharedStaffNames = selectedTable ? getSharedStaffNames(selectedTable) : [];
  const SelectedHeaderIcon = selectedTable ? getTableHeaderIcon(selectedTable) : TableRestaurantOutlinedIcon;

  return (
    <WaiterShell title="Mesas y para llevar" subtitle="Consulta quién atiende cada pedido y sigue el servicio sin perder detalle.">
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {TABLE_FILTERS.map((filter) => (
            <Button
              key={filter.id}
              size="small"
              variant={activeFilter === filter.id ? 'contained' : 'outlined'}
              onClick={() => setActiveFilter(filter.id)}
              sx={{ borderRadius: OP_CONTROL_RADIUS, minHeight: 38, px: 1.6 }}
            >
              {filter.label}
            </Button>
          ))}
        </Stack>

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

        {!loading && filteredTables.length === 0 ? (
          <QuietInfoPanel description="No hay registros para este filtro en este momento." />
        ) : null}

        {!loading &&
          filteredTables.map((table) => {
            const actionKey = buildTableKey(table);
            const customerLabel = getCustomerDisplayName(table);
            const customerSecondary = getCustomerSecondaryLabel(table);
            const pickupWindow = getPickupWindowLabel(table);
            const availabilityLabel = getAvailabilityLabel(table.availability, table.managed_by);
            const serviceLabel = table.service_label || getServiceStageLabel(table.service_stage);
            const ownerDisplayName = getOwnerDisplayName(table);
            const sharedStaffNames = getSharedStaffNames(table);
            const previewItems = getPreviewItems(table);
            const HeaderIcon = getTableHeaderIcon(table);
            const openMenuLabel = table.can_direct_order
              ? 'Ir al menú'
              : table.availability === 'busy'
                ? 'Atiende otra persona'
                : table.availability === 'pending'
                  ? 'Por revisar'
                  : 'Solo consulta';

            return (
              <Card
                key={actionKey}
                onClick={() => setSelectedTable(table)}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: OP_CARD_RADIUS,
                  border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                  background: (theme) => theme.appBrand.dialogBackground,
                  boxShadow: '0 18px 40px rgba(0,0,0,0.24)',
                  cursor: 'pointer',
                  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at top right, ${
                      table.service_stage === 'ready' || table.service_stage === 'partial_ready'
                        ? 'rgba(89, 197, 112, 0.12)'
                        : table.service_stage === 'review'
                          ? 'rgba(36, 181, 255, 0.1)'
                          : 'rgba(230, 189, 23, 0.08)'
                    } 0%, transparent 42%)`,
                    pointerEvents: 'none',
                  },
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.28)',
                    borderColor: 'rgba(230, 189, 23, 0.34)',
                  },
                }}
              >
                <CardContent sx={{ position: 'relative', p: { xs: 1.5, sm: 2 } }}>
                  <Stack
                    direction={{ xs: 'column', xl: 'row' }}
                    spacing={1.8}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', xl: 'center' }}
                  >
                    <Stack spacing={1.4} sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        spacing={1.4}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', lg: 'center' }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Avatar
                            variant="rounded"
                            sx={{
                              width: 58,
                              height: 58,
                              bgcolor: 'rgba(230, 189, 23, 0.18)',
                              color: 'primary.main',
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <HeaderIcon />
                          </Avatar>
                          <Box
                            sx={{
                              px: 1.4,
                              py: 1,
                              borderRadius: OP_INNER_RADIUS,
                              border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                              background: getTableHeaderBackground(table),
                            }}
                          >
                            <Typography sx={{ fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: 'text.secondary' }}>
                              {getTableKindLabel(table.type, table.availability)}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: 28, sm: 32 } }}>
                              {table.name}
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            color={getAvailabilitySeverity(table.availability)}
                            label={availabilityLabel}
                            variant="outlined"
                          />
                          {serviceLabel ? (
                            <Chip
                              size="small"
                              color={getServiceStageSeverity(table.service_stage)}
                              label={serviceLabel}
                              variant="outlined"
                            />
                          ) : null}
                          {table.shared_mode ? (
                            <Chip size="small" color="primary" variant="outlined" icon={<GroupsRoundedIcon />} label="Mesa compartida" />
                          ) : null}
                        </Stack>
                      </Stack>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.1}>
                        <InfoPanel
                          icon={BadgeRoundedIcon}
                          label="Atiende"
                          value={ownerDisplayName || 'Sin responsable asignado'}
                          secondary={
                            table.shared_mode && sharedStaffNames.length > 1
                              ? `La atienden ${sharedStaffNames.join(' y ')}`
                              : ''
                          }
                          accent="rgba(230, 189, 23, 0.09)"
                        />
                        <InfoPanel
                          icon={PersonRoundedIcon}
                          label="Cliente"
                          value={customerLabel || 'Sin nombre registrado'}
                          secondary={customerSecondary}
                          accent="rgba(36, 181, 255, 0.07)"
                        />
                        <InfoPanel
                          icon={Inventory2RoundedIcon}
                          label="Consumo"
                          value={formatPrice(table.consumption?.total_amount ?? 0)}
                          secondary={`${table.consumption?.lines_count || 0} productos · ${table.consumption?.items_count || 0} artículos`}
                          accent="rgba(89, 197, 112, 0.08)"
                        />
                      </Stack>

                      {previewItems.length ? (
                        <Box
                          sx={{
                            px: 1.1,
                            py: 1,
                            borderRadius: OP_INNER_RADIUS,
                            border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.9 }}>
                            <Typography sx={{ fontWeight: 700 }}>Productos activos</Typography>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                              {previewItems.length} visibles
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} useFlexGap sx={{ overflowX: 'auto', pb: 0.2 }}>
                          {previewItems.map((item, index) => (
                            <ProductPill key={`${actionKey}-preview-${item.id || item.name}-${index}`} item={item} />
                          ))}
                          </Stack>
                        </Box>
                      ) : null}

                      <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        spacing={1.2}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', lg: 'center' }}
                      >
                        <Box
                          sx={{
                            px: 1.1,
                            py: 1,
                            borderRadius: OP_INNER_RADIUS,
                            bgcolor: 'rgba(255,255,255,0.025)',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography sx={{ color: 'text.secondary' }}>{getTableDescription(table)}</Typography>
                          {pickupWindow ? (
                            <Typography sx={{ mt: 0.35, color: 'text.secondary', fontSize: 13 }}>
                              Retiro previsto <strong>{pickupWindow}</strong>
                            </Typography>
                          ) : null}
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          {getReadyCountsLabel(table) ? (
                            <Chip size="small" variant="outlined" label={getReadyCountsLabel(table)} />
                          ) : null}
                          <Button
                            variant="outlined"
                            startIcon={<VisibilityOutlinedIcon />}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedTable(table);
                            }}
                          >
                            Ver detalle
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<TableRestaurantOutlinedIcon />}
                            disabled={!table.can_direct_order}
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate({
                                pathname: '/equipo/menu',
                                search: `?table_token=${encodeURIComponent(table.table_token)}`,
                              });
                            }}
                          >
                            {openMenuLabel}
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
      </Stack>

      <Dialog
        open={Boolean(selectedTable)}
        onClose={() => setSelectedTable(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: OP_PANEL_RADIUS,
            background: (theme) => theme.appBrand.dialogBackground,
            border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
          },
        }}
      >
        {selectedTable ? (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'rgba(230, 189, 23, 0.18)',
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <SelectedHeaderIcon />
                </Avatar>
                <Box
                  sx={{
                    px: 1.5,
                    py: 1.2,
                    borderRadius: OP_INNER_RADIUS,
                    border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                    background: getTableHeaderBackground(selectedTable),
                  }}
                >
                  <Typography sx={{ fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: 'text.secondary' }}>
                    {getTableKindLabel(selectedTable.type, selectedTable.availability)}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {selectedTable.name}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {selectedTable.service_label || getServiceStageLabel(selectedTable.service_stage) || 'Lista para pedir'}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ pb: 3 }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} useFlexGap flexWrap="wrap">
                  <Chip
                    color={getAvailabilitySeverity(selectedTable.availability)}
                    variant="outlined"
                    label={getAvailabilityLabel(selectedTable.availability, selectedTable.managed_by)}
                  />
                  {(selectedTable.service_label || getServiceStageLabel(selectedTable.service_stage)) ? (
                    <Chip
                      color={getServiceStageSeverity(selectedTable.service_stage)}
                      variant="outlined"
                      label={selectedTable.service_label || getServiceStageLabel(selectedTable.service_stage)}
                    />
                  ) : null}
                  {selectedOwnerDisplayName ? (
                    <Chip variant="outlined" icon={<BadgeRoundedIcon />} label={`Atiende: ${selectedOwnerDisplayName}`} />
                  ) : null}
                  {selectedCustomerName ? (
                    <Chip variant="outlined" icon={<PersonRoundedIcon />} label={`Cliente: ${selectedCustomerName}`} />
                  ) : null}
                  {getPickupWindowLabel(selectedTable) ? (
                    <Chip variant="outlined" icon={<ScheduleRoundedIcon />} label={`Retiro: ${getPickupWindowLabel(selectedTable)}`} />
                  ) : null}
                  {selectedTable.shared_mode ? (
                    <Chip variant="outlined" color="primary" icon={<GroupsRoundedIcon />} label="Mesa compartida" />
                  ) : null}
                </Stack>

                {selectedTable.availability_reason ? (
                  <Alert severity={selectedTable.availability === 'view_only' ? 'warning' : 'info'}>
                    {selectedTable.availability_reason}
                  </Alert>
                ) : null}

                {selectedTable.service_note ? (
                  <Alert
                    severity={
                      selectedTable.service_stage === 'ready' ||
                      selectedTable.service_stage === 'partial_ready'
                        ? 'success'
                        : 'info'
                    }
                  >
                    {selectedTable.service_note}
                  </Alert>
                ) : null}

                {!selectedTable.consumption?.lines_count && selectedTable.service_stage === 'added' ? (
                  <Alert severity="info">
                    Esta cuenta se está actualizando. Revisa de nuevo en unos segundos.
                  </Alert>
                ) : null}

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <InfoPanel
                    icon={BadgeRoundedIcon}
                    label="Atiende"
                    value={selectedOwnerDisplayName || 'Sin responsable asignado'}
                    secondary={
                      selectedTable.shared_mode && selectedSharedStaffNames.length > 1
                        ? `La atienden ${selectedSharedStaffNames.join(' y ')}`
                        : ''
                    }
                    accent="rgba(230, 189, 23, 0.09)"
                  />
                  <InfoPanel
                    icon={PersonRoundedIcon}
                    label="Cliente"
                    value={selectedCustomerName || 'Sin nombre registrado'}
                    secondary={selectedCustomerSecondary}
                    accent="rgba(36, 181, 255, 0.07)"
                  />
                  <InfoPanel
                    icon={Inventory2RoundedIcon}
                    label="Consumo actual"
                    value={formatPrice(selectedTable.consumption?.total_amount ?? 0)}
                    secondary={`${selectedTable.consumption?.lines_count || 0} productos · ${selectedTable.consumption?.items_count || 0} artículos${
                      getReadyCountsLabel(selectedTable) ? ` · ${getReadyCountsLabel(selectedTable)}` : ''
                    }`}
                    accent="rgba(89, 197, 112, 0.08)"
                  />
                </Stack>

                {getReadyItems(selectedTable).length ? (
                  <SectionPanel title="Listo para entregar ahora" eyebrow="Entrega">
                    <Stack spacing={1}>
                      {getReadyItems(selectedTable).map((item, index) => (
                        <ProductRow key={`${item.id || item.name}-ready-${index}`} item={item} compact />
                      ))}
                    </Stack>
                  </SectionPanel>
                ) : null}

                <SectionPanel title="Pedido actual" eyebrow="Consumo vivo">
                  {selectedTable.consumption?.items?.length ? (
                    <Stack spacing={1}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                          variant="outlined"
                          startIcon={<TableRestaurantOutlinedIcon />}
                          disabled={Boolean(actionLoading)}
                          onClick={() =>
                            handleUpdateTableFulfillment({
                              table: selectedTable,
                              fulfillmentMode: 'dine_in',
                              mode: 'all',
                              lineIds: [],
                            })
                          }
                        >
                          Todo en mesa
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<TakeoutDiningRoundedIcon />}
                          disabled={Boolean(actionLoading)}
                          onClick={() =>
                            handleUpdateTableFulfillment({
                              table: selectedTable,
                              fulfillmentMode: 'takeaway',
                              mode: 'all',
                              lineIds: [],
                            })
                          }
                        >
                          Todo para llevar
                        </Button>
                      </Stack>
                      {selectedTable.consumption.items.map((item, index) => {
                        const itemFulfillmentMode = sanitizeFulfillmentMode(item?.fulfillment_mode);
                        const lineActionKey = `${buildTableKey(selectedTable)}-fulfillment-selected-${item.id || ''}`;

                        return (
                          <Box key={`${item.id || item.name}-${index}`}>
                            <ProductRow item={item} />
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              sx={{ mt: 0.8 }}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Button
                                size="small"
                                variant={itemFulfillmentMode === 'dine_in' ? 'contained' : 'outlined'}
                                startIcon={<TableRestaurantOutlinedIcon />}
                                disabled={actionLoading === lineActionKey}
                                onClick={() =>
                                  handleUpdateTableFulfillment({
                                    table: selectedTable,
                                    fulfillmentMode: 'dine_in',
                                    mode: 'selected',
                                    lineIds: [item.id],
                                  })
                                }
                              >
                                En mesa
                              </Button>
                              <Button
                                size="small"
                                color="warning"
                                variant={itemFulfillmentMode === 'takeaway' ? 'contained' : 'outlined'}
                                startIcon={<TakeoutDiningRoundedIcon />}
                                disabled={actionLoading === lineActionKey}
                                onClick={() =>
                                  handleUpdateTableFulfillment({
                                    table: selectedTable,
                                    fulfillmentMode: 'takeaway',
                                    mode: 'selected',
                                    lineIds: [item.id],
                                  })
                                }
                              >
                                Para llevar
                              </Button>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography sx={{ color: 'text.secondary' }}>
                      Esta cuenta todavía no muestra productos activos.
                    </Typography>
                  )}
                </SectionPanel>

                <SectionPanel title="Solicitar al mesero" eyebrow="Hilo activo">
                  <Stack spacing={1.2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        variant="outlined"
                        icon={<ChatBubbleOutlineRoundedIcon />}
                        label={`${tableMessagesPendingCount} pendientes`}
                        color={tableMessagesPendingCount > 0 ? 'warning' : 'default'}
                      />
                      {selectedOwnerDisplayName ? (
                        <Chip variant="outlined" icon={<BadgeRoundedIcon />} label={`Atiende ${selectedOwnerDisplayName}`} />
                      ) : null}
                    </Stack>

                    {tableMessagesError ? <Alert severity="warning">{tableMessagesError}</Alert> : null}

                    <Box
                      sx={{
                        maxHeight: 260,
                        overflowY: 'auto',
                        p: 1.1,
                        borderRadius: OP_ITEM_RADIUS,
                        border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                        background: (theme) => theme.appBrand.frostedPanel,
                      }}
                    >
                      <Stack spacing={1}>
                        {!tableMessages.length && !tableMessagesLoading ? (
                          <QuietInfoPanel description="Esta cuenta no tiene solicitudes activas del cliente." />
                        ) : null}

                        {tableMessages.map((message, index) => {
                          const tone = getTableMessageTone(message);

                          return (
                            <Stack
                              key={message.id || `${message.created_at}-${index}`}
                              spacing={0.5}
                              alignItems={tone.align}
                            >
                              <Box
                                sx={{
                                  width: tone.align === 'center' ? '100%' : 'auto',
                                  maxWidth: '88%',
                                  p: 1.1,
                                  borderRadius: OP_ITEM_RADIUS,
                                  border: '1px solid',
                                  borderColor: tone.borderColor,
                                  background: tone.background,
                                }}
                              >
                                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                                    {message.sender_label || (message.sender_role === 'customer' ? 'Cliente' : 'Equipo')}
                                  </Typography>
                                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                                    {formatMessageTimeLabel(message.created_at)}
                                  </Typography>
                                </Stack>
                                <Typography sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                  {message.message_text}
                                </Typography>
                              </Box>
                            </Stack>
                          );
                        })}
                      </Stack>
                    </Box>

                    <TextField
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      placeholder="Responder al cliente desde esta cuenta"
                      multiline
                      minRows={3}
                      fullWidth
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                      <Button
                        variant="outlined"
                        startIcon={<RefreshRoundedIcon />}
                        onClick={() => loadSelectedTableMessages(selectedTable)}
                        disabled={tableMessagesLoading}
                      >
                        Actualizar hilo
                      </Button>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          variant="outlined"
                          color="success"
                          startIcon={<DoneAllRoundedIcon />}
                          onClick={handleResolveTableThread}
                          disabled={tableMessageAction !== '' || !tableMessages.length}
                        >
                          Resolver solicitud
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<SendRoundedIcon />}
                          onClick={handleReplyToTable}
                          disabled={tableMessageAction !== '' || !messageDraft.trim()}
                        >
                          Responder
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                </SectionPanel>

                {selectedTable.latest_request ? (
                  <>
                    <Divider />
                    <SectionPanel title="Último pedido registrado" eyebrow="Historial reciente">
                      <Typography sx={{ color: 'text.secondary' }}>
                        Estado <strong>{getFriendlyRequestStatus(selectedTable.latest_request.status)}</strong>
                        {selectedTable.latest_request.request_source
                          ? ` · ${getRequestOriginLabel(selectedTable.latest_request.request_source)}`
                          : ''}
                        {selectedTable.latest_request.waiter_name
                          ? ` · Atiende ${normalizePrimaryPersonLabel(selectedTable.latest_request.waiter_name)}`
                          : ''}
                      </Typography>
                      {selectedTable.latest_request.client_label &&
                      selectedTable.latest_request.request_source === 'customer' ? (
                        <Typography sx={{ color: 'text.secondary' }}>
                          Cliente <strong>{normalizePrimaryPersonLabel(selectedTable.latest_request.client_label)}</strong>
                        </Typography>
                      ) : null}
                      {selectedTable.latest_request.accepted_at ? (
                        <Typography sx={{ color: 'text.secondary' }}>
                          Confirmado <strong>{formatDateTimeLabel(selectedTable.latest_request.accepted_at)}</strong>
                        </Typography>
                      ) : null}
                      {selectedTable.latest_request.payload?.items?.length ? (
                        <Stack spacing={1} sx={{ mt: 1.2 }}>
                          {selectedTable.latest_request.payload.items.map((item, index) => (
                            <Box
                              key={`${item.id || item.name}-${index}`}
                              sx={{
                                p: 1.2,
                                borderRadius: OP_ITEM_RADIUS,
                                border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                              }}
                            >
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                <Typography sx={{ fontWeight: 700 }}>
                                  {item.name} x{item.qty}
                                </Typography>
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color={getFulfillmentModeChipColor(item?.fulfillment_mode)}
                                  icon={
                                    sanitizeFulfillmentMode(item?.fulfillment_mode) === 'takeaway' ? (
                                      <TakeoutDiningRoundedIcon />
                                    ) : (
                                      <TableRestaurantOutlinedIcon />
                                    )
                                  }
                                  label={getFulfillmentModeLabel(item?.fulfillment_mode)}
                                />
                              </Stack>
                              {item.note ? (
                                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                  {item.note}
                                </Typography>
                              ) : null}
                            </Box>
                          ))}
                        </Stack>
                      ) : null}
                    </SectionPanel>
                  </>
                ) : null}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent="flex-end">
                  {selectedTable.can_mark_delivered ? (
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<AssignmentTurnedInOutlinedIcon />}
                      disabled={actionLoading === buildTableKey(selectedTable)}
                      onClick={() => handleDeliver(selectedTable)}
                    >
                      Marcar como entregado
                    </Button>
                  ) : null}
                  <Button variant="outlined" onClick={() => setSelectedTable(null)}>
                    Cerrar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<TableRestaurantOutlinedIcon />}
                    disabled={!selectedTable.can_direct_order}
                    onClick={() => {
                      navigate({
                        pathname: '/equipo/menu',
                        search: `?table_token=${encodeURIComponent(selectedTable.table_token)}`,
                      });
                      setSelectedTable(null);
                    }}
                  >
                    {selectedTable.can_direct_order ? 'Ir al menú' : 'No disponible'}
                  </Button>
                </Stack>
              </Stack>
            </DialogContent>
          </>
        ) : null}
      </Dialog>
    </WaiterShell>
  );
}
