import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { glassGray } from '../../theme/index.js';
import { useCart } from '../../context/CartContext.jsx';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { formatPrice, formatBs } from '../../utils/price.js';

/**
 * Fixed footer that displays a summary of the cart and acts as a handle
 * to open the full cart drawer. It is only rendered when there are
 * items in the cart.
 */
export const FOOTER_HEIGHT = 56;


export default function CartFooter({ onClick }) {
  const { items, subtotal } = useCart();
  const rate = useUsdToBsRate();
  if (items.length === 0) return null;
  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
           height: FOOTER_HEIGHT,
        bgcolor: glassGray,
        backdropFilter: 'blur(10px)',
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        cursor: 'pointer',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingBagIcon />
        <Typography variant="subtitle1">Ver Pedido</Typography>
      </Box>
           <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography fontWeight={600}>{formatPrice(subtotal)}</Typography>
        <Typography sx={{ ml: 0.5, color: 'primary.main' }}>
          ({formatBs(subtotal, rate)})
        </Typography>
      </Box>
    </Box>
  );
}