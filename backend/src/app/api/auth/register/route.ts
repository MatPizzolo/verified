import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  full_name: z.string().min(2, 'Nombre muy corto'),
  accept_terms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones'
  })
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const supabase = createClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: { code: 'EMAIL_EXISTS', message: 'Email ya registrado' } },
          { status: 400 }
        );
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create public user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: 'buyer',
        verified_email: false
      });

    if (userError) {
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: 'buyer',
        created_at: new Date().toISOString()
      },
      session: authData.session ? {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      } : null
    }, { status: 201 });

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

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error al crear cuenta' } },
      { status: 500 }
    );
  }
}
