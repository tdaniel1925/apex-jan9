/**
 * Product Create/Edit Dialog
 * Form for managing digital products
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, ProductInsert } from '@/lib/types/database';
import { toast } from 'sonner';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null; // If editing
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: 'training', label: 'Training & Education' },
  { value: 'tools', label: 'Marketing Tools' },
  { value: 'leads', label: 'Lead Lists' },
  { value: 'software', label: 'Software & Apps' },
  { value: 'templates', label: 'Templates & Resources' },
];

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    long_description: '',
    price: '0',
    bonus_volume: '0',
    category: 'training',
    digital_asset_url: '',
    download_limit: '5',
    image_url: '',
    is_active: true,
    is_featured: false,
    sort_order: '0',
  });

  // Load product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        long_description: product.long_description || '',
        price: product.price.toString(),
        bonus_volume: product.bonus_volume.toString(),
        category: product.category,
        digital_asset_url: product.digital_asset_url || '',
        download_limit: product.download_limit.toString(),
        image_url: product.image_url || '',
        is_active: product.is_active,
        is_featured: product.is_featured,
        sort_order: product.sort_order.toString(),
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        slug: '',
        description: '',
        long_description: '',
        price: '0',
        bonus_volume: '0',
        category: 'training',
        digital_asset_url: '',
        download_limit: '5',
        image_url: '',
        is_active: true,
        is_featured: false,
        sort_order: '0',
      });
    }
  }, [product, open]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate if not editing or slug is empty
      slug: !product && !formData.slug ? generateSlug(name) : prev.slug,
    }));
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.slug || !formData.price || !formData.bonus_volume) {
        toast.error('Please fill in all required fields');
        return;
      }

      const url = product
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';

      const method = product ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          bonus_volume: parseFloat(formData.bonus_volume),
          download_limit: parseInt(formData.download_limit),
          sort_order: parseInt(formData.sort_order),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      toast.success(product ? 'Product updated' : 'Product created');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Create New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update product details and settings' : 'Add a new digital product to your store'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Advanced Recruiting Training"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="advanced-recruiting-training"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used in product URL. Auto-generated from name if left empty.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Short Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description for product cards"
              />
            </div>

            <div>
              <Label htmlFor="long_description">Full Description</Label>
              <Textarea
                id="long_description"
                value={formData.long_description}
                onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                placeholder="Detailed product description..."
                rows={4}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="97.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="bonus_volume">Bonus Volume (BV) *</Label>
              <Input
                id="bonus_volume"
                type="number"
                step="0.01"
                min="0"
                value={formData.bonus_volume}
                onChange={(e) => setFormData({ ...formData, bonus_volume: e.target.value })}
                placeholder="50"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for commission calculations
              </p>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Digital Asset */}
          <div>
            <Label htmlFor="digital_asset_url">Digital Asset URL</Label>
            <Input
              id="digital_asset_url"
              type="url"
              value={formData.digital_asset_url}
              onChange={(e) => setFormData({ ...formData, digital_asset_url: e.target.value })}
              placeholder="https://storage.example.com/file.pdf"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link to downloadable file (PDF, video, ZIP, etc.)
            </p>
          </div>

          <div>
            <Label htmlFor="download_limit">Download Limit</Label>
            <Input
              id="download_limit"
              type="number"
              min="1"
              value={formData.download_limit}
              onChange={(e) => setFormData({ ...formData, download_limit: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum downloads per purchase
            </p>
          </div>

          {/* Image */}
          <div>
            <Label htmlFor="image_url">Product Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Status Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_featured">Featured</Label>
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower numbers appear first
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
