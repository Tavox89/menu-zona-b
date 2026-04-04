import { alpha, createTheme } from '@mui/material/styles';
import { BRAND_THEME_TRANSITION, getBrandConfig, normalizeBrandKey } from '../config/brands.js';

export function createAppTheme(brandKey = 'zona_b') {
  const brand = getBrandConfig(brandKey);
  const isLight = brand.mode === 'light';
  const borderColor = isLight ? 'rgba(24,40,60,0.1)' : 'rgba(255,255,255,0.08)';
  const softBorderColor = isLight ? 'rgba(24,40,60,0.08)' : 'rgba(255,255,255,0.06)';
  const softSurface = isLight
    ? 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(255,250,246,0.72) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)';

  return createTheme({
    palette: {
      mode: brand.mode,
      primary: { main: brand.palette.primary },
      secondary: { main: brand.palette.secondary },
      background: {
        default: brand.palette.backgroundDefault,
        paper: brand.palette.backgroundPaper,
      },
      text: {
        primary: brand.palette.textPrimary,
        secondary: brand.palette.textSecondary,
      },
      divider: borderColor,
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Outfit", system-ui, sans-serif',
      h1: {
        fontFamily: '"Cormorant Garamond", serif',
      },
      h2: {
        fontFamily: '"Cormorant Garamond", serif',
      },
      h3: {
        fontFamily: '"Cormorant Garamond", serif',
      },
    },
    appBrand: {
      ...brand,
      borderColor,
      softBorderColor,
      softSurface,
      floatingSurface: alpha(brand.palette.backgroundPaper, isLight ? 0.88 : 0.96),
      mutedText: brand.palette.textSecondary,
      faintText: isLight ? 'rgba(24,40,60,0.54)' : 'rgba(255,255,255,0.56)',
      imageFallbackBg: isLight ? '#fbf7f2' : '#141414',
      placeholderBg: '#ffffff',
      onPrimary: isLight ? '#fff7fc' : '#120d02',
      stockBg: isLight ? 'rgba(118, 25, 20, 0.96)' : 'rgba(54, 22, 18, 0.92)',
      stockText: '#ffebee',
      titleGradient: brand.titleGradient,
      sectionGlow: brand.sectionGlow,
      promoBadgeText: isLight ? '#fff7fc' : '#f7e7b7',
      promoBadgeBg: isLight ? alpha(brand.palette.primary, 0.16) : alpha(brand.palette.primary, 0.16),
      promoNeutralBg: isLight ? 'rgba(24,40,60,0.06)' : 'rgba(255,255,255,0.06)',
      promoNeutralBorder: isLight ? 'rgba(24,40,60,0.1)' : 'rgba(255,255,255,0.12)',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            colorScheme: brand.mode,
            background: brand.palette.backgroundDefault,
          },
          body: {
            margin: 0,
            minHeight: '100vh',
            background: brand.appBackground,
            backgroundAttachment: 'fixed',
            color: brand.palette.textPrimary,
            transition: `background ${BRAND_THEME_TRANSITION}, color ${BRAND_THEME_TRANSITION}`,
          },
          '#root': {
            minHeight: '100vh',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 500,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: brand.dialogBackground,
            transition: `background-image ${BRAND_THEME_TRANSITION}, border-color ${BRAND_THEME_TRANSITION}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            transition: `background ${BRAND_THEME_TRANSITION}, border-color ${BRAND_THEME_TRANSITION}, box-shadow ${BRAND_THEME_TRANSITION}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: `background ${BRAND_THEME_TRANSITION}, border-color ${BRAND_THEME_TRANSITION}, box-shadow ${BRAND_THEME_TRANSITION}`,
          },
        },
      },
    },
  });
}

export function getBrandThemeKey(brandKey) {
  return normalizeBrandKey(brandKey);
}
