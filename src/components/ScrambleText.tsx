import React, { useEffect, useRef } from 'react';

const GLYPHS = '!<>-_\\/[]{}=+*^?#%&01';

interface Props {
  text: string;
  className?: string;
}

/**
 * Text that "encrypts" itself when its button / link is hovered or focused and
 * decrypts a fraction of a second later. The animation is bound to the closest
 * interactive ancestor so the whole pill is the hover target.
 */
export const ScrambleText: React.FC<Props> = ({ text, className }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = (el.closest('button, a, [data-scramble]') as HTMLElement | null) ?? el;
    let raf = 0;

    const run = () => {
      cancelAnimationFrame(raf);
      const start = performance.now();
      const total = 520;
      const scrambleEnd = 140; // everything is garbled first, then resolves left to right
      const chars = text.split('');
      const tick = (now: number) => {
        const t = now - start;
        let out = '';
        for (let i = 0; i < chars.length; i++) {
          const ch = chars[i];
          if (ch === ' ') { out += ' '; continue; }
          const resolveAt = scrambleEnd + (i / Math.max(chars.length - 1, 1)) * (total - scrambleEnd);
          out += t >= resolveAt ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (t < total) raf = requestAnimationFrame(tick);
        else el.textContent = text;
      };
      raf = requestAnimationFrame(tick);
    };

    host.addEventListener('mouseenter', run);
    host.addEventListener('focus', run);
    return () => {
      host.removeEventListener('mouseenter', run);
      host.removeEventListener('focus', run);
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }, [text]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {text}
    </span>
  );
};
