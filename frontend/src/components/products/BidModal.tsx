'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BidModalProps {
  variantId: string;
  productName: string;
  size: string;
  lowestAsk?: number;
  onClose: () => void;
}

export function BidModal({ variantId, productName, size, lowestAsk, onClose }: BidModalProps) {
  const router = useRouter();
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const priceNum = parseFloat(price);
      
      if (isNaN(priceNum) || priceNum <= 0) {
        setError('Please enter a valid price');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:4000/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          variant_id: variantId,
          price_ars: priceNum,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid');
      }

      // Success - redirect to my bids page
      router.push('/my-bids');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full" padding="lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Place Bid</h2>
          <p className="text-secondary-600">
            {productName} - Size {size}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="price" className="block text-sm font-medium text-secondary-700 mb-2">
              Your Bid (ARS)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">$</span>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                className="w-full pl-8 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {lowestAsk && (
              <p className="text-sm text-secondary-600 mt-2">
                Lowest Ask: ${lowestAsk.toLocaleString('es-AR')}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          <div className="bg-secondary-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-secondary-900 mb-2">How it works</h3>
            <ul className="text-sm text-secondary-600 space-y-1">
              <li>• Your bid will be active for 30 days</li>
              <li>• If a seller accepts your price, the sale is automatic</li>
              <li>• You can cancel your bid anytime before it's matched</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Placing Bid...' : 'Place Bid'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
