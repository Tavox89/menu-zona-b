import Badge from '@mui/material/Badge';
import Fab from '@mui/material/Fab';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

/**
 * Floating action button that displays the current number of items in the cart.
 * It appears only when there is at least one item. Clicking it triggers
 * onClick, typically to open the cart drawer.
 */
export default function CartFab({ count = 0, onClick }) {
  if (count <= 0) return null;
  return (
    <Fab
      color="secondary"
      onClick={onClick}
      sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1300 }}
    >
      <Badge badgeContent={count} color="primary" overlap="circular">
        <ShoppingCartIcon />
      </Badge>
    </Fab>
  );
}