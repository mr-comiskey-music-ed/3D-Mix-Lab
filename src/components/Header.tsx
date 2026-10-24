import React from 'react';
import { memoIgnoringCallbacks } from '../utils/memo';
import {
  Undo2,
  Redo2,
  Sun,
  Moon,
  GraduationCap,
  Layers,
  Code2,
  Volume2,
  Eye,
  Sliders,
  Box,
} from 'lucide-react';
import { ViewMode, ActiveTab, ThemeMode } from '../types';
import { StudioMonitorsIcon, PaperAirplaneIcon } from '../utils/instrumentIcons';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenTour: () => void;
  onOpenExport: () => void;
  /** Overall challenge progress, 0–100 (checks passed out of all checks). */
  challengePercent: number;
}

const HeaderInner: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  theme,
  setTheme,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenTour,
  onOpenExport,
  challengePercent,
}) => {
  return (
    <header
      id="app-header"
      className={`h-14 border-b px-4 flex items-center justify-between shrink-0 transition-colors z-30 select-none ${
        theme === 'dark'
          ? 'bg-slate-950/95 border-slate-800 text-slate-100 backdrop-blur'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm backdrop-blur'
      }`}
    >
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center font-extrabold text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/20">
          <Volume2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm sm:text-base tracking-tight flex items-center gap-1.5 ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              Visual Mix Lab
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium tracking-wide uppercase bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
              3D Audio
            </span>
          </div>
        </div>
      </div>

      {/* Center Nav Tabs */}
      <div id="nav-tabs" className={`flex items-center gap-1 p-1 rounded-xl border ${
        theme === 'light' ? 'bg-slate-200/90 border-slate-300' : 'bg-slate-900/90 border-slate-800/80'
      }`}>
        <button
          id="tab-sandbox"
          onClick={() => setActiveTab('sandbox')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'sandbox'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
              : theme === 'light'
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Mix Sandbox</span>
        </button>

        <button
          id="tab-challenges"
          onClick={() => setActiveTab('challenges')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 relative ${
            activeTab === 'challenges'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
              : theme === 'light'
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>Challenges</span>
          <span
            title="Checks passed across all challenges"
            className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
          >
            {challengePercent}%
          </span>
        </button>

        <button
          id="tab-examples"
          onClick={() => setActiveTab('examples')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'examples'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
              : theme === 'light'
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Examples</span>
        </button>

        <button
          id="tab-grader"
          onClick={() => setActiveTab('grader')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'grader'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
              : theme === 'light'
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Grade Report</span>
        </button>
      </div>

      {/* Right Controls: View Switcher, Undo/Redo, Theme & Tour */}
      <div className="flex items-center gap-2">
        {/* View Mode Switcher */}
        <div id="view-mode-switcher" className={`hidden md:flex items-center p-0.5 rounded-lg border ${
          theme === 'light' ? 'bg-slate-200/90 border-slate-300' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <button
            id="view-front"
            onClick={() => setViewMode('front')}
            title="Front View - the room from the front: pan (left/right) and frequency (low/high). Drag and resize here."
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'front'
                ? 'bg-indigo-600 text-white shadow-sm'
                : theme === 'light'
                ? 'text-slate-700 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <StudioMonitorsIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Front</span>
          </button>

          <button
            id="view-top"
            onClick={() => setViewMode('top')}
            title="Bird's-Eye View - the room from above: pan (left/right) and depth (front/back). Drag to change depth."
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'top'
                ? 'bg-indigo-600 text-white shadow-sm'
                : theme === 'light'
                ? 'text-slate-700 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PaperAirplaneIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Bird's-Eye</span>
          </button>

          <button
            id="view-3d"
            onClick={() => setViewMode('3d')}
            title="3D View - the whole room from an angle, to see depth. Look only: move sounds in Front or Bird's-Eye."
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === '3d'
                ? 'bg-indigo-600 text-white shadow-sm'
                : theme === 'light'
                ? 'text-slate-700 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5 shrink-0" />
            <span>3D</span>
          </button>
        </div>

        {/* Undo / Redo */}
        <div id="undo-redo-controls" className={`flex items-center p-0.5 rounded-lg border ${
          theme === 'light' ? 'bg-slate-200 border-slate-300' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <button
            id="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z / Cmd+Z)"
            className={`p-1.5 rounded text-xs transition-colors ${
              canUndo
                ? theme === 'light'
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
                : theme === 'light' ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-redo"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
            className={`p-1.5 rounded text-xs transition-colors ${
              canRedo
                ? theme === 'light'
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
                : theme === 'light' ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stage Lights Theme Toggle */}
        <button
          id="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Studio'}
          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
              : 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline font-mono text-[11px]">
            {theme === 'dark' ? 'Light Mode' : 'Dark Studio'}
          </span>
        </button>

        {/* Standalone GAS HTML Export */}
        <button
          id="btn-export-standalone"
          onClick={onOpenExport}
          title="Export Standalone single index.html for Google Apps Script iframe"
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
            theme === 'light'
              ? 'border-slate-300 bg-slate-100 text-indigo-700 hover:bg-slate-200'
              : 'border-slate-800 bg-slate-900 text-indigo-300 hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">GAS HTML</span>
        </button>

        {/* 🎓 Quick Tour */}
        <button
          id="btn-quick-tour"
          onClick={onOpenTour}
          title="Start 5-Step Guided Tour"
          className="px-2.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-400/30"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tour</span>
        </button>
      </div>
    </header>
  );
};

// Redraw only when this panel's data changes (not on every play-clock tick).
export const Header = memoIgnoringCallbacks(HeaderInner);
