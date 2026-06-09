"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadWishlist = async () => {
      const token = localStorage.getItem('token');
      const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      
      if (token) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          
          if (localWishlist.length > 0) {
            await fetch(`${apiUrl}/wishlist/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ productIds: localWishlist })
            });
            localStorage.removeItem('wishlist');
          }

          const res = await fetch(`${apiUrl}/wishlist`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            const ids = data.map((item: any) => typeof item === 'string' ? item : item._id);
            setWishlist(ids);
          }
        } catch (error) {
          console.error('Failed to load wishlist', error);
          setWishlist(localWishlist);
        }
      } else {
        setWishlist(localWishlist);
      }
      setIsLoaded(true);
    };

    loadWishlist();
  }, []);

  const toggleWishlist = async (productId: string) => {
    const wasInWishlist = wishlist.includes(productId);
    const updatedWishlist = wasInWishlist 
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
      
    setWishlist(updatedWishlist); // Optimistic update
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/wishlist/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ productId })
        });
        
        if (!res.ok) throw new Error('API Error');
        
      } catch (error) {
        setWishlist(wishlist); // Rollback
        console.error('Failed to toggle wishlist on server');
      }
    } else {
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
