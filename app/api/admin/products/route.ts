/**
 * Admin Products API
 * GET /api/admin/products - List all products
 * POST /api/admin/products - Create new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { isAdmin } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await isAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // Filters
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');
    const isFeatured = searchParams.get('is_featured');

    let query = supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (isFeatured !== null) {
      query = query.eq('is_featured', isFeatured === 'true');
    }

    const { data: products, error } = await query;

    if (error) throw error;

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await isAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = createAdminClient();

    // Validate required fields
    const { name, slug, price, bonus_volume, category } = body;
    if (!name || !slug || price === undefined || bonus_volume === undefined || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      );
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description: body.description || null,
        long_description: body.long_description || null,
        price: parseFloat(price),
        bonus_volume: parseFloat(bonus_volume),
        category,
        tags: body.tags || null,
        digital_asset_url: body.digital_asset_url || null,
        download_limit: body.download_limit || 5,
        image_url: body.image_url || null,
        thumbnail_url: body.thumbnail_url || null,
        is_active: body.is_active ?? true,
        is_featured: body.is_featured ?? false,
        sort_order: body.sort_order || 0,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
      } as never)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
