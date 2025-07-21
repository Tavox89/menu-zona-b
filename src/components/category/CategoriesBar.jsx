import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CategoryChip from './CategoryChip.jsx';

/**
 * Horizontal scrollable bar of category chips. Displays the provided list of
 * categories and highlights the currently selected id. It supports horizontal
 * scrolling with navigation arrows when the content overflows.
 */
export default function CategoriesBar({ categories = [], selected = 0, onSelect }) {
  const scrollRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [categories]);

  return (
    <Box sx={{ position: 'relative' }}>
      {hasOverflow && (
        <>
          <IconButton
            size="small"
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollLeft -= 200;
            }}
            sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollLeft += 200;
            }}
            sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </>
      )}
      <Stack
        ref={scrollRef}
        direction="row"
        flexWrap="wrap"
        gap={1}
        sx={(theme) => ({
          px: 2,
          py: 1,
          maxHeight: theme.spacing(10),
          overflowY: 'hidden',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
        })}
      >
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            category={cat}
            selected={selected === cat.id}
            onClick={() => onSelect?.(cat.id)}
          />
        ))}
      </Stack>
    </Box>
  );
}