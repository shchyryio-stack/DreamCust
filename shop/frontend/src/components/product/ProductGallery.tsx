"use client";

import { useState } from "react";

export default function ProductGallery({ images, category }: { images: string[], category: string }) {
  const [activeImage, setActiveImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const BASE_URL = API_URL.replace(/\/api$/, '');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YxZjVmOSIgLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2QxZDVkYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuKThjwvdGV4dD48L3N2Zz4=';
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="w-full aspect-square md:aspect-[4/3] bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100">
          <span className="text-gray-200 text-6xl md:text-8xl font-black uppercase tracking-tighter select-none">{category}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div 
        className="w-full aspect-square md:aspect-[4/3] bg-white rounded-3xl border border-gray-100 overflow-hidden relative cursor-crosshair group flex items-center justify-center"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={`${BASE_URL}${images[activeImage]}`}
          alt={`${category} view`}
          onError={handleImageError}
          className={`relative z-10 w-full h-full object-contain p-8 transition-transform duration-300 ease-out ${isZoomed ? 'scale-[2]' : 'scale-100 group-hover:scale-105'}`}
          style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
        />
      </div>
      
      {/* Horizontal Thumbnail Slider */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(index)}
              className={`snap-start shrink-0 w-24 h-24 rounded-2xl border-2 transition-all overflow-hidden p-2 bg-white ${
                index === activeImage 
                  ? 'border-[#1E6FE8] ring-4 ring-blue-50' 
                  : 'border-transparent shadow-sm hover:border-gray-200 hover:shadow-md'
              } flex items-center justify-center`}
            >
              <img
                src={`${BASE_URL}${img}`}
                alt={`Thumbnail ${index + 1}`}
                onError={handleImageError}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
