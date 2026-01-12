/**
 * Order Cancel Page
 * Shown when user cancels Stripe checkout
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';

export default function OrderCancelPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Checkout Cancelled</CardTitle>
          <CardDescription>
            Your order was not completed. No charges were made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
            Your cart items are still saved. You can return to your cart to complete your purchase.
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => router.push('/dashboard/shop/cart')}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Return to Cart
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard/shop')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
