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
import DOMPurify from 'dompurify';

function ProductPreview({ src, alt, extrasCount }) {
  const [zoom, setZoom] = useState(false);
  if (!src) return null;
  const maxHeight = extrasCount > 3 ? 200 : 270;
  return (
    <>
      <Box sx={{ width: '100%', background: '#000' }}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          aria-label="Ver imagen completa"
          onClick={() => setZoom(true)}
          style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight }}
        />
      </Box>
      <Dialog fullScreen open={zoom} onClose={() => setZoom(false)}>
        <IconButton
          aria-label="Cerrar imagen"
          onClick={() => setZoom(false)}
          sx={{ position: 'absolute', top: 8, right: 8, color: 'common.white' }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 2 }}>
          <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </Box>
      </Dialog>
    </>
  );
}

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

  const img = product.image || product.images?.[0]?.src || '';
  const description = product.short_description || product.description || '';
    const safeHTML = DOMPurify.sanitize(description || '');
  const { extras = [] } = product;
  const usd = Number(product.price_usd ?? product.price) || 0;
  const priceUsd = formatPrice(usd);
  const priceBs = formatBs(usd, rate);
  const stockQty = Number(product.stock_qty ?? -1);
  const outOfStock = !product.in_stock || stockQty === 0;
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
        if (outOfStock) return;
    const parsedExtras = [];
    extras.forEach((grp, gi) => {
      const sel = selectedExtras[gi];
     if (sel == null) return;
      const selIdx = Array.isArray(sel) ? sel : [sel];
      selIdx.forEach((oi) => {
        const opt = grp.options[oi];
        if (opt) parsedExtras.push({ id: `${gi}-${oi}`, label: opt.label, price: Number(opt.price) || 0 });
      });
    });
    const extrasTotal = parsedExtras.reduce((sum, e) => sum + e.price, 0);
     const basePrice = Number(product.price_usd ?? product.price) || 0;
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
      // Persist the product image on the line item for rendering in the cart
      image: img,
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FastfoodIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography component="span" variant="h6">
            {product.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {img && (
            <ProductPreview src={img} alt={product.name} extrasCount={extras.length} />
          )}
          <Box>
            <Typography fontSize={18} fontWeight={600}>
              {priceUsd}
            </Typography>
            <Typography fontSize={15} color="primary.main">
              {priceBs}
            </Typography>
          </Box>
                 {safeHTML && (
            <Box
              sx={{
                mt: 1,
                fontSize: 14,
                lineHeight: 1.35,
                '& ul': { pl: 2, mb: 0 },
                '& li': { mb: 0.5 },
              }}
              dangerouslySetInnerHTML={{ __html: safeHTML }}
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
              label={`${opt.label}${opt.price > 0 ? ' (+' + formatPrice(opt.price) + ')' : ''}`}
              />
            ))}
          </Box>
        ))}
       <Stack direction="row" alignItems="center" spacing={1}>
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
          label="Nota para cocina (opcional)"
          multiline
          rows={2}
          fullWidth
          value={note}
          onChange={(e) => setNote(e.target.value)}
       
          placeholder="Ej. poca salsa, sin cebolla..."
        />
               </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Seguir viendo</Button>
             <Button
          variant="contained"
          onClick={handleAdd}
          color="primary"
          startIcon={<FastfoodIcon />}
          disabled={outOfStock}
        >
          Agregar al pedido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
