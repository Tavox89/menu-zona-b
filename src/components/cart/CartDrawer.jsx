import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';

import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

// Icons for closing the drawer, sending via WhatsApp and processing payment
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CreditCardIcon from '@mui/icons-material/CreditCard';

import { useCart } from '../../context/CartContext.jsx';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { formatPrice, formatBs } from '../../utils/price.js';
import { calcLine } from '../../utils/cartTotals.js';
import CartItemRow from './CartItemRow.jsx';
import { FOOTER_HEIGHT } from './CartFooter.jsx';

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
export default function CartDrawer({ open, onClose, onReview, onSend }) {
  const { items, update, remove } = useCart();
  const rate = useUsdToBsRate();
  const totalUsd = items.reduce((t, it) => t + calcLine(it), 0);

  const handleDecrement = (id, qty) => {
    if (qty <= 1) return;
    update(id, { qty: qty - 1 });
  };
  const handleIncrement = (id, qty) => {
    update(id, { qty: qty + 1 });
  };

  // Constant controlling how tall the drawer should be relative to the viewport
  const DRAWER_HEIGHT = '70vh';

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      sx={{ zIndex: (theme) => theme.zIndex.appBar + 2 }}
      PaperProps={{
        sx: {
          // The drawer should sit on top of the footer. By setting a bottom offset equal
          // to the footer height we avoid overlapping the fixed footer bar. The height
          // remains a percentage of the viewport so that only a portion of the page
          // is covered when the cart opens.
          height: DRAWER_HEIGHT,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          bottom: FOOTER_HEIGHT,
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          pb: 4,
          width: '100vw',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with title and close button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Tu pedido</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Tu carrito está vacío.
          </Typography>
        ) : (
          <>
            {/* List of cart line items. flexGrow ensures it takes available space and scrolls when necessary. */}
            <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onRemove={remove}
                />
              ))}
            </List>
            <Box sx={{ pt: 1, borderTop: '1px solid #444' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Typography>{formatPrice(totalUsd)}</Typography>
                <Typography color="primary.main" sx={{ ml: 0.5 }}>
                  ({formatBs(totalUsd, rate)})
                </Typography>
              </Box>
              {/* Payment button now includes an icon and uses white text */}
              <Button
                variant="contained"
                color="primary"
                onClick={onReview}
                fullWidth
                startIcon={<CreditCardIcon />}
                sx={{ color: '#fff' }}
              >
                Procesar pago
              </Button>
              {/* WhatsApp button with persistent white text */}
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={onSend}
                fullWidth
                sx={{
                  mt: 1,
                  bgcolor: '#25D366',
                  color: '#fff',
                  '&:hover': { bgcolor: '#1ebe53' },
                }}
              >
                Pedido por WhatsApp
              </Button>
            </Box>
          </>
        )}
      </Box>
    </SwipeableDrawer>
  );
}