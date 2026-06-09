import React from 'react';
import Link from 'next/link';
import { Eye, Clock, MessageSquare, Paperclip, User, Globe, Building2, Play, CheckCircle, Reply } from 'lucide-react';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

export const TasksTable = ({ tasks, onRefresh }: { tasks: any[], onRefresh?: () => void }) => {
  const { user } = useAuth();

  const isExpiringSoon = (deadline: string) => {
    if (!deadline) return false;
    const hoursLeft = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/tasks/update/${id}`, { status });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50/80 uppercase tracking-wider">
            <th className="py-4 px-6 font-semibold">Task</th>
            <th className="py-4 px-6 font-semibold">Status</th>
            <th className="py-4 px-6 font-semibold">Priority</th>
            <th className="py-4 px-6 font-semibold">Assignees</th>
            <th className="py-4 px-6 font-semibold">Deadline</th>
            <th className="py-4 px-6 font-semibold text-right">Quick Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {tasks.map((task) => {
            const isPersonal = task.assignees?.some((a: any) => a._id === user?._id);
            const expiring = isExpiringSoon(task.deadline);
            
            // Visual styles based on assignment mode
            let borderStyle = 'border-l-4 border-transparent';
            let IconObj = Globe;
            let iconClass = 'text-gray-400';
            
            if (isPersonal) {
              borderStyle = 'border-l-4 border-blue-500 bg-blue-50/10 shadow-[inset_4px_0_0_0_rgba(59,130,246,0.5)]';
              IconObj = User;
              iconClass = 'text-blue-500';
            } else if (task.assignmentMode === 'Department') {
              borderStyle = 'border-l-4 border-transparent bg-gray-50/30';
              IconObj = Building2;
              iconClass = 'text-indigo-400';
            }

            return (
              <tr key={task._id} className={`hover:bg-gray-50/80 transition-all group ${borderStyle} ${expiring && task.status !== 'Completed' ? '!bg-orange-50/20' : ''}`}>
                <td className="py-4 px-6">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${iconClass}`}>
                      <IconObj size={16} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/AWIS/tasks/${task._id}`} className="font-semibold text-gray-900 hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                          {task.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                        <span>{task.department} • {task.taskType}</span>
                        <div className="flex items-center gap-1"><MessageSquare size={12} /> {task.replies?.length || 0}</div>
                        <div className="flex items-center gap-1"><Paperclip size={12} /> {task.attachments?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6"><TaskStatusBadge status={task.status} /></td>
                <td className="py-4 px-6"><TaskPriorityBadge priority={task.priority} /></td>
                <td className="py-4 px-6">
                  <div className="flex -space-x-2 overflow-hidden">
                    {task.assignees?.length > 0 ? task.assignees.map((assignee: any) => (
                      <div key={assignee._id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm" title={assignee.fullName}>
                        {assignee.avatar ? <img src={assignee.avatar} className="w-full h-full rounded-full object-cover" /> : assignee.fullName?.charAt(0)}
                      </div>
                    )) : (
                      <span className="text-xs text-gray-400 italic font-medium px-2 py-1 bg-gray-100 rounded-md">Global</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  {task.deadline ? (
                    <div className={`flex items-center gap-1.5 text-sm ${expiring && task.status !== 'Completed' ? 'text-orange-600 font-semibold animate-pulse' : 'text-gray-600'}`}>
                      <Clock size={14} />
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  ) : <span className="text-gray-400 text-sm">-</span>}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status === 'Pending' && (
                      <button onClick={() => handleStatusChange(task._id, 'In Progress')} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50" title="Start">
                        <Play size={16} />
                      </button>
                    )}
                    {task.status === 'In Progress' && (
                      <button onClick={() => handleStatusChange(task._id, 'Completed')} className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="Complete">
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <Link href={`/AWIS/tasks/${task._id}`} className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50" title="Reply">
                      <Reply size={16} />
                    </Link>
                    <Link href={`/AWIS/tasks/${task._id}`} className="p-1.5 text-gray-400 hover:text-[var(--color-primary)] transition-colors rounded-lg hover:bg-gray-100" title="View Details">
                      <Eye size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-500">No tasks found in this view.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
