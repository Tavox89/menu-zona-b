import { memo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
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

function ProductCard({ product, loading = false, onOpen }) {
  const rate = useUsdToBsRate();
  const { items } = useCart();
  if (loading) {
    return (
    <Card sx={{ position: 'relative', height: 200, p: 1 }}>
        <Skeleton height={110} />
        <Box sx={{ mt: 1 }}>
          <Skeleton height={18} width="80%" />
          <Skeleton height={14} width="40%" />
  
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
      elevation={3}
          data-testid={selected ? 'in-cart' : undefined}
      onClick={() => onOpen?.(product)}
      sx={(theme) => ({
        position: 'relative',
          height: 200,
        p: 1,
        display: 'flex',
       flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
          ...(selected && {
          bgcolor: alpha(theme.palette.primary.main, 0.2),
          border: `1px solid ${theme.palette.primary.main}`,
        }),
      })}
    >
   <CardMedia
        component="img"
        src={img}
        onError={handleError}
        alt={product.name}
        sx={{ height: 110, objectFit: 'cover', borderRadius: 1 }}
      />
      <CardContent sx={{ p: 1, flexGrow: 1, overflow: 'hidden' }}>
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
        <Box sx={{ mt: 0.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 500 }}>
            {priceUsd}
          </Typography>
          <Typography sx={{ fontSize: 13 }} color="secondary">
            {priceBs}
          </Typography>
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
