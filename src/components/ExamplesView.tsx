import React, { useState, useEffect, useRef } from 'react';
import { EXAMPLE_TRACKS } from '../data/examples';
import { SoundBubble, ViewMode, ThemeMode, ExampleTrack } from '../types';
import { Stage3D } from './Stage3D';
import { isAuthoringMode } from '../utils/storage';
import { audioEngine } from '../utils/audioEngine';
import { ConfirmDeleteModal, ConfirmDeleteState } from './ConfirmDeleteModal';
import {
  Layers,
  Volume2,
  VolumeX,
  Info,
  Music2,
  Save,
  Download,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Youtube,
  Upload,
  Sliders,
  ExternalLink,
  Play,
  Pause,
  Radio,
  FileCode2,
  Sparkles
} from 'lucide-react';

interface ExamplesViewProps {
  viewMode: ViewMode;
  theme: ThemeMode;
  currentTime: number;
  /** Called when a song's diagram is shown (it's the answer key for "Diagram a Song"). */
  onViewAnswer?: (songId: string) => void;
}

export const ExamplesView: React.FC<ExamplesViewProps> = ({
  viewMode,
  theme,
  currentTime,
  onViewAnswer,
}) => {
  // Master list of tracks (editable in memory)
  const [tracks, setTracks] = useState<ExampleTrack[]>(() =>
    JSON.parse(JSON.stringify(EXAMPLE_TRACKS))
  );
  const [activeTrackIdx, setActiveTrackIdx] = useState(0);

  // Edit Mode toggle: 'view' (clean read-only playback) vs 'edit' (interactive drag & tune)
  const [isEditMode, setIsEditMode] = useState(false);

  // Active selected stem inside the current diagram
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

  // Sidebar navigation tabs
  const [sidebarTab, setSidebarTab] = useState<'stems' | 'inspector' | 'track_audio'>('stems');

  // Persistence status state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Audio Engine tracking
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTrack = tracks[activeTrackIdx] || tracks[0];
  const bubbles = activeTrack.bubbles;

  // Let the app know this song's answer diagram has been seen
  useEffect(() => {
    if (activeTrack?.id) onViewAnswer?.(activeTrack.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id]);

  // Track audio engine state
  useEffect(() => {
    const unsub = audioEngine.subscribe((_time, playing) => {
      setIsPlayingAudio(playing);
    });
    return () => unsub();
  }, []);

  // When switching tracks
  const handleSelectTrack = (idx: number) => {
    setActiveTrackIdx(idx);
    setSelectedBubbleId(null);
    if (sidebarTab === 'inspector') {
      setSidebarTab('stems');
    }
  };

  // Helper to update active track's bubbles
  const updateCurrentBubbles = (newBubbles: SoundBubble[]) => {
    setTracks((prev) => {
      const updated = [...prev];
      updated[activeTrackIdx] = {
        ...updated[activeTrackIdx],
        bubbles: newBubbles,
      };
      return updated;
    });
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  // Helper to update active track metadata (title, genre, bpm, description, audioUrl, youtubeId)
  const updateCurrentTrackMeta = (updates: Partial<ExampleTrack>) => {
    setTracks((prev) => {
      const updated = [...prev];
      updated[activeTrackIdx] = {
        ...updated[activeTrackIdx],
        ...updates,
      };
      return updated;
    });
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  // Stem interaction handlers
  const handleSelectBubble = (id: string | null) => {
    setSelectedBubbleId(id);
    if (id && sidebarTab === 'stems') {
      setSidebarTab('inspector');
    }
  };

  const handleUpdateBubble = (updated: SoundBubble) => {
    const nextBubbles = bubbles.map((b) => (b.id === updated.id ? updated : b));
    updateCurrentBubbles(nextBubbles);
  };

  const [deleteConfirmState, setDeleteConfirmState] = useState<ConfirmDeleteState | null>(null);

  const handleDuplicateBubble = (id: string) => {
    const target = bubbles.find((b) => b.id === id);
    if (!target) return;
    const duplicated: SoundBubble = {
      ...JSON.parse(JSON.stringify(target)),
      id: `stem-${Date.now()}`,
      name: target.name,
      x: Math.min(100, Math.max(-100, target.x + 12)),
      z: Math.min(100, target.z + 5),
    };
    updateCurrentBubbles([...bubbles, duplicated]);
    setSelectedBubbleId(duplicated.id);
  };

  const requestDeleteBubble = (id: string) => {
    const target = bubbles.find((b) => b.id === id);
    if (!target) return;
    setDeleteConfirmState({
      type: 'instrument',
      bubbleId: target.id,
      bubbleName: target.name,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmState) return;
    const id = deleteConfirmState.bubbleId;
    const nextBubbles = bubbles.filter((b) => b.id !== id);
    updateCurrentBubbles(nextBubbles);
    if (selectedBubbleId === id) {
      setSelectedBubbleId(null);
      setSidebarTab('stems');
    }
    setDeleteConfirmState(null);
  };

  const handleAddStem = () => {
    const newStem: SoundBubble = {
      id: `stem-${Date.now()}`,
      name: 'New Track Stem',
      category: 'keys_synth',
      color: '#06b6d4',
      x: 0,
      y: 50,
      z: 25,
      width: 40,
      height: 35,
      volume: 80,
      saturation: 10,
      reverb: 15,
      compression: 60,
      notes: '',
      regions: [{ id: `r-${Date.now()}`, start: 0, end: 180 }],
      solo: false,
      mute: false,
    };
    updateCurrentBubbles([...bubbles, newStem]);
    setSelectedBubbleId(newStem.id);
    setSidebarTab('inspector');
  };

  const handleToggleSolo = (bubbleId: string) => {
    const nextBubbles = bubbles.map((b) =>
      b.id === bubbleId ? { ...b, solo: !b.solo } : b
    );
    updateCurrentBubbles(nextBubbles);
  };

  const handleToggleMute = (bubbleId: string) => {
    const nextBubbles = bubbles.map((b) =>
      b.id === bubbleId ? { ...b, mute: !b.mute } : b
    );
    updateCurrentBubbles(nextBubbles);
  };

  const handleClearSolos = () => {
    updateCurrentBubbles(bubbles.map((b) => ({ ...b, solo: false })));
  };

  const handleClearMutes = () => {
    updateCurrentBubbles(bubbles.map((b) => ({ ...b, mute: false })));
  };

  // Add a brand-new Example Diagram
  const handleCreateNewExample = () => {
    const newExample: ExampleTrack = {
      id: `example-${Date.now()}`,
      title: 'Custom Production Diagram',
      genre: 'Alternative / Custom',
      bpm: 120,
      description: 'Custom reference diagram created in 3D Mix Lab.',
      bubbles: [
        {
          id: `ex-${Date.now()}-kick`,
          name: 'Kick Drum',
          category: 'drums',
          color: '#ef4444',
          x: 0,
          y: 20,
          z: 12,
          width: 32,
          height: 30,
          volume: 85,
          saturation: 15,
          reverb: 5,
          compression: 80,
          notes: 'Anchor punch in dead center.',
          regions: [{ id: 'r1', start: 0, end: 180 }],
        },
        {
          id: `ex-${Date.now()}-bass`,
          name: 'Bass Foundation',
          category: 'bass',
          color: '#8b5cf6',
          x: 0,
          y: 25,
          z: 14,
          width: 30,
          height: 32,
          volume: 86,
          saturation: 20,
          reverb: 5,
          compression: 85,
          notes: 'Deep low groove foundation.',
          regions: [{ id: 'r2', start: 0, end: 180 }],
        },
        {
          id: `ex-${Date.now()}-vocal`,
          name: 'Lead Vocal',
          category: 'vocals',
          color: '#ec4899',
          x: 0,
          y: 60,
          z: 8,
          width: 44,
          height: 44,
          volume: 90,
          saturation: 20,
          reverb: 18,
          compression: 80,
          notes: 'Lead focus upfront.',
          regions: [{ id: 'r3', start: 0, end: 180 }],
        },
      ],
    };
    const nextTracks = [...tracks, newExample];
    setTracks(nextTracks);
    setActiveTrackIdx(nextTracks.length - 1);
    setIsEditMode(true);
    setHasUnsavedChanges(true);
  };

  // Revert track to file version
  const handleRevertChanges = () => {
    if (confirm('Discard your unsaved modifications and revert back to the file version of examples.ts?')) {
      setTracks(JSON.parse(JSON.stringify(EXAMPLE_TRACKS)));
      setHasUnsavedChanges(false);
      setSaveStatus('idle');
      setStatusMessage('Reverted back to file version.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // --- AUDIO ENGINE INTEGRATION ---
  const handleLoadTrackAudio = () => {
    if (activeTrack.youtubeId) {
      audioEngine.loadYouTubeVideo(activeTrack.youtubeId);
      setStatusMessage(`Loaded YouTube audio: ${activeTrack.youtubeId}`);
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }
    if (activeTrack.audioUrl) {
      audioEngine.loadAudioUrl(activeTrack.audioUrl, activeTrack.title);
      setStatusMessage(`Loaded remote audio: ${activeTrack.title}`);
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }
    // If neither exists, trigger file input
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    audioEngine.loadAudioFile(file);
    setStatusMessage(`Loaded local audio stem: ${file.name}`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleTogglePlayAudio = () => {
    audioEngine.togglePlay();
  };

  // --- SAVE DIRECTLY TO examples.ts ---
  const handleSaveToExamplesFile = async () => {
    setSaveStatus('saving');
    setStatusMessage('Saving diagrams to src/data/examples.ts...');

    try {
      const response = await fetch('/api/save-examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setStatusMessage('Saved to src/data/examples.ts successfully!');
      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMessage(null);
      }, 4000);
    } catch (err: any) {
      console.warn('Direct file save encountered issue, offering export options:', err);
      setSaveStatus('error');
      setStatusMessage(`Could not save automatically: ${err.message}. You can download the file or copy code.`);
    }
  };

  // Generate clean TypeScript representation of current tracks
  const generateTypeScriptContent = () => {
    return `import { ExampleTrack } from '../types';\n\nexport const EXAMPLE_TRACKS: ExampleTrack[] = ${JSON.stringify(
      tracks,
      null,
      2
    )};\n`;
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generateTypeScriptContent());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      alert('Clipboard access denied. Please download the file instead.');
    }
  };

  const handleDownloadFile = () => {
    const content = generateTypeScriptContent();
    const blob = new Blob([content], { type: 'text/typescript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'examples.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const anySolo = bubbles.some((b) => b.solo);
  const selectedBubble = bubbles.find((b) => b.id === selectedBubbleId);

  return (
    <div id="examples-view" className="w-full h-full flex flex-col overflow-hidden select-none">
      {/* Hidden File Input for loading custom audio tracks */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Track & Operations Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between shrink-0 gap-3 z-30">
        {/* Left: Example Track Switchers */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {tracks.map((track, idx) => (
            <button
              key={track.id}
              onClick={() => handleSelectTrack(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTrackIdx === idx
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Music2 className="w-3.5 h-3.5 shrink-0" />
              <span>{track.title.split(' (')[0]}</span>
            </button>
          ))}

          {isAuthoringMode && (
          <button
            onClick={handleCreateNewExample}
            title="Create a new example diagram"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 transition flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Diagram</span>
          </button>
          )}
        </div>

        {/* Right: Audio Playback, Mode Switcher & Save to examples.ts */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Audio Engine Sync Action */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={handleTogglePlayAudio}
              title={isPlayingAudio ? 'Pause Audio Engine' : 'Play Audio Engine'}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                isPlayingAudio
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              onClick={handleLoadTrackAudio}
              title={activeTrack.youtubeId ? `Load YouTube video: ${activeTrack.youtubeId}` : activeTrack.audioUrl ? `Load Audio URL` : 'Select local audio file'}
              className="px-2 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition"
            >
              {activeTrack.youtubeId ? (
                <Youtube className="w-3.5 h-3.5 text-red-400 shrink-0" />
              ) : activeTrack.audioUrl ? (
                <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {activeTrack.youtubeId ? 'YT Track' : activeTrack.audioUrl ? 'Remote Audio' : 'Load Audio'}
              </span>
            </button>
          </div>

          {/* Teacher authoring tools: only when running locally or opened with ?teacher */}
          {isAuthoringMode && (<>
          {/* Mode Switcher: View vs Edit */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setIsEditMode(false)}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                !isEditMode
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                isEditMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Diagram</span>
            </button>
          </div>

          {/* Save directly to examples.ts */}
          <button
            onClick={handleSaveToExamplesFile}
            disabled={saveStatus === 'saving'}
            title="Saves modified diagram coordinates & parameters directly into src/data/examples.ts"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                : saveStatus === 'saved'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {saveStatus === 'saving' ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : saveStatus === 'saved' ? (
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                ? 'Saved!'
                : 'Save to examples.ts'}
            </span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-emerald-900" />
            )}
          </button>

          {/* Export / Revert tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyCode}
              title="Copy formatted TypeScript code to clipboard"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownloadFile}
              title="Download examples.ts file directly"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {hasUnsavedChanges && (
              <button
                onClick={handleRevertChanges}
                title="Discard changes and revert to original examples.ts"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          </>)}
        </div>
      </div>

      {/* Persistent Status Bar / Toast Notification */}
      {statusMessage && (
        <div className="bg-indigo-950/90 border-b border-indigo-800/80 px-4 py-1.5 text-xs text-indigo-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: 3D Stage Visualizer */}
        <div className="flex-1 relative flex flex-col">
          {/* Top Description & Audio Banner */}
          <div className="absolute top-2 left-3 right-3 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl flex items-center justify-between">
            <div className="max-w-[70%]">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{activeTrack.title}</h3>
                {isEditMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Edit Mode Active (Drag to Reposition)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{activeTrack.description}</p>
            </div>

            <div className="flex items-center gap-3 text-right">
              {activeTrack.youtubeId && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/50">
                  <Youtube className="w-3 h-3" />
                  <span>YT: {activeTrack.youtubeId}</span>
                </span>
              )}
              {activeTrack.audioUrl && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/50">
                  <Radio className="w-3 h-3" />
                  <span>Remote Audio</span>
                </span>
              )}
              <div className="font-mono text-xs text-indigo-300">
                <span>{activeTrack.genre} · {activeTrack.bpm} BPM</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full h-full pt-16">
            <Stage3D
              bubbles={bubbles}
              selectedId={selectedBubbleId}
              onSelectBubble={handleSelectBubble}
              onUpdateBubble={handleUpdateBubble}
              onDuplicateBubble={handleDuplicateBubble}
              onDeleteBubble={requestDeleteBubble}
              viewMode={viewMode}
              theme={theme}
              currentTime={currentTime}
              readOnly={!isEditMode}
              onToggleSolo={handleToggleSolo}
              onToggleMute={handleToggleMute}
            />
          </div>
        </div>

        {/* Right Side: Sidebar with Stems list, Inspector & Track/Audio settings */}
        <div className="w-84 bg-slate-950/95 border-l border-slate-800 flex flex-col shrink-0 h-full text-slate-300 z-20 backdrop-blur">
          {/* Sidebar Nav Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 gap-1">
            <button
              onClick={() => setSidebarTab('stems')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 ${
                sidebarTab === 'stems'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stems ({bubbles.length})</span>
            </button>

            <button
              onClick={() => setSidebarTab('inspector')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 ${
                sidebarTab === 'inspector'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Stem Inspector</span>
            </button>

            <button
              onClick={() => setSidebarTab('track_audio')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 ${
                sidebarTab === 'track_audio'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Audio & Info</span>
            </button>
          </div>

          {/* Tab 1: STEMS LIST */}
          {sidebarTab === 'stems' && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white">Stems in Mix</span>
                <div className="flex items-center gap-1.5">
                  {anySolo && (
                    <button
                      onClick={handleClearSolos}
                      className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold"
                    >
                      Clear Solos
                    </button>
                  )}
                  <button
                    onClick={handleClearMutes}
                    className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:text-white text-[10px]"
                  >
                    Clear Mutes
                  </button>
                  {isEditMode && (
                    <button
                      onClick={handleAddStem}
                      className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Stem</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                {bubbles.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleSelectBubble(b.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      selectedBubbleId === b.id
                        ? 'bg-indigo-950/50 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/30"
                        style={{ backgroundColor: b.color }}
                      />
                      <div className="truncate">
                        <span className="font-semibold text-xs block truncate text-white">
                          {b.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Pan: {b.x > 0 ? `+${b.x}` : b.x} · Freq: {b.y}% · Depth: {b.z}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSolo(b.id);
                        }}
                        title="Solo stem"
                        className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition ${
                          b.solo
                            ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-200'
                            : 'bg-slate-800 text-slate-400 hover:bg-amber-500/80 hover:text-black'
                        }`}
                      >
                        S
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMute(b.id);
                        }}
                        title="Mute stem"
                        className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition ${
                          b.mute
                            ? 'bg-red-500 text-white ring-1 ring-red-300'
                            : 'bg-slate-800 text-slate-400 hover:bg-red-500/80 hover:text-white'
                        }`}
                      >
                        M
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Educational Mixing takeaway */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5 text-[11px]">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Mixing Takeaway</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Notice how the rhythm anchor (Kick, Bass) stays centered and dry (Z &lt; 15%), while ambient pads and string sections are given wide stereo positions and deep reverberation (Z &gt; 60%) to wrap around the lead vocal without causing clash.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: STEM INSPECTOR */}
          {sidebarTab === 'inspector' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {selectedBubble ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: selectedBubble.color }}
                      />
                      <h4 className="font-bold text-xs text-white truncate">{selectedBubble.name}</h4>
                    </div>
                    {isEditMode && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateBubble(selectedBubble.id)}
                          title="Duplicate stem"
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => requestDeleteBubble(selectedBubble.id)}
                          title="Delete stem"
                          className="p-1 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stem Identity */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Stem Label
                      </label>
                      <input
                        type="text"
                        disabled={!isEditMode}
                        value={selectedBubble.name}
                        onChange={(e) => handleUpdateBubble({ ...selectedBubble, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Category & Color
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          disabled={!isEditMode}
                          value={selectedBubble.category}
                          onChange={(e) => handleUpdateBubble({ ...selectedBubble, category: e.target.value as any })}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75"
                        >
                          <option value="drums">Drums</option>
                          <option value="bass">Bass</option>
                          <option value="guitars">Guitars</option>
                          <option value="keys_synth">Keys & Synth</option>
                          <option value="vocals">Vocals</option>
                          <option value="fx">FX</option>
                        </select>
                        <input
                          type="color"
                          disabled={!isEditMode}
                          value={selectedBubble.color}
                          onChange={(e) => handleUpdateBubble({ ...selectedBubble, color: e.target.value })}
                          className="w-8 h-7 rounded border border-slate-800 bg-transparent cursor-pointer disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3D Coordinates */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Acoustic Placement (3D Coordinates)
                    </span>

                    {/* Pan X */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Pan (X)</span>
                        <span className="font-mono text-indigo-300">
                          {selectedBubble.x > 0 ? `+${selectedBubble.x} (R)` : selectedBubble.x < 0 ? `${selectedBubble.x} (L)` : '0 (Center)'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        disabled={!isEditMode}
                        value={selectedBubble.x}
                        onChange={(e) => handleUpdateBubble({ ...selectedBubble, x: Number(e.target.value) })}
                        className="w-full accent-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    {/* Frequency Y */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Frequency (Y)</span>
                        <span className="font-mono text-indigo-300">{selectedBubble.y}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        disabled={!isEditMode}
                        value={selectedBubble.y}
                        onChange={(e) => handleUpdateBubble({ ...selectedBubble, y: Number(e.target.value) })}
                        className="w-full accent-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    {/* Depth Z */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Depth in Room (Z)</span>
                        <span className="font-mono text-indigo-300">{selectedBubble.z}% (Dry → Deep)</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        disabled={!isEditMode}
                        value={selectedBubble.z}
                        onChange={(e) => handleUpdateBubble({ ...selectedBubble, z: Number(e.target.value) })}
                        className="w-full accent-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Size & Dynamics */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Stereo Width, EQ Height & Dynamics
                    </span>

                    {/* Width */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Stereo Width</span>
                        <span className="font-mono text-indigo-300">{selectedBubble.width}px</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="150"
                        disabled={!isEditMode}
                        value={selectedBubble.width}
                        onChange={(e) => handleUpdateBubble({ ...selectedBubble, width: Number(e.target.value) })}
                        className="w-full accent-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    {/* Height */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Frequency Height</span>
                        <span className="font-mono text-indigo-300">{selectedBubble.height}px</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="150"
                        disabled={!isEditMode}
                        value={selectedBubble.height}
                        onChange={(e) => handleUpdateBubble({ ...selectedBubble, height: Number(e.target.value) })}
                        className="w-full accent-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    {/* Volume */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Fader Volume</span>
                        <span className="font-mono text-indigo-300">{selectedBubble.volume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        disabled={!isEditMode}
                        value={selectedBubble.volume}
                        onChange={(e) => handleUpdateBubble({ ...selectedBubble, volume: Number(e.target.value) })}
                        className="w-full accent-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    {/* Saturation, Reverb, Compression */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-400 block mb-1">Reverb</span>
                        <span className="font-bold text-white">{selectedBubble.reverb}%</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          disabled={!isEditMode}
                          value={selectedBubble.reverb}
                          onChange={(e) => handleUpdateBubble({ ...selectedBubble, reverb: Number(e.target.value) })}
                          className="w-full accent-indigo-500 mt-1 disabled:opacity-50"
                        />
                      </div>

                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-400 block mb-1">Drive</span>
                        <span className="font-bold text-white">{selectedBubble.saturation}%</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          disabled={!isEditMode}
                          value={selectedBubble.saturation}
                          onChange={(e) => handleUpdateBubble({ ...selectedBubble, saturation: Number(e.target.value) })}
                          className="w-full accent-indigo-500 mt-1 disabled:opacity-50"
                        />
                      </div>

                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-400 block mb-1">Comp</span>
                        <span className="font-bold text-white">{selectedBubble.compression}%</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          disabled={!isEditMode}
                          value={selectedBubble.compression}
                          onChange={(e) => handleUpdateBubble({ ...selectedBubble, compression: Number(e.target.value) })}
                          className="w-full accent-indigo-500 mt-1 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Mixing Annotation / Stem Notes
                    </label>
                    <textarea
                      rows={2}
                      disabled={!isEditMode}
                      value={selectedBubble.notes || ''}
                      onChange={(e) => handleUpdateBubble({ ...selectedBubble, notes: e.target.value })}
                      placeholder="e.g. Center-anchored with fast transient punch..."
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75 resize-none"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p>Click any stem bubble on the stage or from the Stems tab to inspect and edit its parameters.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: TRACK METADATA & AUDIO SETTINGS */}
          {sidebarTab === 'track_audio' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div>
                <span className="text-xs font-bold text-white block mb-1">Track Metadata</span>
                <p className="text-[11px] text-slate-400 mb-3">
                  Edit the song profile saved to <code>examples.ts</code>.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Track Title
                  </label>
                  <input
                    type="text"
                    disabled={!isEditMode}
                    value={activeTrack.title}
                    onChange={(e) => updateCurrentTrackMeta({ title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Genre
                    </label>
                    <input
                      type="text"
                      disabled={!isEditMode}
                      value={activeTrack.genre}
                      onChange={(e) => updateCurrentTrackMeta({ genre: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      BPM
                    </label>
                    <input
                      type="number"
                      disabled={!isEditMode}
                      value={activeTrack.bpm}
                      onChange={(e) => updateCurrentTrackMeta({ bpm: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Description & Mixing Guide
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isEditMode}
                    value={activeTrack.description}
                    onChange={(e) => updateCurrentTrackMeta({ description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75 resize-none"
                  />
                </div>
              </div>

              {/* Audio Integration Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Audio Engine Source</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <Youtube className="w-3 h-3 text-red-400" />
                    <span>YouTube Video ID or Link</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditMode}
                    value={activeTrack.youtubeId || ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      updateCurrentTrackMeta({ youtubeId: val || undefined });
                    }}
                    placeholder="e.g. 4xDzrJKXOOY or full URL"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Remote Audio URL (MP3 / WAV)
                  </label>
                  <input
                    type="text"
                    disabled={!isEditMode}
                    value={activeTrack.audioUrl || ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      updateCurrentTrackMeta({ audioUrl: val || undefined });
                    }}
                    placeholder="https://example.com/audio/song.mp3"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-75"
                  />
                </div>

                <div className="pt-1 flex flex-col gap-2">
                  <button
                    onClick={handleLoadTrackAudio}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load & Play in Audio Engine</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Choose Local MP3/WAV from Computer</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteConfirmState)}
        state={deleteConfirmState}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmState(null)}
        theme={theme}
      />
    </div>
  );
};
