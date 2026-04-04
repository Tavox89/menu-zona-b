import { useEffect, useState } from 'react';
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
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { formatBs, formatPrice } from '../../utils/price.js';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import DOMPurify from 'dompurify';
import { buildCartItemId } from '../../utils/cartItem.js';
import { useCart } from '../../context/CartContext.jsx';

function ProductPreview({ src, alt, extrasCount }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [zoom, setZoom] = useState(false);
  if (!src) return null;
  const maxHeight = extrasCount > 3 ? 220 : 300;
  return (
    <>
      <Box
        sx={{
          width: '100%',
          background: theme.appBrand.cardBackground,
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          aria-label="Ver imagen completa"
          onClick={() => setZoom(true)}
          style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight }}
        />
      </Box>
      <Dialog
        fullScreen
        open={zoom}
        onClose={() => setZoom(false)}
        PaperProps={{
          sx: {
            background: theme.appBrand.dialogBackground,
          },
        }}
      >
        <IconButton
          aria-label="Cerrar imagen"
          onClick={() => setZoom(false)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: theme.palette.text.primary,
            zIndex: 2,
            bgcolor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.34)',
            '&:hover': {
              bgcolor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.48)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            p: 2,
          }}
        >
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
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isShortLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');
  const isLight = theme.palette.mode === 'light';
  const [qty, setQty] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState({});
  const [note, setNote] = useState('');
  const { fulfillmentMode } = useCart();

  const rate = useUsdToBsRate();
  const productId = product?.id ?? 0;

  useEffect(() => {
    if (!open || !productId) {
      return;
    }

    setQty(1);
    setSelectedExtras({});
    setNote('');
  }, [open, productId]);

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
        if (opt) {
          parsedExtras.push({
            id: opt.option_id ?? opt.id ?? `${gi}-${oi}`,
            option_id: opt.option_id ?? opt.id ?? `${gi}-${oi}`,
            group_id: opt.group_id ?? grp.group_id ?? `group_${gi}`,
            label: opt.label,
            price: Number(opt.price) || 0,
          });
        }
      });
    });
    const extrasTotal = parsedExtras.reduce((sum, e) => sum + e.price, 0);
    const basePrice = Number(product.price_usd ?? product.price) || 0;
    const lineTotal = qty * (basePrice + extrasTotal);
    const id = buildCartItemId(product.id, parsedExtras, note, fulfillmentMode);
    const item = {
      id,
      productId: product.id,
      sku: product.sku ?? '',
      name: product.name,
      qty,
      basePrice,
      extras: parsedExtras,
      note: note.trim(),
      image: img,
      fulfillmentMode,
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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isPhone || isShortLandscape}
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        sx: {
          width: '100%',
          m: { xs: 0, sm: 2 },
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: { xs: 0, sm: 3 },
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isLight ? '0 30px 80px rgba(36,56,76,0.16)' : '0 30px 80px rgba(0,0,0,0.28)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          position: 'sticky',
          top: 0,
          zIndex: 2,
          backdropFilter: 'blur(12px)',
          background: theme.appBrand.headerBackground,
          borderBottom: `1px solid ${theme.appBrand.softBorderColor}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, pr: 1 }}>
          <FastfoodIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography
            component="span"
            variant="h6"
            sx={{
              minWidth: 0,
              overflowWrap: 'anywhere',
              fontSize: { xs: '1rem', sm: '1.4rem' },
              fontWeight: 700,
            }}
          >
            {product.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          flex: 1,
          overflowY: 'auto',
          background: `radial-gradient(circle at top, ${theme.appBrand.sectionGlow}, transparent 30%)`,
        }}
      >
        <Stack spacing={1.5}>
          {img && (
            <ProductPreview src={img} alt={product.name} extrasCount={extras.length} />
          )}
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              background: theme.appBrand.frostedPanel,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography sx={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.appBrand.faintText }}>
              Precio actual
            </Typography>
            <Typography fontSize={32} fontWeight={700} lineHeight={1}>
              {priceUsd}
            </Typography>
            <Typography fontSize={15} color="primary.main" fontWeight={500} sx={{ mt: 0.6 }}>
              {priceBs}
            </Typography>
          </Box>
          {safeHTML && (
            <Box
              sx={{
                mt: 1,
                fontSize: 14.5,
                lineHeight: 1.5,
                '& ul': { pl: 2, mb: 0 },
                '& li': { mb: 0.5 },
              }}
              dangerouslySetInnerHTML={{ __html: safeHTML }}
            />
          )}
          {extras.map((grp, gIndex) => (
            <Box
              key={grp.label || grp.group_id || gIndex}
              sx={{
                p: 1.5,
                borderRadius: 3,
                background: isLight ? 'rgba(24,40,60,0.03)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${theme.appBrand.softBorderColor}`,
              }}
            >
              {grp.label && (
                <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
                  {grp.label}
                </Typography>
              )}
              {grp.options.map((opt, oIndex) => (
                <FormControlLabel
                  key={opt.option_id ?? opt.id ?? oIndex}
                  sx={{
                    alignItems: 'flex-start',
                    m: 0,
                    width: '100%',
                    borderRadius: 2,
                    px: 0.5,
                    py: 0.25,
                    '& .MuiFormControlLabel-label': {
                      fontSize: 14,
                      overflowWrap: 'anywhere',
                    },
                  }}
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
          {outOfStock ? (
          <Typography
            sx={{ textAlign: 'center', width: '100%', py: 1, color: 'text.disabled', fontWeight: 600 }}
          >
            Sin existencias
          </Typography>
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            flexWrap="wrap"
            sx={{
              p: 1.25,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              background: isLight ? 'rgba(24,40,60,0.03)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <Button variant="outlined" onClick={() => handleQtyChange(-1)} disabled={qty === 1} sx={{ minWidth: 52 }}>
              –
            </Button>
            <TextField
              value={qty}
              size="small"
              sx={{ width: 90 }}
              inputProps={{ readOnly: true, style: { textAlign: 'center', fontSize: '1.25rem' } }}
            />
            <Button variant="outlined" onClick={() => handleQtyChange(1)} sx={{ minWidth: 52 }}>
              +
            </Button>
          </Stack>
        )}
        <TextField
          label="Nota para cocina (opcional)"
          multiline
          rows={3}
          fullWidth
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. poca salsa, sin cebolla..."
        />
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 1.5, sm: 2 },
          pt: 1.5,
          pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          gap: 1,
          flexShrink: 0,
          borderTop: `1px solid ${theme.appBrand.softBorderColor}`,
          backdropFilter: 'blur(12px)',
          background: theme.appBrand.headerBackground,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          '& > :not(style)': {
            m: 0,
            width: { xs: '100%', sm: 'auto' },
          },
        }}
      >
        <Button onClick={onClose}>Seguir viendo</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          color="primary"
          startIcon={<FastfoodIcon />}
          disabled={outOfStock}
        >
          {outOfStock ? 'Sin existencias' : 'Agregar al pedido'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
