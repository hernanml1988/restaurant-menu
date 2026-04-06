import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { DiningSessionRecord } from '@/services/diningSessionService';
import type { OrderRecord } from '@/services/orderService';
import type { ProductRecord } from '@/services/productService';

const CLIENT_STORAGE_KEY = 'mesa-magica-client-state';

export interface CartExtraSelection {
  extraId: string;
  name: string;
  value: string;
  price: number;
}

export interface CartItem {
  product: ProductRecord;
  quantity: number;
  selectedExtras: CartExtraSelection[];
  notes: string;
}

interface PersistedClientState {
  session: DiningSessionRecord | null;
  cart: CartItem[];
  lastSubmittedOrder: OrderRecord | null;
}

interface AppState {
  session: DiningSessionRecord | null;
  cart: CartItem[];
  addToCart: (
    product: ProductRecord,
    quantity: number,
    extras: CartExtraSelection[],
    notes: string,
  ) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  lastSubmittedOrder: OrderRecord | null;
  setLastSubmittedOrder: (order: OrderRecord | null) => void;
  setSession: (session: DiningSessionRecord | null) => void;
}

const AppContext = createContext<AppState | null>(null);

function loadPersistedClientState(): PersistedClientState {
  if (typeof window === 'undefined') {
    return {
      session: null,
      cart: [],
      lastSubmittedOrder: null,
    };
  }

  try {
    const rawState = window.localStorage.getItem(CLIENT_STORAGE_KEY);

    if (!rawState) {
      return {
        session: null,
        cart: [],
        lastSubmittedOrder: null,
      };
    }

    const parsedState = JSON.parse(rawState) as Partial<PersistedClientState>;

    return {
      session: parsedState.session ?? null,
      cart: parsedState.cart ?? [],
      lastSubmittedOrder: parsedState.lastSubmittedOrder ?? null,
    };
  } catch {
    return {
      session: null,
      cart: [],
      lastSubmittedOrder: null,
    };
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialState = useMemo(loadPersistedClientState, []);
  const [session, setSessionState] = useState<DiningSessionRecord | null>(
    initialState.session,
  );
  const [cart, setCart] = useState<CartItem[]>(initialState.cart);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<OrderRecord | null>(
    initialState.lastSubmittedOrder,
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      CLIENT_STORAGE_KEY,
      JSON.stringify({
        session,
        cart,
        lastSubmittedOrder,
      }),
    );
  }, [cart, lastSubmittedOrder, session]);

  const setSession = (nextSession: DiningSessionRecord | null) => {
    setSessionState((currentSession) => {
      if (
        currentSession &&
        nextSession &&
        currentSession.sessionToken === nextSession.sessionToken
      ) {
        return nextSession;
      }

      setCart([]);
      setLastSubmittedOrder(null);
      return nextSession;
    });
  };

  const addToCart = (
    product: ProductRecord,
    quantity: number,
    extras: CartExtraSelection[],
    notes: string,
  ) => {
    setCart((currentCart) => [
      ...currentCart,
      {
        product,
        quantity,
        selectedExtras: extras,
        notes,
      },
    ]);
  };

  const removeFromCart = (index: number) => {
    setCart((currentCart) => currentCart.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    setCart((currentCart) =>
      currentCart.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => {
    const extrasTotal = item.selectedExtras.reduce(
      (extraSum, extra) => extraSum + extra.price,
      0,
    );

    return sum + (Number(item.product.price) + extrasTotal) * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        session,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        lastSubmittedOrder,
        setLastSubmittedOrder,
        setSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
