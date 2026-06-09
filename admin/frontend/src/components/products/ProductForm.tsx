'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud, Box, Settings, Link as LinkIcon, Archive, Trash2, GripVertical, Plus, Star, Tag, AlertTriangle, Check, ChevronRight, Edit } from 'lucide-react';
import api from '@/utils/api';
import Link from 'next/link';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const TAG_COLORS = [
  { value: 'neutral', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'blue', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'green', classes: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'yellow', classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'red', classes: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'purple', classes: 'bg-purple-50 text-purple-700 border-purple-200' }
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const generateSlug = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const generateVariantSlug = (baseSlug: string, colorName: string) => {
  const colorSlug = generateSlug(colorName);
  return baseSlug && colorSlug ? `${baseSlug}-${colorSlug}` : '';
};

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

const parseImageItem = (img: any, i: number) => {
  const url = typeof img === 'string' ? img : (img.url || img.src || '');
  const isPrimary = typeof img === 'string' ? (i === 0) : (!!img.isPrimary || i === 0);
  const order = typeof img === 'string' ? i : (img.order ?? i);
  return {
    id: randomId('img'),
    preview: url.startsWith('http') ? url : `http://localhost:5001${url}`,
    url: url,
    isPrimary,
    order
  };
};

function initializeVariants(data: any): any[] {
  // New format: variants with colorName/colorHex/pricing/inventory/discounts
  if (data.variants?.length > 0 && data.variants[0].colorName) {
    return data.variants.map((v: any) => ({
      id: v.id || randomId('var'),
      colorName: v.colorName,
      colorHex: v.colorHex || '#000000',
      slug: v.slug || '',
      images: (v.gallery || v.images || []).map((img: any, i: number) => parseImageItem(img, i)),
      pricing: { price: v.pricing?.price || 0 },
      inventory: {
        warehouses: (v.inventory?.warehouses || []).map((w: any) => ({
          ...w, id: w.id || randomId('wh')
        }))
      },
      discounts: (v.discounts || []).map((d: any) => ({
        ...d,
        id: d.id || randomId('disc'),
        startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '',
        endDate: d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : ''
      }))
    }));
  }

  // Old format: variants with name/color/images
  if (data.variants?.length > 0) {
    return data.variants.map((v: any) => ({
      id: v.id || randomId('var'),
      colorName: v.name || 'Black',
      colorHex: v.color || '#000000',
      slug: data.slug ? generateVariantSlug(data.slug, v.name || 'Black') : '',
      images: (v.images || []).map((img: any, i: number) => parseImageItem(img, i)),
      pricing: { price: v.priceOverride || data.price || 0 },
      inventory: {
        warehouses: (data.inventory?.warehouses || []).map((w: any) => ({
          ...w, id: w.id || randomId('wh')
        }))
      },
      discounts: (data.discounts || []).map((d: any) => ({
        ...d,
        id: d.id || randomId('disc'),
        startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '',
        endDate: d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : ''
      }))
    }));
  }

  // No variants: create default
  return [{
    id: 'var-default',
    colorName: 'Black',
    colorHex: '#000000',
    slug: data.slug ? generateVariantSlug(data.slug, 'Black') : '',
    images: (data.images || []).map((url: string, i: number) => parseImageItem(url, i)),
    pricing: { price: data.price || 0 },
    inventory: { warehouses: [] },
    discounts: []
  }];
}

/* ═══════════════════════════════════════════════════════════
   SORTABLE SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

const SortableTag = ({ tag, index, updateTag, removeTag }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tag.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const colorClass = TAG_COLORS.find(c => c.value === tag.color)?.classes || TAG_COLORS[0].classes;

  return (
    <div ref={setNodeRef} style={style} className={`flex items-stretch rounded-full border text-xs font-bold transition-all shadow-sm overflow-hidden h-[26px] ${colorClass}`}>
      <div {...attributes} {...listeners} className="cursor-move flex items-center justify-center pl-2 pr-1 opacity-60 hover:opacity-100 transition-opacity">
        <GripVertical size={12} />
      </div>
      <input
        type="text"
        value={tag.label}
        onChange={(e) => updateTag(index, 'label', e.target.value)}
        className="outline-none min-w-[40px] bg-transparent text-inherit font-bold w-auto max-w-[120px]"
        style={{ width: `${Math.max(tag.label.length, 3) + 1}ch` }}
      />
      <div className="flex items-center px-1.5 gap-1.5 border-l border-black/10 bg-black/5">
        <div className="relative flex items-center justify-center cursor-pointer">
          <select value={tag.color} onChange={(e) => updateTag(index, 'color', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
            {TAG_COLORS.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
          </select>
          <div className={`w-2.5 h-2.5 rounded-full ${colorClass.split(' ')[0]} border border-black/10 shadow-sm pointer-events-none`}></div>
        </div>
        <button type="button" onClick={() => removeTag(index)} className="opacity-60 hover:opacity-100 hover:text-red-600 transition-colors flex items-center justify-center">
          <Trash2 size={12}/>
        </button>
      </div>
    </div>
  );
};

const SortableImage = ({ imgObj, index, removeMedia }: { imgObj: any, index: number, removeMedia: (type: any, index: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: imgObj.id });
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative aspect-square rounded-[18px] border border-gray-200 overflow-hidden bg-gray-50 group hover:shadow-md hover:border-gray-300 transition-all duration-300"
    >
      {/* Drag Handle Area */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
      />

      {/* Badges */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-md backdrop-blur-md shadow-sm border ${
          index === 0 
            ? 'bg-blue-500 text-white border-blue-400/30' 
            : 'bg-black/60 text-gray-200 border-white/10'
        }`}>
          {index === 0 ? 'PRIMARY' : `#${index + 1}`}
        </span>
      </div>

      {/* Image Container */}
      <div className="w-full h-full flex items-center justify-center relative bg-white">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        )}
        {imageError ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Box size={24} className="text-gray-300 mb-1" />
            <span className="text-[10px] text-gray-400 font-medium">Failed to load</span>
          </div>
        ) : (
          <img 
            src={imgObj.preview} 
            alt="" 
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`} 
          />
        )}
      </div>

      {/* Action Overlay */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
      
      <div className="absolute top-3 right-3 z-30">
        <button 
          type="button" 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { 
            e.stopPropagation(); 
            removeMedia('images', index); 
          }} 
          className="w-7 h-7 flex items-center justify-center bg-white/95 hover:bg-red-600 text-gray-600 hover:text-white rounded-lg shadow-sm border border-gray-100 transition-all duration-200 transform hover:scale-105"
          title="Delete Image"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

const SortableHighlight = ({ hl, index, updateHighlight, removeHighlight }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: hl.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const preview = URL.createObjectURL(file);
      updateHighlight(index, 'iconPreview', preview);
      updateHighlight(index, 'icon', data.url);
    } catch (err) {
      console.error('Failed to upload icon', err);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex items-stretch transition-all hover:border-gray-300 relative group min-h-[90px]">
      <div {...attributes} {...listeners} className="w-10 bg-gray-50/50 border-r border-gray-100 flex items-center justify-center cursor-move text-gray-300 hover:text-gray-500 transition-colors shrink-0">
        <GripVertical size={16} />
      </div>
      <div className="flex-1 flex items-center p-3 gap-4 min-w-0">
        <div className="w-16 h-16 shrink-0 bg-[#f3f4f6] border border-gray-100 rounded-[18px] flex items-center justify-center overflow-hidden relative cursor-pointer hover:border-[var(--color-primary)] hover:bg-blue-50/50 transition-colors group/icon">
          {hl.iconPreview || hl.icon ? <img src={hl.iconPreview || `http://localhost:5001${hl.icon}`} alt="" className="w-full h-full object-contain block z-10 pointer-events-none p-1" /> : <UploadCloud size={20} className="text-gray-400 group-hover/icon:text-[var(--color-primary)] transition-colors z-10 pointer-events-none" />}
          <input type="file" accept="image/png, image/svg+xml, image/jpeg, image/webp" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleIconUpload} />
        </div>
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <input type="text" value={hl.title} onChange={(e) => updateHighlight(index, 'title', e.target.value)} placeholder="Feature Title" className="text-base font-semibold text-gray-900 bg-transparent outline-none w-full placeholder:text-gray-300 transition-colors pb-0.5" />
          <textarea value={hl.description} onChange={(e) => updateHighlight(index, 'description', e.target.value)} placeholder="Short description..." className="text-sm text-gray-500 bg-transparent outline-none resize-none w-full placeholder:text-gray-300 transition-colors leading-snug" rows={2} />
        </div>
      </div>
      <div className="w-12 shrink-0 flex items-center justify-center border-l border-gray-100/50 bg-gray-50/30">
        <button type="button" onClick={() => removeHighlight(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={16}/>
        </button>
      </div>
    </div>
  );
};

