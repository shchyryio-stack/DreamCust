"use client";

interface AddressCardProps {
  address: any;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onSetDefault: (e: React.MouseEvent) => void;
  showRadio?: boolean;
}

import { useState } from 'react';

export default function AddressCard({ 
  address, 
  isSelected = false, 
  onSelect, 
  onEdit, 
  onDelete, 
  onSetDefault, 
  showRadio = false 
}: AddressCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(e);
    setIsDeleting(false);
    setIsConfirmingDelete(false);
  };

  return (
    <div 
      onClick={onSelect}
      className={`relative border-2 p-5 rounded-2xl transition-all flex flex-col min-h-[220px] ${
        onSelect ? 'cursor-pointer' : ''
      } ${
        isSelected 
          ? 'border-[#1E6FE8] bg-blue-50/30 shadow-[0_4px_20px_rgba(30,111,232,0.1)]' 
          : 'border-gray-200 hover:border-[#1E6FE8]/50 hover:shadow-sm bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {showRadio && (
            <input 
              type="radio" 
              checked={isSelected} 
              readOnly 
              className="w-4 h-4 text-[#1E6FE8] mt-1 shrink-0" 
            />
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#1A1A1A] uppercase tracking-wide">
                {address.label}
              </span>
              {address.isDefault && (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Default
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-gray-700">
                {address.firstName} {address.lastName} {address.middleName || ''}
              </p>
              <p className="text-xs font-medium text-gray-500">{address.phone}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider shrink-0">
          {address.deliveryType}
        </div>
      </div>
      
      <div className={`${showRadio ? 'ml-7' : ''} mt-2 pt-3 border-t border-gray-100 flex-1 flex flex-col`}>
        <div className="flex flex-col gap-1 mb-3">
          <p className="text-sm font-medium text-[#1A1A1A]">{address.city}</p>
          <div className="min-h-[40px] max-h-[40px] overflow-hidden">
            <p 
              className="text-sm text-[#6b7280] leading-[1.4]"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {address.deliveryType === 'courier' 
                ? `${address.street} ${address.house}${address.apartment ? ', apt ' + address.apartment : ''}${address.courierComment ? ` (Note: ${address.courierComment})` : ''}`
                : address.warehouseName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 shrink-0 mt-auto pt-2 border-t border-dashed border-gray-100 min-h-[32px]">
          {isConfirmingDelete ? (
            <>
              <span className="text-xs text-red-400 mr-auto font-medium animate-pulse">Delete address?</span>
              <button 
                onClick={handleCancelDelete} 
                disabled={isDeleting}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete} 
                disabled={isDeleting}
                className="text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </>
          ) : (
            <>
              {!address.isDefault && (
                <button 
                  onClick={onSetDefault} 
                  className="text-xs font-bold text-gray-400 hover:text-[#1E6FE8] transition-colors"
                >
                  Set as Default
                </button>
              )}
              <button 
                onClick={onEdit} 
                className="text-xs font-bold text-gray-400 hover:text-[#1E6FE8] transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={handleDeleteClick} 
                className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
