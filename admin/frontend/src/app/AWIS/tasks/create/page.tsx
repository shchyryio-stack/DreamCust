'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud, File, X, Users, User, Globe, Building2 } from 'lucide-react';
import api from '@/utils/api';
import Link from 'next/link';

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  // Initialize deadlines
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // +1 day minimum
  
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14); // +14 days maximum

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: 'IT',
    taskType: 'Client Request',
    priority: 'Medium',
    deadline: minDate.toISOString().slice(0, 16),
    assignmentMode: 'Personal',
    assignees: [] as string[]
  });

  const [files, setFiles] = useState<File[]>([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/tasks/employees');
        setEmployees(data);
      } catch (err) {}
    };
    fetchEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAssignee = (id: string) => {
    setFormData(prev => {
      if (prev.assignees.includes(id)) {
        return { ...prev, assignees: prev.assignees.filter(a => a !== id) };
      }
      return { ...prev, assignees: [...prev.assignees, id] };
    });
  };

  const validateDeadline = () => {
    const selected = new Date(formData.deadline).getTime();
    if (selected < minDate.getTime()) return 'Deadline must be at least 1 day from now.';
    if (selected > maxDate.getTime()) return 'Deadline cannot exceed 14 days from now.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const deadlineError = validateDeadline();
    if (deadlineError) return alert(deadlineError);

    setLoading(true);

    try {
      const payload = {
        ...formData,
      };

      const res = await api.post('/tasks/create', payload);
      
      // Handle file uploads natively here if needed
      if (files.length > 0) {
        // Normally send FormData, for mock we just call /upload/:id
        for (const file of files) {
          await api.post(`/tasks/upload/${res.data._id}`, {
            filename: file.name,
            fileSize: file.size,
            url: URL.createObjectURL(file) // mockup url
          });
        }
      }

      router.push('/AWIS/tasks');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on department if mode is Personal
  const filteredEmployees = employees.filter((e: any) => e.department === formData.department);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/AWIS/tasks" className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create New Task</h2>
          <p className="text-gray-500 text-sm mt-1">Operational task generation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6 shadow-sm">
          <Input label="Task Title" name="title" value={formData.title} onChange={handleChange} required />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none min-h-[150px] shadow-sm transition-shadow"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Department</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select name="department" value={formData.department} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white shadow-sm appearance-none">
                  {['IT', 'Call Center', 'Warehouse', 'Management', 'Marketing', 'Support', 'All'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Task Type</label>
              <select name="taskType" value={formData.taskType} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white shadow-sm appearance-none">
                {['Bug', 'Technical Issue', 'Client Request', 'Urgent', 'System', 'Warehouse', 'Call Center', 'Management', 'Marketing', 'Support', 'Other'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white shadow-sm appearance-none">
                {['Low', 'Medium', 'High', 'Critical', 'Emergency'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex justify-between">
                <span>Deadline</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">(1 - 14 Days)</span>
              </label>
              <input 
                type="datetime-local" 
                name="deadline" 
                value={formData.deadline} 
                onChange={handleChange} 
                min={minDate.toISOString().slice(0, 16)}
                max={maxDate.toISOString().slice(0, 16)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[var(--color-primary)] shadow-sm"
                required
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-6 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Assignment Setup</h3>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.assignmentMode === 'Personal' ? 'border-[var(--color-primary)] bg-blue-50/50 text-[var(--color-primary)]' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                <input type="radio" name="assignmentMode" value="Personal" checked={formData.assignmentMode === 'Personal'} onChange={handleChange} className="hidden" />
                <User size={18} />
                <span className="font-semibold text-sm">Personal</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.assignmentMode === 'Department' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                <input type="radio" name="assignmentMode" value="Department" checked={formData.assignmentMode === 'Department'} onChange={handleChange} className="hidden" />
                <Building2 size={18} />
                <span className="font-semibold text-sm">Department</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.assignmentMode === 'Global' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                <input type="radio" name="assignmentMode" value="Global" checked={formData.assignmentMode === 'Global'} onChange={handleChange} className="hidden" />
                <Globe size={18} />
                <span className="font-semibold text-sm">Global</span>
              </label>
            </div>
            
            {formData.assignmentMode === 'Personal' && (
              <div className="relative pt-2">
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Assign Employees (from {formData.department})</label>
                <div 
                  onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-between cursor-pointer"
                >
                  <span className="text-gray-700 text-sm">{formData.assignees.length > 0 ? `${formData.assignees.length} selected` : 'Select employees...'}</span>
                  <Users size={16} className="text-gray-400" />
                </div>

                {showEmployeeDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-64 overflow-y-auto overflow-hidden animate-fade-in">
                    {filteredEmployees.length > 0 ? filteredEmployees.map((emp: any) => (
                      <div 
                        key={emp._id} 
                        onClick={() => toggleAssignee(emp._id)}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${formData.assignees.includes(emp._id) ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[var(--color-primary)] font-bold flex items-center justify-center text-xs shrink-0">
                          {emp.avatar ? <img src={emp.avatar} className="w-full h-full rounded-full object-cover" /> : emp.fullName?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{emp.fullName}</p>
                          <p className="text-[10px] text-gray-500">{emp.position}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.assignees.includes(emp._id) ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-gray-300'}`}>
                          {formData.assignees.includes(emp._id) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </div>
                    )) : (
                      <div className="p-4 text-center text-sm text-gray-500">No employees found in {formData.department} department.</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {formData.assignmentMode === 'Department' && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">Task will be assigned to all employees in the <strong>{formData.department}</strong> department.</p>
            )}
            {formData.assignmentMode === 'Global' && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">Task will be globally visible to the entire company.</p>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Attachments</h3>
          
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[var(--color-primary)] hover:bg-blue-50/30 transition-colors relative cursor-pointer">
            <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <UploadCloud size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm font-semibold text-gray-700">Click or drag files to upload</p>
            <p className="text-xs text-gray-400 mt-1">Images, PDF, ZIP, DOC, TXT, LOG up to 50MB</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                      <File size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/AWIS/tasks">
            <Button variant="secondary" type="button">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={loading}>Create Workflow</Button>
        </div>
      </form>
    </div>
  );
}
