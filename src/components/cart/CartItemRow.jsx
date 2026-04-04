import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import TakeoutDiningRoundedIcon from '@mui/icons-material/TakeoutDiningRounded';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { formatBs, formatPrice } from '../../utils/price.js';
import {
  getEffectiveItemFulfillmentMode,
  getFulfillmentModeChipColor,
  getFulfillmentModeLabel,
} from '../../utils/fulfillment.js';

/**
 * Render a single line in the cart with quantity controls, product image,
 * extras, notes and per‑line pricing. When the product lacks an image we
 * fall back to the global noImagen.png placeholder to avoid broken
 * thumbnails. The line price displays both USD and bolivar values using
 * the same helpers as the product card and modal.
 */
export default function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onSetFulfillmentMode,
}) {
  const theme = useTheme();
  const rate = useUsdToBsRate();
  const fulfillmentMode = getEffectiveItemFulfillmentMode(item);
  // Compute totals. We explicitly parse each extra price to avoid missing
  // additional charges when prices are formatted strings (e.g. "$1.00").
  const extrasTotal = (item.extras ?? []).reduce((sum, e) => {
    const raw = e.price ?? e.price_usd ?? 0;
    let val = 0;
    if (typeof raw === 'string') {
      const stripped = raw.replace(/[^0-9.,-]/g, '');
      val = parseFloat(stripped.replace(',', '.')) || 0;
    } else {
      val = Number(raw) || 0;
    }
    return sum + val;
  }, 0);
  const base = Number(item.basePrice ?? 0) + extrasTotal;
  const unitUsd = base;
  const lineUsd = base * (item.qty || 0);
  // Determine if we should display a line total. When there is only one
  // unit of the product in the cart the total would equal the unit price
  // and displaying it again adds clutter. For quantities greater than one
  // we show the total but render it with a smaller font size so it fits
  // neatly on a single line.
  const showLineTotal = (item.qty ?? 0) > 1;
  return (
    <ListItem
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        gap: 1,
        px: 0,
        py: 1.1,
        borderRadius: 3,
        background: theme.palette.mode === 'light' ? 'rgba(24,40,60,0.03)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${theme.appBrand.softBorderColor}`,
        mb: 1,
        overflow: 'hidden',
      }}
    >
      {/* Image column */}
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
          src={item.image || '/noImagen.png'}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </Box>
      {/* Main details: name, extras, notes and unit price */}
      <Box sx={{ flex: '1 1 180px', minWidth: 0, overflow: 'hidden' }}>
        <Typography
          variant="subtitle2"
          sx={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {item.name}
        </Typography>
        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
          <Chip
            size="small"
            color={getFulfillmentModeChipColor(fulfillmentMode)}
            variant="outlined"
            icon={
              fulfillmentMode === 'takeaway' ? <TakeoutDiningRoundedIcon /> : <TableRestaurantOutlinedIcon />
            }
            label={getFulfillmentModeLabel(fulfillmentMode)}
          />
          {typeof onSetFulfillmentMode === 'function' ? (
            <Button
              size="small"
              variant="text"
              onClick={() =>
                onSetFulfillmentMode(
                  item.id,
                  fulfillmentMode === 'takeaway' ? 'dine_in' : 'takeaway'
                )
              }
              sx={{ minHeight: 24, px: 0.8 }}
            >
              {fulfillmentMode === 'takeaway' ? 'Pasar a mesa' : 'Pasar a llevar'}
            </Button>
          ) : null}
        </Stack>
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
        {/* Unit price in USD/Bs displayed under the description */}
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {formatPrice(unitUsd)} ({formatBs(unitUsd, rate)})
        </Typography>
      </Box>
      {/* Controls and line total */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: { xs: 'stretch', sm: 'flex-end' },
          width: { xs: '100%', sm: 'auto' },
          ml: { sm: 1 },
          pl: { xs: 0, sm: 0 },
        }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{
            flexWrap: 'wrap',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          }}
        >
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
        {/* Line total appears below the quantity controls only when
            more than one unit is ordered. Use a caption style to
            minimise the vertical space taken so the text stays on one
            line even with longer numbers. */}
        {showLineTotal && (
          <Typography variant="caption" sx={{ mt: 0.5, textAlign: { xs: 'left', sm: 'right' } }}>
            {formatPrice(lineUsd)} ({formatBs(lineUsd, rate)})
          </Typography>
        )}
      </Box>
    </ListItem>
  );
}
