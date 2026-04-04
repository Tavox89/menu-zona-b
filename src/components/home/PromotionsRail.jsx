import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, keyframes, useTheme } from '@mui/material/styles';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import { formatBs, formatPrice } from '../../utils/price.js';
import { useUsdToBsRate } from '../../context/RateContext.jsx';

const shimmer = keyframes`
  0% { transform: translateX(-120%); opacity: 0; }
  20% { opacity: 0.45; }
  100% { transform: translateX(120%); opacity: 0; }
`;

const promoBackdropEnter = keyframes`
  0% { opacity: 0; transform: scale(1.035); filter: saturate(0.92) blur(8px); }
  100% { opacity: 0.92; transform: scale(1); filter: saturate(1) blur(0); }
`;

const promoContentEnter = keyframes`
  0% { opacity: 0; transform: translate3d(0, 20px, 0) scale(0.985); filter: blur(10px); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
`;

const AUTOPLAY_MS = 5500;
const DEFAULT_PROMOTION_COPY =
  'Una recomendación de la casa, pensada para abrir el pedido con buen gusto.';
const DEFAULT_EVENT_COPY =
  'Reserva la noche y disfruta un encuentro especial de la casa, pensado para compartir con buena música y mejor ambiente.';
const DEFAULT_EVENT_META = 'Este sábado · 8:00 PM';
const DEFAULT_EVENT_GUESTS = 'Música en vivo con invitados especiales';

