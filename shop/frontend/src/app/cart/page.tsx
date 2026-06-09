"use client";

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  const tax = cartTotal * 0.1; // 10% tax for example
  const finalTotal = cartTotal + tax;

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center text-center">
        <div className="text-8xl mb-8">🛒</div>
        <h1 className="text-4xl font-extrabold text-[#1A1A1A] mb-4">Your cart is empty</h1>
        <p className="text-gray-500 font-medium mb-8 text-lg">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/products" className="bg-[#1E6FE8] hover:bg-[#1557BE] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-[#1A1A1A] mb-10">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left Col: Cart Items */}
        <div className="flex-1 space-y-6">
          {cart.map((item) => (
            <div key={item.productId} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 group">
              {/* Image */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#F5F6F8] rounded-2xl flex-shrink-0 flex items-center justify-center text-4xl overflow-hidden relative">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply p-4" />
                ) : (
                  "📦"
                )}
              </div>
              
              {/* Details */}
              <div className="flex-1 text-center sm:text-left w-full">
                {item.isCustomBuild ? (
                  <span className="text-xl font-bold text-[#1A1A1A] block mb-2">
                    {item.name}
                  </span>
                ) : (
                  <Link href={`/products/${item.slug || item.productId}`} className="text-xl font-bold text-[#1A1A1A] hover:text-[#1E6FE8] transition-colors line-clamp-2 mb-2">
                    {item.name}
                  </Link>
                )}
                <div className="text-2xl font-extrabold text-[#1A1A1A] mb-4">
                  ₴{(item.price ?? 0).toFixed(2)}
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center sm:justify-start gap-6">
                  <div className="flex items-center bg-[#F5F6F8] rounded-xl p-1 border border-gray-200">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-gray-500 hover:bg-white hover:text-[#1A1A1A] hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-sm select-none">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-gray-500 hover:bg-white hover:text-[#1A1A1A] hover:shadow-sm transition-all"
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="text-sm font-bold text-red-500 hover:text-red-600 hover:underline transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Remove
                  </button>
                </div>

                {/* Nested build items list */}
                {item.isCustomBuild && item.components && (
                  <div className="mt-4 border-t border-gray-100 pt-4 text-left">
                    <details className="group/details">
                      <summary className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 cursor-pointer select-none">
                        <span>Склад ПК ({item.components.length} комп. {item.services?.length ? `+ ${item.services.length} посл.` : ''})</span>
                        <svg className="w-4 h-4 transition-transform group-open/details:rotate-180 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-3 pl-4 border-l-2 border-[#1E6FE8] space-y-2.5 text-xs text-gray-600">
                        {item.components.map((comp) => (
                          <div key={comp.productId} className="flex justify-between items-center py-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="bg-blue-50 text-[#1E6FE8] px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0">{comp.category}</span>
                              <span className="font-semibold text-gray-800 truncate">{comp.name}</span>
                            </div>
                            <span className="font-bold text-gray-900 shrink-0 ml-4">₴{comp.price.toFixed(2)}</span>
                          </div>
                        ))}
                        {item.services && item.services.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
                            <div className="text-[10px] font-black text-gray-400 uppercase mb-1.5">Додаткові послуги:</div>
                            {item.services.map((svc) => (
                              <div key={svc.id} className="flex justify-between items-center py-0.5">
                                <span className="font-semibold text-gray-800">{svc.name}</span>
                                <span className="font-bold text-gray-900 shrink-0 ml-4">₴{svc.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Col: Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm sticky top-28">
            <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-sm font-medium">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="text-[#1A1A1A]">₴{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax (10%)</span>
                <span className="text-[#1A1A1A]">₴{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-500">Free</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 mb-8 flex justify-between items-end">
              <span className="text-lg font-bold text-[#1A1A1A]">Total</span>
              <span className="text-4xl font-extrabold text-[#1A1A1A]">₴{finalTotal.toFixed(2)}</span>
            </div>

            <Link href="/checkout" className="w-full flex items-center justify-center bg-[#1A1A1A] hover:bg-black text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              Proceed to Checkout
            </Link>
            <p className="text-center text-xs text-gray-400 mt-4 font-medium flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Secure Checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
