import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import TakeoutDiningRoundedIcon from '@mui/icons-material/TakeoutDiningRounded';
import WaiterShell from '../components/waiter/WaiterShell.jsx';
import QuietInfoPanel from '../components/common/QuietInfoPanel.jsx';
import { useWaiterSession } from '../context/WaiterSessionContext.jsx';
import useSerializedRefresh from '../hooks/useSerializedRefresh.js';
import useWaiterLiveStream from '../hooks/useWaiterLiveStream.js';
import {
  fetchWaiterProductionBoard,
  markWaiterStationPreparing,
  markWaiterStationReady,
} from '../services/tableService.js';
import { subscribeToTeamPushMessages } from '../utils/teamPush.js';
import { formatPrice } from '../utils/price.js';
import {
  formatPrepElapsed,
  getFulfillmentModeChipColor,
  getFulfillmentModeLabel,
  sanitizeFulfillmentMode,
} from '../utils/fulfillment.js';
import {
  getItemServiceLabel,
  getStationLabel,
  getTableKindLabel,
} from '../utils/teamStatus.js';
import {
  OP_CARD_RADIUS,
  OP_CONTROL_RADIUS,
  OP_INNER_RADIUS,
  OP_ITEM_RADIUS,
} from '../theme/operationalRadii.js';

const PRODUCTION_FILTERS = [
  { id: 'all', label: 'Todo' },
  { id: 'pending', label: 'Por preparar' },
  { id: 'partial', label: 'Listo parcial' },
  { id: 'ready', label: 'Listo para entregar' },
];

function pushAlert(setAlerts, nextAlert) {
  setAlerts((prev) => {
    const deduped = prev.filter((alert) => alert.message !== nextAlert.message);
    return [nextAlert, ...deduped].slice(0, 4);
  });
}

function getCustomerLabel(card) {
  return String(
    card?.customer_label ||
      card?.pickup?.customer_name ||
      card?.consumption?.customer?.name ||
      ''
  ).trim();
}

function formatLineTime(line) {
  const raw = Number(line?.order_time || 0);
  if (raw > 1000) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  return String(line?.order_label || '').trim();
}

function getCardStatus(card) {
  const readyMode = String(card?.summary?.ready_mode || '').trim();
  const pendingCount = Number(card?.summary?.pending_count || 0);
  const preparingCount = Number(card?.summary?.preparing_count || 0);
  const readyCount = Number(card?.summary?.ready_count || 0);

  if (readyMode === 'complete' || (readyCount > 0 && pendingCount < 1 && preparingCount < 1)) {
    return { label: 'Listo para entregar', color: 'success' };
  }

  if (readyMode === 'partial') {
    return { label: 'Listo parcial', color: 'success' };
  }

  if (preparingCount > 0) {
    return { label: 'En preparación', color: 'info' };
  }

  return { label: 'Por preparar', color: 'warning' };
}

function getLineSortWeight(line) {
  const state = String(line?.service_state || '').trim();

  if (state === 'pending') return 0;
  if (state === 'preparing') return 1;
  if (state === 'ready') return 2;
  if (state === 'delivered') return 3;

  return 9;
}

function getReadyActionMessage({ stationLabel, cardName, updatedLines, mode }) {
  if (updatedLines < 1) {
    return `${stationLabel} revisó ${cardName}.`;
  }

  if (mode === 'selected') {
    return `${stationLabel} dejó listo un producto en ${cardName}.`;
  }

  if (mode === 'lot') {
    return `${stationLabel} dejó listo un lote en ${cardName}.`;
  }

  return `${stationLabel} dejó listos ${updatedLines} producto(s) en ${cardName}.`;
}

function getPreparingActionMessage({ stationLabel, cardName, updatedLines, mode }) {
  if (updatedLines < 1) {
    return `${stationLabel} revisó ${cardName}.`;
  }

  if (mode === 'selected') {
    return `${stationLabel} empezó un producto en ${cardName}.`;
  }

  if (mode === 'lot') {
    return `${stationLabel} empezó un lote en ${cardName}.`;
  }

  return `${stationLabel} empezó ${updatedLines} producto(s) en ${cardName}.`;
}

