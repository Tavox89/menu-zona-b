import Stack from '@mui/material/Stack';
import CategoryChip from './CategoryChip.jsx';

/**
 * Horizontal scrollable bar of category chips. It prepends a “Todos” chip
 * which resets the current filter when clicked. The selected category
 * id (null means all) is highlighted. The onSelect callback is invoked
 * with the id of the chosen category.
 */
export default function CategoriesBar({ categories = [], selected = null, onSelect }) {
  return (
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ px: 2, py: 1, overflowX: 'auto' }}>
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
   </Stack>
  );
}