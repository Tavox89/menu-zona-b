import Box from '@mui/material/Box';
import CategoryChip from './CategoryChip.jsx';

/**
 * Horizontal scrollable bar of category chips. It prepends a “Todos” chip
 * which resets the current filter when clicked. The selected category
 * id (null means all) is highlighted. The onSelect callback is invoked
 * with the id of the chosen category.
 */
export default function CategoriesBar({ categories = [], selected = null, onSelect }) {
  return (
    <Box sx={{ display: 'flex', overflowX: 'auto', px: 2, py: 1 }}>
      <CategoryChip
        category={{ id: null, name: 'Todos' }}
        selected={selected === null}
        onClick={() => onSelect?.(null)}
      />
      {categories.map((cat) => (
        <CategoryChip
          key={cat.id}
          category={cat}
          selected={selected === cat.id}
          onClick={() => onSelect?.(cat.id)}
        />
      ))}
    </Box>
  );
}