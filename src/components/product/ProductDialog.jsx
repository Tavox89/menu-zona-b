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
import Box from '@mui/material/Box';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import CloseIcon from '@mui/icons-material/Close';
import { formatPrice, formatBs } from '../../utils/price.js';
import { useUsdToBsRate } from '../../context/RateContext.jsx';

/**
 * Modal dialog showing product details and extras selection. Users can
 * adjust quantity, choose extras, optionally add a note, and add the configured item to the cart.
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
  const [note, setNote] = useState('');
  const rate = useUsdToBsRate();

  if (!product) return null;

  const img = product.images?.[0]?.src || product.image || '/placeholder.png';
  const description = product.short_description || product.description || '';
  const { extras = [] } = product;

  const handleOptionChange = (gIndex, value) => {
    setSelectedExtras((prev) => {
      const prevValue = prev[gIndex];
      const group = extras[gIndex];
      if (group?.multiple) {
        const values = Array.isArray(prevValue) ? [...prevValue] : [];
        if (values.includes(value)) {
          return { ...prev, [gIndex]: values.filter((v) => v !== value) };
        }
        return { ...prev, [gIndex]: [...values, value] };
      }
      return { ...prev, [gIndex]: value };
    });
  };

  const handleQtyChange = (delta) => {
    setQty((q) => Math.max(1, q + delta));
  };

  const handleAdd = () => {
    const parsedExtras = [];
    extras.forEach((grp, gi) => {
      const sel = selectedExtras[gi];
      if (!sel) return;
      const selIdx = Array.isArray(sel) ? sel : [sel];
      selIdx.forEach((oi) => {
        const opt = grp.options[oi];
        if (opt) parsedExtras.push({ id: `${gi}-${oi}`, label: opt.label, price: Number(opt.price) || 0 });
      });
    });
    const extrasTotal = parsedExtras.reduce((sum, e) => sum + e.price, 0);
    const basePrice = Number(product.price) || 0;
    const lineTotal = qty * (basePrice + extrasTotal);
    const extrasSignature = parsedExtras.map((e) => e.id).join('|');
    const noteSignature = note ? note.trim().replace(/\s+/g, '_') : '';
    const id = `${product.id}-${extrasSignature}-${noteSignature}`;
    const item = {
      id,
      productId: product.id,
      name: product.name,
      qty,
      basePrice: basePrice,
      extras: parsedExtras,
      note: note.trim(),
      lineTotal,
    };
    onAdd?.(item);
    // Reset state and close
    setQty(1);
    setSelectedExtras({});
    setNote('');
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
        {img && (
          <Box
            component="img"
            src={img}
            alt={product.name}
            loading="lazy"
            sx={{
              width: '100%',
              maxHeight: { xs: 200, sm: 300 },
              objectFit: 'cover',
              mb: 2,
            }}
          />
        )}
        <Typography variant="h5" mb={0.5}>
          {formatPrice(Number(product.price))}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={description ? 1 : 2}>
          {formatBs(Number(product.price), rate)}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        {extras.map((grp, gIndex) => (
          <Box key={grp.label || gIndex} sx={{ mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            {grp.label && (
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {grp.label}
              </Typography>
            )}
            {grp.options.map((opt, oIndex) => (
              <FormControlLabel
                key={oIndex}
                control={
                  grp.multiple ? (
                    <Checkbox
                      checked={Array.isArray(selectedExtras[gIndex]) && selectedExtras[gIndex].includes(oIndex)}
                      onChange={() => handleOptionChange(gIndex, oIndex)}
                    />
                  ) : (
                    <Radio checked={selectedExtras[gIndex] === oIndex} onChange={() => handleOptionChange(gIndex, oIndex)} />
                  )
                }
                label={`${opt.label}${opt.price > 0 ? ' (+$' + Number(opt.price).toFixed(2) + ')' : ''}`}
              />
            ))}
          </Box>
        ))}
        <Stack direction="row" alignItems="center" spacing={1} mt={2}>
          <Button variant="outlined" onClick={() => handleQtyChange(-1)} disabled={qty === 1}>
            –
          </Button>
          <TextField
            value={qty}
            size="small"
            inputProps={{ readOnly: true, style: { textAlign: 'center', width: 40, fontSize: '1.25rem' } }}
          />
          <Button variant="outlined" onClick={() => handleQtyChange(1)}>
            +
          </Button>
        </Stack>
        <TextField
          label="Nota (opcional)"
          multiline
          rows={2}
          fullWidth
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Seguir viendo</Button>
        <Button variant="contained" onClick={handleAdd} color="primary" startIcon={<FastfoodIcon />}>
          Agregar al pedido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
