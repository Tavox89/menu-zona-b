import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * CartContext encapsulates the shopping cart state and operations. It
 * persists the cart in localStorage so users can reload the app without
 * losing their selections. Each cart item must contain at minimum the
 * following properties:
 *   id: unique identifier for the line item (productId + extras signature)
 *   productId: underlying WooCommerce product ID
 *   name: product name
 *   qty: quantity selected
 *   basePrice: price of the product before extras
 *   extras: array of { groupId, optionId, label, price }
 *   lineTotal: computed total for this line (qty * (basePrice + extras sum))
 */
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Initialize from localStorage or fallback to empty array
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch {
      // Ignore write failures (e.g. private mode)
    }
  }, [items]);

  /**
   * Add a new item to the cart. If an identical line (same id) already
   * exists, increment its quantity instead. This allows the UI to
   * accumulate quantities when the user repeatedly adds the same product
   * with the same extras selection.
   */
  const add = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + item.qty, lineTotal: i.lineTotal + item.lineTotal } : i
        );
      }
      return [...prev, item];
    });
  };

  /**
   * Update a cart item. Accepts an id and a partial set of properties to
   * update. Recomputes the line total if qty or extras have changed.
   */
  const update = (id, changes) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...changes };
        const extrasTotal = updated.extras.reduce((sum, e) => sum + e.price, 0);
        updated.lineTotal = updated.qty * (updated.basePrice + extrasTotal);
        return updated;
      })
    );
  };

  /**
   * Remove a line item from the cart by id.
   */
  const remove = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  /**
   * Clear all items from the cart.
   */
  const clear = () => setItems([]);

  // Compute subtotal whenever items change
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.lineTotal, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, add, update, remove, clear, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};