import { useId } from 'react';
import type { ColorName } from './types';

// The crew palette: bold, saturated, each with a darker shade and a lighter glint (flat cartoon shading).
export const PALETTE: Record<ColorName, { base: string; shade: string; light: string }> = {
  red: { base: '#d3202a', shade: '#7e0f24', light: '#ff6a6a' },
  blue: { base: '#1d3fd6', shade: '#0e1c8e', light: '#6f8cff' },
  green: { base: '#139a3a', shade: '#0a5a2a', light: '#5de07f' },
  pink: { base: '#ee5cbd', shade: '#a82a9c', light: '#ffa8e3' },
  orange: { base: '#f0821a', shade: '#b0431a', light: '#ffc06a' },
  yellow: { base: '#f6e94a', shade: '#c18a1f', light: '#fffbb0' },
  cyan: { base: '#3ee8d0', shade: '#1f9db2', light: '#b6fff3' },
  purple: { base: '#7a36cc', shade: '#431a86', light: '#b98aff' },
  lime: { base: '#58ef3c', shade: '#1aa43e', light: '#b3ff9b' },
  white: { base: '#dbe5f5', shade: '#8a98c4', light: '#ffffff' },
};

export type BotState = 'idle' | 'selected' | 'sweating' | 'caught' | 'out';

// An original "pod bot": capsule body, round glass porthole, antenna with a bulb, belt stripe and stubby feet.
export function CrewBot({ color, state = 'idle', size = 96, title }: { color: ColorName; state?: BotState; size?: number; title?: string }) {
  const c = PALETTE[color];
  const uid = useId().replace(/:/g, '');
  const body = 'M21 54 C21 30 33 14 50 14 C67 14 79 30 79 54 L79 93 C79 99 75 103 69 103 L31 103 C25 103 21 99 21 93 Z';
  return (
    <svg className={`bot bot-${state}`} width={size} height={size * 1.2} viewBox="0 0 100 120" role="img" aria-label={title ?? `${color} crew member`}>
      <defs>
        <clipPath id={`b${uid}`}><path d={body} /></clipPath>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9f6fb" /><stop offset="1" stopColor="#5fa9bd" />
        </linearGradient>
      </defs>
      <g className="bot-body">
        <rect x="27" y="92" width="18" height="20" rx="7" fill={c.shade} stroke="#0a0d18" strokeWidth="4" />
        <rect x="55" y="92" width="18" height="20" rx="7" fill={c.shade} stroke="#0a0d18" strokeWidth="4" />
        <line x1="50" y1="14" x2="50" y2="5" stroke="#0a0d18" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="5" r="4.5" fill={c.light} stroke="#0a0d18" strokeWidth="3" className="bot-bulb" />
        <path d={body} fill={c.base} />
        <g clipPath={`url(#b${uid})`}>
          <path d="M62 14 C82 20 86 44 80 70 L80 110 L56 110 C66 84 66 40 62 14 Z" fill={c.shade} opacity="0.55" />
          <rect x="0" y="86" width="100" height="22" fill={c.shade} opacity="0.5" />
          <rect x="18" y="70" width="64" height="9" fill={c.shade} opacity="0.85" />
          <rect x="18" y="72" width="64" height="2.5" fill={c.light} opacity="0.5" />
          <ellipse cx="33" cy="30" rx="6" ry="12" transform="rotate(-24 33 30)" fill="#fff" opacity="0.32" />
        </g>
        <path d={body} fill="none" stroke="#0a0d18" strokeWidth="4.5" strokeLinejoin="round" />
        <circle cx="50" cy="45" r="17" fill="#0a0d18" />
        <circle cx="50" cy="45" r="13.5" fill={`url(#g${uid})`} />
        <ellipse cx="44" cy="39" rx="5" ry="3" transform="rotate(-30 44 39)" fill="#fff" opacity="0.9" />
        <rect x="41" y="83" width="18" height="9" rx="3" fill={c.light} stroke="#0a0d18" strokeWidth="2.5" />
      </g>
      {state === 'sweating' || state === 'caught' ? (
        <g className="bot-sweat" fill="#8fd4ff" stroke="#0a0d18" strokeWidth="1.5">
          <path d="M82 28 C86 34 86 38 82 40 C78 38 78 34 82 28 Z" />
          <path d="M16 36 C19 41 19 44 16 46 C13 44 13 41 16 36 Z" />
        </g>
      ) : null}
    </svg>
  );
}
