import React from 'react';
import {
  Mic,
  Disc,
  Drum,
  Guitar,
  Radio,
  Piano as LucidePiano,
  Music,
  Sparkles,
  Zap,
  Volume2,
  FileText,
  Sliders,
  Activity,
  Wind,
  Bell,
  Layers,
  HelpCircle
} from 'lucide-react';

// 1. Snare Drum Icon (Shallow shell, batter head, crossed drumsticks, snare strainer mechanism)
export const SnareIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="8" rx="8" ry="3" />
    <path d="M4 8v6c0 1.66 3.58 3 8 3s8-1.34 8-3V8" />
    <path d="M6 5.5l12 6M18 5.5l-12 6" strokeWidth="1.3" opacity="0.8" />
    {/* Snare Strainer Throw-off lever */}
    <path d="M20 10.5h2v2h-2" strokeWidth="1.4" />
  </svg>
);

// 1b. Tom Drum Icon (Deep cylinder tom shell, top batter rim, tension rods, side mounting bracket)
export const TomIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Tom Batter Head Rim */}
    <ellipse cx="12" cy="7.5" rx="8" ry="3" />
    {/* Deep Cylindrical Tom Shell */}
    <path d="M4 7.5v9c0 1.66 3.58 3 8 3s8-1.34 8-3v-9" />
    {/* Tension Rods */}
    <path d="M7 9v9M12 10.5v9M17 9v9" strokeWidth="1.2" opacity="0.65" />
    {/* Side mounting bracket */}
    <path d="M4 12H2M2 12v3" strokeWidth="1.6" />
  </svg>
);

// 2. Kick Drum Icon (Bass drum with outer shell, tension lugs, offset port hole, beater pedal and spur legs)
export const KickIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Large outer bass drum shell */}
    <circle cx="12" cy="11" r="8" />
    {/* Inner resonance ring */}
    <circle cx="12" cy="11" r="6" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    {/* Offset sound port hole */}
    <circle cx="15.5" cy="13" r="2.2" />
    {/* Tension lugs */}
    <path d="M12 2.2v1.6M4 11H2.4M21.6 11H20" strokeWidth="2" />
    {/* Angled kick drum spur legs */}
    <path d="M6 17l-3 4M18 17l3 4" strokeWidth="2" />
    {/* Kick beater & pedal at base */}
    <path d="M12 19v2.5M9.5 21.5h5" strokeWidth="1.8" />
  </svg>
);

// 3. Shaker Icon (Studio cylindrical shaker with center grip rings, radiating acoustic shake waves, and kinetic sound beads)
export const ShakerIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Studio Cylindrical Percussion Shaker */}
    <rect x="8" y="4" width="8" height="16" rx="4" />
    {/* Center Ribbed Grip Rings */}
    <path d="M8 9.5h8" strokeWidth="1.4" opacity="0.75" />
    <path d="M8 14.5h8" strokeWidth="1.4" opacity="0.75" />
    {/* Dynamic Acoustic Shake Waves */}
    <path d="M4.5 9a3.5 3.5 0 0 0 0 6" strokeWidth="1.6" />
    <path d="M2.5 7a6.5 6.5 0 0 0 0 10" strokeWidth="1.4" opacity="0.5" />
    <path d="M19.5 9a3.5 3.5 0 0 1 0 6" strokeWidth="1.6" />
    <path d="M21.5 7a6.5 6.5 0 0 1 0 10" strokeWidth="1.4" opacity="0.5" />
    {/* Kinetic Sound Bead Particles */}
    <circle cx="5" cy="12" r="0.75" fill="currentColor" />
    <circle cx="19" cy="12" r="0.75" fill="currentColor" />
  </svg>
);

// 4. Tambourine Icon
export const TambourineIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="4" r="1.5" />
    <circle cx="20" cy="9" r="1.5" />
    <circle cx="19" cy="16" r="1.5" />
    <circle cx="12" cy="20" r="1.5" />
    <circle cx="5" cy="16" r="1.5" />
    <circle cx="4" cy="9" r="1.5" />
  </svg>
);

