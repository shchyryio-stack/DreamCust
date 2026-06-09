"use client";
import { useEffect, useState } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/product/ProductCard';

export default function WishlistTab() {
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/products`);
        const data = await res.json();
        const productsList = Array.isArray(data.products) 
          ? data.products 
          : Array.isArray(data) 
            ? data 
            : [];
        
        const wishlistProducts = productsList.filter((p: any) => wishlist.includes(p._id));
        setProducts(wishlistProducts);
      } catch (error) {
        console.error('Failed to fetch wishlist products', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist]);

  const IconWishlist = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-6">Your Wishlist ({wishlist.length})</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-72 bg-gray-100 animate-pulse rounded-3xl"></div>)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[20px] p-12 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner text-red-300">
            <IconWishlist />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 font-medium">Save items you like to review them later.</p>
        </div>
      )}
    </div>
  );
}
