import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
  remember_me: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (authError) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' } },
        { status: 401 }
      );
    }

    if (!authData.user) {
      throw new Error('Login failed');
    }

    // Get user details (use admin client to bypass RLS)
    const adminClient = createAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    // Check if account is banned
    if (userData.banned_at) {
      return NextResponse.json(
        { 
          error: { 
            code: 'ACCOUNT_BANNED', 
            message: `Cuenta suspendida: ${userData.ban_reason || 'Contacta soporte'}` 
          } 
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        avatar_url: userData.avatar_url,
        reputation_score: userData.reputation_score
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Datos inválidos', 
            fields: error.flatten().fieldErrors 
          } 
        },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error al iniciar sesión' } },
      { status: 500 }
    );
  }
}
