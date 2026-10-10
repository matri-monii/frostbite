import React from 'react';

/** Frostbite mark: a faceted ice shard. */
export const ShardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 1.5 19.5 10 12 22.5 4.5 10Z" />
    <path d="M12 1.5 14.2 10 12 22.5 9.8 10Z" fill="#000" fillOpacity="0.22" />
    <path d="M4.5 10h15" stroke="#000" strokeOpacity="0.18" strokeWidth="0.8" fill="none" />
  </svg>
);
