"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCompatibleParts, fetchCategoryFilters } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Cpu, HardDrive, Zap, Fan, Server,
  Settings2, Trash2,
  Search, Layers,
  type LucideIcon
} from 'lucide-react';
import { FilterPanel, type FilterDefinition } from '@/components/filters/FilterPanel';
import SortDropdown from '@/components/common/SortDropdown';
import AdditionalServices, { getServicesTotal, getSelectedServices } from '@/components/configurator/AdditionalServices';
import { getProductImageUrl, handleImageError } from '@/utils/productImage';
import CategoryNavBar, { type CategoryConfig } from '@/components/ui/CategoryNavBar';

// ─── Constants ──────────────────────────────────────────────

const BUILD_STEPS = [
  'cpu', 'motherboard', 'ram', 'gpu', 'storage',
  'case', 'psu', 'cooling'
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  motherboard: Server,
  ram: HardDrive,
  gpu: Monitor,
  storage: HardDrive,
  case: Server,
  psu: Zap,
  cooling: Fan,
};

/** Category config derived from BUILD_STEPS for the nav bar */
const BUILDER_CATEGORIES: CategoryConfig[] = BUILD_STEPS.map(step => ({
  key: step,
  label: step.charAt(0).toUpperCase() + step.slice(1),
  icon: CATEGORY_ICONS[step] || Settings2,
}));

// ─── Page Component ─────────────────────────────────────────

