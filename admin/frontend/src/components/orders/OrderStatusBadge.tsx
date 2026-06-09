import React from 'react';

interface OrderStatusBadgeProps {
  status: string;
}

const styleMap: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  new: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  in_processing: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  shipped: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  in_transit: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  delivered: 'bg-green-50 text-green-700 ring-green-600/20',
  received: 'bg-green-50 text-green-700 ring-green-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  refused: 'bg-red-50 text-red-700 ring-red-600/20',
};

const labelMap: Record<string, string> = {
  pending: 'New',
  new: 'New',
  confirmed: 'Confirmed',
  in_processing: 'In Processing',
  shipped: 'Awaiting Shipment',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  received: 'Received',
  cancelled: 'Cancelled',
  refused: 'Refused',
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const style = styleMap[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
  const label = labelMap[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}>
      {label}
    </span>
  );
};
