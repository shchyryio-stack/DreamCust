'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Box, Settings, Save, Plus, Trash2, GripVertical, AlertTriangle, UploadCloud, Edit2, Link as LinkIcon, Check } from 'lucide-react';
import api from '@/utils/api';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CATEGORY_MAP: Record<string, string[]> = {
  'PC Components': ['GPU', 'CPU', 'RAM', 'Motherboard', 'SSD', 'PSU', 'Case', 'Cooler'],
  'Accessories': ['Mouse', 'Keyboard', 'Headset', 'Mousepad', 'Microphone', 'Webcam'],
  'Peripherals': ['Monitor', 'Printer', 'Scanner'],
  'Furniture': ['Desk', 'Chair', 'Lighting'],
  'Audio': ['Speakers', 'DAC', 'Amp'],
  'Networking': ['Router', 'Switch', 'Network Card'],
  'Storage': ['External HDD', 'NAS'],
  'Cooling': ['Case Fan', 'Waterblock', 'Radiator']
};
const generateKey = (label: string, existingKeys: string[]): string => {
  let baseKey = label
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  if (!baseKey) baseKey = 'field';

  let finalKey = baseKey;
  let counter = 2;
  while (existingKeys.includes(finalKey)) {
    finalKey = `${baseKey}${counter}`;
    counter++;
  }
  return finalKey;
};

const getAllKeys = (specs: any[], excludeId: string) => {
  const keys: string[] = [];
  specs.forEach(s => {
    if (s.id !== excludeId && s.key) keys.push(s.key);
    if (s.children) {
      s.children.forEach((c: any) => {
        if (c.id !== excludeId && c.key) keys.push(c.key);
      });
    }
  });
  return keys;
};

