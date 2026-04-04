import { memo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import IconButton from '@mui/material/IconButton';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { alpha, useTheme } from '@mui/material/styles';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatBs, formatPrice } from '../../utils/price.js';
import noImg from '/noImagen.png';

const CARD_RADIUS = 2.5;
const IMAGE_FRAME_RADIUS = 1.25;

const StockBadge = () => (
  <Box
    sx={{
      position: 'absolute',
      right: 8,
      bottom: 8,
      px: 1.35,
      minWidth: 126,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 1.6,
      bgcolor: (theme) => theme.appBrand.stockBg,
      border: '1px solid',
      borderColor: 'error.main',
      color: (theme) => theme.appBrand.stockText,
      fontSize: 11.5,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '.5px',
      pointerEvents: 'none',
    }}
  >
    No disponible
  </Box>
);

/**
 * Individual product card. When loading is true a skeleton placeholder is
 * shown. Otherwise the card displays the product image, name and price
 * with the bolivar conversion. A floating add button opens the
 * configuration dialog and, when the product is already in the cart,
 * shows the current quantity to the left of the plus icon. This makes it
 * immediately clear how many of each item the customer has selected.
 */
function ProductCard({ product, loading = false, onOpen }) {
  const theme = useTheme();
  const rate = useUsdToBsRate();
  const { items } = useCart();
  if (loading) {
    return (
      <Card
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 382,
          minHeight: 124,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          p: { xs: 1, sm: 1.2 },
          flexShrink: 0,
          borderRadius: CARD_RADIUS,
          borderWidth: 1,
          borderColor: (theme) => theme.palette.divider,
          background: (theme) => theme.appBrand.cardBackground,
        }}
      >
        <Skeleton
          width={88}
          height={88}
          style={{ borderRadius: 14, flexShrink: 0 }}
        />
        <Box sx={{ flexGrow: 1, ml: 1 }}>
          <Skeleton height={18} width="80%" style={{ borderRadius: 12 }} />
          <Skeleton height={14} width="40%" style={{ borderRadius: 12 }} />
        </Box>
      </Card>
    );
  }

  // Handle missing product images by falling back to the placeholder
  const handleError = (e) => {
    e.target.src = noImg;
  };
  const img = product.image || noImg;
  const isPlaceholderImage = img === noImg;
  const usd = Number(product.price_usd ?? product.price) || 0;
  const priceUsd = formatPrice(usd);
  const priceBs = formatBs(usd, rate);
  const stockQty = Number(product.stock_qty ?? -1);
  const outOfStock = !product.in_stock || stockQty === 0;
  // Determine if the product is currently in the cart and accumulate qty
  const qtyInCart = items
    .filter((i) => i.productId === product.id)
    .reduce((sum, i) => sum + i.qty, 0);
  const selected = qtyInCart > 0;

  return (
    <Card
      variant="outlined"
      data-testid={selected ? 'in-cart' : undefined}
      onClick={outOfStock ? undefined : () => onOpen?.(product)}
      sx={(theme) => ({
        position: 'relative',
        width: '100%',
        maxWidth: 382,
        minHeight: 124,
        display: 'flex',
        overflow: 'hidden',
        flexShrink: 0,
        p: { xs: 1, sm: 1.2 },
        alignItems: 'flex-start',
        cursor: outOfStock ? 'default' : 'pointer',
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: theme.palette.divider,
        background: theme.appBrand.cardBackground,
        boxShadow: theme.palette.mode === 'light'
          ? '0 18px 36px rgba(36,56,76,0.1)'
          : '0 18px 36px rgba(0,0,0,0.16)',
        ...(outOfStock
          ? {}
          : {
              '&:hover': {
                boxShadow: theme.palette.mode === 'light'
                  ? '0 26px 54px rgba(36,56,76,0.16)'
                  : '0 26px 54px rgba(0,0,0,0.22)',
                transform: 'translateY(-2px)',
              },
            }),
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        ...(selected && {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
          borderColor: theme.palette.primary.main,
        }),
      })}
    >
      <Box
        sx={{
          width: { xs: 84, sm: 96 },
          height: { xs: 84, sm: 96 },
          flexShrink: 0,
          borderRadius: IMAGE_FRAME_RADIUS,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          bgcolor: theme.appBrand.imageFallbackBg,
        }}
      >
        <Box
          component="img"
          src={img}
          onError={handleError}
          alt={product.name}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: 0,
            objectFit: isPlaceholderImage ? 'contain' : 'cover',
            display: 'block',
            bgcolor: isPlaceholderImage ? theme.appBrand.placeholderBg : 'transparent',
          }}
        />
      </Box>
      <CardContent
        sx={{
          ml: 1,
          p: { xs: 0.5, sm: 1 },
          pr: outOfStock ? 2.25 : 5,
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          variant="body2"
        >
          {product.name}
        </Typography>
        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography sx={{ fontSize: { xs: 18, sm: 19 }, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {priceUsd}
          </Typography>
          <Typography sx={{ fontSize: { xs: 13, sm: 13.5 }, color: 'primary.main', fontWeight: 500 }}>
            {priceBs}
          </Typography>
        </Box>
      </CardContent>
      {outOfStock ? (
         <StockBadge />
      ) : (
        <IconButton
          aria-label="Agregar producto"
          onClick={(e) => {
            // prevent the card click event from also firing the open handler
            e.stopPropagation();
            onOpen?.(product);
          }}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 38,
            height: 38,
            borderRadius: 1.6,
            bgcolor: theme.appBrand.floatingSurface,
            color: 'primary.main',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'primary.main',
              color: theme.appBrand.onPrimary,
            },
          }}
        >
          {/* If the product has been added, show its quantity just to the left of the plus icon */}
          {qtyInCart > 0 && (
            <Box
              sx={{
                position: 'absolute',
                left: -22,
                top: 3,
                bgcolor: 'primary.main',
                color: theme.appBrand.onPrimary,
                borderRadius: 999,
                minWidth: 20,
                height: 20,
                px: 0.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {qtyInCart}
            </Box>
          )}
          <AddCircleOutlineIcon sx={{ fontSize: 22 }} />
        </IconButton>
      )}
    </Card>
  );
}

export default memo(ProductCard);
