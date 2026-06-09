"use client";

import { useState, useEffect } from 'react';
import AddressForm from './AddressForm';
import AddressCard from './AddressCard';

export default function AddressManager() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  // Sort Addresses
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const fetchAddresses = async (currentToken?: string | null) => {
    try {
      const token = currentToken || localStorage.getItem('token');
      if (!token) {
        setIsLoadingAddresses(false);
        return;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.map((a: any) => ({ ...a, id: a._id })));
      }
    } catch (err) {
      console.error("Error loading addresses", err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

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

  return (
    <div className="animate-fade-in relative h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-[#1A1A1A]">Saved Addresses</h2>
        {addresses.length > 0 && (
          <button 
            onClick={() => { setEditingAddress(null); setIsModalOpen(true); }}
            className="text-[#1E6FE8] hover:text-[#1557BE] font-bold text-sm bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-full transition-colors"
          >
            + Add Address
          </button>
        )}
      </div>

      {isLoadingAddresses ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin w-8 h-8 border-4 border-[#1E6FE8] border-t-transparent rounded-full"></div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-[20px] p-12 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner text-gray-300">
            📍
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">No addresses saved</h3>
          <p className="text-gray-500 font-medium max-w-sm mb-8">Add your delivery address to speed up checkout and ensure accurate shipping estimates.</p>
          <button 
            onClick={() => { setEditingAddress(null); setIsModalOpen(true); }}
            className="bg-[#1E6FE8] hover:bg-[#1557BE] text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-[0_4px_14px_rgba(30,111,232,0.3)] hover:-translate-y-0.5"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedAddresses.map((addr) => (
            <AddressCard
              key={addr._id || addr.id}
              address={addr}
              onEdit={(e) => { e.stopPropagation(); setEditingAddress(addr); setIsModalOpen(true); }}
              onDelete={(e) => handleDeleteAddress(addr._id || addr.id, e)}
              onSetDefault={(e) => handleSetDefault(addr._id || addr.id, e)}
              showRadio={false}
            />
          ))}
        </div>
      )}

      <AddressForm 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAddress(null); }}
        onSave={handleSaveAddress}
        addressToEdit={editingAddress}
      />
    </div>
  );
}
