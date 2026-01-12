/**
 * Shop Page
 * Browse and purchase digital products
 */

'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/types/database';
import { formatCurrency } from '@/lib/engines/wallet-engine';
import { useCart } from '@/lib/context/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Star, Search, Check } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'training', label: 'Training & Education' },
  { value: 'tools', label: 'Marketing Tools' },
  { value: 'leads', label: 'Lead Lists' },
  { value: 'software', label: 'Software & Apps' },
  { value: 'templates', label: 'Templates & Resources' },
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const { addItem, items, totalItems, totalAmount } = useCart();

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success('Added to cart', {
      description: product.name,
    });
  };

  const isInCart = (productId: string) => {
    return items.some((item) => item.product.id === productId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop</h1>
          <p className="text-muted-foreground">
            Browse digital products and training materials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold">{totalItems} items</span>
          <span className="text-muted-foreground">|</span>
          <span className="font-semibold">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={category === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No products found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col">
              {product.image_url && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {product.name}
                      {product.is_featured && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {product.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(product.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {product.bonus_volume} BV
                      </div>
                    </div>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => handleAddToCart(product)}
                  disabled={isInCart(product.id)}
                >
                  {isInCart(product.id) ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      In Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cart Summary */}
      {totalItems > 0 && (
        <Card className="fixed bottom-4 right-4 w-80">
          <CardHeader>
            <CardTitle className="text-lg">Cart Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{totalItems} items</span>
                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={() => window.location.href = '/dashboard/shop/cart'}>
                Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