function getLotAccent(lotKey) {
  const palette = [
    'rgba(36, 181, 255, 0.09)',
    'rgba(230, 189, 23, 0.1)',
    'rgba(104, 214, 129, 0.11)',
    'rgba(255, 123, 84, 0.11)',
    'rgba(173, 121, 255, 0.11)',
  ];
  const input = String(lotKey || '').trim();
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return palette[hash % palette.length];
}

function resolveLotAction(lot, lineMap) {
  const lineIds = Array.isArray(lot?.line_ids) ? lot.line_ids : [];
  const lines = lineIds.map((lineId) => lineMap.get(String(lineId))).filter(Boolean);

  if (lines.length < 2) {
    return null;
  }

  if (lines.every((line) => line.can_mark_preparing)) {
    return { action: 'preparing', label: 'Iniciar lote' };
  }

  if (lines.every((line) => line.can_mark_ready)) {
    return { action: 'ready', label: 'Marcar lote listo' };
  }

  return null;
}

function getLinePrepTimer(line, nowTick) {
  const serviceState = String(line?.service_state || '').trim();
  const startedAt = Number(line?.preparing_started_at || 0) || 0;
  const persisted = Number(line?.elapsed_prep_seconds || 0) || 0;

  if (serviceState === 'preparing' && startedAt > 0) {
    return formatPrepElapsed(Math.max(0, Math.floor((nowTick - startedAt) / 1000)));
  }

  if (persisted > 0) {
    return formatPrepElapsed(persisted);
  }

  return '';
}

function getFilterMatch(card, activeFilter) {
  const readyMode = String(card?.summary?.ready_mode || '').trim();
  const pendingCount = Number(card?.summary?.pending_count || 0);
  const preparingCount = Number(card?.summary?.preparing_count || 0);
  const readyCount = Number(card?.summary?.ready_count || 0);

  if (activeFilter === 'pending') {
    return pendingCount > 0 || (preparingCount > 0 && readyMode !== 'partial');
  }

  if (activeFilter === 'partial') {
    return readyMode === 'partial';
  }

  if (activeFilter === 'ready') {
    return readyMode === 'complete' || (readyCount > 0 && pendingCount < 1 && preparingCount < 1);
  }

  return true;
}