const SortableCompCard = ({ card, index, updateCompCard, removeCompCard, handleDragEndTags, updateTag, removeTag, handleAddTag, sensors }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:border-gray-300">
      <div className="flex items-stretch">
        <div {...attributes} {...listeners} className="w-10 bg-gray-50/50 border-r border-gray-100 flex items-center justify-center cursor-move text-gray-300 hover:text-gray-500 transition-colors shrink-0">
          <GripVertical size={16} />
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-center gap-3 mb-3">
            <input type="text" value={card.title} onChange={(e) => updateCompCard(index, 'title', e.target.value)} placeholder="Rule name..." className="flex-1 text-base font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-300" />
            <button type="button" onClick={() => removeCompCard(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={16}/>
            </button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => handleDragEndTags(index, e)}>
            <SortableContext items={card.tags?.map((t: any) => t.id) || []} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-2 items-center">
                {(card.tags || []).map((tag: any, tagIndex: number) => (
                  <SortableTag key={tag.id} tag={tag} index={tagIndex} updateTag={(ti: number, k: string, v: any) => updateTag(index, ti, k, v)} removeTag={(ti: number) => removeTag(index, ti)} />
                ))}
                <button type="button" onClick={() => handleAddTag(index)} className="h-[26px] px-2 rounded-full border border-dashed border-gray-300 text-gray-400 text-xs font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1">
                  <Plus size={12} /> Tag
                </button>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   VARIANT TAB SELECTOR COMPONENT
   ═══════════════════════════════════════════════════════════ */

const VariantTabSelector = ({ 
  variants, 
  activeVariantId, 
  onSelect, 
  showAdd, 
  onAdd,
  onEdit,
  onDelete
}: {
  variants: any[], 
  activeVariantId: string, 
  onSelect: (id: string) => void, 
  showAdd?: boolean, 
  onAdd?: () => void,
  onEdit?: (v: any) => void,
  onDelete?: (id: string) => void
}) => (
  <div className="flex flex-wrap items-center gap-3 pb-5 mb-5 border-b border-gray-100">
    {variants.map((v: any) => {
      const isActive = activeVariantId === v.id;
      return (
        <div
          key={v.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(v.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(v.id);
            }
          }}
          className={`flex items-center justify-between h-12 px-4 rounded-xl border transition-all duration-200 cursor-pointer select-none group min-w-[220px] bg-white outline-none ${
            isActive
              ? 'border-blue-500 ring-2 ring-blue-50 shadow-sm text-gray-950 font-semibold'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50/50 hover:text-gray-900'
          }`}
        >
          {/* Color Dot & Name */}
          <div className="flex items-center gap-2.5">
            <span 
              className="w-3 h-3 rounded-full border border-gray-200/50 shadow-sm shrink-0" 
              style={{ backgroundColor: v.colorHex }} 
            />
            <span className="text-sm font-medium">{v.colorName}</span>
          </div>

          {/* Action Icons */}
          {(onEdit || (onDelete && variants.length > 1)) && (
            <div className="flex items-center gap-1.5 ml-4">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(v);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
                  title="Edit Color"
                >
                  <Edit size={14} />
                </button>
              )}
              {onDelete && variants.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(v.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                  title="Delete Variant"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      );
    })}
    {showAdd && onAdd && (
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/30 transition-all font-semibold shadow-sm bg-white min-w-[140px]"
      >
        <Plus size={16} /> Add Color
      </button>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PRODUCT FORM COMPONENT
   ═══════════════════════════════════════════════════════════ */

export const ProductForm = ({ initialData = {}, isEdit = false }: { initialData?: any, isEdit?: boolean }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  /* ─── FORM STATE ─── */
  const [formData, setFormData] = useState(() => ({
    title: initialData.title || initialData.name || '',
    slug: initialData.slug || '',
    description: initialData.description || '',
    category: initialData.category || '',
    blueprintId: initialData.blueprintId || '',
    status: initialData.status || 'Draft',
    publishing: {
      publishAt: initialData.publishing?.publishAt
        ? new Date(initialData.publishing.publishAt).toISOString().split('T')[0]
        : ''
    },
    specifications: initialData.specifications || initialData.specs || {},
    highlights: (initialData.highlights || []).map((h: any) => ({
      ...h,
      id: h.id || randomId('hl')
    })),
    compatibility: (initialData.compatibility || initialData.compatibilityCards || []).map((c: any) => ({
      ...c,
      id: c.id || randomId('card'),
      tags: (c.tags || []).map((t: any) => ({
        ...t,
        id: t.id || randomId('tag')
      }))
    })),
    media: {
      models: initialData.media?.models || [],
      videos: initialData.media?.videos || [],
      documents: initialData.media?.documents || []
    },
    variants: initializeVariants(initialData)
  }));

  /* ─── UI STATE ─── */
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploading3D, setUploading3D] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string>('');
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [discountTab, setDiscountTab] = useState<'active_planned' | 'archived'>('active_planned');
  const [newDiscount, setNewDiscount] = useState({ name: '', value: '' as any, startDate: '', endDate: '' });

  /* ─── DnD SENSORS ─── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ─── DERIVED STATE ─── */
  const selectedCategoryObj = categories.find((c: any) => c.name === formData.category);
  const activeVariant = formData.variants.find((v: any) => v.id === activeVariantId);

  const getActiveVariantField = (field: string) => {
    const v = formData.variants.find((v: any) => v.id === activeVariantId);
    return v ? (v as any)[field] : undefined;
  };

  /* ─── VALIDATION ─── */
  const validateForm = useCallback(() => {
    const errors: Record<string, string[]> = {
      basicInfo: [], media: [], pricing: [], characteristics: [], highlights: [], compatibility: []
    };

    if (!formData.title.trim()) errors.basicInfo.push('Product Name is required');
    if (!formData.slug.trim()) errors.basicInfo.push('System Slug is required');
    if (!formData.publishing.publishAt) errors.basicInfo.push('Publishing Schedule is required');
    if (!formData.description.trim()) errors.basicInfo.push('Rich Description is required');

    formData.variants.forEach((v: any) => {
      if (!v.images || v.images.length === 0) {
        errors.media.push(`"${v.colorName}" variant needs at least 1 image`);
      }
    });

    formData.variants.forEach((v: any) => {
      if (!v.pricing.price || Number(v.pricing.price) <= 0) {
        errors.pricing.push(`"${v.colorName}" variant needs a price`);
      }
      const totalQty = (v.inventory?.warehouses || []).reduce((s: number, w: any) => s + (Number(w.quantity) || 0), 0);
      if (totalQty <= 0) {
        errors.pricing.push(`"${v.colorName}" variant needs inventory`);
      }
    });

    if (formData.highlights.length === 0) {
      errors.highlights.push('At least 1 highlight is required');
    } else if (formData.highlights.some((h: any) => !h.title?.trim())) {
      errors.highlights.push('All highlights must have a title');
    }

    if (formData.compatibility.length === 0) {
      errors.compatibility.push('At least 1 compatibility rule is required');
    } else if (formData.compatibility.some((c: any) => !c.title?.trim())) {
      errors.compatibility.push('All rules must have a title');
    }

    return errors;
  }, [formData]);

  const validationErrors = useMemo(() => validateForm(), [validateForm]);
  const isFormValid = useMemo(() => Object.values(validationErrors).every((arr: any) => arr.length === 0), [validationErrors]);

  /* ─── EFFECTS ─── */
  useEffect(() => {
    if (formData.variants.length > 0 && !activeVariantId) {
      setActiveVariantId(formData.variants[0].id);
    }
  }, [formData.variants, activeVariantId]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data);
        if (!isEdit && data.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: data[0].name, blueprintId: data[0]._id }));
        }
      } catch (err) {}
    };
    fetchCategories();
  }, [isEdit]);

  /* ─── BASIC HANDLERS ─── */
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updates: any = { [name]: type === 'checkbox' ? checked : value };
      if (name === 'title' && !isEdit) {
        updates.slug = generateSlug(value);
      }
      if (name === 'category') {
        const cat = categories.find((c: any) => c.name === value);
        if (cat) updates.blueprintId = cat._id;
      }
      return { ...prev, ...updates };
    });
  };

  const handleSpecChange = (parentKey: string, childKey: string | null, value: any) => {
    setFormData(prev => {
      if (childKey) {
        return { ...prev, specifications: { ...prev.specifications, [parentKey]: { ...(prev.specifications[parentKey] || {}), [childKey]: value } } };
      }
      return { ...prev, specifications: { ...prev.specifications, [parentKey]: value } };
    });
  };

  /* ─── IMAGE HANDLERS ─── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, is3D: boolean) => {
    if (!e.target.files?.length) return;
    if (is3D) setUploading3D(true); else setUploadingImages(true);

    const uploadedUrls = { images: [] as any[], models: [] as string[], videos: [] as string[], documents: [] as string[] };
    try {
      for (const file of Array.from(e.target.files)) {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const preview = URL.createObjectURL(file);
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext!)) uploadedUrls.images.push({ id: randomId('img'), preview, url: data.url, isPrimary: false, order: 0 });
        else if (['glb', 'gltf', 'obj', 'fbx'].includes(ext!)) uploadedUrls.models.push(data.url);
        else if (['mp4', 'webm'].includes(ext!)) uploadedUrls.videos.push(data.url);
        else uploadedUrls.documents.push(data.url);
      }

      setFormData(prev => {
        const newVariants = prev.variants.map((v: any) => {
          if (v.id === activeVariantId && !is3D) {
            const currentCount = v.images?.length || 0;
            const newImages = uploadedUrls.images.map((img: any, idx: number) => ({
              ...img,
              isPrimary: currentCount === 0 && idx === 0,
              order: currentCount + idx
            }));
            return { ...v, images: [...(v.images || []), ...newImages] };
          }
          return v;
        });
        return {
          ...prev, variants: newVariants,
          media: { ...prev.media, models: [...prev.media.models, ...uploadedUrls.models], videos: [...prev.media.videos, ...uploadedUrls.videos], documents: [...prev.media.documents, ...uploadedUrls.documents] }
        };
      });
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      if (is3D) setUploading3D(false); else setUploadingImages(false);
    }
  };

  const removeMedia = (type: 'images' | 'models' | 'videos' | 'documents', index: number) => {
    setFormData(prev => {
      if (type === 'images') {
        const newVariants = prev.variants.map((v: any) => {
          if (v.id === activeVariantId) {
            const filtered = v.images.filter((_: any, i: number) => i !== index);
            const updated = filtered.map((img: any, i: number) => ({ ...img, isPrimary: i === 0, order: i }));
            return { ...v, images: updated };
          }
          return v;
        });
        return { ...prev, variants: newVariants };
      }
      return { ...prev, media: { ...prev.media, [type]: prev.media[type].filter((_: any, i: number) => i !== index) } };
    });
  };

  /* ─── DRAG END HANDLERS ─── */
  const handleDragEndImages = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.map((v: any) => {
          if (v.id === activeVariantId) {
            const oldIdx = v.images.findIndex((img: any) => img.id === active.id);
            const newIdx = v.images.findIndex((img: any) => img.id === over.id);
            const reordered = arrayMove(v.images, oldIdx, newIdx).map((img: any, i: number) => ({ ...img, isPrimary: i === 0, order: i }));
            return { ...v, images: reordered };
          }
          return v;
        })
      }));
    }
  };

  const handleDragEndHighlights = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIdx = prev.highlights.findIndex((h: any) => h.id === active.id);
        const newIdx = prev.highlights.findIndex((h: any) => h.id === over.id);
        return { ...prev, highlights: arrayMove(prev.highlights, oldIdx, newIdx) };
      });
    }
  };

  const handleDragEndCards = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIdx = prev.compatibility.findIndex((c: any) => c.id === active.id);
        const newIdx = prev.compatibility.findIndex((c: any) => c.id === over.id);
        return { ...prev, compatibility: arrayMove(prev.compatibility, oldIdx, newIdx) };
      });
    }
  };

  const handleDragEndTags = (cardIndex: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const newCards = prev.compatibility.map((c: any, i: number) => {
          if (i === cardIndex) {
            const tags = [...c.tags];
            const oldIdx = tags.findIndex((t: any) => t.id === active.id);
            const newIdx = tags.findIndex((t: any) => t.id === over.id);
            return { ...c, tags: arrayMove(tags, oldIdx, newIdx) };
          }
          return c;
        });
        return { ...prev, compatibility: newCards };
      });
    }
  };

  /* ─── VARIANT MANAGEMENT ─── */
  const openNewVariantModal = () => {
    setEditingVariant({ colorName: '', colorHex: '#000000' });
    setIsVariantModalOpen(true);
  };

  const openEditVariantModal = (variant: any) => {
    setEditingVariant({ id: variant.id, colorName: variant.colorName, colorHex: variant.colorHex });
    setIsVariantModalOpen(true);
  };

  const saveVariant = () => {
    if (!editingVariant?.colorName?.trim()) return;
    setFormData(prev => {
      const newV = [...prev.variants];
      if (editingVariant.id) {
        const idx = newV.findIndex((v: any) => v.id === editingVariant.id);
        if (idx > -1) newV[idx] = { ...newV[idx], colorName: editingVariant.colorName, colorHex: editingVariant.colorHex };
      } else {
        const newId = randomId('var');
        newV.push({
          id: newId,
          colorName: editingVariant.colorName,
          colorHex: editingVariant.colorHex,
          slug: '',
          images: [],
          pricing: { price: 0 },
          inventory: { warehouses: [] },
          discounts: []
        });
        setActiveVariantId(newId);
      }
      return { ...prev, variants: newV };
    });
    setIsVariantModalOpen(false);
  };

  const deleteVariant = (variantId: string) => {
    if (formData.variants.length <= 1) return;
    setFormData(prev => {
      const filtered = prev.variants.filter((v: any) => v.id !== variantId);
      if (activeVariantId === variantId) setActiveVariantId(filtered[0]?.id || '');
      return { ...prev, variants: filtered };
    });
  };

  /* ─── VARIANT-SCOPED: PRICING ─── */
  const updateVariantPrice = (value: string) => {
    const clean = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v: any) =>
        v.id === activeVariantId ? { ...v, pricing: { ...v.pricing, price: clean } } : v
      )
    }));
  };

  /* ─── VARIANT-SCOPED: WAREHOUSES ─── */
  const addWarehouse = () => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v: any) =>
        v.id === activeVariantId
          ? { ...v, inventory: { ...v.inventory, warehouses: [...v.inventory.warehouses, { id: randomId('wh'), name: '', quantity: 0, reserved: 0 }] } }
          : v
      )
    }));
  };

  const updateWarehouse = (whIndex: number, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v: any) =>
        v.id === activeVariantId
          ? { ...v, inventory: { ...v.inventory, warehouses: v.inventory.warehouses.map((wh: any, i: number) => i === whIndex ? { ...wh, [key]: value } : wh) } }
          : v
      )
    }));
  };

  const removeWarehouse = (whIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v: any) =>
        v.id === activeVariantId
          ? { ...v, inventory: { ...v.inventory, warehouses: v.inventory.warehouses.filter((_: any, i: number) => i !== whIndex) } }
          : v
      )
    }));
  };

  /* ─── VARIANT-SCOPED: DISCOUNTS ─── */
  const addDiscount = () => {
    if (!newDiscount.name || !newDiscount.value || !newDiscount.startDate || !newDiscount.endDate) return;
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v: any) =>
        v.id === activeVariantId
          ? { ...v, discounts: [...v.discounts, { id: randomId('disc'), ...newDiscount, isEnabled: true }] }
          : v
      )
    }));
    setNewDiscount({ name: '', value: '' as any, startDate: '', endDate: '' });
  };

  const removeDiscount = (discountId: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v: any) =>
        v.id === activeVariantId
          ? { ...v, discounts: v.discounts.filter((d: any) => d.id !== discountId) }
          : v
      )
    }));
  };

  const toggleDiscount = (discountId: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v: any) => {
        if (v.id !== activeVariantId) return v;
        const target = v.discounts.find((d: any) => d.id === discountId);
        if (!target) return v;
        const willEnable = !target.isEnabled;
        return {
          ...v,
          discounts: v.discounts.map((d: any) => {
            if (d.id === discountId) return { ...d, isEnabled: willEnable };
            if (willEnable && d.isEnabled) return { ...d, isEnabled: false };
            return d;
          })
        };
      })
    }));
  };

  /* ─── DISCOUNT HELPERS ─── */
  const getDiscountStatus = (d: any) => {
    if (!d.isEnabled) return 'DISABLED';
    const today = new Date().toISOString().split('T')[0];
    if (today >= d.startDate && today <= d.endDate) return 'ACTIVE';
    if (today < d.startDate) return 'PLANNED';
    return 'ARCHIVED';
  };

  const getTimelineText = (d: any, status: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(d.startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(d.endDate); end.setHours(0, 0, 0, 0);
    const diffDays = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);
    if (status === 'ACTIVE') { const days = diffDays(today, end); return days === 0 ? 'Ends today' : `Ends in ${days} day${days !== 1 ? 's' : ''}`; }
    if (status === 'PLANNED') { const days = diffDays(today, start); return days === 0 ? 'Starts today' : days === 1 ? 'Starts tomorrow' : `Starts in ${days} days`; }
    if (status === 'ARCHIVED' || status === 'DISABLED') { const days = diffDays(end, today); if (days < 0) return 'Disabled manually'; return days === 0 ? 'Ended today' : `Ended ${days} day${days !== 1 ? 's' : ''} ago`; }
    return '';
  };

  /* ─── GLOBAL: HIGHLIGHTS ─── */
  const handleAddHighlight = () => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, { id: randomId('hl'), title: '', description: '', icon: '' }]
    }));
  };

  const updateHighlight = (index: number, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.map((h: any, i: number) => i === index ? { ...h, [key]: value } : h)
    }));
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_: any, i: number) => i !== index)
    }));
  };

  /* ─── GLOBAL: COMPATIBILITY ─── */
  const handleAddCompCard = () => {
    setFormData(prev => ({
      ...prev,
      compatibility: [...prev.compatibility, { id: randomId('card'), title: '', tags: [] }]
    }));
  };

  const updateCompCard = (index: number, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      compatibility: prev.compatibility.map((c: any, i: number) => i === index ? { ...c, [key]: value } : c)
    }));
  };

  const removeCompCard = (index: number) => {
    setFormData(prev => ({
      ...prev,
      compatibility: prev.compatibility.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleAddTag = (cardIndex: number) => {
    setFormData(prev => ({
      ...prev,
      compatibility: prev.compatibility.map((c: any, i: number) =>
        i === cardIndex ? { ...c, tags: [...c.tags, { id: randomId('tag'), label: 'New Tag', color: 'neutral' }] } : c
      )
    }));
  };

  const updateTag = (cardIndex: number, tagIndex: number, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      compatibility: prev.compatibility.map((c: any, ci: number) => {
        if (ci !== cardIndex) return c;
        const newTags = c.tags.map((t: any, ti: number) => ti === tagIndex ? { ...t, [key]: value } : t);
        return { ...c, tags: newTags };
      })
    }));
  };

  const removeTag = (cardIndex: number, tagIndex: number) => {
    setFormData(prev => ({
      ...prev,
      compatibility: prev.compatibility.map((c: any, ci: number) =>
        ci === cardIndex ? { ...c, tags: c.tags.filter((_: any, ti: number) => ti !== tagIndex) } : c
      )
    }));
  };

  /* ─── SUBMIT ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    setSaveError(null);

    if (!isFormValid) return;
    setLoading(true);

    try {
      const publishAt = formData.publishing.publishAt ? new Date(formData.publishing.publishAt).toISOString() : null;
      const finalStatus = isEdit ? formData.status : 'Draft';

      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        blueprintId: formData.blueprintId,
        status: finalStatus,
        publishing: { isScheduled: !!publishAt, publishAt },
        specifications: formData.specifications,
        highlights: formData.highlights.map((h: any) => ({ id: h.id, title: h.title, description: h.description, icon: h.icon })),
        compatibility: formData.compatibility.map((c: any) => ({ id: c.id, title: c.title, tags: c.tags.map((t: any) => ({ id: t.id, label: t.label, color: t.color })) })),
        media: formData.media,
        variants: formData.variants.map((v: any) => ({
          id: v.id,
          colorName: v.colorName,
          colorHex: v.colorHex,
          slug: generateVariantSlug(formData.slug, v.colorName),
          gallery: (v.images || []).map((img: any) => ({ url: img.url, isPrimary: img.isPrimary, order: img.order })),
          pricing: { price: Number(v.pricing.price) || 0 },
          inventory: { warehouses: (v.inventory.warehouses || []).map((w: any) => ({ id: w.id, name: w.name, quantity: Number(w.quantity) || 0, reserved: Number(w.reserved) || 0 })) },
          discounts: v.discounts.map((d: any) => ({ id: d.id, name: d.name, value: Number(d.value), startDate: d.startDate, endDate: d.endDate, isEnabled: d.isEnabled }))
        }))
      };

      if (isEdit) {
        await api.put(`/products/update/${initialData._id}`, payload);
      } else {
        await api.post('/products/create', payload);
      }
      router.push('/AWIS/products');
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  /* ─── COMPUTED DISCOUNT DATA ─── */
  const variantDiscounts = activeVariant?.discounts || [];
  const activeList = variantDiscounts.filter((d: any) => { const s = getDiscountStatus(d); return s === 'ACTIVE' || s === 'PLANNED'; }).sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const archivedList = variantDiscounts.filter((d: any) => { const s = getDiscountStatus(d); return s === 'ARCHIVED' || s === 'DISABLED'; }).sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  /* ─── COMPUTED INVENTORY ─── */
  const variantWarehouses = activeVariant?.inventory?.warehouses || [];
  const totalQuantity = variantWarehouses.reduce((acc: number, w: any) => acc + (Number(w.quantity) || 0), 0);
  const totalReserved = variantWarehouses.reduce((acc: number, w: any) => acc + (Number(w.reserved) || 0), 0);

  /* ─── TAB CONFIG ─── */
  const tabs = [
    { key: 'basic', icon: <Box size={18} />, label: 'Basic Info', errorKey: 'basicInfo' },
    { key: 'media', icon: <UploadCloud size={18} />, label: 'Colors & Gallery', errorKey: 'media' },
    { key: 'pricing', icon: <Archive size={18} />, label: 'Pricing & Inventory', errorKey: 'pricing' },
    { key: 'discounts', icon: <Tag size={18} />, label: 'Discounts', errorKey: '' },
    { key: 'specs', icon: <Settings size={18} />, label: 'Characteristics', errorKey: 'characteristics' },
    { key: 'highlights', icon: <Star size={18} />, label: 'Key Highlights', errorKey: 'highlights' },
    { key: 'compatibility', icon: <LinkIcon size={18} />, label: 'Compatibility', errorKey: 'compatibility' },
  ];

  /* ─── DISCOUNT CARD RENDERER ─── */
  const renderDiscountCard = (d: any) => {
    const status = getDiscountStatus(d);
    const timeline = getTimelineText(d, status);
    const variantPrice = Number(activeVariant?.pricing?.price) || 0;
    const discountedPrice = variantPrice - (variantPrice * (d.value / 100));

    return (
      <div key={d.id} className={`rounded-xl border overflow-hidden transition-all ${status === 'ACTIVE' ? 'border-green-200 bg-green-50/30 shadow-sm' : status === 'PLANNED' ? 'border-blue-100 bg-blue-50/20' : 'border-gray-200 bg-gray-50/50 opacity-70'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${status === 'ACTIVE' ? 'bg-green-100 text-green-700' : status === 'PLANNED' ? 'bg-blue-100 text-blue-700' : status === 'DISABLED' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500'}`}>{status}</span>
              <span className="text-sm font-bold text-gray-900">{d.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {(status === 'ACTIVE' || status === 'PLANNED' || status === 'DISABLED') && (
                <button type="button" onClick={() => toggleDiscount(d.id)} className={`relative w-10 h-5 rounded-full transition-colors ${d.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${d.isEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              )}
              {status !== 'ACTIVE' && (
                <button type="button" onClick={() => removeDiscount(d.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{timeline}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-500">-{d.value}%</span>
              {variantPrice > 0 && <span className="font-bold text-gray-700">${discountedPrice.toFixed(2)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
            <span>{d.startDate}</span>
            <ChevronRight size={12} />
            <span>{d.endDate}</span>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <>
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 pb-12">

      {/* ── SIDEBAR ── */}
      <div className="w-full lg:w-64 shrink-0 space-y-2 sticky top-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/AWIS/products" className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ArrowLeft size={20} /></Link>
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h2>
        </div>

        {tabs.map(tab => {
          const errs = tab.errorKey ? (validationErrors as any)[tab.errorKey] || [] : [];
          return (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab.key ? 'bg-blue-50 text-[var(--color-primary)]' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">{tab.icon} {tab.label}</div>
              {showValidation && errs.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{errs.length}</span>
              )}
            </button>
          );
        })}

        <div className="pt-8 space-y-3 border-t border-gray-100">
          <Button type="submit" isLoading={loading} disabled={showValidation && !isFormValid} className={`w-full shadow-md transition-all ${showValidation && !isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()} className="w-full">Cancel</Button>

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-700 font-bold flex items-center gap-1.5"><AlertTriangle size={14}/> {saveError}</p>
            </div>
          )}

          {showValidation && !isFormValid && (
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl space-y-1">
              <p className="text-xs text-orange-800 font-bold flex items-center gap-1.5 mb-1"><AlertTriangle size={14}/> Validation Required</p>
              {Object.entries(validationErrors).map(([section, errs]: any) =>
                errs.map((err: string, i: number) => (
                  <p key={`${section}-${i}`} className="text-[10px] text-orange-700 leading-tight">• {err}</p>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 space-y-6">

        {/* ══════ BASIC INFO TAB ══════ */}
        {activeTab === 'basic' && (
          <Card className="p-6 space-y-6 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Input label="Product Name" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., RTX 5070 AORUS Master" required />
                {showValidation && !formData.title.trim() && <p className="text-xs text-red-500 font-medium">Product Name is required</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white shadow-sm focus:border-[var(--color-primary)] text-sm">
                  {categories.map((cat: any) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Input label="System Slug" name="slug" value={formData.slug} onChange={handleChange} required />
                {showValidation && !formData.slug.trim() && <p className="text-xs text-red-500 font-medium">System Slug is required</p>}
                {formData.variants.length > 0 && formData.slug && (
                  <div className="mt-1 space-y-0.5">
                    {formData.variants.map((v: any) => (
                      <p key={v.id} className="text-[10px] text-gray-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v.colorHex }} />
                        {generateVariantSlug(formData.slug, v.colorName) || '...'}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Input label="Publishing Schedule" name="publishing.publishAt" type="date" value={formData.publishing.publishAt} onChange={(e: any) => setFormData(prev => ({ ...prev, publishing: { ...prev.publishing, publishAt: e.target.value } }))} required />
                {showValidation && !formData.publishing.publishAt && <p className="text-xs text-red-500 font-medium">Publishing date is required</p>}
              </div>
            </div>



            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Rich Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe this product..." rows={5} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none shadow-sm focus:border-[var(--color-primary)] text-sm resize-none transition-colors" />
              {showValidation && !formData.description.trim() && <p className="text-xs text-red-500 font-medium">Description is required</p>}
            </div>
          </Card>
        )}

        {/* ══════ COLORS & GALLERY TAB ══════ */}
        {activeTab === 'media' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                <h3 className="text-lg font-bold text-gray-900">Color Variants</h3>
              </div>

              <VariantTabSelector 
                variants={formData.variants} 
                activeVariantId={activeVariantId} 
                onSelect={setActiveVariantId} 
                showAdd 
                onAdd={openNewVariantModal} 
                onEdit={openEditVariantModal}
                onDelete={deleteVariant}
              />

              {/* Gallery Upload */}
              <h4 className="text-sm font-bold text-gray-700 mb-3">Gallery — <span className="text-gray-400 font-normal">{activeVariant?.colorName} {activeVariant && `(${generateVariantSlug(formData.slug, activeVariant.colorName)})`}</span></h4>
              {showValidation && activeVariant && (!activeVariant.images || activeVariant.images.length === 0) && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs text-red-600 font-medium">This variant needs at least 1 image</p></div>
              )}

              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[var(--color-primary)] hover:bg-blue-50/30 transition-colors relative cursor-pointer">
                <input type="file" multiple accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileUpload(e, false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {uploadingImages ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mb-2"></div>
                    <p className="text-sm font-semibold text-gray-700">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={36} className="mx-auto text-[var(--color-primary)] mb-3" />
                    <p className="text-sm font-bold text-gray-900 mb-1">Upload Gallery Images</p>
                    <p className="text-xs text-gray-500">JPG, PNG, WEBP • Drag & drop or click</p>
                  </>
                )}
              </div>

              {activeVariant?.images?.length > 0 && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndImages}>
                  <SortableContext items={activeVariant.images.map((img: any) => img.id)} strategy={horizontalListSortingStrategy}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {activeVariant.images.map((imgObj: any, i: number) => (
                        <SortableImage key={imgObj.id} imgObj={imgObj} index={i} removeMedia={removeMedia} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </Card>

            {/* 3D Files (Global) */}
            <Card className="p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-5">3D Files <span className="text-xs font-normal text-gray-400">(shared across all variants)</span></h3>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[var(--color-primary)] hover:bg-blue-50/30 transition-colors relative cursor-pointer">
                <input type="file" multiple accept=".glb,.gltf,.obj,.fbx" onChange={(e) => handleFileUpload(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {uploading3D ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mb-2"></div>
                    <p className="text-sm font-semibold text-gray-700">Uploading 3D...</p>
                  </div>
                ) : (
                  <>
                    <Box size={28} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-bold text-gray-700">Upload 3D Models</p>
                    <p className="text-xs text-gray-400">GLB, GLTF, FBX, OBJ</p>
                  </>
                )}
              </div>
              {formData.media.models.length > 0 && (
                <div className="space-y-2 mt-4">
                  {formData.media.models.map((url: string, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 border border-gray-100">
                      <p className="text-xs text-gray-600 truncate flex-1 font-mono">{url}</p>
                      <button type="button" onClick={() => removeMedia('models', i)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ══════ PRICING & INVENTORY TAB ══════ */}
        {activeTab === 'pricing' && (
          <Card className="p-6 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-2">Pricing & Inventory</h3>
            <VariantTabSelector variants={formData.variants} activeVariantId={activeVariantId} onSelect={setActiveVariantId} />

            {activeVariant && (
              <div className="space-y-6">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Price ($) — {activeVariant.colorName}</label>
                  <input type="text" inputMode="decimal" value={activeVariant.pricing.price} onChange={(e) => updateVariantPrice(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none shadow-sm focus:border-[var(--color-primary)] text-lg font-bold transition-colors" />
                  {showValidation && (!activeVariant.pricing.price || Number(activeVariant.pricing.price) <= 0) && (
                    <p className="text-xs text-red-500 font-medium">Price is required</p>
                  )}
                </div>

                {/* Computed Totals */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Quantity</p>
                    <p className="text-2xl font-bold text-gray-900">{totalQuantity}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Reserved</p>
                    <p className="text-2xl font-bold text-gray-900">{totalReserved}</p>
                  </div>
                </div>
                {showValidation && totalQuantity <= 0 && (
                  <p className="text-xs text-red-500 font-medium">This variant needs inventory. Add a warehouse below.</p>
                )}

                {/* Warehouses */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-700">Warehouses — {activeVariant.colorName}</h4>
                    <button type="button" onClick={addWarehouse} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
                      <Plus size={14} /> Add Warehouse
                    </button>
                  </div>

                  {variantWarehouses.length > 0 ? (
                    <div className="space-y-3">
                      {variantWarehouses.map((wh: any, i: number) => (
                        <div key={wh.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-end gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                            <input type="text" value={wh.name} onChange={(e) => updateWarehouse(i, 'name', e.target.value)} placeholder="e.g., Main Warehouse" className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm focus:border-[var(--color-primary)]" />
                          </div>
                          <div className="w-28">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Quantity</label>
                            <input type="number" value={wh.quantity} onChange={(e) => updateWarehouse(i, 'quantity', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm focus:border-[var(--color-primary)]" />
                          </div>
                          <div className="w-28">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Reserved</label>
                            <input type="number" value={wh.reserved} onChange={(e) => updateWarehouse(i, 'reserved', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm focus:border-[var(--color-primary)]" />
                          </div>
                          <button type="button" onClick={() => removeWarehouse(i)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm font-medium text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                      No warehouses added for this variant.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ══════ DISCOUNTS TAB ══════ */}
        {activeTab === 'discounts' && (
          <Card className="p-6 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-2">Discounts</h3>
            <VariantTabSelector variants={formData.variants} activeVariantId={activeVariantId} onSelect={setActiveVariantId} />

            {activeVariant && (() => {
              const variantPrice = Number(activeVariant.pricing.price) || 0;
              const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split('T')[0];

              return (
                <div className="space-y-6">
                  {/* Create Discount */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
                    <h4 className="text-sm font-bold text-gray-700">New Discount — {activeVariant.colorName}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Discount Name" value={newDiscount.name} onChange={(e: any) => setNewDiscount(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Summer Sale" />
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Discount (%)</label>
                        <input type="number" min={1} max={99} value={newDiscount.value} onChange={(e) => setNewDiscount(p => ({ ...p, value: e.target.value }))} placeholder="10" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none shadow-sm focus:border-[var(--color-primary)] text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Start Date" type="date" value={newDiscount.startDate} onChange={(e: any) => setNewDiscount(p => ({ ...p, startDate: e.target.value }))} min={tomorrowStr} />
                      <Input label="End Date" type="date" value={newDiscount.endDate} onChange={(e: any) => setNewDiscount(p => ({ ...p, endDate: e.target.value }))} min={newDiscount.startDate || tomorrowStr} />
                    </div>

                    {newDiscount.value && variantPrice > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-500 line-through">${variantPrice.toFixed(2)}</span>
                        <span className="text-lg font-bold text-green-600">${(variantPrice - variantPrice * (Number(newDiscount.value) / 100)).toFixed(2)}</span>
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">-{newDiscount.value}%</span>
                      </div>
                    )}

                    <Button type="button" onClick={addDiscount} className="w-full" disabled={!newDiscount.name || !newDiscount.value || !newDiscount.startDate || !newDiscount.endDate}>
                      <Plus size={16} /> Add Discount
                    </Button>
                  </div>

                  {/* Discount List */}
                  <div className="flex items-center gap-2 border-b border-gray-100 mb-4">
                    <button type="button" onClick={() => setDiscountTab('active_planned')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${discountTab === 'active_planned' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500'}`}>
                      Active & Planned ({activeList.length})
                    </button>
                    <button type="button" onClick={() => setDiscountTab('archived')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${discountTab === 'archived' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500'}`}>
                      Archived ({archivedList.length})
                    </button>
                  </div>

                  {discountTab === 'active_planned' ? (
                    activeList.length > 0 ? (
                      <div className="space-y-3">{activeList.map((d: any) => renderDiscountCard(d))}</div>
                    ) : (
                      <div className="py-12 text-center text-sm font-medium text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">No active or planned discounts for {activeVariant.colorName}.</div>
                    )
                  ) : (
                    archivedList.length > 0 ? (
                      <div className="space-y-3">{archivedList.map((d: any) => renderDiscountCard(d))}</div>
                    ) : (
                      <div className="py-12 text-center text-sm font-medium text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">No archived discounts.</div>
                    )
                  )}
                </div>
              );
            })()}
          </Card>
        )}

        {/* ══════ CHARACTERISTICS TAB ══════ */}
        {activeTab === 'specs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">Product Characteristics</h3>
            </div>

            {selectedCategoryObj?.specifications?.length > 0 ? (
              <div className="space-y-6">
                {selectedCategoryObj?.specifications.map((spec: any) => (
                  <Card key={spec.key} className="p-0 shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200">
                      <h4 className="text-sm font-bold text-gray-800">{spec.label}</h4>
                    </div>
                    <div className="p-4">
                      {spec.children && spec.children.length > 0 ? (
                        <div className="relative space-y-3">
                          {spec.children.map((subSpec: any, index: number) => (
                            <div key={subSpec.key} className="flex items-center relative pl-8">
                              <div className="absolute left-2 top-0 w-px bg-gray-200" style={{ bottom: index === spec.children.length - 1 ? '50%' : '-12px' }}></div>
                              <div className="absolute left-2 top-1/2 w-4 h-px bg-gray-200"></div>
                              <div className="w-1/3 md:w-1/4 flex items-center shrink-0 pr-4">
                                <label className="text-sm font-semibold text-gray-700 truncate">{subSpec.label}</label>
                              </div>
                              <div className="flex-1">
                                <input type="text" value={formData.specifications[spec.key]?.[subSpec.key] || ''} onChange={(e: any) => handleSpecChange(spec.key, subSpec.key, e.target.value)} placeholder={`Enter ${subSpec.label.toLowerCase()}...`} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none shadow-sm focus:border-[var(--color-primary)] text-sm transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center pl-2">
                          <div className="w-1/3 md:w-1/4 flex items-center shrink-0 pr-4">
                            <label className="text-sm font-semibold text-gray-700 truncate">{spec.label}</label>
                          </div>
                          <div className="flex-1">
                            <input type="text" value={formData.specifications[spec.key] || ''} onChange={(e: any) => handleSpecChange(spec.key, null, e.target.value)} placeholder={`Enter ${spec.label.toLowerCase()}...`} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none shadow-sm focus:border-[var(--color-primary)] text-sm transition-colors" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Settings size={32} className="mx-auto mb-3 opacity-20" />
                <p className="font-semibold">No characteristics defined.</p>
                <p className="text-sm mt-1">Update this product's blueprint in the Blueprint editor.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════ KEY HIGHLIGHTS TAB ══════ */}
        {activeTab === 'highlights' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Key Highlights</h3>
                <button type="button" onClick={handleAddHighlight} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
                  <Plus size={16} /> Add Highlight
                </button>
              </div>

              {showValidation && validationErrors.highlights.length > 0 && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                  {validationErrors.highlights.map((e: any, i: number) => <p key={i} className="text-xs text-red-600 font-medium">• {e}</p>)}
                </div>
              )}

              {formData.highlights.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndHighlights}>
                  <SortableContext items={formData.highlights.map((h: any) => h.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.highlights.map((hl: any, index: number) => (
                        <SortableHighlight key={hl.id} hl={hl} index={index} updateHighlight={updateHighlight} removeHighlight={removeHighlight} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="py-8 text-center text-sm font-medium text-gray-500">No highlights added yet.</div>
              )}
            </Card>
          </div>
        )}

        {/* ══════ COMPATIBILITY TAB ══════ */}
        {activeTab === 'compatibility' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Compatibility</h3>
                <button type="button" onClick={handleAddCompCard} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
                  <Plus size={16} /> Add Rule
                </button>
              </div>

              {showValidation && validationErrors.compatibility.length > 0 && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                  {validationErrors.compatibility.map((e: any, i: number) => <p key={i} className="text-xs text-red-600 font-medium">• {e}</p>)}
                </div>
              )}

              <div className="space-y-4">
                {formData.compatibility.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCards}>
                    <SortableContext items={formData.compatibility.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-col gap-3">
                        {formData.compatibility.map((card: any, index: number) => (
                          <SortableCompCard key={card.id} card={card} index={index} updateCompCard={updateCompCard} removeCompCard={removeCompCard} handleDragEndTags={handleDragEndTags} updateTag={updateTag} removeTag={removeTag} handleAddTag={handleAddTag} sensors={sensors} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="py-8 text-center text-sm font-medium text-gray-500">No compatibility rules added.</div>
                )}
              </div>
            </Card>
          </div>
        )}

      </div>
    </form>

    {/* ── COLOR VARIANT MODAL ── */}
    {isVariantModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsVariantModalOpen(false)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">{editingVariant?.id ? 'Edit Color Variant' : 'New Color Variant'}</h3>
          </div>

          <div className="space-y-4">
            <Input label="Variant Name" value={editingVariant?.colorName || ''} onChange={(e: any) => setEditingVariant((p: any) => ({ ...p, colorName: e.target.value }))} placeholder="e.g., Midnight Black" />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={editingVariant?.colorHex || '#000000'} onChange={(e: any) => setEditingVariant((p: any) => ({ ...p, colorHex: e.target.value }))} className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer" />
                <input type="text" value={editingVariant?.colorHex || '#000000'} onChange={(e: any) => setEditingVariant((p: any) => ({ ...p, colorHex: e.target.value }))} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none shadow-sm focus:border-[var(--color-primary)] font-mono text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button type="button" onClick={saveVariant} className="flex-1">Save Variant</Button>
            <Button type="button" variant="secondary" onClick={() => setIsVariantModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
