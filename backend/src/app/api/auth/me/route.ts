import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token no proporcionado' } },
        { status: 401 }
      );
    }

    const supabase = createClient(request);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Token inválido o expirado' } },
        { status: 401 }
      );
    }

    // Get user details (use admin client to bypass RLS)
    const adminClient = createAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        avatar_url: userData.avatar_url,
        role: userData.role,
        verified_seller: userData.verified_seller,
        verified_email: userData.verified_email,
        verified_phone: userData.verified_phone,
        reputation_score: userData.reputation_score,
        total_sales: userData.total_sales,
        total_purchases: userData.total_purchases,
        created_at: userData.created_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error al obtener usuario' } },
      { status: 500 }
    );
  }
}
