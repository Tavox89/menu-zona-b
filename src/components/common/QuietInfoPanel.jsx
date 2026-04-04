import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function QuietInfoPanel({
  title = '',
  description,
  icon,
  sx = {},
}) {
  const IconComponent = icon || InfoOutlinedIcon;

  return (
    <Box
      sx={{
        p: 1.35,
        borderRadius: 2.4,
        border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
        background: 'linear-gradient(180deg, rgba(36, 181, 255, 0.08) 0%, rgba(255,255,255,0.02) 100%)',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconComponent sx={{ color: 'info.main', fontSize: 18 }} />
        <Box sx={{ minWidth: 0 }}>
          {title ? (
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>
              {title}
            </Typography>
          ) : null}
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            {description}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
