'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { DualRangeSlider } from '@/components/ui/DualRangeSlider';

// ─── Types ──────────────────────────────────────────────────

export interface FilterDefinition {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'select' | 'boolean' | 'multi-select';
  field: string;
  options?: (string | number | boolean)[];
  min?: number;
  max?: number;
}

export interface FilterPanelProps {
  /** Schema-driven filter definitions (from backend, used in Builder) */
  filters?: FilterDefinition[];
  /** Active filter selections */
  activeFilters: Record<string, string[]>;
  /** Which sections are expanded */
  expandedSections: Record<string, boolean>;
  /** Price range state */
  priceRange: [number, number];
  /** Global min price */
  minPrice: number;
  /** Global max price */
  maxPrice: number;
  /** Toggle a filter value */
  onToggleFilter: (filterKey: string, value: string) => void;
  /** Toggle section expand/collapse */
  onToggleSection: (key: string) => void;
  /** Price range change */
  onPriceRangeChange: (range: [number, number]) => void;
  /** Non-price range filter change */
  onRangeFilterChange?: (filterKey: string, range: [number, number]) => void;
  /** Clear all filters */
  onClearAll: () => void;
  /** Static availability options (used in Catalog) */
  availabilityOptions?: string[];
  /** Brand list (used in Catalog) */
  brands?: string[];
  /** Dynamic spec filters {socket: ['AM5','LGA1700'], ...} (used in Catalog) */
  specs?: Record<string, string[]>;
  /** Additional className */
  className?: string;
}

// ─── Animation config ───────────────────────────────────────

const sectionAnimation = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto' as const, opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, ease: 'easeInOut' as const },
};

// ─── Main Component ─────────────────────────────────────────

