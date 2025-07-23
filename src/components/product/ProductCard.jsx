import { memo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { alpha } from '@mui/material/styles';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice, formatBs } from '../../utils/price.js';
import noImg from '/noImagen.png';
const RADIUS = 4;
function ProductCard({ product, loading = false, onOpen }) {
  const rate = useUsdToBsRate();
  const { items } = useCart();
  if (loading) {
    return (
      <Card
       variant="outlined"
        sx={{
        width: 382,
          height: 110,
       
          display: 'flex',
                   overflow: 'hidden',
          position: 'relative',
          p: 1,
          flexShrink: 0,
         borderRadius: RADIUS,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          backgroundColor: '#2b2b2b',
        }}
      >
            <Skeleton width={96} height={96} style={{ borderRadius: RADIUS }} />
        <Box sx={{ flexGrow: 1, ml: 1 }}>
          <Skeleton height={18} width="80%" style={{ borderRadius: RADIUS }} />
          <Skeleton height={14} width="40%" style={{ borderRadius: RADIUS }} />
  
        </Box>
     </Card>
    );
  }

  const handleError = (e) => {
    e.target.src = noImg;
  };

  const img = product.image || noImg;
  const usd = Number(product.price_usd ?? product.price) || 0;
  const priceUsd = formatPrice(usd);
  const priceBs = formatBs(usd, rate);
  const selected = items.some((i) => i.productId === product.id);

  return (
       <Card
      variant="outlined"
      data-testid={selected ? 'in-cart' : undefined}
      onClick={() => onOpen?.(product)}
      sx={(theme) => ({
        position: 'relative',
              width: 382,
        height: 110,
           display: 'flex',
        overflow: 'hidden',
        flexShrink: 0,
        p: 1,
         alignItems: 'flex-start',
        cursor: 'pointer',
            borderRadius: RADIUS,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#2b2b2b',
        '&:hover': { boxShadow: 6 },
        ...(selected && {
          backgroundColor: alpha(theme.palette.primary.main, 0.2),
          borderColor: theme.palette.primary.main,
        }),
      })}
    >
    <Box
       component="img"
      src={img}
      onError={handleError}
      alt={product.name}
      sx={{
        width: 96,
        height: 96,
            borderRadius: RADIUS,
        objectFit: 'cover',
        flexShrink: 0,
      }}
    />
            <CardContent sx={{ ml: 1, p: 1, flexGrow: 1, overflow: 'hidden' }}>
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
          <Typography sx={{ fontSize: 15, fontWeight: 500 }}>{priceUsd}</Typography>
        <Typography sx={{ fontSize: 13, color: 'primary.main' }}>{priceBs}</Typography>
        </Box>
      </CardContent>
      <IconButton
              aria-label="Agregar producto"
        onClick={(e) => {
          e.stopPropagation();
          onOpen?.(product);
        }}
        sx={{
          position: 'absolute',
             bottom: 8,
          right: 8,
          width: 28,
          height: 28,
          bgcolor: 'background.paper',
          color: 'primary.main',
          boxShadow: 1,
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'background.paper',
          },
        }}
      >
         <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Card>
  );
}

export default memo(ProductCard);
