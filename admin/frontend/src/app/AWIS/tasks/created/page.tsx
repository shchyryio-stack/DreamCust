'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { TasksTable } from '@/components/tasks/TasksTable';
import api from '@/utils/api';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreatedTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get('/tasks/created');
        setTasks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/AWIS/tasks" className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Created Tasks</h2>
          <p className="text-gray-500 mt-1">Tasks you have assigned to others.</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : (
          <TasksTable tasks={tasks} />
        )}
      </Card>
    </div>
  );
}