export default function TeamProductionPage({ station = 'kitchen' }) {
  const { session } = useWaiterSession();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionKey, setActionKey] = useState('');
  const [clockTick, setClockTick] = useState(() => Date.now());
  const hasLoadedOnceRef = useRef(false);
  const stationLabel = getStationLabel(station);

  const loadBoard = useCallback(async () => {
    if (!session?.session_token) {
      return;
    }

    const hasVisibleData = hasLoadedOnceRef.current;

    if (!hasVisibleData) {
      setLoading(true);
    }

    try {
      const data = await fetchWaiterProductionBoard({
        sessionToken: session.session_token,
        station,
      });
      const nextCards = Array.isArray(data?.items) ? data.items : [];

      hasLoadedOnceRef.current = true;
      setCards(nextCards);
      setError('');
    } catch (err) {
      if (!hasVisibleData) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          `No se pudo cargar la vista de ${stationLabel.toLowerCase()}.`;
        setError(String(message));
      }
    } finally {
      setLoading(false);
    }
  }, [session?.session_token, station, stationLabel]);
  const scheduleBoardRefresh = useSerializedRefresh(loadBoard, { minGapMs: 500 });

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useWaiterLiveStream({
    sessionToken: session?.session_token || '',
    scope: station,
    enabled: Boolean(session?.session_token),
    onSync: scheduleBoardRefresh,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      scheduleBoardRefresh();
    }, 20000);
    return () => window.clearInterval(intervalId);
  }, [scheduleBoardRefresh]);

  useEffect(() => subscribeToTeamPushMessages(() => scheduleBoardRefresh()), [scheduleBoardRefresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const filteredCards = useMemo(
    () => cards.filter((card) => getFilterMatch(card, activeFilter)),
    [activeFilter, cards]
  );

  const handlePreparing = async ({ card, mode = 'all_pending', lineIds = [] }) => {
    if (!session?.session_token || !card?.table_token) {
      return;
    }

    const keySuffix = lineIds.length ? lineIds.join(',') : mode;
    const key = `${card.type || 'dine_in'}-${card.id || card.name}-${keySuffix}`;
    setActionKey(key);
    setError('');

    try {
      const result = await markWaiterStationPreparing({
        sessionToken: session.session_token,
        tableToken: card.table_token,
        station,
        mode,
        lineIds,
      });

      await loadBoard();

      pushAlert(setAlerts, {
        id: `${key}-started-${Date.now()}`,
        severity: 'info',
        message: getPreparingActionMessage({
          stationLabel,
          cardName: card.name,
          updatedLines: Number(result?.updated_lines || 0),
          mode,
        }),
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        `No se pudo iniciar ${card?.name || 'este pedido'}.`;
      setError(String(message));
    } finally {
      setActionKey('');
    }
  };

  const handleReady = async ({ card, mode = 'all_preparing', lineIds = [] }) => {
    if (!session?.session_token || !card?.table_token) {
      return;
    }

    const keySuffix = lineIds.length ? lineIds.join(',') : mode;
    const key = `${card.type || 'dine_in'}-${card.id || card.name}-${keySuffix}`;
    setActionKey(key);
    setError('');

    try {
      const result = await markWaiterStationReady({
        sessionToken: session.session_token,
        tableToken: card.table_token,
        station,
        mode,
        lineIds,
      });

      await loadBoard();

      pushAlert(setAlerts, {
        id: `${key}-done-${Date.now()}`,
        severity: 'success',
        message: getReadyActionMessage({
          stationLabel,
          cardName: card.name,
          updatedLines: Number(result?.updated_lines || 0),
          mode,
        }),
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        `No se pudo actualizar ${card?.name || 'este pedido'}.`;
      setError(String(message));
    } finally {
      setActionKey('');
    }
  };

  return (
    <WaiterShell
      title={stationLabel}
      subtitle={`Aquí ves lo que ${stationLabel.toLowerCase()} tiene por preparar y lo que ya puede salir.`}
      navigationMode="station"
      maxWidth={false}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {PRODUCTION_FILTERS.map((filter) => (
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

        {!loading && filteredCards.length === 0 ? (
          <QuietInfoPanel description={`No hay movimientos para ${stationLabel.toLowerCase()} en este momento.`} />
        ) : null}

        {!loading &&
          filteredCards.map((card) => {
            const cardKey = `${card.type || 'dine_in'}-${card.id || card.name}`;
            const customerLabel = getCustomerLabel(card);
            const pendingCount = Number(card?.summary?.pending_count || 0);
            const preparingCount = Number(card?.summary?.preparing_count || 0);
            const readyCount = Number(card?.summary?.ready_count || 0);
            const deliveredCount = Number(card?.summary?.delivered_count || 0);
            const status = getCardStatus(card);
            const lotsById = new Map((card?.lots || []).map((lot) => [lot.id, lot]));
            const isCardBusy = actionKey.startsWith(cardKey);
            const lines = Array.isArray(card?.lines)
              ? [...card.lines].sort((a, b) => {
                  const stateDiff = getLineSortWeight(a) - getLineSortWeight(b);
                  if (stateDiff !== 0) {
                    return stateDiff;
                  }

                  return String(a?.name || '').localeCompare(String(b?.name || ''), 'es');
                })
              : [];
            const lineMap = new Map(lines.map((line) => [String(line?.id || ''), line]));

            return (
              <Card
                key={cardKey}
                sx={{
                  borderRadius: OP_CARD_RADIUS,
                  border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                  background: (theme) => theme.appBrand.dialogBackground,
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack spacing={1.4}>
                    <Stack
                      direction={{ xs: 'column', lg: 'row' }}
                      spacing={1.3}
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 24 }}>
                          {card.name}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                          {getTableKindLabel(card.type, card.availability)}
                          {card.pickup?.window_label ? ` · Retiro ${card.pickup.window_label}` : ''}
                        </Typography>
                        {card.managed_by ? (
                          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                            Atiende <strong>{card.managed_by}</strong>
                          </Typography>
                        ) : null}
                        {customerLabel ? (
                          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                            Cliente <strong>{customerLabel}</strong>
                            {card.pickup?.phone ? ` · ${card.pickup.phone}` : ''}
                          </Typography>
                        ) : null}
                      </Box>

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="flex-start">
                        <Chip variant="outlined" color={status.color} label={status.label} />
                        <Chip variant="outlined" color={pendingCount > 0 ? 'warning' : 'default'} label={`${pendingCount} por preparar`} />
                        <Chip variant="outlined" color={preparingCount > 0 ? 'info' : 'default'} label={`${preparingCount} en preparación`} />
                        <Chip variant="outlined" color={readyCount > 0 ? 'success' : 'default'} label={`${readyCount} listos`} />
                        <Chip variant="outlined" label={`${deliveredCount} entregados`} />
                        <Chip variant="outlined" label={formatPrice(card?.consumption?.total_amount ?? 0)} />
                      </Stack>
                    </Stack>

                    {card.service_note ? <Alert severity="info">{card.service_note}</Alert> : null}

                    <Box
                      sx={{
                        p: 1.6,
                        borderRadius: OP_INNER_RADIUS,
                        border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                        background: (theme) => theme.appBrand.frostedPanel,
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>
                        Productos de {stationLabel.toLowerCase()}
                      </Typography>

                      {lines.length ? (
                        <Stack spacing={1}>
                          {lines.map((line, index) => {
                            const lineKey = `${cardKey}-${line.id || index}`;
                            const lot = lotsById.get(line?.lot_key);
                            const canMarkPreparing = Boolean(line?.can_mark_preparing);
                            const canMarkReady = Boolean(line?.can_mark_ready);
                            const lotAction = resolveLotAction(lot, lineMap);
                            const prepTimerLabel = getLinePrepTimer(line, clockTick);
                            const fulfillmentMode = sanitizeFulfillmentMode(line?.fulfillment_mode);
                            const FulfillmentIcon =
                              fulfillmentMode === 'takeaway'
                                ? TakeoutDiningRoundedIcon
                                : TableRestaurantOutlinedIcon;

                            return (
                              <Box
                                key={lineKey}
                                sx={{
                                  p: 1.2,
                                  borderRadius: OP_ITEM_RADIUS,
                                  border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                                  background: getLotAccent(line?.lot_key),
                                }}
                              >
                                <Stack
                                  direction={{ xs: 'column', lg: 'row' }}
                                  spacing={1.2}
                                  justifyContent="space-between"
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 700 }}>
                                      {line.name} x{line.qty}
                                    </Typography>
                                    {line.modifiers_label ? (
                                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                        Ingredientes: {line.modifiers_label}
                                      </Typography>
                                    ) : null}
                                    {line.customer_note ? (
                                      <Typography
                                        sx={{
                                          mt: 0.35,
                                          color: 'warning.light',
                                          fontSize: 13,
                                          fontWeight: 600,
                                        }}
                                      >
                                        Nota: {line.customer_note}
                                      </Typography>
                                    ) : !line.modifiers_label && line.note ? (
                                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                        {line.note}
                                      </Typography>
                                    ) : null}
                                    <Stack
                                      direction="row"
                                      spacing={1.2}
                                      useFlexGap
                                      flexWrap="wrap"
                                      sx={{ mt: 0.6 }}
                                    >
                                      <Chip
                                        size="small"
                                        icon={<FulfillmentIcon />}
                                        label={getFulfillmentModeLabel(fulfillmentMode)}
                                        color={getFulfillmentModeChipColor(fulfillmentMode)}
                                        variant="outlined"
                                      />
                                      {line.seller_name ? (
                                        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                          Cargado por <strong>{line.seller_name}</strong>
                                        </Typography>
                                      ) : null}
                                      {formatLineTime(line) ? (
                                        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                          Hora <strong>{formatLineTime(line)}</strong>
                                        </Typography>
                                      ) : null}
                                      {lotAction && Array.isArray(lot?.line_ids) && lot.line_ids.length > 1 ? (
                                        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                          Lote de <strong>{lot.line_ids.length}</strong>
                                        </Typography>
                                      ) : null}
                                      {prepTimerLabel ? (
                                        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                          Preparando <strong>{prepTimerLabel}</strong>
                                        </Typography>
                                      ) : null}
                                    </Stack>
                                  </Box>

                                  <Stack spacing={0.8} alignItems={{ xs: 'flex-start', lg: 'flex-end' }}>
                                    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                      <Chip
                                        size="small"
                                        color={
                                          line.service_state === 'ready'
                                            ? 'success'
                                            : line.service_state === 'delivered'
                                              ? 'default'
                                              : line.service_state === 'preparing'
                                                ? 'info'
                                              : 'warning'
                                        }
                                        label={getItemServiceLabel(line)}
                                        variant="outlined"
                                      />
                                      <Typography sx={{ fontWeight: 700 }}>
                                        {formatPrice(line.total ?? 0)}
                                      </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                      {canMarkPreparing ? (
                                        <Button
                                          size="small"
                                          variant="contained"
                                          color="info"
                                          startIcon={<PlayArrowRoundedIcon />}
                                          disabled={isCardBusy}
                                          onClick={() =>
                                            handlePreparing({
                                              card,
                                              mode: 'selected',
                                              lineIds: [line.id],
                                            })
                                          }
                                        >
                                          En preparación
                                        </Button>
                                      ) : null}
                                      {canMarkReady ? (
                                        <Button
                                          size="small"
                                          variant="contained"
                                          disabled={isCardBusy}
                                          onClick={() =>
                                            handleReady({
                                              card,
                                              mode: 'selected',
                                              lineIds: [line.id],
                                            })
                                          }
                                        >
                                          Listo
                                        </Button>
                                      ) : null}
                                      {lotAction ? (
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          disabled={isCardBusy}
                                          onClick={() =>
                                            (lotAction.action === 'preparing' ? handlePreparing : handleReady)({
                                              card,
                                              mode: 'lot',
                                              lineIds: [lot.line_ids[0]],
                                            })
                                          }
                                        >
                                          {lotAction.label}
                                        </Button>
                                      ) : null}
                                    </Stack>
                                  </Stack>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography sx={{ color: 'text.secondary' }}>
                          No hay productos activos para {stationLabel.toLowerCase()} en este pedido.
                        </Typography>
                      )}
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        color="info"
                        startIcon={<PlayArrowRoundedIcon />}
                        disabled={!card.can_mark_preparing || isCardBusy}
                        onClick={() =>
                          handlePreparing({
                            card,
                            mode: 'all_pending',
                            lineIds: [],
                          })
                        }
                      >
                        Iniciar pendientes
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<DoneAllRoundedIcon />}
                        disabled={!card.can_mark_ready || isCardBusy}
                        onClick={() =>
                          handleReady({
                            card,
                            mode: 'all_preparing',
                            lineIds: [],
                          })
                        }
                      >
                        Marcar preparando como listos
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
      </Stack>
    </WaiterShell>
  );
}
