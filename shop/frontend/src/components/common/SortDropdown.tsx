'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

export interface SortDropdownProps {
  /** Currently selected sort value */
  value: string;
  /** Callback when sort value changes */
  onChange: (value: string) => void;
  /** Sort option labels */
  options?: string[];
  /** Additional CSS classes on the outer wrapper */
  className?: string;
}

const DEFAULT_OPTIONS = [
  'Popularity',
  'Price: Low to High',
  'Price: High to Low',
  'Newest',
  'Rating',
];

// ─── Component ──────────────────────────────────────────────

export default function SortDropdown({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className = '',
}: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div className={`flex items-center gap-3 ${className}`} ref={containerRef}>
      <span className="text-[14px] font-semibold text-[#6B7280] whitespace-nowrap select-none">
        Sort by:
      </span>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`
            flex items-center justify-between gap-2
            h-[44px] min-w-[180px]
            bg-white border rounded-[14px]
            px-4 text-[14px] font-semibold text-[#111827]
            cursor-pointer select-none
            transition-colors duration-200 ease-out
            outline-none focus-visible:ring-2 focus-visible:ring-blue-300
            ${open
              ? 'border-[#2563EB] ring-2 ring-blue-100/60'
              : 'border-[#E5E7EB] hover:border-[#2563EB]'
            }
          `}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate">{value}</span>
          <ChevronDown
            className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              role="listbox"
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="
                absolute right-0 mt-2 z-50
                w-full min-w-[200px]
                bg-white border border-[#E5E7EB]
                rounded-[14px]
                shadow-[0_12px_40px_rgba(0,0,0,0.08)]
                py-1.5 overflow-hidden
              "
            >
              {options.map((opt) => (
                <li key={opt}>
                  <button
                    role="option"
                    aria-selected={opt === value}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`
                      w-full px-4 py-2.5 text-left text-[14px] font-medium
                      transition-colors duration-150 cursor-pointer
                      ${opt === value
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                        : 'text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827]'
                      }
                    `}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
