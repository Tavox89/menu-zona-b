import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { alpha, useTheme } from '@mui/material/styles';

export default function CategoryBar({ enabledCategories = [], active = 0, select }) {
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
    <Box
      sx={{
        position: 'relative',
        backgroundColor: alpha('#2f2f2f', 0.6),
        backdropFilter: 'blur(10px)',
      }}
    >
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
          py: 1,
          px: 5,
          overflowX: 'auto',
          display: 'flex',
             flexWrap: 'nowrap',
          gap: 1,
          maxHeight: theme.spacing(8),
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {enabledCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            size="small"
            onClick={() => select?.(c.id)}
            color={active === c.id ? 'primary' : 'default'}
            variant={active === c.id ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {overflow && (
        <IconButton
          size="small"
          onClick={() => scroll(+200)}
          sx={{ position: 'absolute', right: 4, top: 'calc(50% - 16px)', zIndex: 1 }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}