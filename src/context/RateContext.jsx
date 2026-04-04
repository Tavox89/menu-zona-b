import { createContext, useContext, useEffect, useState } from 'react';
import { getCachedUsdToBsRate, getUsdToBsRate, isValidUsdToBsRate } from '../services/rate.js';
// Context that holds the USD→Bs conversion rate. Defaults to null if not yet
// loaded. Components can consume this context via the useUsdToBsRate hook.
const RateContext = createContext(null);
const SUCCESS_REFRESH_MS = 30 * 60 * 1000;
const RETRY_DELAY_MS = 10 * 1000;

/**
 * Provider component that fetches the USD→Bs rate from the remote API and
 * exposes it to children. The rate is refreshed periodically. If the API
 * call fails, the provider retries and keeps the last valid known value.
 */
export function RateProvider({ children }) {
  const [rate, setRate] = useState(() => getCachedUsdToBsRate());
  useEffect(() => {
    let active = true;
    let timerId = null;

    async function loadRate() {
      const value = await getUsdToBsRate();
      if (!active) {
        return;
      }

      if (isValidUsdToBsRate(value)) {
        setRate(value);
        timerId = window.setTimeout(loadRate, SUCCESS_REFRESH_MS);
        return;
      }

      timerId = window.setTimeout(loadRate, RETRY_DELAY_MS);
    }

    loadRate();

    return () => {
      active = false;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, []);
  return <RateContext.Provider value={rate}>{children}</RateContext.Provider>;
}

/**
 * Consume the USD→Bs conversion rate. Returns null until the RateProvider
 * fetches the actual value.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useUsdToBsRate() {
  return useContext(RateContext);
}
