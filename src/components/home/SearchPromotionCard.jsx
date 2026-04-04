import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import { alpha, useTheme } from '@mui/material/styles';
import { formatBs, formatPrice } from '../../utils/price.js';
import { useUsdToBsRate } from '../../context/RateContext.jsx';
import noImg from '/noImagen.png';

const DEFAULT_PROMOTION_COPY =
  'Una recomendación de la casa, pensada para abrir el pedido con buen gusto.';
const DEFAULT_EVENT_COPY =
  'Una cita especial de la casa para disfrutar el momento con mejor ambiente.';
const DEFAULT_EVENT_META = 'Este sábado · 8:00 PM';
const DEFAULT_EVENT_GUESTS = 'Música en vivo con invitados especiales';
const CARD_RADIUS = 2.5;
const IMAGE_FRAME_RADIUS = 1.25;

function SearchPromotionStockBadge() {
  return (
    <Box
      sx={{
        position: 'absolute',
        right: 8,
        bottom: 8,
        px: 1.35,
        minWidth: 126,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1.6,
        bgcolor: 'rgba(54, 22, 18, 0.92)',
        border: '1px solid',
        borderColor: 'error.main',
        color: '#ffebee',
        fontSize: 11.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.5px',
        pointerEvents: 'none',
      }}
    >
      No disponible
    </Box>
  );
}

export default function SearchPromotionCard({ promotion, onOpenProduct }) {
  const theme = useTheme();
  const rate = useUsdToBsRate();
  const product = promotion?.product;
  const isLight = theme.palette.mode === 'light';

  if (!promotion || !product) {
    return null;
  }

  const image = promotion.image || product.image || noImg;
  const imageFocusX = Number.isFinite(Number(promotion.image_focus_x))
    ? Number(promotion.image_focus_x)
    : 50;
  const imageFocusY = Number.isFinite(Number(promotion.image_focus_y))
    ? Number(promotion.image_focus_y)
    : 50;
  const isPlaceholderImage = image === noImg;
  const title = promotion.title || product.name;
  const isEventPromotion = promotion.promo_style === 'event';
  const copy = promotion.copy || (isEventPromotion ? DEFAULT_EVENT_COPY : DEFAULT_PROMOTION_COPY);
  const eventMeta = promotion.event_meta || DEFAULT_EVENT_META;
  const eventGuests = promotion.event_guests || DEFAULT_EVENT_GUESTS;
  const price = product.price_usd ?? product.price;
  const stockQty = Number(product.stock_qty ?? -1);
  const outOfStock = !product.in_stock || stockQty === 0;
  const handleError = (event) => {
    event.target.src = noImg;
  };

  return (
    <Card
      variant="outlined"
      onClick={outOfStock ? undefined : () => onOpenProduct?.(product)}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 382,
        minHeight: 124,
        display: 'flex',
        overflow: 'hidden',
        cursor: outOfStock ? 'default' : 'pointer',
        p: { xs: 1, sm: 1.2 },
        borderRadius: CARD_RADIUS,
        border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.22 : 0.24)}`,
        background: theme.appBrand.searchPromotionBackground,
        boxShadow: isLight
          ? '0 18px 42px rgba(36,56,76,0.12)'
          : '0 18px 42px rgba(0,0,0,0.18)',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        ...(outOfStock
          ? {}
          : {
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isLight
                  ? '0 26px 54px rgba(36,56,76,0.16)'
                  : '0 26px 54px rgba(0,0,0,0.24)',
              },
            }),
      }}
    >
      <Box
        sx={{
          width: { xs: 84, sm: 96 },
          height: { xs: 84, sm: 96 },
          flexShrink: 0,
          borderRadius: IMAGE_FRAME_RADIUS,
          border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.18 : 0.18)}`,
          overflow: 'hidden',
          bgcolor: theme.appBrand.imageFallbackBg,
        }}
      >
        <Box
          component="img"
          src={image}
          onError={handleError}
          alt={title}
          sx={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: isPlaceholderImage ? 'contain' : 'cover',
            objectPosition: isPlaceholderImage ? 'center' : `${imageFocusX}% ${imageFocusY}%`,
            bgcolor: isPlaceholderImage ? theme.appBrand.placeholderBg : 'transparent',
          }}
        />
      </Box>

      <CardContent
        sx={{
          ml: 1,
          p: { xs: 0.5, sm: 1 },
          pr: 5,
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            mb: 0.65,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.7,
            px: 1,
            py: 0.35,
            borderRadius: 999,
            bgcolor: theme.appBrand.promoBadgeBg,
            color: theme.appBrand.promoBadgeText,
            border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.18 : 0.22)}`,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          {isEventPromotion ? <EventRoundedIcon sx={{ fontSize: 14 }} /> : <LocalOfferRoundedIcon sx={{ fontSize: 14 }} />}
          {promotion.badge || (isEventPromotion ? 'Evento destacado' : 'Promo relacionada')}
        </Box>

        <Typography
          sx={{
            fontWeight: 700,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          variant="body2"
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.45,
            color: theme.appBrand.mutedText,
            fontSize: { xs: 12.5, sm: 13 },
            lineHeight: 1.45,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {copy}
        </Typography>

        {isEventPromotion && (
          <Stack spacing={0.25} sx={{ mt: 0.8 }}>
            <Typography sx={{ fontSize: 12.5, color: isLight ? theme.palette.secondary.main : '#dce9ff', fontWeight: 600 }}>
              {eventMeta}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: theme.appBrand.faintText }}>
              {eventGuests}
            </Typography>
          </Stack>
        )}

        <Box sx={{ mt: 0.7, display: 'flex', flexDirection: 'column', gap: 0.45 }}>
          <Typography
            sx={{ fontSize: { xs: 18, sm: 19 }, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            {formatPrice(price)}
          </Typography>
          <Typography sx={{ fontSize: { xs: 13, sm: 13.5 }, color: 'primary.main', fontWeight: 500 }}>
            {formatBs(price, rate)}
          </Typography>
        </Box>
      </CardContent>

      {outOfStock ? (
        <SearchPromotionStockBadge />
      ) : (
        <IconButton
          aria-label="Abrir promoción"
          onClick={(event) => {
            event.stopPropagation();
            onOpenProduct?.(product);
          }}
          sx={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            width: 38,
            height: 38,
            borderRadius: 1.6,
            bgcolor: theme.appBrand.floatingSurface,
            color: 'primary.main',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'primary.main',
              color: theme.appBrand.onPrimary,
            },
          }}
        >
          <AddCircleOutlineIcon sx={{ fontSize: 22 }} />
        </IconButton>
      )}
    </Card>
  );
}