// 5. Hi-Hat Icon
export const HiHatIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="8" rx="9" ry="2.5" />
    <ellipse cx="12" cy="13" rx="9" ry="2.5" />
    <path d="M12 2v18" />
    <path d="M8 20h8" />
  </svg>
);

// 6. Crash / Ride Cymbal Icon
export const CymbalIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="10" rx="9" ry="3" transform="rotate(-25 12 10)" />
    <path d="M10.5 7.5L8 4" />
    <path d="M12 13v8" />
    <path d="M9 21h6" />
  </svg>
);

// 7. Triangle Icon
export const TriangleIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M15 11l6-6" />
    <circle cx="12" cy="13" r="1.5" />
  </svg>
);

// 8. Synth / 808 Drum Machine / Sampler Icon
export const SynthIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <rect x="6" y="6" width="7" height="4" rx="1" />
    <circle cx="17" cy="8" r="2" />
    <path d="M6 14v4M9 14v4M12 14v4M15 14v4M18 14v4" />
    <path d="M6 14h12" />
  </svg>
);

// 9. Electric Bass Guitar Icon (4 large in-line tuning keys, long neck, extended upper horn, split P-bass pickups, 4-saddle bridge)
export const BassGuitarIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Long Bass Headstock with 4 distinct large tuning pegs */}
    <path d="M10.5 1.5h2.5c1 0 1.6.8 1.6 1.8v3.5h-4.1v-5.3z" />
    {/* 4 Large Bass Tuning Pegs (paddle/clover keys) */}
    <path d="M15 2.2h2M15 3.6h2M15 5h2M15 6.4h2" strokeWidth="2.2" strokeLinecap="round" />
    {/* Long Bass Neck */}
    <path d="M10.8 6.8v5.5M13.2 6.8v5.5" strokeWidth="1.6" />
    <path d="M10.8 9.5h2.4" strokeWidth="1.2" opacity="0.6" />
    {/* Asymmetrical Bass Body: Extended Upper Horn for balance, deep lower scoop */}
    <path d="M10.8 12.3c-2.2-3-4.2-2.2-4.8.2-.5 2 .5 3.5 1.8 4.2-2 .8-2.8 2.2-2.8 4 0 2 3.2 3.3 7 3.3s7-1.3 7-3.3c0-1.8-.8-3.2-2.8-4 1.3-.7 2.3-2.2 1.8-4.2-.6-2.4-2.6-3.2-4.8-.2" />
    {/* Iconic Split-Coil P-Bass Pickups (two staggered offset blocks) */}
    <rect x="9.3" y="14.5" width="2.6" height="1.6" rx="0.3" strokeWidth="1.3" fill="currentColor" fillOpacity="0.25" />
    <rect x="11.5" y="16.5" width="2.6" height="1.6" rx="0.3" strokeWidth="1.3" fill="currentColor" fillOpacity="0.25" />
    {/* Heavy 4-Saddle Bass Bridge */}
    <rect x="10" y="20.2" width="4" height="1.6" rx="0.3" strokeWidth="1.6" />
  </svg>
);

