import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { alpha, useTheme } from '@mui/material/styles';
import { BRAND_THEME_TRANSITION } from '../../config/brands.js';

export default function CategoryBar({ enabledCategories = [], active = '', select }) {
  const theme = useTheme();
  const scrollRef = useRef(null);
  const [overflow, setOverflow] = useState(false);
  const isLight = theme.palette.mode === 'light';
  const singleRow = enabledCategories.length <= 4;

  const scroll = (dx) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += dx;
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    const handle = () => setOverflow(el.scrollWidth > el.clientWidth + 4);
    handle();
    window.addEventListener('resize', handle);

    return () => window.removeEventListener('resize', handle);
  }, [enabledCategories.length]);

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 'calc(var(--menu-header-height, 126px) - 1px)',
        zIndex: (currentTheme) => currentTheme.zIndex.appBar,
        backdropFilter: theme.palette.mode === 'light'
          ? 'blur(24px) saturate(165%)'
          : 'blur(20px) saturate(138%)',
        background: theme.appBrand.categoryBarBackground,
        borderBottom: `1px solid ${theme.appBrand.softBorderColor}`,
        px: { xs: 1.1, sm: 2.5 },
        py: { xs: 0.95, sm: 0.9 },
        boxShadow: theme.palette.mode === 'light'
          ? '0 14px 30px rgba(161,13,114,0.08), inset 0 1px 0 rgba(255,255,255,0.44)'
          : '0 14px 28px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: `background ${BRAND_THEME_TRANSITION}, border-color ${BRAND_THEME_TRANSITION}, box-shadow ${BRAND_THEME_TRANSITION}`,
      }}
    >
      {overflow && (
        <IconButton
          size="small"
          onClick={() => scroll(-240)}
          sx={{
            position: 'absolute',
            left: { xs: 4, sm: 8 },
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: alpha(theme.palette.background.paper, isLight ? 0.82 : 0.76),
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: isLight
              ? '0 14px 28px rgba(36,56,76,0.12)'
              : '0 10px 24px rgba(0,0,0,0.18)',
            backdropFilter: isLight ? 'blur(16px)' : 'none',
          }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
      )}

      <Box
        ref={scrollRef}
        sx={{
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          px: overflow ? { xs: 4.5, sm: 5 } : 0,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            alignItems: 'center',
            rowGap: singleRow ? 0 : { xs: 0.8, sm: 1 },
            columnGap: { xs: 0.9, sm: 1.1 },
            gridAutoFlow: 'column',
            gridTemplateRows: singleRow ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
            gridAutoColumns: 'max-content',
            width: 'max-content',
            minWidth: 'max-content',
          }}
        >
          {enabledCategories.map((category) => {
            const isActive = String(active) === String(category.id);

            return (
              <Chip
                key={category.id}
                label={category.name}
                size="small"
                clickable
                onClick={() => select?.(category.id)}
                variant={isActive ? 'filled' : 'outlined'}
                sx={{
                  px: 0.35,
                  height: { xs: 34, sm: 32 },
                  flexShrink: 0,
                  borderColor: isActive
                    ? alpha(theme.palette.primary.main, isLight ? 0.34 : 0.46)
                    : alpha(theme.palette.primary.main, isLight ? 0.4 : 0.5),
                  bgcolor: isActive
                    ? alpha(theme.palette.primary.main, isLight ? 0.12 : 0.18)
                    : alpha(theme.palette.background.paper, isLight ? 0.5 : 0.12),
                  color: isActive ? theme.palette.text.primary : 'primary.main',
                  boxShadow: isActive
                    ? isLight
                      ? `0 10px 24px ${alpha(theme.palette.primary.main, 0.16)}`
                      : '0 10px 24px rgba(216,172,30,0.15)'
                    : 'none',
                  '& .MuiChip-label': {
                    px: { xs: 1.05, sm: 1.1 },
                    fontWeight: isActive ? 700 : 500,
                    fontSize: { xs: 13.5, sm: 13.5 },
                    letterSpacing: '0.01em',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {overflow && (
        <IconButton
          size="small"
          onClick={() => scroll(240)}
          sx={{
            position: 'absolute',
            right: { xs: 4, sm: 8 },
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: alpha(theme.palette.background.paper, isLight ? 0.82 : 0.76),
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: isLight
              ? '0 14px 28px rgba(36,56,76,0.12)'
              : '0 10px 24px rgba(0,0,0,0.18)',
            backdropFilter: isLight ? 'blur(16px)' : 'none',
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}
