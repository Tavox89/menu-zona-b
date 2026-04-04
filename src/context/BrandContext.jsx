import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_BRAND, normalizeBrandKey } from '../config/brands.js';
import { BrandContext } from './brandContextValue.js';

export function BrandProvider({ children }) {
  const [baseBrand, setBaseBrandState] = useState(DEFAULT_BRAND);
  const [effectiveBrand, setEffectiveBrandState] = useState(DEFAULT_BRAND);
  const [brandTransitionMode, setBrandTransitionModeState] = useState('soft');

  const setBaseBrand = useCallback((brandKey) => {
    setBaseBrandState(normalizeBrandKey(brandKey));
  }, []);

  const setEffectiveBrand = useCallback((brandKey) => {
    setEffectiveBrandState(normalizeBrandKey(brandKey));
  }, []);

  const setBrandTransitionMode = useCallback((mode) => {
    setBrandTransitionModeState(mode === 'instant' ? 'instant' : 'soft');
  }, []);

  const value = useMemo(
    () => ({
      baseBrand,
      effectiveBrand,
      brandTransitionMode,
      setBaseBrand,
      setEffectiveBrand,
      setBrandTransitionMode,
    }),
    [baseBrand, effectiveBrand, brandTransitionMode, setBaseBrand, setEffectiveBrand, setBrandTransitionMode]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}
