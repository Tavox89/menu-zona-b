import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';

import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useCart } from '../../context/CartContext.jsx';

import CartItemRow from './CartItemRow.jsx';
import { FOOTER_HEIGHT } from './CartFooter.jsx';
/**
 * Bottom drawer displaying the cart contents. Each line item can be
 * incremented, decremented or removed. Checkout buttons are shown at
 * the bottom. The parent component controls the open state.
*/
export default function CartDrawer({ open, onClose, onReview, onSend }) {
   const { items, update, remove } = useCart();
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
          height: `calc(100% - ${FOOTER_HEIGHT}px)`,
          bottom: FOOTER_HEIGHT,
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
            <List>
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
               <Stack spacing={1} sx={{ p: 2 }}>
              <Button variant="contained" color="primary" onClick={onReview} fullWidth>
                Procesar pago
              </Button>
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={onSend}
                fullWidth
                sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ebe5d' } }}
              >
                Pedido por WhatsApp
              </Button>
            </Stack>
          </>
        )}
      </Box>
   </SwipeableDrawer>
  );
}