export default function PromotionsRail({ promotions = [], onOpenProduct }) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const isLight = theme.palette.mode === 'light';
  const rate = useUsdToBsRate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (promotions.length <= 1 || paused) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % promotions.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [promotions.length, paused]);

  useEffect(() => {
    if (index >= promotions.length) {
      setIndex(0);
    }
  }, [index, promotions.length]);

  if (!promotions.length) return null;

  const active = promotions[index];
  const product = active?.product ?? null;
  const hasProduct = Boolean(product);

  const activeKey = active.id ?? `${active.product_id ?? 'promo'}-${index}`;
  const image = active.image || product?.image || '/noImagen.png';
  const imageFocusX = Number.isFinite(Number(active.image_focus_x))
    ? Number(active.image_focus_x)
    : 50;
  const imageFocusY = Number.isFinite(Number(active.image_focus_y))
    ? Number(active.image_focus_y)
    : 50;
  const title = active.title || product?.name || 'Evento especial';
  const isEventPromotion = active.promo_style === 'event';
  const copy = active.copy || (isEventPromotion ? DEFAULT_EVENT_COPY : DEFAULT_PROMOTION_COPY);
  const eventMeta = active.event_meta || DEFAULT_EVENT_META;
  const eventGuests = active.event_guests || DEFAULT_EVENT_GUESTS;

  if (!hasProduct && !isEventPromotion && !active.image && !active.title) return null;

  const handlePrev = () => {
    setIndex((current) => (current - 1 + promotions.length) % promotions.length);
  };

  const handleNext = () => {
    setIndex((current) => (current + 1) % promotions.length);
  };

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 3, sm: 4 },
        border: isCompact
          ? `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.14 : 0.18)}`
          : `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.18 : 0.24)}`,
        background:
          isCompact
            ? isEventPromotion
              ? isLight
                ? 'radial-gradient(circle at top left, rgba(36,56,76,0.12), transparent 36%), radial-gradient(circle at bottom right, rgba(161,13,114,0.05), transparent 28%), linear-gradient(135deg, rgba(255,252,247,0.98) 0%, rgba(248,241,235,0.96) 52%, rgba(240,232,224,0.98) 100%)'
                : 'radial-gradient(circle at top left, rgba(77, 128, 255, 0.12), transparent 36%), radial-gradient(circle at bottom right, rgba(212, 175, 55, 0.05), transparent 28%), linear-gradient(135deg, rgba(16,18,24,0.99) 0%, rgba(23,23,28,0.97) 52%, rgba(10,10,12,0.99) 100%)'
              : isLight
                ? 'radial-gradient(circle at top left, rgba(161,13,114,0.1), transparent 36%), radial-gradient(circle at bottom right, rgba(36,56,76,0.05), transparent 28%), linear-gradient(135deg, rgba(255,252,247,0.98) 0%, rgba(248,241,235,0.96) 52%, rgba(240,232,224,0.98) 100%)'
                : 'radial-gradient(circle at top left, rgba(244, 205, 95, 0.08), transparent 36%), radial-gradient(circle at bottom right, rgba(212, 175, 55, 0.04), transparent 28%), linear-gradient(135deg, rgba(18,18,18,0.99) 0%, rgba(24,24,24,0.97) 52%, rgba(10,10,10,0.99) 100%)'
            : isEventPromotion
              ? isLight
                ? 'radial-gradient(circle at top left, rgba(36,56,76,0.14), transparent 40%), radial-gradient(circle at bottom right, rgba(161,13,114,0.06), transparent 30%), linear-gradient(135deg, rgba(255,252,247,0.98) 0%, rgba(248,241,235,0.95) 52%, rgba(240,232,224,0.98) 100%)'
                : 'radial-gradient(circle at top left, rgba(77, 128, 255, 0.16), transparent 40%), radial-gradient(circle at bottom right, rgba(212, 175, 55, 0.06), transparent 30%), linear-gradient(135deg, rgba(17,20,28,0.98) 0%, rgba(24,28,40,0.95) 52%, rgba(10,10,14,0.98) 100%)'
              : isLight
                ? 'radial-gradient(circle at top left, rgba(161,13,114,0.12), transparent 40%), radial-gradient(circle at bottom right, rgba(36,56,76,0.08), transparent 30%), linear-gradient(135deg, rgba(255,252,247,0.98) 0%, rgba(248,241,235,0.95) 52%, rgba(240,232,224,0.98) 100%)'
                : 'radial-gradient(circle at top left, rgba(244, 205, 95, 0.12), transparent 40%), radial-gradient(circle at bottom right, rgba(212, 175, 55, 0.06), transparent 30%), linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(35,35,35,0.95) 52%, rgba(12,12,12,0.98) 100%)',
        boxShadow: isLight ? '0 24px 60px rgba(36,56,76,0.16)' : '0 24px 60px rgba(0,0,0,0.28)',
        minHeight: { xs: 270, sm: 320 },
      }}
    >
      <Box
        key={`promo-bg-${activeKey}`}
        sx={{
          position: 'absolute',
          inset: 0,
          animation: `${promoBackdropEnter} 560ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `${
              isLight
                ? `linear-gradient(90deg, rgba(250,245,239,0.96) 0%, rgba(250,245,239,${isCompact ? '0.92' : '0.82'}) 46%, rgba(250,245,239,${isCompact ? '0.64' : '0.44'}) 82%), url(${image})`
                : `linear-gradient(90deg, rgba(8,8,8,0.98) 0%, rgba(8,8,8,${isCompact ? '0.9' : '0.8'}) 46%, rgba(8,8,8,${isCompact ? '0.62' : '0.42'}) 82%), url(${image})`
            }`,
            backgroundPosition: `${imageFocusX}% ${imageFocusY}%`,
            backgroundSize: 'cover',
            opacity: isCompact ? 0.84 : 0.9,
          }}
        />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          inset: '-10% auto 0 -15%',
          width: { xs: '65%', sm: '38%' },
          background:
            isCompact
              ? `linear-gradient(90deg, rgba(255,255,255,0.01), ${alpha(theme.palette.primary.main, isLight ? 0.08 : 0.08)}, rgba(255,255,255,0.01))`
              : `linear-gradient(90deg, rgba(255,255,255,0.01), ${alpha(theme.palette.primary.main, isLight ? 0.12 : 0.12)}, rgba(255,255,255,0.01))`,
          transform: 'skewX(-20deg)',
          animation: `${shimmer} 5.8s linear infinite`,
          pointerEvents: 'none',
        }}
      />

      <Box
        key={`promo-content-${activeKey}`}
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: { xs: 2.5, sm: 3 },
          p: { xs: 2.25, sm: 3.5 },
          minHeight: 'inherit',
          animation: `${promoContentEnter} 460ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        }}
      >
        <Stack spacing={1.5} sx={{ maxWidth: { xs: '100%', sm: '52%' } }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              icon={isEventPromotion ? <EventRoundedIcon /> : <LocalFireDepartmentRoundedIcon />}
              label={active.badge || (isEventPromotion ? 'Este sábado' : 'Selección VIP')}
              color="primary"
              sx={{
                bgcolor: isEventPromotion
                  ? alpha('#69a6ff', isCompact ? 0.14 : 0.18)
                  : alpha('#d8ac1e', isCompact ? 0.12 : 0.16),
                color: isEventPromotion ? (isLight ? theme.palette.secondary.main : '#dce9ff') : theme.appBrand.promoBadgeText,
                border: isEventPromotion
                  ? `1px solid ${isLight ? 'rgba(36,56,76,0.18)' : 'rgba(162, 197, 255, 0.24)'}`
                  : `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.22 : 0.24)}`,
              }}
            />
            <Chip
              label={`Promo ${index + 1}/${promotions.length}`}
              variant="outlined"
              sx={{
                color: theme.palette.text.primary,
                borderColor: theme.appBrand.promoNeutralBorder,
                bgcolor: theme.appBrand.promoNeutralBg,
                backdropFilter: 'blur(6px)',
              }}
            />
          </Stack>

          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: 30, sm: 44 },
              lineHeight: 0.98,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              maxWidth: 640,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              maxWidth: 520,
              color: theme.palette.text.primary,
              fontSize: { xs: 14.5, sm: 16 },
              lineHeight: 1.55,
              textShadow: isLight ? 'none' : '0 2px 12px rgba(0,0,0,0.28)',
            }}
          >
            {copy}
          </Typography>

          {isEventPromotion && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.2}
              useFlexGap
              sx={{ maxWidth: 640 }}
            >
              <Box
                sx={{
                  minWidth: { xs: '100%', sm: 210 },
                  px: 1.35,
                  py: 1.1,
                  borderRadius: 2,
                  bgcolor: 'rgba(92, 140, 255, 0.14)',
                  border: `1px solid ${isLight ? 'rgba(36,56,76,0.14)' : 'rgba(162, 197, 255, 0.16)'}`,
                }}
              >
                <Stack direction="row" spacing={0.9} alignItems="center">
                  <EventRoundedIcon sx={{ fontSize: 18, color: isLight ? theme.palette.secondary.main : '#dce9ff' }} />
                  <Box>
                    <Typography sx={{ color: isLight ? theme.appBrand.faintText : 'rgba(220,233,255,0.7)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Agenda
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.primary, fontSize: 14.5, fontWeight: 600 }}>
                      {eventMeta}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  px: 1.35,
                  py: 1.1,
                  borderRadius: 2,
                  bgcolor: theme.appBrand.promoNeutralBg,
                  border: `1px solid ${theme.appBrand.promoNeutralBorder}`,
                }}
              >
                <Stack direction="row" spacing={0.9} alignItems="center">
                  <Groups2RoundedIcon sx={{ fontSize: 18, color: isLight ? theme.palette.primary.main : '#f7e7b7' }} />
                  <Box>
                    <Typography sx={{ color: theme.appBrand.faintText, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Invitados
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.primary, fontSize: 14.5, fontWeight: 600 }}>
                      {eventGuests}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          )}

          {hasProduct ? (
            <Stack direction="row" spacing={2.5} alignItems="flex-end" flexWrap="wrap" useFlexGap>
              <Box>
                <Typography sx={{ color: theme.appBrand.faintText, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Precio
                </Typography>
                <Typography sx={{ fontSize: { xs: 28, sm: 34 }, fontWeight: 700 }}>
                  {formatPrice(product.price_usd ?? product.price)}
                </Typography>
                <Typography sx={{ fontSize: { xs: 14, sm: 15 }, color: 'primary.main' }}>
                  {formatBs(product.price_usd ?? product.price, rate)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={() => onOpenProduct?.(product)}
                sx={{
                  alignSelf: 'center',
                  px: 2.5,
                  minHeight: 46,
                  boxShadow: isCompact
                    ? '0 12px 28px rgba(216,172,30,0.16)'
                    : '0 16px 40px rgba(216,172,30,0.22)',
                }}
              >
                Ver promo
              </Button>
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.4,
                py: 0.9,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                border: `1px solid ${theme.appBrand.promoNeutralBorder}`,
                color: theme.palette.text.primary,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Evento editorial del menú
            </Box>
          )}
        </Stack>

        <Box
          sx={{
            alignSelf: { xs: 'stretch', sm: 'flex-end' },
            display: 'flex',
            justifyContent: { xs: 'space-between', sm: 'flex-end' },
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          {promotions.length > 1 && (
            <>
              <IconButton
                onClick={handlePrev}
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, isLight ? 0.76 : 0.55),
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.appBrand.promoNeutralBorder}`,
                }}
              >
                <ArrowBackIosNewRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, isLight ? 0.76 : 0.55),
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.appBrand.promoNeutralBorder}`,
                }}
              >
                <ArrowForwardIosRoundedIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {promotions.length > 1 && (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            position: 'absolute',
            zIndex: 1,
            left: { xs: 18, sm: 28 },
            bottom: { xs: 16, sm: 20 },
          }}
        >
          {promotions.map((promo, promoIndex) => (
            <Box
              key={promo.id ?? `${promo.product_id}-${promoIndex}`}
              sx={{
                width: promoIndex === index ? 28 : 10,
                height: 10,
                borderRadius: 999,
                transition: 'all 220ms ease',
                bgcolor: promoIndex === index ? 'primary.main' : 'rgba(255,255,255,0.28)',
              }}
            />
          ))}
        </Stack>
      )}

      {isPhone && (
        <Box
          sx={{
            position: 'absolute',
            inset: 'auto 0 0 0',
            height: 90,
            background: isLight
              ? 'linear-gradient(180deg, transparent 0%, rgba(244,239,233,0.96) 100%)'
              : 'linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.95) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </Box>
  );
}
