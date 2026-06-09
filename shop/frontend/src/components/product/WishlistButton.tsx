"use client";
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/context/ToastContext';
import { Heart } from 'lucide-react';

export default function WishlistButton({ productId }: { productId: string }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const isLiked = isInWishlist(productId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(productId);
    showToast(isLiked ? 'Removed from wishlist' : 'Added to wishlist', 'info');
  };

  return (
    <button 
      onClick={handleToggle}
      className={`py-3.5 px-4 rounded-2xl font-bold text-sm transition-colors duration-200 flex items-center justify-center gap-2 border group ${
        isLiked 
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100/80 hover:border-red-300' 
          : 'border-gray-200 bg-white text-[#1A1A1A] hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      <Heart 
        className={`w-4 h-4 transition-colors duration-200 ${
          isLiked 
            ? 'fill-red-600 text-red-600' 
            : 'text-gray-400 group-hover:text-gray-600'
        }`}
      />
      {isLiked ? 'Saved' : 'Wishlist'}
    </button>
  );
}
