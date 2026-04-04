import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { calcLine } from '../utils/cartTotals.js';
import { buildCartItemId } from '../utils/cartItem.js';
import { sanitizeFulfillmentMode } from '../utils/fulfillment.js';

function normalizeCartItems(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        fulfillmentMode: sanitizeFulfillmentMode(
          item?.fulfillmentMode ?? item?.fulfillment_mode,
          'dine_in'
        ),
        lineTotal: calcLine(item),
      }))
    : [];
}
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
      return normalizeCartItems(raw ? JSON.parse(raw) : []);
    } catch {
      return [];
    }
  });
  const [fulfillmentMode, setFulfillmentModeState] = useState(() => {
    try {
      return sanitizeFulfillmentMode(localStorage.getItem('cart_fulfillment_mode'), 'dine_in');
    } catch {
      return 'dine_in';
    }
  });
  const [attentionTick, setAttentionTick] = useState(0);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch {
      // Ignore write failures (e.g. private mode)
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('cart_fulfillment_mode', fulfillmentMode);
    } catch {
      // Ignore write failures.
    }
  }, [fulfillmentMode]);

  /**
   * Add a new item to the cart. If an identical line (same id) already
   * exists, increment its quantity instead. This allows the UI to
   * accumulate quantities when the user repeatedly adds the same product
   * with the same extras selection.
   */
  const add = (item) => {
    setItems((prev) => {
      const normalizedItem = {
        ...item,
        fulfillmentMode: sanitizeFulfillmentMode(item?.fulfillmentMode, fulfillmentMode),
      };
      const itemId =
        normalizedItem.id ||
        buildCartItemId(
          normalizedItem.productId,
          normalizedItem.extras,
          normalizedItem.note,
          normalizedItem.fulfillmentMode
        );
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        const updated = {
          ...existing,
          ...normalizedItem,
          id: itemId,
          qty: existing.qty + normalizedItem.qty,
          fulfillmentMode: sanitizeFulfillmentMode(
            normalizedItem.fulfillmentMode,
            existing.fulfillmentMode || fulfillmentMode
          ),
        };
        updated.lineTotal = calcLine(updated);
        return prev.map((i) => (i.id === itemId ? updated : i));
      }
      const newItem = {
        ...normalizedItem,
        id: itemId,
        lineTotal: calcLine(normalizedItem),
      };
      return [...prev, newItem];
    });
    setAttentionTick((value) => value + 1);
  };

  /**
   * Update a cart item. Accepts an id and a partial set of properties to
   * update. Recomputes the line total if qty or extras have changed.
   */
  const update = (id, changes) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = {
          ...i,
          ...changes,
          fulfillmentMode: sanitizeFulfillmentMode(
            changes?.fulfillmentMode ?? i.fulfillmentMode,
            fulfillmentMode
          ),
        };
        updated.lineTotal = calcLine(updated);
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

  const clear = () => {
    setItems([]);
    setFulfillmentModeState('dine_in');
  };

  /**
   * Reemplaza el carrito completo. Se usa para repetir pedidos con
   * precios y extras revalidados contra el catálogo actual.
   */
  const replace = (nextItems) => {
    const normalizedItems = normalizeCartItems(nextItems);
    setItems(normalizedItems);
    const nextMode =
      normalizedItems.length > 0 &&
      normalizedItems.every((item) => sanitizeFulfillmentMode(item.fulfillmentMode) === 'takeaway')
        ? 'takeaway'
        : 'dine_in';
    setFulfillmentModeState(nextMode);
    setAttentionTick((value) => value + 1);
  };

  const setFulfillmentMode = (nextMode) => {
    const normalizedMode = sanitizeFulfillmentMode(nextMode, 'dine_in');
    setFulfillmentModeState(normalizedMode);
    setItems((prev) =>
      prev.reduce((nextItems, item) => {
        const updated = {
          ...item,
          fulfillmentMode: normalizedMode,
        };
        updated.id = buildCartItemId(
          updated.productId,
          updated.extras,
          updated.note,
          updated.fulfillmentMode
        );
        updated.lineTotal = calcLine(updated);
        const duplicateIndex = nextItems.findIndex((entry) => entry.id === updated.id);
        if (duplicateIndex >= 0) {
          const merged = {
            ...nextItems[duplicateIndex],
            qty: nextItems[duplicateIndex].qty + updated.qty,
            fulfillmentMode: updated.fulfillmentMode,
          };
          merged.lineTotal = calcLine(merged);
          nextItems[duplicateIndex] = merged;
        } else {
          nextItems.push(updated);
        }
        return nextItems;
      }, [])
    );
  };

  const setItemFulfillmentMode = (id, nextMode) => {
    const normalizedMode = sanitizeFulfillmentMode(nextMode, fulfillmentMode);

    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) {
        return prev;
      }

      const updatedTarget = {
        ...target,
        fulfillmentMode: normalizedMode,
      };
      updatedTarget.id = buildCartItemId(
        updatedTarget.productId,
        updatedTarget.extras,
        updatedTarget.note,
        updatedTarget.fulfillmentMode
      );
      updatedTarget.lineTotal = calcLine(updatedTarget);

      return prev.reduce((nextItems, item) => {
        if (item.id === id) {
          const duplicateIndex = nextItems.findIndex((entry) => entry.id === updatedTarget.id);
          if (duplicateIndex >= 0) {
            const merged = {
              ...nextItems[duplicateIndex],
              qty: nextItems[duplicateIndex].qty + updatedTarget.qty,
              fulfillmentMode: updatedTarget.fulfillmentMode,
            };
            merged.lineTotal = calcLine(merged);
            nextItems[duplicateIndex] = merged;
          } else {
            nextItems.push(updatedTarget);
          }
          return nextItems;
        }

        nextItems.push(item);
        return nextItems;
      }, []);
    });
  };

  // Compute subtotal whenever items change
  const subtotal = useMemo(
     () => items.reduce((sum, item) => sum + calcLine(item), 0),
    [items]
  );
  const value = {
    items,
    add,
    update,
    remove,
    clear,
    replace,
    subtotal,
    attentionTick,
    fulfillmentMode,
    setFulfillmentMode,
    setItemFulfillmentMode,
  };
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
