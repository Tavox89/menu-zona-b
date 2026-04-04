import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { alpha } from '@mui/material/styles';
import { BRAND_CONFIGS, BRAND_THEME_TRANSITION } from '../../config/brands.js';

function BrandPanel({ brand, onChoose, position }) {
  const isZonaB = brand.key === 'zona_b';
  const logoSource = brand.introLogo || brand.logo;
  const panelGlow = isZonaB
    ? 'radial-gradient(circle at 16% 16%, rgba(216,172,30,0.16), transparent 24%), radial-gradient(circle at 84% 86%, rgba(247,231,183,0.08), transparent 22%)'
    : 'radial-gradient(circle at 16% 16%, rgba(161,13,114,0.16), transparent 24%), radial-gradient(circle at 84% 86%, rgba(36,56,76,0.1), transparent 22%)';
  const surfaceBackground = isZonaB
    ? 'linear-gradient(180deg, rgba(26,26,26,0.92) 0%, rgba(14,14,14,0.96) 100%)'
    : 'linear-gradient(180deg, rgba(255,254,251,0.88) 0%, rgba(252,246,241,0.74) 100%)';
  const surfaceBorder = isZonaB ? 'rgba(255,255,255,0.08)' : 'rgba(161,13,114,0.12)';
  const ctaBackground = isZonaB
    ? 'linear-gradient(180deg, rgba(72,58,18,0.92) 0%, rgba(54,44,16,0.96) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,250,246,0.84) 100%)';
  const ctaBorder = isZonaB ? 'rgba(247,231,183,0.18)' : 'rgba(161,13,114,0.2)';
  const ctaColor = isZonaB ? '#f7e7b7' : brand.palette.ink;

  return (
    <ButtonBase
      onClick={() => onChoose?.(brand.key)}
      sx={{
        flex: 1,
        width: '100%',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        textAlign: 'left',
        color: brand.palette.textPrimary,
        background:
          isZonaB
            ? 'linear-gradient(180deg, rgba(18,18,18,0.98) 0%, rgba(10,10,10,1) 100%)'
            : 'linear-gradient(180deg, rgba(252,247,242,0.98) 0%, rgba(244,236,228,1) 100%)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          overflow: 'hidden',
          px: { xs: 2.2, sm: 4 },
          py: { xs: 3.5, sm: 5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: panelGlow,
          borderBottom:
            position === 'top'
              ? `1px solid ${isZonaB ? 'rgba(255,255,255,0.08)' : 'rgba(24,40,60,0.08)'}`
              : 'none',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 18,
            borderRadius: 4,
            border: `1px solid ${surfaceBorder}`,
            background: surfaceBackground,
            backdropFilter: 'blur(18px)',
            boxShadow: isZonaB
              ? '0 24px 58px rgba(0,0,0,0.24)'
              : '0 24px 58px rgba(120,80,110,0.14)',
            transition: `background ${BRAND_THEME_TRANSITION}, border-color ${BRAND_THEME_TRANSITION}, box-shadow ${BRAND_THEME_TRANSITION}`,
          }}
        />

        <Stack
          spacing={1.5}
          sx={{
            position: 'relative',
            zIndex: 1,
            width: 'min(100%, 540px)',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Box
            component="img"
            src={logoSource}
            alt={brand.alt}
            sx={{
              width: { xs: isZonaB ? 208 : 206, sm: isZonaB ? 264 : 258 },
              height: 'auto',
              maxHeight: { xs: 94, sm: 122 },
              objectFit: 'contain',
              filter: isZonaB ? 'drop-shadow(0 10px 28px rgba(0,0,0,0.28))' : 'none',
              transition: `transform ${BRAND_THEME_TRANSITION}, filter ${BRAND_THEME_TRANSITION}`,
            }}
          />
          <Typography
            sx={{
              maxWidth: 470,
              color: isZonaB ? alpha('#f5f1e6', 0.84) : alpha(brand.palette.ink, 0.8),
              fontSize: { xs: 15.5, sm: 17 },
              lineHeight: 1.62,
              fontWeight: 500,
            }}
          >
            {brand.introCopy}
          </Typography>

          <Box
            sx={{
              mt: 0.5,
              px: 1.5,
              py: 0.9,
              minWidth: 180,
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.8,
              border: `1px solid ${ctaBorder}`,
              bgcolor: ctaBackground,
              color: ctaColor,
              fontWeight: 700,
              boxShadow: isZonaB
                ? '0 14px 28px rgba(0,0,0,0.24)'
                : '0 14px 28px rgba(161,13,114,0.08)',
              transition: `transform ${BRAND_THEME_TRANSITION}, box-shadow ${BRAND_THEME_TRANSITION}, background ${BRAND_THEME_TRANSITION}`,
            }}
          >
            Entrar
            <ArrowOutwardRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
        </Stack>
      </Box>
    </ButtonBase>
  );
}

export default function IntroGate({ onChoose }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <BrandPanel brand={BRAND_CONFIGS.zona_b} onChoose={onChoose} position="top" />
      <BrandPanel brand={BRAND_CONFIGS.isola} onChoose={onChoose} position="bottom" />
    </Box>
  );
}
