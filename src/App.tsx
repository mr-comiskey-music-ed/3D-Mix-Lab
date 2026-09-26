import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SoundBubble,
  TimelineRegion,
  ViewMode,
  ActiveTab,
  ThemeMode
} from './types';
import { INITIAL_SANDBOX_BUBBLES, getDiagramName } from './data/presets';
import { Header } from './components/Header';
import { Stage3D } from './components/Stage3D';
import { Palette } from './components/Palette';
import { Inspector } from './components/Inspector';
import { Timeline } from './components/Timeline';
import { MediaScrubber } from './components/MediaScrubber';
import { ChallengesView } from './components/ChallengesView';
import { ExamplesView } from './components/ExamplesView';
import { GradeReportView } from './components/GradeReportView';
import { QuickTourModal } from './components/QuickTourModal';
import { StandaloneExportModal } from './components/StandaloneExportModal';
import { ConfirmDeleteModal, ConfirmDeleteState } from './components/ConfirmDeleteModal';
import { YouTubeEmbed } from './components/YouTubeEmbed';
import { audioEngine, AudioSourceInfo } from './utils/audioEngine';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('sandbox');
  const [viewMode, setViewMode] = useState<ViewMode>('front');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Modals
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Panels Open/Close
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isYouTubeExpanded, setIsYouTubeExpanded] = useState(false);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [songDuration, setSongDuration] = useState(210); // 3:30 default
  const [audioSource, setAudioSource] = useState<AudioSourceInfo>({
    type: 'none',
    name: null,
    youtubeId: null,
    duration: 210,
  });

  // Challenge Scores (stars earned per challenge)
  const [challengeScores, setChallengeScores] = useState<Record<string, number>>({
    'challenge-1': 0,
    'challenge-2': 0,
    'challenge-3': 0,
    'challenge-4': 0,
    'challenge-5': 0,
  });

  // Sandbox Bubbles & State History (Undo / Redo Stack)
  const [bubbles, setBubbles] = useState<SoundBubble[]>(INITIAL_SANDBOX_BUBBLES);
  const [selectedBubbleIds, setSelectedBubbleIds] = useState<string[]>(['bubble-vocal']);

  const selectedBubbleId = selectedBubbleIds[0] || null;
  const selectedBubbles = bubbles.filter((b) => selectedBubbleIds.includes(b.id));
  const selectedBubble = selectedBubbles[0] || null;

  // Depth Hotkey HUD Toast
  const [hotkeyToast, setHotkeyToast] = useState<{
    key: string;
    z: number;
    volume: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!hotkeyToast) return;
    const t = setTimeout(() => setHotkeyToast(null), 2200);
    return () => clearTimeout(t);
  }, [hotkeyToast]);

  // History Stacks
  const historyRef = useRef<SoundBubble[][]>([INITIAL_SANDBOX_BUBBLES]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistory = useCallback((newBubbles: SoundBubble[]) => {
    // Truncate redo branch
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(JSON.parse(JSON.stringify(newBubbles)));
    // Cap history at 50 steps
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current];
      setBubbles(JSON.parse(JSON.stringify(prev)));
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current];
      setBubbles(JSON.parse(JSON.stringify(next)));
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, []);

  // Sync with audio engine
  useEffect(() => {
    const unsub = audioEngine.subscribe((time, playing, source) => {
      setCurrentTime(time);
      setIsPlaying(playing);
      setAudioSource(source);
      if (source.duration && source.duration > 0 && Math.abs(source.duration - songDuration) > 1) {
        setSongDuration(source.duration);
      }
    });
    return () => unsub();
  }, [songDuration]);

  // Bubble Manipulation Handlers
  const handleUpdateBubble = useCallback(
    (updated: SoundBubble) => {
      setBubbles((prev) => {
        const next = prev.map((b) => (b.id === updated.id ? updated : b));
        updateHistory(next);
        return next;
      });
    },
    [updateHistory]
  );

  const handleUpdateBubbles = useCallback(
    (updatedList: SoundBubble[]) => {
      setBubbles((prev) => {
        const updateMap = new Map(updatedList.map((b) => [b.id, b]));
        const next = prev.map((b) => updateMap.get(b.id) || b);
        updateHistory(next);
        return next;
      });
    },
    [updateHistory]
  );

  const handleAddBubble = useCallback(
    (template: Omit<SoundBubble, 'id' | 'regions'>) => {
      const newId = 'bubble-' + Date.now().toString(36);
      const bubbleName = getDiagramName(template.name) || template.name;
      const newBubble: SoundBubble = {
        x: 0, // Default panned in the middle if not specified
        y: 60, // Default frequency at 60% if not specified
        width: 120, // Default 120px wide
        height: 100, // Default 100px tall
        ...template,
        id: newId,
        name: bubbleName,
        z: 100 - (template.volume !== undefined ? template.volume : 80),
        regions: [{ id: 'r_' + Date.now().toString(36), start: 0, end: songDuration }],
      };
      setBubbles((prev) => {
        const next = [...prev, newBubble];
        updateHistory(next);
        return next;
      });
      setSelectedBubbleIds([newId]);
    },
    [songDuration, updateHistory]
  );

  // Selected Arrangement Timeline Region (when user interacts with a region block)
  const [selectedTimelineRegion, setSelectedTimelineRegion] = useState<{
    bubbleId: string;
    regionId: string;
  } | null>(null);

  // Deletion Confirmation Modal State
  const [deleteConfirmState, setDeleteConfirmState] = useState<ConfirmDeleteState | null>(null);

  const handleDuplicateBubble = useCallback(
    (id: string) => {
      const target = bubbles.find((b) => b.id === id);
      if (!target) return;
      const dupId = 'bubble-' + Date.now().toString(36);
      const dup: SoundBubble = {
        ...target,
        id: dupId,
        name: target.name,
        x: Math.min(100, target.x + 8),
        y: Math.min(100, target.y + 5),
        regions: target.regions.map((r) => ({
          ...r,
          id: 'r_' + Math.random().toString(36).slice(2, 8),
        })),
      };
      setBubbles((prev) => {
        const next = [...prev, dup];
        updateHistory(next);
        return next;
      });
      setSelectedBubbleIds([dupId]);
      setSelectedTimelineRegion(null);
    },
    [bubbles, updateHistory]
  );

  const handleDuplicateMultipleBubbles = useCallback(
    (ids: string[]) => {
      const targets = bubbles.filter((b) => ids.includes(b.id));
      if (targets.length === 0) return;
      const newDups: SoundBubble[] = [];
      const newIds: string[] = [];

      targets.forEach((target) => {
        const dupId = 'bubble-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        newDups.push({
          ...target,
          id: dupId,
          name: target.name,
          x: Math.min(100, target.x + 6),
          y: Math.min(100, target.y + 4),
          regions: target.regions.map((r) => ({
            ...r,
            id: 'r_' + Math.random().toString(36).slice(2, 8),
          })),
        });
        newIds.push(dupId);
      });

      setBubbles((prev) => {
        const next = [...prev, ...newDups];
        updateHistory(next);
        return next;
      });
      setSelectedBubbleIds(newIds);
      setSelectedTimelineRegion(null);
    },
    [bubbles, updateHistory]
  );

  const requestDeleteBubble = useCallback(
    (id: string) => {
      const target = bubbles.find((b) => b.id === id);
      if (!target) return;
      setDeleteConfirmState({
        type: 'instrument',
        bubbleId: target.id,
        bubbleName: target.name,
      });
    },
    [bubbles]
  );

  const requestDeleteMultipleBubbles = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      if (ids.length === 1) {
        requestDeleteBubble(ids[0]);
        return;
      }
      const targets = bubbles.filter((b) => ids.includes(b.id));
      setDeleteConfirmState({
        type: 'multiple-instruments',
        bubbleIds: ids,
        bubbleNames: targets.map((t) => t.name),
      });
    },
    [bubbles, requestDeleteBubble]
  );

  const requestDeleteTimelineRegion = useCallback(
    (bubble: SoundBubble, region: TimelineRegion) => {
      const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };
      setDeleteConfirmState({
        type: 'timeline-region',
        bubbleId: bubble.id,
        bubbleName: bubble.name,
        regionId: region.id,
        timeRange: `${formatTime(region.start)} - ${formatTime(region.end)}`,
      });
    },
    []
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmState) return;

    if (deleteConfirmState.type === 'instrument') {
      const id = deleteConfirmState.bubbleId;
      setBubbles((prev) => {
        const next = prev.filter((b) => b.id !== id);
        updateHistory(next);
        return next;
      });
      setSelectedBubbleIds((prev) => prev.filter((i) => i !== id));
      if (selectedTimelineRegion?.bubbleId === id) {
        setSelectedTimelineRegion(null);
      }
    } else if (deleteConfirmState.type === 'multiple-instruments') {
      const ids = deleteConfirmState.bubbleIds;
      setBubbles((prev) => {
        const next = prev.filter((b) => !ids.includes(b.id));
        updateHistory(next);
        return next;
      });
      setSelectedBubbleIds((prev) => prev.filter((id) => !ids.includes(id)));
      if (selectedTimelineRegion && ids.includes(selectedTimelineRegion.bubbleId)) {
        setSelectedTimelineRegion(null);
      }
    } else if (deleteConfirmState.type === 'timeline-region') {
      const { bubbleId, regionId } = deleteConfirmState;
      setBubbles((prev) => {
        const next = prev.map((b) => {
          if (b.id !== bubbleId) return b;
          return {
            ...b,
            regions: (b.regions || []).filter((r) => r.id !== regionId),
          };
        });
        updateHistory(next);
        return next;
      });
      if (selectedTimelineRegion?.regionId === regionId) {
        setSelectedTimelineRegion(null);
      }
    }

    setDeleteConfirmState(null);
  }, [deleteConfirmState, selectedTimelineRegion, updateHistory]);

  const handleLoadPresetTemplate = useCallback(
    (presetName: string) => {
      if (presetName === 'modern-pop') {
        const popBubbles: SoundBubble[] = [
          {
            id: 'b-pop-kick',
            name: 'Sub Kick',
            category: 'drums',
            color: '#ef4444',
            x: 0,
            y: 14,
            z: 12,
            width: 34,
            height: 28,
            volume: 88,
            saturation: 20,
            reverb: 5,
            compression: 85,
            notes: 'Punched at 55Hz center.',
            regions: [{ id: 'r1', start: 0, end: 180 }],
          },
          {
            id: 'b-pop-808',
            name: '808 Bass',
            category: 'bass',
            color: '#8b5cf6',
            x: 0,
            y: 18,
            z: 14,
            width: 30,
            height: 30,
            volume: 88,
            saturation: 30,
            reverb: 0,
            compression: 85,
            notes: 'Sub foundation.',
            regions: [{ id: 'r2', start: 0, end: 180 }],
          },
          {
            id: 'b-pop-vox',
            name: 'Lead Vocal',
            category: 'vocals',
            color: '#ec4899',
            x: 0,
            y: 58,
            z: 8,
            width: 44,
            height: 48,
            volume: 92,
            saturation: 18,
            reverb: 16,
            compression: 80,
            notes: 'In-your-face foreground presence.',
            regions: [{ id: 'r3', start: 15, end: 175 }],
          },
          {
            id: 'b-pop-pads',
            name: 'Sidechain Pad',
            category: 'synths',
            color: '#3b82f6',
            x: 52,
            y: 60,
            z: 60,
            width: 75,
            height: 44,
            volume: 65,
            saturation: 12,
            reverb: 65,
            compression: 35,
            notes: 'Wide stereo ambient texture.',
            regions: [{ id: 'r4', start: 30, end: 180 }],
          },
        ];
        setBubbles(popBubbles);
        updateHistory(popBubbles);
        setSelectedBubbleIds(['b-pop-vox']);
      } else if (presetName === 'rock-band') {
        const rockBubbles: SoundBubble[] = [
          {
            id: 'b-rock-kick',
            name: 'Rock Kick',
            category: 'drums',
            color: '#ef4444',
            x: 0,
            y: 16,
            z: 16,
            width: 34,
            height: 30,
            volume: 86,
            saturation: 20,
            reverb: 10,
            compression: 82,
            notes: 'Solid punch center.',
            regions: [{ id: 'r1', start: 0, end: 200 }],
          },
          {
            id: 'b-rock-snare',
            name: 'Snare Drum',
            category: 'drums',
            color: '#f97316',
            x: 2,
            y: 46,
            z: 20,
            width: 36,
            height: 32,
            volume: 84,
            saturation: 25,
            reverb: 22,
            compression: 75,
            notes: '2.5kHz crack.',
            regions: [{ id: 'r2', start: 0, end: 200 }],
          },
          {
            id: 'b-rock-bass',
            name: 'P-Bass',
            category: 'bass',
            color: '#8b5cf6',
            x: 0,
            y: 22,
            z: 14,
            width: 32,
            height: 32,
            volume: 86,
            saturation: 50,
            reverb: 5,
            compression: 82,
            notes: 'Warm vintage tone.',
            regions: [{ id: 'r3', start: 0, end: 200 }],
          },
          {
            id: 'b-rock-gtr-l',
            name: 'Guitar Left',
            category: 'guitars',
            color: '#eab308',
            x: -75,
            y: 52,
            z: 28,
            width: 46,
            height: 40,
            volume: 80,
            saturation: 75,
            reverb: 18,
            compression: 65,
            notes: 'Hard panned rhythm left.',
            regions: [{ id: 'r4', start: 0, end: 200 }],
          },
          {
            id: 'b-rock-gtr-r',
            name: 'Guitar Right',
            category: 'guitars',
            color: '#ca8a04',
            x: 75,
            y: 52,
            z: 28,
            width: 46,
            height: 40,
            volume: 80,
            saturation: 75,
            reverb: 18,
            compression: 65,
            notes: 'Hard panned rhythm right.',
            regions: [{ id: 'r5', start: 0, end: 200 }],
          },
          {
            id: 'b-rock-vox',
            name: 'Rock Vocal',
            category: 'vocals',
            color: '#ec4899',
            x: 0,
            y: 60,
            z: 8,
            width: 46,
            height: 46,
            volume: 90,
            saturation: 35,
            reverb: 20,
            compression: 85,
            notes: 'Front of stage.',
            regions: [{ id: 'r6', start: 10, end: 195 }],
          },
        ];
        setBubbles(rockBubbles);
        updateHistory(rockBubbles);
        setSelectedBubbleIds(['b-rock-vox']);
      }
    },
    [updateHistory]
  );

  // Z-Axis Depth Hotkeys Mapping: 1 corresponds to 0% and 0 corresponds to 100%
  const Z_HOTKEY_MAP: Record<string, number> = {
    '1': 0,
    '2': 10,
    '3': 20,
    '4': 30,
    '5': 40,
    '6': 50,
    '7': 60,
    '8': 75,
    '9': 90,
    '0': 100,
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea, or select
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      // Numbers 1-0: Hotkeys for Depth in the mix (1 = 0% Z, 0 = 100% Z)
      if (
        !isInput &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        activeTab === 'sandbox' &&
        Object.prototype.hasOwnProperty.call(Z_HOTKEY_MAP, e.key)
      ) {
        const targetZ = Z_HOTKEY_MAP[e.key];
        const targetVol = 100 - targetZ;

        if (selectedBubbleIds.length > 0) {
          e.preventDefault();
          const updated = bubbles
            .filter((b) => selectedBubbleIds.includes(b.id))
            .map((b) => ({
              ...b,
              z: targetZ,
              volume: targetVol,
            }));
          handleUpdateBubbles(updated);
          setHotkeyToast({
            key: e.key,
            z: targetZ,
            volume: targetVol,
            name:
              selectedBubbleIds.length === 1
                ? bubbles.find((b) => b.id === selectedBubbleIds[0])?.name || 'Track'
                : `${selectedBubbleIds.length} tracks`,
          });
        } else {
          e.preventDefault();
          setHotkeyToast({
            key: e.key,
            z: targetZ,
            volume: targetVol,
            name: 'Select an instrument bubble first',
          });
        }
      }

      // Select All: Ctrl+A / Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        if (!isInput && activeTab === 'sandbox' && bubbles.length > 0) {
          e.preventDefault();
          setSelectedBubbleIds(bubbles.map((b) => b.id));
        }
      }

      // Deselect All: Escape
      if (e.key === 'Escape') {
        if (!isInput && selectedBubbleIds.length > 0) {
          setSelectedBubbleIds([]);
        }
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }

      // Duplicate Selected Bubble(s): Ctrl+D / Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (!isInput && selectedBubbleIds.length > 0 && activeTab === 'sandbox') {
          e.preventDefault();
          handleDuplicateMultipleBubbles(selectedBubbleIds);
        }
      }

      // Delete Selected Bubble(s) or Arrangement Region: Backspace / Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (!isInput && activeTab === 'sandbox') {
          // If the user has just been interacting with an Arrangement Timeline bubble, delete that timeline region, not the instrument
          if (selectedTimelineRegion) {
            const bubble = bubbles.find((b) => b.id === selectedTimelineRegion.bubbleId);
            const region = bubble?.regions?.find((r) => r.id === selectedTimelineRegion.regionId);
            if (bubble && region) {
              e.preventDefault();
              requestDeleteTimelineRegion(bubble, region);
              return;
            }
          }
          if (selectedBubbleIds.length > 0) {
            e.preventDefault();
            requestDeleteMultipleBubbles(selectedBubbleIds);
          }
        }
      }

      // Media Play / Pause: Spacebar
      if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        audioEngine.togglePlay();
      }

      // Media Jump: Left Arrow (-5s), Right Arrow (+5s)
      if (e.key === 'ArrowLeft' && !isInput) {
        e.preventDefault();
        audioEngine.jump(-5);
      }
      if (e.key === 'ArrowRight' && !isInput) {
        e.preventDefault();
        audioEngine.jump(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    selectedBubbleIds,
    bubbles,
    handleUpdateBubbles,
    activeTab,
    handleDuplicateMultipleBubbles,
    selectedTimelineRegion,
    requestDeleteTimelineRegion,
    requestDeleteMultipleBubbles,
  ]);

  const totalChallengeStars = (Object.values(challengeScores) as number[]).reduce((a: number, b: number) => a + b, 0);

  return (
    <div
      id="visual-mix-lab-app"
      className={`w-screen h-screen flex flex-col overflow-hidden select-none font-sans ${
        theme === 'dark'
          ? 'bg-slate-950 text-slate-100'
          : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. Persistent Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        theme={theme}
        setTheme={setTheme}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenTour={() => {
          setActiveTab('sandbox');
          setIsPaletteOpen(true);
          setIsInspectorOpen(true);
          setIsTimelineOpen(true);
          setIsTourOpen(true);
        }}
        onOpenExport={() => setIsExportOpen(true)}
        totalChallengeStars={totalChallengeStars}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Tab 1: Mix Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="w-full h-full flex flex-col overflow-hidden relative">
            {/* Upper Workspace: Palette + 75-80% Stage + Inspector */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Collapsible Instrument Palette */}
              <Palette
                onAddBubble={handleAddBubble}
                isOpen={isPaletteOpen}
                onToggleOpen={() => setIsPaletteOpen(!isPaletteOpen)}
                onLoadPresetTemplate={handleLoadPresetTemplate}
                theme={theme}
              />

              {/* Mix Diagram Stage (Dominates Viewport) */}
              <div className="flex-1 w-full h-full relative overflow-hidden">
                <Stage3D
                  bubbles={bubbles}
                  selectedId={selectedBubbleId}
                  selectedIds={selectedBubbleIds}
                  onSelectBubble={(id, isMulti) => {
                    setSelectedTimelineRegion(null);
                    if (!id) {
                      setSelectedBubbleIds([]);
                    } else if (isMulti) {
                      setSelectedBubbleIds((prev) =>
                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                      );
                    } else {
                      setSelectedBubbleIds([id]);
                    }
                  }}
                  onSelectMultiple={(ids) => {
                    setSelectedTimelineRegion(null);
                    setSelectedBubbleIds(ids);
                  }}
                  onUpdateBubble={handleUpdateBubble}
                  onUpdateBubbles={handleUpdateBubbles}
                  onDuplicateBubble={handleDuplicateBubble}
                  onDuplicateBubbles={handleDuplicateMultipleBubbles}
                  onDeleteBubble={requestDeleteBubble}
                  onDeleteBubbles={requestDeleteMultipleBubbles}
                  onAddBubble={handleAddBubble}
                  viewMode={viewMode}
                  theme={theme}
                  currentTime={currentTime}
                />
              </div>

              {/* Collapsible Track Inspector */}
              <Inspector
                selectedBubble={selectedBubble}
                selectedBubbles={selectedBubbles}
                onUpdateBubble={handleUpdateBubble}
                onUpdateBubbles={handleUpdateBubbles}
                onDuplicateBubble={handleDuplicateBubble}
                onDuplicateBubbles={handleDuplicateMultipleBubbles}
                onDeleteBubble={requestDeleteBubble}
                onDeleteBubbles={requestDeleteMultipleBubbles}
                onSelectBubble={(id) => {
                  setSelectedBubbleIds(id ? [id] : []);
                  setSelectedTimelineRegion(null);
                }}
                onSelectMultiple={(ids) => {
                  setSelectedBubbleIds(ids);
                  setSelectedTimelineRegion(null);
                }}
                isOpen={isInspectorOpen}
                onToggleOpen={() => setIsInspectorOpen(!isInspectorOpen)}
                theme={theme}
              />
            </div>

            {/* DAW Arrangement Timeline Drawer */}
            <Timeline
              bubbles={bubbles}
              selectedId={selectedBubbleId}
              selectedRegion={selectedTimelineRegion}
              onSelectBubble={(id) => {
                setSelectedBubbleIds(id ? [id] : []);
                setSelectedTimelineRegion(null);
              }}
              onSelectRegion={(reg) => setSelectedTimelineRegion(reg)}
              onRequestDeleteRegion={requestDeleteTimelineRegion}
              onUpdateBubble={handleUpdateBubble}
              onAddBubble={handleAddBubble}
              currentTime={currentTime}
              songDuration={songDuration}
              onSeek={(s) => audioEngine.seek(s)}
              isOpen={isTimelineOpen}
              onToggleOpen={() => setIsTimelineOpen(!isTimelineOpen)}
              theme={theme}
            />
          </div>
        )}

        {/* Tab 2: Mixing Challenges */}
        {activeTab === 'challenges' && (
          <ChallengesView
            viewMode={viewMode}
            theme={theme}
            currentTime={currentTime}
            challengeScores={challengeScores}
            onUpdateScore={(id, stars) =>
              setChallengeScores((prev) => ({
                ...prev,
                [id]: Math.max(prev[id] || 0, stars),
              }))
            }
          />
        )}

        {/* Tab 3: Multitrack Reference Examples */}
        {activeTab === 'examples' && (
          <ExamplesView
            viewMode={viewMode}
            theme={theme}
            currentTime={currentTime}
          />
        )}

        {/* Tab 4: Grade Report & Batch Roster Grader */}
        {activeTab === 'grader' && (
          <GradeReportView
            challengeScores={challengeScores}
            sandboxBubbles={bubbles}
            songDuration={songDuration}
            onImportStudentMix={(importedBubbles, importedDuration) => {
              setBubbles(importedBubbles);
              updateHistory(importedBubbles);
              setSongDuration(importedDuration);
            }}
            onSwitchToSandbox={() => setActiveTab('sandbox')}
          />
        )}
      </main>

      {/* Docked YouTube Embed Player */}
      <YouTubeEmbed
        youtubeId={audioSource.youtubeId}
        videoTitle={audioSource.name}
        isPlaying={isPlaying}
        onUnload={() => audioEngine.unloadCurrentMedia()}
        isExpanded={isYouTubeExpanded}
        onToggleExpand={() => setIsYouTubeExpanded((prev) => !prev)}
      />

      {/* 3. Docked Bottom Media Scrubber (Persistent Across All Views) */}
      <MediaScrubber
        isPlaying={isPlaying}
        onTogglePlay={() => audioEngine.togglePlay()}
        currentTime={currentTime}
        songDuration={songDuration}
        onSeek={(s) => audioEngine.seek(s)}
        onJump={(delta) => audioEngine.jump(delta)}
        onLoadLocalAudio={(file) => audioEngine.loadAudioFile(file)}
        onLoadYouTube={(urlOrId) => !!audioEngine.loadYouTubeVideo(urlOrId)}
        onUnloadMedia={() => audioEngine.unloadCurrentMedia()}
        sourceType={audioSource.type}
        sourceName={audioSource.name}
        isYouTubeExpanded={isYouTubeExpanded}
        onToggleExpandYouTube={() => setIsYouTubeExpanded((prev) => !prev)}
        theme={theme}
      />

      {/* Depth Hotkey Notification HUD Toast */}
      {hotkeyToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 animate-in fade-in slide-in-from-top-2">
          <div className="bg-slate-950/95 text-slate-100 border border-sky-500/50 shadow-[0_0_24px_rgba(56,189,248,0.4)] px-4 py-2.5 rounded-xl backdrop-blur-md flex items-center gap-3 font-mono text-xs">
            <span className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center border border-sky-500/40 text-sm">
              {hotkeyToast.key}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{hotkeyToast.name}</span>
                <span className="text-[11px] text-sky-400 font-bold">· Depth: {hotkeyToast.z}%</span>
                <span className="text-[11px] text-amber-400 font-bold">· Vol: {hotkeyToast.volume}%</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {hotkeyToast.z === 0
                  ? 'Foreground Position (0% Z · 100% Vol)'
                  : hotkeyToast.z === 100
                  ? 'Deep Wall Position (100% Z · 0% Vol)'
                  : `Z-Mix Plane: ${hotkeyToast.z}%`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guided Walkthrough Tour Modal */}
      <QuickTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      {/* Standalone Google Apps Script HTML Modal */}
      <StandaloneExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        theme={theme}
      />

      {/* Confirmation Modal for Instrument & Arrangement Region Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteConfirmState)}
        state={deleteConfirmState}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmState(null)}
        theme={theme}
      />
    </div>
  );
}
