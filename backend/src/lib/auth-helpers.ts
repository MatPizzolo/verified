import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from './supabase/server';

/**
 * Get authenticated user from request and return their database ID
 * This helper reduces code duplication across all authenticated routes
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createClient(request);

  // Get user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
      user: null,
      userId: null,
    };
  }

  // Get user's database ID using admin client
  const adminClient = createAdminClient();
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (userError || !userData) {
    return {
      error: NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      ),
      user: null,
      userId: null,
    };
  }

  return {
    error: null,
    user,
    userId: userData.id,
  };
}
