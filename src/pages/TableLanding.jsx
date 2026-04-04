import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import EuroRoundedIcon from '@mui/icons-material/EuroRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import RoomServiceRoundedIcon from '@mui/icons-material/RoomServiceRounded';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import LocalDiningRoundedIcon from '@mui/icons-material/LocalDiningRounded';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TableWaiterRequestDialog from '../components/table/TableWaiterRequestDialog.jsx';
import QuietInfoPanel from '../components/common/QuietInfoPanel.jsx';
import useTableContext from '../hooks/useTableContext.js';
import useTableMessages from '../hooks/useTableMessages.js';
import { useUsdToBsRate } from '../context/RateContext.jsx';
import { postTableMessage } from '../services/tableService.js';
import { formatBs, formatPrice } from '../utils/price.js';
import {
  OP_CONTROL_RADIUS,
  OP_INNER_RADIUS,
  OP_ITEM_RADIUS,
  OP_PANEL_RADIUS,
} from '../theme/operationalRadii.js';

function formatRateLabel(rate) {
  const numeric = Number(rate);
  if (!Number.isFinite(numeric) || numeric <= 1) {
    return 'Cargando...';
  }

  return `${numeric.toLocaleString('es-VE', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} Bs/€`;
}

function getServiceSeverity(stage) {
  const normalized = String(stage || '').trim();

  if (normalized === 'ready' || normalized === 'partial_ready') return 'success';
  if (normalized === 'review') return 'info';
  if (normalized === 'delivered') return 'default';
  return 'warning';
}

function getServiceBannerBackground(stage) {
  const normalized = String(stage || '').trim();

  if (normalized === 'ready' || normalized === 'partial_ready') {
    return 'linear-gradient(135deg, rgba(89, 197, 112, 0.2) 0%, rgba(89, 197, 112, 0.08) 100%)';
  }

  if (normalized === 'review') {
    return 'linear-gradient(135deg, rgba(36, 181, 255, 0.18) 0%, rgba(36, 181, 255, 0.07) 100%)';
  }

  if (normalized === 'delivered') {
    return 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)';
  }

  return 'linear-gradient(135deg, rgba(230, 189, 23, 0.18) 0%, rgba(230, 189, 23, 0.07) 100%)';
}

