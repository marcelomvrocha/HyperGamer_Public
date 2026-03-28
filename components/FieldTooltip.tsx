'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FieldTooltipProps {
  label: string;
  explanation: string;
  children: React.ReactNode;
}

const TOOLTIP_WIDTH = 288; // 18rem
const GAP = 8;

export function FieldTooltip({ label, explanation, children }: FieldTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTooltip || typeof document === 'undefined') return;

    const updatePosition = () => {
      const trigger = triggerRef.current?.querySelector('button');
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const padding = 12;

      // Prefer above the (i) so it's less often obscured
      let top = rect.top - GAP;
      let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;

      // Keep within viewport horizontally
      if (left < padding) left = padding;
      if (left + TOOLTIP_WIDTH > viewportW - padding) left = viewportW - TOOLTIP_WIDTH - padding;
      // If tooltip would go above viewport, show below the button
      if (top < padding) top = rect.bottom + GAP;

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showTooltip]);

  const resolvedContent = showTooltip && typeof document !== 'undefined' && (
    <div
      role="tooltip"
      className="fixed z-[9999] w-72 max-w-[calc(100vw-2rem)] p-4 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-xl shadow-2xl border-2 border-blue-500/60 ring-4 ring-blue-500/20"
      style={{ top: position.top, left: position.left, ...(position.top > 100 ? { transform: 'translateY(-100%)' } : {}) }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="font-semibold mb-2 text-blue-200">{label}</div>
      <div className="text-gray-200 leading-relaxed">{explanation}</div>
    </div>
  );

  return (
    <div ref={triggerRef} className="relative block w-full max-w-full sm:inline-block sm:w-auto">
      <div className="flex items-start gap-1 max-w-full">
        {children}
        <button
          type="button"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          className="flex-shrink-0 p-0.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
          aria-label={`Info about ${label}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      {typeof document !== 'undefined' && resolvedContent && createPortal(resolvedContent, document.body)}
    </div>
  );
}
