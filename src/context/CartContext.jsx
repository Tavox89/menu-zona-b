import { createContext, useReducer, useContext } from 'react';

const CartContext = createContext();
function reducer(state, action) {
  switch (action.type) {
    case 'add':   return { ...state, items: [...state.items, action.payload] };
    case 'clear': return { ...state, items: [] };
    default:      return state;
  }
}
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>;
};
export const useCart = () => useContext(CartContext);
