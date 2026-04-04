import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import { alpha, useTheme } from '@mui/material/styles';
import { formatPrice } from '../../utils/price.js';

const BS_SNAPSHOT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatTimestamp(value) {
  try {
    return new Intl.DateTimeFormat('es-VE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function RepeatOrdersSection({
  entries = [],
  onRepeat,
  feedback = null,
}) {
  const theme = useTheme();

  if (!entries.length && !feedback) return null;

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <HistoryRoundedIcon color="primary" />
        <Box>
          <Typography variant="h5" sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 700 }}>
            Pide de nuevo
          </Typography>
          <Typography sx={{ color: theme.appBrand.faintText, fontSize: 13.5 }}>
            Repite pedidos recientes con precios y extras recalculados contra el catálogo actual.
          </Typography>
        </Box>
      </Stack>

      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 1.5 }}>
          {feedback.message}
        </Alert>
      )}

      {!!entries.length && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 1.5,
          }}
        >
          {entries.map((entry) => {
            const itemPreview = (entry.items ?? [])
              .slice(0, 3)
              .map((item) => item.name)
              .join(', ');

            return (
              <Card
                key={entry.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderColor: theme.appBrand.softBorderColor,
                  background: theme.appBrand.frostedPanel,
                  boxShadow:
                    theme.palette.mode === 'light'
                      ? '0 18px 40px rgba(36,56,76,0.1)'
                      : '0 18px 40px rgba(0,0,0,0.12)',
                }}
              >
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                        {entry.items?.length ?? 0} productos
                      </Typography>
                      <Typography sx={{ color: theme.appBrand.faintText, fontSize: 12.5 }}>
                        {formatTimestamp(entry.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {formatPrice(entry.totals?.usd ?? 0)}
                      </Typography>
                      <Typography sx={{ color: 'primary.main', fontSize: 13 }}>
                        Bs {BS_SNAPSHOT_FORMATTER.format(Number(entry.totals?.bs) || 0)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography
                    sx={{
                      minHeight: 42,
                      color: theme.appBrand.mutedText,
                      fontSize: 13.5,
                      lineHeight: 1.5,
                    }}
                  >
                    {itemPreview}
                    {entry.items?.length > 3 ? '…' : ''}
                  </Typography>

                  {entry.note ? (
                    <Box
                      sx={{
                        borderRadius: 2,
                        px: 1.25,
                        py: 1,
                        bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'light' ? 0.04 : 0.04),
                        color: theme.appBrand.mutedText,
                        fontSize: 12.5,
                      }}
                    >
                      Nota: {entry.note}
                    </Box>
                  ) : null}

                  <Button
                    variant="outlined"
                    startIcon={<ReplayRoundedIcon />}
                    onClick={() => onRepeat?.(entry)}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Repetir pedido
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
