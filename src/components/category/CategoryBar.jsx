
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

import { alpha, useTheme } from '@mui/material/styles';

export default function CategoryBar({ enabledCategories = [], active = '', select }) {
  const theme = useTheme();


  return (
    <Box
      sx={{
        position: 'relative',
        backgroundColor: alpha('#2f2f2f', 0.8),
        backdropFilter: 'blur(10px)',
        px: 2,
        py: 1,
      }}
    >
      <Box
   
        sx={{
    
          display: 'flex',
   flexWrap: 'wrap',
          gap: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
       maxHeight: theme.spacing(8),
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
           {enabledCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            size="small"
     clickable
            onClick={() => select?.(c.id)}
            color={active === c.id ? 'primary' : undefined}
            variant={active === c.id ? 'filled' : 'outlined'}
            sx={active === c.id ? undefined : { borderColor: theme.palette.primary.main }}
          />
        ))}
      </Box>

    </Box>
  );
}