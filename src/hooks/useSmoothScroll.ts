import { useEffect } from 'react';

/**
 * Lightweight inertial scrolling for mouse wheels / trackpads.
 * Wheel input is accumulated into a target and eased towards with a lerp, which
 * is what makes the scroll-driven animations feel "glassy". Touch, keyboard,
 * scrollbar-drag and nested scrollable areas (modals) keep native behaviour.
 */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let target = window.scrollY;
    let current = window.scrollY;
    let raf = 0;
    let driving = false;

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    const canScrollInside = (el: EventTarget | null, dy: number): boolean => {
      let node = el as HTMLElement | null;
      while (node && node !== document.body && node !== document.documentElement) {
        const style = getComputedStyle(node);
        const oy = style.overflowY;
        if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
          const atTop = node.scrollTop <= 0;
          const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
          if ((dy < 0 && !atTop) || (dy > 0 && !atBottom)) return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.4) {
        current = target;
        driving = true;
        window.scrollTo(0, current);
        driving = false;
        raf = 0;
        return;
      }
      current += diff * 0.085;
      driving = true;
      window.scrollTo(0, current);
      driving = false;
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented) return;
      if (canScrollInside(e.target, e.deltaY)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      target = Math.max(0, Math.min(maxScroll(), target + e.deltaY * unit));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (driving) return;
      // native scroll (keyboard, scrollbar, anchor jump): resync
      if (!raf) {
        target = window.scrollY;
        current = window.scrollY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);
}
