import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import TakeoutDiningRoundedIcon from '@mui/icons-material/TakeoutDiningRounded';
import { useCart } from '../../context/CartContext.jsx';
import { formatBs, formatPrice, hasValidBsRate } from '../../utils/price.js';
import { calcLine } from '../../utils/cartTotals.js';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { getEffectiveItemFulfillmentMode, getFulfillmentModeLabel, sanitizeFulfillmentMode } from '../../utils/fulfillment.js';

/**
 * Optional confirmation modal presented before sending the order to
 * WhatsApp. Users can review their items and add a global note.
 * Each line now shows the price in USD and its equivalent in bolivars and lists
 * selected extras and customer notes to give more context. The
 * total also displays the converted Bs value.
 */
export default function CartConfirmModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  error = '',
  title = 'Confirmar pedido',
  noteLabel = 'Notas al restaurante',
  confirmLabel = 'Enviar por WhatsApp',
  fulfillmentMode = 'dine_in',
  onFulfillmentModeChange,
  onItemFulfillmentModeChange,
}) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isShortLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');
  const isLight = theme.palette.mode === 'light';
  const { items } = useCart();
  const rate = useUsdToBsRate();
  const hasRate = hasValidBsRate(rate);
  const subtotal = items.reduce((t, it) => t + calcLine(it), 0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) {
      setNote('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (submitting) return;
    onSubmit?.(note);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isPhone || isShortLandscape}
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        sx: {
          width: '100%',
          m: { xs: 0, sm: 2 },
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: { xs: 0, sm: 3 },
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isLight ? '0 28px 70px rgba(36,56,76,0.16)' : '0 28px 70px rgba(0,0,0,0.28)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pb: 1,
          position: 'sticky',
          top: 0,
          zIndex: 2,
          backdropFilter: 'blur(12px)',
          background: theme.appBrand.headerBackground,
          borderBottom: `1px solid ${theme.appBrand.softBorderColor}`,
        }}
      >
        {title}
        <IconButton onClick={onClose} size="small" disabled={submitting}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 1.5 },
        }}
      >
        <List sx={{ py: 0 }}>
          <Box
            sx={{
              p: 1.25,
              mb: 1.3,
              borderRadius: 3,
              border: `1px solid ${theme.appBrand.softBorderColor}`,
              background: isLight ? 'rgba(24,40,60,0.03)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
              Forma de entrega del pedido
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Button
                size="small"
                variant={sanitizeFulfillmentMode(fulfillmentMode) === 'dine_in' ? 'contained' : 'outlined'}
                startIcon={<TableRestaurantOutlinedIcon />}
                onClick={() => onFulfillmentModeChange?.('dine_in')}
                disabled={submitting}
              >
                Todo en mesa
              </Button>
              <Button
                size="small"
                color="warning"
                variant={sanitizeFulfillmentMode(fulfillmentMode) === 'takeaway' ? 'contained' : 'outlined'}
                startIcon={<TakeoutDiningRoundedIcon />}
                onClick={() => onFulfillmentModeChange?.('takeaway')}
                disabled={submitting}
              >
                Todo para llevar
              </Button>
            </Stack>
          </Box>
          {items.map((item) => (
            <ListItem
              key={item.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                px: 1.25,
                py: 1,
                mb: 1,
                borderRadius: 3,
                background: isLight ? 'rgba(24,40,60,0.03)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${theme.appBrand.softBorderColor}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 0.25,
                  width: '100%',
                }}
              >
                <Typography variant="subtitle1" sx={{ pr: { sm: 2 } }}>
                  {item.name} x{item.qty}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  <Chip
                    size="small"
                    color={getEffectiveItemFulfillmentMode(item) === 'takeaway' ? 'warning' : 'primary'}
                    variant="outlined"
                    icon={
                      getEffectiveItemFulfillmentMode(item) === 'takeaway' ? (
                        <TakeoutDiningRoundedIcon />
                      ) : (
                        <TableRestaurantOutlinedIcon />
                      )
                    }
                    label={getFulfillmentModeLabel(getEffectiveItemFulfillmentMode(item))}
                  />
                  <Typography variant="body2">
                    {formatPrice(calcLine(item))} ({formatBs(calcLine(item), rate)})
                  </Typography>
                </Stack>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                <Button
                  size="small"
                  variant={getEffectiveItemFulfillmentMode(item) === 'dine_in' ? 'contained' : 'outlined'}
                  startIcon={<TableRestaurantOutlinedIcon />}
                  onClick={() => onItemFulfillmentModeChange?.(item.id, 'dine_in')}
                  disabled={submitting}
                >
                  En mesa
                </Button>
                <Button
                  size="small"
                  color="warning"
                  variant={getEffectiveItemFulfillmentMode(item) === 'takeaway' ? 'contained' : 'outlined'}
                  startIcon={<TakeoutDiningRoundedIcon />}
                  onClick={() => onItemFulfillmentModeChange?.(item.id, 'takeaway')}
                  disabled={submitting}
                >
                  Para llevar
                </Button>
              </Stack>
              {/* Render extras below the name */}
              {item.extras?.map((e) => {
                // Some extra prices may come as formatted strings (e.g.
                // "$1.00"). Normalise to a number before passing to
                // formatPrice to avoid concatenating strings. If the
                // value cannot be parsed we fall back to zero.
                let raw = e.price ?? e.price_usd ?? 0;
                let priceVal = 0;
                if (typeof raw === 'string') {
                  const stripped = raw.replace(/[^0-9.,-]/g, '');
                  priceVal = parseFloat(stripped.replace(',', '.')) || 0;
                } else {
                  priceVal = Number(raw) || 0;
                }
                return (
                  <Typography
                    key={e.id}
                    variant="caption"
                    display="block"
                    sx={{ ml: 1.5 }}
                  >
                    • {e.label} (+{formatPrice(priceVal)})
                  </Typography>
                );
              })}
              {/* Render any note provided for the line */}
              {item.note && (
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ ml: 1.5, fontStyle: 'italic' }}
                >
                  “{item.note}”
                </Typography>
              )}
            </ListItem>
          ))}
        </List>
        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          Total {formatPrice(subtotal)} ({formatBs(subtotal, rate)})
        </Typography>
        {!hasRate && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Actualizando Tasa Euro. El equivalente en bolívares aparecerá cuando la tasa cargue correctamente.
          </Alert>
        )}
        <TextField
          label={noteLabel}
          multiline
          rows={3}
          fullWidth
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 2 }}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 1.5, sm: 2 },
          pt: 1.5,
          pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          gap: 1,
          flexShrink: 0,
          borderTop: `1px solid ${theme.appBrand.softBorderColor}`,
          backdropFilter: 'blur(12px)',
          background: theme.appBrand.headerBackground,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          '& > :not(style)': {
            m: 0,
            width: { xs: '100%', sm: 'auto' },
          },
        }}
      >
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={submitting || items.length === 0 || !hasRate}
        >
          {submitting ? 'Procesando...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
