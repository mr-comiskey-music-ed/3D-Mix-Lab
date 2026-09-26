import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Upload,
  Youtube,
  Volume2,
  X,
  Radio,
  FileAudio,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { AudioSourceType, extractYouTubeId } from '../utils/audioEngine';
import { ThemeMode } from '../types';

interface MediaScrubberProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  songDuration: number;
  onSeek: (seconds: number) => void;
  onJump: (delta: number) => void;
  onLoadLocalAudio: (file: File) => void;
  onLoadYouTube: (urlOrId: string) => boolean;
  onUnloadMedia: () => void;
  sourceType: AudioSourceType;
  sourceName: string | null;
  isYouTubeExpanded?: boolean;
  onToggleExpandYouTube?: () => void;
  theme?: ThemeMode;
}

export const MediaScrubber: React.FC<MediaScrubberProps> = ({
  isPlaying,
  onTogglePlay,
  currentTime,
  songDuration,
  onSeek,
  onJump,
  onLoadLocalAudio,
  onLoadYouTube,
  onUnloadMedia,
  sourceType,
  sourceName,
  isYouTubeExpanded = false,
  onToggleExpandYouTube,
  theme = 'dark',
}) => {
  const scrubBarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  const formatTime = (sec: number) => {
    const sInt = Math.max(0, Math.floor(sec));
    const m = Math.floor(sInt / 60);
    const s = sInt % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubBarRef.current) return;
    const rect = scrubBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * songDuration);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadLocalAudio(file);
    }
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setYoutubeError(null);
    const parsedId = extractYouTubeId(youtubeUrl);
    if (!parsedId) {
      setYoutubeError('Invalid YouTube URL or ID. Please check the link.');
      return;
    }

    const success = onLoadYouTube(youtubeUrl);
    if (success) {
      setShowYoutubeModal(false);
      setYoutubeUrl('');
    } else {
      setYoutubeError('Could not initialize YouTube player with that video.');
    }
  };

  const progressPct =
    songDuration > 0
      ? Math.max(0, Math.min(100, (currentTime / songDuration) * 100))
      : 0;

  return (
    <div
      id="docked-media-scrubber"
      className={`w-full border-t shrink-0 z-30 select-none flex flex-col transition-colors ${
        theme === 'light'
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-950 border-slate-800 text-slate-100'
      }`}
    >
      {/* Upper Control Strip */}
      <div className="h-12 px-4 flex items-center justify-between">
        {/* Left: Source Indicator & Upload Controls */}
        <div className="flex items-center gap-3">
          {sourceType === 'youtube' ? (
            <div className="flex items-center gap-2 bg-rose-950/50 border border-rose-500/50 px-2.5 py-1 rounded-lg text-[11px] font-mono text-rose-300">
              <Youtube className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]" title={sourceName || 'YouTube Track'}>
                {sourceName || 'YouTube Track'}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-rose-300/80 bg-rose-900/40 px-1.5 py-0.5 rounded border border-rose-500/30">
                <Volume2
                  className={`w-3 h-3 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}
                />
                <span className="hidden md:inline">{isPlaying ? 'Playing' : 'Paused'}</span>
              </span>
              <button
                onClick={onToggleExpandYouTube}
                title={isYouTubeExpanded ? 'Collapse video into lower bar' : 'Expand video player'}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-sans font-medium transition ml-1"
              >
                {isYouTubeExpanded ? (
                  <>
                    <Minimize2 className="w-2.5 h-2.5" />
                    <span>Collapse</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span>Video</span>
                  </>
                )}
              </button>
              <button
                onClick={onUnloadMedia}
                title="Eject YouTube Track"
                className="ml-0.5 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : sourceType === 'audio' ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[11px] font-mono text-emerald-300">
              <FileAudio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-[220px]">
                {sourceName || 'Audio File'}
              </span>
              <button
                onClick={onUnloadMedia}
                title="Eject Audio File"
                className="ml-1 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
              theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <Radio
                className={`w-3 h-3 ${
                  isPlaying ? 'text-indigo-500 animate-pulse' : theme === 'light' ? 'text-slate-400' : 'text-slate-600'
                }`}
              />
              <span className="hidden sm:inline">Timeline Clock</span>
              <span className={`text-[10px] hidden md:inline ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
                (Upload audio or YouTube to sync)
              </span>
            </div>
          )}

          {/* Local Audio File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload local .mp3 or .wav track"
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Upload className="w-3 h-3 text-indigo-500" />
            <span className="hidden sm:inline">Load Audio</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* YouTube Modal Trigger */}
          <button
            onClick={() => {
              setYoutubeError(null);
              setShowYoutubeModal(true);
            }}
            title="Attach YouTube video soundtrack"
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">YouTube Track</span>
          </button>
        </div>

        {/* Center: Play / Pause and Jump Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onJump(-5)}
            title="Jump backward 5s (Left Arrow)"
            className={`p-1.5 rounded-lg border transition ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-media-play-pause"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)'}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40 transition-transform active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onJump(5)}
            title="Jump forward 5s (Right Arrow)"
            className={`p-1.5 rounded-lg border transition ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Clock & Duration Display */}
        <div className={`flex items-center gap-2 font-mono text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{formatTime(currentTime)}</span>
          <span className={theme === 'light' ? 'text-slate-400' : 'text-slate-600'}>/</span>
          <span>{formatTime(songDuration)}</span>
        </div>
      </div>

      {/* Bottom Full-Width Interactive Scrub Bar */}
      <div
        ref={scrubBarRef}
        onClick={handleScrubClick}
        className={`w-full h-2.5 cursor-pointer relative group overflow-hidden ${
          theme === 'light' ? 'bg-slate-200' : 'bg-slate-900'
        }`}
      >
        {/* Fill Line */}
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 relative transition-all"
          style={{ width: `${progressPct}%` }}
        >
          {/* Thumb handle */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-r shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* YouTube URL Attachment Modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Youtube className="w-4 h-4 text-rose-500" />
                <span>Embed YouTube Reference Track</span>
              </h3>
              <button
                onClick={() => setShowYoutubeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Paste any YouTube song link or Video ID. The DAW timeline duration and playback playhead will automatically sync directly with the embedded YouTube video.
            </p>

            <form onSubmit={handleYoutubeSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="https://www.youtube.com/watch?v=... or Video ID"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-rose-500 text-xs font-mono"
                />
                {youtubeError && (
                  <p className="text-[11px] text-rose-400 mt-1.5 font-mono">
                    {youtubeError}
                  </p>
                )}
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="text-slate-300 font-semibold block">Supported Formats:</span>
                <p className="text-[10px] font-mono text-slate-500">
                  • youtube.com/watch?v=VIDEO_ID<br />
                  • youtu.be/VIDEO_ID<br />
                  • music.youtube.com/watch?v=VIDEO_ID<br />
                  • 11-character Video ID directly
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowYoutubeModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>Sync YouTube Track</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
