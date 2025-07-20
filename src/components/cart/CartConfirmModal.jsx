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
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice } from '../../utils/price.js';

/**
 * Optional confirmation modal presented before sending the order to
 * WhatsApp. Users can review their items and add global notes. When
 * they confirm, the onSubmit callback is called with the note text.
 */
export default function CartConfirmModal({ open, onClose, onSubmit }) {
  const { items, subtotal } = useCart();
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
            <ListItem key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Typography variant="subtitle1">{item.name} x{item.qty}</Typography>
                {item.extras?.map((e) => (
                  <Typography key={e.optionId} variant="caption" display="block">
                    • {e.label} (+{formatPrice(e.price)})
                  </Typography>
                ))}
              </div>
              <Typography variant="body2">{formatPrice(item.lineTotal)}</Typography>
            </ListItem>
          ))}
        </List>
        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          Total {formatPrice(subtotal)}
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