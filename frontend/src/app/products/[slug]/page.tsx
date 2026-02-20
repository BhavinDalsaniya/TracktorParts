import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductImageGallery } from '@/components/ProductImageGallery';
import { WhatsAppOrderButton } from '@/components/WhatsAppButton';
import { api } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { gu } from '@/config/constants';
import type { Product } from '@/types';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

interface ProductDetailResponse {
  data: {
    product: Product;
  };
}

async function getProduct(slug: string) {
  try {
    const response = await api.get<ProductDetailResponse>(`/api/products/${slug}`);
    return response.data.product;
  } catch {
    return null;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100
      )
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack />

      <main className="pb-32">
        {/* Image Gallery */}
        <ProductImageGallery images={product.images} name={product.nameGu} />

        {/* Product Info */}
        <div className="px-4 py-4">
          {/* Name */}
          <h1 className="text-2xl font-bold text-gray-900">
            {product.nameGu || product.name}
          </h1>

          {/* SKU */}
          <p className="mt-1 text-sm text-gray-500">SKU: {product.sku}</p>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary-600">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
                <span className="rounded-lg bg-accent-500 px-3 py-1 text-base font-bold text-white">
                  {discountPercentage}% {gu.off}
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-3">
            {product.isActive && product.stock > 0 ? (
              <p className="flex items-center gap-2 text-base font-medium text-green-600">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                {gu.inStock} ({product.stock} પીસ)
              </p>
            ) : (
              <p className="flex items-center gap-2 text-base font-medium text-red-600">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                {gu.outOfStock}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mt-6 rounded-2xl bg-white p-4">
            <h2 className="text-lg font-bold text-gray-900">{gu.description}</h2>
            <p className="mt-2 text-base text-gray-700 leading-relaxed">
              {product.descriptionGu || product.description}
            </p>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <h2 className="text-lg font-bold text-gray-900">{gu.specifications}</h2>
              <dl className="mt-3 space-y-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-gray-100 pb-2 last:border-0">
                    <dt className="text-base text-gray-600">{key}</dt>
                    <dd className="text-base font-medium text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Compatibility */}
          {product.compatibility && product.compatibility.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <h2 className="text-lg font-bold text-gray-900">{gu.compatibility}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.compatibility.map((brand) => (
                  <span
                    key={brand}
                    className="rounded-xl bg-primary-50 px-4 py-2 text-base font-medium text-primary-700"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
        <div className="px-4 py-3 space-y-2">
          <AddToCartButton product={product} />
          <WhatsAppOrderButton
            productInfo={{
              name: product.nameGu || product.name,
              id: product.id,
              price: product.price,
            }}
          />
        </div>
      </div>
    </div>
  );
}
