import { useState } from 'react';
import {
  appendOrderHistory,
  readOrderHistory,
  resolveOrderHistoryEntry,
} from '../utils/orderHistory.js';

export default function useOrderHistory(products = []) {
  const [history, setHistory] = useState(() => readOrderHistory());

  const refreshHistory = () => {
    setHistory(readOrderHistory());
  };

  const saveOrderHistory = (snapshot) => {
    const nextEntries = appendOrderHistory(snapshot);
    setHistory(nextEntries);
  };

  const repeatOrderFromHistory = (entry) =>
    resolveOrderHistoryEntry(entry, products);

  return {
    history,
    refreshHistory,
    saveOrderHistory,
    repeatOrderFromHistory,
  };
}
