'use client';

import { useMemo, useState, useEffect } from 'react';

type Shape = {
  id: string;
  src: string;
  top: string;
  left: string;
  size: number;
  rotate: number;
  opacity: number;
};

const svgToDataUri = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

const ICONS = [
  svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" fill="none">
    <rect x="10" y="28" width="26" height="24" rx="6" fill="white" />
    <rect x="124" y="28" width="26" height="24" rx="6" fill="white" />
    <rect x="36" y="36" width="88" height="8" rx="4" fill="white" />
    <rect x="50" y="22" width="12" height="36" rx="5" fill="white" />
    <rect x="98" y="22" width="12" height="36" rx="5" fill="white" />
  </svg>`),
  svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="white">
    <path d="M60 16c-16 0-30 12-30 28v6h60v-6c0-16-14-28-30-28Z"/>
    <path d="M24 54c-6 0-10 5-10 12v10c0 18 13 32 46 32s46-14 46-32V66c0-7-4-12-10-12H24Z"/>
    <rect x="44" y="8" width="32" height="16" rx="8" />
  </svg>`),
  svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="white">
    <circle cx="60" cy="60" r="44" />
    <circle cx="60" cy="60" r="26" fill="#000000" opacity="0.2"/>
    <circle cx="60" cy="60" r="10" fill="#000000" opacity="0.25"/>
  </svg>`),
  svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" fill="white">
    <rect x="10" y="42" width="140" height="16" rx="8"/>
    <rect x="20" y="32" width="18" height="36" rx="6"/>
    <rect x="122" y="32" width="18" height="36" rx="6"/>
  </svg>`),
];

const randomBetween = (min: number, max: number) =>
  Math.round(min + Math.random() * (max - min));

export function BackgroundMosaic() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shapes = useMemo<Shape[]>(() => {
    if (!mounted) return [];
    
    return Array.from({ length: 9 }).map((_, index) => {
      const src = ICONS[Math.floor(Math.random() * ICONS.length)];
      return {
        id: `${index}-${Math.random().toString(16).slice(2)}`,
        src,
        top: `${randomBetween(-5, 85)}%`,
        left: `${randomBetween(-5, 85)}%`,
        size: randomBetween(140, 240),
        rotate: randomBetween(-18, 18),
        opacity: Math.round(randomBetween(6, 14)) / 100,
      };
    });
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="background-mosaic" aria-hidden="true">
      {shapes.map(shape => (
        <span
          key={shape.id}
          className="background-shape"
          style={{
            top: shape.top,
            left: shape.left,
            width: shape.size,
            height: shape.size,
            opacity: shape.opacity,
            transform: `rotate(${shape.rotate}deg)`,
            backgroundImage: `url('${shape.src}')`,
          }}
        />
      ))}
    </div>
  );
}