function getItemStateTone(item) {
  const state = String(
    item?.customer_display_state || item?.display_state || item?.service_state || ''
  )
    .trim()
    .toLowerCase();

  if (state.includes('entregado')) {
    return { color: 'default', label: 'Entregado' };
  }

  if (state.includes('camino')) {
    return { color: 'success', label: 'En camino' };
  }

  if (state.includes('listo')) {
    return { color: 'success', label: 'En camino' };
  }

  if (state.includes('prepar')) {
    return { color: 'warning', label: 'En preparación' };
  }

  return { color: 'info', label: 'Pendiente' };
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

function InfoBlock({ icon, label, value, secondary = '' }) {
  const IconComponent = icon;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.5,
        borderRadius: OP_INNER_RADIUS,
        border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
        background: (theme) => theme.appBrand.frostedPanel,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar
          variant="rounded"
          sx={{
            width: 42,
            height: 42,
            bgcolor: 'rgba(230, 189, 23, 0.12)',
            color: 'primary.main',
          }}
        >
          <IconComponent fontSize="small" />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{label}</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }} noWrap>
            {value || 'Sin dato'}
          </Typography>
          {secondary ? (
            <Typography sx={{ mt: 0.35, color: 'text.secondary', fontSize: 13 }}>
              {secondary}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

export default function TableLanding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [requestOpen, setRequestOpen] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const tableToken = searchParams.get('table_token') || '';
  const tableKey = searchParams.get('key') || '';
  const rate = useUsdToBsRate();
  const {
    context,
    initialLoading,
    error,
    refresh,
  } = useTableContext({
    tableToken,
    tableKey,
    enabled: Boolean(tableToken || tableKey),
    refreshIntervalMsVisible: 4000,
    refreshIntervalMsHidden: 12000,
    liveEnabled: false,
  });
  const activeTableToken = String(context?.table_token || '').trim();
  const {
    messages,
    pendingCount,
    error: messagesError,
    refresh: refreshMessages,
  } = useTableMessages({
    tableToken: activeTableToken || tableToken,
    tableKey,
    enabled: Boolean((activeTableToken || tableToken) && !error),
    refreshIntervalMsVisible: 4000,
    refreshIntervalMsHidden: 12000,
    liveEnabled: false,
  });

  const canOpenMenu = Boolean(activeTableToken) && !error;
  const items = Array.isArray(context?.consumption?.items) ? context.consumption.items : [];
  const serviceStage = String(context?.service_stage || '').trim();
  const serviceLabel = String(context?.service_label || '').trim() || 'Lista para pedir';
  const serviceNote = String(context?.service_note || '').trim();
  const ownerDisplayName = String(context?.owner_display_name || '').trim();
  const customerDisplayName = String(context?.customer_display_name || '').trim();
  const customerSecondaryLabel = String(context?.customer_secondary_label || '').trim();
  const totalAmount = Number(context?.consumption?.total_amount ?? 0) || 0;
  const euroTotal = formatPrice(totalAmount);
  const bsTotal = formatBs(totalAmount, rate);
  const rateLabel = formatRateLabel(rate);
  const readySummary = useMemo(() => {
    const ready = Number(context?.service_counts?.ready_count ?? 0) || 0;
    const pending = Number(context?.service_counts?.pending_count ?? 0) || 0;
    const delivered = Number(context?.service_counts?.delivered_count ?? 0) || 0;
    const parts = [];

    if (ready > 0) parts.push(`${ready} en camino`);
    if (pending > 0) parts.push(`${pending} en preparación`);
    if (delivered > 0) parts.push(`${delivered} entregados`);

    return parts.join(' · ');
  }, [context]);

  async function handleSendTableMessage(text, type = 'free_text') {
    setSubmittingMessage(true);
    setMessageError('');

    try {
      if (!activeTableToken && !tableToken) {
        setMessageError('Esta mesa ya no tiene un acceso válido. Escanea de nuevo el código.');
        return false;
      }

      await postTableMessage({
        tableToken: activeTableToken || tableToken,
        tableKey,
        messageText: text,
        messageType: type,
      });

      await Promise.all([refresh(), refreshMessages()]);
      return true;
    } catch (err) {
      setMessageError(
        String(err?.response?.data?.message || err?.message || 'No se pudo enviar el mensaje.')
      );
      return false;
    } finally {
      setSubmittingMessage(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', py: 3 }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Card
            sx={{
              borderRadius: OP_PANEL_RADIUS,
              overflow: 'hidden',
              border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
              background: (theme) => theme.appBrand.dialogBackground,
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1.1,
                      px: 1.2,
                      py: 1,
                      borderRadius: 3,
                      background: getServiceBannerBackground(serviceStage),
                      border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'rgba(230, 189, 23, 0.14)',
                        color: 'primary.main',
                      }}
                    >
                      <TableRestaurantOutlinedIcon />
                    </Avatar>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 11,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'text.secondary',
                        }}
                      >
                        Tu mesa
                      </Typography>
                      <Typography variant="h3" sx={{ mt: 0.25, fontWeight: 700 }}>
                        {context?.table?.name || 'Validando mesa...'}
                      </Typography>
                    </Box>
                  </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip color={getServiceSeverity(serviceStage)} label={serviceLabel} />
                    {readySummary ? <Chip variant="outlined" label={readySummary} /> : null}
                    {context?.shared_mode ? <Chip variant="outlined" color="warning" label="Mesa compartida" /> : null}
                  </Stack>
                </Stack>

                {error ? (
                  <Alert
                    severity="error"
                    action={
                      <Button color="inherit" size="small" onClick={refresh}>
                        Reintentar
                      </Button>
                    }
                  >
                    {error}
                  </Alert>
                ) : null}

                {serviceNote ? (
                  <Alert
                    severity={
                      serviceStage === 'ready' || serviceStage === 'partial_ready' ? 'success' : 'info'
                    }
                  >
                    {serviceNote}
                  </Alert>
                ) : null}
                {messagesError || messageError ? <Alert severity="warning">{messagesError || messageError}</Alert> : null}

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <InfoBlock
                    icon={BadgeRoundedIcon}
                    label="Atiende"
                    value={ownerDisplayName || 'Equipo disponible'}
                    secondary={
                      context?.shared_mode && Array.isArray(context?.shared_staff_display_names)
                        ? context.shared_staff_display_names.join(' · ')
                        : ''
                    }
                  />
                  <InfoBlock
                    icon={PersonRoundedIcon}
                    label="Cliente"
                    value={customerDisplayName || 'Sin nombre registrado'}
                    secondary={customerSecondaryLabel}
                  />
                  <InfoBlock
                    icon={EuroRoundedIcon}
                    label="Consumo"
                    value={euroTotal}
                    secondary={`${bsTotal} · ${context?.consumption?.lines_count || 0} productos · ${context?.consumption?.items_count || 0} artículos`}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <InfoBlock
                    icon={CurrencyExchangeRoundedIcon}
                    label="Tasa Euro"
                    value={rateLabel}
                    secondary={`Total ${euroTotal} · ${bsTotal}`}
                  />
                  {(context?.pickup?.customer_name || context?.pickup?.window_label || context?.pickup?.phone) ? (
                    <InfoBlock
                      icon={ScheduleRoundedIcon}
                      label="Retiro"
                      value={context?.pickup?.window_label || 'Por coordinar'}
                      secondary={
                        [context?.pickup?.customer_name, context?.pickup?.phone].filter(Boolean).join(' · ')
                      }
                    />
                  ) : null}
                  {(context?.wifi?.name || context?.wifi?.password) ? (
                    <InfoBlock
                      icon={WifiRoundedIcon}
                      label={context?.wifi?.label || 'Wi‑Fi'}
                      value={context?.wifi?.name || 'Disponible'}
                      secondary={context?.wifi?.password ? `Clave ${context.wifi.password}` : ''}
                    />
                  ) : null}
                </Stack>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: OP_INNER_RADIUS,
                    border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                    background: (theme) => theme.appBrand.frostedPanel,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Inventory2RoundedIcon color="primary" />
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>Consumo de la mesa</Typography>
                      <Typography sx={{ color: 'text.secondary' }}>
                        Lo que está cargado en la cuenta y cómo va cada producto.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={1.1} sx={{ mt: 1.4 }}>
                    {!items.length && !initialLoading ? (
                      <QuietInfoPanel description="La cuenta todavía no tiene productos cargados." />
                    ) : null}

                    {items.map((item, index) => {
                      const tone = getItemStateTone(item);
                      const itemImage = String(item?.image_url || '').trim();
                      const addedBy = String(item?.staff_display_name || '').trim();

                      return (
                        <Box
                          key={item.id || `${item.product_id}-${index}`}
                          sx={{
                            p: 1.2,
                            borderRadius: OP_ITEM_RADIUS,
                            border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
                          }}
                        >
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                            <Avatar
                              variant="rounded"
                              src={itemImage || undefined}
                              alt={item.display_name || item.name || 'Producto'}
                              sx={{
                                width: 72,
                                height: 72,
                                bgcolor: 'rgba(230, 189, 23, 0.12)',
                                color: 'primary.main',
                                borderRadius: OP_ITEM_RADIUS,
                                fontWeight: 700,
                              }}
                            >
                              {!itemImage ? <LocalDiningRoundedIcon /> : null}
                            </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1}
                                justifyContent="space-between"
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 18 }} noWrap>
                                    {item.display_name || item.name}
                                  </Typography>
                                  <Typography sx={{ color: 'text.secondary' }}>
                                    x{item.qty || 1}
                                    {addedBy ? ` · Cargado por ${addedBy}` : ''}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  <Chip size="small" color={tone.color} label={tone.label} />
                                  <Chip size="small" variant="outlined" label={formatPrice(item.total ?? 0)} />
                                </Stack>
                              </Stack>
                              {item.modifiers_label ? (
                                <Typography sx={{ mt: 0.6, color: 'text.secondary' }}>
                                  Ingredientes: {item.modifiers_label}
                                </Typography>
                              ) : null}
                              {item.customer_note ? (
                                <Typography sx={{ mt: 0.4, color: 'warning.light', fontWeight: 600 }}>
                                  Nota: {item.customer_note}
                                </Typography>
                              ) : !item.modifiers_label && item.note ? (
                                <Typography sx={{ mt: 0.6, color: 'text.secondary' }}>
                                  Nota: {item.note}
                                </Typography>
                              ) : null}
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>

                {context?.latest_request ? (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: OP_INNER_RADIUS,
                      border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
                      background: (theme) => theme.appBrand.frostedPanel,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>Último movimiento</Typography>
                    <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {serviceLabel}
                      {ownerDisplayName ? ` · Atiende ${ownerDisplayName}` : ''}
                      {context.latest_request.updated_at
                        ? ` · ${formatDateTimeLabel(context.latest_request.updated_at)}`
                        : ''}
                    </Typography>
                  </Box>
                ) : null}

                <Divider sx={{ borderColor: 'divider' }} />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                  <Button
                    size="large"
                    variant="contained"
                    startIcon={<RestaurantMenuRoundedIcon />}
                    disabled={!canOpenMenu}
                    onClick={() =>
                      navigate({
                        pathname: '/mesa/menu',
                        search: `?table_token=${encodeURIComponent(activeTableToken)}`,
                      })
                    }
                  >
                    Ver menú
                  </Button>
                  <Button
                    size="large"
                    variant="outlined"
                    startIcon={<RoomServiceRoundedIcon />}
                    onClick={() => setRequestOpen(true)}
                    disabled={!activeTableToken || Boolean(error)}
                    sx={{ borderRadius: OP_CONTROL_RADIUS }}
                  >
                    Solicitar al mesero
                  </Button>
                  <Button
                    size="large"
                    variant="outlined"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={() => {
                      refresh();
                      refreshMessages();
                    }}
                    sx={{ borderRadius: OP_CONTROL_RADIUS }}
                  >
                    Actualizar mesa
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      <TableWaiterRequestDialog
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        messages={messages}
        pendingCount={pendingCount}
        error={messagesError || messageError}
        onRefresh={() => {
          refresh();
          refreshMessages();
        }}
        onSend={handleSendTableMessage}
        submitting={submittingMessage}
        ownerDisplayName={ownerDisplayName}
        sharedMode={Boolean(context?.shared_mode)}
      />
    </Box>
  );
}
