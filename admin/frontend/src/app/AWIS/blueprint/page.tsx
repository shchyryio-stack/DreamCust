'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Box, Settings, Link as LinkIcon, Plus, Edit, Trash2, ShieldAlert, AlertCircle, Copy, Archive, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';

export default function BlueprintManagerPage() {
  const router = useRouter();
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'archived'>('all');
  const [validationErrors, setValidationErrors] = useState<any>(null);

  const fetchBlueprints = async () => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors(null);
      const { data } = await api.get('/categories');
      setBlueprints(data || []);
    } catch (err: any) {
      console.error("[FETCH BLUEPRINTS ERROR]", err);
      setError(err.response?.data?.message || 'Unable to load blueprints');
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlueprints();
  }, []);

  const handleArchive = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/categories/update/${id}`, { isArchived: !currentStatus });
      fetchBlueprints();
    } catch (e: any) {
      console.error('Error archiving', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/categories/delete/${id}`);
      fetchBlueprints();
    } catch (e: any) {
      console.error('Error deleting', e);
    }
  };

  const handleDuplicate = async (bp: any) => {
    try {
      const payload = { ...bp };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      payload.name = `${payload.name} (Copy)`;
      payload.slug = `${payload.slug}-copy-${Date.now()}`;
      await api.post('/categories/create', payload);
      fetchBlueprints();
    } catch (e: any) {
      console.error('Error duplicating blueprint', e);
    }
  };

  const filteredBlueprints = blueprints.filter((b: any) => {
    const matchesSearch = (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.slug || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' ? !b.isArchived : b.isArchived;
    return matchesSearch && matchesTab;
  });

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto pb-12 flex flex-col items-center justify-center min-h-[50vh]">
        <Card className="p-8 max-w-lg w-full text-center border-red-100 bg-gradient-to-b from-white to-red-50/30">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">{error}</h3>
          
          {validationErrors && (
            <div className="bg-white rounded-lg border border-red-100 p-4 my-4 text-left shadow-sm">
              <h4 className="text-xs font-bold text-red-800 uppercase mb-2">Validation Details:</h4>
              <ul className="text-sm text-red-600 space-y-1 list-disc pl-4">
                {Object.entries(validationErrors).map(([key, val]: any) => (
                  <li key={key}><span className="font-semibold">{key}:</span> {val.message || 'Invalid field'}</li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={fetchBlueprints} variant="secondary" className="w-full">Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Blueprint</h2>
          <p className="text-gray-500 mt-1">Manage centralized schema logic for DreamCust products.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/AWIS/blueprint/new">
            <Button className="flex items-center gap-2">
              <Plus size={18} /> New Blueprint
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm p-0">
        <div className="border-b border-gray-100 bg-white px-4 pt-4">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('all')} 
              className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'all' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              All Blueprints
            </button>
            <button 
              onClick={() => setActiveTab('archived')} 
              className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'archived' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Archived
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search blueprints by name or slug..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" className="flex items-center gap-2 text-xs h-10 px-4">
              <Filter size={14} /> Filters
            </Button>
          </div>
        </div>

        <div className="p-4 bg-gray-50/30 min-h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading && blueprints.length === 0 ? (
              <div className="col-span-full p-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
              </div>
            ) : filteredBlueprints.map((bp: any) => (
              <Card 
                key={bp._id} 
                className={`p-0 overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:shadow-md border border-gray-200 ${bp.isArchived ? 'opacity-60 grayscale-[0.3]' : ''}`}
              >
                <div className="p-4 border-b border-gray-100 bg-white flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                      <Box size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{bp.name} {bp.isArchived && <span className="text-xs text-gray-400 font-normal ml-1">(Archived)</span>}</h3>
                      <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">{bp.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => router.push(`/AWIS/blueprint/${bp._id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50" title="Edit"><Edit size={14} /></button>
                    <button onClick={() => handleDuplicate(bp)} className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded-md hover:bg-green-50" title="Duplicate"><Copy size={14} /></button>
                    <button onClick={() => handleArchive(bp._id, bp.isArchived)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors rounded-md hover:bg-orange-50" title={bp.isArchived ? "Unarchive" : "Archive"}><Archive size={14} /></button>
                    <button onClick={() => handleDelete(bp._id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                
                <div className="p-4 flex-1 space-y-4 bg-gray-50/30">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Settings size={12} /> Specs <span className="bg-gray-200/50 text-gray-600 px-1 rounded text-[9px]">{bp.specifications?.length || 0}</span>
                    </h4>
                    {bp.specifications?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {bp.specifications.slice(0, 5).map((spec: any, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 bg-white text-gray-600 border border-gray-200 rounded text-[10px] font-medium" title={spec.type}>
                            {spec.label}
                          </span>
                        ))}
                        {bp.specifications.length > 5 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 border border-transparent rounded text-[10px] font-medium">+{bp.specifications.length - 5}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No specifications</p>
                    )}
                  </div>

                </div>
              </Card>
            ))}
            {filteredBlueprints.length === 0 && !loading && !error && (
              <div className="col-span-full py-12 text-center text-sm font-medium text-gray-500">
                No blueprints found in this view.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
