import { useState } from 'react';
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
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice, formatBs } from '../../utils/price.js';
import { calcLine } from '../../utils/cartTotals.js';
import { useUsdToBsRate } from '../../context/RateContext.jsx';

/**
 * Optional confirmation modal presented before sending the order to
 * WhatsApp. Users can review their items and add a global note.
 * Each line now shows the price in both currencies and lists
 * selected extras and customer notes to give more context. The
 * total also displays the converted BS value.
 */
export default function CartConfirmModal({ open, onClose, onSubmit }) {
  const { items } = useCart();
  const rate = useUsdToBsRate();
  const subtotal = items.reduce((t, it) => t + calcLine(it), 0);
  const [note, setNote] = useState('');
  const handleConfirm = () => {
    onSubmit?.(note);
    setNote('');
    onClose?.();
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Confirmar pedido</DialogTitle>
      <DialogContent>
        <List>
          {items.map((item) => (
            <ListItem
              key={item.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                px: 0,
              }}
            >
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
              >
                <Typography variant="subtitle1">
                  {item.name} x{item.qty}
                </Typography>
                <Typography variant="body2">
                  {formatPrice(calcLine(item))} ({formatBs(calcLine(item), rate)})
                </Typography>
              </Box>
              {/* Render extras below the name */}
              {item.extras?.map((e) => (
                <Typography
                  key={e.id}
                  variant="caption"
                  display="block"
                  sx={{ ml: 1.5 }}
                >
                  • {e.label} (+{formatPrice(e.price)})
                </Typography>
              ))}
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
        <TextField
          label="Notas al restaurante"
          multiline
          rows={3}
          fullWidth
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Enviar Pedido
        </Button>
      </DialogActions>
    </Dialog>
  );
}