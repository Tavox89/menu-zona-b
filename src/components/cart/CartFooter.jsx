import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, keyframes, useTheme } from '@mui/material/styles';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useCart } from '../../context/CartContext.jsx';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import { formatBs, formatPrice } from '../../utils/price.js';

const cartShimmer = keyframes`
  0%, 82%, 100% {
    transform: translateX(-135%) skewX(-18deg);
    opacity: 0;
  }
  86% {
    opacity: 0.08;
  }
  92% {
    opacity: 0.18;
  }
  97% {
    transform: translateX(135%) skewX(-18deg);
    opacity: 0;
  }
`;
/**
 * Fixed footer that displays a summary of the cart and acts as a handle
 * to open the full cart drawer. It is only rendered when there are
 * items in the cart.
 */
export const FOOTER_HEIGHT = 68;


export default function CartFooter({
  onClick,
  title = 'Ver pedido',
  subtitleFormatter = null,
}) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isLight = theme.palette.mode === 'light';
  const { items, subtotal, attentionTick } = useCart();
  const rate = useUsdToBsRate();
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (!items.length || attentionTick === 0) return undefined;

    setHighlighted(true);
    const timer = window.setTimeout(() => setHighlighted(false), 900);

    return () => window.clearTimeout(timer);
  }, [attentionTick, items.length]);

  if (items.length === 0) return null;

  const itemCount = items.reduce((sum, item) => sum + (item.qty || 0), 0);
  const subtitle =
    typeof subtitleFormatter === 'function'
      ? subtitleFormatter({ itemCount, items })
      : `${itemCount} artículos en el carrito`;
  const baseTransform = isPhone ? 'none' : 'translateX(-50%)';
  const activeTransform = isPhone ? 'translateY(-4px)' : 'translateX(-50%) translateY(-6px)';

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: { xs: 0, sm: 12 },
        left: { xs: 0, sm: '50%' },
        right: { xs: 0, sm: 'auto' },
        width: { xs: '100%', sm: 'min(920px, calc(100vw - 32px))' },
        height: FOOTER_HEIGHT,
        borderRadius: { xs: '20px 20px 0 0', sm: 4 },
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, isLight ? 0.94 : 0.98),
        backdropFilter: 'blur(18px)',
        overflow: 'hidden',
        px: { xs: 2, sm: 2.5 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: (currentTheme) => currentTheme.zIndex.drawer + 1,
        cursor: 'pointer',
        transform: highlighted ? activeTransform : baseTransform,
        transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
        boxShadow: highlighted
          ? `0 24px 50px ${alpha(theme.palette.primary.main, isLight ? 0.24 : 0.22)}`
          : isLight
            ? '0 18px 36px rgba(36,56,76,0.14)'
            : '0 18px 36px rgba(0,0,0,0.22)',
        borderColor: highlighted ? alpha(theme.palette.primary.main, 0.42) : theme.palette.divider,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '34%',
          pointerEvents: 'none',
          background:
            `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${alpha(theme.palette.primary.main, isLight ? 0.14 : 0.22)} 48%, rgba(255,255,255,0) 100%)`,
          animation: `${cartShimmer} 7.2s ease-in-out infinite`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: isLight ? 'rgba(24,40,60,0.06)' : 'rgba(255,255,255,0.06)',
            color: 'primary.main',
          }}
        >
          <ShoppingBagIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: theme.appBrand.faintText }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography fontWeight={700}>{formatPrice(subtotal)}</Typography>
          <Typography sx={{ color: 'primary.main', fontSize: 13 }}>
            {formatBs(subtotal, rate)}
          </Typography>
        </Box>
        <Typography
          sx={{
            minWidth: 28,
            height: 28,
            px: 0.75,
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, isLight ? 0.16 : 0.18),
            color: theme.appBrand.promoBadgeText,
            fontWeight: 700,
            fontSize: 12.5,
          }}
        >
          {itemCount}
        </Typography>
      </Box>
    </Box>
  );
}
