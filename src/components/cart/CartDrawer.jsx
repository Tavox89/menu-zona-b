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
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice } from '../../utils/price.js';

/**
 * Bottom drawer displaying the cart contents. Each line item can be
 * incremented, decremented or removed. At the bottom the subtotal and
 * checkout buttons are shown. When the drawer is closed or a button is
 * pressed, the parent component controls the open state.
 */
export default function CartDrawer({ open, onClose, onReview, onSend }) {
  const { items, update, remove, subtotal } = useCart();
  const handleDecrement = (id, qty) => {
    if (qty <= 1) return;
    update(id, { qty: qty - 1 });
  };
  const handleIncrement = (id, qty) => {
    update(id, { qty: qty + 1 });
  };
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ p: 2, pb: 4, width: '100vw' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Tu pedido
        </Typography>
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
                      <Typography key={e.optionId} variant="caption" sx={{ display: 'block' }}>
                        • {e.label} (+{formatPrice(e.price)})
                      </Typography>
                    ))}
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton size="small" onClick={() => handleDecrement(item.id, item.qty)} disabled={item.qty <= 1}>
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
              Subtotal {formatPrice(subtotal)}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="contained" color="primary" onClick={onSend} fullWidth>
                Enviar WhatsApp
              </Button>
              <Button variant="outlined" color="secondary" onClick={onReview} fullWidth>
                Revisar
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Drawer>
  );
}