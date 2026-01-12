import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { error: authError, userId } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const adminClient = createAdminClient();

    // Fetch saved products with product details
    const { data: savedProducts, error: savedError } = await adminClient
      .from('saved_products')
      .select(`
        id,
        product_id,
        created_at,
        product:products(
          id,
          name,
          slug,
          colorway,
          image_url,
          retail_price_usd,
          brand:brands(
            id,
            name,
            slug
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (savedError) {
      console.error('Error fetching saved products:', savedError);
      return NextResponse.json(
        { error: 'Failed to fetch saved products', code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ saved_products: savedProducts });
  } catch (error) {
    console.error('Saved products fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError, userId } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const adminClient = createAdminClient();

    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Save product
    const { data: savedProduct, error: saveError } = await adminClient
      .from('saved_products')
      .insert({
        user_id: userId,
        product_id,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving product:', saveError);
      return NextResponse.json(
        { error: 'Failed to save product', code: 'SAVE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Product saved successfully', saved_product: savedProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error('Save product error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
