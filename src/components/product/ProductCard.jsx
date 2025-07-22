import { memo } from 'react';
import Paper from '@mui/material/Paper';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';


function ProductCard({ product, loading = false, onOpen }) {
  if (loading) {
    return (
       <Paper
        elevation={3}
        sx={{ p: 1.5, bgcolor: '#2b2b2b', borderRadius: 1, display: 'flex', gap: 2 }}
      >
        <Skeleton width={96} height={96} />
        <Box sx={{ flex: 1 }}>
          <Skeleton height={18} width="80%" />
          <Skeleton height={14} width="40%" />
        </Box>
      </Paper>
    );
  }

  const img = product.image || '/placeholder.png';
  const price = product.price_usd > 0 ? `$${product.price_usd.toFixed(2)}` : '—';

  return (
   <Paper
      elevation={3}
           sx={{ p: 1.5, bgcolor: '#2b2b2b', borderRadius: 1, cursor: 'pointer', display: 'flex', gap: 2 }}
      onClick={() => onOpen?.(product)}
    >
     <Box sx={{ width: 96, height: 96, flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}>
        <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
      </Box>
      <Box sx={{ flex: 1 }}>
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