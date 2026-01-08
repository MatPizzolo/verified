import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatARS } from '@/lib/format';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch product with all related data
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands(id, name, slug, logo_url),
      variants(
        id,
        size_eu,
        size_us,
        size_uk,
        market_stats(
          lowest_ask_ars,
          highest_bid_ars,
          last_sale_price_ars,
          total_asks,
          total_bids,
          total_sales
        )
      )
    `)
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error || !product) {
    notFound();
  }

  // Calculate overall stats
  const allStats = product.variants
    ?.map((v: any) => v.market_stats?.[0])
    .filter((s: any) => s);

  const lowestAsk = allStats
    ?.map((s: any) => s.lowest_ask_ars)
    .filter((p: any) => p !== null)
    .sort((a: number, b: number) => a - b)[0];

  const highestBid = allStats
    ?.map((s: any) => s.highest_bid_ars)
    .filter((p: any) => p !== null)
    .sort((a: number, b: number) => b - a)[0];

  const lastSale = allStats
    ?.map((s: any) => s.last_sale_price_ars)
    .filter((p: any) => p !== null)[0];

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-neutral-600 mb-8">
          <Link href="/" className="hover:text-neutral-900">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-neutral-900">
            Productos
          </Link>
          <span>/</span>
          <span className="text-neutral-900">{product.name}</span>
        </nav>

        {/* Product Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
              <Image
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info & Actions */}
          <div className="space-y-6">
            {/* Title & Brand */}
            <div>
              <p className="text-sm text-neutral-500 mb-2">{product.brand.name}</p>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">{product.name}</h1>
              <p className="text-neutral-600">{product.colorway}</p>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-neutral-200">
              <div className="text-center">
                <p className="text-xs text-neutral-500 mb-1">Lowest Ask</p>
                <p className="text-lg font-bold text-neutral-900">
                  {formatARS(lowestAsk)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500 mb-1">Highest Bid</p>
                <p className="text-lg font-bold text-neutral-900">
                  {formatARS(highestBid)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500 mb-1">Last Sale</p>
                <p className="text-lg font-bold text-neutral-900">
                  {formatARS(lastSale)}
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 h-14 flex flex-col items-center justify-center border-2 border-primary-500 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <span className="font-medium">Hacer Oferta</span>
                <span className="text-xs">{formatARS(highestBid)} o más</span>
              </Link>
              <Link
                href="/login"
                className="flex-1 h-14 flex flex-col items-center justify-center bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                <span className="font-medium">Comprar Ahora</span>
                <span className="text-xs">{formatARS(lowestAsk)}</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
              <div className="text-center">
                <ShieldCheck className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                <p className="text-xs text-neutral-500">100% Auténtico</p>
              </div>
              <div className="text-center">
                <Truck className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Envío Seguro</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Garantía</p>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-neutral-100 rounded-xl p-4">
              <h3 className="font-medium text-neutral-900 mb-3">Detalles del Producto</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-neutral-500">Marca</dt>
                  <dd className="text-neutral-900 font-medium">{product.brand.name}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Colorway</dt>
                  <dd className="text-neutral-900 font-medium">{product.colorway}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">SKU</dt>
                  <dd className="text-neutral-900 font-medium">{product.sku || '—'}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Retail</dt>
                  <dd className="text-neutral-900 font-medium">${product.retail_price_usd} USD</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Descripción
            </h2>
            <p className="text-neutral-600 leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
