'use client';

import { useEffect, useRef } from 'react';

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

  // Keep ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Helper to normalize date
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      await import('cally');
      if (!mounted) return;

      const container = containerRef.current;
      if (!container) return;

      container.innerHTML = '';

      const calendarDate = document.createElement('calendar-date');
      calendarDate.className = 'cally';
      calendarDate.style.borderRadius = '0.5rem';
      calendarDate.style.padding = '0.5rem';
      
      if (value) {
        (calendarDate as any).value = value;
      }
      if (min) calendarDate.setAttribute('min', min);
      if (max) calendarDate.setAttribute('max', max);

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

      // Handle change event
      const handleChange = (e: Event) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        const rawValue = (target as any).value || '';
        const newValue = normalizeDate(rawValue);
        if (newValue) {
          onChangeRef.current?.(newValue);
        }
      };

      // Also handle click on calendar cells
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button[aria-pressed]') || target.closest('button');
        if (button) {
          setTimeout(() => {
            const calEl = container.querySelector('calendar-date');
            const rawValue = (calEl as any)?.value || '';
            const newValue = normalizeDate(rawValue);
            if (newValue) {
              onChangeRef.current?.(newValue);
            }
          }, 50);
        }
      };

      calendarDate.addEventListener('change', handleChange);
      calendarDate.addEventListener('click', handleClick);
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
  }, []); // Initialize once

  // Update value when prop changes
  useEffect(() => {
    const cal = calendarRef.current;
    if (!cal) return;
    
    if (value !== undefined) {
      const normalizedValue = normalizeDate(value);
      const currentValue = normalizeDate((cal as any).value || '');
      if (normalizedValue !== currentValue) {
        (cal as any).value = normalizedValue;
      }
    }
  }, [value]);

  return <div ref={containerRef} />;
}