// 10. Upright / Double Bass Icon (Acoustic viol shape, f-holes, neck, scroll pegbox, and metal endpin)
export const UprightBassIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Scroll & pegbox at top */}
    <circle cx="12" cy="2.5" r="1" />
    <path d="M10 4.5h4" strokeWidth="1.5" />
    {/* Neck */}
    <path d="M11.2 3.5v5.5M12.8 3.5v5.5" strokeWidth="1.5" />
    {/* Acoustic double bass body: upper bout, C-bout corners, lower bout */}
    <path d="M11.2 9C9 9.5 7 11 7 12.5c0 1 1 1.5.5 2.5C7 16 5.5 17 5.5 18.5c0 2 3 3.5 6.5 3.5s6.5-1.5 6.5-3.5c0-1.5-1.5-2.5-2-3.5-.5-1 .5-1.5.5-2.5 0-1.5-2-3-4.2-3.5" />
    {/* Two f-holes */}
    <path d="M9.5 13.5c-.5.5-.5 1.5 0 2M14.5 13.5c.5.5.5 1.5 0 2" strokeWidth="1.5" />
    {/* Wooden bridge & tailpiece */}
    <path d="M10.5 15h3" strokeWidth="2" />
    <path d="M11.5 18h1l-.5 2z" fill="currentColor" />
    {/* Metal endpin at bottom */}
    <path d="M12 22v2" strokeWidth="2" />
  </svg>
);

// 11. Tuba Icon (Upward flared wide bell, deep resonant outer wrap bow, inner tubing loop, 3 vertical valve pistons, leadpipe & mouthpiece)
export const TubaIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Wide flared upward Tuba Bell Rim & Lip */}
    <ellipse cx="16.5" cy="3.2" rx="4.5" ry="1.4" />
    {/* Expanding Conical Bell Flare */}
    <path d="M12 3.2c.6 3.2 2.2 6.2 3.8 8.5" />
    <path d="M21 3.2c-.4 3.8-2 6.8-4.5 9" />
    {/* Massive Lower Outer Brass Tubing Bow */}
    <path d="M16.5 12.2c0 5-2.8 8.6-7.5 8.6C4.8 20.8 3 17.5 3 13c0-4.5 2.5-7.5 6.5-7.5h2" />
    {/* Inner Secondary Wrap Loop */}
    <path d="M9.5 8.5c-2.4 0-3.8 1.8-3.8 4.5s1.6 4.8 3.8 4.8c2.8 0 4.2-2 4.2-4.8" />
    {/* 3 Central Vertical Valve Pistons with top caps */}
    <path d="M7.8 10.8v4M9.8 10.8v4M11.8 10.8v4" strokeWidth="1.5" />
    <path d="M7 10.8h5.6" strokeWidth="1.3" />
    {/* Leadpipe and Mouthpiece on Left */}
    <path d="M1.5 8.5h2c1.6 0 2.5.9 2.5 2.2v1.5" strokeWidth="1.6" />
    <path d="M1.5 7.5v2" strokeWidth="2" />
    {/* Bottom Bow Reinforcement Guard */}
    <path d="M6 19.2c1.8.8 4.2.8 6 0" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

// 12. Electric Guitar Icon (Sharp double cutaway horns, 6 in-line headstock, twin pickups, bridge, volume knob)
export const ElectricGuitarIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* 6 In-Line Headstock */}
    <path d="M11 1.5c1.4 0 2.2.8 2.2 2v2.5h-3v-4.5z" />
    <circle cx="14.5" cy="2.2" r="0.6" fill="currentColor" />
    <circle cx="14.5" cy="3.6" r="0.6" fill="currentColor" />
    <circle cx="14.5" cy="5" r="0.6" fill="currentColor" />
    {/* Neck with fret markers */}
    <path d="M10.8 6v4.5M13.2 6v4.5" />
    <path d="M10.8 8h2.4M10.8 9.5h2.4" strokeWidth="1" opacity="0.6" />
    {/* Double Cutaway Electric Body with prominent horns */}
    <path d="M10.8 10.5c-1.8-2-3.8-1.5-4.5.5-.5 1.5.2 3 1.5 4-1.8.6-2.8 2.2-2.8 4 0 2.2 3.2 4 7 4s7-1.8 7-4c0-1.8-1-3.4-2.8-4 1.3-1 2-2.5 1.5-4-.7-2-2.7-2.5-4.5-.5" />
    {/* Dual Electric Pickups */}
    <rect x="9.5" y="13.2" width="5" height="1.5" rx="0.4" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
    <rect x="9.5" y="15.8" width="5" height="1.5" rx="0.4" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
    {/* Bridge and Tone Knob */}
    <path d="M10 19h4" strokeWidth="2" />
    <circle cx="14" cy="20.5" r="0.7" fill="currentColor" />
  </svg>
);

