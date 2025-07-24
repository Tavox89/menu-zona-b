import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function CategoryHeader({ title }) {
  return (
    <Box
      sx={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(255,255,255,.06)',
        borderBottom: '1px solid rgba(255,255,255,.12)',
      }}
    >
      <Typography
        sx={{
          color: '#d4af37',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '.8px',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}