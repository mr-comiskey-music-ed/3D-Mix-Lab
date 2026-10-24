import React, { useState, useRef } from 'react';
import { memoIgnoringCallbacks } from '../utils/memo';
import {
  DEFAULT_PALETTE_ITEMS,
  INSTRUMENT_CATEGORIES,
  getDiagramName,
  PaletteItem,
} from '../data/presets';
import { SoundBubble, ThemeMode } from '../types';
import { getInstrumentIconComponent } from '../utils/instrumentIcons';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Music,
  PlusCircle,
  FolderOpen,
  Sparkles,
} from 'lucide-react';

interface PaletteProps {
  onAddBubble: (template: Omit<SoundBubble, 'id' | 'regions'>) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onLoadPresetTemplate: (presetName: string) => void;
  theme?: ThemeMode;
}

const PaletteInner: React.FC<PaletteProps> = ({
  onAddBubble,
  isOpen,
  onToggleOpen,
  onLoadPresetTemplate,
  theme = 'dark',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<SoundBubble['category']>('keys_synth');
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [draggingItem, setDraggingItem] = useState<{
    item: PaletteItem;
    x: number;
    y: number;
  } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  if (!isOpen) {
    return (
      <button
        id="btn-open-palette"
        onClick={onToggleOpen}
        title="Open Instrument Palette"
        className="absolute left-0 top-16 z-20 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-r border-y border-slate-700/80 p-2 rounded-r-xl shadow-xl flex items-center gap-1.5 text-xs font-semibold backdrop-blur"
      >
        <Music className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Palette</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onAddBubble({
      name: getDiagramName(customName.trim()),
      category: customCategory,
      color: customColor,
      x: 0,
      y: 60,
      z: 20,
      width: 120,
      height: 100,
      volume: 80,
      saturation: 0,
      reverb: 0,
      compression: 0,
      notes: '',
    });

    setCustomName('');
    setShowCustomModal(false);
  };

  const handleAddItem = (item: PaletteItem) => {
    onAddBubble({
      ...item,
      name: item.diagramName || getDiagramName(item.name),
      width: 120,
      height: 100,
      saturation: 0,
      reverb: 0,
      compression: 0,
      notes: '',
    });
  };

  const filteredItems = selectedCategory === 'all'
    ? DEFAULT_PALETTE_ITEMS
    : DEFAULT_PALETTE_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <div
      id="palette-panel"
      className={`w-64 border-r flex flex-col shrink-0 h-full z-20 backdrop-blur ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
          : 'bg-slate-950/95 border-slate-800 text-slate-300'
      }`}
    >
      {/* Header */}
      <div className={`px-3 py-2 border-b flex items-center justify-between ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-indigo-500" />
          <h3 className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Instrument Palette</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleOpen}
            className={`p-1 rounded transition ${
              theme === 'light' ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className={`p-2 border-b flex flex-wrap gap-1 text-[11px] ${
        theme === 'light' ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800/80'
      }`}>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-md shrink-0 font-medium transition ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : theme === 'light'
              ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          All
        </button>
        {INSTRUMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2 py-1 rounded-md shrink-0 font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : theme === 'light'
                ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Instrument List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              dragStartPos.current = { x: e.clientX, y: e.clientY };
              isDraggingRef.current = false;

              const handlePointerMove = (moveEvent: PointerEvent) => {
                if (!dragStartPos.current) return;
                const dx = moveEvent.clientX - dragStartPos.current.x;
                const dy = moveEvent.clientY - dragStartPos.current.y;
                if (!isDraggingRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                  isDraggingRef.current = true;
                }
                if (isDraggingRef.current) {
                  setDraggingItem({
                    item,
                    x: moveEvent.clientX,
                    y: moveEvent.clientY,
                  });
                }
              };

              const handlePointerUp = (upEvent: PointerEvent) => {
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);

                if (isDraggingRef.current) {
                  const stageEl = document.getElementById('mix-diagram-stage');
                  if (stageEl) {
                    const rect = stageEl.getBoundingClientRect();
                    const cx = Math.max(rect.left, Math.min(rect.right, upEvent.clientX));
                    const cy = Math.max(rect.top, Math.min(rect.bottom, upEvent.clientY));
                    const padX = 85;
                    const padY = 65;
                    const usableW = Math.max(200, rect.width - padX * 2);
                    const usableH = Math.max(200, rect.height - padY * 2);
                    const dropX = cx - rect.left;
                    const dropY = cy - rect.top;
                    const normX = Math.round(Math.max(-64, Math.min(64, ((dropX - padX) / usableW) * 128 - 64)));
                    const normY = Math.round(Math.max(0, Math.min(100, ((rect.height - padY - dropY) / usableH) * 100)));

                    onAddBubble({
                      ...item,
                      name: item.diagramName || getDiagramName(item.name),
                      x: normX,
                      y: normY,
                      width: 120,
                      height: 100,
                      saturation: 0,
                      reverb: 0,
                      compression: 0,
                      notes: '',
                    });
                  } else {
                    handleAddItem(item);
                  }
                } else {
                  handleAddItem(item);
                }

                dragStartPos.current = null;
                isDraggingRef.current = false;
                setDraggingItem(null);
              };

              window.addEventListener('pointermove', handlePointerMove);
              window.addEventListener('pointerup', handlePointerUp);
            }}
            className={`group p-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition flex items-center justify-between select-none ${
              theme === 'light'
                ? 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-sm text-slate-800'
                : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800/80 hover:border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2 pointer-events-none">
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  color: item.color,
                  backgroundColor: `${item.color}15`,
                  border: `1px solid ${item.color}40`,
                }}
              >
                {getInstrumentIconComponent(item.category, item.name, "w-3.5 h-3.5")}
              </div>
              <div className="min-w-0">
                <h4 className={`font-semibold text-xs transition truncate ${
                  theme === 'light' ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-indigo-300'
                }`}>
                  {item.name}
                </h4>
                <p className={`text-[10px] capitalize truncate ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {INSTRUMENT_CATEGORIES.find((c) => c.id === item.category)?.label || item.category.replace('_', '/')}
                </p>
              </div>
            </div>
            <button
              title={`Add ${item.name} to mix`}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                theme === 'light'
                  ? 'bg-slate-100 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white'
                  : 'bg-slate-800 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Pinned Bottom "Custom" Instrument Option (Always Visible) */}
      <div className={`p-3 border-t shrink-0 ${
        theme === 'light' ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950'
      }`}>
        <button
          id="btn-palette-custom-instrument"
          onClick={() => setShowCustomModal(true)}
          className={`w-full py-2.5 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group ${
            theme === 'light'
              ? 'bg-gradient-to-r from-indigo-50 via-white to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200 text-indigo-900'
              : 'bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 hover:from-indigo-600 hover:via-indigo-500 hover:to-purple-600 border-indigo-500/40 hover:border-indigo-400 text-white'
          }`}
        >
          <PlusCircle className={`w-4 h-4 transition ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400 group-hover:text-white'}`} />
          <span>+ Custom Instrument</span>
        </button>
      </div>

      {/* Custom Instrument Creator Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Add Custom Instrument</span>
            </h3>
            <form onSubmit={handleCreateCustom} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Instrument Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Vintage Wurlitzer, 808 Cowbell..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Acoustic Section</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as SoundBubble['category'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {INSTRUMENT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Sphere Color Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-slate-400 text-[11px]">{customColor}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Add to Diagram</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {draggingItem && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-xl shadow-2xl bg-indigo-600 text-white font-medium text-xs flex items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 border border-white/30 backdrop-blur"
          style={{
            left: draggingItem.x,
            top: draggingItem.y,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Add {draggingItem.item.name}</span>
        </div>
      )}
    </div>
  );
};

// Redraw only when this panel's data changes (not on every play-clock tick).
export const Palette = memoIgnoringCallbacks(PaletteInner);
