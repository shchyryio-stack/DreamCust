"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export default function AddToCartButton({ 
  product, 
  disabled,
  price,
  name,
  image,
  slug,
  productId
}: { 
  product?: any; 
  disabled?: boolean;
  price?: number;
  name?: string;
  image?: string;
  slug?: string;
  productId?: string;
}) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    if (disabled) return;

    const finalProductId = productId || product?._id || product?.id || '';
    const finalName = name || product?.title || product?.name || '';
    const finalPrice = price ?? product?.price ?? product?.pricing?.price ?? 0;
    const finalImage = image || product?.images?.[0] || '';
    const finalSlug = slug || product?.slug || '';

    addToCart({
      productId: finalProductId,
      name: finalName,
      price: finalPrice,
      image: finalImage,
      slug: finalSlug,
    }, 1);

    showToast(`${finalName} added to cart!`, 'success');
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <button 
      onClick={handleAdd}
      disabled={disabled}
      className={`w-full h-12 bg-[#0B8F5A] hover:bg-[#09784B] text-white rounded-xl font-bold text-sm transition-colors duration-200 flex items-center justify-center gap-2 ${
        disabled ? 'opacity-50 bg-gray-300 cursor-not-allowed' : ''
      }`}
    >
      {disabled ? 'Out of Stock' : isAdded ? 'Added to Cart' : 'Add to Cart'}
    </button>
  );
}
