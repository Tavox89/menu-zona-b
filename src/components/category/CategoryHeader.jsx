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
            position: 'relative',
        width: '100%',
           display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexBasis: { xs: 'auto', sm: '100%' },
        gridColumn: { sm: '1 / -1' },
       py: { xs: 1, sm: 1.5 },
        my: { xs: 1.5, sm: 3 },
        background: 'rgba(255,255,255,.04)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(212,175,55,.25)',
        borderRadius: 2,
      }}
    >
           <Box
        sx={{
          flex: 1,
          height: 1,
          background:
            'linear-gradient(to right, transparent 0%, rgba(212,175,55,.4) 50%, transparent 100%)',
        }}
      />
      <Typography
        component="span"
        sx={{
          px: 2,
          fontWeight: 700,
          fontSize: { xs: 16, sm: 22, md: 24 },
          textTransform: 'uppercase',
          letterSpacing: { xs: '.8px', sm: '1.2px' },
          background:
            'linear-gradient(90deg,#f7e7b7 0%,#d4af37 50%,#b88a00 100%)',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          textShadow: '0 0 6px rgba(212,175,55,.45)',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Typography>
            <Box
        sx={{
          flex: 1,
          height: 1,
          background:
            'linear-gradient(to right, transparent 0%, rgba(212,175,55,.4) 50%, transparent 100%)',
        }}
      />
    </Box>
  );
}