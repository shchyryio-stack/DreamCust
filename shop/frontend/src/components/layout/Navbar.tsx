"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const { wishlist } = useWishlist();
  const { cartCount } = useCart();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      setToastMessage('Please log in to view your wishlist');
      setTimeout(() => {
        router.push('/login');
      }, 500);
    } else {
      router.push('/account?tab=wishlist');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-gray-200 shadow-sm transition-all">
      {toastMessage && (
        <div className="absolute top-24 right-4 bg-[#1A1A1A] text-white px-6 py-3 rounded-xl shadow-2xl font-semibold text-sm animate-fade-in-down z-50 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {toastMessage}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
              Dream<span className="text-[#1E6FE8]">Cust</span>
            </Link>
          </div>

          <div className="flex-1 max-w-lg px-8 hidden md:block">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-[#1E6FE8] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input 
                type="text" 
                placeholder="Search components..." 
                className="w-full bg-[#F5F6F8] border border-transparent rounded-full py-2.5 pl-12 pr-4 text-sm text-[#1A1A1A] placeholder-gray-400 focus:bg-white focus:border-[#1E6FE8]/30 focus:ring-4 focus:ring-[#1E6FE8]/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center space-x-6 font-medium text-sm">
              <Link href="/products" className="text-gray-600 hover:text-[#1E6FE8] transition-colors">Shop</Link>
              <Link href="/configurator" className="text-gray-600 hover:text-[#1E6FE8] transition-colors">PC Builder</Link>
            </div>
            
            <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
              <button onClick={handleWishlistClick} className="relative text-gray-400 hover:text-[#1E6FE8] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {user && wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <Link href="/cart" className="relative text-gray-400 hover:text-[#1E6FE8] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" /></svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              {user ? (
                <Link href="/account" className="ml-2 flex items-center gap-2 bg-gray-50 border border-gray-200 hover:border-[#1E6FE8]/50 hover:bg-white rounded-full p-1 pr-4 transition-all cursor-pointer shadow-sm">
                  <div className="w-8 h-8 bg-gradient-to-tr from-[#1E6FE8] to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-[#1A1A1A] max-w-[100px] truncate hidden sm:block">
                    {user.name || user.email.split('@')[0]}
                  </span>
                </Link>
              ) : (
                <Link href="/login" className="ml-2 bg-[#1E6FE8] hover:bg-[#1557BE] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-[0_4px_14px_rgba(30,111,232,0.39)] hover:shadow-[0_6px_20px_rgba(30,111,232,0.23)] hover:-translate-y-0.5">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
