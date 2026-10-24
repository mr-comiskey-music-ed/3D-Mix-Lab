import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SoundBubble, ViewMode, ThemeMode } from '../types';
import { EXAMPLE_TRACKS } from '../data/examples';
import { Stage3D } from './Stage3D';
import { Inspector } from './Inspector';
import { audioEngine } from '../utils/audioEngine';
import { loadJSON, saveJSON } from '../utils/storage';
import { matchSong, startingDiagram, SongResult } from '../utils/songMatch';
import { Headphones, Eye, EyeOff, RotateCcw, Music2, Upload, Youtube, CheckCircle2 } from 'lucide-react';

interface DiagramSongViewProps {
  viewMode: ViewMode;
  theme: ThemeMode;
  currentTime: number;
  /** First-reveal results per song (owned by App so they go into the submission code). */
  results: Record<string, SongResult>;
  onReveal: (songId: string, match: number, placements: SongResult['placements']) => void;
}

const WORK_KEY = 'songWork:v1';

/**
 * "Diagram a Song": students listen to a real song and place each instrument where they hear
 * it — left/right, low/high, front/back. Revealing overlays the reference diagram (the
 * matching Example) and scores how close each placement is. The first reveal is the score;
 * students can keep adjusting afterwards to learn from the difference.
 */
