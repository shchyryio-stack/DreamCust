"use client";

import { useState, useRef, useEffect, SyntheticEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import WishlistButton from '@/components/product/WishlistButton';
import ProductReviews from '@/components/product/ProductReviews';
import AddToCartButton from '@/components/product/AddToCartButton';
import { resolveImageUrl, handleImageError } from '@/utils/productImage';

// Section icons removed as per design guidelines

const formatSpecKey = (key: string) => {
  const result = key.replace(/([A-Z])/g, ' $1').trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const EASE = [0.22, 1, 0.36, 1] as any;

function Accordion({ title, children, defaultOpen = true, image }: any) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100/60 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 sm:py-5 flex items-center justify-between text-left focus:outline-none group hover:bg-gray-50/80 rounded-xl px-2 transition-colors duration-200"
      >
        <div className="flex items-center">
          <span className="text-base font-extrabold text-[#1A1A1A] transition-colors duration-200">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <LucideIcons.ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-2"
          >
            <div className="pb-5 pt-1">
              {image && (
                <div className="w-full mb-4 rounded-xl overflow-hidden bg-gray-50/50 border border-gray-100 flex items-center justify-center p-4">
                  <img src={image} alt={`${title} visualization`} className="max-h-48 object-contain" />
                </div>
              )}
              <div className="rounded-xl overflow-hidden border border-gray-50/80 bg-gray-50/30">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetailClient({ product }: { product: any }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const BASE_URL = API_URL.replace(/\/api$/, '');

  const hasVariants = product.variants && product.variants.length > 0;
  const [activeVariant, setActiveVariant] = useState(hasVariants ? product.variants[0] : product);
  
  const getVariantImages = (v: any) => {
    if (v.gallery && v.gallery.length > 0) {
      return v.gallery.map((img: any) => img.url || img).filter(Boolean);
    }
    return v.images || [];
  };

  const currentImages = getVariantImages(activeVariant).length > 0
    ? getVariantImages(activeVariant)
    : (product.images || []);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomMode, setZoomMode] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const thumbnailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveImageIdx(0);
    setZoomMode(false);
  }, [activeVariant]);

  useEffect(() => {
    const el = thumbnailsRef.current;
    if (!el) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomMode) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleMouseLeave = () => {
    setZoomMode(false);
    setZoomPos({ x: 50, y: 50 });
  };

  const nextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setActiveImageIdx((prev) => (prev === 0 ? currentImages.length - 1 : prev - 1));
  };



  const getVariantPrice = (v: any, prod: any) => {
    if (v.pricing?.price !== undefined) {
      const base = v.pricing.price;
      const activeDisc = v.discounts?.find((d: any) => {
        if (!d.isEnabled) return false;
        const now = new Date();
        if (d.startDate && new Date(d.startDate) > now) return false;
        if (d.endDate && new Date(d.endDate) < now) return false;
        return true;
      });
      if (activeDisc) {
        return base * (1 - activeDisc.value / 100);
      }
      return base;
    }
    return v.price ?? prod.pricing?.price ?? prod.price ?? 0;
  };

  const getVariantOldPrice = (v: any, prod: any) => {
    if (v.pricing?.price !== undefined) {
      const base = v.pricing.price;
      const activeDisc = v.discounts?.find((d: any) => {
        if (!d.isEnabled) return false;
        const now = new Date();
        if (d.startDate && new Date(d.startDate) > now) return false;
        if (d.endDate && new Date(d.endDate) < now) return false;
        return true;
      });
      if (activeDisc && activeDisc.value > 0) {
        return base;
      }
      return undefined;
    }
    return v.oldPrice ?? prod.pricing?.oldPrice ?? prod.oldPrice;
  };

  const availableStock = product.computed?.totalQuantity ?? 0;
  const inStock = product.computed?.inStock ?? false;

  const stockLabel = inStock ? (availableStock > 5 ? 'In Stock' : 'Low Stock') : 'Out of Stock';
  const stockColor = inStock ? (availableStock > 5 ? 'text-green-600' : 'text-orange-600') : 'text-red-600';
  const stockBgColor = inStock ? (availableStock > 5 ? 'bg-green-50' : 'bg-orange-50') : 'bg-red-50';

  const currentPrice = getVariantPrice(activeVariant, product);
  const currentOldPrice = getVariantOldPrice(activeVariant, product);
  const sellingUnit = product.pricing?.label || 'pc';
  const sellingQty = product.pricing?.quantity || 1;

  const compCards = useMemo(() => {
    const raw = activeVariant.compatibility?.length > 0 
      ? activeVariant.compatibility 
      : (product.compatibility?.length > 0 ? product.compatibility : []);
      
    if (!Array.isArray(raw)) return [];

    return raw.map((card: any) => {
      if (!card || typeof card !== 'object') return null;

      let title = '';
      if (card.title) {
        title = typeof card.title === 'object' ? (card.title.label || card.title.name || JSON.stringify(card.title)) : String(card.title);
      }

      let tags: Array<{ label: string; color: string }> = [];
      const rawTags = card.tags || card.values || [];
      if (Array.isArray(rawTags)) {
        tags = rawTags.map((tag: any) => {
          if (!tag) return null;
          if (typeof tag === 'object') {
            const label = tag.label || tag.name || tag.value || '';
            const color = tag.color || 'neutral';
            if (label && typeof label !== 'object') {
              return { label: String(label), color: String(color) };
            }
            return null;
          }
          return { label: String(tag), color: 'neutral' };
        }).filter(Boolean) as any;
      }

      if (!title && tags.length === 0) return null;
      if (title === '[object Object]') return null;

      return { title, tags };
    }).filter(Boolean);
  }, [activeVariant, product]);

  const highlights = activeVariant.highlights?.length > 0 ? activeVariant.highlights : product.highlights;
  
  const rawSpecs = activeVariant.specifications || product.specifications || activeVariant.specs || product.specs || {};

  const formatSpecValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      return value.map(val => {
        if (typeof val === 'object' && val !== null) {
          return val.label || val.name || JSON.stringify(val);
        }
        return String(val);
      }).join(', ');
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([k, v]) => `${formatSpecKey(k)}: ${formatSpecValue(v)}`)
        .join(', ');
    }
    return String(value);
  };

  const processedSections = useMemo(() => {
    const sections: Array<{ title: string; iconKey: string; specs: Record<string, any> }> = [];

    Object.entries(rawSpecs).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      if (key === '_id') return;

      // Only render actual nested spec objects representing exact database blueprint structure
      if (typeof value === 'object' && !Array.isArray(value)) {
        sections.push({
          title: formatSpecKey(key),
          iconKey: key,
          specs: value as Record<string, any>
        });
      }
    });

    return sections;
  }, [rawSpecs]);

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6 lg:pt-10">
        
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-16 relative items-start">
          
          {/* LEFT: Product Gallery (Sticky) */}
          <div className="w-full lg:w-[55%] lg:sticky lg:top-6 z-10">
            {currentImages.length > 0 ? (
              <div className="flex flex-col gap-5">
                <div 
                  className={`w-full aspect-square xl:aspect-[4/3] bg-white rounded-[28px] border border-gray-100/80 overflow-hidden relative group flex items-center justify-center transition-all duration-300 shadow-[0_4px_30px_rgb(0,0,0,0.03)] ${zoomMode ? 'cursor-crosshair' : 'cursor-default'}`}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onMouseEnter={() => setZoomMode(true)}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImageIdx}
                      src={resolveImageUrl(currentImages[activeImageIdx])}
                      alt={`${activeVariant.title || product.title || activeVariant.name || product.name} view`}
                      onError={handleImageError}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="absolute inset-0 w-full h-full object-contain p-8 md:p-14 will-change-transform pointer-events-none"
                      style={{
                        transform: zoomMode ? 'scale(2)' : 'scale(1)',
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), transform-origin 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
                      }}
                    />
                  </AnimatePresence>

                  {!zoomMode && currentImages.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-4 z-20 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-gray-250 flex items-center justify-center text-gray-500 hover:text-[#1A1A1A] hover:bg-white transition-colors duration-200 opacity-0 group-hover:opacity-100">
                        <LucideIcons.ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={nextImage} className="absolute right-4 z-20 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-gray-250 flex items-center justify-center text-gray-500 hover:text-[#1A1A1A] hover:bg-white transition-colors duration-200 opacity-0 group-hover:opacity-100">
                        <LucideIcons.ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
                
                {currentImages.length > 1 && (
                  <div className="relative">
                    <div 
                      ref={thumbnailsRef}
                      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" 
                      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                    >
                      {currentImages.map((img: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => { setActiveImageIdx(index); setZoomMode(false); }}
                          className={`shrink-0 w-20 h-20 xl:w-24 xl:h-24 rounded-2xl border transition-colors duration-200 overflow-hidden p-2 bg-white ${
                            index === activeImageIdx 
                              ? 'border-[#1E6FE8] ring-2 ring-blue-100/50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                          } flex items-center justify-center`}
                        >
                          <img
                            src={resolveImageUrl(img)}
                            alt={`Thumbnail ${index + 1}`}
                            onError={handleImageError}
                            className="w-full h-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tech Specs Desktop */}
                <div className="mt-8 hidden lg:block">
                  <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-4 tracking-tight">Tech Specs</h2>
                  <div className="bg-white rounded-[24px] shadow-[0_2px_16px_rgb(0,0,0,0.02)] border border-gray-100 p-2">
                    {processedSections.length > 0 ? (
                      processedSections.map((section: any, sIdx: number) => {
                        const iconMap: Record<string, any> = {
                          identification: <LucideIcons.Fingerprint className="w-5 h-5" />,
                          generalSpecifications: <LucideIcons.LayoutList className="w-5 h-5" />,
                          coolingSupport: <LucideIcons.Fan className="w-5 h-5" />,
                          storageSupport: <LucideIcons.HardDrive className="w-5 h-5" />,
                          dimensions: <LucideIcons.Maximize className="w-5 h-5" />,
                          ioPorts: <LucideIcons.Usb className="w-5 h-5" />,
                          general: <LucideIcons.Info className="w-5 h-5" />
                        };

                        return (
                          <Accordion 
                            key={sIdx} 
                            title={section.title} 
                            defaultOpen={sIdx === 0}
                          >
                            <div className="flex flex-col">
                              {Object.entries(section.specs).map(([key, value], idx) => {
                                const valStr = formatSpecValue(value);
                                if (!valStr) return null;
                                return (
                                  <div key={key} className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 px-5 transition-colors duration-200 hover:bg-white ${idx % 2 === 0 ? 'bg-transparent' : 'bg-gray-50/40'}`}>
                                    <span className="text-gray-500 font-medium text-sm sm:w-1/2">{formatSpecKey(key)}</span>
                                    <span className="text-[#1A1A1A] font-bold text-sm sm:w-1/2 sm:text-right">{valStr}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </Accordion>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-400">No specifications available.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-50 rounded-[28px] flex items-center justify-center border border-gray-100">
                <span className="text-gray-200 text-5xl font-black uppercase tracking-tighter select-none">{product.category}</span>
              </div>
            )}
          </div>

          {/* RIGHT: Product Sticky Info */}
          <div className="w-full lg:w-[45%] flex flex-col">
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#1E6FE8] text-[11px] font-extrabold uppercase tracking-widest bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100/50">
                {product.category}
              </span>
              {activeVariant.badge && (
                <span className="text-orange-600 text-[11px] font-extrabold uppercase tracking-widest bg-orange-50/80 px-2.5 py-1 rounded-full border border-orange-100/50">
                  {activeVariant.badge}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] leading-[1.1] tracking-tight mb-4">
              {activeVariant.title || product.title || activeVariant.name || product.name}
            </h1>
            
            <p className="text-gray-500 text-base font-medium leading-relaxed mb-6">
              {product.description}
            </p>

            <div className="mb-6">
              <div className="flex items-end gap-3 mb-1.5">
                <span className="text-4xl font-black text-[#1A1A1A] tracking-tight">₴{currentPrice.toFixed(2)}</span>
                <span className="text-base font-bold text-gray-400 mb-1">/ {sellingQty} {sellingUnit}</span>
              </div>
              {currentOldPrice && (
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md">SAVE ₴{(currentOldPrice - currentPrice).toFixed(2)}</span>
                  <span className="text-sm font-bold text-gray-400 line-through">Was ₴{currentOldPrice.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="w-full h-px bg-gray-100/80 mb-6"></div>

            {/* Variants */}
            {hasVariants && (
              <div className="mb-8">
                <h3 className="text-sm font-extrabold text-[#1A1A1A] mb-3">Color</h3>
                
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: any) => {
                    const isSelected = activeVariant.id === v.id;
                    const vName = v.colorName || v.name || '';
                    const vColor = v.colorHex || v.color || '#ccc';
                    const vImages = getVariantImages(v);
                    return (
                      <button
                        key={v.id}
                        onClick={() => setActiveVariant(v)}
                        className={`group relative flex flex-col items-center justify-between p-2 rounded-xl transition-colors duration-200 w-[96px] h-[108px] ${
                          isSelected 
                            ? 'border-2 border-[#1E6FE8] bg-blue-50/5' 
                            : 'border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/40'
                        }`}
                      >
                        <div className="w-full flex-1 flex items-center justify-center bg-transparent mb-1.5 overflow-hidden">
                          {vImages?.[0] ? (
                            <img 
                              src={resolveImageUrl(vImages[0])} 
                              alt={vName} 
                              onError={handleImageError} 
                              className="max-w-full max-h-16 object-contain bg-transparent border-0 outline-none" 
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-gray-300 bg-transparent" style={{ backgroundColor: vColor }}></div>
                          )}
                        </div>
                        <span className="text-[11px] leading-snug font-bold text-center text-gray-700 truncate w-full px-0.5 bg-transparent">{vName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cart & Actions */}
            <div className="bg-gray-50/40 border border-gray-100/80 rounded-[24px] p-5 mb-8">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={stockLabel}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold mb-5 ${stockBgColor} ${stockColor}`}
                >
                  {stockLabel}
                  <span className="opacity-70 font-medium ml-1">({availableStock} available)</span>
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-col gap-3">
                <AddToCartButton 
                  product={activeVariant} 
                  disabled={!inStock} 
                  price={currentPrice}
                  name={activeVariant.title || product.title || activeVariant.name || product.name}
                  image={currentImages[0] || ''}
                  slug={product.slug}
                  productId={product._id}
                />
                <div className="grid grid-cols-2 gap-3">
                  <WishlistButton productId={product._id} />
                  <button className="bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[#1A1A1A] py-3.5 px-4 rounded-2xl font-bold text-sm transition-colors duration-200 flex items-center justify-center gap-2 group">
                    <LucideIcons.ArrowLeftRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                    Compare
                  </button>
                </div>
              </div>
            </div>

            {/* Highlights */}
            {highlights && highlights.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base font-extrabold text-[#1A1A1A] mb-4">Key Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((highlight: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-gray-300">
                      <div>
                        <p className="text-sm font-extrabold text-[#1A1A1A] mb-1">{highlight.title}</p>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{highlight.description}</p>
                      </div>
                      {(() => {
                        const linkUrl = highlight.link || highlight.url || highlight.buttonUrl || highlight.linkUrl;
                        if (!linkUrl) return null;
                        return (
                          <a 
                            href={linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center text-[11px] font-bold text-green-650 hover:text-green-700 transition-colors duration-200 mt-1 self-start"
                          >
                            {highlight.linkText || highlight.buttonText || 'Learn More'}
                          </a>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compatibility */}
            {compCards && compCards.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base font-extrabold text-[#1A1A1A] mb-3">Compatibility</h3>
                <div className="flex flex-col gap-3">
                  {compCards.map((card: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col gap-1.5 transition-colors duration-200 hover:border-gray-350">
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{card.title}</span>
                      <div className="text-sm font-semibold text-[#1A1A1A]">
                        {card.tags?.map((t: any) => t.label).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.builderReady && (
              <div className="bg-[#1A1A1A] hover:bg-[#2c2c2c] text-white p-5 rounded-2xl cursor-pointer mb-6 transition-colors duration-200">
                <div className="relative z-10">
                  <h3 className="text-sm font-bold mb-0.5">Custom Build Ready</h3>
                  <p className="text-gray-400 text-[11px] font-medium">Add to configurator to check compatibility.</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Tech Specs */}
        <div className="mt-8 lg:hidden">
          <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-4 tracking-tight">Tech Specs</h2>
          <div className="bg-white rounded-[24px] shadow-[0_2px_16px_rgb(0,0,0,0.02)] border border-gray-100 p-2">
            {processedSections.length > 0 ? (
              processedSections.map((section: any, sIdx: number) => {
                const iconMap: Record<string, any> = {
                  identification: <LucideIcons.Fingerprint className="w-5 h-5" />,
                  generalSpecifications: <LucideIcons.LayoutList className="w-5 h-5" />,
                  coolingSupport: <LucideIcons.Fan className="w-5 h-5" />,
                  storageSupport: <LucideIcons.HardDrive className="w-5 h-5" />,
                  dimensions: <LucideIcons.Maximize className="w-5 h-5" />,
                  ioPorts: <LucideIcons.Usb className="w-5 h-5" />,
                  general: <LucideIcons.Info className="w-5 h-5" />
                };

                return (
                  <Accordion 
                    key={sIdx} 
                    title={section.title} 
                    defaultOpen={sIdx === 0}
                  >
                    <div className="flex flex-col">
                      {Object.entries(section.specs).map(([key, value], idx) => {
                        const valStr = formatSpecValue(value);
                        if (!valStr) return null;
                        return (
                          <div key={key} className={`flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-4 transition-colors hover:bg-white ${idx % 2 === 0 ? 'bg-transparent' : 'bg-gray-50/40'}`}>
                            <span className="text-gray-500 font-medium text-sm sm:w-1/2">{formatSpecKey(key)}</span>
                            <span className="text-[#1A1A1A] font-bold text-sm sm:w-1/2 sm:text-right">{valStr}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Accordion>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-gray-400">No specifications available.</div>
            )}
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="mt-12 pt-10 border-t border-gray-100">
          <ProductReviews product={product} />
        </div>

      </div>
    </div>
  );
}
