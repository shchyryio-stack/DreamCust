'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClientStatusBadge } from '@/components/clients/ClientStatusBadge';
import { Mail, Phone, Calendar, ShoppingBag, DollarSign, Star, Heart, MapPin, Ban, Trash2, ArrowLeft, Package } from 'lucide-react';
import api from '@/utils/api';

export default function ClientProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const [clientRes, ordersRes, addrRes, wishRes, revRes] = await Promise.all([
          api.get(`/clients/${id}`),
          api.get(`/clients/orders/${id}`),
          api.get(`/clients/addresses/${id}`),
          api.get(`/clients/wishlist/${id}`),
          api.get(`/clients/reviews/${id}`)
        ]);
        
        setClient(clientRes.data);
        setOrders(ordersRes.data);
        setAddresses(addrRes.data);
        setWishlist(wishRes.data);
        setReviews(revRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchClientData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/clients/${id}`, { status: newStatus });
      setClient({ ...client, status: newStatus });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!client) return <div>Client not found</div>;

  const totalSpent = orders.reduce((acc: number, curr: any) => acc + (curr.totalPrice || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Client Profile</h2>
            <p className="text-gray-500 text-sm mt-1">Detailed overview and analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => handleStatusChange(client.status === 'Blocked' ? 'Active' : 'Blocked')} className={client.status === 'Blocked' ? 'text-green-600' : 'text-yellow-600'}>
            <Ban size={16} className="mr-2" />
            {client.status === 'Blocked' ? 'Unblock Client' : 'Block Client'}
          </Button>
          <Button variant="danger">
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </Button>
        </div>
      </div>

      {/* 1. CLIENT HEADER CARD */}
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-primary)] to-purple-500 opacity-5 rounded-bl-full -mr-12 -mt-12 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-white shadow-md flex items-center justify-center text-[var(--color-primary)] font-bold text-3xl overflow-hidden shrink-0">
            {client.avatar ? (
              <img src={client.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              client.fullName ? client.fullName.charAt(0) : client.email.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900">{client.fullName || 'No Name Provided'}</h3>
              <ClientStatusBadge status={client.status} />
              {client.role === 'admin' && <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-900 text-white">ADMIN</span>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span>{client.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span>Joined {new Date(client.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">@</span>
                <span>{client.username || client._id.slice(-6)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. CLIENT STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-white to-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[var(--color-primary)] flex items-center justify-center shadow-sm">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-white to-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Total Spent</p>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-white to-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Average Order Value</p>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
              <Star size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${avgOrderValue.toFixed(2)}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-white to-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Wishlist Items</p>
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-sm">
              <Heart size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{wishlist.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 3. ORDERS SECTION */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Order History</h3>
            </div>
            {orders.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {orders.map((order: any) => (
                  <div key={order._id} className="p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">#{order._id.slice(-6).toUpperCase()}</span>
                        <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900">${order.totalPrice}</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">{order.status.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center p-1" title={item.name}>
                          {item.image ? <img src={item.image} alt="" className="max-w-full max-h-full object-contain" /> : <Package size={16} className="text-gray-300"/>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">No orders found.</div>
            )}
          </Card>

          {/* 5. WISHLIST SECTION */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Wishlist</h3>
            </div>
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                {wishlist.map((item: any) => (
                  <div key={item._id} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white">
                    <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 p-1">
                      {item.images && item.images[0] ? <img src={item.images[0]} alt="" className="max-w-full max-h-full object-contain" /> : null}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">{item.name || item.title}</p>
                      <p className="text-sm text-gray-500 mt-1">${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">Wishlist is empty.</div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* 4. ADDRESSES SECTION */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Addresses</h3>
            </div>
            {addresses.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {addresses.map((addr: any) => (
                  <div key={addr._id} className="p-6 relative">
                    {addr.isDefault && <span className="absolute top-6 right-6 px-2 py-0.5 bg-blue-50 text-[var(--color-primary)] text-xs rounded-md font-medium">Default</span>}
                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-medium">
                      <MapPin size={16} className="text-gray-400" />
                      {addr.type.toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-600">{addr.city}, {addr.street} {addr.house}</p>
                    <p className="text-sm text-gray-500 mt-2">{addr.fullName} • {addr.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">No addresses saved.</div>
            )}
          </Card>

          {/* 7. REVIEWS SECTION */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Recent Reviews</h3>
            </div>
            {reviews.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {reviews.map((rev: any) => (
                  <div key={rev._id} className="p-6">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{rev.productName}</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{rev.comment}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(rev.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">No reviews written.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
