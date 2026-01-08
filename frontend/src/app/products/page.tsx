import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';

interface SearchParams {
  search?: string;
  brand?: string;
  sort?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('products')
    .select(`
      *,
      brand:brands(id, name, slug, logo_url),
      variants(
        id,
        size_eu,
        market_stats(lowest_ask_ars, highest_bid_ars)
      )
    `)
    .eq('active', true);

  // Apply search filter
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,colorway.ilike.%${params.search}%`);
  }

  // Apply brand filter
  if (params.brand) {
    const { data: brandData } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', params.brand)
      .single();
    
    if (brandData) {
      query = query.eq('brand_id', brandData.id);
    }
  }

  // Apply sorting
  switch (params.sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
      query = query.order('total_sales', { ascending: false });
      break;
    case 'price_low':
      query = query.order('retail_price_usd', { ascending: true });
      break;
    case 'price_high':
      query = query.order('retail_price_usd', { ascending: false });
      break;
    default:
      query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
  }

  // Get all brands for filter
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .order('name');

  // Calculate lowest ask for each product and map to Product type
  const productsWithStats = products?.map((product: any) => {
    const lowestAsk = product.variants
      ?.map((v: any) => v.market_stats?.[0]?.lowest_ask_ars)
      .filter((price: any) => price !== null)
      .sort((a: number, b: number) => a - b)[0];

    const highestBid = product.variants
      ?.map((v: any) => v.market_stats?.[0]?.highest_bid_ars)
      .filter((price: any) => price !== null)
      .sort((a: number, b: number) => b - a)[0];

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand?.name || 'Unknown',
      colorway: product.colorway || '',
      image_url: product.image_url,
      lowest_ask: lowestAsk || null,
      highest_bid: highestBid || null,
      last_sale: null,
      sizes_available: product.variants?.map((v: any) => v.size_eu) || [],
    };
  }) || [];

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Explorar Productos</h1>
          <p className="text-neutral-600 mt-2">Descubre las mejores zapatillas verificadas</p>
        </div>

        {/* Products Grid */}
        {productsWithStats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productsWithStats.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
