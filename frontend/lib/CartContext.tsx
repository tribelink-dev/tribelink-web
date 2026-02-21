'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';
import { useAuth } from './auth';

interface CartExperience {
  experienceId: string;
  date: Date | string;
  startTime: string;
  participants: number;
  specialRequests?: string;
}

interface CartAbodeStay {
  localHostId: string;
  variantId: string | null;
  checkIn: Date | string;
  checkOut: Date | string;
  guests: number;
  specialRequests?: string;
}

interface CartItem {
  _id?: string;
  type: 'ABODE_STAY' | 'EXPERIENCE';
  abodeStay?: CartAbodeStay;
  experiences?: CartExperience[];
  experience?: {
    experienceId: string;
    date: Date | string;
    startTime: string;
    participants: number;
    specialRequests?: string;
  };
  itemPrice?: number;
}

interface Cart {
  _id?: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
  currency: string;
  expiresAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addAbodeToCart: (abodeData: CartAbodeStay) => Promise<void>;
  addExperienceToCartItem: (itemId: string, experience: CartExperience) => Promise<void>;
  updateCartItem: (itemId: string, updates: Partial<CartAbodeStay>) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  removeExperienceFromItem: (itemId: string, experienceId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  checkout: () => Promise<{ success: boolean; bookings: string[] }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/cart');
      if (response.data.success) {
        // Ensure cart data is fresh and properly formatted
        const cartData = response.data.cart;
        // Validate totalPrice is a number
        if (cartData.totalPrice && typeof cartData.totalPrice !== 'number') {
          cartData.totalPrice = Number(cartData.totalPrice) || 0;
        }
        setCart(cartData);
      }
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      // Don't set error for 404 (cart doesn't exist yet)
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load cart');
      } else {
        setCart(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch and when user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add abode stay to cart
  const addAbodeToCart = useCallback(async (abodeData: CartAbodeStay) => {
    if (!user) {
      throw new Error('Please log in to add items to cart');
    }

    try {
      setError(null);
      const response = await api.post('/cart/abode', {
        localHostId: abodeData.localHostId,
        variantId: abodeData.variantId,
        checkIn: typeof abodeData.checkIn === 'string' ? abodeData.checkIn : abodeData.checkIn.toISOString(),
        checkOut: typeof abodeData.checkOut === 'string' ? abodeData.checkOut : abodeData.checkOut.toISOString(),
        guests: abodeData.guests,
        specialRequests: abodeData.specialRequests
      });

      if (response.data.success) {
        // Ensure cart data is fresh and properly formatted
        const cartData = response.data.cart;
        // Validate totalPrice is a number
        if (cartData.totalPrice && typeof cartData.totalPrice !== 'number') {
          cartData.totalPrice = Number(cartData.totalPrice) || 0;
        }
        setCart(cartData);
      }
    } catch (err: any) {
      console.error('Error adding abode to cart:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add to cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Add experience to cart item
  const addExperienceToCartItem = useCallback(async (itemId: string, experience: CartExperience) => {
    if (!user) {
      throw new Error('Please log in to add experiences');
    }

    try {
      setError(null);
      const response = await api.post('/cart/experience', {
        itemId,
        experienceId: experience.experienceId,
        date: typeof experience.date === 'string' ? experience.date : experience.date.toISOString(),
        startTime: experience.startTime,
        participants: experience.participants,
        specialRequests: experience.specialRequests
      });

      if (response.data.success) {
        // Ensure cart data is fresh and properly formatted
        const cartData = response.data.cart;
        // Validate totalPrice is a number
        if (cartData.totalPrice && typeof cartData.totalPrice !== 'number') {
          cartData.totalPrice = Number(cartData.totalPrice) || 0;
        }
        setCart(cartData);
      }
    } catch (err: any) {
      console.error('Error adding experience to cart:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add experience';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Update cart item
  const updateCartItem = useCallback(async (itemId: string, updates: Partial<CartAbodeStay>) => {
    if (!user) {
      throw new Error('Please log in to update cart');
    }

    try {
      setError(null);
      const payload: any = {};
      if (updates.variantId !== undefined) payload.variantId = updates.variantId;
      if (updates.checkIn !== undefined) {
        payload.checkIn = typeof updates.checkIn === 'string' ? updates.checkIn : updates.checkIn.toISOString();
      }
      if (updates.checkOut !== undefined) {
        payload.checkOut = typeof updates.checkOut === 'string' ? updates.checkOut : updates.checkOut.toISOString();
      }
      if (updates.guests !== undefined) payload.guests = updates.guests;
      if (updates.specialRequests !== undefined) payload.specialRequests = updates.specialRequests;

      const response = await api.put(`/cart/item/${itemId}`, payload);

      if (response.data.success) {
        // Ensure cart data is fresh and properly formatted
        const cartData = response.data.cart;
        // Validate totalPrice is a number
        if (cartData.totalPrice && typeof cartData.totalPrice !== 'number') {
          cartData.totalPrice = Number(cartData.totalPrice) || 0;
        }
        setCart(cartData);
      }
    } catch (err: any) {
      console.error('Error updating cart item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update cart item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Remove cart item
  const removeCartItem = useCallback(async (itemId: string) => {
    if (!user) {
      throw new Error('Please log in to remove items');
    }

    try {
      setError(null);
      const response = await api.delete(`/cart/item/${itemId}`);

      if (response.data.success) {
        // Ensure cart data is fresh and properly formatted
        const cartData = response.data.cart;
        // Validate totalPrice is a number
        if (cartData.totalPrice && typeof cartData.totalPrice !== 'number') {
          cartData.totalPrice = Number(cartData.totalPrice) || 0;
        }
        setCart(cartData);
      }
    } catch (err: any) {
      console.error('Error removing cart item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to remove item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Remove experience from cart item
  const removeExperienceFromItem = useCallback(async (itemId: string, experienceId: string) => {
    if (!user) {
      throw new Error('Please log in to remove experiences');
    }

    try {
      setError(null);
      const response = await api.delete(`/cart/experience/${itemId}/${experienceId}`);

      if (response.data.success) {
        // Ensure cart data is fresh and properly formatted
        const cartData = response.data.cart;
        // Validate totalPrice is a number
        if (cartData.totalPrice && typeof cartData.totalPrice !== 'number') {
          cartData.totalPrice = Number(cartData.totalPrice) || 0;
        }
        setCart(cartData);
      }
    } catch (err: any) {
      console.error('Error removing experience:', err);
      const errorMessage = err.response?.data?.message || 'Failed to remove experience';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Clear cart
  const clearCart = useCallback(async () => {
    if (!user) {
      throw new Error('Please log in to clear cart');
    }

    try {
      setError(null);
      const response = await api.delete('/cart');

      if (response.data.success) {
        // Ensure cart data is fresh and properly formatted
        const cartData = response.data.cart;
        // Validate totalPrice is a number
        if (cartData.totalPrice && typeof cartData.totalPrice !== 'number') {
          cartData.totalPrice = Number(cartData.totalPrice) || 0;
        }
        setCart(cartData);
      }
    } catch (err: any) {
      console.error('Error clearing cart:', err);
      const errorMessage = err.response?.data?.message || 'Failed to clear cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Refresh cart
  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  // Checkout
  const checkout = useCallback(async () => {
    if (!user) {
      throw new Error('Please log in to checkout');
    }

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    try {
      setError(null);
      const response = await api.post('/cart/checkout');

      if (response.data.success) {
        setCart(null); // Clear cart after successful checkout
        return {
          success: true,
          bookings: response.data.bookings || []
        };
      }
      throw new Error('Checkout failed');
    } catch (err: any) {
      console.error('Error during checkout:', err);
      const errorMessage = err.response?.data?.message || 'Checkout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addAbodeToCart,
        addExperienceToCartItem,
        updateCartItem,
        removeCartItem,
        removeExperienceFromItem,
        clearCart,
        refreshCart,
        checkout
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

