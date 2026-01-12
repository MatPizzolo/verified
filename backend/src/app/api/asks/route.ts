import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const askSchema = z.object({
  variant_id: z.string().uuid('Invalid variant ID'),
  price_ars: z.number().int('Price must be an integer (centavos)').positive('Price must be greater than 0'),
  expires_at: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = askSchema.safeParse(body);

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

    // Get current USD/ARS exchange rate (use 'blue' rate for market pricing)
    const { data: exchangeRate } = await supabase
      .from('exchange_rates')
      .select('usd_to_ars')
      .eq('rate_type', 'blue')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Exchange rate is stored as rate * 10000 (e.g., 1350.50 = 13505000)
    const usdArsRate = exchangeRate?.usd_to_ars ? Math.round(exchangeRate.usd_to_ars * 10000) : 13505000;
    
    // Convert ARS centavos to USD cents using integer math to avoid rounding errors
    // Formula: (arsCentavos * 10000) / rate
    const priceUsd = Math.round((price_ars * 10000) / usdArsRate);

    // Set expiration (default 30 days from now)
    const expiresAt = expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Create ask
    const { data: ask, error: askError } = await supabase
      .from('asks')
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

    if (askError) {
      console.error('Error creating ask:', askError);
      return NextResponse.json(
        { error: 'Failed to create ask', code: 'ASK_CREATE_ERROR', details: askError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Ask created successfully',
        ask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ask creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);
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

    // Fetch user's asks
    let query = supabase
      .from('asks')
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

    const { data: asks, error: asksError } = await query;

    if (asksError) {
      console.error('Error fetching asks:', asksError);
      return NextResponse.json(
        { error: 'Failed to fetch asks', code: 'ASKS_FETCH_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ asks });
  } catch (error) {
    console.error('Asks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
