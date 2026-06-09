'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSubmit: (orderId: string, data: ShipmentFormData) => Promise<void>;
  isSubmitting: boolean;
}

export interface ShipmentFormData {
  packagingType: string;
  length: number;
  width: number;
  height: number;
  actualWeight: number;
  description: string;
  cargoType: string;
  comment: string;
}

interface PackagingPreset {
  label: string;
  value: string;
  length: number | null;
  width: number | null;
  height: number | null;
  editable: boolean;
}

const PACKAGING_PRESETS: PackagingPreset[] = [
  { label: 'Стрейч', value: 'stretch', length: null, width: null, height: null, editable: true },
  { label: 'Коробка S (20×24×16)', value: 'box_s', length: 20, width: 24, height: 16, editable: false },
  { label: 'Коробка M (34×40×28.5)', value: 'box_m', length: 34, width: 40, height: 28.5, editable: false },
  { label: 'Коробка L (50×50×48)', value: 'box_l', length: 50, width: 50, height: 48, editable: false },
  { label: 'Пакет 2кг', value: 'bag_2kg', length: 20, width: 30, height: 1, editable: false },
  { label: 'Пакет 4кг', value: 'bag_4kg', length: 30, width: 40, height: 1, editable: false },
  { label: 'Конверт С13', value: 'envelope_c13', length: 29, width: 37, height: 1, editable: false },
  { label: 'Конверт E15', value: 'envelope_e15', length: 22, width: 27, height: 1, editable: false },
  { label: 'Конверт H18', value: 'envelope_h18', length: 27, width: 36, height: 1, editable: false },
  { label: 'Гофрокартон', value: 'corrugated', length: null, width: null, height: null, editable: true },
];

export const ShipmentModal = ({ isOpen, onClose, order, onSubmit, isSubmitting }: ShipmentModalProps) => {
  const [mounted, setMounted] = useState(false);

  const deliveryType = order?.address?.deliveryType || '';

  const [form, setForm] = useState<ShipmentFormData>({
    packagingType: '',
    length: 0,
    width: 0,
    height: 0,
    actualWeight: 0,
    description: '',
    cargoType: 'Побутова техніка',
    comment: '',
  });

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setForm({
        packagingType: '',
        length: 0,
        width: 0,
        height: 0,
        actualWeight: 0,
        description: `Замовлення №${order._id?.slice(-8) || ''}`,
        cargoType: 'Побутова техніка',
        comment: deliveryType === 'courier' ? 'Адресна доставка' : '',
      });
    }
  }, [order, deliveryType]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const selectedPreset = useMemo(() => {
    return PACKAGING_PRESETS.find(p => p.value === form.packagingType);
  }, [form.packagingType]);

  const dimensionsEditable = selectedPreset?.editable ?? true;

  const volumetricWeight = useMemo(() => {
    if (form.length > 0 && form.width > 0 && form.height > 0) {
      return parseFloat(((form.length * form.width * form.height) / 4000).toFixed(2));
    }
    return 0;
  }, [form.length, form.width, form.height]);

  const handlePackagingChange = (value: string) => {
    const preset = PACKAGING_PRESETS.find(p => p.value === value);
    if (preset) {
      setForm(prev => ({
        ...prev,
        packagingType: value,
        length: preset.length ?? prev.length,
        width: preset.width ?? prev.width,
        height: preset.height ?? prev.height,
      }));
    }
  };

  const handleChange = (field: keyof ShipmentFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!order) return;
    await onSubmit(order._id, form);
  };

  const isValid = form.packagingType &&
    form.length > 0 &&
    form.width > 0 &&
    form.height > 0 &&
    form.actualWeight > 0 &&
    form.description;

  if (!isOpen || !mounted || !order) return null;

  const address = order.address || {};

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex items-center justify-between p-6 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Create Shipment</h3>
              <p className="text-xs text-gray-500 font-medium">
                Order #{order._id?.slice(-8)} · {address.firstName} {address.lastName} · {address.city}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Row 1: Parcel Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Назва посилки
            </label>
            <input
              type="text"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
              placeholder="Замовлення №..."
            />
          </div>

          {/* Row 2: Cargo Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Тип товару
            </label>
            <input
              type="text"
              value={form.cargoType}
              onChange={e => handleChange('cargoType', e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
              placeholder="Побутова техніка"
            />
          </div>

          {/* Row 3: Packaging Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Тип пакування
            </label>
            <select
              value={form.packagingType}
              onChange={e => handlePackagingChange(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all cursor-pointer"
            >
              <option value="" disabled>Оберіть тип пакування...</option>
              {PACKAGING_PRESETS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Row 4: Dimensions */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Розміри посилки (см)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Довжина</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.length || ''}
                  onChange={e => handleChange('length', parseFloat(e.target.value) || 0)}
                  disabled={!dimensionsEditable}
                  className={`w-full border rounded-xl py-2.5 px-3 text-sm font-mono font-bold text-center outline-none transition-all
                    ${dimensionsEditable
                      ? 'bg-white border-gray-200 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]'
                      : 'bg-gray-50 border-gray-100 text-gray-600 cursor-not-allowed'
                    }`}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Ширина</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.width || ''}
                  onChange={e => handleChange('width', parseFloat(e.target.value) || 0)}
                  disabled={!dimensionsEditable}
                  className={`w-full border rounded-xl py-2.5 px-3 text-sm font-mono font-bold text-center outline-none transition-all
                    ${dimensionsEditable
                      ? 'bg-white border-gray-200 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]'
                      : 'bg-gray-50 border-gray-100 text-gray-600 cursor-not-allowed'
                    }`}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Висота</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.height || ''}
                  onChange={e => handleChange('height', parseFloat(e.target.value) || 0)}
                  disabled={!dimensionsEditable}
                  className={`w-full border rounded-xl py-2.5 px-3 text-sm font-mono font-bold text-center outline-none transition-all
                    ${dimensionsEditable
                      ? 'bg-white border-gray-200 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]'
                      : 'bg-gray-50 border-gray-100 text-gray-600 cursor-not-allowed'
                    }`}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Weights */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Об'ємна вага (кг)
              </label>
              <div className="bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm font-mono font-bold text-gray-600 cursor-not-allowed">
                {volumetricWeight > 0 ? `${volumetricWeight} кг` : '—'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Фактична вага (кг)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={form.actualWeight || ''}
                onChange={e => handleChange('actualWeight', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-mono font-bold focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Row 6: Comment */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Коментар
            </label>
            <textarea
              value={form.comment}
              onChange={e => handleChange('comment', e.target.value)}
              rows={2}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all resize-none"
              placeholder="Додатковий коментар до посилки..."
            />
          </div>

          {/* Order summary (compact) */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Зведення замовлення</p>
            <div className="space-y-1.5">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-xs text-gray-700">
                  <span className="truncate max-w-[280px]">
                    <span className="font-bold text-gray-400 mr-1">×{item.qty || item.quantity || 1}</span>
                    {item.name || 'Unknown'}
                  </span>
                  <span className="font-mono font-semibold shrink-0">
                    {((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString('uk-UA')} ₴
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                <span>Загальна сума</span>
                <span className="font-mono">{(order.totalPrice || 0).toLocaleString('uk-UA')} ₴</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-6 rounded-b-2xl flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} className="!rounded-xl">
            Скасувати
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!isValid}
            className="!rounded-xl !px-6 gap-2"
          >
            <Package size={16} />
            Створити посилку
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
