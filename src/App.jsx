import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme/index.js';
import { CartProvider } from './context/CartContext.jsx';
import AppRouter from './router/index.jsx';

/**
 * Root application component. It wires up the MUI theme, resets CSS via
 * CssBaseline, provides the cart context and delegates routing to
 * AppRouter. Keeping this component lean makes it easy to plug in
 * additional providers (e.g. internationalization) later.
 */
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </ThemeProvider>
  );
}