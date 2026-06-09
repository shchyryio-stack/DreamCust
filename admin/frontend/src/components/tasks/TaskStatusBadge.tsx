import React from 'react';

export const TaskStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Pending: 'bg-gray-50 text-gray-700 border-gray-200',
    'In Progress': 'bg-blue-50 text-[var(--color-primary)] border-blue-200',
    Review: 'bg-purple-50 text-purple-700 border-purple-200',
    Completed: 'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
    Closed: 'bg-gray-100 text-gray-500 border-gray-200',
    Overdue: 'bg-red-100 text-red-800 border-red-300 font-bold',
    Deferred: 'bg-slate-100 text-slate-500 border-slate-300',
  };

  const currentStyle = styles[status] || styles.Pending;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${currentStyle}`}>
      {status}
    </span>
  );
};
