/**
 * Order Success Page
 * Shown after successful Stripe checkout
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Download } from 'lucide-react';
import { useCart } from '@/lib/context/cart-context';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const session_id = searchParams.get('session_id');
    if (session_id) {
      setSessionId(session_id);
      // Clear cart after successful checkout
      clearCart();
    }
  }, [searchParams, clearCart]);

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6">
      {/* Success Message */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your order is being processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessionId && (
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Order ID</div>
              <div className="font-mono text-sm">{sessionId}</div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Your payment has been processed successfully</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Commission will be credited to your account within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Bonus Volume (BV) has been added to your totals</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Download links will be available in the Orders section</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => router.push('/dashboard')}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard/shop')}>
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">View Your Order</CardTitle>
          <CardDescription>
            Track your order status and download your digital products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/orders')}>
            <Download className="mr-2 h-4 w-4" />
            View Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
