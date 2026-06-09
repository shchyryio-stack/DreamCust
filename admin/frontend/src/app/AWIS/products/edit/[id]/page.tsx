'use client';

import { useEffect, useState } from 'react';
import { ProductForm } from '@/components/products/ProductForm';
import api from '@/utils/api';
import { useParams } from 'next/navigation';

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="max-w-[1400px] mx-auto">
      <ProductForm initialData={product} isEdit={true} />
    </div>
  );
}
