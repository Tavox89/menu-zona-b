import { memo } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { formatPrice, formatBs } from '../../utils/price.js';

function ProductCard({ product, loading = false, onOpen }) {
  const rate = useUsdToBsRate();
  // Render loading skeletons if waiting for data
  if (loading) {
    return (
      <Paper
        elevation={3}
        sx={{
          position: 'relative',
          p: 1.5,
          bgcolor: '#2b2b2b',
          borderRadius: 1,
          display: 'flex',
          gap: 2,
          minHeight: 140,
        }}
      >
        <Skeleton width={96} height={96} />
        <Box sx={{ flex: 1 }}>
          <Skeleton height={18} width="80%" />
          <Skeleton height={14} width="40%" />
          <Skeleton height={12} width="30%" />
        </Box>
      </Paper>
    );
  }

  // Fallback to placeholder if image missing
  const img = product.image || '/placeholder.png';
  const usd = Number(product.price_usd ?? product.price) || 0;
  const priceUsd = formatPrice(usd);
  const priceBs = formatBs(usd, rate);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'relative',
        p: 1.5,
        bgcolor: '#2b2b2b',
        borderRadius: 1,
        display: 'flex',
        gap: 2,
        minHeight: 140,
        cursor: 'pointer',
      }}
      onClick={() => onOpen?.(product)}
    >
      {/* Image wrapper */}
      <Box
        sx={{
          width: 96,
          height: 96,
          flexShrink: 0,
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <img
          src={img}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </Box>
      {/* Info column */}
      <Box sx={{ flex: 1, overflow: 'hidden', pr: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {priceUsd}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {priceBs}
        </Typography>
      </Box>
      {/* Add icon overlay. Stop propagation so it doesn’t trigger the parent onClick twice */}
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onOpen?.(product);
        }}
        sx={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          bgcolor: 'background.paper',
          color: 'primary.main',
          boxShadow: 1,
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'background.paper',
          },
        }}
      >
        <AddCircleOutlineIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
}

export default memo(ProductCard);
