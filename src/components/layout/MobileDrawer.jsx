import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import { alpha } from '@mui/material/styles';

export default function MobileDrawer({ open, onClose, categories = [], onSelect }) {
  return (
    <SwipeableDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
           PaperProps={{
        sx: {
          backgroundColor: alpha('#2f2f2f', 0.6),
          backdropFilter: 'blur(10px)',
        },
      }}
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
                    {cat.icon && (
              <ListItemIcon>
                <cat.icon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText primary={cat.name} />
          </ListItemButton>
        ))}
      </List>
    </SwipeableDrawer>
  );
}