import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartItem, Product } from '@/data/mockData';

interface AppState {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, extras: { extraId: string; value: string }[], notes: string) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  orderPlaced: boolean;
  setOrderPlaced: (v: boolean) => void;
  orderNumber: number;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber] = useState(154);

  const addToCart = useCallback((product: Product, quantity: number, extras: { extraId: string; value: string }[], notes: string) => {
    setCart(prev => [...prev, { product, quantity, selectedExtras: extras, notes }]);
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => {
    const extrasTotal = item.selectedExtras.reduce((s, e) => {
      const extra = item.product.extras.find(x => x.id === e.extraId);
      return s + (extra?.price || 0);
    }, 0);
    return sum + (item.product.price + extrasTotal) * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, orderPlaced, setOrderPlaced, orderNumber }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