export default function ConfiguratorPage() {
  const router = useRouter();
  const { addToCart } = useCart();

  // ─── State ──────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Data
  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [filterSchema, setFilterSchema] = useState<FilterDefinition[]>([]);
  const [filterValues, setFilterValues] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Filter state (generic, schema-driven)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ price: true });
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('Popularity');

  const currentCategory = BUILD_STEPS[activeStep];
  const buildIdsStr = JSON.stringify(
    Object.values(config).filter(Boolean).map((p: any) => p._id)
  );


  // ─── Data loading ───────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const buildIds = JSON.parse(buildIdsStr);

        // Fetch parts and filters in parallel
        const [parts, filtersResponse] = await Promise.all([
          fetchCompatibleParts(currentCategory.toUpperCase(), buildIds),
          fetchCategoryFilters(currentCategory)
        ]);

        setAvailableParts(parts);
        setFilterSchema(filtersResponse.filters || []);
        setFilterValues(filtersResponse.values || {});

        // Reset filter state when switching categories
        setActiveFilters({});
        setAvailability([]);
        setPriceRange([
          filtersResponse.values?.minPrice || 0,
          filtersResponse.values?.maxPrice || 10000
        ]);

        // Expand price by default, collapse everything else
        const expanded: Record<string, boolean> = { price: true };
        (filtersResponse.filters || []).forEach((f: FilterDefinition) => {
          if (f.key !== 'price') expanded[f.key] = false;
        });
        setExpandedSections(expanded);
      } catch (err) {
        console.error('Failed to load configurator data:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(load, 80);
    return () => clearTimeout(timeout);
  }, [activeStep, currentCategory, buildIdsStr]);

  // ─── Handlers ───────────────────────────────────────────
  const handleSelect = (part: any) => {
    setConfig(prev => ({ ...prev, [currentCategory]: part }));
    if (activeStep < BUILD_STEPS.length - 1) setActiveStep(activeStep + 1);
  };

  const handleRemove = (category: string) => {
    setConfig(prev => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  const toggleFilter = (key: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRangeFilter = (key: string, range: [number, number]) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: [String(range[0]), String(range[1])]
    }));
  };

  const clearFilters = () => {
    setActiveFilters({});
    setAvailability([]);
    setPriceRange([filterValues.minPrice || 0, filterValues.maxPrice || 10000]);
  };

  const componentsPrice = Object.values(config)
    .filter(Boolean)
    .reduce((sum: number, item: any) => sum + (item.pricing?.price || 0), 0);

  const servicesPrice = getServicesTotal(selectedServiceIds);
  const totalPrice = componentsPrice + servicesPrice;
  const isBuildComplete = Object.values(config).filter(Boolean).length === BUILD_STEPS.length;

  const getCategoryIcon = (cat: string) => {
    const Icon = CATEGORY_ICONS[cat] || Settings2;
    return <Icon className="w-5 h-5 text-gray-400" />;
  };

  // ─── Client-side filtering & sorting ────────────────────
  const filteredParts = useMemo(() => {
    return availableParts.filter((part: any) => {
      const price = part.pricing?.price ?? 0;

      // Price range
      if (price < priceRange[0] || price > priceRange[1]) return false;

      // Availability
      if (availability.length > 0) {
        const inStock = part.computed?.inStock ?? false;
        if (availability.includes('inStock') && !inStock) return false;
        if (availability.includes('discounted') && (!part.pricing?.discount || part.pricing.discount <= 0)) return false;
      }

      // Schema-driven filters
      for (const filter of filterSchema) {
        if (filter.key === 'price') continue; // handled above
        const active = activeFilters[filter.key];
        if (!active || active.length === 0) continue;

        // Resolve value from the product using the filter's field path
        const fieldParts = filter.field.split('.');
        let val: any = part;
        for (const fp of fieldParts) {
          val = val?.[fp];
        }

        if (filter.type === 'range') {
          const num = Number(val);
          if (isNaN(num) || num < Number(active[0]) || num > Number(active[1])) return false;
        } else if (filter.type === 'boolean') {
          if (String(!!val) !== active[0]) return false;
        } else {
          // checkbox / select / multi-select
          if (val === undefined || val === null) return false;
          // Handle array fields (e.g. supportedMotherboards)
          if (Array.isArray(val)) {
            if (!active.some(a => val.map(String).includes(a))) return false;
          } else {
            if (!active.includes(String(val))) return false;
          }
        }
      }

      return true;
    }).sort((a: any, b: any) => {
      const pa = a.pricing?.price ?? 0;
      const pb = b.pricing?.price ?? 0;
      if (sortBy === 'Price: Low to High') return pa - pb;
      if (sortBy === 'Price: High to Low') return pb - pa;
      return (b.numReviews || 0) - (a.numReviews || 0);
    });
  }, [availableParts, activeFilters, priceRange, availability, filterSchema, sortBy]);

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 flex flex-col xl:flex-row gap-8">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-full xl:w-[260px] shrink-0 hidden xl:block">
          {/* Schema-driven filter panel */}
          <FilterPanel
            filters={filterSchema}
            activeFilters={activeFilters}
            expandedSections={expandedSections}
            priceRange={priceRange}
            minPrice={filterValues.minPrice || 0}
            maxPrice={filterValues.maxPrice || 10000}
            onToggleFilter={toggleFilter}
            onToggleSection={toggleSection}
            onPriceRangeChange={setPriceRange}
            onRangeFilterChange={handleRangeFilter}
            onClearAll={clearFilters}
          />
        </div>

        {/* ── CENTER CONTENT ── */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">

          {/* Category Tabs — Reusable NavBar */}
          <CategoryNavBar
            categories={BUILDER_CATEGORIES}
            activeCategory={currentCategory}
            onCategoryChange={(key) => {
              const idx = BUILD_STEPS.indexOf(key);
              if (idx !== -1) setActiveStep(idx);
            }}
          />

          {/* Main Config Box */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 p-8 ">

            {/* Sort controls */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 shrink-0">
              <span className="text-[14px] font-semibold text-[#6B7280]">
                {loading ? 'Loading…' : `${filteredParts.length} component${filteredParts.length !== 1 ? 's' : ''}`}
              </span>
              <SortDropdown
                value={sortBy}
                onChange={setSortBy}
                options={['Popularity', 'Price: Low to High', 'Price: High to Low', 'Newest', 'Rating']}
              />
            </div>

            {/* Products List */}
            <div className="w-full">
              {loading ? (
                /* Loading skeleton */
                <div className="space-y-3 pb-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 animate-pulse">
                      <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-1/4" />
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="flex gap-1.5">
                          <div className="h-5 bg-gray-50 rounded-lg w-16" />
                          <div className="h-5 bg-gray-50 rounded-lg w-20" />
                          <div className="h-5 bg-gray-50 rounded-lg w-14" />
                        </div>
                      </div>
                      <div className="w-20 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                        <div className="h-8 bg-gray-200 rounded-xl w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredParts.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in bg-white/50 rounded-2xl ">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gray-100/50 rounded-full blur-xl scale-125 animate-pulse" />
                    <Search className="w-10 h-10 text-gray-400 relative" />
                  </div>
                  <h4 className="text-base font-extrabold text-gray-800 mb-1.5">No components found</h4>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed px-4 mb-5">
                    No products match your active filters. Try adjusting your selections.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors duration-200 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                /* Product cards */
                <motion.div
                  className="space-y-3 pb-4"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                >
                  {filteredParts.map((part: any) => (
                    <motion.div
                      key={part._id}
                      layout
                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors duration-200 bg-white group relative"
                    >
                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex gap-1 z-10">
                        {part.pricing?.discount > 0 && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Sale</span>
                        )}
                      </div>

                      {/* Image */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50/50 rounded-xl flex items-center justify-center p-2 shrink-0 border border-gray-100/50 transition-colors duration-200">
                        {(() => {
                          const imgUrl = getProductImageUrl(part);
                          return imgUrl ? (
                            <img src={imgUrl} alt={part.title} onError={handleImageError} className="w-full h-full object-contain mix-blend-multiply" />
                          ) : (
                            <div className="text-2xl opacity-20">📦</div>
                          );
                        })()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-12">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{part.brand}</div>
                        <h3 className="text-sm font-bold text-gray-900 truncate mb-2 group-hover:text-blue-600 transition-colors" title={part.title}>
                          {part.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Object.entries(part.specifications || {})
                            .filter(([k, v]: any) => {
                              // Skip nested objects, null, undefined, empty arrays
                              if (v === null || v === undefined) return false;
                              if (typeof v === 'object' && !Array.isArray(v)) return false;
                              if (Array.isArray(v) && v.some((item: any) => typeof item === 'object')) return false;
                              const str = Array.isArray(v) ? v.join(', ') : String(v);
                              if (str === '[object Object]' || str === '' || str === 'undefined') return false;
                              return true;
                            })
                            .slice(0, 4)
                            .map(([k, v]: any) => {
                              const displayVal = Array.isArray(v) ? v.join(', ') : String(v);
                              return (
                                <span key={k} className="bg-gray-50 border border-gray-100/80 px-2.5 py-0.5 rounded-lg text-gray-500 text-[10px] font-semibold">
                                  {displayVal}
                                </span>
                              );
                            })}
                        </div>
                      </div>

                      {/* Price + Select */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                        <div className="text-left sm:text-right">
                          <div className="text-sm font-extrabold text-gray-900">₴{part.pricing?.price?.toFixed(2)}</div>
                          <div className="text-[9px] font-medium mt-1">
                            {part.computed?.inStock ? (
                              <span className="text-emerald-600 font-bold">In Stock</span>
                            ) : (
                              <span className="text-gray-400 font-medium">Out of Stock</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelect(part)}
                          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-colors duration-200 cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: 3 INDEPENDENT CARDS ── */}
        <div className="w-full xl:w-[340px] shrink-0">
          <div className="flex flex-col gap-6 sticky top-28 pb-4">

            {/* ═══════════════════════════════════════════
                CARD 1 — BUILD SUMMARY
            ═══════════════════════════════════════════ */}
            <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.04)] shrink-0">

              {/* Title */}
              <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider mb-4">
                Your Build
              </h3>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[#9CA3AF]">Build Progress</span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
                    }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(Object.values(config).filter(Boolean).length / BUILD_STEPS.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Pricing summary */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#6B7280]">Components</span>
                  <span className="text-[13px] font-bold text-[#111827]">₴{componentsPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#6B7280]">Services</span>
                  <span className={`text-[13px] font-bold transition-colors duration-200 ${servicesPrice > 0 ? 'text-[#2563EB]' : 'text-gray-400'}`}>
                    ₴{servicesPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-[#F3F4F6] mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Total</span>
                  <span className="text-[28px] font-black text-[#111827] tracking-tight leading-none">
                    ₴{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5">
                {/* Primary — Order Now */}
                <button
                  disabled={!isBuildComplete}
                  onClick={() => {
                    const componentsList = BUILD_STEPS.map(step => {
                      const part = config[step];
                      if (!part) return null;
                      return {
                        productId: part._id,
                        name: part.title,
                        price: part.pricing?.price || 0,
                        category: step,
                        image: getProductImageUrl(part) || '',
                      };
                    }).filter(Boolean);

                    const servicesList = getSelectedServices(selectedServiceIds).map(svc => ({
                      id: svc.id,
                      name: svc.name,
                      price: svc.price,
                    }));

                    addToCart({
                      productId: `custom-pc-${Date.now()}`,
                      name: 'Кастомний ПК',
                      price: totalPrice,
                      image: getProductImageUrl(config.case) || '',
                      isCustomBuild: true,
                      components: componentsList as any,
                      services: servicesList,
                    });
                    router.push('/checkout');
                  }}
                  className="
                    w-full h-[52px] rounded-[14px]
                    bg-[#0B8F5A] hover:bg-[#09784B]
                    text-white text-[15px] font-bold
                    transition-all duration-200
                    flex items-center justify-center
                    disabled:opacity-40 disabled:bg-gray-400
                    cursor-pointer
                  "
                >
                  Order Now
                </button>

                {/* Secondary — Add to Cart */}
                <button
                  disabled={!isBuildComplete}
                  onClick={() => {
                    const componentsList = BUILD_STEPS.map(step => {
                      const part = config[step];
                      if (!part) return null;
                      return {
                        productId: part._id,
                        name: part.title,
                        price: part.pricing?.price || 0,
                        category: step,
                        image: getProductImageUrl(part) || '',
                      };
                    }).filter(Boolean);

                    const servicesList = getSelectedServices(selectedServiceIds).map(svc => ({
                      id: svc.id,
                      name: svc.name,
                      price: svc.price,
                    }));

                    addToCart({
                      productId: `custom-pc-${Date.now()}`,
                      name: 'Кастомний ПК',
                      price: totalPrice,
                      image: getProductImageUrl(config.case) || '',
                      isCustomBuild: true,
                      components: componentsList as any,
                      services: servicesList,
                    });
                    router.push('/cart');
                  }}
                  className="
                    w-full h-[52px] rounded-[14px]
                    bg-[#E8F1FF] hover:bg-[#D6E6FF]
                    text-[#2563EB] text-[15px] font-bold
                    transition-all duration-200
                    flex items-center justify-center
                    disabled:opacity-40 disabled:bg-gray-400 disabled:text-white 
                    cursor-pointer
                  "
                >
                  Add to Cart
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════
                CARD 2 — ADDITIONAL SERVICES
            ═══════════════════════════════════════════ */}
            <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.04)] shrink-0">
              <AdditionalServices
                selectedServiceIds={selectedServiceIds}
                onSelectionChange={setSelectedServiceIds}
              />
            </div>

            {/* ═══════════════════════════════════════════
                CARD 3 — SELECTED COMPONENTS
            ═══════════════════════════════════════════ */}
            <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.04)] shrink-0">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-wider">
                  Selected Components
                </h3>
                <span className="text-[11px] font-bold text-[#111827]">
                  {Object.values(config).filter(Boolean).length}/{BUILD_STEPS.length}
                </span>
              </div>

              {Object.values(config).filter(Boolean).length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="relative mb-3">
                    <div className="absolute inset-0 bg-blue-50/50 rounded-full blur-xl scale-125" />
                    <Layers className="w-8 h-8 text-blue-400/70 relative" />
                  </div>
                  <h4 className="text-[13px] font-bold text-[#374151] mb-1">No components selected</h4>
                  <p className="text-[11px] text-[#9CA3AF] max-w-[200px] leading-relaxed">
                    Select components from the catalog to start building.
                  </p>
                </div>
              ) : (
                /* Component list */
                <div className="space-y-0.5 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '240px' }}>
                  <AnimatePresence>
                    {BUILD_STEPS.map(step => {
                      const part = config[step];
                      if (!part) return null;
                      return (
                        <motion.div
                           key={step}
                           layout
                           initial={{ opacity: 0, x: 8 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, scale: 0.95 }}
                           className="flex items-center gap-3 py-2.5 border-b border-[#F3F4F6] last:border-b-0 group"
                        >
                          {/* Thumbnail */}
                          <div className="w-9 h-9 rounded-[10px] bg-[#F9FAFB] border border-[#F3F4F6] flex items-center justify-center shrink-0 p-1 overflow-hidden">
                            {(() => {
                              const imgUrl = getProductImageUrl(part);
                              return imgUrl ? (
                                <img src={imgUrl} alt={part.title} onError={handleImageError} className="w-full h-full object-contain" />
                              ) : (
                                getCategoryIcon(step)
                              );
                            })()}
                          </div>

                          {/* Type + Name */}
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider leading-none mb-0.5">
                              {step}
                            </div>
                            <div className="text-[12px] font-semibold text-[#111827] truncate" title={part.title}>
                              {part.title}
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-[12px] font-bold text-[#111827] shrink-0 tabular-nums">
                            ₴{part.pricing?.price?.toFixed(2)}
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => handleRemove(step)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[#D1D5DB] hover:text-red-500 transition-all duration-150"
                            aria-label={`Remove ${step}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
