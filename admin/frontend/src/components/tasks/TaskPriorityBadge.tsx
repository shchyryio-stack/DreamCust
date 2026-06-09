import React from 'react';

export const TaskPriorityBadge = ({ priority }: { priority: string }) => {
  const styles: Record<string, string> = {
    Low: 'bg-gray-50 text-gray-700 border-gray-200',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200',
    High: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Critical: 'bg-orange-50 text-orange-700 border-orange-200',
    Emergency: 'bg-red-50 text-red-700 border-red-200 animate-pulse',
  };

  const currentStyle = styles[priority] || styles.Medium;

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${currentStyle}`}>
      {priority}
    </span>
  );
};
