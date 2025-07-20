import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function ErrorFallback({ error }) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="body2" color="error.main">
        Ocurrió un error: {error?.message || 'algo salió mal.'}
      </Typography>
    </Box>
  );
}