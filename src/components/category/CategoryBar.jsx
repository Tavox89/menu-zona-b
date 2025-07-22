import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { alpha, useTheme } from '@mui/material/styles';

export default function CategoryBar({ categories = [], activeId = '', onSelect }) {
  const theme = useTheme();
  const scrollRef = useRef(null);
  const [overflow, setOverflow] = useState(false);

  const scroll = (dx) => {
    if (scrollRef.current) scrollRef.current.scrollLeft += dx;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => setOverflow(el.scrollWidth > el.clientWidth);
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  return (
     <Box sx={{ position: 'relative' }}>
      {overflow && (
        <IconButton
          size="small"
      onClick={() => scroll(-200)}
          sx={{ position: 'absolute', left: 4, top: 'calc(50% - 16px)', zIndex: 1 }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
      )}

      <Box
        ref={scrollRef}
        sx={{
           px: 6,
          pt: 1,
          pb: 1,
          display: 'flex',
                flexWrap: 'wrap',
          rowGap: 1,
          columnGap: 1,
          maxHeight: theme.spacing(8),
                overflowX: 'auto',
          overflowY: 'hidden',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            size="small"
           clickable
            onClick={() => onSelect?.(c.id)}
            sx={{
              borderColor: theme.palette.primary.main,
           color: activeId === c.id ? '#000' : theme.palette.primary.main,
              bgcolor: activeId === c.id ? theme.palette.primary.main : 'transparent',
              '&:hover': {
                bgcolor:
                  activeId === c.id
                    ? theme.palette.primary.main
                    : alpha(theme.palette.primary.main, 0.08),
              },
            }}
            variant={activeId === c.id ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {overflow && (
        <IconButton
          size="small"
          onClick={() => scroll(240)}
       sx={{ position: 'absolute', right: 4, top: 'calc(50% - 16px)', zIndex: 1 }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}