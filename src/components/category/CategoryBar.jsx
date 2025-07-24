import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { alpha, useTheme } from '@mui/material/styles';

export default function CategoryBar({ enabledCategories = [], active = '', select }) {
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
        backgroundColor: alpha('#2f2f2f', 0.8),
        backdropFilter: 'blur(10px)',
        px: 2,
        py: 1,
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
    
        display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(2, auto)',
          gap: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
      maxHeight: theme.spacing(8),
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
          {enabledCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            size="small"
     clickable
            onClick={() => select?.(c.id)}
                color="primary"
            variant={active === c.id ? 'filled' : 'outlined'}
       
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