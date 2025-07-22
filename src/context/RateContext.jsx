import { createContext, useContext, useEffect, useState } from 'react';
import { getUsdToBsRate } from '../api/rate.js';

/**
 * Simple context providing the USD->Bs conversion rate. The rate is fetched
 * once on mount from the backend and defaults to 1 when unavailable.
 */
const RateContext = createContext(1);

export function RateProvider({ children }) {
  const [rate, setRate] = useState(1);
  useEffect(() => {
    let mounted = true;
    getUsdToBsRate().then((r) => {
      if (mounted && r) setRate(Number(r) || 1);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return <RateContext.Provider value={rate}>{children}</RateContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsdToBsRate = () => useContext(RateContext);