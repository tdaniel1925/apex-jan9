/**
 * Shopping Cart Page
 * Review cart items and proceed to checkout
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/cart-context';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { getRetailCommissionRate } from '@/lib/engines/retail-commission-engine';
import { Agent } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalItems, totalAmount, totalBV } = useCart();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // Fetch current agent
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch('/api/agent/me');
        if (!response.ok) throw new Error('Failed to fetch agent');
        const data = await response.json();
        setAgent(data.agent);
      } catch (error) {
        console.error('Error fetching agent:', error);
        toast.error('Failed to load agent information');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setCheckingOut(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Checkout failed');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
      setCheckingOut(false);
    }
  };

  // Calculate estimated commission
  const estimatedCommission = agent
    ? totalAmount * getRetailCommissionRate(agent.rank)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-muted-foreground">Review your items and proceed to checkout</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">
              Browse our products and add items to your cart
            </p>
            <Button onClick={() => router.push('/dashboard/shop')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/shop')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.product.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  {item.product.image_url && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{item.product.name}</h3>
                        {item.product.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-lg font-bold">
                            {formatCurrency(item.product.price)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.product.bonus_volume} BV
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          removeItem(item.product.id);
                          toast.success('Removed from cart');
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-sm text-muted-foreground mr-2">Quantity:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.product.id, item.quantity - 1);
                          }
                        }}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 1;
                          if (qty > 0) {
                            updateQuantity(item.product.id, qty);
                          }
                        }}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm text-muted-foreground ml-2">
                        = {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your totals before checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Bonus Volume */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Bonus Volume</span>
                <span className="font-medium">{totalBV} BV</span>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Estimated Commission */}
              {agent && (
                <>
                  <Separator />
                  <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                    <div className="text-sm font-medium">Your Estimated Earnings</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(estimatedCommission)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Direct commission at {(getRetailCommissionRate(agent.rank) * 100).toFixed(0)}%
                      <br />
                      Plus upline overrides on {totalBV} BV
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Checkout Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Proceed to Checkout
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure checkout powered by Stripe
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