// 13. Acoustic Guitar Icon (Hourglass hollow body, circular soundhole, bridge, symmetrical 3+3 headstock)
export const AcousticGuitarIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Symmetrical Headstock with 3+3 Tuning Pegs */}
    <rect x="10" y="1.5" width="4" height="4" rx="0.8" />
    <path d="M8 2.5h2M8 4.2h2M14 2.5h2M14 4.2h2" strokeWidth="1.5" />
    {/* Neck with frets */}
    <path d="M10.8 5.5v5M13.2 5.5v5" />
    <path d="M10.8 7.5h2.4M10.8 9.5h2.4" strokeWidth="1" opacity="0.6" />
    {/* Classic Hourglass Acoustic Body */}
    <path d="M10.8 10.5C8.5 10.5 6.5 11.8 6.5 13.5c0 1.2.7 2 1.3 2.5-.9.9-1.8 2-1.8 3.8 0 2 2.6 3.2 6 3.2s6-1.2 6-3.2c0-1.8-.9-2.9-1.8-3.8.6-.5 1.3-1.3 1.3-2.5 0-1.7-2-3-4.3-3" />
    {/* Center Circular Acoustic Soundhole */}
    <circle cx="12" cy="14.5" r="1.8" />
    {/* Wooden Acoustic Bridge */}
    <rect x="9.5" y="19" width="5" height="1.4" rx="0.4" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

// 14. Grand Piano Icon (Angled open lid with support prop stick, grand rim body contour, full keyboard bed with white and black keys, legs and pedal lyre)
export const PianoIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Raised Open Grand Piano Lid */}
    <path d="M3 11L18 3.5" strokeWidth="2" strokeLinecap="round" />
    {/* Lid Support Prop Stick */}
    <path d="M14 5.5v4.5" strokeWidth="1.5" />
    {/* Grand Piano Body Contour (flat left spine, curved rear tail, front keyboard cheek) */}
    <path d="M3 11v6h17v-3.5c0-2.2-2.8-4-6-4.5L3 11z" />
    {/* Keyboard Bed Shelf */}
    <path d="M3 14.2h17" strokeWidth="1.4" />
    {/* White Key Dividers */}
    <path d="M6.5 14.2v2.8M10 14.2v2.8M13.5 14.2v2.8M17 14.2v2.8" strokeWidth="1.1" />
    {/* Distinct Black Keys */}
    <path d="M4.8 14.2v1.8M8.2 14.2v1.8M11.8 14.2v1.8M15.2 14.2v1.8M18.6 14.2v1.8" strokeWidth="1.8" strokeLinecap="square" />
    {/* Piano Legs */}
    <path d="M4.5 17v4.5M18.5 17v4.5" strokeWidth="1.6" />
    {/* Center Lyre / Pedals */}
    <path d="M11.5 17v3M10.2 20h2.6" strokeWidth="1.3" />
  </svg>
);

// 15. Electric Piano Icon (Rhodes / Wurlitzer vintage stage case, control knobs, keys, splayed legs)
export const ElectricPianoIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Piano body case with rounded lid */}
    <rect x="2" y="5" width="20" height="11" rx="2" />
    {/* Top control strip with knobs */}
    <circle cx="5.5" cy="8" r="1" />
    <circle cx="8.5" cy="8" r="1" />
    <path d="M12 8h7" strokeWidth="1.5" />
    {/* Keyboard section */}
    <path d="M2 11h20" />
    {/* White keys */}
    <path d="M5 11v5M8 11v5M11 11v5M14 11v5M17 11v5M20 11v5" strokeWidth="1.2" />
    {/* Black keys */}
    <path d="M6.5 11v2.5M9.5 11v2.5M12.5 11v2.5M15.5 11v2.5M18.5 11v2.5" strokeWidth="1.8" />
    {/* Splayed chrome legs */}
    <path d="M4 16l-1.5 5M20 16l1.5 5" />
  </svg>
);

