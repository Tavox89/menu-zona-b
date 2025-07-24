import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';

import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';


import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useCart } from '../../context/CartContext.jsx';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { formatPrice, formatBs } from '../../utils/price.js';
import { calcLine } from '../../utils/cartTotals.js';
import CartItemRow from './CartItemRow.jsx';
import { FOOTER_HEIGHT } from './CartFooter.jsx';

const HEADER_HEIGHT = 112;
/**
 * Bottom drawer displaying the cart contents. Each line item can be
 * incremented, decremented or removed. Checkout buttons are shown at
 * the bottom. The parent component controls the open state.
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
  return (
      <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      sx={{ zIndex: (theme) => theme.zIndex.appBar + 2 }}
      PaperProps={{
        sx: {
                 height: `calc(100% - ${HEADER_HEIGHT + FOOTER_HEIGHT}px)`,
          top: HEADER_HEIGHT,
        },
      }}
    >
      <Box sx={{ p: 2, pb: 4, width: '100vw' }}>
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
           <List sx={{ overflowY: 'auto', maxHeight: '100%' }}>
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
                  <Box sx={{ p: 2, pt: 1, borderTop: '1px solid #444' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Typography>{formatPrice(totalUsd)}</Typography>
                <Typography color="primary.main" sx={{ ml: 0.5 }}>
                  ({formatBs(totalUsd, rate)})
                </Typography>
              </Box>
              <Button variant="contained" color="primary" onClick={onReview} fullWidth>
                Procesar pago
              </Button>
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={onSend}
                fullWidth
             sx={{ mt: 1, bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe53' } }}
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
