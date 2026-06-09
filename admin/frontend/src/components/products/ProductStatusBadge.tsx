import React from 'react';

export const ProductStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Published: 'bg-green-50 text-green-700 border-green-200',
    Hidden: 'bg-gray-50 text-gray-700 border-gray-200',
    Draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Out of Stock': 'bg-red-50 text-red-700 border-red-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    out_of_stock: 'bg-red-50 text-red-700 border-red-200',
  };

  const currentStyle = styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
      {status}
    </span>
  );
};
