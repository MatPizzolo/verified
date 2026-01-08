import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';

export default async function MyBidsPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user's bids
  const response = await fetch('http://localhost:4000/api/bids?status=all', {
    headers: {
      'Cookie': `sb-access-token=${user.id}`, // Simplified - in production use proper session
    },
    cache: 'no-store',
  });

  const { bids } = await response.json();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'filled':
        return <Badge variant="default">Filled</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCancelBid = async (bidId: string) => {
    'use server';
    // This would be implemented as a server action
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">My Bids</h1>
          <p className="text-secondary-600">
            Manage your active bids and view bid history
          </p>
        </div>

        {bids && bids.length > 0 ? (
          <div className="space-y-4">
            {bids.map((bid: any) => (
              <Card key={bid.id} padding="md" hover>
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={bid.variant.product.image_url}
                      alt={bid.variant.product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link
                      href={`/products/${bid.variant.product.slug}`}
                      className="font-semibold text-secondary-900 hover:text-primary-600"
                    >
                      {bid.variant.product.name}
                    </Link>
                    <p className="text-sm text-secondary-600">
                      {bid.variant.product.brand.name} • Size EU {bid.variant.size_eu} (US {bid.variant.size_us})
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">
                      Placed {new Date(bid.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  {/* Bid Price */}
                  <div className="text-right">
                    <p className="text-sm text-secondary-600">Your Bid</p>
                    <p className="text-xl font-bold text-secondary-900">
                      ${bid.price_ars.toLocaleString('es-AR')}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(bid.status)}
                    {bid.status === 'active' && (
                      <form action={handleCancelBid.bind(null, bid.id)}>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="lg" className="text-center">
            <div className="py-12">
              <svg
                className="w-16 h-16 text-secondary-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                No bids yet
              </h3>
              <p className="text-secondary-600 mb-6">
                Start bidding on products you want to buy
              </p>
              <Link href="/products">
                <Button variant="primary">Browse Products</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
