import { memo } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { formatPrice } from '../../utils/price.js';

function ProductCard({ product, loading = false, onOpen }) {
  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 1.5, display: 'flex', gap: 2 }}>
        <Skeleton width={96} height={96} />
        <Box sx={{ flex: 1 }}>
          <Skeleton height={18} width="80%" />
          <Skeleton height={14} width="40%" />
        </Box>
      </Paper>
    );
  }

  const imageSrc = product?.images?.[0]?.src;
  return (
   <Paper
      elevation={3}
      sx={{ p: 1.5, display: 'flex', gap: 2, cursor: 'pointer' }}
      onClick={() => onOpen?.(product)}
    >
        <Box sx={{ width: 96, height: 96, flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}>
        {imageSrc && (
          <img
            src={imageSrc}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        )}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatPrice(Number(product.price))}
        </Typography>
      </Box>
    </Paper>
  );
}

export default memo(ProductCard);