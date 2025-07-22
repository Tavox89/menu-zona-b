import { createContext, useContext, useEffect, useState } from 'react';

// Context that holds the USD→Bs conversion rate. Defaults to 1 if not yet
// loaded. Components can consume this context via the useUsdToBsRate hook.
const RateContext = createContext(1);

/**
 * Provider component that fetches the USD→Bs rate from the remote API and
 * exposes it to children. The rate is fetched once on mount. If the API
 * call fails, the default rate of 1 is kept so prices still render.
 */
export function RateProvider({ children }) {
  const [rate, setRate] = useState(1);
  useEffect(() => {
    async function loadRate() {
      try {
        const res = await fetch('https://clubsamsve.com/wp-json/fox-rate/v1/currencies');
        const data = await res.json();
        if (data && data.VEF && data.VEF.rate) {
          setRate(Number(data.VEF.rate) || 1);
        }
      } catch (err) {
        console.error('Failed to fetch conversion rate', err);
      }
    }
    loadRate();
  }, []);
  return <RateContext.Provider value={rate}>{children}</RateContext.Provider>;
}

/**
 * Consume the USD→Bs conversion rate. Returns 1 until the RateProvider
 * fetches the actual value.
 */
export function useUsdToBsRate() {
  return useContext(RateContext);
}