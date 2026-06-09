import React from 'react';
import Link from 'next/link';
import { User, Eye, Edit, Ban, Trash2 } from 'lucide-react';
import { ClientStatusBadge } from './ClientStatusBadge';

export const ClientsTable = ({ clients, onBlock, onDelete }: { clients: any[], onBlock: (id: string, status: string) => void, onDelete: (id: string) => void }) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 text-sm text-gray-500 bg-gray-50/50">
            <th className="py-4 px-6 font-medium">Client</th>
            <th className="py-4 px-6 font-medium">Contact</th>
            <th className="py-4 px-6 font-medium">Orders</th>
            <th className="py-4 px-6 font-medium">Spent</th>
            <th className="py-4 px-6 font-medium">Status</th>
            <th className="py-4 px-6 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clients.map((client) => (
            <tr key={client._id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[var(--color-primary)] flex items-center justify-center font-bold shadow-sm">
                    {client.avatar ? (
                      <img src={client.avatar} alt={client.fullName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      client.fullName ? client.fullName.charAt(0) : client.email.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{client.fullName || 'No Name'}</p>
                    <p className="text-xs text-gray-500">@{client.username || client._id.slice(-6)}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                <p className="text-sm text-gray-900">{client.email}</p>
                <p className="text-xs text-gray-500">{client.phone || 'No phone'}</p>
              </td>
              <td className="py-4 px-6 text-sm text-gray-900">{client.ordersCount || 0}</td>
              <td className="py-4 px-6 text-sm font-medium text-gray-900">${(client.totalSpent || 0).toFixed(2)}</td>
              <td className="py-4 px-6">
                <ClientStatusBadge status={client.status || 'Active'} />
              </td>
              <td className="py-4 px-6 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/AWIS/clients/${client._id}`} className="p-2 text-gray-400 hover:text-[var(--color-primary)] transition-colors rounded-lg hover:bg-blue-50" title="Open Profile">
                    <Eye size={16} />
                  </Link>
                  <button onClick={() => onBlock(client._id, client.status === 'Blocked' ? 'Active' : 'Blocked')} className={`p-2 text-gray-400 transition-colors rounded-lg ${client.status === 'Blocked' ? 'hover:text-green-600 hover:bg-green-50' : 'hover:text-yellow-600 hover:bg-yellow-50'}`} title={client.status === 'Blocked' ? 'Unblock' : 'Block'}>
                    <Ban size={16} />
                  </button>
                  <button onClick={() => onDelete(client._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-500">No clients found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
