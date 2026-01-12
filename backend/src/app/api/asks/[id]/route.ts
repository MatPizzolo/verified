import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const askId = params.id;

    // Verify ask exists and belongs to user
    const { data: ask, error: askError } = await supabase
      .from('asks')
      .select('id, user_id, status')
      .eq('id', askId)
      .single();

    if (askError || !ask) {
      return NextResponse.json(
        { error: 'Ask not found', code: 'ASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check ownership
    if (ask.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check if ask can be cancelled
    if (ask.status !== 'active') {
      return NextResponse.json(
        { error: 'Ask cannot be cancelled', code: 'ASK_NOT_ACTIVE', details: `Ask status is ${ask.status}` },
        { status: 400 }
      );
    }

    // Update ask status to cancelled
    const { error: updateError } = await supabase
      .from('asks')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', askId);

    if (updateError) {
      console.error('Error cancelling ask:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel ask', code: 'ASK_CANCEL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Ask cancelled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ask cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
