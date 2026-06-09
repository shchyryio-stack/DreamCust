'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { Search, Filter, Users } from 'lucide-react';
import api from '@/utils/api';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleBlock = async (id: string, newStatus: string) => {
    if (confirm(`Are you sure you want to change this client's status to ${newStatus}?`)) {
      try {
        await api.put(`/clients/${id}`, { status: newStatus });
        fetchClients();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this client? This cannot be undone.')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const filteredClients = clients.filter((c: any) => 
    (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Clients</h2>
          <p className="text-gray-500 mt-1">Manage DreamCust customer accounts and analytics.</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2 flex items-center gap-3">
            <Users size={18} className="text-[var(--color-primary)]" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Clients</p>
              <p className="text-sm font-bold text-gray-900">{clients.length}</p>
            </div>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/30">
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search clients by name, email, or username..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all"
            />
          </div>
          <Button variant="secondary" className="flex items-center gap-2">
            <Filter size={16} />
            Filters
          </Button>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : (
          <ClientsTable clients={filteredClients} onBlock={handleBlock} onDelete={handleDelete} />
        )}
      </Card>
    </div>
  );
}
