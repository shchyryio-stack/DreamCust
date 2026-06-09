"use client";
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { Heart, ShoppingCart } from 'lucide-react';
import { getProductImageUrl, handleImageError } from '@/utils/productImage';

export default function ProductCard({ product }: { product: any }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isLiked = isInWishlist(product._id);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const BASE_URL = API_URL.replace(/\/api$/, '');

  // Support both old and new schema during migration
  const title = product.title || product.name;
  const price = product.pricing?.price ?? product.price ?? 0;
  const imageUrl = getProductImageUrl(product);
  const brand = product.brand || product.category;

  const availableStock = product.computed?.totalQuantity ?? 0;
  const isOutOfStock = !(product.computed?.inStock ?? false);

  const onImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    handleImageError(e);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isOutOfStock) {
      addToCart({
        productId: product._id,
        name: title,
        price: price,
        image: imageUrl || '',
        slug: product.slug,
      });
    }
  };

  return (
    <div className={`group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 ${!isOutOfStock ? 'hover:border-blue-200 hover:shadow-lg' : 'opacity-80'} flex flex-col h-full`}>
      
      {/* Top Badges & Actions */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        {!isOutOfStock ? (
          <div className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-md">
            In stock
          </div>
        ) : (
          <div className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-md">
            Out of stock
          </div>
        )}
        <button 
          onClick={(e) => { e.preventDefault(); toggleWishlist(product._id); }}
          className={`p-1.5 transition-all duration-300 rounded-lg hover:bg-gray-50 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : 'fill-none'}`} />
        </button>
      </div>

      <Link href={`/products/${product.slug}`} className="flex flex-col h-full">
        {/* Product Image */}
        <div className="relative w-full h-48 bg-white mb-6 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={title} onError={onImageError} className="object-contain w-full h-full transform transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="text-6xl opacity-20 transform transition-transform duration-500 group-hover:scale-110">
              📦
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="flex flex-col flex-grow">
          {/* Rating */}
          {product.numReviews > 0 ? (
            <div className="flex items-center gap-1.5 text-sm mb-3">
              <svg className="w-4 h-4 text-orange-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-gray-900">{(product.rating || 0).toFixed(1)}</span>
              <span className="text-gray-400 font-medium">({product.numReviews})</span>
            </div>
          ) : (
            <div className="text-xs font-medium text-gray-400 mb-3">No reviews yet</div>
          )}
          
          {/* Title & Brand */}
          <h3 className="text-base font-extrabold text-[#1A1A1A] mb-1 line-clamp-2 leading-relaxed">{title}</h3>
          <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wide">{brand}</p>
          
          {/* Price & Add to Cart */}
          <div className="mt-auto pt-4 flex flex-col gap-4">
            <div className="text-xl font-black text-[#1A1A1A]">₴{price.toFixed(2)}</div>
            
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full h-12 bg-[#0B8F5A] hover:bg-[#09784B] text-white rounded-xl font-bold text-sm transition-colors duration-200 disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