export function FilterPanel({
  filters,
  activeFilters,
  expandedSections,
  priceRange,
  minPrice,
  maxPrice,
  onToggleFilter,
  onToggleSection,
  onPriceRangeChange,
  onRangeFilterChange,
  onClearAll,
  availabilityOptions,
  brands,
  specs,
  className = '',
}: FilterPanelProps) {
  return (
    <div
      className={`
        bg-white rounded-[20px] p-6
        border border-[#E5E7EB]
        shadow-[0_4px_12px_rgba(0,0,0,0.04)]
        max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <h2 className="text-lg font-bold text-[#111827]">Filters</h2>
        <button
          onClick={onClearAll}
          className="text-[13px] font-semibold text-[#2563EB] hover:text-blue-700 transition-colors duration-200"
        >
          Reset all
        </button>
      </div>

      <div className="space-y-0">
        {/* ── Static: Availability ── */}
        {availabilityOptions && availabilityOptions.length > 0 && (
          <FilterSection
            label="Availability"
            isExpanded={expandedSections['Availability'] ?? expandedSections['availability'] ?? true}
            onToggle={() => onToggleSection('Availability')}
            isFirst
          >
            <div className="space-y-3.5">
              {availabilityOptions.map((opt) => (
                <Checkbox
                  key={opt}
                  label={opt.replace(/([A-Z])/g, ' $1').trim()}
                  checked={(activeFilters['availability'] || []).includes(opt)}
                  onClick={() => onToggleFilter('availability', opt)}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {/* ── Price Range ── */}
        <FilterSection
          label="Price Range"
          isExpanded={expandedSections['Price'] ?? expandedSections['price'] ?? true}
          onToggle={() => onToggleSection(expandedSections['Price'] !== undefined ? 'Price' : 'price')}
          isFirst={!availabilityOptions || availabilityOptions.length === 0}
        >
          <PriceFilterContent
            priceRange={priceRange}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onChange={onPriceRangeChange}
          />
        </FilterSection>

        {/* ── Static: Brands ── */}
        {brands && brands.length > 0 && (
          <FilterSection
            label="Brand"
            isExpanded={expandedSections['Brand'] ?? false}
            onToggle={() => onToggleSection('Brand')}
          >
            <div className="space-y-3.5 max-h-[280px] overflow-y-auto no-scrollbar pr-1">
              {brands.map((b) => (
                <Checkbox
                  key={b}
                  label={b}
                  checked={(activeFilters['brand'] || []).includes(b)}
                  onClick={() => onToggleFilter('brand', b)}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {/* ── Schema-driven filters (Builder) ── */}
        {filters?.map((filter) => {
          if (filter.key === 'price') return null;

          if (filter.type === 'boolean') {
            return (
              <FilterSection
                key={filter.key}
                label={filter.label}
                isExpanded={expandedSections[filter.key] ?? false}
                onToggle={() => onToggleSection(filter.key)}
              >
                <div className="space-y-3.5">
                  <Checkbox
                    label="Yes"
                    checked={(activeFilters[filter.key] || []).includes('true')}
                    onClick={() => onToggleFilter(filter.key, 'true')}
                  />
                  <Checkbox
                    label="No"
                    checked={(activeFilters[filter.key] || []).includes('false')}
                    onClick={() => onToggleFilter(filter.key, 'false')}
                  />
                </div>
              </FilterSection>
            );
          }

          const options = getUniqueOptions(filter.options);
          if (options.length === 0) return null;

          return (
            <FilterSection
              key={filter.key}
              label={filter.label}
              isExpanded={expandedSections[filter.key] ?? false}
              onToggle={() => onToggleSection(filter.key)}
            >
              <div className="space-y-3.5 max-h-[240px] overflow-y-auto no-scrollbar pr-1">
                {options.map((val) => (
                  <Checkbox
                    key={val}
                    label={val}
                    checked={(activeFilters[filter.key] || []).includes(val)}
                    onClick={() => onToggleFilter(filter.key, val)}
                  />
                ))}
              </div>
            </FilterSection>
          );
        })}

        {/* ── Static: Dynamic specs (Catalog) ── */}
        {specs && Object.keys(specs).map((specKey) => (
          <FilterSection
            key={specKey}
            label={specKey.replace(/([A-Z])/g, ' $1').trim()}
            isExpanded={expandedSections[specKey] ?? false}
            onToggle={() => onToggleSection(specKey)}
          >
            <div className="space-y-3.5 max-h-[240px] overflow-y-auto no-scrollbar pr-1">
              {specs[specKey].map((val) => (
                <Checkbox
                  key={val}
                  label={String(val)}
                  checked={(activeFilters[specKey] || []).includes(val)}
                  onClick={() => onToggleFilter(specKey, val)}
                />
              ))}
            </div>
          </FilterSection>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function getUniqueOptions(options?: (string | number | boolean)[]): string[] {
  if (!options) return [];
  return Array.from(new Set(
    options
      .filter((opt) => {
        if (opt === null || opt === undefined) return false;
        if (typeof opt === 'object') return false;
        const str = String(opt);
        return str !== '' && str !== 'undefined' && str !== 'null' && str !== '[object Object]';
      })
      .map((opt) => String(opt).trim())
  ));
}

// ─── Sub-components ─────────────────────────────────────────

function FilterSection({
  label,
  isExpanded,
  onToggle,
  isFirst = false,
  children,
}: {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  isFirst?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${isFirst ? '' : 'border-t border-[#F3F4F6]'}`}>
      <div
        className="flex items-center justify-between cursor-pointer group py-5"
        onClick={onToggle}
      >
        <h3 className="text-[15px] font-bold text-[#111827] capitalize group-hover:text-[#2563EB] transition-colors duration-200">
          {label}
        </h3>
        <ChevronDown
          className={`
            w-4 h-4 text-[#9CA3AF]
            transition-transform duration-200
            group-hover:text-[#6B7280]
            ${isExpanded ? 'rotate-180' : ''}
          `}
        />
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            {...sectionAnimation}
            className="overflow-hidden pb-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 cursor-pointer group"
      onClick={onClick}
    >
      <div
        className={`
          w-[18px] h-[18px] rounded-[6px] flex items-center justify-center shrink-0
          transition-all duration-200
          ${
            checked
              ? 'bg-[#2563EB] border-2 border-[#2563EB]'
              : 'border-2 border-[#D1D5DB] bg-white group-hover:border-[#9CA3AF]'
          }
        `}
      >
        {checked && (
          <svg
            className="w-[11px] h-[11px] text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-[14px] font-medium text-[#4B5563] group-hover:text-[#111827] transition-colors duration-200 capitalize">
        {label}
      </span>
    </div>
  );
}

// ─── Price Filter Content ───────────────────────────────────

function PriceFilterContent({
  priceRange,
  minPrice,
  maxPrice,
  onChange,
}: {
  priceRange: [number, number];
  minPrice: number;
  maxPrice: number;
  onChange: (range: [number, number]) => void;
}) {
  const [localMin, setLocalMin] = useState(String(priceRange[0]));
  const [localMax, setLocalMax] = useState(String(priceRange[1]));

  // Sync local state when props change
  React.useEffect(() => {
    setLocalMin(String(priceRange[0]));
    setLocalMax(String(priceRange[1]));
  }, [priceRange[0], priceRange[1]]);

  const commitMin = () => {
    const val = Math.max(minPrice, Math.min(Number(localMin) || minPrice, priceRange[1] - 1));
    setLocalMin(String(val));
    onChange([val, priceRange[1]]);
  };

  const commitMax = () => {
    const val = Math.min(maxPrice, Math.max(Number(localMax) || maxPrice, priceRange[0] + 1));
    setLocalMax(String(val));
    onChange([priceRange[0], val]);
  };

  return (
    <div className="space-y-4">
      <DualRangeSlider
        min={minPrice}
        max={maxPrice}
        value={priceRange}
        onChange={(range) => {
          onChange(range);
          setLocalMin(String(range[0]));
          setLocalMax(String(range[1]));
        }}
      />

      <div className="flex items-center gap-3">
        {/* Min price input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value.replace(/\D/g, ''))}
            onBlur={commitMin}
            onKeyDown={(e) => e.key === 'Enter' && commitMin()}
            placeholder={String(minPrice)}
            className="
              w-full h-[34px] bg-[#F9FAFB] border border-[#E5E7EB]
              rounded-[10px] pl-2 pr-2
              text-[14px] font-semibold text-[#111827] text-left
              outline-none
              focus:bg-white focus:border-[#2563EB]
              transition-all duration-200
            "
          />
        </div>

        {/* Dash separator */}
        <div className="w-4 h-[2px] bg-[#D1D5DB] rounded-full shrink-0" />

        {/* Max price input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value.replace(/\D/g, ''))}
            onBlur={commitMax}
            onKeyDown={(e) => e.key === 'Enter' && commitMax()}
            placeholder={String(maxPrice)}
            className="
              w-full h-[34px] bg-[#F9FAFB] border border-[#E5E7EB]
              rounded-[10px] pl-2 pr-2
              text-[14px] font-semibold text-[#111827] text-left
              outline-none
              focus:bg-white focus:border-[#2563EB] 
              transition-all duration-200
            "
          />
        </div>
      </div>
    </div>
  );
}
