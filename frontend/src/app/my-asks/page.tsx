import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';

export default async function MyAsksPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user's asks
  const response = await fetch('http://localhost:4000/api/asks?status=all', {
    headers: {
      'Cookie': `sb-access-token=${user.id}`, // Simplified - in production use proper session
    },
    cache: 'no-store',
  });

  const { asks } = await response.json();

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

  const handleCancelAsk = async (askId: string) => {
    'use server';
    // This would be implemented as a server action
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">My Asks</h1>
          <p className="text-secondary-600">
            Manage your active asks and view sales history
          </p>
        </div>

        {asks && asks.length > 0 ? (
          <div className="space-y-4">
            {asks.map((ask: any) => (
              <Card key={ask.id} padding="md" hover>
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={ask.variant.product.image_url}
                      alt={ask.variant.product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link
                      href={`/products/${ask.variant.product.slug}`}
                      className="font-semibold text-secondary-900 hover:text-primary-600"
                    >
                      {ask.variant.product.name}
                    </Link>
                    <p className="text-sm text-secondary-600">
                      {ask.variant.product.brand.name} • Size EU {ask.variant.size_eu} (US {ask.variant.size_us})
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">
                      Listed {new Date(ask.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  {/* Ask Price */}
                  <div className="text-right">
                    <p className="text-sm text-secondary-600">Your Ask</p>
                    <p className="text-xl font-bold text-secondary-900">
                      ${ask.price_ars.toLocaleString('es-AR')}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(ask.status)}
                    {ask.status === 'active' && (
                      <form action={handleCancelAsk.bind(null, ask.id)}>
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                No asks yet
              </h3>
              <p className="text-secondary-600 mb-6">
                Start selling products from your collection
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
