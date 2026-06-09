"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrders, cancelOrder } from '@/services/api';
import { resolveImageUrl, handleImageError } from '@/utils/productImage';

export default function OrderHistoryTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const executeCancel = async (orderId: string) => {
    setCancellingId(orderId);
    setConfirmCancelId(null);
    try {
      await cancelOrder(orderId);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
      showNotification('Order cancelled successfully');
    } catch (err: any) {
      showNotification(err.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showNotification('Tracking number copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusDetails = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'pending':
      case 'new':
        return {
          label: 'Pending',
          classes: 'bg-amber-50 text-amber-700 border-amber-200/60',
        };
      case 'in_processing':
        return {
          label: 'In Processing',
          classes: 'bg-blue-50 text-blue-700 border-blue-200/60',
        };
      case 'shipped':
        return {
          label: 'Awaiting Shipment',
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
        };
      case 'in_transit':
        return {
          label: 'In Transit',
          classes: 'bg-purple-50 text-purple-700 border-purple-200/60',
        };
      case 'delivered':
      case 'received':
        return {
          label: 'Delivered',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          classes: 'bg-rose-50 text-rose-700 border-rose-200/60',
        };
      case 'refused':
        return {
          label: 'Refused',
          classes: 'bg-red-50 text-red-700 border-red-200/60',
        };
      default:
        return {
          label: status,
          classes: 'bg-gray-50 text-gray-700 border-gray-200/60',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold text-sm tracking-wide animate-pulse">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-2xl z-50 flex items-center gap-2.5 border border-white/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order History</h2>
          <p className="text-gray-500 text-sm mt-1">Track details and shipping updates for your orders</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-200/80 flex flex-col items-center max-w-2xl mx-auto px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm">📦</div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">No orders placed yet</h3>
          <p className="text-gray-500 mb-8 font-medium text-sm leading-relaxed">
            It looks like you haven't ordered any custom PC parts or components yet. Build your dream setup today!
          </p>
          <Link href="/products" className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md shadow-blue-200 hover:shadow-lg">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const statusDetail = getStatusDetails(order.status);
            const deliveryType = order.delivery?.type || order.addressId?.deliveryType || 'branch';
            
            // Show tracking/progress bar if status is shipped, in_transit, delivered, or received
            const showProgress = ['shipped', 'in_transit', 'delivered', 'received'].includes(order.status?.toLowerCase());
            
            let thirdStepLabel = 'At post office';
            if (deliveryType === 'courier') {
              thirdStepLabel = 'With courier, expect call';
            } else if (deliveryType === 'locker') {
              thirdStepLabel = 'In parcel locker';
            }

            const steps = [
              { label: 'Awaiting Shipment', key: 'shipped' },
              { label: 'In Transit', key: 'in_transit' },
              { label: thirdStepLabel, key: 'delivered' }
            ];

            let activeStepIndex = -1;
            const currentStatus = order.status?.toLowerCase();
            if (currentStatus === 'shipped') activeStepIndex = 0;
            else if (currentStatus === 'in_transit') activeStepIndex = 1;
            else if (['delivered', 'received'].includes(currentStatus)) activeStepIndex = 2;

            return (
              <div key={order._id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200/80 transition-all duration-300 overflow-hidden flex flex-col lg:flex-row">
                
                {/* Main section: items, details, tracking */}
                <div className="flex-1 p-6 md:p-8 space-y-6 flex flex-col justify-between">
                  <div>
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Order #{order._id.slice(-8)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusDetail.classes}`}>
                            {statusDetail.label}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 mt-1">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Items list */}
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ordered Items</p>
                      <div className="divide-y divide-gray-100">
                        {order.items.map((item: any) => {
                          const qty = item.qty || item.quantity || 1;
                          const subtotal = item.price * qty;
                          return (
                            <div key={item.productId} className="flex justify-between items-center text-sm gap-4 py-3 first:pt-0 last:pb-0">
                              {/* Left: Image & Name */}
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <img
                                  src={resolveImageUrl(item.image)}
                                  alt={item.name}
                                  onError={handleImageError}
                                  className="w-14 h-14 rounded-2xl object-contain border border-gray-100 bg-gray-50/60 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-extrabold text-gray-900 truncate max-w-[150px] sm:max-w-[280px]" title={item.name}>
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-gray-400 font-semibold mt-0.5">
                                    ₴{item.price.toFixed(2)} each
                                  </p>
                                  {item.isCustomBuild && item.components && (
                                    <div className="mt-2.5">
                                      <details className="group/details">
                                        <summary className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-950 cursor-pointer select-none">
                                          <span>Склад ПК ({item.components.length} комп. {item.services?.length ? `+ ${item.services.length} посл.` : ''})</span>
                                          <svg className="w-3.5 h-3.5 transition-transform group-open/details:rotate-180 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </summary>
                                        <div className="mt-2 pl-3 border-l border-blue-500 space-y-2 text-[11px] text-gray-500 max-w-[160px] sm:max-w-xs md:max-w-md text-left">
                                          {item.components.map((comp: any) => (
                                            <div key={comp.productId} className="flex justify-between items-center gap-3">
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="bg-blue-50 text-blue-600 px-1 py-0.2 rounded text-[8px] font-extrabold uppercase shrink-0">{comp.category}</span>
                                                <span className="font-medium truncate">{comp.name}</span>
                                              </div>
                                              <span className="font-bold text-gray-900 shrink-0">₴{comp.price.toFixed(2)}</span>
                                            </div>
                                          ))}
                                          {item.services && item.services.length > 0 && (
                                            <div className="mt-1.5 pt-1.5 border-t border-dashed border-gray-200">
                                              <div className="text-[9px] font-black text-gray-400 uppercase mb-1">Додаткові послуги:</div>
                                              {item.services.map((svc: any) => (
                                                <div key={svc.id || svc.productId} className="flex justify-between items-center gap-3">
                                                  <span className="font-medium truncate">{svc.name}</span>
                                                  <span className="font-bold text-gray-900 shrink-0">₴{svc.price.toFixed(2)}</span>
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

                              {/* Middle: Quantity */}
                              <div className="text-center px-4 shrink-0">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Qty</p>
                                <span className="bg-gray-50 text-gray-800 text-xs px-3 py-1.5 rounded-xl font-extrabold font-mono border border-gray-200/50">
                                  {qty}
                                </span>
                              </div>

                              {/* Right: Subtotal Price */}
                              <div className="text-right shrink-0">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Total</p>
                                <span className="font-mono font-extrabold text-gray-950 text-sm">
                                  ₴{subtotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar and TTN section */}
                  {showProgress && (
                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-6">
                      
                      {/* Tracking / TTN Box */}
                      {order.ttn && (
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nova Poshta Waybill (TTN)</p>
                              <p className="font-mono text-sm font-bold text-gray-900">{order.ttn}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(order.ttn, order._id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-4 py-2.5 rounded-xl transition-all"
                          >
                            {copiedId === order._id ? (
                              <>
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                <span className="text-emerald-600 font-extrabold">Copied</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                <span>Copy Number</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* 3-Step Progress Visual */}
                      <div className="space-y-4 pt-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shipment Status</p>
                        
                        <div className="relative flex items-center justify-between w-full px-4 sm:px-12 py-4">
                          {/* Background Line */}
                          <div className="absolute left-[12%] right-[12%] top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0"></div>
                          {/* Active progress highlight line */}
                          <div 
                            className="absolute left-[12%] top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500"
                            style={{ width: `${activeStepIndex === 0 ? 0 : activeStepIndex === 1 ? 38 : activeStepIndex === 2 ? 76 : 0}%` }}
                          ></div>

                          {steps.map((step, idx) => {
                            const isCompleted = idx < activeStepIndex;
                            const isActive = idx === activeStepIndex;
                            
                            return (
                              <div key={idx} className="relative z-10 flex flex-col items-center">
                                {/* Dot */}
                                <div 
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-sm
                                    ${isCompleted ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100' : 
                                      isActive ? 'bg-white border-blue-600 text-blue-600 scale-110 ring-4 ring-blue-50 font-black' : 
                                      'bg-white border-gray-200 text-gray-400'}`}
                                >
                                  {isCompleted ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  ) : (
                                    <span className="text-xs font-extrabold font-mono">{idx + 1}</span>
                                  )}
                                </div>
                                
                                {/* Label */}
                                <span 
                                  className={`absolute top-12 text-center text-[10px] sm:text-xs font-extrabold whitespace-nowrap max-w-[140px] transition-colors duration-300
                                    ${isActive ? 'text-blue-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="h-6"></div> {/* Spacer for absolute labels */}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side panel: Delivery, Payment, Total */}
                <div className="w-full lg:w-[320px] shrink-0 bg-gray-50/70 p-6 md:p-8 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col justify-between space-y-6">
                  <div className="space-y-5">
                    {/* Delivery Information */}
                    {order.delivery && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Details</p>
                        <p className="text-sm font-extrabold text-gray-900">{order.delivery.city}</p>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                          {order.delivery.type === 'courier' ? order.delivery.address : order.delivery.warehouse}
                        </p>
                      </div>
                    )}
                    
                    {/* Payment Information */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method</p>
                      <p className="text-sm font-extrabold text-gray-900 capitalize font-mono text-xs">
                        {order.paymentMethod === 'card' ? 'Online Card Payment' : order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {/* Payment & Action section */}
                  <div className="pt-4 border-t border-gray-200/70 space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-gray-400">Total Price</span>
                      <span className="text-3xl font-black text-blue-600 font-mono">
                        ₴{order.totalPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Cancel Order UI */}
                    {order.status === 'pending' && (
                      <div className="pt-2">
                        {confirmCancelId === order._id ? (
                          <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100/50 animate-in fade-in zoom-in-95 duration-200 text-center">
                            <p className="text-xs text-rose-800 font-extrabold mb-2.5">Cancel this order?</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setConfirmCancelId(null)}
                                className="flex-1 py-2 text-xs font-bold text-gray-600 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                              >
                                Keep Order
                              </button>
                              <button 
                                onClick={() => executeCancel(order._id)}
                                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-sm shadow-rose-100"
                              >
                                Yes, Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmCancelId(order._id)}
                            disabled={cancellingId === order._id}
                            className="w-full py-3 text-sm font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
