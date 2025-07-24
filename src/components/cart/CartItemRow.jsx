import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { formatPrice, formatBs } from '../../utils/price.js';
import { calcLine } from '../../utils/cartTotals.js';
export default function CartItemRow({ item, onIncrement, onDecrement, onRemove }) {
  const rate = useUsdToBsRate();
    const lineUsd = calcLine(item);
  return (
    <ListItem
      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 1 }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          borderRadius: 1,
          overflow: 'hidden',
          mr: 1,
        }}
      >
        <img
          src={item.image || '/placeholder.png'}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Typography
          variant="subtitle2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
        </Typography>
        {item.extras?.length > 0 && (
          <Typography variant="caption" sx={{ display: 'block', ml: 1.5 }}>
            • {item.extras.map((e) => e.label).join(', ')}
          </Typography>
        )}
        {item.note && (
          <Typography
            variant="caption"
            sx={{ display: 'block', ml: 1.5, fontStyle: 'italic' }}
          >
            “{item.note}”
          </Typography>
        )}
        <Typography variant="body2" sx={{ mt: 0.5 }}>
         {formatPrice(lineUsd)} ({formatBs(lineUsd, rate)})
        </Typography>
      </Box>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 1 }}>
        <IconButton
          size="small"
          onClick={() => onDecrement(item.id, item.qty)}
          disabled={item.qty <= 1}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" sx={{ width: 20, textAlign: 'center' }}>
          {item.qty}
        </Typography>
        <IconButton size="small" onClick={() => onIncrement(item.id, item.qty)}>
          <AddIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => onRemove(item.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    </ListItem>
  );
}