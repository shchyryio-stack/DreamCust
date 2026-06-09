'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Monitor, HardDrive, Rocket,
  AppWindow, FileText, Wrench,
  Shield,
  type LucideIcon,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

export interface ServiceOption {
  /** Unique service identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Price in base currency */
  price: number;
  /** Icon component */
  icon: LucideIcon;
  /** Category grouping */
  category: 'tuning' | 'software' | 'warranty';
  /**
   * Mutual-exclusion group.
   * Only one service in the same `exclusiveGroup` can be active at a time.
   */
  exclusiveGroup?: string;
  /**
   * IDs of services that this option supersedes.
   * When this service is selected, superseded services are automatically deselected.
   */
  supersedes?: string[];
}

export interface ServiceCategory {
  key: string;
  label: string;
  services: ServiceOption[];
}

// ─── Default Service Catalog ────────────────────────────────

export const SERVICE_CATALOG: ServiceCategory[] = [
  {
    key: 'tuning',
    label: 'Performance Tuning',
    services: [
      {
        id: 'cpu-oc',
        name: 'CPU Overclocking',
        description: 'Professional CPU tuning and stress testing.',
        price: 49,
        icon: Cpu,
        category: 'tuning',
      },
      {
        id: 'gpu-oc',
        name: 'GPU Overclocking',
        description: 'GPU performance optimization and stability testing.',
        price: 39,
        icon: Monitor,
        category: 'tuning',
      },
      {
        id: 'ram-opt',
        name: 'RAM Optimization',
        description: 'Enable XMP/EXPO profiles and memory tuning.',
        price: 19,
        icon: HardDrive,
        category: 'tuning',
      },
      {
        id: 'full-opt',
        name: 'Full System Optimization',
        description: 'CPU + GPU + RAM tuning package.',
        price: 89,
        icon: Rocket,
        category: 'tuning',
        supersedes: ['cpu-oc', 'gpu-oc', 'ram-opt'],
      },
    ],
  },
  {
    key: 'software',
    label: 'Software Installation',
    services: [
      {
        id: 'win-install',
        name: 'Windows Installation',
        description: 'Install and configure Windows.',
        price: 25,
        icon: AppWindow,
        category: 'software',
      },
      {
        id: 'office-install',
        name: 'Microsoft Office Installation',
        description: 'Install and activate Office package.',
        price: 15,
        icon: FileText,
        category: 'software',
      },
      {
        id: 'driver-install',
        name: 'Driver Installation',
        description: 'Install motherboard, GPU, chipset and system drivers.',
        price: 10,
        icon: Wrench,
        category: 'software',
      },
    ],
  },
  {
    key: 'warranty',
    label: 'Extended Warranty',
    services: [
      {
        id: 'warranty-2y',
        name: 'Extended Warranty +2 Years',
        description: 'Additional coverage beyond standard warranty.',
        price: 79,
        icon: Shield,
        category: 'warranty',
        exclusiveGroup: 'warranty',
      },
      {
        id: 'warranty-3y',
        name: 'Extended Warranty +3 Years',
        description: 'Premium extended support package.',
        price: 119,
        icon: Shield,
        category: 'warranty',
        exclusiveGroup: 'warranty',
      },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────

/** Flatten every service from the catalog into a single lookup map by id. */
function buildServiceMap(catalog: ServiceCategory[]): Map<string, ServiceOption> {
  const map = new Map<string, ServiceOption>();
  for (const cat of catalog) {
    for (const svc of cat.services) {
      map.set(svc.id, svc);
    }
  }
  return map;
}

// ─── Component Props ────────────────────────────────────────

export interface AdditionalServicesProps {
  /** Currently selected service IDs */
  selectedServiceIds: string[];
  /** Called whenever the selection changes (full new array) */
  onSelectionChange: (ids: string[]) => void;
  /** Service catalog — data-driven, defaults to SERVICE_CATALOG */
  catalog?: ServiceCategory[];
}

// ─── Component ──────────────────────────────────────────────

export default function AdditionalServices({
  selectedServiceIds,
  onSelectionChange,
  catalog = SERVICE_CATALOG,
}: AdditionalServicesProps) {
  const serviceMap = useMemo(() => buildServiceMap(catalog), [catalog]);

  const toggleService = (id: string) => {
    const svc = serviceMap.get(id);
    if (!svc) return;

    const isCurrentlySelected = selectedServiceIds.includes(id);

    if (isCurrentlySelected) {
      // Deselect
      onSelectionChange(selectedServiceIds.filter((s) => s !== id));
      return;
    }

    // Select — apply business rules
    let next = [...selectedServiceIds, id];

    // 1) Exclusive group: deselect others in the same group
    if (svc.exclusiveGroup) {
      const othersInGroup = Array.from(serviceMap.values())
        .filter((s) => s.exclusiveGroup === svc.exclusiveGroup && s.id !== id)
        .map((s) => s.id);
      next = next.filter((s) => !othersInGroup.includes(s));
    }

    // 2) Supersedes: deselect services this one replaces
    if (svc.supersedes && svc.supersedes.length > 0) {
      next = next.filter((s) => !svc.supersedes!.includes(s));
    }

    // 3) If an individual service is being selected, but the package that
    //    supersedes it is already selected, remove the package.
    for (const existingId of next) {
      if (existingId === id) continue;
      const existing = serviceMap.get(existingId);
      if (existing?.supersedes?.includes(id)) {
        next = next.filter((s) => s !== existingId);
      }
    }

    onSelectionChange(next);
  };

  const selectedTotal = useMemo(
    () =>
      selectedServiceIds.reduce((sum, id) => {
        const svc = serviceMap.get(id);
        return sum + (svc?.price ?? 0);
      }, 0),
    [selectedServiceIds, serviceMap],
  );

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-wider">
          Additional Services
        </h3>
        {selectedTotal > 0 && (
          <span className="text-[12px] font-bold text-[#2563EB]">
            +₴{selectedTotal}
          </span>
        )}
      </div>

      <div className="space-y-5">
        {catalog.map((cat) => (
          <div key={cat.key}>
            {/* Category label */}
            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2.5 pl-0.5">
              {cat.label}
            </div>

            <div className="space-y-2">
              {cat.services.map((svc) => {
                const isSelected = selectedServiceIds.includes(svc.id);

                // Is this individual service disabled because its package is selected?
                const isSuperseded = catalog
                  .flatMap((c) => c.services)
                  .some(
                    (s) =>
                      s.supersedes?.includes(svc.id) &&
                      selectedServiceIds.includes(s.id),
                  );

                const Icon = svc.icon;

                return (
                  <motion.button
                    key={svc.id}
                    layout
                    onClick={() => !isSuperseded && toggleService(svc.id)}
                    disabled={isSuperseded}
                    className={`
                      w-full flex items-start gap-3 p-3 rounded-xl
                      text-left cursor-pointer
                      transition-all duration-200 ease-out
                      outline-none
                      ${isSuperseded
                        ? 'opacity-40 cursor-not-allowed border border-gray-100 bg-gray-50/50'
                        : isSelected
                          ? 'border border-[#2563EB] bg-[#F8FAFF] shadow-[0_0_0_1px_rgba(37,99,235,0.1)]'
                          : 'border border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/40'
                      }
                    `}
                  >
                    {/* Checkbox / indicator */}
                    <div
                      className={`
                        mt-0.5 w-[18px] h-[18px] rounded-[6px] flex items-center justify-center shrink-0
                        transition-all duration-200
                        ${isSelected
                          ? 'bg-[#2563EB] border-2 border-[#2563EB]'
                          : 'border-2 border-[#D1D5DB] bg-white'
                        }
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="w-[11px] h-[11px] text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`
                        mt-0.5 shrink-0
                        transition-colors duration-200
                        ${isSelected ? 'text-[#2563EB]' : 'text-gray-300'}
                      `}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-bold leading-tight transition-colors duration-200 ${
                          isSelected ? 'text-[#111827]' : 'text-gray-700'
                        }`}
                      >
                        {svc.name}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 font-medium leading-snug">
                        {svc.description}
                      </div>
                    </div>

                    {/* Price */}
                    <div
                      className={`
                        text-xs font-bold shrink-0 mt-0.5
                        transition-colors duration-200
                        ${isSelected ? 'text-[#2563EB]' : 'text-gray-500'}
                      `}
                    >
                      + ₴{svc.price}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Utility: resolve selected services into a summary list ─

export function getSelectedServices(
  ids: string[],
  catalog: ServiceCategory[] = SERVICE_CATALOG,
): { id: string; name: string; price: number }[] {
  const map = buildServiceMap(catalog);
  return ids
    .map((id) => {
      const svc = map.get(id);
      if (!svc) return null;
      return { id: svc.id, name: svc.name, price: svc.price };
    })
    .filter(Boolean) as { id: string; name: string; price: number }[];
}

export function getServicesTotal(
  ids: string[],
  catalog: ServiceCategory[] = SERVICE_CATALOG,
): number {
  return getSelectedServices(ids, catalog).reduce((s, svc) => s + svc.price, 0);
}
