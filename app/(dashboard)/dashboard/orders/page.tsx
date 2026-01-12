/**
 * Orders Page
 * View order history and download digital products
 */

'use client';

import { useEffect, useState } from 'react';
import { Order } from '@/lib/types/database';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Package, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    bonus_volume: number;
    downloads_remaining: number;
    product: {
      id: string;
      name: string;
      description: string | null;
      image_url: string | null;
      digital_asset_url: string | null;
      download_limit: number;
    };
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDownload = async (orderItemId: string, productName: string) => {
    setDownloading(orderItemId);

    try {
      const response = await fetch(`/api/orders/download/${orderItemId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const data = await response.json();

      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank');

      toast.success('Download started', {
        description: productName,
      });

      // Refresh orders to update download count
      fetchOrders();
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">View your order history and downloads</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here
            </p>
            <Button onClick={() => (window.location.href = '/dashboard/shop')}>
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{order.id.substring(0, 8)}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </span>
                    <span>{formatCurrency(order.total_amount)}</span>
                    <span>{order.total_bonus_volume} BV</span>
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    order.status === 'completed'
                      ? 'default'
                      : order.status === 'pending'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Downloads</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.product.image_url && (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            {item.product.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {item.product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total_price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-muted-foreground">
                          {item.downloads_remaining === -1
                            ? 'Unlimited'
                            : `${item.downloads_remaining} left`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.product.digital_asset_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(item.id, item.product.name)}
                            disabled={
                              downloading === item.id ||
                              item.downloads_remaining === 0
                            }
                          >
                            {downloading === item.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="mr-2 h-3 w-3" />
                                Download
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">No download</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
