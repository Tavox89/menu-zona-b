import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useCart } from '../../context/CartContext.jsx';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { formatPrice, formatBs } from '../../utils/price.js';

/**
 * Bottom drawer displaying the cart contents. Each line item can be
 * incremented, decremented or removed. At the bottom the subtotal and
 * checkout buttons are shown. When the drawer is closed or a button is
 * pressed, the parent component controls the open state.
 */
export default function CartDrawer({ open, onClose, onReview, onSend }) {
  const { items, update, remove, subtotal } = useCart();
  const rate = useUsdToBsRate();
  const handleDecrement = (id, qty) => {
    if (qty <= 1) return;
    update(id, { qty: qty - 1 });
  };
  const handleIncrement = (id, qty) => {
    update(id, { qty: qty + 1 });
  };
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose} sx={{ zIndex: (theme) => theme.zIndex.appBar + 2 }}>
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
                <ListItem
                  key={item.id}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">{item.name}</Typography>
                    {item.extras?.map((e) => (
                      <Typography key={e.id} variant="caption" sx={{ display: 'block' }}>
                        • {e.label} (+{formatPrice(e.price)})
                      </Typography>
                    ))}
                    {item.note && item.note.trim() !== '' && (
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        • {item.note}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="small"
                      onClick={() => handleDecrement(item.id, item.qty)}
                      disabled={item.qty <= 1}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ width: 20, textAlign: 'center' }}>
                      {item.qty}
                    </Typography>
                    <IconButton size="small" onClick={() => handleIncrement(item.id, item.qty)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => remove(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </ListItem>
              ))}
            </List>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Total {formatPrice(subtotal)} ({formatBs(subtotal, rate)})
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
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
    </Drawer>
  );
}
