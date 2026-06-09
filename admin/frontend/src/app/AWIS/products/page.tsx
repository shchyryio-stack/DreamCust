'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Filter, Plus, Box, Image as ImageIcon, Video, Eye, Edit, Trash2, Power, Archive, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/utils/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'drafts' | 'archived'>('products');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (deleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [deleteModalOpen]);

  const getActiveDiscount = (p: any) => {
    if (!p.discounts || p.discounts.length === 0) return null;
    const now = new Date();
    return p.discounts.find((d: any) => d.isEnabled && (!d.startDate || new Date(d.startDate) <= now) && (!d.endDate || new Date(d.endDate) >= now));
  };

  const filteredProducts = products.filter((p: any) => 
    (p.title || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProductsList = filteredProducts.filter(p => p.status === 'Published' || p.status === 'Public');
  const draftProductsList = filteredProducts.filter(p => !p.status || p.status === 'Draft' || p.status === 'Hidden');
  const archivedProductsList = filteredProducts.filter(p => p.status === 'Archived');

  let displayedProducts: any[] = [];
  if (activeTab === 'products') displayedProducts = activeProductsList;
  if (activeTab === 'drafts') displayedProducts = draftProductsList;
  if (activeTab === 'archived') displayedProducts = archivedProductsList;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedProducts.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const confirmDelete = async () => {
    setDeleteModalOpen(false);
    setLoading(true);
    try {
      const idsToDelete = itemToDelete ? [itemToDelete] : selectedIds;
      await Promise.all(idsToDelete.map(id => api.delete(`/products/delete/${id}`)));
      setSelectedIds([]);
      setItemToDelete(null);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleBulkStatus = async (status: string) => {
    setLoading(true);
    try {
      const payload = status === 'Public' ? { status, 'publishing.publishAt': null } : { status };
      await Promise.all(selectedIds.map(id => api.put(`/products/${id}`, payload)));
      setSelectedIds([]);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Products & Inventory</h2>
          <p className="text-gray-500 mt-1">Manage DreamCust ecosystem hardware and configurator assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/AWIS/products/create">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              New Product
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="border-b border-gray-100 bg-white px-4 pt-4">
          <div className="flex gap-6">
            <button onClick={() => { setActiveTab('products'); setSelectedIds([]); }} className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'products' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Products
            </button>
            <button onClick={() => { setActiveTab('drafts'); setSelectedIds([]); }} className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'drafts' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Drafts
            </button>
            <button onClick={() => { setActiveTab('archived'); setSelectedIds([]); }} className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'archived' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Archived
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full lg:max-w-[260px] xl:max-w-xs shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-md py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto lg:justify-end overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            {selectedIds.length > 0 && (
              <span className="font-semibold text-sm text-[var(--color-primary)] transition-opacity duration-200 whitespace-nowrap shrink-0">
                {selectedIds.length} selected
              </span>
            )}
            
            <div className={`flex items-center gap-2 transition-opacity duration-200 shrink-0 ${selectedIds.length === 0 ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <button onClick={() => handleBulkStatus('Archived')} className="px-3 py-1.5 text-[13px] font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-colors shadow-sm whitespace-nowrap">
                Archive
              </button>
              <button className="px-3 py-1.5 text-[13px] font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-colors shadow-sm whitespace-nowrap">
                Discount
              </button>
              <button onClick={() => handleBulkStatus('Public')} className="px-3 py-1.5 text-[13px] font-semibold text-[var(--color-primary)] bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors shadow-sm whitespace-nowrap">
                Publish
              </button>
              <button onClick={() => { setItemToDelete(null); setDeleteModalOpen(true); }} className="px-3 py-1.5 text-[13px] font-semibold text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-md transition-colors shadow-sm whitespace-nowrap">
                Delete
              </button>
            </div>
            
            <div className="w-px h-5 bg-gray-200 shrink-0 hidden sm:block" />
            
            <Button variant="secondary" className="flex items-center gap-2 h-8 px-3 rounded-md shadow-sm shrink-0 whitespace-nowrap">
              <Filter size={14} /> Filters
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50/80 uppercase tracking-wider">
                  <th className="py-4 px-4 w-12 pl-6">
                    <input type="checkbox" checked={selectedIds.length === displayedProducts.length && displayedProducts.length > 0} onChange={handleSelectAll} className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] transition-all cursor-pointer" />
                  </th>
                  <th className="py-4 px-4 font-semibold">Product Info</th>
                  <th className="py-4 px-4 font-semibold">Type</th>
                  <th className="py-4 px-4 font-semibold">Pricing</th>
                  <th className="py-4 px-4 font-semibold">Stock</th>
                  <th className="py-4 px-4 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedProducts.map((p: any) => {
                  const isSelected = selectedIds.includes(p._id);
                  const productName = p.title || p.name || 'Unnamed Product';
                  
                  // Support both old and new schema structure
                  const primaryImageUrl = p.variants?.[0]?.gallery?.find((g: any) => g.isPrimary)?.url || p.variants?.[0]?.gallery?.[0]?.url;
                  const displayImage = primaryImageUrl 
                    ? (primaryImageUrl.startsWith('http') ? primaryImageUrl : `http://localhost:5001${primaryImageUrl}`) 
                    : (p.images && p.images[0] ? (p.images[0].startsWith('http') ? p.images[0] : `http://localhost:5001${p.images[0]}`) : null);

                  const stockQuantity = p.variants?.reduce((sum: number, v: any) => 
                    sum + (v.inventory?.warehouses?.reduce((wSum: number, w: any) => wSum + (Number(w.quantity) || 0), 0) || 0), 0
                  ) ?? (p.inventory?.quantity || p.stock || 0);

                  const reservedQuantity = p.variants?.reduce((sum: number, v: any) => 
                    sum + (v.inventory?.warehouses?.reduce((wSum: number, w: any) => wSum + (Number(w.reserved) || 0), 0) || 0), 0
                  ) ?? (p.inventory?.reserved || 0);

                  const price = p.variants?.[0]?.pricing?.price ?? (p.price || 0);
                  const unit = p.pricing?.label || 'piece';

                  const activeDiscount = p.variants?.[0]?.discounts?.find((d: any) => 
                    d.isEnabled && (!d.startDate || new Date(d.startDate) <= new Date()) && (!d.endDate || new Date(d.endDate) >= new Date())
                  ) || getActiveDiscount(p);

                  const finalPrice = activeDiscount ? Math.max(0, price - (price * (activeDiscount.value / 100))) : price;
                  
                  let statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                  if (p.status === 'Public' || p.status === 'Published') statusColor = "bg-green-50 text-green-700 border-green-200";
                  else if (p.status === 'Archived') statusColor = "bg-gray-100 text-gray-500 border-gray-200";

                  const displayStatus = (p.status === 'Public' || p.status === 'Published') ? 'Public' : (p.status || 'Draft');

                  return (
                    <tr key={p._id} className={`hover:bg-gray-50/80 transition-all group ${isSelected ? 'bg-blue-50/30' : ''}`}>
                      <td className="py-4 px-4 w-12 pl-6">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p._id)} className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] transition-all cursor-pointer" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg border border-gray-100 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm mt-0.5">
                            {displayImage ? (
                              <img src={displayImage} alt={productName} className="w-full h-full object-contain" />
                            ) : (
                              <ImageIcon size={16} className="text-gray-300" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 leading-tight max-w-[220px] truncate">{productName}</span>
                            <span className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-1">SKU: {p.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">{p.category}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-900 font-medium">${price.toFixed(2)} / {unit}</span>
                          {activeDiscount ? (
                            <>
                              <span className="text-red-600 font-bold text-xs mt-0.5">-{activeDiscount.value}%</span>
                              <span className="text-gray-900 font-bold mt-0.5">Final: ${finalPrice.toFixed(2)}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-gray-400 text-xs mt-0.5">Discount: —</span>
                              <span className="text-gray-900 font-bold mt-0.5">Final: ${finalPrice.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col text-sm">
                          <span className={`font-semibold ${stockQuantity === 0 ? 'text-red-500' : 'text-green-600'}`}>{stockQuantity} in stock</span>
                          <span className="text-gray-400 text-xs mt-0.5">{reservedQuantity} reserved</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor}`}>
                            {displayStatus}
                          </span>
                          {(displayStatus === 'Draft') && p.publishing?.publishAt && (
                            <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap mt-0.5">
                              Auto publish: {new Date(p.publishing.publishAt).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/AWIS/products/edit/${p._id}`} className="p-1.5 text-gray-400 hover:text-[var(--color-primary)] transition-colors rounded-lg hover:bg-blue-50" title="Edit">
                            <Edit size={16} />
                          </Link>
                          {p.status !== 'Archived' ? (
                            <button onClick={async () => {
                              await api.put(`/products/${p._id}`, { status: 'Archived' });
                              fetchProducts();
                            }} className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-50" title="Archive">
                              <Archive size={16} />
                            </button>
                          ) : (
                            <button onClick={async () => {
                              await api.put(`/products/${p._id}`, { status: 'Draft' });
                              fetchProducts();
                            }} className="p-1.5 text-gray-400 hover:text-green-500 transition-colors rounded-lg hover:bg-green-50" title="Restore to Draft">
                              <Power size={16} />
                            </button>
                          )}
                          <button onClick={() => { setItemToDelete(p._id); setDeleteModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayedProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      {activeTab === 'archived' ? 'No archived products found.' : 'No products found in this view.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && mounted && createPortal(
        <div className="fixed inset-0 w-[100vw] h-[100vh] z-[99999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scaleSpring">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto text-red-600">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Product{(!itemToDelete && selectedIds.length > 1) ? 's' : ''}</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete {itemToDelete ? 'this product' : `${selectedIds.length} products`}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white border-transparent">Delete {(!itemToDelete && selectedIds.length > 1) ? 'Products' : 'Product'}</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
