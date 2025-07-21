import { useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Chip from '@mui/material/Chip';

/**
 * Horizontal scrollable bar of category chips. Displays the provided list of
 * categories and highlights the currently selected id. It supports horizontal
 * scrolling with navigation arrows when the content overflows.
 */
export default function CategoriesBar({ categories = [], selected = 0, onSelect }) {
  const scrollRef = useRef(null);
    const [overflow, setOverflow] = useState(false);

   const scroll = (dx) => {
    if (scrollRef.current) scrollRef.current.scrollLeft += dx;
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => setOverflow(el.scrollWidth > el.clientWidth);
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [categories]);

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton
        size="small"
        onClick={() => scroll(-200)}
        sx={{
          position: 'absolute',
          left: 2,
          top: 'calc(50% - 16px)',
          zIndex: 1,
          display: overflow ? { xs: 'flex', md: 'none' } : 'none',
        }}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>

      <Box
        ref={scrollRef}
     
        sx={(theme) => ({
        px: 3,
          overflowX: 'auto',
                    display: 'flex',
          flexWrap: 'wrap',
          maxHeight: theme.spacing(8),
          gap: 1,
          scrollBehavior: 'smooth',
        })}
      >
   {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            onClick={() => onSelect?.(c.id)}
            color={selected === c.id ? 'primary' : 'default'}
            variant={selected === c.id ? 'filled' : 'outlined'}
            size="small"
          />
        ))}
          </Box>

      <IconButton
        size="small"
        onClick={() => scroll(200)}
        sx={{
          position: 'absolute',
          right: 2,
          top: 'calc(50% - 16px)',
          zIndex: 1,
          display: overflow ? { xs: 'flex', md: 'none' } : 'none',
        }}
      >
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}