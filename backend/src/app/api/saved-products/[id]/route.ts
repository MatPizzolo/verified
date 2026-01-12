import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error: authError, userId } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const adminClient = createAdminClient();

    const productId = params.id;

    // Delete saved product
    const { error: deleteError } = await adminClient
      .from('saved_products')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (deleteError) {
      console.error('Error deleting saved product:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete saved product', code: 'DELETE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Product removed from saved' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete saved product error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
