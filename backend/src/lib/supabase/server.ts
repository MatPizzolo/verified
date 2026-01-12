import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Regular client for auth operations
export function createClient(request?: NextRequest) {
  const options: any = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };

  // If request provided, extract auth token from Authorization header
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      options.global = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    options
  );
}

// Admin client that bypasses RLS
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    }
  );
}
