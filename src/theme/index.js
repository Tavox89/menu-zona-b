import { createTheme, alpha } from '@mui/material/styles';

// Reusable glass gray background color
export const glassGray = alpha('#2f2f2f', 0.8);

/**
 * Base MUI theme for the Zona B menu. It uses a dark palette with the
 * brand yellow as primary and a softer yellow as secondary. The
 * global background is pure black.
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#d8ac1e' },
    secondary: { main: '#c5a659' },
    background: { default: '#000' },
  },
});

export default theme;