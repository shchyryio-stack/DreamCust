"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/services/api';
import AddressForm from '@/components/account/AddressForm';
import AddressCard from '@/components/account/AddressCard';
import { useToast } from '@/context/ToastContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { showToast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Sort and Deduplicate Addresses (Sanity check)
  const uniqueAddresses = [...addresses].filter((v, i, a) => a.findIndex(t => (t._id || t.id) === (v._id || v.id)) === i);
  const sortedAddresses = uniqueAddresses.sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const fetchAddresses = async (currentToken?: string | null) => {
    try {
      const token = currentToken || localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        
        // Preserve selected address if it still exists, otherwise fallback to default or first
        setSelectedAddressId((prevId) => {
          if (prevId) {
            const stillExists = data.find((a: any) => (a._id || a.id) === prevId);
            if (stillExists) return prevId;
          }
          const defaultAddr = data.find((a: any) => a.isDefault);
          if (defaultAddr) return (defaultAddr._id || defaultAddr.id);
          return data.length > 0 ? (data[0]._id || data[0].id) : null;
        });
      }
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setIsAddressesLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }
    if (cart.length === 0) {
      router.push('/cart');
      return;
    }
    fetchAddresses(token);
  }, [cart.length, router]);

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAddresses(token);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/addresses/${id}/default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchAddresses(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAddress = async (savedAddress: any) => {
    setIsModalOpen(false);
    setEditingAddress(null);
    await fetchAddresses();
  };

  const handlePlaceOrder = async () => {
    // Validate
    if (!selectedAddressId) {
      setError('Please select delivery address');
      showToast('Please select delivery address', 'warning');
      return;
    }
    if (!paymentMethod) {
      setError('Please select payment method');
      showToast('Please select payment method', 'warning');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await createOrder({
        items: cart,
        addressId: selectedAddressId,
        paymentMethod
      });

      setOrderSuccess(true);
      showToast('Order placed successfully!', 'success');
      clearCart();
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
      showToast(err.message || 'Failed to place order', 'error');
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !orderSuccess) return null; // Let useEffect redirect

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-[#1A1A1A] mb-8">Checkout</h1>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-8 font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Flow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 2: Delivery */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-sm">1</span>
                Delivery Address
              </h2>
              {!isAddressesLoading && addresses.length > 0 && (
                <button 
                  onClick={() => { setEditingAddress(null); setIsModalOpen(true); }}
                  className="text-sm font-bold text-[#1E6FE8] hover:text-[#1557BE] transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl"
                >
                  + Add Address
                </button>
              )}
            </div>

            {isAddressesLoading ? (
              <div className="py-12 text-center text-gray-400 font-bold animate-pulse">Loading addresses...</div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 animate-fade-in">
                <div className="text-4xl mb-3">📍</div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No delivery address</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">You need to add an address to continue</p>
                <button onClick={() => { setEditingAddress(null); setIsModalOpen(true); }} className="bg-[#1A1A1A] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md">
                  Add Address
                </button>
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['all', 'courier', 'branch', 'locker'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-[#1A1A1A] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                      {f === 'nova-poshta' ? 'Nova Poshta' : f === 'all' ? 'All' : f}
                    </button>
                  ))}
                </div>

                {/* Address List */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {sortedAddresses
                    .filter(addr => filter === 'all' ? true : addr.deliveryType === filter)
                    .map(addr => (
                      <AddressCard
                        key={addr._id || addr.id}
                        address={addr}
                        isSelected={selectedAddressId === (addr._id || addr.id)}
                        onSelect={() => setSelectedAddressId(addr._id || addr.id)}
                        onEdit={(e) => { e.stopPropagation(); setEditingAddress(addr); setIsModalOpen(true); }}
                        onDelete={(e) => handleDeleteAddress(addr._id || addr.id, e)}
                        onSetDefault={(e) => handleSetDefault(addr._id || addr.id, e)}
                        showRadio={true}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Payment */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-sm">2</span>
              Payment Method
            </h2>

            <div className="space-y-4">
              <label className={`flex items-center justify-between border-2 p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-[#1E6FE8] bg-blue-50/50' : 'border-gray-200 hover:border-[#1E6FE8]/50'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 text-[#1E6FE8]" />
                  <span className="font-bold text-[#1A1A1A]">Оплата карткою</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-8 h-5 bg-blue-100 rounded"></div>
                  <div className="w-8 h-5 bg-orange-100 rounded"></div>
                </div>
              </label>

              <label className={`flex items-center justify-between border-2 p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-[#1E6FE8] bg-blue-50/50' : 'border-gray-200 hover:border-[#1E6FE8]/50'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="w-4 h-4 text-[#1E6FE8]" />
                  <span className="font-bold text-[#1A1A1A]">Готівка</span>
                </div>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Оплата при отриманні</span>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary */}
        <div>
          <div className="bg-[#1A1A1A] text-white p-8 rounded-[32px] shadow-xl sticky top-28">
            <h2 className="text-xl font-extrabold mb-6">Order Summary</h2>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold animate-fade-in">
                {error}
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.productId} className="space-y-2 border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start text-sm">
                    <div className="flex gap-3">
                      <span className="font-bold text-gray-400">{item.quantity}x</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold">₴{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.isCustomBuild && item.components && (
                    <div className="pl-7 space-y-1.5 text-xs text-gray-400">
                      {item.components.map((comp) => (
                        <div key={comp.productId} className="flex justify-between gap-4">
                          <span className="truncate max-w-[160px] text-gray-400">{comp.name}</span>
                          <span className="text-gray-300 font-mono">₴{comp.price.toFixed(2)}</span>
                        </div>
                      ))}
                      {item.services && item.services.length > 0 && (
                        <div className="pt-1.5 mt-1.5 border-t border-gray-800">
                          <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Додаткові послуги:</div>
                          {item.services.map((svc) => (
                            <div key={svc.id} className="flex justify-between gap-4">
                              <span className="truncate max-w-[160px] text-gray-400">{svc.name}</span>
                              <span className="text-gray-300 font-mono">₴{svc.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700/50 pt-6 space-y-4 mb-8 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>₴{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Estimated Tax (10%)</span>
                <span>₴{(cartTotal * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-green-400">Free</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-lg font-bold">Total</span>
              <span className="text-3xl font-extrabold text-[#1E6FE8]">
                ₴{(cartTotal * 1.1).toFixed(2)}
              </span>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full bg-[#1E6FE8] hover:bg-[#1557BE] text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? 'Placing order...' : 'Place Order'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4 font-medium flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Secure & Encrypted
            </p>
          </div>
        </div>

      </div>

      <AddressForm 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAddress(null); }}
        onSave={handleSaveAddress}
        addressToEdit={editingAddress}
      />

      {orderSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in"></div>
          <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-2xl relative z-10 w-full max-w-md text-center transform animate-[scaleSpring_0.5s_ease-out_forwards]">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" strokeDasharray="24" strokeDashoffset="24" className="animate-[strokeDraw_0.5s_0.2s_ease-in-out_forwards]" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-[#1A1A1A] mb-3">Order placed successfully!</h2>
            <p className="text-gray-500 font-medium mb-8">Your order is being processed</p>
            <button 
              onClick={() => router.push('/account?tab=orders')}
              className="w-full bg-[#1A1A1A] hover:bg-black text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Go to Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
