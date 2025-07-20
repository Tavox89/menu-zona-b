import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function Loading() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={24} sx={{ mr: 1 }} />
      <Typography variant="body2">Cargando…</Typography>
    </Box>
  );
}