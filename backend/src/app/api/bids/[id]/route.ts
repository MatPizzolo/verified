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

    const bidId = params.id;

    // Verify bid exists and belongs to user
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('id, user_id, status')
      .eq('id', bidId)
      .single();

    if (bidError || !bid) {
      return NextResponse.json(
        { error: 'Bid not found', code: 'BID_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check ownership
    if (bid.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check if bid can be cancelled
    if (bid.status !== 'active') {
      return NextResponse.json(
        { error: 'Bid cannot be cancelled', code: 'BID_NOT_ACTIVE', details: `Bid status is ${bid.status}` },
        { status: 400 }
      );
    }

    // Update bid status to cancelled
    const { error: updateError } = await supabase
      .from('bids')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bidId);

    if (updateError) {
      console.error('Error cancelling bid:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel bid', code: 'BID_CANCEL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Bid cancelled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bid cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
