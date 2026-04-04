import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// Icons for closing the drawer, sending via WhatsApp and processing payment
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import TakeoutDiningRoundedIcon from '@mui/icons-material/TakeoutDiningRounded';

import { useCart } from '../../context/CartContext.jsx';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { formatBs, formatPrice } from '../../utils/price.js';
import CartItemRow from './CartItemRow.jsx';
import { FOOTER_HEIGHT } from './CartFooter.jsx';
import { sanitizeFulfillmentMode } from '../../utils/fulfillment.js';

/**
 * Bottom drawer displaying the cart contents. Each line item can be
 * incremented, decremented or removed. Checkout buttons are shown at
 * the bottom. The parent component controls the open state.
 *
 * The height of the drawer has been reduced so that it only covers
 * approximately 70% of the viewport height. This allows customers
 * to see a couple of menu items behind the cart and tap outside to
 * dismiss the drawer. A small border radius has been added to the
 * top corners for a softer edge.
 */
export default function CartDrawer({
  open,
  onClose,
  onReview,
  reviewLabel = 'Revisar y enviar por WhatsApp',
  reviewStartIcon = <WhatsAppIcon />,
  reviewButtonSx = {},
}) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isShortLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');
  const isLight = theme.palette.mode === 'light';
  const desktopSheet = !isPhone && !isShortLandscape;
  const { items, update, remove, subtotal, fulfillmentMode, setFulfillmentMode, setItemFulfillmentMode } = useCart();
  const rate = useUsdToBsRate();
  const totalUsd = subtotal;

  const handleDecrement = (id, qty) => {
    if (qty <= 1) return;
    update(id, { qty: qty - 1 });
  };
  const handleIncrement = (id, qty) => {
    update(id, { qty: qty + 1 });
  };

  // Constant controlling how tall the drawer should be relative to the viewport
  const drawerHeight =
    isPhone || isShortLandscape
      ? `calc(100dvh - ${FOOTER_HEIGHT}px)`
      : 'min(78dvh, 760px)';

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      sx={{ zIndex: (currentTheme) => currentTheme.zIndex.modal + 2 }}
      PaperProps={{
        sx: {
          height: drawerHeight,
          maxHeight: `calc(100dvh - ${FOOTER_HEIGHT + 16}px)`,
          width: desktopSheet ? 'min(920px, calc(100vw - 40px))' : '100vw',
          maxWidth: desktopSheet ? 920 : '100vw',
          left: 0,
          right: 0,
          mx: 'auto',
          borderTopLeftRadius: { xs: 22, sm: 28 },
          borderTopRightRadius: { xs: 22, sm: 28 },
          borderBottomLeftRadius: desktopSheet ? 28 : 0,
          borderBottomRightRadius: desktopSheet ? 28 : 0,
          bottom: desktopSheet ? FOOTER_HEIGHT + 16 : FOOTER_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          background: theme.appBrand.dialogBackground,
        },
      }}
      >
        <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          pb: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {/* Header with title and close button */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            pb: 1.5,
            borderBottom: `1px solid ${theme.appBrand.softBorderColor}`,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 56,
              height: 5,
              borderRadius: 999,
              bgcolor: isLight ? 'rgba(24,40,60,0.16)' : 'rgba(255,255,255,0.18)',
            }}
          />
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}
          >
            <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />
            Tu pedido
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mb: 1.2,
            p: 1.1,
            borderRadius: 2.5,
            border: `1px solid ${theme.appBrand.softBorderColor}`,
            background: isLight ? 'rgba(24,40,60,0.03)' : 'rgba(255,255,255,0.03)',
          }}
        >
          <Typography sx={{ fontSize: 13, color: theme.appBrand.faintText, minWidth: 112 }}>
            Cómo sale este pedido
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              size="small"
              variant={sanitizeFulfillmentMode(fulfillmentMode) === 'dine_in' ? 'contained' : 'outlined'}
              startIcon={<TableRestaurantOutlinedIcon />}
              onClick={() => setFulfillmentMode('dine_in')}
              sx={{ minHeight: 36 }}
            >
              Todo en mesa
            </Button>
            <Button
              size="small"
              variant={sanitizeFulfillmentMode(fulfillmentMode) === 'takeaway' ? 'contained' : 'outlined'}
              color="warning"
              startIcon={<TakeoutDiningRoundedIcon />}
              onClick={() => setFulfillmentMode('takeaway')}
              sx={{ minHeight: 36 }}
            >
              Todo para llevar
            </Button>
          </Stack>
        </Stack>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Tu carrito está vacío.
          </Typography>
        ) : (
          <>
            {/* List of cart line items. flexGrow ensures it takes available space and scrolls when necessary. */}
            <List sx={{ overflowY: 'auto', flexGrow: 1, minHeight: 0, px: 0, py: 0.5, pr: 0.25 }}>
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onRemove={remove}
                  onSetFulfillmentMode={setItemFulfillmentMode}
                />
              ))}
            </List>
            <Box
              sx={{
                pt: 1.5,
                borderTop: `1px solid ${theme.appBrand.softBorderColor}`,
                flexShrink: 0,
                backgroundColor: 'background.paper',
                pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
                borderRadius: { xs: '18px 18px 0 0', sm: 3 },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 12.5, color: theme.appBrand.faintText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Total actual
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 700 }}>{formatPrice(totalUsd)}</Typography>
                </Box>
                <Typography color="primary.main" sx={{ fontSize: 15, fontWeight: 600 }}>
                  {formatBs(totalUsd, rate)}
                </Typography>
              </Box>
              {/* Payment button now includes an icon and uses white text */}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<CreditCardIcon />}
                sx={{ color: '#fff' }}
                disabled
                title="Próximamente"
              >
                Procesar pago
              </Button>
              {/* WhatsApp button with persistent white text */}
              <Button
                variant="contained"
                onClick={onReview}
                fullWidth
                startIcon={reviewStartIcon}
                sx={{
                  mt: 1,
                  minHeight: 48,
                  bgcolor: '#25D366',
                  color: '#fff',
                  '&:hover': { bgcolor: '#1ebe53' },
                  ...reviewButtonSx,
                }}
                disabled={items.length === 0}
              >
                {reviewLabel}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </SwipeableDrawer>
  );
}
