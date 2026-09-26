import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ViewMode, ThemeMode, GraphPaperStyle, SoundBubble } from '../types';
import { FileText, Compass, AlertCircle } from 'lucide-react';
import { getInstrumentIconComponent, StudioMonitorsIcon, PaperAirplaneIcon } from '../utils/instrumentIcons';
import { getFrequencyAssessment } from '../utils/frequencyAssessment';

interface Stage3DProps {
  bubbles: SoundBubble[];
  selectedId: string | null;
  selectedIds?: string[];
  onSelectBubble: (id: string | null, isMulti?: boolean) => void;
  onSelectMultiple?: (ids: string[]) => void;
  onUpdateBubble: (updated: SoundBubble) => void;
  onUpdateBubbles?: (updated: SoundBubble[]) => void;
  onDuplicateBubble: (id: string) => void;
  onDuplicateBubbles?: (ids: string[]) => void;
  onDeleteBubble: (id: string) => void;
  onDeleteBubbles?: (ids: string[]) => void;
  onAddBubble?: (template: any) => void;
  viewMode: ViewMode;
  theme: ThemeMode;
  currentTime: number;
  readOnly?: boolean;
  onToggleSolo?: (id: string) => void;
  onToggleMute?: (id: string) => void;
}

interface GlitchTearingBarsProps {
  saturation: number;
  theme: ThemeMode;
}

