import React from 'react';
import { memoIgnoringCallbacks } from '../utils/memo';
import { SoundBubble, ThemeMode } from '../types';
import { getInstrumentIconComponent } from '../utils/instrumentIcons';
import {
  ChevronRight,
  ChevronLeft,
  Sliders,
  Trash2,
  Copy,
  Layers,
  Volume2,
  VolumeX,
  Radio,
  Maximize2,
  AlertTriangle,
} from 'lucide-react';
import { getFrequencyAssessment, getInstrumentTargetRange } from '../utils/frequencyAssessment';
import { bandOfY, formatHz, hzOfY } from '../stage/roomMath';

interface InspectorProps {
  selectedBubble: SoundBubble | null;
  selectedBubbles?: SoundBubble[];
  onUpdateBubble: (bubble: SoundBubble) => void;
  onUpdateBubbles?: (bubbles: SoundBubble[]) => void;
  onDuplicateBubble: (id: string) => void;
  onDuplicateBubbles?: (ids: string[]) => void;
  onDeleteBubble: (id: string) => void;
  onDeleteBubbles?: (ids: string[]) => void;
  onSelectBubble?: (id: string | null) => void;
  onSelectMultiple?: (ids: string[]) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  theme?: ThemeMode;
}

const PRESET_COLORS = [
  '#ef4444', // Red (Drums)
  '#f59e0b', // Amber (Bass)
  '#10b981', // Emerald (Guitars/Acoustic)
  '#06b6d4', // Cyan (Lead Vocals)
  '#6366f1', // Indigo (Backing Vocals)
  '#8b5cf6', // Violet (Keyboards/Synths)
  '#ec4899', // Pink (FX/Textures)
  '#64748b', // Slate
];

