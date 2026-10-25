import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Music,
  Sliders,
  Layers,
  Award,
  Sparkles,
} from 'lucide-react';
import { TourStep } from '../types';

interface QuickTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InteractiveTourStep extends TourStep {
  targetId: string;
  badge: string;
  preferredPosition: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: InteractiveTourStep[] = [
  {
    targetId: 'mix-diagram-stage',
    badge: 'Acoustic Stage Canvas',
    title: '1. The Mix Stage & Graph Paper Canvas',
    subtitle: 'X = Pan, Y = Frequency, Z = Room Depth',
    content:
      'The Mix Stage models acoustic space with an authentic Graph Paper background. Toggle between Blueprint, Charcoal Grid, and Parchment styles. Frequency runs vertically (20Hz sub to 20kHz air), stereo panning runs horizontally (-100 Left to +100 Right), and acoustic depth Z extends back into the room.',
    preferredPosition: 'bottom',
  },
  {
    targetId: 'palette-panel',
    badge: 'Instrument Palette',
    title: '2. Adding Instruments & Default Positioning',
    subtitle: 'Pre-Engineered Stems & Custom Tracks',
    content:
      'Add drums, bass, vocals, guitars, synths, and FX from the palette or create custom instruments. Every newly added instrument defaults to Pan 0 (dead center), Frequency 60%, and an initial 90px wide by 70px tall size.',
    preferredPosition: 'right',
  },
  {
    targetId: 'inspector-panel',
    badge: 'Track Inspector & DSP',
    title: '3. Physical Dimensions & DSP Modifiers',
    subtitle: 'Up to 600px Width · 100% Volume = 240×200px',
    content:
      'Select any bubble to adjust physical width (stereo spread) up to 600px and height up to 300px. At 100% volume and 0% Z, the standard size is 240×200px. Distortion creates spiky TV static glitch tearing, while Reverb generates a dramatic luminous glow and aquatic water-like blur.',
    preferredPosition: 'left',
  },
  {
    targetId: 'arrangement-timeline-drawer',
    badge: 'Arrangement Timeline',
    title: '4. Arrangement Timeline',
    subtitle: 'Time-Synchronized Instrument Activation',
    content:
      'The timeline arranges when each instrument enters and drops out across the song. Drag and resize region blocks to create dynamic arrangements. Active instruments glow on stage, while silent sections dim to ghosted opacity.',
    preferredPosition: 'top',
  },
  {
    targetId: 'app-header',
    badge: 'Global Controls & Workflow',
    title: '5. Diagnostic Challenges & Camera Perspectives',
    subtitle: 'Switch Views, Earn Stars & Export Grade Reports',
    content:
      'Switch camera angles between Front View (EQ & Pan), 3D Room Perspective, and Top View (Bird’s Eye). Complete the 5 Diagnostic Mixing Challenges to earn up to 15 Stars, and export an encrypted assignment verification code for your audio instructor!',
    preferredPosition: 'bottom',
  },
];

export const QuickTourModal: React.FC<QuickTourModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // Measure target DOM element rectangle
  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;
    const targetEl = document.getElementById(step.targetId);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step.targetId]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    const timer = setTimeout(updateTargetRect, 60);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
      clearTimeout(timer);
    };
  }, [currentStep, updateTargetRect]);

  // Keyboard navigation for tour (Left/Right/Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setCurrentStep((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const icons = [
    <Compass className="w-5 h-5 text-indigo-400" />,
    <Music className="w-5 h-5 text-emerald-400" />,
    <Sliders className="w-5 h-5 text-amber-400" />,
    <Layers className="w-5 h-5 text-sky-400" />,
    <Award className="w-5 h-5 text-purple-400" />,
  ];

  // Calculate card positioning smartly relative to target rectangle
  const getCardStyle = (): React.CSSProperties => {
    const defaultStyle: React.CSSProperties = {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    };

    if (!targetRect) return defaultStyle;

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const cardW = Math.min(480, winW - 32);
    const cardH = 290;
    const margin = 16;

    if (step.preferredPosition === 'bottom') {
      // Below target, or inside lower target area
      if (targetRect.bottom + cardH + margin < winH) {
        return {
          position: 'fixed',
          left: Math.max(margin, Math.min(winW - cardW - margin, targetRect.left + (targetRect.width - cardW) / 2)),
          top: targetRect.bottom + margin,
        };
      }
      return {
        position: 'fixed',
        left: Math.max(margin, Math.min(winW - cardW - margin, targetRect.left + (targetRect.width - cardW) / 2)),
        bottom: margin + 12,
      };
    } else if (step.preferredPosition === 'top') {
      if (targetRect.top - cardH - margin > 0) {
        return {
          position: 'fixed',
          left: Math.max(margin, Math.min(winW - cardW - margin, targetRect.left + (targetRect.width - cardW) / 2)),
          top: Math.max(margin, targetRect.top - cardH - margin),
        };
      }
      return {
        position: 'fixed',
        left: Math.max(margin, Math.min(winW - cardW - margin, targetRect.left + (targetRect.width - cardW) / 2)),
        top: margin + 12,
      };
    } else if (step.preferredPosition === 'right') {
      if (targetRect.right + cardW + margin < winW) {
        return {
          position: 'fixed',
          left: targetRect.right + margin,
          top: Math.max(margin, Math.min(winH - cardH - margin, targetRect.top + 30)),
        };
      }
      return {
        position: 'fixed',
        right: margin,
        top: Math.max(margin, Math.min(winH - cardH - margin, targetRect.top + 30)),
      };
    } else if (step.preferredPosition === 'left') {
      if (targetRect.left - cardW - margin > 0) {
        return {
          position: 'fixed',
          left: Math.max(margin, targetRect.left - cardW - margin),
          top: Math.max(margin, Math.min(winH - cardH - margin, targetRect.top + 30)),
        };
      }
      return {
        position: 'fixed',
        left: margin,
        top: Math.max(margin, Math.min(winH - cardH - margin, targetRect.top + 30)),
      };
    }

    return defaultStyle;
  };

  const pad = 6;
  const tX = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const tY = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const tW = targetRect ? targetRect.width + pad * 2 : 0;
  const tH = targetRect ? targetRect.height + pad * 2 : 0;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto select-none overflow-hidden animate-fadeIn">
      {/* 1. Backdrop SVG Mask with Soft Blur & Darkened Backdrop */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[100]">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White = opaque backdrop cover */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black hole = transparent cutout illuminating the target element */}
            {targetRect && (
              <rect
                x={tX}
                y={tY}
                width={tW}
                height={tH}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Darkening & Backdrop Blur Applied to Everything OUTSIDE the Spotlight */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(3, 7, 18, 0.82)"
          mask="url(#tour-spotlight-mask)"
          className="backdrop-blur-[2.5px] transition-all duration-300 pointer-events-auto"
          onClick={onClose}
        />
      </svg>

      {/* 2. Spotlight Cutout Animated Glow Border */}
      {targetRect && (
        <div
          className="fixed pointer-events-none z-40 rounded-xl transition-all duration-300"
          style={{
            left: `${tX}px`,
            top: `${tY}px`,
            width: `${tW}px`,
            height: `${tH}px`,
            boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.9), 0 0 35px 4px rgba(99, 102, 241, 0.45)',
          }}
        >
          {/* Target Element Floating Tag */}
          <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold shadow-lg flex items-center gap-1 ring-1 ring-white/30 animate-pulse">
            <Sparkles className="w-2.5 h-2.5" />
            <span>FOCUS: {step.badge}</span>
          </div>
        </div>
      )}

      {/* 3. Interactive Floating Tour Card */}
      <div
        ref={cardRef}
        style={getCardStyle()}
        className="z-[101] w-[460px] max-w-[calc(100vw-32px)] bg-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2 text-indigo-400">
            <GraduationCap className="w-4 h-4" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">
              3D Mix Lab · Guided Tour
            </h3>
          </div>
          <button
            onClick={onClose}
            title="Close Tour (Esc)"
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-inner">
              {icons[currentStep]}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold tracking-wider block">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
              <h4 className="font-bold text-sm text-white truncate">{step.title}</h4>
              <p className="text-[11px] text-indigo-300/80 font-mono mt-0.5 truncate">
                {step.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/90 shadow-inner">
            {step.content}
          </p>

          {/* Step Progress Dots */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  title={`Go to step ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ? 'w-6 bg-indigo-500 ring-1 ring-indigo-300'
                      : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Press ← or → to navigate
            </span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              currentStep === 0
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
            >
              Skip Tour
            </button>

            {isLast ? (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
              >
                Finish & Start Mixing!
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentStep((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1))
                }
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 shadow-md shadow-indigo-600/20 transition"
              >
                <span>Next Step</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
