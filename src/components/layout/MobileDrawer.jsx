import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

export default function MobileDrawer({ open, onClose, categories = [], onSelect }) {
  return (
    <SwipeableDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
    >
      <List sx={{ width: 240 }}>
        {categories.map((cat) => (
          <ListItemButton
            key={cat.id}
            onClick={() => {
              onSelect?.(cat.id);
              onClose?.();
            }}
          >
            <ListItemText primary={cat.name} />
          </ListItemButton>
        ))}
      </List>
    </SwipeableDrawer>
  );
}