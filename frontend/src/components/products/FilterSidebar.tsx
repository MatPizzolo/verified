'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface FilterSidebarProps {
  brands: Brand[];
}

export function FilterSidebar({ brands }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBrand = searchParams.get('brand');
  const currentSort = searchParams.get('sort') || 'featured';

  const handleBrandFilter = (brandSlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (brandSlug) {
      params.set('brand', brandSlug);
    } else {
      params.delete('brand');
    }
    
    router.push(`/products?${params.toString()}`);
  };

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      {/* Sort */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Ordenar por</h3>
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="featured">Destacados</option>
          <option value="newest">Más recientes</option>
          <option value="popular">Más populares</option>
          <option value="price_low">Precio: menor a mayor</option>
          <option value="price_high">Precio: mayor a menor</option>
        </select>
      </div>

      {/* Brand Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Marca</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleBrandFilter(null)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              !currentBrand
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todas las marcas
          </button>
          
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => handleBrandFilter(brand.slug)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                currentBrand === brand.slug
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(currentBrand || currentSort !== 'featured') && (
        <button
          onClick={() => router.push('/products')}
          className="w-full mt-6 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
