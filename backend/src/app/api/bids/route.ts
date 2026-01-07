import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bidSchema = z.object({
  variant_id: z.string().uuid('Invalid variant ID'),
  price_ars: z.number().positive('Price must be greater than 0'),
  expires_at: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = bidSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { variant_id, price_ars, expires_at } = validationResult.data;

    // Verify variant exists
    const { data: variant, error: variantError } = await supabase
      .from('variants')
      .select('id, product_id')
      .eq('id', variant_id)
      .eq('active', true)
      .single();

    if (variantError || !variant) {
      return NextResponse.json(
        { error: 'Variant not found', code: 'VARIANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get current USD/ARS exchange rate
    const { data: exchangeRate } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', 'USD')
      .eq('to_currency', 'ARS')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const usdArsRate = exchangeRate?.rate || 1000; // Default fallback
    const priceUsd = price_ars / usdArsRate;

    // Set expiration (default 30 days from now)
    const expiresAt = expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Create bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        variant_id,
        user_id: user.id,
        price_ars,
        price_usd: priceUsd,
        usd_ars_rate: usdArsRate,
        expires_at: expiresAt,
        status: 'active',
      })
      .select(`
        *,
        variant:variants(
          id,
          size_eu,
          size_us,
          product:products(
            id,
            name,
            slug,
            image_url,
            brand:brands(name, slug)
          )
        )
      `)
      .single();

    if (bidError) {
      console.error('Error creating bid:', bidError);
      return NextResponse.json(
        { error: 'Failed to create bid', code: 'BID_CREATE_ERROR', details: bidError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Bid created successfully',
        bid,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Bid creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch user's bids
    let query = supabase
      .from('bids')
      .select(`
        *,
        variant:variants(
          id,
          size_eu,
          size_us,
          product:products(
            id,
            name,
            slug,
            colorway,
            image_url,
            brand:brands(name, slug)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: bids, error: bidsError } = await query;

    if (bidsError) {
      console.error('Error fetching bids:', bidsError);
      return NextResponse.json(
        { error: 'Failed to fetch bids', code: 'BIDS_FETCH_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bids });
  } catch (error) {
    console.error('Bids fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
