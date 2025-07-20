import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import { formatPrice } from '../../utils/price.js';
import ExtrasGroup from './ExtrasGroup.jsx';
import { useExtrasParser } from '../../hooks/useExtrasParser.js';

/**
 * Modal dialog showing product details and extras selection. Users can
 * adjust quantity, choose extras and add the configured item to the cart.
 *
 * Props:
 * - open: boolean
 * - product: enriched product with tavoxExtras
 * - onClose: function to dismiss dialog
 * - onAdd: function(item) called when user confirms add
 */
export default function ProductDialog({ open, product, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState({});
const parsedExtras = useExtrasParser(product, selectedExtras);
  if (!product) return null;

  const extras = product.tavoxExtras || [];


  const handleOptionChange = (groupId, value) => {
    setSelectedExtras((prev) => {
      const prevValue = prev[groupId];
      const group = extras.find((g) => g.groupId === groupId);
      if (group?.multiple) {
        const values = Array.isArray(prevValue) ? [...prevValue] : [];
        if (values.includes(value)) {
          return { ...prev, [groupId]: values.filter((v) => v !== value) };
        }
        return { ...prev, [groupId]: [...values, value] };
      }
      return { ...prev, [groupId]: value };
    });
  };

  const handleQtyChange = (delta) => {
    setQty((q) => Math.max(1, q + delta));
  };

  const handleAdd = () => {
    const extrasTotal = parsedExtras.reduce((sum, e) => sum + e.price, 0);
    const lineTotal = qty * (Number(product.price) + extrasTotal);
    // Generate a deterministic id based on product and selected extras
    const extrasSignature = parsedExtras.map((e) => `${e.groupId}:${e.optionId}`).join('|');
    const id = `${product.id}-${extrasSignature}`;
    const item = {
      id,
      productId: product.id,
      name: product.name,
      qty,
      basePrice: Number(product.price),
      extras: parsedExtras,
      lineTotal,
    };
    onAdd?.(item);
    // Reset state and close
    setQty(1);
    setSelectedExtras({});
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth scroll="body">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {product.name}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="h5" mb={1}>
          {formatPrice(Number(product.price))}
        </Typography>
        {/* Show Bs price placeholder */}
        <Typography variant="body2" color="text.secondary" mb={2}>
          Bs 0
        </Typography>
        {extras.map((group) => (
          <ExtrasGroup
            key={group.groupId}
            group={group}
            selected={selectedExtras[group.groupId]}
            onChange={(value) => handleOptionChange(group.groupId, value)}
          />
        ))}
        <Stack direction="row" alignItems="center" spacing={1} mt={2}>
          <Button variant="outlined" onClick={() => handleQtyChange(-1)} disabled={qty === 1}>
            −
          </Button>
          <TextField
            value={qty}
            size="small"
            inputProps={{ readOnly: true, style: { textAlign: 'center', width: 40 } }}
          />
          <Button variant="outlined" onClick={() => handleQtyChange(1)}>
            +
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleAdd} color="primary">
          Añadir al carrito
        </Button>
      </DialogActions>
    </Dialog>
  );
}