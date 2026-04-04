import { useEffect, useRef, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import MobileDrawer from './MobileDrawer.jsx';
import { BRAND_THEME_TRANSITION, getBrandConfig } from '../../config/brands.js';

export default function Header({
  query,
  onQueryChange,
  categories = [],
  activeCategory = '',
  onSelectCategory,
  brandKey = 'zona_b',
  showBrandSwitch = false,
  switchLogo = '',
  switchBrandKey = '',
  onSwitchBrand,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const appBarRef = useRef(null);
  const brand = getBrandConfig(brandKey);
  const switchBrand = switchBrandKey ? getBrandConfig(switchBrandKey) : null;
  const isZonaB = brand.key === 'zona_b';
  const isLight = theme.palette.mode === 'light';
  const showHeaderReference = Boolean(brand.headerReference);
  const centeredLogoWidth = {
    xs: 224,
    sm: 276,
    md: 312,
  };
  const sideLogoWidth = {
    xs: 70,
    sm: 82,
    md: 92,
  };
  const zonaBHeaderColumns = {
    xs: '70px 1fr 70px',
    sm: '82px 1fr 82px',
    md: '92px 1fr 92px',
  };
  const switchTargetIsLight = switchBrand?.mode === 'light';
  const switchSurfaceBackground = !switchBrand
    ? theme.appBrand.frostedPanel
    : switchTargetIsLight
      ? 'linear-gradient(180deg, rgba(255,252,248,0.94) 0%, rgba(249,240,234,0.86) 100%)'
      : 'linear-gradient(180deg, rgba(8,8,8,0.98) 0%, rgba(8,8,8,0.96) 100%)';
  const switchSurfaceBorder = !switchBrand
    ? theme.palette.divider
    : switchTargetIsLight
      ? alpha(switchBrand.palette.primary, 0.26)
      : alpha(switchBrand.palette.primary, 0.34);
  const switchSurfaceShadow = !switchBrand
    ? isLight
      ? '0 14px 30px rgba(36,56,76,0.1)'
      : '0 14px 30px rgba(0,0,0,0.2)'
    : switchTargetIsLight
      ? '0 18px 38px rgba(161,13,114,0.12)'
      : '0 18px 38px rgba(0,0,0,0.24)';
  const switchHoverShadow = !switchBrand
    ? isLight
      ? '0 18px 34px rgba(36,56,76,0.14)'
      : '0 18px 34px rgba(0,0,0,0.26)'
    : switchTargetIsLight
      ? '0 22px 44px rgba(161,13,114,0.16)'
      : '0 22px 44px rgba(0,0,0,0.3)';
  const switchWidth = switchBrand?.key === 'zona_b'
    ? { xs: 244, sm: 272 }
    : { xs: 214, sm: 236 };
  const switchImageMaxHeight = switchBrand?.key === 'zona_b' ? 37 : 38;

  useEffect(() => {
    const headerNode = appBarRef.current;
    if (!headerNode || typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const updateHeight = () => {
      const { height } = headerNode.getBoundingClientRect();
      document.documentElement.style.setProperty('--menu-header-height', `${Math.round(height)}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(headerNode);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [brand.key, query, showBrandSwitch, switchLogo, isMobile]);

  return (
    <>
      <AppBar
        ref={appBarRef}
        position="sticky"
        sx={{
          background: theme.appBrand.headerBackground,
          backdropFilter: brand.key === 'isola' ? 'blur(28px) saturate(165%)' : 'blur(18px) saturate(135%)',
          boxShadow: brand.key === 'isola'
            ? '0 18px 42px rgba(161,13,114,0.08), inset 0 1px 0 rgba(255,255,255,0.45)'
            : '0 16px 34px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)',
          top: 0,
          zIndex: theme.zIndex.drawer + 1,
          px: { xs: 1, sm: 3, lg: 4 },
          borderBottom: '1px solid transparent',
          transition: `background ${BRAND_THEME_TRANSITION}, border-color ${BRAND_THEME_TRANSITION}, box-shadow ${BRAND_THEME_TRANSITION}`,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: isZonaB ? 92 : 86, sm: isZonaB ? 118 : 114, md: isZonaB ? 124 : 122 },
            py: { xs: isZonaB ? 1.35 : 1.15, sm: isZonaB ? 1.8 : 1.55 },
            px: { xs: 0.5, sm: 1 },
            gap: 2.5,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {isZonaB ? (
            <Box
              key="zona-b-header"
              sx={{
                display: 'grid',
                gridTemplateColumns: zonaBHeaderColumns,
                alignItems: 'center',
                width: '100%',
                minHeight: { xs: 68, sm: 84 },
                px: { xs: 1, sm: 2 },
                columnGap: { xs: 1, sm: 1.5 },
              }}
            >
              <Box
                component="img"
                src={brand.logo}
                alt={brand.alt}
                sx={{
                  display: 'block',
                  justifySelf: 'start',
                  width: sideLogoWidth,
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.18))',
                  flexShrink: 0,
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  lineHeight: 1,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: 25, sm: 36, md: 42 },
                    letterSpacing: { xs: '0.03em', sm: '0.05em' },
                    lineHeight: 0.98,
                    background: theme.appBrand.titleGradient,
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    transition: `background ${BRAND_THEME_TRANSITION}`,
                  }}
                >
                  {brand.title}
                </Typography>
                {showHeaderReference ? (
                  <Typography
                    component="span"
                    sx={{
                      mt: { xs: 1.05, sm: 1.15 },
                      px: 1,
                      fontWeight: 600,
                      fontSize: { xs: 10.8, sm: 13, md: 14 },
                      color: alpha(theme.palette.primary.main, 0.88),
                      letterSpacing: '.18em',
                      textTransform: 'uppercase',
                      transition: `color ${BRAND_THEME_TRANSITION}`,
                    }}
                  >
                    {brand.headerReference}
                  </Typography>
                ) : null}
              </Box>
              <Box
                aria-hidden="true"
                sx={{
                  width: sideLogoWidth,
                  justifySelf: 'end',
                  visibility: 'hidden',
                }}
              />
            </Box>
          ) : (
            <Box
              key="isola-header"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                lineHeight: 1,
                width: '100%',
                px: { xs: 6, sm: 7 },
              }}
            >
              <Box
                component="img"
                src={brand.logo}
                alt={brand.alt}
                sx={{
                  display: 'block',
                  width: centeredLogoWidth,
                  maxWidth: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="toggle categories drawer"
              onClick={() => setOpen(true)}
              sx={{
                display: { xs: 'block', md: 'none' },
                position: 'absolute',
                right: 2,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
        <Container maxWidth="sm" sx={{ px: 2, pb: 1.15 }}>
          <Box sx={{ mx: 0, mt: 0.35, mb: 0.8 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Busca por nombre o categoría…"
              value={query}
              onChange={(e) => onQueryChange?.(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: brand.key === 'isola'
                    ? 'rgba(255,255,255,0.72)'
                    : 'rgba(255,255,255,0.07)',
                  backdropFilter: brand.key === 'isola' ? 'blur(24px) saturate(168%)' : 'blur(14px) saturate(132%)',
                  boxShadow: brand.key === 'isola'
                    ? '0 20px 46px rgba(161,13,114,0.12), inset 0 1px 0 rgba(255,255,255,0.52)'
                    : '0 14px 28px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.05)',
                  transition: `background ${BRAND_THEME_TRANSITION}, box-shadow ${BRAND_THEME_TRANSITION}, border-color ${BRAND_THEME_TRANSITION}`,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: brand.key === 'isola'
                    ? alpha(theme.palette.secondary.main, 0.2)
                    : alpha(theme.palette.text.primary, 0.12),
                },
              }}
              InputProps={{
                endAdornment:
                  query !== '' ? (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label="clear search" onClick={() => onQueryChange?.('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
              }}
            />
          </Box>
          {showBrandSwitch && switchLogo ? (
            <Box sx={{ mt: 1.1, display: 'flex', justifyContent: 'center' }}>
              <ButtonBase
                onClick={onSwitchBrand}
                sx={{
                  width: switchWidth,
                  height: { xs: 44, sm: 46 },
                  borderRadius: 3,
                  border: `1px solid ${switchSurfaceBorder}`,
                  background: switchSurfaceBackground,
                  backdropFilter: switchTargetIsLight ? 'blur(24px) saturate(170%)' : 'blur(10px)',
                  boxShadow: switchTargetIsLight
                    ? `${switchSurfaceShadow}, inset 0 1px 0 rgba(255,255,255,0.48)`
                    : `${switchSurfaceShadow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  transition: `transform ${BRAND_THEME_TRANSITION}, box-shadow ${BRAND_THEME_TRANSITION}, background ${BRAND_THEME_TRANSITION}, border-color ${BRAND_THEME_TRANSITION}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: switchHoverShadow,
                  },
                }}
              >
                <Box
                  component="img"
                  src={switchLogo}
                  alt={switchBrand ? `Ir a ${switchBrand.title}` : 'Cambiar menú'}
                  sx={{
                    width: 'auto',
                    maxWidth: '95%',
                    maxHeight: switchImageMaxHeight,
                    objectFit: 'contain',
                    filter: switchBrand?.key === 'zona_b' ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))' : 'none',
                    transition: `filter ${BRAND_THEME_TRANSITION}, transform ${BRAND_THEME_TRANSITION}`,
                  }}
                />
              </ButtonBase>
            </Box>
          ) : null}
        </Container>
      </AppBar>
      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        active={activeCategory}
        onSelect={onSelectCategory}
        brandKey={brandKey}
      />
    </>
  );
}