const GlitchTearingBars: React.FC<GlitchTearingBarsProps> = ({
  saturation,
  theme,
}) => {
  // Only start at 60% and subtly ramp up
  if (saturation < 60) return null;

  // Normalized progress from 0.0 (at 60%) to 1.0 (at 100%)
  const progress = Math.min(1, Math.max(0, (saturation - 60) / 40));
  // Smooth subtle ramp curve: soft initial entrance that progressively builds
  const ramp = Math.pow(progress, 1.25);
  const masterOpacity = 0.18 + ramp * 0.72; // 0.18 at 60% -> 0.90 at 100%

  return (
    <div
      className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-[1] select-none"
      style={{ opacity: masterOpacity }}
    >
      {/* 1. Subtle Interlaced CRT Scanlines & Phosphor Mesh strictly inside bubble boundary */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden mix-blend-screen pointer-events-none"
        style={{
          opacity: 0.25 + ramp * 0.4,
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(0,0,0,0.7) 0px, rgba(0,0,0,0.7) 1.5px, transparent 1.5px, transparent 3px),
            repeating-linear-gradient(90deg, rgba(255,0,80,0.25) 0px, rgba(0,240,255,0.25) 1px, rgba(57,255,20,0.25) 2px, transparent 3px)
          `,
          backgroundSize: '100% 3px, 3px 100%',
        }}
      />

      {/* 2. Horizontal Glitch & Datamosh Slices - strictly contained inside inset-0 */}
      {/* Slice 1 - Near Top: Cyan / White subtle razor slice (active from 60%) */}
      <div
        className="absolute inset-x-0 h-[2.5px] pointer-events-none"
        style={{
          top: '18%',
          background: theme === 'light'
            ? 'linear-gradient(90deg, transparent 5%, #0284c7 25%, #db2777 50%, #0284c7 75%, transparent 95%)'
            : 'linear-gradient(90deg, transparent 5%, #00f0ff 25%, #ffffff 50%, #ff007f 75%, transparent 95%)',
          animation: 'glitch-tear-left 0.28s infinite steps(2)',
          opacity: 0.4 + ramp * 0.55,
        }}
      />

      {/* Slice 2 - Upper-Mid: Multi-color Datamosh Slice (active from 60%) */}
      <div
        className="absolute inset-x-0 h-[3.5px] pointer-events-none"
        style={{
          top: '32%',
          background: theme === 'light'
            ? 'linear-gradient(90deg, transparent 0%, #db2777 20%, #0284c7 45%, #16a34a 70%, #eab308 90%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, #ff007f 20%, #00f0ff 45%, #39ff14 70%, #ffe600 90%, transparent 100%)',
          animation: 'glitch-tear-right 0.32s infinite steps(2)',
          opacity: 0.35 + ramp * 0.6,
        }}
      />

      {/* Slice 3 - Lower-Mid: Phosphor Green / Cyan Scanline (ramps in gently at 68%) */}
      {saturation >= 68 && (
        <div
          className="absolute inset-x-0 h-[3px] pointer-events-none"
          style={{
            top: '58%',
            background: theme === 'light'
              ? 'linear-gradient(90deg, transparent 5%, #16a34a 25%, #0284c7 60%, #db2777 85%, transparent 95%)'
              : 'linear-gradient(90deg, transparent 5%, #39ff14 25%, #00f0ff 60%, #ff007f 85%, transparent 95%)',
            animation: 'glitch-tear-left 0.25s infinite steps(2)',
            opacity: 0.3 + ((saturation - 68) / 32) * 0.65,
          }}
        />
      )}

      {/* Slice 4 - Lower: Canary Yellow / Magenta Slice (ramps in gently at 76%) */}
      {saturation >= 76 && (
        <div
          className="absolute inset-x-0 h-[3.5px] pointer-events-none"
          style={{
            top: '72%',
            background: theme === 'light'
              ? 'linear-gradient(90deg, transparent 8%, #eab308 30%, #ffffff 55%, #0284c7 80%, transparent 95%)'
              : 'linear-gradient(90deg, transparent 8%, #ffe600 30%, #ffffff 55%, #00f0ff 80%, transparent 95%)',
            animation: 'glitch-tear-fast 0.22s infinite steps(3)',
            opacity: 0.35 + ((saturation - 76) / 24) * 0.6,
          }}
        />
      )}

      {/* Slice 5 - Heavy Datamosh Midfield Block (ramps in at 84%) */}
      {saturation >= 84 && (
        <div
          className="absolute inset-x-0 h-[4.5px] pointer-events-none"
          style={{
            top: '44%',
            background: theme === 'light'
              ? 'repeating-linear-gradient(90deg, #0284c7 0px, #0284c7 8px, #db2777 8px, #db2777 16px, #ffffff 16px, #ffffff 24px)'
              : 'repeating-linear-gradient(90deg, #00f0ff 0px, #00f0ff 8px, #ff007f 8px, #ff007f 16px, #ffe600 16px, #ffe600 24px)',
            animation: 'glitch-tear-right 0.2s infinite steps(2)',
            opacity: 0.4 + ((saturation - 84) / 16) * 0.55,
          }}
        />
      )}

      {/* Slice 6 - Bottom Scanline (ramps in at 90%) */}
      {saturation >= 90 && (
        <div
          className="absolute inset-x-0 h-[2px] pointer-events-none"
          style={{
            top: '84%',
            background: theme === 'light'
              ? 'linear-gradient(90deg, transparent 10%, #db2777 40%, #0284c7 80%, transparent 90%)'
              : 'linear-gradient(90deg, transparent 10%, #ff007f 40%, #00f0ff 80%, transparent 90%)',
            animation: 'glitch-tear-fast 0.16s infinite steps(2)',
            opacity: 0.8,
          }}
        />
      )}
    </div>
  );
};

export const Stage3D: React.FC<Stage3DProps> = ({
  bubbles,
  selectedId,
  selectedIds,
  onSelectBubble,
  onSelectMultiple,
  onUpdateBubble,
  onUpdateBubbles,
  onDuplicateBubble,
  onDuplicateBubbles,
  onDeleteBubble: _onDeleteBubble,
  onDeleteBubbles: _onDeleteBubbles,
  onAddBubble,
  viewMode,
  theme,
  currentTime,
  readOnly = false,
  onToggleSolo,
  onToggleMute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDragPos = useRef<{ clientX: number; clientY: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Effective multi-selection IDs list
  const currentSelectedIds = selectedIds && selectedIds.length > 0
    ? selectedIds
    : selectedId ? [selectedId] : [];

  // Artistic Graph Paper Style Options: parchment or charcoal
  const [paperStyle, setPaperStyle] = useState<GraphPaperStyle>(theme === 'light' ? 'parchment' : 'charcoal');

  useEffect(() => {
    setPaperStyle(theme === 'light' ? 'parchment' : 'charcoal');
  }, [theme]);

  // Multi-bubble drag state
  const [dragState, setDragState] = useState<{
    bubbleIds: string[];
    startX: number;
    startY: number;
    initialPositions: Record<string, { x: number; y: number; z: number; volume: number }>;
  } | null>(null);

  // Marquee rubber-band selection state
  const [marqueeState, setMarqueeState] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isShift: boolean;
    initialSelectedIds: string[];
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    bubbleId: string;
    handle: 'left' | 'right' | 'top' | 'bottom';
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  const [isCenterSnapping, setIsCenterSnapping] = useState<boolean>(false);

  // Resize observer to ensure responsive stage canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      setDimensions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute effective Z: 100% volume = 0% Z depth in mix (inversely coupled)
  const getEffectiveZ = useCallback((b: SoundBubble): number => {
    return Math.max(0, Math.min(100, 100 - b.volume));
  }, []);

  // Check if bubble is active at currentTime according to timeline regions
  const isBubbleActiveOnTimeline = useCallback(
    (b: SoundBubble): boolean => {
      if (!b.regions || b.regions.length === 0) return true;
      return b.regions.some((r) => currentTime >= r.start && currentTime <= r.end);
    },
    [currentTime]
  );

  const anySolo = bubbles.some((b) => b.solo);

  // Convert logical coordinates (-100 to 100 for X, 0 to 100 for Y/Z) to screen px
  const getScreenCoords = useCallback(
    (b: SoundBubble) => {
      const padX = 85;
      const padY = 65;
      const usableW = Math.max(200, dimensions.width - padX * 2);
      const usableH = Math.max(200, dimensions.height - padY * 2);

      const effZ = getEffectiveZ(b);

      if (viewMode === 'front') {
        // Front View: X = Pan (-64 to 64), Y = Frequency (0 to 100, 0 is bottom)
        const screenX = padX + ((b.x + 64) / 128) * usableW;
        const screenY = dimensions.height - padY - (b.y / 100) * usableH;
        // Z gives depth scale (near Z=0 is larger scale 1.15, far Z=100 is smaller scale 0.75)
        const depthScale = 1.15 - (effZ / 100) * 0.4;
        const blur = (effZ / 100) * 1.5; // subtle depth blur
        const depthOpacity = 1 - (effZ / 100) * 0.25;
        return { x: screenX, y: screenY, scale: depthScale, blur, depthOpacity, z: effZ };
      } else if (viewMode === 'top') {
        // Top View: X = Pan (-64 to 64), Y axis represents non-linear Z (0 Bottom/Foreground to 100 Top/Background)
        const screenX = padX + ((b.x + 64) / 128) * usableW;
        const visualZ = Math.sqrt(Math.max(0, Math.min(100, effZ)) / 100) * 100;
        const screenY = dimensions.height - padY - (visualZ / 100) * usableH;
        return { x: screenX, y: screenY, scale: 0.95 + (b.volume / 100) * 0.2, blur: 0, depthOpacity: 1, z: effZ };
      } else {
        // 3D Stage Projection View:
        const normalizedX = b.x / 64; // -1 to 1
        const normalizedY = b.y / 100; // 0 to 1
        const normalizedZ = effZ / 100; // 0 (near) to 1 (far)

        const centerX = dimensions.width / 2;
        const groundY = dimensions.height * 0.72;

        const perspectiveFactor = 1 - normalizedZ * 0.42;
        const roomWidth = usableW * 0.9 * perspectiveFactor;
        const screenX = centerX + normalizedX * (roomWidth / 2);

        const floorBaseline = groundY - normalizedZ * (usableH * 0.45);
        const elevation = normalizedY * (usableH * 0.48) * perspectiveFactor;
        const screenY = floorBaseline - elevation;
        const depthScale = (1.25 - normalizedZ * 0.55);

        return { x: screenX, y: screenY, scale: depthScale, blur: normalizedZ * 1.5, depthOpacity: 1 - normalizedZ * 0.2, z: effZ };
      }
    },
    [dimensions, viewMode, getEffectiveZ]
  );

  // Pointer drag handlers for bubbles (supports single and multi-selection dragging)
  const handlePointerDown = (e: React.PointerEvent, bubble: SoundBubble) => {
    if (readOnly || (viewMode !== 'front' && viewMode !== 'top')) {
      if (e.shiftKey) {
        onSelectBubble(bubble.id, true);
      } else {
        onSelectBubble(bubble.id, false);
      }
      return;
    }

    e.stopPropagation();

    // Alt key duplicates
    if (e.altKey) {
      if (currentSelectedIds.includes(bubble.id) && currentSelectedIds.length > 1) {
        if (onDuplicateBubbles) {
          onDuplicateBubbles(currentSelectedIds);
        } else {
          currentSelectedIds.forEach((id) => onDuplicateBubble(id));
        }
      } else {
        onDuplicateBubble(bubble.id);
      }
      return;
    }

    // Determine target selection
    let activeIds: string[];
    if (e.shiftKey) {
      // Toggle this bubble in selection
      if (currentSelectedIds.includes(bubble.id)) {
        activeIds = currentSelectedIds.filter((id) => id !== bubble.id);
      } else {
        activeIds = [...currentSelectedIds, bubble.id];
      }
      if (onSelectMultiple) {
        onSelectMultiple(activeIds);
      } else {
        onSelectBubble(bubble.id, true);
      }
    } else {
      // Regular click: if clicking an already-selected item among multiple, keep all selected for group drag!
      if (currentSelectedIds.includes(bubble.id) && currentSelectedIds.length > 1) {
        activeIds = currentSelectedIds;
      } else {
        activeIds = [bubble.id];
        if (onSelectMultiple) {
          onSelectMultiple([bubble.id]);
        } else {
          onSelectBubble(bubble.id, false);
        }
      }
    }

    // Prepare multi-drag positions
    const targets = bubbles.filter((b) => activeIds.includes(b.id));
    const initPos: Record<string, { x: number; y: number; z: number; volume: number }> = {};
    targets.forEach((b) => {
      initPos[b.id] = {
        x: b.x,
        y: b.y,
        z: getEffectiveZ(b),
        volume: b.volume,
      };
    });

    setDragState({
      bubbleIds: activeIds,
      startX: e.clientX,
      startY: e.clientY,
      initialPositions: initPos,
    });
  };

  const handleResizePointerDown = (
    e: React.PointerEvent,
    bubble: SoundBubble,
    handle: 'left' | 'right' | 'top' | 'bottom'
  ) => {
    if (readOnly || viewMode !== 'front') return;
    e.stopPropagation();
    setResizeState({
      bubbleId: bubble.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: bubble.width,
      initialHeight: bubble.height,
    });
  };

  // Window pointer move and up listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragState && !resizeState && !marqueeState) return;

      const padX = 85;
      const padY = 65;
      const usableW = Math.max(200, dimensions.width - padX * 2);
      const usableH = Math.max(200, dimensions.height - padY * 2);

      // Multi-bubble Dragging
      if (dragState) {
        const deltaPxX = e.clientX - dragState.startX;
        const deltaPxY = e.clientY - dragState.startY;

        const deltaCoordX = (deltaPxX / usableW) * 200;
        const deltaCoordY = -(deltaPxY / usableH) * 100;

        const updatedBubbles: SoundBubble[] = [];
        let anySnapping = false;

        dragState.bubbleIds.forEach((id) => {
          const bubble = bubbles.find((b) => b.id === id);
          const init = dragState.initialPositions[id];
          if (!bubble || !init) return;

          let newX = Math.round(Math.max(-100, Math.min(100, init.x + deltaCoordX)));
          // Center pan snap threshold (within 1.8 units of 0)
          if (Math.abs(newX) <= 1.8) {
            newX = 0;
            anySnapping = true;
          }

          if (viewMode === 'top') {
            // In Top View, deltaCoordY moves along Z depth non-linearly (expanded 0-20% range)
            const initVisualZ = Math.sqrt(Math.max(0, Math.min(100, init.z)) / 100) * 100;
            const newVisualZ = Math.max(0, Math.min(100, initVisualZ + deltaCoordY));
            const newZ = Math.round(Math.max(0, Math.min(100, (newVisualZ * newVisualZ) / 100)));
            const newVol = 100 - newZ; // Inversely coupled
            updatedBubbles.push({
              ...bubble,
              x: newX,
              z: newZ,
              volume: newVol,
            });
          } else {
            // In Front view, deltaCoordY moves along Frequency Y (0 = bass, 100 = air)
            const newY = Math.round(Math.max(0, Math.min(100, init.y + deltaCoordY)));
            updatedBubbles.push({
              ...bubble,
              x: newX,
              y: newY,
            });
          }
        });

        setIsCenterSnapping(anySnapping);

        if (updatedBubbles.length > 0) {
          if (onUpdateBubbles) {
            onUpdateBubbles(updatedBubbles);
          } else {
            updatedBubbles.forEach((b) => onUpdateBubble(b));
          }
        }
      } else if (resizeState) {
        const bubble = bubbles.find((b) => b.id === resizeState.bubbleId);
        if (!bubble) return;

        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;

        let newW = resizeState.initialWidth;
        let newH = resizeState.initialHeight;

        // Allow stretching width up to 600px and height up to 300px
        if (resizeState.handle === 'right') {
          newW = Math.max(20, Math.min(600, Math.round(resizeState.initialWidth + deltaX * 1.0)));
        } else if (resizeState.handle === 'left') {
          newW = Math.max(20, Math.min(600, Math.round(resizeState.initialWidth - deltaX * 1.0)));
        } else if (resizeState.handle === 'top') {
          newH = Math.max(20, Math.min(300, Math.round(resizeState.initialHeight - deltaY * 1.0)));
        } else if (resizeState.handle === 'bottom') {
          newH = Math.max(20, Math.min(300, Math.round(resizeState.initialHeight + deltaY * 1.0)));
        }

        onUpdateBubble({
          ...bubble,
          width: newW,
          height: newH,
        });
      } else if (marqueeState && containerRef.current) {
        const curX = e.clientX;
        const curY = e.clientY;
        setMarqueeState((prev) => (prev ? { ...prev, currentX: curX, currentY: curY } : null));

        const dist = Math.hypot(curX - marqueeState.startX, curY - marqueeState.startY);
        if (dist > 5) {
          const rect = containerRef.current.getBoundingClientRect();
          const mLeft = Math.min(marqueeState.startX, curX) - rect.left;
          const mTop = Math.min(marqueeState.startY, curY) - rect.top;
          const mWidth = Math.abs(curX - marqueeState.startX);
          const mHeight = Math.abs(curY - marqueeState.startY);

          const newlySelectedIds: string[] = [];

          bubbles.forEach((bubble) => {
            const coords = getScreenCoords(bubble);
            const volFactor = 0.5 + (bubble.volume / 100) * 0.5;
            const perspectiveMult = viewMode === 'front' ? 1 : coords.scale;
            const bubbleW = Math.min(600, Math.max(20, bubble.width * volFactor * perspectiveMult));
            const bubbleH = Math.min(300, Math.max(20, bubble.height * volFactor * perspectiveMult));

            const bLeft = coords.x - bubbleW / 2;
            const bRight = coords.x + bubbleW / 2;
            const bTop = coords.y - bubbleH / 2;
            const bBottom = coords.y + bubbleH / 2;

            const isIntersecting = !(
              bRight < mLeft ||
              bLeft > mLeft + mWidth ||
              bBottom < mTop ||
              bTop > mTop + mHeight
            );

            if (isIntersecting) {
              newlySelectedIds.push(bubble.id);
            }
          });

          const combined = marqueeState.isShift
            ? Array.from(new Set([...marqueeState.initialSelectedIds, ...newlySelectedIds]))
            : newlySelectedIds;

          if (onSelectMultiple) {
            onSelectMultiple(combined);
          } else if (combined.length > 0) {
            onSelectBubble(combined[0]);
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (marqueeState) {
        const dist = Math.hypot(
          marqueeState.currentX - marqueeState.startX,
          marqueeState.currentY - marqueeState.startY
        );
        if (dist <= 5) {
          // User clicked on empty space without dragging -> deselect all
          if (onSelectMultiple) {
            onSelectMultiple([]);
          } else {
            onSelectBubble(null);
          }
        }
        setMarqueeState(null);
      }
      setDragState(null);
      setResizeState(null);
      setIsCenterSnapping(false);
    };

    if (dragState || resizeState || marqueeState) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    dragState,
    resizeState,
    marqueeState,
    bubbles,
    dimensions,
    onUpdateBubble,
    onUpdateBubbles,
    onSelectMultiple,
    onSelectBubble,
    getScreenCoords,
    viewMode,
  ]);

  // Graph paper theme variables
  const getPaperStyles = () => {
    switch (paperStyle) {
      case 'charcoal':
        return {
          bg: 'bg-[#13161c]',
          textColor: 'text-amber-100/90',
          subtextColor: 'text-amber-300/60',
          minorStroke: 'rgba(245, 158, 11, 0.07)',
          mediumStroke: 'rgba(245, 158, 11, 0.16)',
          majorStroke: 'rgba(245, 158, 11, 0.32)',
          crossStroke: 'rgba(251, 191, 36, 0.55)',
          centerLine: 'rgba(245, 158, 11, 0.45)',
          rulerBg: 'bg-[#181c24]/90 border-amber-500/20 text-amber-200/70',
        };
      case 'parchment':
        return {
          bg: 'bg-[#f5f1e8]',
          textColor: 'text-slate-900',
          subtextColor: 'text-slate-600',
          minorStroke: 'rgba(100, 116, 139, 0.14)',
          mediumStroke: 'rgba(71, 85, 105, 0.26)',
          majorStroke: 'rgba(30, 41, 59, 0.42)',
          crossStroke: 'rgba(15, 23, 42, 0.7)',
          centerLine: 'rgba(15, 23, 42, 0.5)',
          rulerBg: 'bg-[#ebe5d8] border-slate-300 text-slate-700',
        };
      case 'blueprint':
      default:
        return {
          bg: 'bg-[#0b1424]',
          textColor: 'text-cyan-100',
          subtextColor: 'text-cyan-300/70',
          minorStroke: 'rgba(56, 189, 248, 0.08)',
          mediumStroke: 'rgba(56, 189, 248, 0.20)',
          majorStroke: 'rgba(56, 189, 248, 0.38)',
          crossStroke: 'rgba(56, 189, 248, 0.65)',
          centerLine: 'rgba(56, 189, 248, 0.5)',
          rulerBg: 'bg-[#0f1b30]/90 border-cyan-500/25 text-cyan-300/70',
        };
    }
  };

  const currentPaper = getPaperStyles();

  const handleStageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw && onAddBubble) {
        const item = JSON.parse(raw);
        if (item && item.name) {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const padX = 85;
            const padY = 65;
            const usableW = Math.max(200, rect.width - padX * 2);
            const usableH = Math.max(200, rect.height - padY * 2);
            const clientX = (e.clientX && e.clientX !== 0) ? e.clientX : (lastDragPos.current?.clientX || (rect.left + rect.width / 2));
            const clientY = (e.clientY && e.clientY !== 0) ? e.clientY : (lastDragPos.current?.clientY || (rect.top + rect.height / 2));
            const dropX = clientX - rect.left;
            const dropY = clientY - rect.top;
            const normX = Math.round(Math.max(-64, Math.min(64, ((dropX - padX) / usableW) * 128 - 64)));
            const normY = Math.round(Math.max(0, Math.min(100, ((rect.height - padY - dropY) / usableH) * 100)));
            onAddBubble({
              ...item,
              x: normX,
              y: normY,
            });
            return;
          }
          onAddBubble(item);
        }
      }
    } catch (err) {
      console.error('Failed to parse dropped instrument onto stage', err);
    }
  };

  const handleStagePointerDown = (e: React.PointerEvent) => {
    // Only primary mouse button (0)
    if (e.button !== 0 || readOnly) return;
    const target = e.target as HTMLElement;
    // Don't trigger marquee if clicking on buttons or controls
    if (target.closest('button') || target.closest('[data-no-marquee="true"]')) {
      return;
    }

    setMarqueeState({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isShift: e.shiftKey,
      initialSelectedIds: e.shiftKey ? currentSelectedIds : [],
    });
  };

  return (
    <div
      ref={containerRef}
      id="mix-diagram-stage"
      onPointerDown={handleStagePointerDown}
      onDragOver={(e) => {
        e.preventDefault();
        lastDragPos.current = { clientX: e.clientX, clientY: e.clientY };
      }}
      onDrop={handleStageDrop}
      className={`relative w-full h-full overflow-hidden flex flex-col justify-between transition-colors select-none ${currentPaper.bg} ${currentPaper.textColor}`}
    >
      {/* SVG Definitions for Graph Paper Patterns, Distortion Shaders & Glow */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* Dynamic Per-Bubble Filters for Spikey TV Static Glitch and Fluid Water Reverb */}
          {bubbles.map((b) => {
            // Intensified distortion static glitch displacement (non-linear curve for severe high levels)
            const satVal = b.saturation / 100;
            const satScale = Math.round(Math.pow(satVal, 1.5) * 260);
            const spikeNoiseScale = Math.round(Math.pow(satVal, 1.5) * 130);
            // Reverb water displacement & blur reduced by 25%
            const waterScale = Math.round((b.reverb / 100) * 24);
            const waterBlur = Number(((b.reverb / 100) * 2.85).toFixed(1));

            return (
              <React.Fragment key={b.id}>
                {/* 1. Spikey TV Static Glitch Distortion Filter with wide boundary */}
                <filter id={`tv-static-filter-${b.id}`} x="-120%" y="-120%" width="340%" height="340%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65 0.018" numOctaves="4" result="scanGlitch" />
                  <feTurbulence type="turbulence" baseFrequency="0.95 0.95" numOctaves="4" result="needleGrain" />
                  <feDisplacementMap in="SourceGraphic" in2="scanGlitch" scale={satScale} xChannelSelector="R" yChannelSelector="G" result="tornGraphic" />
                  <feDisplacementMap in="tornGraphic" in2="needleGrain" scale={spikeNoiseScale} xChannelSelector="B" yChannelSelector="R" result="spikyResult" />
                </filter>

                {/* 2. Fluid Water Reverb Liquid Wave & Blur Filter (reduced 25%) */}
                <filter id={`water-liquid-filter-${b.id}`} x="-40%" y="-40%" width="180%" height="180%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.038 0.045" numOctaves="3" result="waterRipples" />
                  <feDisplacementMap in="SourceGraphic" in2="waterRipples" scale={waterScale} xChannelSelector="R" yChannelSelector="B" result="rippledBody" />
                  <feGaussianBlur in="rippledBody" stdDeviation={waterBlur} result="waterBlurred" />
                </filter>

                {/* 3. Combined Spikey TV Static + Fluid Water Reverb Filter */}
                <filter id={`combined-filter-${b.id}`} x="-120%" y="-120%" width="340%" height="340%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65 0.018" numOctaves="4" result="scanGlitch" />
                  <feTurbulence type="turbulence" baseFrequency="0.95 0.95" numOctaves="4" result="needleGrain" />
                  <feDisplacementMap in="SourceGraphic" in2="scanGlitch" scale={satScale} xChannelSelector="R" yChannelSelector="G" result="tornGraphic" />
                  <feDisplacementMap in="tornGraphic" in2="needleGrain" scale={spikeNoiseScale} xChannelSelector="B" yChannelSelector="R" result="spikyResult" />
                  <feTurbulence type="fractalNoise" baseFrequency="0.038 0.045" numOctaves="3" result="waterRipples" />
                  <feDisplacementMap in="spikyResult" in2="waterRipples" scale={waterScale} xChannelSelector="R" yChannelSelector="B" result="rippledBody" />
                  <feGaussianBlur in="rippledBody" stdDeviation={waterBlur} result="finalRender" />
                </filter>
              </React.Fragment>
            );
          })}

          {/* Authentic Millimeter Graph Paper Grid Pattern */}
          <pattern id="graph-small-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke={currentPaper.minorStroke} strokeWidth="0.5" />
          </pattern>
          <pattern id="graph-medium-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="url(#graph-small-grid)" />
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke={currentPaper.mediumStroke} strokeWidth="0.8" />
          </pattern>
          <pattern id="graph-major-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#graph-medium-grid)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke={currentPaper.majorStroke} strokeWidth="1.2" />
            {/* Corner Crosshair Marks (+) */}
            <path d="M 0 -4 L 0 4 M -4 0 L 4 0" fill="none" stroke={currentPaper.crossStroke} strokeWidth="1" />
          </pattern>
        </defs>
      </svg>

      {/* Stage Container Wrapper (No rotation, clean perspective) */}
      <div
        className="absolute inset-0 pointer-events-auto transition-transform duration-700 ease-out overflow-hidden flex flex-col justify-between"
      >
        {/* Center Pan Snapping Indicator Line (Google Slides style vertical red alignment line) */}
        {isCenterSnapping && (
          <div className="absolute inset-y-0 left-1/2 w-[1.5px] bg-red-500 z-40 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.9)] flex items-center justify-center">
            <div className="absolute top-1/4 -translate-y-1/2 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-mono rounded shadow-md tracking-wider uppercase whitespace-nowrap ring-1 ring-white/40">
              Center Pan (0)
            </div>
          </div>
        )}

        {/* 2. Perspective Layout Overlay & Drafting Measurements */}
        <div className="absolute inset-0 pointer-events-none">
          {viewMode === 'front' && (
            <div className="w-full h-full relative">
              {/* Center Axis Guideline */}
              <div
                className="absolute left-1/2 top-0 bottom-0 w-px"
                style={{
                  backgroundColor: currentPaper.centerLine,
                  borderLeft: `1px dashed ${currentPaper.centerLine}`,
                }}
              />

              {/* Horizontal Frequency Architectural Guide Lines */}
              <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between p-8 pointer-events-none opacity-30">
                <div className="border-b border-current pb-0.5 text-[10px] font-mono tracking-widest uppercase">
                  12kHz - 20kHz [ AIR & METALLIC SPARKLE ]
                </div>
                <div className="border-b border-current pb-0.5 text-[10px] font-mono tracking-widest uppercase">
                  4kHz - 8kHz [ PRESENCE & TRANSIENT BITE ]
                </div>
                <div className="border-b border-current pb-0.5 text-[10px] font-mono tracking-widest uppercase">
                  800Hz - 2.5kHz [ CRITICAL MIDRANGE HARMONICS ]
                </div>
                <div className="border-b border-current pb-0.5 text-[10px] font-mono tracking-widest uppercase">
                  150Hz - 400Hz [ WARMTH & LOWER MID BODY ]
                </div>
                <div className="border-b border-current pb-0.5 text-[10px] font-mono tracking-widest uppercase">
                  20Hz - 80Hz [ SUB-BASS & CHEST THUMP ]
                </div>
              </div>



              {/* Bottom Horizontal Stereo Panning Scale Ruler */}
              <div className="absolute inset-x-16 bottom-2 flex justify-between text-[9px] font-mono opacity-55 pointer-events-none">
                <span>-64 (HARD L)</span>
                <span>-32</span>
                <span className="font-bold underline">0 (CENTER)</span>
                <span>+32</span>
                <span>+64 (HARD R)</span>
              </div>
            </div>
          )}

          {viewMode === 'top' && (
            <div className="w-full h-full relative p-8">
              <div className="absolute inset-0 flex flex-col justify-between p-8 opacity-30">
                <div className="border-b border-current pb-1 text-[11px] font-mono tracking-wider">
                  BACKGROUND (Z = 100): Pads, Ambience, Reverbs
                </div>
                <div className="border-b border-current pb-1 text-[11px] font-mono tracking-wider">
                  MIDGROUND (Z = 50): Rhythm Guitars, Keyboards, Strings/Horns, Other Percussion, Backing Vocals
                </div>
                <div className="border-b border-current pb-1 text-[11px] font-mono tracking-wider">
                  FOREGROUND (Z = 0): Lead Vocals, Bass, Kick, Snare
                </div>
              </div>
              {/* Center Stage axis */}
              <div
                className="absolute left-1/2 top-0 bottom-0 w-px"
                style={{ backgroundColor: currentPaper.centerLine }}
              />
            </div>
          )}

        </div>

        {/* Spacer for Stage Control Bar */}
        <div className="relative z-10 px-5 pt-3 flex items-center justify-between text-xs font-mono pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border backdrop-blur ${
              theme === 'light' ? 'bg-white/90 border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-950/80 border-slate-800 text-slate-200'
            }`}>
              {viewMode === 'front' ? (
                <StudioMonitorsIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              ) : (
                <PaperAirplaneIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              )}
              <span className="font-semibold">
                {viewMode === 'front'
                  ? 'Front View (EQ+Pan)'
                  : "Bird's Eye View (Depth+Pan)"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Interactive Sound Bubbles Container */}
        <div className="relative flex-1 w-full h-full overflow-hidden pointer-events-auto">
        {bubbles.map((bubble) => {
          const isSelected = currentSelectedIds.includes(bubble.id);
          const isMoving = dragState?.bubbleIds.includes(bubble.id);
          const { x, y, scale, blur, depthOpacity, z } = getScreenCoords(bubble);

          const isActiveOnTimeline = isBubbleActiveOnTimeline(bubble);
          const isMuted = bubble.mute;
          const isDimmed = !isActiveOnTimeline || isMuted || (anySolo && !bubble.solo);
          const freqGuidance = getFrequencyAssessment(bubble);

          // Physical dimensions & Volume scaling:
          // Default size of newly added instrument is 90px wide by 70px tall.
          // 100% volume level/size standard is 240px wide by 200px tall (0% Z Foreground).
          // Max physical dimension is 600px wide and 300px tall.
          const volFactor = 0.5 + (bubble.volume / 100) * 0.5;
          const perspectiveMult = viewMode === 'front' ? 1 : scale;
          const bubbleW = Math.min(600, Math.max(20, bubble.width * volFactor * perspectiveMult));
          const saturationStretch = 1 + (bubble.saturation / 100) * 0.25;
          const bubbleH = Math.min(300, Math.max(20, bubble.height * volFactor * perspectiveMult * saturationStretch));

          // Reverb atmospheric blooms (tuned 25% less dramatic)
          const haloSpread = (bubble.reverb / 100) * 64 * perspectiveMult;
          const outerHaloSpread = (bubble.reverb / 100) * 112 * perspectiveMult;

          // Compression ring thickness: at 0% compression, NO outline around the bubble.
          // As compression increases, the boundary solidifies into a firm bounding ceiling (1px to 4px).
          const compressionBorder = bubble.compression <= 0 ? 0 : Math.max(1, Math.round((bubble.compression / 100) * 4));
          const coreOpacity = 0.35 + (bubble.compression / 100) * 0.22;

          // Dynamic Filters: Spikey TV Static Glitch & Fluid Water Reverb
          const hasDistortion = bubble.saturation > 5;
          const hasReverb = bubble.reverb > 5;
          let bodyFilter: string | undefined = undefined;
          if (hasDistortion && hasReverb) {
            bodyFilter = `url(#combined-filter-${bubble.id})`;
          } else if (hasDistortion) {
            bodyFilter = `url(#tv-static-filter-${bubble.id})`;
          } else if (hasReverb) {
            bodyFilter = `url(#water-liquid-filter-${bubble.id})`;
          }

          return (
            <div
              key={bubble.id}
              id={`bubble-node-${bubble.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (e.shiftKey) {
                  onSelectBubble(bubble.id, true);
                } else {
                  onSelectBubble(bubble.id, false);
                }
              }}
              onPointerDown={(e) => handlePointerDown(e, bubble)}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                cursor: (viewMode === 'front' || viewMode === 'top') && !readOnly ? 'grab' : 'pointer',
                opacity: isDimmed ? 0.22 : depthOpacity,
                filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
                transition: isMoving ? 'none' : 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s, transform 0.2s',
                zIndex: isSelected ? 40 : Math.round(100 - z),
              }}
              className="group select-none"
            >
              {/* Reverb Multi-Layer Volumetric Glow */}
              {bubble.reverb > 5 && (
                <>
                  {/* Layer 1: Wide Cavernous Atmospheric Wash */}
                  <div
                    className="absolute rounded-full pointer-events-none transition-all duration-300"
                    style={{
                      left: `${-outerHaloSpread}px`,
                      top: `${-outerHaloSpread}px`,
                      width: `${bubbleW + outerHaloSpread * 2}px`,
                      height: `${bubbleH + outerHaloSpread * 2}px`,
                      background: theme === 'light'
                        ? `radial-gradient(circle, ${bubble.color}7c 0%, ${bubble.color}3a 45%, ${bubble.color}00 75%)`
                        : `radial-gradient(circle, ${bubble.color}3c 0%, ${bubble.color}18 45%, ${bubble.color}00 75%)`,
                      filter: 'blur(21px)',
                    }}
                  />
                  {/* Layer 2: Radiant Inner Corona Bloom */}
                  <div
                    className="absolute rounded-full pointer-events-none transition-all duration-300"
                    style={{
                      left: `${-haloSpread}px`,
                      top: `${-haloSpread}px`,
                      width: `${bubbleW + haloSpread * 2}px`,
                      height: `${bubbleH + haloSpread * 2}px`,
                      background: theme === 'light'
                        ? `radial-gradient(circle, ${bubble.color}aa 0%, ${bubble.color}55 40%, ${bubble.color}00 75%)`
                        : `radial-gradient(circle, ${bubble.color}6c 0%, ${bubble.color}35 40%, ${bubble.color}00 75%)`,
                      filter: 'blur(9px)',
                    }}
                  />
                </>
              )}

              {/* Main Sphere Outer Container (NO distortion filter applied here, so handles and text stay intact) */}
              <div
                className={`relative rounded-full flex flex-col items-center justify-center ${
                  isSelected
                    ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950/70 shadow-[0_0_24px_rgba(99,102,241,0.65)]'
                    : 'shadow-md hover:shadow-lg'
                }`}
                style={{
                  width: `${bubbleW}px`,
                  height: `${bubbleH}px`,
                  transition: isMoving ? 'none' : 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow:
                    bubble.reverb > 5
                      ? theme === 'light'
                        ? `0 0 ${(bubble.reverb / 100) * 32}px ${bubble.color}, 0 4px 18px rgba(15,23,42,0.3)`
                        : `0 0 ${(bubble.reverb / 100) * 26}px ${bubble.color}, 0 0 ${(bubble.reverb / 100) * 56}px ${bubble.color}66`
                      : undefined,
                }}
              >
                {/* 1. Filtered Inner Sphere Body: Rock-solid core body with crisp borders and zero distortion blur */}
                <div
                  className="absolute inset-0 rounded-full transition-all pointer-events-none overflow-hidden"
                  style={{
                    backgroundColor: bubble.color,
                    opacity: 1,
                    border: compressionBorder > 0
                      ? `${compressionBorder}px solid ${theme === 'light' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)'}`
                      : 'none',
                    boxShadow: theme === 'light'
                      ? `inset 0 0 20px rgba(0,0,0,0.35), 0 6px 20px -4px rgba(15,23,42,0.25)`
                      : `inset 0 0 20px rgba(0,0,0,0.45), 0 6px 20px -4px ${bubble.color}66`,
                  }}
                >
                  {/* Internal Light Sheen (crisp core sheen) */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 42%, rgba(0,0,0,0.25) 100%)',
                    }}
                  />

                  {/* TV Static CRT Scanlines & Grain Texture */}
                  {bubble.saturation > 6 && (
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none overflow-hidden mix-blend-screen"
                      style={{
                        opacity: Math.min(0.85, 0.2 + (bubble.saturation / 100) * 0.65),
                        animation: 'glitch-flicker 0.18s infinite',
                        backgroundImage: theme === 'light'
                          ? `
                            repeating-linear-gradient(0deg, transparent, transparent 1.5px, rgba(15,23,42,0.55) 2.5px, transparent 3.5px),
                            radial-gradient(circle, rgba(147,51,234,0.35) 15%, transparent 75%)
                          `
                          : `
                            repeating-linear-gradient(0deg, transparent, transparent 1.5px, rgba(255,255,255,0.55) 2.5px, transparent 3.5px),
                            radial-gradient(circle, rgba(0,240,255,0.4) 15%, transparent 75%)
                          `,
                        backgroundSize: '100% 3px, 100% 100%',
                      }}
                    />
                  )}

                  {/* Authentic TV Static Noise & Needle Grain Displacement Field */}
                  {bubble.saturation > 10 && (
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none overflow-hidden mix-blend-screen"
                      style={{
                        opacity: Math.min(0.8, 0.15 + (bubble.saturation / 100) * 0.65),
                        filter: `url(#tv-static-filter-${bubble.id})`,
                      }}
                    >
                      <div
                        className="w-full h-full"
                        style={{
                          background: theme === 'light'
                            ? `radial-gradient(ellipse at 50% 50%, rgba(15,23,42,0.6) 0%, rgba(147,51,234,0.45) 50%, rgba(2,132,199,0.3) 100%)`
                            : `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.7) 0%, rgba(0,240,255,0.5) 50%, rgba(255,0,128,0.35) 100%)`,
                        }}
                      />
                    </div>
                  )}

                  {/* TV Static Needle Grain & Electric Fuzz Contour (strictly contained in bubble) */}
                  {bubble.saturation > 15 && (
                    <div
                      className="absolute inset-1 rounded-full pointer-events-none overflow-hidden mix-blend-screen"
                      style={{
                        filter: `url(#tv-static-filter-${bubble.id})`,
                        opacity: Math.min(0.85, 0.2 + (bubble.saturation / 100) * 0.65),
                      }}
                    >
                      <div
                        className={`w-full h-full rounded-full border-2 border-dashed ${
                          theme === 'light' ? 'border-purple-600/80' : 'border-cyan-300/85'
                        }`}
                      />
                    </div>
                  )}
                  {bubble.saturation > 45 && (
                    <div
                      className="absolute inset-2 rounded-full pointer-events-none overflow-hidden mix-blend-screen"
                      style={{
                        filter: `url(#tv-static-filter-${bubble.id})`,
                        opacity: Math.min(0.8, 0.2 + (bubble.saturation / 100) * 0.6),
                      }}
                    >
                      <div
                        className={`w-full h-full rounded-full border border-dotted ${
                          theme === 'light' ? 'border-fuchsia-700/80' : 'border-amber-300/80'
                        }`}
                      />
                    </div>
                  )}

                  {/* CRT Vintage TV Static Snow Noise Texture */}
                  {bubble.saturation > 20 && (
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none overflow-hidden mix-blend-overlay"
                      style={{
                        opacity: Math.min(0.65, 0.12 + (bubble.saturation / 100) * 0.55),
                        backgroundImage: `
                          radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%),
                          repeating-radial-gradient(circle at 25% 35%, rgba(255,255,255,0.2) 0px, transparent 1.5px, rgba(0,0,0,0.2) 2.5px, transparent 3.5px)
                        `,
                        backgroundSize: '100% 100%, 6px 6px',
                        animation: 'glitch-flicker 0.14s infinite steps(2)',
                      }}
                    />
                  )}
                </div>

                {/* Digital Glitch Tearing Bars (Starting at 60% Saturation, subtly ramping up within bubble bounds) */}
                {bubble.saturation >= 60 && (
                  <GlitchTearingBars
                    saturation={bubble.saturation}
                    theme={theme}
                  />
                )}

                {/* 2. Bubble Label Text & Instrument Icon (Layered strictly on top of all glitch effects) */}
                <div className="relative z-20 px-1 text-center pointer-events-none flex flex-col items-center justify-center max-w-[85%]">
                  {bubbleH >= 70 && bubbleW >= 75 && (
                    <div className="mb-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] flex items-center justify-center">
                      {getInstrumentIconComponent(bubble.category, bubble.name, "w-4 h-4")}
                    </div>
                  )}
                  <span
                    className="font-mono tracking-wider uppercase font-extrabold text-white leading-tight whitespace-normal break-words text-center px-1.5 py-0.5 select-none rounded-[3px] bg-zinc-950 border border-zinc-700/90 shadow-[0_2px_6px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.25)]"
                    style={{
                      fontSize: `${Math.max(8, Math.min(11, bubbleW * 0.095))}px`,
                      textShadow: '0 1px 0px rgba(255,255,255,0.85), 0 -1px 0px rgba(0,0,0,0.95), 1px 0 0 rgba(255,255,255,0.3), -1px 0 0 rgba(0,0,0,0.8), 0 0 1.5px rgba(255,255,255,0.4)',
                    }}
                  >
                    {bubble.name.toUpperCase().split(' ').map((word, wordIndex) => (
                      <span key={wordIndex} className="inline-block whitespace-nowrap mr-1">
                        {word.split('').map((char, charIndex) => {
                          const globalIdx = wordIndex * 10 + charIndex;
                          const seed = (bubble.id.charCodeAt(0) * 19 + globalIdx * 37) % 100;
                          const yOffset = ((seed % 3) - 1) * 0.25;
                          const rotation = ((seed * 7) % 5) - 2;
                          const scaleVar = 0.94 + ((seed * 11) % 12) / 100;
                          return (
                            <span
                              key={charIndex}
                              className="inline-block transition-none"
                              style={{
                                transform: `translateY(${yOffset}px) rotate(${rotation}deg) scale(${scaleVar})`,
                                display: 'inline-block',
                              }}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </span>
                    ))}
                  </span>
                </div>

                {/* Multi-selection Check Indicator */}
                {isSelected && currentSelectedIds.length > 1 && (
                  <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md ring-1 ring-white z-30">
                    ✓
                  </div>
                )}

                {/* Automatic Assessment Guidance "!" Error Icon */}
                {freqGuidance && (
                  <div
                    title={`${freqGuidance.title}: ${freqGuidance.message}\nRecommendation: ${freqGuidance.recommendation}`}
                    className={`absolute -top-1.5 ${
                      isSelected && currentSelectedIds.length > 1 ? 'left-3.5' : '-left-1.5'
                    } w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg ring-1.5 ring-white text-[10px] font-black z-30 animate-pulse cursor-help pointer-events-auto`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBubble(bubble.id, false);
                    }}
                  >
                    !
                  </div>
                )}

                {/* Track Notes Badge */}
                {bubble.notes && bubble.notes.trim().length > 0 && (
                  <div
                    title={`Track Notes: ${bubble.notes}`}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md ring-1 ring-white text-[9px] font-bold z-20 pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBubble(bubble.id, false);
                    }}
                  >
                    <FileText className="w-2.5 h-2.5" />
                  </div>
                )}

                {/* Solo / Mute Pin on Sphere for Quick Toggling */}
                {(onToggleSolo || onToggleMute) && (
                  <div className="absolute -bottom-2 flex items-center gap-1 z-20 opacity-80 group-hover:opacity-100 transition-opacity">
                    {onToggleSolo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSolo(bubble.id);
                        }}
                        title={bubble.solo ? 'Unsolo track' : 'Solo track'}
                        className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-colors shadow-sm ${
                          bubble.solo
                            ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-200'
                            : 'bg-slate-900/90 text-slate-300 hover:bg-amber-500/80 hover:text-black'
                        }`}
                      >
                        S
                      </button>
                    )}
                    {onToggleMute && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMute(bubble.id);
                        }}
                        title={bubble.mute ? 'Unmute track' : 'Mute track'}
                        className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-colors shadow-sm ${
                          bubble.mute
                            ? 'bg-red-500 text-white ring-1 ring-red-300'
                            : 'bg-slate-900/90 text-slate-300 hover:bg-red-500/80 hover:text-white'
                        }`}
                      >
                        M
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bounding Node Resize Handles (Only shown in Front View for single selection) */}
              {isSelected && currentSelectedIds.length <= 1 && viewMode === 'front' && !readOnly && (
                <>
                  {/* Left Handle (Width Stretch up to 300px) */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, bubble, 'left')}
                    title="Stretch Stereo Spread (Left)"
                    className="absolute top-1/2 -left-3 -translate-y-1/2 w-2.5 h-6 bg-white hover:bg-indigo-300 rounded-sm shadow-md cursor-ew-resize border border-slate-700 z-30"
                  />
                  {/* Right Handle (Width Stretch up to 300px) */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, bubble, 'right')}
                    title="Stretch Stereo Spread (Right)"
                    className="absolute top-1/2 -right-3 -translate-y-1/2 w-2.5 h-6 bg-white hover:bg-indigo-300 rounded-sm shadow-md cursor-ew-resize border border-slate-700 z-30"
                  />
                  {/* Top Handle (Height Stretch up to 300px) */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, bubble, 'top')}
                    title="Stretch Frequency Bandwidth (Upward)"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-white hover:bg-indigo-300 rounded-sm shadow-md cursor-ns-resize border border-slate-700 z-30"
                  />
                  {/* Bottom Handle (Height Stretch up to 300px) */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, bubble, 'bottom')}
                    title="Stretch Frequency Bandwidth (Downward)"
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-white hover:bg-indigo-300 rounded-sm shadow-md cursor-ns-resize border border-slate-700 z-30"
                  />
                </>
              )}
            </div>
          );
        })}

        {/* Marquee Selection Rectangle Overlay */}
        {marqueeState &&
          Math.hypot(marqueeState.currentX - marqueeState.startX, marqueeState.currentY - marqueeState.startY) > 5 &&
          containerRef.current && (() => {
            const rect = containerRef.current.getBoundingClientRect();
            const left = Math.min(marqueeState.startX, marqueeState.currentX) - rect.left;
            const top = Math.min(marqueeState.startY, marqueeState.currentY) - rect.top;
            const width = Math.abs(marqueeState.currentX - marqueeState.startX);
            const height = Math.abs(marqueeState.currentY - marqueeState.startY);

            return (
              <div
                className="absolute pointer-events-none z-50 border border-indigo-400 bg-indigo-500/15 rounded-sm"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  boxShadow: '0 0 12px rgba(99, 102, 241, 0.35)',
                }}
              >
                <div className="absolute top-1 left-1.5 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-mono rounded shadow">
                  {currentSelectedIds.length} selected
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