const InspectorInner: React.FC<InspectorProps> = ({
  selectedBubble,
  selectedBubbles = [],
  onUpdateBubble,
  onUpdateBubbles,
  onDuplicateBubble,
  onDuplicateBubbles,
  onDeleteBubble,
  onDeleteBubbles,
  onSelectMultiple,
  isOpen,
  onToggleOpen,
  theme = 'dark',
}) => {
  // Hooks must run on every render, so this lives above the early returns below.
  const batchStartRef = React.useRef<{ prop: string; startSliderVal: number; startMap: Map<string, number> } | null>(null);

  if (!isOpen) {
    return (
      <button
        id="btn-open-inspector"
        onClick={onToggleOpen}
        title="Open Instrument Inspector"
        className={`absolute right-0 top-16 z-20 border-l border-y p-2 rounded-l-xl shadow-xl flex items-center gap-1.5 text-xs font-semibold backdrop-blur transition-colors ${
          theme === 'light'
            ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <Sliders className="w-3.5 h-3.5 text-indigo-500" />
        <span className="hidden sm:inline">Inspector</span>
      </button>
    );
  }

  // Multi-Track Batch Inspector Mode
  if (selectedBubbles && selectedBubbles.length > 1) {
    const count = selectedBubbles.length;
    const allMuted = selectedBubbles.every((b) => b.mute);
    const allSolo = selectedBubbles.every((b) => b.solo);

    // Compute average values for batch sliders
    const avgVol = Math.round(selectedBubbles.reduce((s, b) => s + b.volume, 0) / count);
    const avgPan = Math.round(selectedBubbles.reduce((s, b) => s + b.x, 0) / count);
    const avgFreq = Math.round(selectedBubbles.reduce((s, b) => s + b.y, 0) / count);
    const avgReverb = Math.round(selectedBubbles.reduce((s, b) => s + b.reverb, 0) / count);
    const avgSat = Math.round(selectedBubbles.reduce((s, b) => s + b.saturation, 0) / count);
    const avgComp = Math.round(selectedBubbles.reduce((s, b) => s + b.compression, 0) / count);
    const avgWidth = Math.round(selectedBubbles.reduce((s, b) => s + b.width, 0) / count);
    const avgHeight = Math.round(selectedBubbles.reduce((s, b) => s + b.height, 0) / count);

    const handleBatchUpdate = (updater: (b: SoundBubble) => SoundBubble) => {
      const updated = selectedBubbles.map(updater);
      if (onUpdateBubbles) {
        onUpdateBubbles(updated);
      } else {
        updated.forEach((b) => onUpdateBubble(b));
      }
    };


    const handleBatchSliderStart = (prop: string, currentSliderVal: number) => {
      batchStartRef.current = {
        prop,
        startSliderVal: currentSliderVal,
        startMap: new Map(selectedBubbles.map((b) => [b.id, Number(b[prop as keyof SoundBubble]) || 0])),
      };
    };

    const handleBatchSliderChange = (
      prop: string,
      newSliderVal: number,
      min: number,
      max: number,
      customUpdater?: (b: SoundBubble, startVal: number, delta: number) => SoundBubble
    ) => {
      if (!batchStartRef.current || batchStartRef.current.prop !== prop) {
        batchStartRef.current = {
          prop,
          startSliderVal: newSliderVal,
          startMap: new Map(selectedBubbles.map((b) => [b.id, Number(b[prop as keyof SoundBubble]) || 0])),
        };
      }
      const { startSliderVal, startMap } = batchStartRef.current;
      const delta = newSliderVal - startSliderVal;

      const updated = selectedBubbles.map((b) => {
        const startVal = startMap.get(b.id) ?? Number(b[prop as keyof SoundBubble] || 0);
        if (customUpdater) {
          return customUpdater(b, startVal, delta);
        }
        const newVal = Math.max(min, Math.min(max, Math.round(startVal + delta)));
        return { ...b, [prop]: newVal };
      });

      if (onUpdateBubbles) {
        onUpdateBubbles(updated);
      } else {
        updated.forEach((b) => onUpdateBubble(b));
      }
    };

    const handleRemoveFromSelection = (idToRemove: string) => {
      if (onSelectMultiple) {
        onSelectMultiple(selectedBubbles.filter((b) => b.id !== idToRemove).map((b) => b.id));
      }
    };

    return (
      <div
        id="inspector-panel"
        className={`w-80 border-l flex flex-col shrink-0 h-full z-25 backdrop-blur overflow-y-auto ${
          theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950/95 border-slate-800 text-slate-300'
        }`}
      >
        {/* Sticky Header */}
        <div className={`p-3.5 border-b flex items-center justify-between sticky top-0 backdrop-blur z-10 ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/95 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs ${
              theme === 'light' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/50'
            }`}>
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className={`font-bold text-sm flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Batch Inspector
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-mono">
                  {count} tracks
                </span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (onDuplicateBubbles) {
                  onDuplicateBubbles(selectedBubbles.map((b) => b.id));
                } else {
                  selectedBubbles.forEach((b) => onDuplicateBubble(b.id));
                }
              }}
              title={`Duplicate All ${count} Selected Tracks (Ctrl+D)`}
              className={`p-1 rounded transition-colors ${
                theme === 'light' ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (onDeleteBubbles) {
                  onDeleteBubbles(selectedBubbles.map((b) => b.id));
                } else {
                  selectedBubbles.forEach((b) => onDeleteBubble(b.id));
                }
              }}
              title={`Delete All ${count} Selected Tracks (Delete / Backspace)`}
              className={`p-1 rounded transition-colors ${
                theme === 'light' ? 'hover:bg-red-100 text-slate-600 hover:text-red-600' : 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleOpen}
              className={`p-1 rounded ml-1 transition-colors ${
                theme === 'light' ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Batch Controls Content */}
        <div className="p-4 space-y-5 text-xs">
          {/* Global Master Batch Toggles */}
          <div className={`p-3 rounded-xl border space-y-3 ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider block ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Group Master Control
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchUpdate((b) => ({ ...b, mute: !allMuted }))}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 border transition ${
                  allMuted
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                    : theme === 'light'
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {allMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{allMuted ? 'Unmute All' : 'Mute All'}</span>
              </button>
              <button
                onClick={() => handleBatchUpdate((b) => ({ ...b, solo: !allSolo }))}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 border transition ${
                  allSolo
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : theme === 'light'
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{allSolo ? 'Unsolo All' : 'Solo All'}</span>
              </button>
            </div>
          </div>

          {/* Batch Spatial Sliders */}
          <div className="space-y-3">
            <div className={`flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Group Spatial Adjust (Relative)</span>
              <span className="text-indigo-500">X / Y / Z</span>
            </div>

            {/* Batch Pan X */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Average Stereo Pan</span>
                <span className="font-mono text-indigo-500 font-semibold flex items-center gap-1">
                  {avgPan > 0 ? `+${avgPan} Right` : avgPan < 0 ? `${avgPan} Left` : '0 Center'}
                  {avgPan === 0 && (
                    <span className="text-[9px] px-1 py-0.2 bg-indigo-500/15 text-indigo-400 rounded border border-indigo-500/30 font-sans">
                      Centered
                    </span>
                  )}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="-64"
                  max="64"
                  value={avgPan}
                  onMouseDown={() => handleBatchSliderStart('x', avgPan)}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    const snapped = Math.abs(raw) <= 2 ? 0 : raw;
                    handleBatchSliderChange('x', snapped, -64, 64);
                  }}
                  className={`w-full accent-indigo-500 h-1.5 rounded-lg cursor-pointer relative z-10 ${
                    theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
                  }`}
                />
                {/* Center Detent / Catch-Point Tick Indicator */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[2px] h-3 pointer-events-none rounded-full transition-colors z-0 ${
                    avgPan === 0
                      ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.9)]'
                      : theme === 'light' ? 'bg-slate-400/50' : 'bg-slate-600/70'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>-64 L</span>
                <span className={avgPan === 0 ? 'text-indigo-400 font-bold transition-colors' : ''}>0 C</span>
                <span>+64 R</span>
              </div>
            </div>

            {/* Batch Frequency Y */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Average Frequency Band</span>
                <span className="font-mono text-emerald-500">
                  {avgFreq}% ({avgFreq <= 25 ? 'Low' : avgFreq <= 75 ? 'Mid' : 'High'})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={avgFreq}
                onMouseDown={() => handleBatchSliderStart('y', avgFreq)}
                onChange={(e) => handleBatchSliderChange('y', Number(e.target.value), 0, 100)}
                className={`w-full accent-emerald-500 h-1.5 rounded-lg cursor-pointer ${
                  theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
                }`}
              />
            </div>

            {/* Batch Depth Z */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Average Depth Z / Volume</span>
                <span className="font-mono text-sky-500">
                  {Math.round(selectedBubbles.reduce((s, b) => s + b.z, 0) / count)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(selectedBubbles.reduce((s, b) => s + b.z, 0) / count)}
                onMouseDown={() => handleBatchSliderStart('z', Math.round(selectedBubbles.reduce((s, b) => s + b.z, 0) / count))}
                onChange={(e) => {
                  const newAvgZ = Number(e.target.value);
                  if (!batchStartRef.current || batchStartRef.current.prop !== 'z') {
                    batchStartRef.current = {
                      prop: 'z',
                      startSliderVal: newAvgZ,
                      startMap: new Map(selectedBubbles.map((b) => [b.id, b.z])),
                    };
                  }
                  const { startSliderVal, startMap } = batchStartRef.current;
                  const delta = newAvgZ - startSliderVal;
                  const updated = selectedBubbles.map((b) => {
                    const startVal = startMap.get(b.id) ?? b.z;
                    const newZ = Math.max(0, Math.min(100, Math.round(startVal + delta)));
                    return { ...b, z: newZ, volume: 100 - newZ };
                  });
                  if (onUpdateBubbles) {
                    onUpdateBubbles(updated);
                  } else {
                    updated.forEach((b) => onUpdateBubble(b));
                  }
                }}
                className={`w-full accent-sky-500 h-1.5 rounded-lg cursor-pointer ${
                  theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Batch Effects Section */}
          <div className={`space-y-3 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className={`flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Group Effects & DSP</span>
            </div>

            {/* Batch Saturation */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Average Saturation</span>
                <span className="font-mono text-amber-500">{avgSat}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={avgSat}
                onMouseDown={() => handleBatchSliderStart('saturation', avgSat)}
                onChange={(e) => handleBatchSliderChange('saturation', Number(e.target.value), 0, 100)}
                className={`w-full accent-amber-500 h-1.5 rounded-lg cursor-pointer ${
                  theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
                }`}
              />
            </div>

            {/* Batch Reverb */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Average Reverb</span>
                <span className="font-mono text-purple-500">{avgReverb}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={avgReverb}
                onMouseDown={() => handleBatchSliderStart('reverb', avgReverb)}
                onChange={(e) => handleBatchSliderChange('reverb', Number(e.target.value), 0, 100)}
                className={`w-full accent-purple-500 h-1.5 rounded-lg cursor-pointer ${
                  theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
                }`}
              />
            </div>

            {/* Batch Compression */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Average Compression</span>
                <span className="font-mono text-cyan-500">{avgComp}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={avgComp}
                onMouseDown={() => handleBatchSliderStart('compression', avgComp)}
                onChange={(e) => handleBatchSliderChange('compression', Number(e.target.value), 0, 100)}
                className={`w-full accent-cyan-500 h-1.5 rounded-lg cursor-pointer ${
                  theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Selected Tracks List */}
          <div className={`space-y-2 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
            <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider block ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Selected Tracks in Group ({count})
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {selectedBubbles.map((bubble) => (
                <div
                  key={bubble.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: bubble.color }} />
                    <span className={`font-medium truncate ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                      {bubble.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFromSelection(bubble.id)}
                    title="Remove from selection"
                    className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                      theme === 'light' ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single Track Inspector Mode (No Track Selected)
  if (!selectedBubble) {
    return (
      <div
        id="inspector-panel"
        className={`w-80 border-l flex flex-col shrink-0 h-full z-20 backdrop-blur overflow-y-auto ${
          theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950/95 border-slate-800 text-slate-300'
        }`}
      >
        <div className={`p-3.5 border-b flex items-center justify-between sticky top-0 backdrop-blur z-10 ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <h3 className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Track Inspector</h3>
          </div>
          <button
            onClick={onToggleOpen}
            className={`p-1 rounded transition-colors ${
              theme === 'light' ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-3 ${
            theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <Sliders className="w-5 h-5" />
          </div>
          <p className={`text-xs font-medium mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>No Track Selected</p>
          <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
            Click any sound bubble or click-and-drag a marquee box on the stage to select multiple instruments for bulk positioning, DSP modifiers, and deletion.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = <K extends keyof SoundBubble>(key: K, value: SoundBubble[K]) => {
    onUpdateBubble({
      ...selectedBubble,
      [key]: value,
    });
  };

  return (
    <div
      id="inspector-panel"
      className={`w-80 border-l flex flex-col shrink-0 h-full z-20 backdrop-blur overflow-y-auto ${
        theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950/95 border-slate-800 text-slate-300'
      }`}
    >
      {/* Header */}
      <div className={`p-3.5 border-b flex items-center justify-between sticky top-0 backdrop-blur z-10 ${
        theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-indigo-500 bg-indigo-500/10 border border-indigo-500/30">
            {getInstrumentIconComponent(selectedBubble.category, selectedBubble.name, "w-4 h-4")}
          </div>
          <input
            type="text"
            value={selectedBubble.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`bg-transparent font-bold text-sm border-b border-transparent focus:border-indigo-500 focus:outline-none px-1 py-0.5 ${
              theme === 'light'
                ? 'text-slate-950 hover:border-slate-300'
                : 'text-white hover:border-slate-700'
            }`}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateBubble(selectedBubble.id)}
            title="Duplicate Bubble (Ctrl+D / Alt+Drag)"
            className={`p-1 rounded transition-colors ${
              theme === 'light' ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteBubble(selectedBubble.id)}
            title="Delete Bubble (Delete / Backspace)"
            className={`p-1 rounded transition-colors ${
              theme === 'light' ? 'hover:bg-red-100 text-slate-600 hover:text-red-600' : 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleOpen}
            className={`p-1 rounded ml-1 transition-colors ${
              theme === 'light' ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Automatic Assessment Guidance Notice (Slide 1) */}
        {(() => {
          const freqWarning = getFrequencyAssessment(selectedBubble);
          if (!freqWarning) return null;
          return (
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              theme === 'light'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}>
              <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
                !
              </div>
              <div className="space-y-1">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>{freqWarning.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{freqWarning.message}</p>
                <div className="text-[10px] font-mono font-semibold text-rose-400">
                  Natural Zone: {freqWarning.expectedRange}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3D Coordinates Section */}
        <div className="space-y-3">
          <div className={`flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <span>3D Spatial Coordinates</span>
            <span className="text-indigo-500">X / Y / Z</span>
          </div>

          {/* Pan X */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>X: Stereo Panning</span>
              <span className="font-mono text-indigo-500 font-semibold flex items-center gap-1">
                {selectedBubble.x > 0 ? `+${selectedBubble.x} Right` : selectedBubble.x < 0 ? `${selectedBubble.x} Left` : '0 Center'}
                {selectedBubble.x === 0 && (
                  <span className="text-[9px] px-1 py-0.2 bg-indigo-500/15 text-indigo-400 rounded border border-indigo-500/30 font-sans">
                    Centered
                  </span>
                )}
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="range"
                min="-64"
                max="64"
                value={selectedBubble.x}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const snapped = Math.abs(raw) <= 2 ? 0 : raw;
                  handleChange('x', snapped);
                }}
                className={`w-full accent-indigo-500 h-1.5 rounded-lg cursor-pointer relative z-10 ${
                  theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
                }`}
              />
              {/* Center Detent / Catch-Point Tick Indicator */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[2px] h-3 pointer-events-none rounded-full transition-colors z-0 ${
                  selectedBubble.x === 0
                    ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.9)]'
                    : theme === 'light' ? 'bg-slate-400/50' : 'bg-slate-600/70'
                }`}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>-64 L</span>
              <span className={selectedBubble.x === 0 ? 'text-indigo-400 font-bold transition-colors' : ''}>0 C</span>
              <span>+64 R</span>
            </div>
          </div>

          {/* Frequency Y */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Y: Frequency</span>
              <span className="font-mono text-emerald-500 font-semibold">
                {bandOfY(selectedBubble.y).name} · ≈{formatHz(hzOfY(selectedBubble.y))}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedBubble.y}
              onChange={(e) => handleChange('y', Number(e.target.value))}
              className={`w-full accent-emerald-500 h-1.5 rounded-lg cursor-pointer ${
                theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0% Low/Sub</span>
              <span>50% Mid</span>
              <span>100% High/Air</span>
            </div>
            {(() => {
              const target = getInstrumentTargetRange(selectedBubble);
              if (!target) return null;
              const isWithin = selectedBubble.y >= target.min && selectedBubble.y <= target.max;
              return (
                <div
                  className={`flex items-center justify-between text-[10px] px-2 py-1 rounded border transition-colors ${
                    isWithin
                      ? theme === 'light'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : theme === 'light'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  }`}
                >
                  <span className="font-medium truncate mr-1">Guideline ({target.categoryLabel}):</span>
                  <span className="font-mono font-bold shrink-0">{target.formattedRange}</span>
                </div>
              );
            })()}
          </div>

          {/* Depth Z */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Z: Depth in Mix/Volume</span>
              <span className="font-mono text-sky-500">
                {selectedBubble.z <= 20 ? 'Foreground' : selectedBubble.z <= 60 ? 'Midground' : 'Background'} ({selectedBubble.z}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedBubble.z}
              onChange={(e) => {
                const newZ = Number(e.target.value);
                onUpdateBubble({
                  ...selectedBubble,
                  z: newZ,
                  volume: 100 - newZ,
                });
              }}
              className={`w-full accent-sky-500 h-1.5 rounded-lg cursor-pointer ${
                theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0% (Front)</span>
              <span>50% (Mid)</span>
              <span>100% (Far)</span>
            </div>
          </div>
        </div>

        {/* Physical Dimensions */}
        <div className={`space-y-3 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className={`flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <span>Physical Dimensions</span>
            <span className="text-indigo-500">Stretch Handles</span>
          </div>

          {/* Width (Stereo Spread) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Width (Stereo Spread)</span>
              <span className="font-mono text-indigo-500">{selectedBubble.width}px</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              value={selectedBubble.width}
              onChange={(e) => handleChange('width', Number(e.target.value))}
              className={`w-full accent-indigo-500 h-1.5 rounded-lg cursor-pointer ${
                theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            />
            <span className="text-[9px] text-slate-500 block">
              Represents perceived stereo width (default 200px, max 600px)
            </span>
          </div>

          {/* Height (Frequency Span) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Height (Frequency Span)</span>
              <span className="font-mono text-emerald-500">{selectedBubble.height}px</span>
            </div>
            <input
              type="range"
              min="40"
              max="200"
              value={selectedBubble.height}
              onChange={(e) => handleChange('height', Number(e.target.value))}
              className={`w-full accent-emerald-500 h-1.5 rounded-lg cursor-pointer ${
                theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            />
            <span className="text-[9px] text-slate-500 block">
              Represents vertical frequency span (default 150px, max 300px)
            </span>
          </div>
        </div>

        {/* Effect Modifiers */}
        <div className={`space-y-3 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className={`flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <span>Effect Modifiers</span>
          </div>

          {/* Saturation/Distortion */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Saturation/Distortion</span>
              <span className="font-mono text-amber-500">{selectedBubble.saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedBubble.saturation}
              onChange={(e) => handleChange('saturation', Number(e.target.value))}
              className={`w-full accent-amber-500 h-1.5 rounded-lg cursor-pointer ${
                theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            />
          </div>

          {/* Reverb */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Reverb</span>
              <span className="font-mono text-purple-500">{selectedBubble.reverb}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedBubble.reverb}
              onChange={(e) => handleChange('reverb', Number(e.target.value))}
              className={`w-full accent-purple-500 h-1.5 rounded-lg cursor-pointer ${
                theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            />
          </div>

          {/* Compression */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Compression</span>
              <span className="font-mono text-cyan-500">{selectedBubble.compression}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedBubble.compression}
              onChange={(e) => handleChange('compression', Number(e.target.value))}
              className={`w-full accent-cyan-500 h-1.5 rounded-lg cursor-pointer ${
                theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Track Notes */}
        <div className={`space-y-2 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'}`}>
          <div className={`flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <span>Track Notes</span>
          </div>
          <textarea
            value={selectedBubble.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Document your mixing rationale (e.g., '1176 fast attack to tame transients, 250Hz cut to clean mud')..."
            rows={3}
            className={`w-full border rounded-lg p-2.5 text-xs resize-none focus:outline-none focus:border-indigo-500 ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                : 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-600'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

// Redraw only when this panel's data changes (not on every play-clock tick).
export const Inspector = memoIgnoringCallbacks(InspectorInner);
