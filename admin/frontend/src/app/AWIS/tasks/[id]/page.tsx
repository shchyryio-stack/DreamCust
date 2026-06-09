'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { TaskPriorityBadge } from '@/components/tasks/TaskPriorityBadge';
import { ArrowLeft, Clock, User, Paperclip, Send, Plus, Building2, Globe, File as FileIcon, Activity } from 'lucide-react';
import api from '@/utils/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function TaskDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [rightTab, setRightTab] = useState<'discussion' | 'activity'>('discussion');

  const fetchTask = async () => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTask(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTask();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/tasks/update/${id}`, { status: newStatus });
      fetchTask();
    } catch (error) {
      console.error(error);
    }
  };

  const submitReply = async () => {
    if (!replyContent.trim()) return;
    setReplying(true);
    try {
      await api.post(`/tasks/reply/${id}`, { content: replyContent });
      setReplyContent('');
      fetchTask();
    } catch (error) {
      console.error(error);
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!task) return <div>Task not found</div>;

  let AssignmentIcon = Globe;
  if (task.assignmentMode === 'Personal') AssignmentIcon = User;
  if (task.assignmentMode === 'Department') AssignmentIcon = Building2;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Task Details</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={task.status} 
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm font-semibold bg-white shadow-sm hover:border-[var(--color-primary)] transition-colors cursor-pointer"
          >
            {['Pending', 'In Progress', 'Review', 'Completed', 'Rejected', 'Closed', 'Overdue', 'Deferred'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN: TASK INFO */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 space-y-6">
          <Card className="p-6 space-y-6 shadow-sm">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{task.title}</h1>
              <p className="text-sm font-medium text-[var(--color-primary)] mt-2 bg-blue-50 px-2.5 py-1 rounded-md inline-block">
                {task.department} • {task.taskType}
              </p>
            </div>

            <div className="prose max-w-none text-sm text-gray-700 whitespace-pre-wrap bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              {task.description}
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><User size={14}/> Creator</span>
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    {task.creator?.fullName}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><Clock size={14}/> Deadline</span>
                  <span className={`font-semibold ${task.deadline && new Date(task.deadline).getTime() < Date.now() && task.status !== 'Completed' ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' : 'text-gray-900'}`}>
                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AssignmentIcon size={14} /> Assignees ({task.assignmentMode})
              </h3>
              {task.assignees?.length > 0 ? (
                <div className="space-y-3">
                  {task.assignees.map((assignee: any) => (
                    <div key={assignee._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-[var(--color-primary)] text-xs shadow-sm ring-2 ring-white">
                        {assignee.avatar ? <img src={assignee.avatar} className="w-full h-full rounded-full object-cover"/> : assignee.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{assignee.fullName}</p>
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{assignee.position || 'Employee'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {task.assignmentMode === 'Department' ? `Assigned to all ${task.department} employees.` : 'Globally visible task.'}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Paperclip size={14} /> Attachments
              </h3>
              <Button variant="ghost" className="h-6 w-6 p-0 rounded-full text-gray-400 hover:text-[var(--color-primary)]"><Plus size={14} /></Button>
            </div>
            {task.attachments?.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((att: any) => (
                  <div key={att._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 cursor-pointer group">
                    <div className="w-10 h-10 bg-blue-50 text-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                      <FileIcon size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[var(--color-primary)] transition-colors">{att.filename}</p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{(att.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                <Paperclip size={20} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-500">No attachments yet</p>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: DISCUSSION & ACTIVITY */}
        <div className="flex-1 flex flex-col min-h-[600px]">
          <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-t-4 border-t-[var(--color-primary)]">
            <div className="flex border-b border-gray-100 bg-gray-50/30">
              <button 
                onClick={() => setRightTab('discussion')} 
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${rightTab === 'discussion' ? 'text-[var(--color-primary)] bg-white border-b-2 border-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}`}
              >
                Discussion Thread
              </button>
              <button 
                onClick={() => setRightTab('activity')} 
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${rightTab === 'activity' ? 'text-[var(--color-primary)] bg-white border-b-2 border-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}`}
              >
                <Activity size={16} /> Activity History
              </button>
            </div>

            {rightTab === 'discussion' ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fa] custom-scrollbar">
                  {task.replies?.map((reply: any) => (
                    <div key={reply._id} className={`flex gap-4 ${reply.authorId?._id === user?._id ? 'flex-row-reverse' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 text-[var(--color-primary)] flex shrink-0 items-center justify-center font-bold text-sm shadow-sm">
                        {reply.authorId?.avatar ? <img src={reply.authorId.avatar} className="w-full h-full rounded-full object-cover"/> : reply.authorId?.fullName?.charAt(0) || 'U'}
                      </div>
                      <div className={`flex flex-col max-w-[80%] ${reply.authorId?._id === user?._id ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-gray-900">{reply.authorId?.fullName}</span>
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className={`px-5 py-3 text-sm shadow-sm leading-relaxed ${reply.authorId?._id === user?._id ? 'bg-[var(--color-primary)] text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'}`}>
                          {reply.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!task.replies || task.replies.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                      <Send size={32} className="mb-4 opacity-20" />
                      <p className="text-sm font-semibold">Start the discussion</p>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                  <div className="flex gap-3 items-end">
                    <textarea 
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Message the team..."
                      className="flex-1 border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none bg-gray-50/50 min-h-[50px] max-h-[150px] custom-scrollbar"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitReply();
                        }
                      }}
                    />
                    <Button onClick={submitReply} isLoading={replying} className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                      <Send size={18} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {task.activity?.slice().reverse().map((act: any, i: number) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Activity size={14} />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900 text-sm">{act.action}</div>
                          <time className="font-medium text-slate-400 text-[10px] uppercase tracking-wider">{new Date(act.date).toLocaleDateString()}</time>
                        </div>
                        <div className="text-slate-600 text-xs leading-snug">{act.details}</div>
                      </div>
                    </div>
                  ))}
                  {(!task.activity || task.activity.length === 0) && (
                    <div className="text-center text-gray-500 py-12 relative z-10 bg-white">No activity logged.</div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
