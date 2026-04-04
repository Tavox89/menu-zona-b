import Box from '@mui/material/Box';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { keyframes } from '@mui/material/styles';
import { createAppTheme } from './theme/index.js';
import { CartProvider } from './context/CartContext.jsx';
import { RateProvider } from './context/RateContext.jsx';
import { BrandProvider } from './context/BrandContext.jsx';
import { useBrand } from './context/useBrand.js';
import { WaiterSessionProvider } from './context/WaiterSessionContext.jsx';
import { WaiterRealtimeProvider } from './context/WaiterRealtimeContext.jsx';
import AppRouter from './router/index.jsx';

const uiFadeIn = keyframes`
  0% {
    opacity: 0;
    filter: saturate(0.96) blur(1.5px);
  }
  100% {
    opacity: 1;
    filter: saturate(1) blur(0);
  }
`;

/**
 * Root application component. It wires up the MUI theme, resets CSS via
 * CssBaseline, provides the cart context and delegates routing to
 * AppRouter. Keeping this component lean makes it easy to plug in
 * additional providers (e.g. internationalization) later.
 */
function AppThemeShell() {
  const { effectiveBrand, brandTransitionMode, setBrandTransitionMode } = useBrand();
  const theme = useMemo(() => createAppTheme(effectiveBrand), [effectiveBrand]);
  const previousBrandRef = useRef(effectiveBrand);
  const frameRef = useRef(null);
  const timerRef = useRef(null);
  const [fadeActive, setFadeActive] = useState(false);

  useEffect(() => {
    if (previousBrandRef.current === effectiveBrand) {
      return undefined;
    }

    previousBrandRef.current = effectiveBrand;

    if (brandTransitionMode === 'instant') {
      setFadeActive(false);
      setBrandTransitionMode('soft');
      return undefined;
    }

    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
    }
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    setFadeActive(false);
    frameRef.current = window.requestAnimationFrame(() => {
      setFadeActive(true);
      timerRef.current = window.setTimeout(() => {
        setFadeActive(false);
      }, 260);
    });

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [effectiveBrand, brandTransitionMode, setBrandTransitionMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RateProvider>
        <WaiterSessionProvider>
          <WaiterRealtimeProvider>
            <CartProvider>
              <Box
                sx={{
                  minHeight: '100vh',
                  animation: fadeActive ? `${uiFadeIn} 260ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
                  willChange: fadeActive ? 'opacity, filter' : 'auto',
                }}
              >
                <AppRouter />
              </Box>
            </CartProvider>
          </WaiterRealtimeProvider>
        </WaiterSessionProvider>
      </RateProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrandProvider>
      <AppThemeShell />
    </BrandProvider>
  );
}