// 16. Brass / Horn Section Icon (Multiple overlapping horns with flared bells, valves, and acoustic radiation)
export const HornSectionIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Front Horn Bell */}
    <path d="M3 15h6c2 0 4-1.5 6-3.5v7c-2-2-4-3.5-6-3.5H3v-2z" />
    <ellipse cx="15" cy="15" rx="1.5" ry="3.5" />
    {/* Front Horn Valves */}
    <path d="M6 13v-2M8 13v-2M10 13v-2" strokeWidth="1.5" />
    {/* Second (layered background) Horn Bell */}
    <path d="M8 8h5c2 0 4-1.2 6-3v6c-2-1.8-4-3-6-3H8V8z" opacity="0.8" />
    <ellipse cx="19" cy="8" rx="1.5" ry="3" opacity="0.8" />
    <path d="M11 6V4.5M13 6V4.5" strokeWidth="1.5" opacity="0.8" />
    {/* Sound projection arcs */}
    <path d="M18 13.5a2.5 2.5 0 0 1 0 3" strokeWidth="1.5" />
    <path d="M22 6a3 3 0 0 1 0 4" strokeWidth="1.5" />
  </svg>
);

// 17. Trumpet Icon (Leadpipe, 3 valve pistons with finger buttons, tuning slide loop, and flared bell)
export const TrumpetIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Mouthpiece */}
    <path d="M2 11v3h1.5l1-1.5-1-1.5H2z" />
    {/* Main leadpipe & bell pipe */}
    <path d="M4.5 12.5h10.5" />
    <path d="M4.5 14h10.5" />
    {/* Flared bell */}
    <path d="M15 12.5c2 0 4-1.5 6-3.5v7c-2-2-4-3.5-6-3.5" />
    <ellipse cx="21" cy="12.5" rx="1" ry="3.5" />
    {/* 3 Vertical Valve Pistons */}
    <path d="M8 9.5v5M10.5 9.5v5M13 9.5v5" strokeWidth="1.8" />
    {/* Valve finger buttons */}
    <path d="M7.2 9.5h1.6M9.7 9.5h1.6M12.2 9.5h1.6" strokeWidth="2" />
    {/* Valve slide loop below */}
    <path d="M8 15v1.5c0 .8.7 1.5 1.5 1.5h2c.8 0 1.5-.7 1.5-1.5V15" strokeWidth="1.4" />
  </svg>
);

// 18. Saxophone Icon (Upturned flared bell, conical tube with keys, gooseneck with mouthpiece)
export const SaxophoneIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Curved neck & mouthpiece at top left */}
    <path d="M4 4l2 1c2 1 3 2.5 3.5 5" />
    <path d="M3 3.5l1.5 1.5" strokeWidth="2.5" />
    {/* Main tube running down */}
    <path d="M9.5 10l3.5 8c.5 1.2 1.5 2.5 3 2.5 2 0 3-1.5 3.5-3.5" />
    <path d="M7.5 10l3.5 8c.3.8 1 1.5 2 1.5" />
    {/* Flared upturned bell */}
    <path d="M19.5 17c.5-2 0-4-1-5.5" />
    <ellipse cx="18" cy="11.5" rx="3" ry="1.5" transform="rotate(-30 18 11.5)" />
    {/* Key cups along body */}
    <circle cx="9" cy="12" r="0.8" />
    <circle cx="10.5" cy="14.5" r="0.8" />
    <circle cx="12" cy="17" r="0.8" />
  </svg>
);

