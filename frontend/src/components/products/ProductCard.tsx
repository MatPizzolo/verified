import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    colorway: string;
    image_url: string;
    retail_price_usd: number;
    lowest_ask_ars: number | null;
    brand: {
      name: string;
      logo_url: string;
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
        {/* Product Image */}
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-2">
            {product.brand.logo_url && (
              <Image
                src={product.brand.logo_url}
                alt={product.brand.name}
                width={20}
                height={20}
                className="object-contain"
              />
            )}
            <span className="text-xs font-medium text-gray-500 uppercase">
              {product.brand.name}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.name}
          </h3>

          {/* Colorway */}
          <p className="text-sm text-gray-600 mb-3">{product.colorway}</p>

          {/* Price */}
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-gray-500">Lowest Ask</p>
              {product.lowest_ask_ars ? (
                <p className="text-lg font-bold text-gray-900">
                  ${product.lowest_ask_ars.toLocaleString('es-AR')}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Sin ofertas</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Retail</p>
              <p className="text-sm text-gray-600">
                ${product.retail_price_usd}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
