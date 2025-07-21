import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import MobileDrawer from './MobileDrawer.jsx';


export default function Header({
  query,
  onQueryChange,
  categories = [],

  onSelectCategory,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppBar
          position="sticky"
        sx={{
          backgroundColor: alpha('#2f2f2f', 0.6),
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          top: 0,
             zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: 56, gap: 2, justifyContent: 'space-between' }}>
          <Box
            component="img"
            src="/zonab.png"
            alt="Menú Zona B"
            role="img"
                  sx={{ height: 40, width: 'auto' }}
          />
          <Typography
            variant="h6"
            color="primary.main"
            sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 600 }}
          >
            Menú Zona B
          </Typography>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="toggle categories drawer"
              onClick={() => setOpen(true)}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
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
                    <IconButton
                      size="small"
                      aria-label="clear search"
                      onClick={() => onQueryChange?.('')}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
            }}
          />
        </Container>
      
      </AppBar>
      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        onSelect={onSelectCategory}
      />
    </>
  );
}