import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { glassGray } from '../../theme/index.js';
import MobileDrawer from './MobileDrawer.jsx';
export default function Header({ query, onQueryChange, categories = [], onSelectCategory }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);

  return (
   <>
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: glassGray,
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          top: 0,
          zIndex: theme.zIndex.drawer + 1,
            px: { xs: 1, sm: 3, lg: 4 },
        }}
      >
            <Toolbar
          sx={{
             /* más alto para dar aire arriba y centrar */
            minHeight: { xs: 64, sm: 88, md: 96 },
            /* padding vertical extra sólo en sm+ */
            py: { xs: 0, sm: 1 },
            gap: 2,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src="/zonab.png"
            alt="Zona B logo"
            sx={{
                 width: { xs: 56, sm: 80, md: 96, lg: 104 }, /* + tamaños */
              height: 'auto',
              mr: { xs: 1.5, sm: 2 },
                     display: 'flex',
              alignItems: 'center',
            }}
          />
                  <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            <Typography
              component="h1"
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: 20, sm: 24, md: 28 },
                letterSpacing: '.5px',
                background:
                  'linear-gradient(90deg,#f7e7b7 0%,#d4af37 50%,#b88a00 100%)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 6px rgba(212,175,55,.45)',
                textTransform: 'uppercase',
              }}
            >
              Menú Zona B
            </Typography>
            <Typography
              component="span"
              sx={{
                mt: '2px',
                fontWeight: 500,
                fontSize: { xs: 10, sm: 12, md: 14 },
                color: '#d4af37',
                textShadow: '0 0 3px rgba(212,175,55,.35)',
                letterSpacing: '.4px',
              }}
            >
              Resto Bar
            </Typography>
          </Box>
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
                    <IconButton size="small" aria-label="clear search" onClick={() => onQueryChange?.('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
            }}
          />
        </Container>
      </AppBar>
      <MobileDrawer open={open} onClose={() => setOpen(false)} categories={categories} onSelect={onSelectCategory} />
    </>
  );
}