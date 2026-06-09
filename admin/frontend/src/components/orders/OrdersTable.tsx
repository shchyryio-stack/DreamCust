'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Truck, Package, Printer } from 'lucide-react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { Button } from '@/components/ui/Button';

interface OrdersTableProps {
  orders: any[];
  onAccept: (orderId: string) => void;
  onShip: (order: any) => void;
  onPrint: (order: any) => void;
  acceptingId: string | null;
  showTtn?: boolean;
}

export const OrdersTable = ({ orders, onAccept, onShip, onPrint, acceptingId, showTtn = true }: OrdersTableProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
            <th className="py-4 px-4 font-medium w-8">#</th>
            <th className="py-4 px-4 font-medium">Order</th>
            <th className="py-4 px-4 font-medium">Customer</th>
            <th className="py-4 px-4 font-medium">Delivery</th>
            <th className="py-4 px-4 font-medium">Total</th>
            <th className="py-4 px-4 font-medium">Status</th>
            {showTtn && <th className="py-4 px-4 font-medium">TTN</th>}
            <th className="py-4 px-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => {
            const isExpanded = expandedId === order._id;
            const address = order.address || {};

            return (
              <React.Fragment key={order._id}>
                <tr
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  onClick={() => toggleExpand(order._id)}
                >
                  <td className="py-4 px-4 text-sm text-gray-400">{index + 1}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 font-mono">
                          #{order._id?.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900">
                      {address.firstName || ''} {address.lastName || ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{address.phone || '—'}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{address.city || '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate" title={address.warehouseName || address.details || address.street || ''}>
                      {address.warehouseName || address.details || address.street || '—'}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {(order.totalPrice || 0).toLocaleString('uk-UA')} ₴
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <OrderStatusBadge status={order.status || 'pending'} />
                  </td>
                  {showTtn && (
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      {order.ttn ? (
                        <button
                          onClick={() => copyToClipboard(order.ttn, order._id)}
                          className="inline-flex items-center gap-1.5 text-sm font-mono text-gray-700 hover:text-[var(--color-primary)] transition-colors group/ttn"
                          title="Click to copy"
                        >
                          <span>{order.ttn}</span>
                          {copiedId === order._id ? (
                            <Check size={13} className="text-green-500" />
                          ) : (
                            <Copy size={13} className="text-gray-400 group-hover/ttn:text-[var(--color-primary)]" />
                          )}
                        </button>
                      ) : (
                        (order.status === 'new' || order.status === 'pending' || order.status === 'in_processing') ? null : (
                          <span className="text-sm text-gray-300">—</span>
                        )
                      )}
                    </td>
                  )}
                  <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* New / Pending → Accept */}
                      {(order.status === 'pending' || order.status === 'new') && (
                        <Button
                          variant="primary"
                          className="!px-3 !py-1.5 !text-xs !rounded-lg"
                          isLoading={acceptingId === order._id}
                          onClick={() => onAccept(order._id)}
                        >
                          Accept
                        </Button>
                      )}

                      {/* In Processing → Process Shipment button (opens modal) */}
                      {order.status === 'in_processing' && (
                        <Button
                          variant="primary"
                          className="!px-3 !py-1.5 !text-xs !rounded-lg gap-1.5"
                          onClick={() => onShip(order)}
                        >
                          <Package size={13} />
                          Process Shipment
                        </Button>
                      )}

                      {/* Shipped → Print Waybill */}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => onPrint(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Print waybill"
                        >
                          <Printer size={13} />
                          Print
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded row — order items */}
                {isExpanded && (
                  <tr className="bg-gray-50/30">
                    <td colSpan={showTtn ? 8 : 7} className="px-6 py-4">
                      <div className="ml-8">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Order Items
                        </p>
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-gray-100 text-xs text-gray-400">
                                <th className="py-2.5 px-4 font-medium">Product</th>
                                <th className="py-2.5 px-4 font-medium text-center">Qty</th>
                                <th className="py-2.5 px-4 font-medium text-right">Price</th>
                                <th className="py-2.5 px-4 font-medium text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(order.items || []).map((item: any, i: number) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0">
                                  <td className="py-2.5 px-4 text-sm text-gray-900">
                                    {item.product?.name || item.name || 'Unknown Product'}
                                  </td>
                                  <td className="py-2.5 px-4 text-sm text-gray-600 text-center">
                                    ×{item.qty || item.quantity || 1}
                                  </td>
                                  <td className="py-2.5 px-4 text-sm text-gray-600 text-right">
                                    {(item.price || 0).toLocaleString('uk-UA')} ₴
                                  </td>
                                  <td className="py-2.5 px-4 text-sm font-medium text-gray-900 text-right">
                                    {((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString('uk-UA')} ₴
                                  </td>
                                </tr>
                              ))}
                              {(!order.items || order.items.length === 0) && (
                                <tr>
                                  <td colSpan={4} className="py-4 text-center text-sm text-gray-400">
                                    No items in this order
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan={showTtn ? 8 : 7} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Truck size={20} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No orders found</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
