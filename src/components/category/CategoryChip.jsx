import Chip from '@mui/material/Chip';

/**
 * Render a single category as a clickable chip. When selected it uses the
 * primary color, otherwise the default. The onClick callback receives
 * the category id (or null for the “Todos” chip).
 */
export default function CategoryChip({ category, selected, onClick }) {
  const handleClick = () => {
    if (onClick) onClick(category.id);
  };

  return (
    <Chip
      label={category.name}
    
      clickable
    color="primary"
      variant={selected ? 'filled' : 'outlined'}
      onClick={handleClick}
      
    />
  );
}