'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, Server, HardDrive, Monitor, Zap, Fan, Box,
  ScreenShare, Gamepad2, Wifi, Package,
  type LucideIcon,
} from 'lucide-react';

// ─── Category Configuration ──────────────────────────────────

export interface CategoryConfig {
  /** Unique key used for filtering & URL params (lowercase) */
  key: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
}

/** Default PC-building categories */
export const PC_CATEGORIES: CategoryConfig[] = [
  { key: 'cpu',         label: 'CPU',         icon: Cpu },
  { key: 'motherboard', label: 'Motherboard', icon: Server },
  { key: 'ram',         label: 'RAM',         icon: HardDrive },
  { key: 'gpu',         label: 'GPU',         icon: Monitor },
  { key: 'storage',     label: 'Storage',     icon: HardDrive },
  { key: 'psu',         label: 'PSU',         icon: Zap },
  { key: 'case',        label: 'Case',        icon: Box },
  { key: 'cooling',     label: 'Cooling',     icon: Fan },
];

/** Extended categories (monitors, peripherals, etc.) */
export const EXTENDED_CATEGORIES: CategoryConfig[] = [
  ...PC_CATEGORIES,
  { key: 'monitor',     label: 'Monitors',    icon: ScreenShare },
  { key: 'peripherals', label: 'Peripherals', icon: Gamepad2 },
  { key: 'networking',  label: 'Networking',  icon: Wifi },
  { key: 'accessories', label: 'Accessories', icon: Package },
];

// ─── Component Props ─────────────────────────────────────────

export interface CategoryNavBarProps {
  /** The list of categories to render. Defaults to PC_CATEGORIES. */
  categories?: CategoryConfig[];
  /** Currently active category key */
  activeCategory: string;
  /**
   * Callback when a category is selected.
   * The parent is responsible for updating state, URL params, etc.
   */
  onCategoryChange: (key: string) => void;
  /** Additional CSS classes on the outer container */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────

export default function CategoryNavBar({
  categories = PC_CATEGORIES,
  activeCategory,
  onCategoryChange,
  className = '',
}: CategoryNavBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // ── Scroll the active category into view ──────────────────
  useEffect(() => {
    const el = itemRefs.current.get(activeCategory);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const scrollLeft =
        el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  // ── Horizontal wheel → horizontal scroll (no page scroll) ─
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  return (
    <div
      className={`
        w-full bg-white border border-[#E5E7EB] rounded-xl
        shadow-[0_2px_12px_rgba(0,0,0,0.04)]
        ${className}
      `}
    >
      <div
        ref={scrollRef}
        className="
          flex items-center gap-1 sm:gap-2
          overflow-x-auto no-scrollbar scroll-smooth
          px-3 sm:px-5 py-2.5
        "
        role="tablist"
        aria-label="Component categories"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          const Icon = cat.icon;

          return (
            <button
              key={cat.key}
              ref={(el) => {
                if (el) itemRefs.current.set(cat.key, el);
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${cat.key}`}
              id={`tab-${cat.key}`}
              onClick={() => onCategoryChange(cat.key)}
              className={`
                relative flex flex-col items-center justify-center
                shrink-0 min-w-[72px] sm:min-w-[88px] px-3 sm:px-5 py-2.5
                rounded-[10px] cursor-pointer
                transition-all duration-200 ease-out
                outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                ${
                  isActive
                    ? 'bg-[#F8FAFF] border-2 border-[#2563EB]'
                    : 'bg-transparent border-2 border-transparent hover:bg-[#F9FAFB] hover:scale-[1.03]'
                }
              `}
            >
              {/* Icon */}
              <Icon
                className={`
                  w-5 h-5 sm:w-[22px] sm:h-[22px] mb-1.5
                  transition-colors duration-200
                  ${isActive ? 'text-[#2563EB]' : 'text-gray-400'}
                `}
                strokeWidth={isActive ? 2.2 : 1.8}
              />

              {/* Label */}
              <span
                className={`
                  text-[11px] sm:text-xs font-semibold leading-tight
                  whitespace-nowrap transition-colors duration-200
                  ${isActive ? 'text-[#2563EB] font-bold' : 'text-gray-500'}
                `}
              >
                {cat.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="category-active-indicator"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#2563EB]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
