import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { alpha, useTheme } from '@mui/material/styles';
import { HEADER_OFFSETS } from './layoutConstants.js';

const FOOTER_HEIGHT = 68;

export default function MobileDrawer({ open, onClose, categories = [], active = '', onSelect }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  return (
    <SwipeableDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      PaperProps={{
        sx: {
          width: 'min(320px, 86vw)',
          top: HEADER_OFFSETS.mobile,
          height: `calc(100dvh - ${HEADER_OFFSETS.mobile}px)`,
          px: 1,
          pt: 1.25,
          pb: `calc(${FOOTER_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
          background: theme.appBrand.categoryBarBackground,
          borderRight: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(14px)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          pb: 1.25,
          borderBottom: `1px solid ${theme.appBrand.softBorderColor}`,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Categorías</Typography>
          <Typography sx={{ fontSize: 12.5, color: theme.appBrand.faintText }}>
            Navega el menú sin perder contexto.
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="close drawer" size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ mt: 1, overflowY: 'auto', px: 0.25 }}>
        {categories.map((cat) => {
          const isActive = String(active) === String(cat.id);

          return (
          <ListItemButton
            key={cat.id}
            onClick={() => {
              onSelect?.(cat.id);
              onClose?.();
            }}
            sx={{
              minHeight: 46,
              borderRadius: 2.5,
              mb: 0.5,
              bgcolor: isActive ? alpha(theme.palette.primary.main, isLight ? 0.12 : 0.1) : 'transparent',
              border: isActive ? `1px solid ${alpha(theme.palette.primary.main, 0.28)}` : '1px solid transparent',
            }}
          >
            <ListItemText
              primary={cat.name}
              primaryTypographyProps={{
                sx: {
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'primary.main' : 'text.primary',
                },
              }}
            />
          </ListItemButton>
          );
        })}
      </List>
    </SwipeableDrawer>
  );
}
