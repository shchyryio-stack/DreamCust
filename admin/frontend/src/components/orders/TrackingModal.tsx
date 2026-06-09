'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { OrderStatusBadge } from './OrderStatusBadge';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  trackingData: any;
  loading: boolean;
}

export const TrackingModal = ({ isOpen, onClose, order, trackingData, loading }: TrackingModalProps) => {
  const [copiedTtn, setCopiedTtn] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const copyTtn = () => {
    if (order?.ttn) {
      navigator.clipboard.writeText(order.ttn);
      setCopiedTtn(true);
      setTimeout(() => setCopiedTtn(false), 2000);
    }
  };

  if (!isOpen || !mounted) return null;

  const data = trackingData?.data?.[0] || trackingData || {};

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Tracking Info</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          ) : (
            <>
              {/* TTN Number */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">TTN Number</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-gray-900 font-mono tracking-wider">
                    {order?.ttn || '—'}
                  </p>
                  <button
                    onClick={copyTtn}
                    className="p-2 text-gray-400 hover:text-[var(--color-primary)] hover:bg-white rounded-lg transition-colors"
                    title="Copy TTN"
                  >
                    {copiedTtn ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Status</p>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order?.status || 'pending'} />
                  {data.Status && (
                    <span className="text-sm text-gray-600">{data.StatusDescription || data.Status}</span>
                  )}
                </div>
              </div>

              {/* Route */}
              {(data.CitySender || data.CityRecipient) && (
                <div className="bg-blue-50/50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-3">Route</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin size={14} className="text-[var(--color-primary)]" />
                        <span className="font-medium">{data.CitySender || '—'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-[22px]">
                        {data.WarehouseSender || ''}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin size={14} className="text-green-600" />
                        <span className="font-medium">{data.CityRecipient || '—'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-[22px]">
                        {data.WarehouseRecipient || ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery dates */}
              <div className="grid grid-cols-2 gap-4">
                {data.ScheduledDeliveryDate && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-gray-400" />
                      <p className="text-xs text-gray-500 font-medium">Scheduled Delivery</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 ml-[22px]">
                      {data.ScheduledDeliveryDate}
                    </p>
                  </div>
                )}
                {data.ActualDeliveryDate && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Check size={14} className="text-green-600" />
                      <p className="text-xs text-green-700 font-medium">Actual Delivery</p>
                    </div>
                    <p className="text-sm font-semibold text-green-900 ml-[22px]">
                      {data.ActualDeliveryDate}
                    </p>
                  </div>
                )}
              </div>

              {/* Last tracking update */}
              {data.LastCreatedOnTheBasisDateTime && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>Last update: {data.LastCreatedOnTheBasisDateTime}</span>
                </div>
              )}

              {/* Status description */}
              {data.StatusDescription && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">Status Description</p>
                  <p className="text-sm text-gray-700">{data.StatusDescription}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
