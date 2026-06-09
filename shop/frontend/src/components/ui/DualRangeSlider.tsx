'use client';

import React, { useRef, useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

// ─── Component ──────────────────────────────────────────────

/**
 * Redesigned dual-range price slider.
 *
 * Key fixes:
 * - 16px horizontal padding so handles never clip the container edge
 * - 6px track height with 999px radius
 * - 20×20 handles with 3px blue border, white bg, proper shadow
 * - Scale 1.1 on hover, 1.15 on active drag
 * - Pointer math accounts for the padding offset
 */
export function DualRangeSlider({ min, max, value, onChange }: DualRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const range = max - min || 1;
  const valMin = Math.max(min, Math.min(value[0], max));
  const valMax = Math.max(min, Math.min(value[1], max));

  const minPercent = ((valMin - min) / range) * 100;
  const maxPercent = ((valMax - min) / range) * 100;

  const resolveValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return null;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + pct * range);
    },
    [min, range],
  );

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    handle: 'min' | 'max',
  ) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    setDragging(handle);

    const onMove = (moveEvent: PointerEvent) => {
      const raw = resolveValue(moveEvent.clientX);
      if (raw === null) return;
      if (handle === 'min') {
        onChange([Math.min(raw, valMax - 1), valMax]);
      } else {
        onChange([valMin, Math.max(raw, valMin + 1)]);
      }
    };

    const onUp = (upEvent: PointerEvent) => {
      setDragging(null);
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  };

  return (
    <div
      className="relative w-full select-none touch-none cursor-pointer"
      style={{ padding: '12px 16px' }}
    >
      {/* Track area (the ref measures only the track, excluding padding) */}
      <div ref={trackRef} className="relative h-[6px]">
        {/* Background track */}
        <div
          className="absolute inset-0 rounded-[999px]"
          style={{ backgroundColor: '#E5E7EB' }}
        />

        {/* Active range track */}
        <div
          className="absolute top-0 bottom-0 rounded-[999px] transition-[left,right] duration-75"
          style={{
            backgroundColor: '#2563EB',
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        {/* ── Min handle ── */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2
            w-[20px] h-[20px] rounded-full
            bg-white
            cursor-grab active:cursor-grabbing
            z-10
            transition-transform duration-150
            ${dragging === 'min' ? 'scale-[1.15]' : 'hover:scale-110'}
          `}
          style={{
            left: `${minPercent}%`,
            marginLeft: '-10px',
            border: '3px solid #2563EB',
            boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
          }}
          onPointerDown={(e) => handlePointerDown(e, 'min')}
        />

        {/* ── Max handle ── */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2
            w-[20px] h-[20px] rounded-full
            bg-white
            cursor-grab active:cursor-grabbing
            z-10
            transition-transform duration-150
            ${dragging === 'max' ? 'scale-[1.15]' : 'hover:scale-110'}
          `}
          style={{
            left: `${maxPercent}%`,
            marginLeft: '-10px',
            border: '3px solid #2563EB',
            boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
          }}
          onPointerDown={(e) => handlePointerDown(e, 'max')}
        />
      </div>
    </div>
  );
}