// 19. Flute Icon (Transverse concert flute, embouchure hole, open tone hole key cups, crown)
export const FluteIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Sleek diagonal transverse flute body */}
    <path d="M3 21L21 3" strokeWidth="2.5" />
    {/* Embouchure hole / lip plate on headjoint */}
    <ellipse cx="6" cy="18" rx="1.2" ry="0.8" transform="rotate(-45 6 18)" />
    {/* Tone hole key cups */}
    <circle cx="10" cy="14" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="14" cy="10" r="1" />
    <circle cx="16" cy="8" r="1" />
    <circle cx="18" cy="6" r="1" />
    {/* Key mechanism line */}
    <path d="M9.5 13l9-9" strokeWidth="0.9" opacity="0.6" />
    {/* End crown and footjoint caps */}
    <path d="M2.5 20.5l1 1M20.5 2.5l1 1" strokeWidth="2" />
  </svg>
);

// 20. Violin Icon (Solo violin with bouts, f-holes, tailpiece, chinrest, and bow)
export const ViolinIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Violin scroll & pegbox */}
    <circle cx="10" cy="2.5" r="1" />
    <path d="M8.5 4.5h3" />
    <path d="M10 3.5v4" strokeWidth="1.5" />
    {/* Violin body: upper bout, C-bouts with sharp corners, lower bout */}
    <path d="M10 7.5C8 8 6.5 9 6.5 10.5c0 .8.8 1.2.5 2-.5 1-1.5 1.5-1.5 2.5 0 2 2 3.5 4.5 3.5s4.5-1.5 4.5-3.5c0-1-1-1.5-1.5-2.5-.3-.8.5-1.2.5-2 0-1.5-1.5-2.5-3.5-3" />
    {/* Tailpiece & Chinrest */}
    <path d="M9.5 16.5h1l-.5 2z" />
    <ellipse cx="8" cy="18.5" rx="1" ry="0.6" />
    {/* f-holes */}
    <path d="M8.5 12c-.4.4-.4 1 0 1.4M11.5 12c.4.4.4 1 0 1.4" strokeWidth="1.2" />
    {/* Diagonal violin bow */}
    <path d="M21 2L15 22" strokeWidth="1.5" />
    <path d="M21 2l-.8 2" strokeWidth="1.5" />
  </svg>
);

// 21. Cello Icon (Concert cello with broad proportions, deep C-bouts, wide bridge, tailpiece, and prominent endpin)
export const CelloIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Cello scroll & neck */}
    <circle cx="12" cy="2.5" r="1.2" />
    <path d="M10 4.5h4" />
    <path d="M11.2 3.7v4.5M12.8 3.7v4.5" strokeWidth="1.4" />
    {/* Distinct broad cello body with deeper C-bout cutaways */}
    <path d="M11.2 8.2C8.5 8.7 6.5 10 6.5 11.5c0 1 1 1.5.5 2.5-.6 1.2-1.5 1.8-1.5 3 0 2.2 2.8 4 6.5 4s6.5-1.8 6.5-4c0-1.2-.9-1.8-1.5-3-.5-1 .5-1.5.5-2.5 0-1.5-2-2.8-4.7-3.3" />
    {/* Wide cello bridge & tailpiece */}
    <path d="M10.5 13.5h3" strokeWidth="2" />
    <path d="M11 16h2l-.5 3.5h-1z" />
    {/* f-holes */}
    <path d="M9 12.5c-.5.5-.5 1.5 0 2M15 12.5c.5.5.5 1.5 0 2" strokeWidth="1.4" />
    {/* Prominent metal endpin spike at bottom */}
    <path d="M12 21.2v2.8" strokeWidth="2" />
  </svg>
);

