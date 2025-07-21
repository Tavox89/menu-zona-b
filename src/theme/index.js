import { createTheme } from '@mui/material/styles';

/**
 * Base MUI theme for the Zona B menu. It uses a dark palette with the
 * brand orange as primary and the "Zona B" yellow as secondary. The
 * global background is pure black.
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#d8ac1eff' },
    secondary: { main: '#c5a659ff' },
    background: { default: '#000' },
  },
});

export default theme;