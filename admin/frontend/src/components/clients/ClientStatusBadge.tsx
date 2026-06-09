import React from 'react';

export const ClientStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Active: 'bg-green-50 text-green-700 border-green-200',
    VIP: 'bg-purple-50 text-purple-700 border-purple-200',
    Blocked: 'bg-red-50 text-red-700 border-red-200',
    Suspended: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Inactive: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const currentStyle = styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
      {status || 'Active'}
    </span>
  );
};