const SortableSubSpecCard = ({ subSpec, parentIndex, index, updateSubSpec, removeSubSpec }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: subSpec.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-stretch transition-all hover:border-gray-300 relative group z-10">
      <div {...attributes} {...listeners} className="w-8 bg-gray-100/80 border-r border-gray-200 flex items-center justify-center cursor-move text-gray-400 hover:text-gray-600 transition-colors">
        <GripVertical size={16} />
      </div>
      <div className="p-3 flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 relative">
        <div className="flex-1 w-full grid grid-cols-12 gap-3 items-center">
          <div className="col-span-12">
            <Input label="Sub Characteristic Name" value={subSpec.label} onChange={(e) => updateSubSpec(parentIndex, index, 'label', e.target.value)} required />
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center pr-1">
          <button type="button" onClick={() => removeSubSpec(parentIndex, index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
        </div>
      </div>
    </div>
  );
};

const SortableSpecCard = ({ spec, index, updateSpec, removeSpec, addSubSpec, updateSubSpec, removeSubSpec }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: spec.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const preview = URL.createObjectURL(file);
      updateSpec(index, 'iconPreview', preview);
      updateSpec(index, 'icon', data.url);
    } catch (err) {
      console.error('Failed to upload icon', err);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex items-stretch transition-all hover:border-gray-300 relative group z-0">
      
      {/* Left Drag Handle: Full Height */}
      <div {...attributes} {...listeners} className="w-10 bg-gray-50/50 border-r border-gray-100 flex items-center justify-center cursor-move text-gray-300 hover:text-gray-500 transition-colors shrink-0">
        <GripVertical size={20} />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-5 relative">
          <div className="w-16 h-16 shrink-0 bg-[#f3f4f6] border border-gray-200 rounded-[18px] flex items-center justify-center text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer relative overflow-hidden group/icon">
            {spec.iconPreview || spec.icon ? (
              <img src={spec.iconPreview || `http://localhost:5001${spec.icon}`} alt="" className="w-full h-full object-contain block z-10 pointer-events-none p-1" />
            ) : (
              <UploadCloud size={20} className="z-10 pointer-events-none" />
            )}
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/png, image/svg+xml, image/webp" onChange={handleIconUpload} />
            {(spec.iconPreview || spec.icon) && (
              <button type="button" onClick={(e) => { e.preventDefault(); updateSpec(index, 'iconPreview', null); updateSpec(index, 'icon', ''); }} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity z-30">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="flex-1 w-full grid grid-cols-12 gap-5 items-center">
            <div className="col-span-12">
              <Input label="Characteristic Name" value={spec.label} onChange={(e) => updateSpec(index, 'label', e.target.value)} required />
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-center pr-2">
            <button type="button" onClick={() => removeSpec(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
          </div>
        </div>
        
        <div className="pl-4 pr-4 pb-4">
          <div className="border-t border-dashed border-gray-200 pt-3 mt-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                Sub Characteristics
              </h4>
              <button type="button" onClick={() => addSubSpec(index)} className="text-xs flex items-center gap-1 text-[var(--color-primary)] font-semibold hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors">
                <Plus size={14} /> Add Sub Characteristic
              </button>
            </div>
            <div className="space-y-2">
              {spec.children && spec.children.length > 0 ? (
                <SortableContext items={spec.children.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                  {spec.children.map((subSpec: any, subIndex: number) => (
                    <SortableSubSpecCard key={subSpec.id} subSpec={subSpec} parentIndex={index} index={subIndex} updateSubSpec={updateSubSpec} removeSubSpec={removeSubSpec} />
                  ))}
                </SortableContext>
              ) : (
                <div className="text-sm text-gray-400 italic py-1">No sub characteristics added.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



export const BlueprintForm = ({ initialData = {}, isEdit = false }: { initialData?: any, isEdit?: boolean }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    slug: initialData.slug || '',
    category: initialData.category || 'PC Components',
    productType: initialData.productType || 'GPU',
    specifications: (initialData.specifications || []).map((s: any) => ({ 
      ...s, 
      id: s.id || `spec-${Math.random().toString(36).substr(2, 9)}`,
      isExisting: true,
      children: (s.children || []).map((c: any) => ({
        ...c,
        id: c.id || `subspec-${Math.random().toString(36).substr(2, 9)}`,
        isExisting: true
      }))
    }))
  });

  const [activeTab, setActiveTab] = useState('basic');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEndSpecs = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFormData((prev) => {
      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);
      
      if (activeIdStr.startsWith('spec-') && overIdStr.startsWith('spec-')) {
        const oldIndex = prev.specifications.findIndex((s: any) => s.id === active.id);
        const newIndex = prev.specifications.findIndex((s: any) => s.id === over.id);
        return { ...prev, specifications: arrayMove(prev.specifications, oldIndex, newIndex) };
      }

      if (activeIdStr.startsWith('subspec-') && overIdStr.startsWith('subspec-')) {
        const newSpecs = [...prev.specifications];
        const parentIndex = newSpecs.findIndex(s => s.children?.some((c: any) => c.id === active.id));
        if (parentIndex > -1) {
          const parentOverIndex = newSpecs.findIndex(s => s.children?.some((c: any) => c.id === over.id));
          if (parentIndex === parentOverIndex) {
            const children = [...newSpecs[parentIndex].children];
            const oldIndex = children.findIndex((c: any) => c.id === active.id);
            const newIndex = children.findIndex((c: any) => c.id === over.id);
            newSpecs[parentIndex].children = arrayMove(children, oldIndex, newIndex);
          }
        }
        return { ...prev, specifications: newSpecs };
      }
      return prev;
    });
  };



  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updates: any = { [name]: value };
      if (name === 'name' && !isEdit) {
        updates.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      if (name === 'category') {
        const newTypes = CATEGORY_MAP[value] || [];
        updates.productType = newTypes[0] || '';
      }
      return { ...prev, ...updates };
    });
  };



  const handleAddSpec = () => {
    setFormData(prev => {
      const allKeys = getAllKeys(prev.specifications, '');
      const newKey = generateKey('New Characteristic', allKeys);
      return {
        ...prev,
        specifications: [
          ...prev.specifications,
          { id: `spec-${Math.random().toString(36).substr(2, 9)}`, label: 'New Characteristic', key: newKey, type: 'Text', icon: '' }
        ]
      };
    });
  };

  const updateSpec = (index: number, keyToUpdate: string, value: any) => {
    setFormData(prev => {
      const newSpecs = [...prev.specifications];
      newSpecs[index] = { ...newSpecs[index], [keyToUpdate]: value };
      
      if (keyToUpdate === 'label' && !newSpecs[index].isExisting) {
        const allKeys = getAllKeys(prev.specifications, newSpecs[index].id);
        newSpecs[index].key = generateKey(value, allKeys);
      }
      
      return { ...prev, specifications: newSpecs };
    });
  };

  const removeSpec = (index: number) => {
    setFormData(prev => ({ ...prev, specifications: prev.specifications.filter((_: any, i: number) => i !== index) }));
  };
  const addSubSpec = (parentIndex: number) => {
    setFormData(prev => {
      const newSpecs = [...prev.specifications];
      newSpecs[parentIndex] = { ...newSpecs[parentIndex] };
      newSpecs[parentIndex].children = newSpecs[parentIndex].children ? [...newSpecs[parentIndex].children] : [];
      
      const allKeys = getAllKeys(prev.specifications, '');
      const newKey = generateKey('New Sub Characteristic', allKeys);
      
      newSpecs[parentIndex].children.push({
        id: `subspec-${Math.random().toString(36).substr(2, 9)}`,
        label: 'New Sub Characteristic',
        key: newKey
      });
      return { ...prev, specifications: newSpecs };
    });
  };

  const updateSubSpec = (parentIndex: number, subIndex: number, keyToUpdate: string, value: any) => {
    setFormData(prev => {
      const newSpecs = [...prev.specifications];
      newSpecs[parentIndex] = { ...newSpecs[parentIndex] };
      const newChildren = [...newSpecs[parentIndex].children];
      newChildren[subIndex] = { ...newChildren[subIndex], [keyToUpdate]: value };
      
      if (keyToUpdate === 'label' && !newChildren[subIndex].isExisting) {
        const allKeys = getAllKeys(prev.specifications, newChildren[subIndex].id);
        newChildren[subIndex].key = generateKey(value, allKeys);
      }
      
      newSpecs[parentIndex].children = newChildren;
      return { ...prev, specifications: newSpecs };
    });
  };

  const removeSubSpec = (parentIndex: number, subIndex: number) => {
    setFormData(prev => {
      const newSpecs = [...prev.specifications];
      newSpecs[parentIndex] = { ...newSpecs[parentIndex] };
      newSpecs[parentIndex].children = newSpecs[parentIndex].children.filter((_: any, i: number) => i !== subIndex);
      return { ...prev, specifications: newSpecs };
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await api.put(`/categories/update/${initialData._id}`, formData);
      } else {
        await api.post('/categories/create', formData);
      }
      router.push('/AWIS/blueprint');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save blueprint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 pb-12">
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full lg:w-64 shrink-0 space-y-2 sticky top-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Blueprint' : 'New Blueprint'}</h2>
        
        <button type="button" onClick={() => setActiveTab('basic')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'basic' ? 'bg-blue-50 text-[var(--color-primary)]' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Box size={18} /> Basic Config
        </button>
        <button type="button" onClick={() => setActiveTab('specs')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'specs' ? 'bg-blue-50 text-[var(--color-primary)]' : 'text-gray-600 hover:bg-gray-50'}`}>
          <div className="flex items-center gap-3"><Settings size={18} /> Characteristics</div>
          <span className="bg-white/50 px-2 py-0.5 rounded-md text-xs">{formData.specifications.length}</span>
        </button>


        <div className="pt-8 space-y-3 border-t border-gray-100">
          <Button type="submit" isLoading={loading} className="w-full shadow-md">
            {isEdit ? 'Update Blueprint' : 'Create Blueprint'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()} className="w-full">Cancel</Button>
          {error && <p className="text-xs text-red-500 text-center font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
          {isEdit && (
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl mt-4">
              <p className="text-xs text-orange-800 font-bold flex items-center gap-1.5 mb-1"><AlertTriangle size={14}/> Schema Warning</p>
              <p className="text-[10px] text-orange-700 leading-tight">Modifying field keys may break existing product configurations.</p>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6">
        
        {/* BASIC INFO */}
        {activeTab === 'basic' && (
          <Card className="p-6 space-y-6 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Blueprint Configuration</h3>
            <div className="space-y-6">
              
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Blueprint Name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Motherboard" required />
                  <Input label="System Slug" name="slug" value={formData.slug} onChange={handleChange} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white shadow-sm focus:border-[var(--color-primary)]">
                      {Object.keys(CATEGORY_MAP).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Product Type</label>
                    <select name="productType" value={formData.productType} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white shadow-sm focus:border-[var(--color-primary)]">
                      {(CATEGORY_MAP[formData.category] || []).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        )}

        {/* CHARACTERISTICS */}
        {activeTab === 'specs' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Characteristics</h3>
                </div>
                <button type="button" onClick={handleAddSpec} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
                  <Plus size={16} /> Add Characteristic
                </button>
              </div>

              <div className="space-y-4">
                {formData.specifications.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSpecs}>
                    <SortableContext items={formData.specifications.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                      {formData.specifications.map((spec: any, index: number) => (
                        <SortableSpecCard key={spec.id} spec={spec} index={index} updateSpec={updateSpec} removeSpec={removeSpec} addSubSpec={addSubSpec} updateSubSpec={updateSubSpec} removeSubSpec={removeSubSpec} />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="py-8 text-center text-sm font-medium text-gray-500">
                    No characteristics added yet.
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}



      </div>
    </form>
  );
};
