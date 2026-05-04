'use client';

import { useEffect, useRef, useCallback } from 'react';

interface CallyCalendarProps {
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
}

export function CallyCalendar({ value, onChange, min, max }: CallyCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLElement | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  // Keep refs up to date without triggering re-renders
  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  });

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Wait for cally to load
      await import('cally');
      if (!mounted) return;

      const container = containerRef.current;
      if (!container) return;

      // Clear any existing content
      container.innerHTML = '';

      const calendarDate = document.createElement('calendar-date');
      calendarDate.className = 'cally';
      calendarDate.style.cssText = '--color-accent:#10b981;--color-text-on-accent:#ffffff;background:#ffffff;color:#1f2937;border-radius:0.5rem;padding:0.5rem;';
      
      if (value) {
        (calendarDate as any).value = value;
      }
      if (min) {
        calendarDate.setAttribute('min', min);
      }
      if (max) {
        calendarDate.setAttribute('max', max);
      }

      const prevSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      prevSvg.setAttribute('aria-label', 'Previous');
      prevSvg.setAttribute('class', 'fill-current size-4');
      prevSvg.setAttribute('slot', 'previous');
      prevSvg.setAttribute('viewBox', '0 0 24 24');
      const prevPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      prevPath.setAttribute('d', 'M15.75 19.5 8.25 12l7.5-7.5');
      prevSvg.appendChild(prevPath);

      const nextSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      nextSvg.setAttribute('aria-label', 'Next');
      nextSvg.setAttribute('class', 'fill-current size-4');
      nextSvg.setAttribute('slot', 'next');
      nextSvg.setAttribute('viewBox', '0 0 24 24');
      const nextPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      nextPath.setAttribute('d', 'm8.25 4.5 7.5 7.5-7.5 7.5');
      nextSvg.appendChild(nextPath);

      const calendarMonth = document.createElement('calendar-month');

      calendarDate.appendChild(prevSvg);
      calendarDate.appendChild(nextSvg);
      calendarDate.appendChild(calendarMonth);

      // Stable handler that always calls the latest ref
      const handleChange = (e: Event) => {
        const target = e.target as HTMLElement;
        const newValue = (target as any).value || target.getAttribute('value') || '';
        if (newValue && newValue !== valueRef.current) {
          onChangeRef.current?.(newValue);
        }
      };

      // Fallback click handler for Shadow DOM events
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[role="gridcell"]') || target.closest('td')) {
          // Give cally time to update its value
          requestAnimationFrame(() => {
            const calEl = container.querySelector('calendar-date');
            const newValue = (calEl as any)?.value || calEl?.getAttribute('value') || '';
            if (newValue && newValue !== valueRef.current) {
              onChangeRef.current?.(newValue);
            }
          });
        }
      };

      calendarDate.addEventListener('change', handleChange);
      container.addEventListener('click', handleClick);
      container.appendChild(calendarDate);
      calendarRef.current = calendarDate;
    }

    init();

    return () => {
      mounted = false;
      const container = containerRef.current;
      if (container) {
        container.innerHTML = '';
      }
      calendarRef.current = null;
    };
  }, []); // Only run once on mount - we use refs for dynamic values

  // Update attributes when props change
  useEffect(() => {
    const cal = calendarRef.current;
    if (!cal) return;
    
    if (value !== undefined) {
      (cal as any).value = value;
    }
    if (min !== undefined) {
      if (min) {
        cal.setAttribute('min', min);
      } else {
        cal.removeAttribute('min');
      }
    }
    if (max !== undefined) {
      if (max) {
        cal.setAttribute('max', max);
      } else {
        cal.removeAttribute('max');
      }
    }
  }, [value, min, max]);

  return (
    <div 
      ref={containerRef} 
      style={{ colorScheme: 'light only' }}
    />
  );
}