// 22. String Section Icon (Layered orchestral string ensemble with foreground viol, background viol, and orchestral bow)
export const StringSectionIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Background instrument (offset) */}
    <path d="M14 6c-1.5 0-2.5 1-2.5 2 0 .8.8 1.2.4 2-.5 1-1.5 1.8-1.5 3 0 1.8 1.8 3 4 3s4-1.2 4-3c0-1.2-1-2-1.5-3-.4-.8.4-1.2.4-2 0-1-1-2-2.8-2z" opacity="0.55" />
    <path d="M14 3v3" opacity="0.55" strokeWidth="1.5" />
    {/* Foreground violin/viol body */}
    <path d="M8.5 9c-1.5 0-2.5 1-2.5 2 0 .8.8 1.2.4 2-.5 1-1.5 1.8-1.5 3 0 1.8 1.8 3 4 3s4-1.2 4-3c0-1.2-1-2-1.5-3-.4-.8.4-1.2.4-2 0-1-1-2-2.8-2z" />
    {/* Neck */}
    <path d="M8.5 6v3" strokeWidth="1.5" />
    <circle cx="8.5" cy="5" r="0.8" />
    {/* f-holes */}
    <path d="M7 14.5c-.3.4-.3 1 0 1.4M10 14.5c.3.4.3 1 0 1.4" strokeWidth="1.2" />
    {/* Orchestral Bow crossing diagonally */}
    <path d="M2 21L21 2" strokeWidth="1.5" />
    <path d="M21 2l-1 2.5" strokeWidth="1.5" />
  </svg>
);

