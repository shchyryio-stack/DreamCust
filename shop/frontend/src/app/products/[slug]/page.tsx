import { fetchProductBySlug } from '@/services/api';
import ProductDetailClient from '@/components/product/ProductDetailClient';

export default async function ProductDetailPage(props: any) {
  const params = await props.params;
  
  let product;
  try {
    product = await fetchProductBySlug(params.slug);
  } catch (err) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-12 max-w-md mx-auto">
          <h1 className="text-4xl text-[#1A1A1A] font-extrabold mb-4">Not Found.</h1>
          <p className="text-gray-500 font-medium">The hardware you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}
