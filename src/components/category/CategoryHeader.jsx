import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * Displays a category name separating groups of products. In the original
 * implementation headers occasionally wrapped onto multiple lines on tablet
 * and desktop screens. To prevent this the box stretches the full width and
 * enforces a single line with ellipsis overflow. Text is uppercased and
 * bolded to visually distinguish it from product names.
 */
export default function CategoryHeader({ title }) {
  return (
    <Box
      sx={{
        width: '100%',
        px: 2,
        py: 1,
        bgcolor: 'transparent',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textTransform: 'uppercase',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} component="span">
        {title}
      </Typography>
    </Box>
  );
}