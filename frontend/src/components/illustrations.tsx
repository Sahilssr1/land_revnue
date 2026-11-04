// Presentation-only inline SVG illustrations. No external images, no photos,
// no government emblems, no real people's likeness. All decorative: aria-hidden.
export function LandArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 260" className={className} aria-hidden="true" role="presentation">
      <defs>
        <linearGradient id="lrms-land-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0b2447" />
        </linearGradient>
        <linearGradient id="lrms-land-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      {/* Abstract land parcels */}
      <g opacity="0.95">
        <rect x="24" y="36" width="150" height="92" rx="14" fill="url(#lrms-land-b)" opacity="0.85" />
        <rect x="190" y="36" width="186" height="92" rx="14" fill="#0b2447" opacity="0.9" />
        <rect x="24" y="144" width="186" height="92" rx="14" fill="#0b2447" opacity="0.75" />
        <rect x="226" y="144" width="150" height="92" rx="14" fill="url(#lrms-land-a)" opacity="0.9" />
      </g>
      {/* Parcel dividers / field lines — dashes flow along the routes */}
      <g className="land-route" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="5 5">
        <path d="M24 82 H174 M190 82 H376 M117 144 V236 M301 144 V236" fill="none" />
      </g>
      {/* Roads */}
      <path d="M0 136 H400 M183 0 V260" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="3" />
      {/* Travelling dots + arrows along the roads (SMIL, no JS) */}
      <g>
        <circle r="5" fill="#fbbf24"><animateMotion dur="5s" repeatCount="indefinite" path="M0 136 H400" /></circle>
        <circle r="4" fill="#5eead4"><animateMotion dur="7s" repeatCount="indefinite" path="M183 260 V0" /></circle>
        <path d="M368 130 l14 6 -14 6 z" fill="#fbbf24" className="land-pulse" />
        <path d="M177 8 l6 14 -12 0 z" fill="#5eead4" className="land-pulse" />
      </g>
      {/* Map pins — gently bobbing, with a pulsing halo ring each */}
      <g>
        <circle cx="99" cy="82" r="20" fill="#ffffff" opacity="0.25" className="land-pulse" />
        <g className="land-pin">
          <path d="M99 60 a12 12 0 0 1 12 12 c0 9 -12 20 -12 20 s-12 -11 -12 -20 a12 12 0 0 1 12 -12z" fill="#ffffff" />
          <circle cx="99" cy="72" r="4.5" fill="#0d9488" />
        </g>
        <circle cx="301" cy="190" r="16" fill="#ffffff" opacity="0.25" className="land-pulse" />
        <g className="land-pin" style={{ animationDelay: '0.9s' }}>
          <path d="M301 172 a10 10 0 0 1 10 10 c0 7.5 -10 17 -10 17 s-10 -9.5 -10 -17 a10 10 0 0 1 10 -10z" fill="#5eead4" />
          <circle cx="301" cy="182" r="3.5" fill="#0b2447" />
        </g>
      </g>
      {/* Small parcel markers */}
      <g fill="#ffffff" opacity="0.85">
        <rect x="210" y="52" width="52" height="8" rx="4" />
        <rect x="210" y="68" width="36" height="8" rx="4" opacity="0.6" />
        <rect x="44" y="164" width="52" height="8" rx="4" />
        <rect x="44" y="180" width="36" height="8" rx="4" opacity="0.6" />
      </g>
    </svg>
  );
}

export function EmptyArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" role="presentation">
      <rect x="28" y="10" width="52" height="66" rx="10" fill="#e0f2fe" />
      <rect x="28" y="10" width="52" height="66" rx="10" fill="none" stroke="#0d9488" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="38" y="24" width="32" height="6" rx="3" fill="#0b2447" opacity="0.7" />
      <rect x="38" y="36" width="32" height="5" rx="2.5" fill="#94a3b8" />
      <rect x="38" y="46" width="24" height="5" rx="2.5" fill="#94a3b8" />
      <circle cx="82" cy="60" r="14" fill="#ffffff" stroke="#0d9488" strokeWidth="2.5" />
      <path d="M92 70 L104 82" stroke="#0d9488" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="82" cy="60" r="5" fill="none" stroke="#0b2447" strokeWidth="2" opacity="0.6" />
    </svg>
  );
}
