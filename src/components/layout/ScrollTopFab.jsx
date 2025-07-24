import Fab from '@mui/material/Fab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export default function ScrollTopFab({ show = false, drawerOpen = false }) {
  if (!show || drawerOpen) return null;
  return (
    <Fab
      color="primary"
      size="small"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      sx={{
        position: 'fixed',
        bottom: { xs: 80, sm: 88 },
        right: 16,
        zIndex: (theme) => theme.zIndex.tooltip,
      }}
    >
      <KeyboardArrowUpIcon />
    </Fab>
  );
}