export const getInstrumentIconComponent = (category: string, name: string, className = "w-3.5 h-3.5") => {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  // 1. Specific drums & percussion: Kick drum MUST return KickIcon
  if (n.includes('kick')) return <KickIcon className={className} />;
  if (n.includes('tom')) return <TomIcon className={className} />;
  if (n.includes('snare') || n.includes('rimshot')) return <SnareIcon className={className} />;
  if (n.includes('hi-hat') || n.includes('hihat')) return <HiHatIcon className={className} />;
  if (n.includes('crash') || n.includes('ride') || n.includes('cymbal')) return <CymbalIcon className={className} />;
  if (n.includes('tambourine')) return <TambourineIcon className={className} />;
  if (n.includes('shaker') || n.includes('percussion')) return <ShakerIcon className={className} />;
  if (n.includes('triangle')) return <TriangleIcon className={className} />;

  // 2. Synthesizer basses & 808 / Sub-bass: mapped to SynthIcon (same as synths' icon)
  if (
    n.includes('808') ||
    n.includes('sub-bass') ||
    n.includes('sub bass') ||
    n.includes('subbass') ||
    n.includes('synth bass') ||
    n.includes('acid bass') ||
    n.includes('reese bass') ||
    n.includes('analog bass') ||
    n.includes('moog bass')
  ) {
    return <SynthIcon className={className} />;
  }

  // 3. Bass variants: Upright/Double Bass vs Tuba vs Electric Bass
  if (n.includes('upright bass') || n.includes('double bass') || n.includes('contrabass') || (n.includes('upright') && !n.includes('piano'))) {
    return <UprightBassIcon className={className} />;
  }
  if (n.includes('tuba') || n.includes('sousaphone')) {
    return <TubaIcon className={className} />;
  }
  if (n.includes('bass guitar') || n.includes('finger bass') || n.includes('electric bass') || n.includes('bass foundation')) {
    return <BassGuitarIcon className={className} />;
  }

  // 4. Guitars: Acoustic vs Electric
  if (n.includes('acoustic guitar') || n.includes('a guit') || (n.includes('acoustic') && n.includes('guitar')) || n.includes('strumming') || n.includes('acoustic strums')) {
    return <AcousticGuitarIcon className={className} />;
  }
  if (n.includes('electric guitar') || n.includes('e guit') || n.includes('rhythm guitar') || n.includes('lead guitar') || n.includes('heavy rhythm')) {
    return <ElectricGuitarIcon className={className} />;
  }

  // 5. Keys & Pianos: Electric Piano vs Acoustic Grand Piano
  if (n.includes('electric piano') || n.includes('e piano') || n.includes('rhodes') || n.includes('wurlitzer') || n.includes('wurli')) {
    return <ElectricPianoIcon className={className} />;
  }
  if (n.includes('piano') || n.includes('grand')) {
    return <PianoIcon className={className} />;
  }

  // 6. Brass / Horn Section vs Trumpet
  if (n.includes('horn section') || n.includes('brass section') || n.includes('brass/horn') || n.includes('horns') || n.includes('brass')) {
    return <HornSectionIcon className={className} />;
  }
  if (n.includes('trumpet') || n.includes('cornet')) {
    return <TrumpetIcon className={className} />;
  }

  // 7. Woodwinds: Saxophone vs Flute
  if (n.includes('saxophone') || n.includes('sax')) {
    return <SaxophoneIcon className={className} />;
  }
  if (n.includes('flute') || n.includes('piccolo')) {
    return <FluteIcon className={className} />;
  }

  // 8. Orchestral Strings: String Section vs Cello vs Violin
  if (n.includes('string section') || n.includes('string ensemble') || n.includes('strings') || n.includes('symphonic string')) {
    return <StringSectionIcon className={className} />;
  }
  if (n.includes('cello') || n.includes('violoncello')) {
    return <CelloIcon className={className} />;
  }
  if (n.includes('violin') || n.includes('fiddle') || n.includes('viola')) {
    return <ViolinIcon className={className} />;
  }

  // 9. General fallbacks for secondary keywords
  if (n.includes('acoustic')) return <AcousticGuitarIcon className={className} />;
  if (n.includes('guitar')) return <ElectricGuitarIcon className={className} />;
  if (n.includes('bass')) return <BassGuitarIcon className={className} />;
  if (n.includes('vocal') || n.includes('voice') || n.includes('lead voc') || n.includes('backing') || n.includes('choir') || n.includes('singer')) return <Mic className={className} />;
  if (n.includes('synth') || n.includes('keys') || n.includes('pad') || n.includes('lead') || n.includes('organ') || n.includes('chord')) return <SynthIcon className={className} />;

  // 10. Category-level fallbacks
  switch (c) {
    case 'vocals': return <Mic className={className} />;
    case 'drums': return <KickIcon className={className} />;
    case 'bass': return <BassGuitarIcon className={className} />;
    case 'guitars': return <ElectricGuitarIcon className={className} />;
    case 'keys_synth': return <PianoIcon className={className} />;
    case 'orchestral': return <ViolinIcon className={className} />;
    case 'fx': return <Sparkles className={className} />;
    default: return <Sliders className={className} />;
  }
};

/**
 * Custom Studio Monitors Icon (Simplified stereo speaker pair)
 * Matches the user reference illustration for the "Front" view mode button.
 */
export const StudioMonitorsIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Left Monitor Cabinet */}
    <rect x="2" y="2.5" width="9.2" height="19" rx="1" />
    <circle cx="6.6" cy="7.2" r="1.8" />
    <circle cx="6.6" cy="14.8" r="3.1" />

    {/* Right Monitor Cabinet */}
    <rect x="12.8" y="2.5" width="9.2" height="19" rx="1" />
    <circle cx="17.4" cy="7.2" r="1.8" />
    <circle cx="17.4" cy="14.8" r="3.1" />
  </svg>
);

/**
 * Custom Paper Airplane Icon
 * Matches the user reference illustration for the "Bird's Eye" view mode button.
 */
export const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Keel / bottom under-wing fold with subtle tint */}
    <polygon points="8.5 14.5 7 20.5 11 16.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" />
    {/* Main wings */}
    <polygon points="21 3 3 11 8.5 14.5 16 21 21 3" />
    {/* Center spine crease line */}
    <line x1="21" y1="3" x2="8.5" y2="14.5" />
  </svg>
);
