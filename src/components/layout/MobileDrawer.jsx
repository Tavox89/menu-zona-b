
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
const HEADER_HEIGHT = 112;
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
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
                  pt: 1,
          width: 260,
          backgroundColor: alpha('#2f2f2f', 0.6),
          backdropFilter: 'blur(10px)',
                  top: HEADER_HEIGHT,
          height: `calc(100% - ${HEADER_HEIGHT}px)`,
        },
      }}
    >
         <IconButton
        onClick={onClose}
        aria-label="close drawer"
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <CloseIcon />
      </IconButton>

      <List sx={{ mt: 5 }}>
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