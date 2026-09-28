import { useId } from 'react';
import { business } from '@shared/business.js';

export function Logo({ light = false }) {
  const gradientId = useId();
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`}>
      <svg className="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4cc3ff" />
            <stop offset="1" stopColor="#0a6cf0" />
          </linearGradient>
        </defs>
        <path
          d="M16 2.5S5.5 13.8 5.5 20.5a10.5 10.5 0 0 0 21 0C26.5 13.8 16 2.5 16 2.5z"
          fill={`url(#${gradientId})`}
        />
        <path d="M11 20.5a5 5 0 0 0 5 5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
      </svg>
      <span className="logo__word">{business.name}</span>
    </span>
  );
}
