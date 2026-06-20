'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { useAuth } from '@/lib/auth';
import CartItem from '@/components/cart/CartItem';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import ToastContainer, { useToast } from '@/components/Toast';
import { PageContainer } from '@/components/ui/PageContainer';
import MobileStickyBar from '@/components/ui/MobileStickyBar';

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, loading, checkout, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const { toasts, removeToast, error: showError } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent('/cart')}`);
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-sos-clear">
        <PageContainer className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent" />
        </PageContainer>
      </div>
    );
  }

  const itemCount = cart?.items?.length ?? 0;
  const totalPrice = cart?.totalPrice ?? 0;
  const items = cart?.items;
  const currency = cart?.currency ?? 'USD';

  const handleCheckout = async () => {
    setCheckoutError('');
    if (!cart || !cart.items?.length) {
      setCheckoutError('Your trip is empty');
      return;
    }

    try {
      setCheckingOut(true);
      const result = await checkout();
      if (result.success) {
        router.push('/bookings/payment?from=cart');
      }
    } catch (error: any) {
      const msg = error.message || 'Checkout failed';
      setCheckoutError(msg);
      showError(msg);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch (error: any) {
      showError(error.message || 'Failed to clear trip');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-bottom-bar lg:pb-16">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PageContainer>
        <CheckoutSteps currentStep={1} />

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary">Review your trip</h1>
            <p className="text-text-secondary mt-1">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          {itemCount > 0 && (
            <Button variant="ghost" onClick={handleClearCart} className="text-red-600">
              <Trash2 className="w-4 h-4" />
              Clear trip
            </Button>
          )}
        </div>

        {checkoutError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg mb-6">{checkoutError}</p>
        )}

        {itemCount === 0 ? (
          <Card className="p-16 text-center">
            <ShoppingCart className="w-16 h-16 text-text-secondary opacity-40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">Your trip is empty</h2>
            <p className="text-text-secondary mb-6">Add homestays and experiences to get started</p>
            <Button onClick={() => router.push('/explore')}>Explore homestays</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {(items ?? []).map((item) => (
                <CartItem key={item._id} item={item} currency={currency} />
              ))}
            </div>

            <div className="hidden lg:block lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent>
                  <h2 className="text-lg font-semibold mb-4">Trip total</h2>
                  <div className="flex justify-between text-text-secondary mb-2">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice, currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-text-primary pt-4 border-t border-border mb-6">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice, currency)}</span>
                  </div>
                  <Button className="w-full" onClick={handleCheckout} disabled={checkingOut}>
                    {checkingOut ? 'Processing...' : 'Continue to payment'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {itemCount > 0 && (
          <MobileStickyBar innerClassName="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold text-text-primary">{formatPrice(totalPrice, currency)}</p>
            <Button onClick={handleCheckout} disabled={checkingOut}>
              {checkingOut ? '...' : 'Continue'}
            </Button>
          </MobileStickyBar>
        )}
      </PageContainer>
    </div>
  );
}
