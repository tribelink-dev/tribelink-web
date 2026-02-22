'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Trash2, Edit2, Calendar, Users, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { useAuth } from '@/lib/auth';
import CartItem from '@/components/cart/CartItem';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, loading, checkout, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const [checkingOut, setCheckingOut] = useState(false);

  if (!user) {
    router.push(`/login?redirect=${encodeURIComponent('/cart')}`);
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-heritage-gold border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  const itemCount = cart?.items?.length ?? 0;
  const totalPrice = cart?.totalPrice ?? 0;
  const items = cart?.items;
  // Currency is set by backend from first item's abode; fallback to USD
  const currency = cart?.currency ?? 'USD';

  const handleCheckout = async () => {
    if (!cart || !cart.items?.length) {
      alert('Your bucket is empty');
      return;
    }

    try {
      setCheckingOut(true);
      const result = await checkout();
      if (result.success) {
        router.push(`/bookings?success=true`);
      }
    } catch (error: any) {
      alert(error.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your bucket?')) {
      try {
        await clearCart();
      } catch (error: any) {
        alert(error.message || 'Failed to clear bucket');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-heritage-gold/10 p-4 rounded-2xl">
                <ShoppingCart className="w-8 h-8 text-heritage-gold" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">My Bucket</h1>
                <p className="text-gray-600 mt-1">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            {itemCount > 0 && (
              <button
                onClick={handleClearCart}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Bucket
              </button>
            )}
          </div>
        </motion.div>

        {itemCount === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-16 text-center"
          >
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your bucket is empty</h2>
            <p className="text-gray-600 mb-8">Start adding abodes and experiences to your bucket</p>
            <motion.button
              onClick={() => router.push('/adobes')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Browse Abodes
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {(items ?? []).map((item) => (
                <CartItem key={item._id} item={item} currency={currency} />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24 bg-white rounded-3xl shadow-xl p-8 border border-gray-200"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatPrice(totalPrice, currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Service Fee</span>
                    <span className="font-semibold">Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4 flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-heritage-gold">{formatPrice(totalPrice, currency)}</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Checkout</span>
                    </>
                  )}
                </motion.button>

                <p className="text-sm text-gray-500 text-center mt-4">
                  You will be redirected to complete your booking
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

