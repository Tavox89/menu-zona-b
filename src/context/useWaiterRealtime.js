import { useContext } from 'react';
import { WaiterRealtimeContext } from './waiterRealtimeContextValue.js';

export function useWaiterRealtime() {
  const context = useContext(WaiterRealtimeContext);

  if (!context) {
    throw new Error('useWaiterRealtime must be used within WaiterRealtimeProvider');
  }

  return context;
}
