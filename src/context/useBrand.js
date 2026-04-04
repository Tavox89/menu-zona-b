import { useContext } from 'react';
import { BrandContext } from './brandContextValue.js';

export function useBrand() {
  const context = useContext(BrandContext);

  if (!context) {
    throw new Error('useBrand must be used within BrandProvider');
  }

  return context;
}
