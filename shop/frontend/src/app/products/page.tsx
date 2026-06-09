"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchProducts, fetchFilters } from '@/services/api';
import ProductCard from '@/components/product/ProductCard';
import { Search, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryNavBar, { EXTENDED_CATEGORIES, type CategoryConfig } from '@/components/ui/CategoryNavBar';
import { FilterPanel } from '@/components/filters/FilterPanel';
import SortDropdown from '@/components/common/SortDropdown';

/** Catalog categories: "All" + all extended categories */
const CATALOG_CATEGORIES: CategoryConfig[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  ...EXTENDED_CATEGORIES,
];

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL State mapped to local state
  const currentCategory = searchParams?.get('category') || 'All';
  const currentSort = searchParams?.get('sort') || 'Popularity';
  const currentMinPrice = searchParams?.get('minPrice') || '';
  const currentMaxPrice = searchParams?.get('maxPrice') || '';
  
  // Custom Filters (Brand, Specs, Availability)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  
  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [filterData, setFilterData] = useState<any>({ brands: [], minPrice: 0, maxPrice: 0, specs: {} });
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // UI State
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    Availability: true, Price: true, Brand: true
  });

  // Local state for the price range text inputs
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

  // Initialize active filters from URL on load
  useEffect(() => {
    const newActiveFilters: Record<string, string[]> = {};
    searchParams?.forEach((value, key) => {
      if (!['category', 'sort', 'q', 'minPrice', 'maxPrice', 'page'].includes(key)) {
        newActiveFilters[key] = value.split(',');
      }
    });
    setActiveFilters(newActiveFilters);
    setMinPriceInput(searchParams?.get('minPrice') || '');
    setMaxPriceInput(searchParams?.get('maxPrice') || '');
  }, [searchParams]);

  // Load Filters from Backend
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const data = await fetchFilters(currentCategory);
        setFilterData(data);
        // Auto-expand available dynamic filters
        const newExpanded = { Availability: true, Price: true, Brand: true };
        Object.keys(data.specs || {}).forEach(spec => {
          (newExpanded as any)[spec] = false;
        });
        setExpandedFilters(newExpanded);
      } catch (err) {
        console.error('Failed to load filters', err);
      }
    };
    loadFilters();
  }, [currentCategory]);

  // Load Products from Backend
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (currentCategory !== 'All') params.category = currentCategory;
        if (currentSort) params.sort = currentSort;
        // Search is handled globally, but if present in URL, we fetch it
        const currentSearch = searchParams?.get('q') || '';
        if (currentSearch) params.q = currentSearch;
        
        if (currentMinPrice) params.minPrice = currentMinPrice;
        if (currentMaxPrice) params.maxPrice = currentMaxPrice;
        
        // Apply active custom filters
        Object.keys(activeFilters).forEach(key => {
          if (activeFilters[key].length > 0) {
            params[key] = activeFilters[key].join(',');
          }
        });

        const data = await fetchProducts(params);
        if (data.products) {
          setProducts(data.products);
          setTotalProducts(data.pagination?.total || data.products.length);
        } else {
          setProducts(data);
          setTotalProducts(data.length);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Simple debounce for fetching
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [currentCategory, currentSort, searchParams, currentMinPrice, currentMaxPrice, activeFilters]);

  // Update URL helper
  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams?.toString());
    Object.keys(updates).forEach(key => {
      if (updates[key] === null || updates[key] === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, updates[key] as string);
      }
    });
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const toggleFilter = (group: string, value: string) => {
    const current = activeFilters[group] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    updateUrl({ [group]: updated.length > 0 ? updated.join(',') : null });
  };

  const clearFilters = () => {
    router.push(currentCategory === 'All' ? '/products' : `/products?category=${currentCategory}`, { scroll: false });
  };

  const toggleExpand = (group: string) => {
    setExpandedFilters(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const globalMin = filterData.minPrice || 0;
  const globalMax = filterData.maxPrice || 2000;
  const minVal = currentMinPrice ? Number(currentMinPrice) : globalMin;
  const maxVal = currentMaxPrice ? Number(currentMaxPrice) : globalMax;

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-10 bg-[#F8F9FA] min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Component Catalog</h1>
        <p className="text-gray-500 font-medium mt-2 text-lg">Premium hardware for your DreamCust build.</p>
      </div>
      
      {/* CATEGORY NAV BAR */}
      <CategoryNavBar
        categories={CATALOG_CATEGORIES}
        activeCategory={
          currentCategory === 'All'
            ? 'all'
            : currentCategory.toLowerCase()
        }
        onCategoryChange={(key) => {
          updateUrl({ category: key === 'all' ? null : key.toUpperCase() });
        }}
        className="mb-8"
      />

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* LEFT SIDEBAR - FILTERS */}
        <div className="w-full lg:w-[280px] shrink-0">
          <FilterPanel
            activeFilters={activeFilters}
            expandedSections={expandedFilters}
            priceRange={[minVal, maxVal]}
            minPrice={globalMin}
            maxPrice={globalMax}
            availabilityOptions={['inStock', 'discounted']}
            brands={filterData.brands || []}
            specs={filterData.specs || {}}
            onToggleFilter={toggleFilter}
            onToggleSection={toggleExpand}
            onPriceRangeChange={(range) => {
              setMinPriceInput(String(range[0]));
              setMaxPriceInput(String(range[1]));
              updateUrl({ minPrice: String(range[0]), maxPrice: String(range[1]) });
            }}
            onClearAll={clearFilters}
          />
        </div>

        {/* MAIN PRODUCT GRID */}
        <div className="flex-1">
          
          {/* Sub-header inside main content (Result count & Sorting) */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F3F4F6] pb-4">
            <span className="text-[15px] font-semibold text-[#6B7280]">
              {loading ? 'Updating results…' : `${totalProducts.toLocaleString()} components`}
            </span>
            
            <SortDropdown
              value={currentSort}
              onChange={(val) => updateUrl({ sort: val })}
              options={['Popularity', 'Price: Low to High', 'Price: High to Low', 'Newest', 'Rating']}
            />
          </div>

          <div className="relative min-h-[400px]">
            {loading && products.length === 0 && (
              <div className="absolute inset-0 z-10 bg-[#F8F9FA]/80 backdrop-blur-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {!loading && products.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 mb-2">No hardware found</h3>
                <p className="text-gray-500 font-medium text-base mb-6">Try adjusting your filters to find what you're looking for.</p>
                <button onClick={clearFilters} className="px-8 py-3 bg-[#1A1A1A] hover:bg-black text-white font-bold rounded-xl transition-colors shadow-lg">Clear all filters</button>
              </motion.div>
            ) : (
              <motion.div 
                className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}
              >
                <AnimatePresence mode="popLayout">
                  {products.map((p: any) => (
                    <motion.div 
                      key={p._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>}>
      <CatalogContent />
    </Suspense>
  );
}
