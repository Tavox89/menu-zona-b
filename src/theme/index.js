import { createTheme } from '@mui/material/styles';

/**
 * MUI theme configuration implementing a light palette with a subtle
 * glassmorphic effect. Papers (cards, dialogs, drawers) use a blurred
 * translucent background with a soft border. These global styles make
 * it easy to achieve the VIP glass look throughout the app without
 * repeating inline styles in every component.
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ff7500' },
    secondary: { main: '#008aff' },
    background: { default: '#f5f5f7' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
      },
    },
  },
});

export default theme;