export const DiagramSongView: React.FC<DiagramSongViewProps> = ({ viewMode, theme, currentTime, results, onReveal }) => {
  const songs = EXAMPLE_TRACKS.filter((t) => t.bubbles.length > 0);
  const [songIdx, setSongIdx] = useState(0);
  const song = songs[songIdx] || songs[0];

  // Each song's diagram in progress, kept in this browser.
  const [work, setWork] = useState<Record<string, SoundBubble[]>>(() => loadJSON(WORK_KEY, {}));
  useEffect(() => {
    const t = setTimeout(() => saveJSON(WORK_KEY, work), 400);
    return () => clearTimeout(t);
  }, [work]);

  const mine: SoundBubble[] = useMemo(
    () => (song ? work[song.id] ?? startingDiagram(song.bubbles) : []),
    [work, song]
  );
  const setMine = (fn: (prev: SoundBubble[]) => SoundBubble[]) =>
    setWork((prev) => ({ ...prev, [song.id]: fn(prev[song.id] ?? startingDiagram(song.bubbles)) }));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAnswer, setShowAnswer] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const result = song ? results[song.id] : undefined;
  const revealed = !!result;
  const live = useMemo(() => (song ? matchSong(mine, song.bubbles) : { overall: 0, instruments: [] }), [mine, song]);
  const selected = mine.find((b) => b.id === selectedId) || null;

  if (!song) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
        Add an example diagram first (Examples tab) — it becomes the answer key for this activity.
      </div>
    );
  }

  const pickSong = (i: number) => {
    setSongIdx(i);
    setSelectedId(null);
    setConfirmReveal(false);
    setConfirmReset(false);
  };

  const updateOne = (u: SoundBubble) => setMine((prev) => prev.map((b) => (b.id === u.id ? u : b)));
  const updateMany = (list: SoundBubble[]) => {
    const m = new Map(list.map((b) => [b.id, b]));
    setMine((prev) => prev.map((b) => m.get(b.id) || b));
  };

  const loadSongAudio = () => {
    if (song.youtubeId) audioEngine.loadYouTubeVideo(song.youtubeId);
    else if (song.audioUrl) audioEngine.loadAudioUrl(song.audioUrl, song.title);
    else fileRef.current?.click();
  };

  const doReveal = () => {
    const m = matchSong(mine, song.bubbles);
    onReveal(
      song.id,
      m.overall,
      mine.map((b) => [b.id, b.x, b.y, b.volume])
    );
    setConfirmReveal(false);
    setShowAnswer(true);
  };

  const doReset = () => {
    setWork((prev) => ({ ...prev, [song.id]: startingDiagram(song.bubbles) }));
    setConfirmReset(false);
    setSelectedId(null);
  };

  const light = theme === 'light';
  const panel = light ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-950/95 border-slate-800 text-slate-300';
  const tone = (p: number) => (p >= 85 ? 'text-emerald-400' : p >= 60 ? 'text-amber-300' : 'text-rose-400');

  return (
    <div id="diagram-song-view" className="w-full h-full flex flex-col overflow-hidden">
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) audioEngine.loadAudioFile(f);
        }}
      />

      {/* Song picker */}
      <div className={`h-12 border-b px-4 flex items-center gap-1.5 shrink-0 overflow-x-auto ${light ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'}`}>
        <Headphones className="w-4 h-4 text-sky-400 shrink-0 mr-1" />
        {songs.map((t, i) => {
          const r = results[t.id];
          return (
            <button
              key={t.id}
              onClick={() => pickSong(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                i === songIdx
                  ? 'bg-indigo-600 text-white'
                  : light
                  ? 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>{t.title.split(' (')[0]}</span>
              {r && <span className="text-[10px] font-mono text-emerald-300">{r.match}%</span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: what to do, then how you did */}
        <div className={`w-72 shrink-0 border-r flex flex-col overflow-y-auto p-4 gap-4 text-xs ${panel}`}>
          <div>
            <h2 className={`text-sm font-bold ${light ? 'text-slate-900' : 'text-white'}`}>{song.title.split(' (')[0]}</h2>
            <p className="text-slate-400 mt-0.5">{song.genre} · {song.bpm} BPM</p>
          </div>

          <div className="space-y-1.5">
            <p>
              Listen to the song and place each instrument where you <em>hear</em> it:
            </p>
            <ul className="space-y-1 pl-3 list-disc marker:text-slate-500">
              <li><b>Left ↔ right</b> — where it's panned</li>
              <li><b>Low ↔ high</b> — its main frequency range</li>
              <li><b>Front ↔ back</b> — how loud and close it feels (use the depth slider or Bird's-Eye)</li>
            </ul>
            <p className="text-slate-400">Wider sounds (stereo spread) and effects are up to you — they aren't scored.</p>
          </div>

          <button
            onClick={loadSongAudio}
            className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 border ${
              light ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200'
            }`}
          >
            {song.youtubeId ? <Youtube className="w-4 h-4 text-red-400" /> : <Upload className="w-4 h-4" />}
            <span>{song.youtubeId || song.audioUrl ? 'Load the song' : 'Choose the song file'}</span>
          </button>
          {!song.youtubeId && !song.audioUrl && (
            <p className="text-amber-300/90 -mt-2">No song is attached to this example yet, so choose the audio file your teacher shared.</p>
          )}

          {/* Reveal */}
          {!revealed && !confirmReveal && (
            <button
              onClick={() => setConfirmReveal(true)}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Reveal & compare
            </button>
          )}
          {!revealed && confirmReveal && (
            <div className={`rounded-lg border p-3 space-y-2 ${light ? 'border-emerald-300 bg-emerald-50' : 'border-emerald-700/60 bg-emerald-950/30'}`}>
              <p className={light ? 'text-emerald-900' : 'text-emerald-200'}>Your first reveal is your score for this song. Ready?</p>
              <div className="flex gap-2">
                <button onClick={doReveal} className="flex-1 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                  Yes, reveal
                </button>
                <button onClick={() => setConfirmReveal(false)} className="flex-1 py-1.5 rounded-md border border-slate-600 hover:bg-white/5">
                  Not yet
                </button>
              </div>
            </div>
          )}

          {revealed && (
            <div className="space-y-3">
              <div className={`rounded-lg border p-3 ${light ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/60'}`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-400">Your score (first try)</span>
                  <span className={`text-lg font-bold ${tone(result!.match)}`}>{result!.match}%</span>
                </div>
                {live.overall !== result!.match && (
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-slate-400">Your diagram now</span>
                    <span className={`font-bold ${tone(live.overall)}`}>{live.overall}%</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowAnswer((v) => !v)}
                className={`w-full py-1.5 rounded-lg border flex items-center justify-center gap-1.5 font-semibold ${
                  light ? 'border-slate-200 hover:bg-slate-100' : 'border-slate-700 hover:bg-slate-800'
                }`}
              >
                {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showAnswer ? 'Hide the answer' : 'Show the answer'}</span>
              </button>
              {showAnswer && <p className="text-slate-400">Dashed outlines show where each sound sits in the song.</p>}

              <ul className="space-y-2">
                {live.instruments.map((m) => (
                  <li key={m.id} className="flex gap-2">
                    <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: m.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <button onClick={() => setSelectedId(m.id)} className={`font-semibold truncate text-left ${light ? 'text-slate-900' : 'text-white'}`}>
                          {m.name}
                        </button>
                        <span className={`font-mono font-bold ${tone(m.overall)}`}>{m.overall}%</span>
                      </div>
                      {m.hints.length > 0 ? (
                        <p className="text-slate-400">It {m.hints.length > 1 ? `${m.hints.slice(0, -1).join(', ')} and ${m.hints[m.hints.length - 1]}` : m.hints[0]}.</p>
                      ) : (
                        <p className="text-emerald-400/90 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Right where it sits in the song.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto pt-2">
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)} className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Start this diagram over
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Clear your placements?</span>
                <button onClick={doReset} className="px-2 py-1 rounded bg-rose-600 text-white font-semibold">Clear</button>
                <button onClick={() => setConfirmReset(false)} className="px-2 py-1 rounded border border-slate-600">Keep</button>
              </div>
            )}
            {revealed && <p className="text-slate-500 mt-1">Starting over doesn't change your score.</p>}
          </div>
        </div>

        {/* Stage */}
        <div className="flex-1 relative">
          <Stage3D
            bubbles={mine}
            selectedId={selectedId}
            onSelectBubble={(id) => setSelectedId(id)}
            onUpdateBubble={updateOne}
            onUpdateBubbles={updateMany}
            onDuplicateBubble={() => {}}
            onDeleteBubble={() => {}}
            viewMode={viewMode}
            theme={theme}
            currentTime={currentTime}
            ghostBubbles={revealed && showAnswer ? song.bubbles : undefined}
            showGuidance={false}
          />
        </div>

        <Inspector
          selectedBubble={selected}
          onUpdateBubble={updateOne}
          onDuplicateBubble={() => {}}
          onDeleteBubble={() => {}}
          isOpen={inspectorOpen}
          onToggleOpen={() => setInspectorOpen((v) => !v)}
          theme={theme}
          showGuidance={false}
        />
      </div>
    </div>
  );
};
