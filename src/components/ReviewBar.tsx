import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ListChecks, Eye, AlertTriangle, MessageSquareText } from 'lucide-react';
import { EXAMPLE_TRACKS } from '../data/examples';
import { RosterStudentRow } from '../types';
import { MIXING_CHALLENGES } from '../data/challenges';
import { challengePercent } from '../utils/progress';

interface ReviewBarProps {
  row: RosterStudentRow;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onBackToList: () => void;
  onExit: () => void;
}

/**
 * Floating bar shown while the teacher steps through student submissions in the Sandbox.
 * The stage shows the student's mix; your own mix is untouched and comes back on "Done".
 * Left/Right arrow keys move between students.
 */
export const ReviewBar: React.FC<ReviewBarProps> = ({ row, position, total, onPrev, onNext, onBackToList, onExit }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (position > 0) onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (position < total - 1) onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [position, total, onPrev, onNext]);

  const [showDetails, setShowDetails] = useState(false);
  const scores = row.submission.challengeScores || {};
  const explanations = row.submission.explanations || {};
  const songs = row.submission.songResults || {};
  const hasDetails = Object.keys(explanations).length > 0 || Object.keys(songs).length > 0;
  const pct = row.percentage;
  const tone =
    pct >= 90 ? 'text-emerald-300 border-emerald-400/50' : pct >= 70 ? 'text-amber-300 border-amber-400/50' : 'text-rose-300 border-rose-400/50';
  const btn =
    'p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-32px)]" data-no-marquee="true">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-950/95 border border-sky-500/40 shadow-2xl backdrop-blur-xl text-xs text-slate-200">
        <Eye className="w-4 h-4 text-sky-400 shrink-0" />
        <span className="text-slate-400 shrink-0">
          {position + 1} of {total}
        </span>
        <span className="font-bold text-white truncate max-w-[180px]" title={row.studentName}>
          {row.studentName}
        </span>
        {row.hasMultipleSubmissions && (
          <span title="This student submitted more than one code" className="text-amber-300 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        )}
        {row.submission.version === '2' && (
          <span className="hidden md:flex items-center gap-1 text-slate-400 shrink-0" title="Checks passed in each challenge">
            {MIXING_CHALLENGES.map((c, i) => {
              const p = challengePercent(c.id, scores[c.id] || 0);
              return (
                <span key={c.id} className="px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  {i + 1}: <span className={p === 100 ? 'text-emerald-300' : p > 0 ? 'text-amber-300' : 'text-slate-500'}>{p}%</span>
                </span>
              );
            })}
          </span>
        )}
        <span className={`font-bold px-2 py-0.5 rounded-full border ${tone} shrink-0`} title="Overall: checks passed across all challenges">
          {pct}%
        </span>
        <button onClick={onPrev} disabled={position === 0} className={btn} title="Previous student (←)">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={onNext} disabled={position >= total - 1} className={btn} title="Next student (→)">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowDetails((v) => !v)}
          disabled={!hasDetails}
          className={`${btn} px-2.5 flex items-center gap-1 font-semibold ${showDetails ? 'bg-sky-500/30' : ''}`}
          title={hasDetails ? 'Explanations and song diagrams' : 'No explanations or song diagrams in this code'}
        >
          <MessageSquareText className="w-4 h-4" /> <span className="hidden sm:inline">Details</span>
        </button>
        <button onClick={onBackToList} className={`${btn} px-2.5 flex items-center gap-1 font-semibold`} title="Back to the class list">
          <ListChecks className="w-4 h-4" /> <span className="hidden sm:inline">Class list</span>
        </button>
        <button
          onClick={onExit}
          className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shrink-0"
          title="Stop reviewing and return to your own mix"
        >
          Done
        </button>
      </div>

      {/* Explanations and song results for this student */}
      {showDetails && hasDetails && (
        <div className="mt-2 mx-auto w-[min(640px,calc(100vw-32px))] max-h-[60vh] overflow-y-auto rounded-2xl bg-slate-950/95 border border-sky-500/30 shadow-2xl backdrop-blur-xl p-4 text-xs text-slate-300 space-y-4">
          {Object.keys(songs).length > 0 && (
            <div>
              <h4 className="font-bold text-white mb-1.5">Diagram a Song (first try)</h4>
              <ul className="space-y-1">
                {EXAMPLE_TRACKS.filter((t) => songs[t.id]).map((t) => (
                  <li key={t.id} className="flex justify-between gap-3">
                    <span>{t.title.split(' (')[0]}</span>
                    <span className="font-mono">
                      <span className="font-bold text-white">{songs[t.id].match}%</span>
                      {songs[t.id].sawAnswerFirst && (
                        <span className="ml-2 text-amber-300">opened the answer diagram first</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Object.keys(explanations).length > 0 && (
            <div>
              <h4 className="font-bold text-white mb-1.5">Explain your fix</h4>
              <ul className="space-y-2.5">
                {MIXING_CHALLENGES.filter((c) => explanations[c.id]).map((c) => (
                  <li key={c.id}>
                    <div className="flex justify-between text-slate-400">
                      <span>{c.title}</span>
                      <span className="font-mono">{challengePercent(c.id, scores[c.id] || 0)}%</span>
                    </div>
                    <p className="text-slate-200 mt-0.5 whitespace-pre-wrap">{explanations[c.id]}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
