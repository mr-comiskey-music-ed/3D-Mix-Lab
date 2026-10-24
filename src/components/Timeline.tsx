import React, { useRef, useState } from 'react';
import { SoundBubble, TimelineRegion, ThemeMode } from '../types';
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Clock,
  Layers,
  Split
} from 'lucide-react';

interface TimelineProps {
  bubbles: SoundBubble[];
  selectedId: string | null;
  selectedRegion?: { bubbleId: string; regionId: string } | null;
  onSelectBubble: (id: string | null) => void;
  onSelectRegion?: (target: { bubbleId: string; regionId: string } | null) => void;
  onRequestDeleteRegion?: (bubble: SoundBubble, region: TimelineRegion) => void;
  onUpdateBubble: (updated: SoundBubble) => void;
  onAddBubble?: (template: any) => void;
  currentTime: number;
  songDuration: number;
  onSeek: (seconds: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  theme?: ThemeMode;
}

export const Timeline: React.FC<TimelineProps> = ({
  bubbles,
  selectedId,
  selectedRegion,
  onSelectBubble,
  onSelectRegion,
  onRequestDeleteRegion,
  onUpdateBubble,
  onAddBubble,
  currentTime,
  songDuration,
  onSeek,
  isOpen,
  onToggleOpen,
  theme = 'dark',
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  // Track names and lanes are separate columns; keep their scroll positions locked together.
  const namesRef = useRef<HTMLDivElement>(null);
  const lanesRef = useRef<HTMLDivElement>(null);
  const syncScroll = (from: React.RefObject<HTMLDivElement>, to: React.RefObject<HTMLDivElement>) => {
    if (from.current && to.current && to.current.scrollTop !== from.current.scrollTop) {
      to.current.scrollTop = from.current.scrollTop;
    }
  };
  const [dragRegion, setDragRegion] = useState<{
    bubbleId: string;
    regionId: string;
    startX: number;
    initialStart: number;
    initialEnd: number;
    isAltDuplicate?: boolean;
    mode: 'move' | 'resize-left' | 'resize-right';
  } | null>(null);

  const safeDuration = songDuration && songDuration > 0 ? songDuration : 210;

  React.useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragRegion || !rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const deltaPx = e.clientX - dragRegion.startX;
      const deltaSec = (deltaPx / rect.width) * safeDuration;

      const bubble = bubbles.find((b) => b.id === dragRegion.bubbleId);
      if (!bubble) return;

      const currentRegions = Array.isArray(bubble.regions) ? bubble.regions : [];
      const updatedRegions = currentRegions.map((r) => {
        if (r.id !== dragRegion.regionId) return r;

        let newStart = r.start;
        let newEnd = r.end;

        if (dragRegion.mode === 'move') {
          const dur = dragRegion.initialEnd - dragRegion.initialStart;
          newStart = Math.max(0, Math.min(safeDuration - dur, dragRegion.initialStart + deltaSec));
          newEnd = newStart + dur;
        } else if (dragRegion.mode === 'resize-left') {
          newStart = Math.max(0, Math.min(r.end - 2, dragRegion.initialStart + deltaSec));
        } else if (dragRegion.mode === 'resize-right') {
          newEnd = Math.max(r.start + 2, Math.min(safeDuration, dragRegion.initialEnd + deltaSec));
        }

        return {
          ...r,
          start: Math.round(newStart * 10) / 10,
          end: Math.round(newEnd * 10) / 10,
        };
      });

      onUpdateBubble({
        ...bubble,
        regions: updatedRegions,
      });
    };

    const handleUp = () => {
      setDragRegion(null);
    };

    if (dragRegion) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragRegion, bubbles, safeDuration, onUpdateBubble]);

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * safeDuration);
  };

  const handleAddRegion = (bubble: SoundBubble) => {
    const newId = 'r_' + Date.now().toString(36);
    // Add 30s block centered around current time
    const start = Math.max(0, Math.round(currentTime));
    const end = Math.min(safeDuration, start + 30);
    const newRegion: TimelineRegion = { id: newId, start, end };
    const currentRegions = Array.isArray(bubble.regions) ? bubble.regions : [];
    onUpdateBubble({
      ...bubble,
      regions: [...currentRegions, newRegion],
    });
  };

  const handleDeleteRegion = (bubble: SoundBubble, region: TimelineRegion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestDeleteRegion) {
      onRequestDeleteRegion(bubble, region);
    } else {
      const currentRegions = Array.isArray(bubble.regions) ? bubble.regions : [];
      onUpdateBubble({
        ...bubble,
        regions: currentRegions.filter((r) => r.id !== region.id),
      });
    }
  };

  const handlePointerDownRegion = (
    e: React.PointerEvent,
    bubble: SoundBubble,
    region: TimelineRegion,
    mode: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation();
    onSelectBubble(bubble.id);
    onSelectRegion?.({ bubbleId: bubble.id, regionId: region.id });

    const isAlt = e.altKey;
    if (isAlt && mode === 'move') {
      // Duplicate region
      const dupId = 'r_' + Date.now().toString(36);
      const dupRegion: TimelineRegion = {
        id: dupId,
        start: region.start + 15,
        end: Math.min(safeDuration, region.end + 15),
      };
      const currentRegions = Array.isArray(bubble.regions) ? bubble.regions : [];
      onUpdateBubble({
        ...bubble,
        regions: [...currentRegions, dupRegion],
      });
      return;
    }

    setDragRegion({
      bubbleId: bubble.id,
      regionId: region.id,
      startX: e.clientX,
      initialStart: region.start,
      initialEnd: region.end,
      mode,
    });
  };

  const handleDropFromPalette = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw && onAddBubble) {
        const item = JSON.parse(raw);
        if (item && item.name) {
          onAddBubble(item);
        }
      }
    } catch (err) {
      console.error('Failed to parse dropped palette item', err);
    }
  };

  if (!isOpen) {
    return (
      <div
        id="arrangement-timeline-drawer"
        onClick={onToggleOpen}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropFromPalette}
        title="Click to open Arrangement Timeline"
        className={`w-full border-t px-4 py-1.5 flex items-center justify-between z-20 select-none transition-colors cursor-pointer group ${
          theme === 'light'
            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-950/95 hover:bg-slate-900 border-slate-800/80 text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Layers className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
          <span className={`text-[11px] font-mono font-medium ${theme === 'light' ? 'text-slate-700 group-hover:text-slate-900' : 'text-slate-300 group-hover:text-white'}`}>Arrangement Timeline</span>
          <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>({bubbles.length} Tracks)</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleOpen();
          }}
          className={`text-xs flex items-center gap-1 font-semibold py-0.5 px-2 rounded transition ${
            theme === 'light' ? 'text-indigo-600 hover:text-indigo-800 hover:bg-slate-100' : 'text-indigo-400 hover:text-indigo-200 hover:bg-slate-800'
          }`}
        >
          <span>Open Timeline</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const playheadPct = Math.max(0, Math.min(100, (currentTime / safeDuration) * 100));

  return (
    <div
      id="arrangement-timeline-drawer"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropFromPalette}
      className={`w-full border-t flex flex-col shrink-0 h-48 z-20 backdrop-blur select-none transition-all ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950/95 border-slate-800 text-slate-100'
      }`}
    >
      {/* Drawer Bar Header */}
      <div className={`h-8 border-b px-4 flex items-center justify-between text-xs shrink-0 ${
        theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-900/60 border-slate-800 text-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 font-bold text-[11px] ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Arrangement Timeline</span>
          </div>
          <span className={`text-[10px] font-mono hidden sm:inline ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Drag/resize colored blocks to arrange when instruments enter and drop out | Alt+Drag duplicates region
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleOpen}
            className={`p-1 rounded transition ${theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Track Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Names Column */}
        <div className={`w-44 border-r shrink-0 overflow-hidden flex flex-col ${
          theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-slate-800/80 bg-slate-950/80'
        }`}>
          {/* Header spacer */}
          <div className={`h-6 border-b px-2 flex items-center justify-between text-[10px] font-mono uppercase ${
            theme === 'light' ? 'border-slate-200 text-slate-500 bg-slate-100' : 'border-slate-800 text-slate-500 bg-slate-900/50'
          }`}>
            <span>Track Name</span>
            <span>Add</span>
          </div>
          {/* Names scroll together with the lanes (see syncScroll) so every row lines up */}
          <div
            ref={namesRef}
            onScroll={() => syncScroll(namesRef, lanesRef)}
            className="flex-1 overflow-y-auto no-scrollbar"
          >
          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              onClick={() => {
                onSelectBubble(bubble.id);
                onSelectRegion?.(null);
              }}
              className={`h-7 px-2 border-b border-slate-800/40 flex items-center justify-between text-xs cursor-pointer transition ${
                selectedId === bubble.id
                  ? 'bg-indigo-950/40 text-white font-semibold'
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: bubble.color }}
                />
                <span className="truncate text-[11px]">{bubble.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddRegion(bubble);
                }}
                title="Add region block"
                className="w-4 h-4 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 flex items-center justify-center text-[10px] transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))}
          </div>
        </div>

        {/* Right Timeline Canvas (Ruler + Tracks Lanes) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Time Ruler */}
          <div
            ref={rulerRef}
            onClick={handleRulerClick}
            className="h-6 border-b border-slate-800 bg-slate-900/40 cursor-pointer relative flex items-center text-[9px] font-mono text-slate-500 shrink-0"
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const sec = Math.round((i / 7) * safeDuration);
              return (
                <div
                  key={i}
                  className="absolute -translate-x-1/2 border-l border-slate-700 h-3 flex items-end pl-1"
                  style={{ left: `${(i / 7) * 100}%` }}
                >
                  {formatSeconds(sec)}
                </div>
              );
            })}
          </div>

          {/* Tracks Lanes Container */}
          <div
            ref={lanesRef}
            onScroll={() => syncScroll(lanesRef, namesRef)}
            className="flex-1 overflow-y-auto relative"
          >
            {/* Live Playhead Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              style={{ left: `${playheadPct}%` }}
            >
              <div className="w-2.5 h-2.5 bg-rose-500 -translate-x-1/2 rotate-45 -mt-1 shadow-sm" />
            </div>

            {bubbles.map((bubble) => {
              const regions = Array.isArray(bubble.regions) ? bubble.regions : [];
              return (
                <div
                  key={bubble.id}
                  onClick={() => onSelectRegion?.(null)}
                  className={`h-7 border-b border-slate-800/40 relative flex items-center ${
                    selectedId === bubble.id ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Horizontal Region Blocks */}
                  {regions.map((region) => {
                    const leftPct = (region.start / safeDuration) * 100;
                    const widthPct = ((region.end - region.start) / safeDuration) * 100;
                    const isActiveNow = currentTime >= region.start && currentTime <= region.end;
                    const isRegionSelected =
                      selectedRegion?.bubbleId === bubble.id && selectedRegion?.regionId === region.id;

                    return (
                      <div
                        key={region.id}
                        onPointerDown={(e) => handlePointerDownRegion(e, bubble, region, 'move')}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          backgroundColor: bubble.color,
                        }}
                        className={`absolute top-1 bottom-1 rounded-md px-1.5 flex items-center justify-between text-[10px] font-semibold text-white cursor-move group select-none shadow-md transition-all ${
                          isRegionSelected
                            ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 shadow-[0_0_12px_rgba(255,255,255,0.7)] z-20 opacity-100 border border-white'
                            : isActiveNow
                            ? 'ring-1 ring-white/80 opacity-100 border border-white/30 z-10'
                            : 'opacity-75 hover:opacity-95 border border-white/20'
                        }`}
                      >
                        {/* Left Resize Handle */}
                        <div
                          onPointerDown={(e) => handlePointerDownRegion(e, bubble, region, 'resize-left')}
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l"
                        />

                        <span className="truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {bubble.name}
                        </span>

                        <button
                          onClick={(e) => handleDeleteRegion(bubble, region, e)}
                          title="Delete arrangement region"
                          className={`text-white/90 hover:text-white ml-1 p-0.5 rounded hover:bg-black/30 transition ${
                            isRegionSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>

                        {/* Right Resize Handle */}
                        <div
                          onPointerDown={(e) => handlePointerDownRegion(e, bubble, region, 'resize-right')}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-r"
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
