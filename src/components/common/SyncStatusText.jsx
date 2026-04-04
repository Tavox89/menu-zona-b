import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function formatLastUpdatedLabel(lastUpdatedAt) {
  const timestamp = Number(lastUpdatedAt || 0);
  if (!timestamp) {
    return '';
  }

  const elapsedMs = Date.now() - timestamp;
  if (elapsedMs < 15000) {
    return 'Actualizado hace unos segundos';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `Actualizado ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function SyncStatusText({
  refreshing = false,
  lastUpdatedAt = 0,
  sx = {},
}) {
  const label = refreshing ? 'Actualizando en silencio…' : formatLastUpdatedLabel(lastUpdatedAt);

  if (!label) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.8,
        minHeight: 20,
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: refreshing ? 'primary.main' : 'success.main',
          opacity: refreshing ? 0.9 : 0.55,
          boxShadow: refreshing ? '0 0 0 4px rgba(230, 189, 23, 0.08)' : 'none',
          transition: 'all 180ms ease',
        }}
      />
      <Typography
        sx={{
          fontSize: 12,
          color: 'text.secondary',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
