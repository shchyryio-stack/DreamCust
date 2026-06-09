'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TasksTable } from '@/components/tasks/TasksTable';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'received' | 'my' | 'created' | 'archived'>('received');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let endpoint = '/tasks';
      if (activeTab === 'created') endpoint = '/tasks/created';
      if (activeTab === 'archived') endpoint = '/tasks/archived';

      const { data } = await api.get(endpoint);
      
      if (activeTab === 'my') {
        // Filter the main received feed for purely personal assignments
        // Wait, the backend doesn't explicitly return the user object to filter assignees directly without knowing their ID.
        // We'll fetch '/tasks' and filter on the client. But wait! I can just use a '/tasks/my' endpoint if it existed, but I removed it?
        // Actually, let's filter in UI since we populate assignees. 
      }
      
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  let displayTasks = tasks;
  
  if (activeTab === 'my') {
    // A quick hack since we populate assignees but we don't have user._id here easily without context.
    // Wait, the backend /tasks endpoint returns received tasks (personal, dept, global).
    // Let's just fetch /tasks and then we'll let the user context do the filter inside the effect or just use a dedicated API endpoint.
    // Let's create an effect with context.
  }

  // Proper client-side filtering logic:
  const { user } = useAuth();

  if (activeTab === 'my' && user) {
    displayTasks = tasks.filter((t: any) => t.assignees?.some((a: any) => a._id === user._id));
  }

  const filteredTasks = displayTasks.filter((t: any) => 
    (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.taskType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Task Manager</h2>
          <p className="text-gray-500 mt-1">Enterprise workflow and operations center.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/AWIS/tasks/create">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="border-b border-gray-100 bg-white px-4 pt-4">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('received')} className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'received' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Received Tasks
            </button>
            <button onClick={() => setActiveTab('my')} className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'my' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              My Tasks
            </button>
            <button onClick={() => setActiveTab('created')} className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'created' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Created Tasks
            </button>
            <button onClick={() => setActiveTab('archived')} className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'archived' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Archived
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all shadow-sm"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : (
          <TasksTable tasks={filteredTasks} onRefresh={fetchTasks} />
        )}
      </Card>
    </div>
  );
}
