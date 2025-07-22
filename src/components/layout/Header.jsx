
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { useTheme } from '@mui/material/styles';
import { glassGray } from '../../theme/index.js';
export default function Header({ query, onQueryChange }) {
  const theme = useTheme();


  return (
  <AppBar
      position="sticky"
      sx={{
        backgroundColor: glassGray,
        backdropFilter: 'blur(10px)',
        boxShadow: 'none',
        top: 0,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: 56, gap: 2 }}>
        <Box component="img" src="/zonab.png" alt="Menú Zona B" sx={{ height: 60, width: 'auto' }} />
        <Typography variant="h6" color="primary.main" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 600 }}>
          Menú Zona B
        </Typography>
      </Toolbar>
      <Container maxWidth="sm" sx={{ px: 2, pb: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Buscar productos…"
          value={query}
          onChange={(e) => onQueryChange?.(e.target.value)}
          sx={{ mx: 0, my: 1 }}
          InputProps={{
            endAdornment:
              query !== '' ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="clear search" onClick={() => onQueryChange?.('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
          }}
        />
      </Container>
    </AppBar>
  );
}