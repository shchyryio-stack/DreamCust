'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { ShipmentModal } from '@/components/orders/ShipmentModal';
import type { ShipmentFormData } from '@/components/orders/ShipmentModal';
import { Search, RefreshCw, ShoppingCart, Clock } from 'lucide-react';
import api from '@/utils/api';
import { useToast } from '@/context/ToastContext';

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_processing' | 'shipped' | 'in_transit' | 'received' | 'refused'>('all');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);


  // Shipment Modal State
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [shipmentOrder, setShipmentOrder] = useState<any>(null);
  const [isShipping, setIsShipping] = useState(false);

  // Print iframe ref
  const printIframeRef = useRef<HTMLIFrameElement>(null);


  const fetchOrders = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      showToast(error.response?.data?.message || 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Setup auto-refresh every 30 seconds
  useEffect(() => {
    setMounted(true);
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle order acceptance — just changes status to in_processing (no TTN)
  const handleAccept = async (orderId: string) => {
    setAcceptingId(orderId);
    try {
      await api.post(`/orders/${orderId}/accept`);
      showToast('Order accepted — ready for shipment processing', 'success');

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, status: 'in_processing' }
            : order
        )
      );

      fetchOrders();
    } catch (error: any) {
      console.error('Error accepting order:', error);
      showToast(error.response?.data?.message || 'Failed to accept order', 'error');
    } finally {
      setAcceptingId(null);
    }
  };


  // Open shipment modal
  const handleOpenShipment = (order: any) => {
    setShipmentOrder(order);
    setShipmentOpen(true);
  };

  // Handle create shipment (called from ShipmentModal)
  const handleCreateShipment = async (orderId: string, formData: ShipmentFormData) => {
    setIsShipping(true);
    try {
      const { data } = await api.post(`/orders/${orderId}/ship`, formData);
      showToast(`Shipment created! TTN: ${data.ttn}`, 'success');

      setShipmentOpen(false);
      setShipmentOrder(null);

      // Update order in state locally
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, status: 'shipped', ttn: data.ttn, ttnRef: data.ttnRef }
            : order
        )
      );

      // Try to print waybill automatically
      if (data.printUrl) {
        triggerPrint(data.printUrl);
      }

      fetchOrders();
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      showToast(error.response?.data?.message || 'Failed to create shipment', 'error');
    } finally {
      setIsShipping(false);
    }
  };

  // Handle print waybill for an order
  const handlePrintWaybill = async (order: any) => {
    try {
      const { data } = await api.get(`/orders/${order._id}/print-url`);
      if (data.printUrl) {
        triggerPrint(data.printUrl);
        showToast('Print dialog opened', 'info');
      }
    } catch (error: any) {
      console.error('Error getting print URL:', error);
      showToast(error.response?.data?.message || 'Failed to get print URL', 'error');
    }
  };

  // Trigger print via hidden iframe
  const triggerPrint = (url: string) => {
    try {
      const iframe = printIframeRef.current;
      if (iframe) {
        iframe.src = url;
        iframe.onload = () => {
          try {
            iframe.contentWindow?.print();
          } catch (e) {
            // If cross-origin blocks print, open in new tab
            window.open(url, '_blank');
          }
        };
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // Helper mapping tab key to order statuses
  const matchStatus = (orderStatus: string, tab: typeof activeTab) => {
    if (tab === 'all') return true;
    if (tab === 'new') return orderStatus === 'new' || orderStatus === 'pending';
    return orderStatus === tab;
  };

  // Filter orders based on active tab and search term
  const filteredOrders = orders.filter((order) => {
    const statusMatches = matchStatus(order.status, activeTab);

    if (!statusMatches) return false;

    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    const idMatches = order._id?.slice(-8).toLowerCase().includes(term) || order._id?.toLowerCase().includes(term);
    const address = order.address || {};
    const customerNameMatches =
      `${address.firstName || ''} ${address.lastName || ''}`.toLowerCase().includes(term);
    const phoneMatches = (address.phone || '').includes(term);

    return idMatches || customerNameMatches || phoneMatches;
  });

  // Calculate counts for stats and tabs
  const getCount = (tab: typeof activeTab) => {
    return orders.filter((order) => matchStatus(order.status, tab)).length;
  };

  const newOrdersCount = getCount('new');
  const totalOrdersCount = orders.length;

  const tabs: { key: typeof activeTab; label: string; count: number }[] = [
    { key: 'all', label: 'All Orders', count: totalOrdersCount },
    { key: 'new', label: 'New', count: newOrdersCount },
    { key: 'in_processing', label: 'In Processing', count: getCount('in_processing') },
    { key: 'shipped', label: 'Awaiting Shipment', count: getCount('shipped') },
    { key: 'in_transit', label: 'In Transit', count: getCount('in_transit') },
    { key: 'received', label: 'Received', count: getCount('received') },
    { key: 'refused', label: 'Refused', count: getCount('refused') },
  ];

  const formatLastUpdatedTime = () => {
    return lastUpdated.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6 relative min-h-screen pb-16">
      {/* Hidden iframe for printing */}
      <iframe
        ref={printIframeRef}
        className="hidden"
        title="print-frame"
      />


      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Order Manager</h2>
          <p className="text-gray-500 mt-1">Process customer orders, generate Nova Poshta waybills, and track delivery status.</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2.5 flex items-center gap-3">
            <ShoppingCart size={18} className="text-[var(--color-primary)]" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Orders</p>
              <p className="text-sm font-bold text-gray-900">{totalOrdersCount}</p>
            </div>
          </Card>
          <Card className="px-4 py-2.5 flex items-center gap-3 relative overflow-hidden">
            {newOrdersCount > 0 && (
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 animate-pulse rounded-bl-lg" />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newOrdersCount > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <ShoppingCart size={16} className={newOrdersCount > 0 ? 'text-amber-600' : 'text-gray-400'} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">New Orders</p>
              <p className={`text-sm font-bold ${newOrdersCount > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{newOrdersCount}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Orders Table Container */}
      <Card className="overflow-hidden">
        {/* Status filter tabs inside Card header */}
        <div className="border-b border-gray-100 bg-white px-4 pt-4">
          <div className="flex flex-wrap gap-6">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-4 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center gap-2 relative outline-none cursor-pointer
                    ${isActive
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 text-[var(--color-primary)]'
                      : tab.key === 'new' && tab.count > 0
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                  {tab.key === 'new' && tab.count > 0 && !isActive && (
                    <span className="absolute top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, customer name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all"
            />
          </div>

          {/* Sync indicator + Refresh button */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={12} />
              <span>Last updated: {formatLastUpdatedTime()}</span>
            </div>
            <Button
              variant="secondary"
              className="flex items-center gap-2 !py-2 !px-3.5 !rounded-xl"
              onClick={() => fetchOrders(true)}
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : (
          <OrdersTable
            orders={filteredOrders}
            onAccept={handleAccept}
            onShip={handleOpenShipment}
            onPrint={handlePrintWaybill}
            acceptingId={acceptingId}
            showTtn={activeTab !== 'new' && activeTab !== 'in_processing'}
          />
        )}
      </Card>

      {/* Shipment Processing Modal */}
      <ShipmentModal
        isOpen={shipmentOpen}
        onClose={() => { setShipmentOpen(false); setShipmentOrder(null); }}
        order={shipmentOrder}
        onSubmit={handleCreateShipment}
        isSubmitting={isShipping}
      />
    </div>
  );
}
