import { memo } from 'react';
import Paper from '@mui/material/Paper';
import CardMedia from '@mui/material/CardMedia';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';


function ProductCard({ product, loading = false, onOpen }) {
  if (loading) {
    return (
     <Paper elevation={3} sx={{ p: 1.5, bgcolor: '#2b2b2b', borderRadius: 1 }}>
        <Skeleton height={160} />
        <Skeleton height={18} style={{ marginTop: 8 }} />
        <Skeleton height={14} width="40%" />
      </Paper>
    );
  }

  const img = product.image || '/placeholder.png';
  const price = product.price_usd > 0 ? `$${product.price_usd.toFixed(2)}` : '—';

  return (
   <Paper
      elevation={3}
      sx={{ p: 1.5, bgcolor: '#2b2b2b', borderRadius: 1, cursor: 'pointer' }}
      onClick={() => onOpen?.(product)}
    >
      <CardMedia
        component="img"
        image={img}
        alt={product.name}
        sx={{ height: 160, objectFit: 'cover', borderRadius: 1 }}
      />
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
           {price}
        </Typography>
      </Box>
    </Paper>
  );
}

export default memo(ProductCard);