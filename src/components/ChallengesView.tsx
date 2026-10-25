import React, { useState, useEffect } from 'react';
import { Challenge, SoundBubble, ViewMode, ThemeMode } from '../types';
import { MIXING_CHALLENGES } from '../data/challenges';
import { loadJSON, saveJSON, isAuthoringMode } from '../utils/storage';
import { challengePercent } from '../utils/progress';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const WORK_KEY = 'challengeWork:v1';
import { Stage3D } from './Stage3D';
import { Inspector } from './Inspector';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  HelpCircle,
  Trophy,
  ArrowRight,
  Save,
  Copy,
  Download,
  RotateCcw,
  Check
} from 'lucide-react';

interface ChallengesViewProps {
  viewMode: ViewMode;
  theme: ThemeMode;
  currentTime: number;
  challengeScores: Record<string, number>;
  /** Records how many checks passed (the best result is kept). */
  onUpdateScore: (challengeId: string, checksPassed: number) => void;
  /** "Explain your fix" answers by challenge id (saved in the browser and sent in the code). */
  explanations: Record<string, string>;
  onExplanationChange: (challengeId: string, text: string) => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  viewMode,
  theme,
  currentTime,
  challengeScores,
  onUpdateScore,
  explanations,
  onExplanationChange,
}) => {
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const currentChallenge = MIXING_CHALLENGES[activeChallengeIdx];

  // Work in progress for every challenge, kept in this browser so switching challenges,
  // switching tabs or reloading the page never throws away a student's changes.
  const [workById, setWorkById] = useState<Record<string, SoundBubble[]>>(() => loadJSON(WORK_KEY, {}));
  const challengeBubbles: SoundBubble[] = workById[currentChallenge.id] ?? currentChallenge.initialBubbles;
  const setChallengeBubbles = (next: SoundBubble[] | ((prev: SoundBubble[]) => SoundBubble[])) => {
    setWorkById((prev) => {
      const current = prev[currentChallenge.id] ?? currentChallenge.initialBubbles;
      const value = typeof next === 'function' ? next(current) : next;
      return { ...prev, [currentChallenge.id]: value };
    });
  };
  useEffect(() => {
    const t = setTimeout(() => saveJSON(WORK_KEY, workById), 400);
    return () => clearTimeout(t);
  }, [workById]);

  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isABComparing, setIsABComparing] = useState(false); // false = student mix; true = flawed initial mix
  const [evaluationResult, setEvaluationResult] = useState<{
    tested: boolean;
    passed: number;
    total: number;
    details: { description: string; passed: boolean; hint: string }[];
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Switch challenge
  const handleSelectChallenge = (idx: number) => {
    setActiveChallengeIdx(idx);
    setSelectedBubbleId(null);
    setIsABComparing(false);
    setEvaluationResult(null);
    setHasUnsavedChanges(false);
  };

  const handleResetChallenge = () => {
    setChallengeBubbles(clone(currentChallenge.initialBubbles));
    setSelectedBubbleId(null);
    setIsABComparing(false);
    setEvaluationResult(null);
    setHasUnsavedChanges(false);
  };

  // Teacher authoring: all challenge starting diagrams, with the current one replaced by
  // what's on screen. Written to src/data/challengeDiagrams.json (diagrams only — the
  // pass/fail checks in challenges.ts are never rewritten).
  const buildDiagramsJson = () => {
    const diagrams: Record<string, SoundBubble[]> = {};
    MIXING_CHALLENGES.forEach((ch) => {
      diagrams[ch.id] = ch.id === currentChallenge.id ? challengeBubbles : ch.initialBubbles;
    });
    return diagrams;
  };
  const generateDiagramsFileContent = () => JSON.stringify(buildDiagramsJson(), null, 2) + '\n';

  const handleSaveToChallengesFile = async () => {
    setSaveStatus('saving');
    setStatusMessage('Saving challenge diagram to src/data/challengeDiagrams.json...');

    try {
      const response = await fetch('/api/save-challenge-diagrams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagrams: buildDiagramsJson() }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setStatusMessage('Saved to src/data/challengeDiagrams.json. Commit that file to publish the new diagram.');
      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMessage(null);
      }, 4000);
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(`Couldn't save automatically (${err.message}). Use download or copy instead, and replace src/data/challengeDiagrams.json with it.`);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generateDiagramsFileContent());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
      setStatusMessage('Copied challengeDiagrams.json to the clipboard.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      alert('Clipboard access denied. Please download the file instead.');
    }
  };

  const handleDownloadFile = () => {
    const content = generateDiagramsFileContent();
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'challengeDiagrams.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage('Downloaded challengeDiagrams.json.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRevertChanges = () => {
    setChallengeBubbles(clone(currentChallenge.initialBubbles));
    setHasUnsavedChanges(false);
    setStatusMessage('Reverted to original challenge baseline');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCheckMix = () => {
    const details = currentChallenge.requirements.map((req) => ({
      description: req.description,
      passed: req.test(challengeBubbles),
      hint: req.hint,
    }));

    // Score = checks passed (shown as a percentage).
    const passedCount = details.filter((d) => d.passed).length;
    const total = currentChallenge.requirements.length;

    setEvaluationResult({
      tested: true,
      passed: passedCount,
      total,
      details,
    });

    onUpdateScore(currentChallenge.id, passedCount);
  };

  const selectedBubble = challengeBubbles.find((b) => b.id === selectedBubbleId) || null;

  const handleUpdateBubble = (updated: SoundBubble) => {
    setChallengeBubbles((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setHasUnsavedChanges(true);
  };

  const displayedBubbles = isABComparing ? currentChallenge.initialBubbles : challengeBubbles;
  const bestPercent = challengePercent(currentChallenge.id, challengeScores[currentChallenge.id] || 0);

  return (
    <div id="challenges-view" className="w-full h-full flex flex-col overflow-hidden">
      {/* Top Challenge Selection Strip */}
      <div className="h-12 border-b border-slate-800 bg-slate-950/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {MIXING_CHALLENGES.map((ch, idx) => {
            const pct = challengePercent(ch.id, challengeScores[ch.id] || 0);
            const tried = ch.id in challengeScores && (challengeScores[ch.id] || 0) > 0;
            const isSelected = activeChallengeIdx === idx;
            return (
              <button
                key={ch.id}
                onClick={() => handleSelectChallenge(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{ch.title.split(':')[0]}</span>
                <span className="truncate max-w-[120px]">{ch.title.split(': ')[1]}</span>
                {tried && (
                  <span className={`text-[10px] font-mono ${pct === 100 ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {pct}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Teacher authoring tools: only when running locally or opened with ?teacher */}
          {isAuthoringMode && (<>
          {/* Save Problem Diagram Button */}
          <button
            onClick={handleSaveToChallengesFile}
            title="Save this starting diagram to src/data/challengeDiagrams.json"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              saveStatus === 'saved'
                ? 'bg-emerald-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
            }`}
          >
            {saveStatus === 'saving' ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : saveStatus === 'saved' ? (
              <Check className="w-3.5 h-3.5 text-emerald-200" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                ? 'Saved!'
                : 'Save problem diagram'}
            </span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-indigo-900" />
            )}
          </button>

          {/* Copy and Download Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyCode}
              title="Copy challengeDiagrams.json to the clipboard"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownloadFile}
              title="Download challengeDiagrams.json"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {hasUnsavedChanges && (
              <button
                onClick={handleRevertChanges}
                title="Discard changes and revert to original challenge baseline"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          </>)}

          {/* A/B Compare Toggle */}
          <button
            onClick={() => setIsABComparing(!isABComparing)}
            title="Toggle between your modified mix (A) and original flawed mix (B)"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              isABComparing
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isABComparing ? 'Showing Original Flawed Mix (B)' : 'A/B Compare Mix'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleResetChallenge}
            title="Reset to flawed baseline"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Check Mix Button */}
          <button
            id="btn-check-mix"
            onClick={handleCheckMix}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 ring-1 ring-emerald-400/40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Check Mix</span>
          </button>
        </div>
      </div>

      {/* Persistent Status Bar / Toast Notification */}
      {statusMessage && (
        <div className="bg-indigo-950/90 border-b border-indigo-800/80 px-4 py-1.5 text-xs text-indigo-200 flex items-center justify-between shrink-0 z-20">
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

      {/* Main Workspace Area (Stage + Diagnostics & Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Stage Container */}
        <div className="flex-1 relative flex flex-col">
          {/* Challenge Banner Overlay */}
          <div className="absolute top-2 left-3 right-3 z-10 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-white">{currentChallenge.title}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {currentChallenge.difficulty}
                  </span>
                  {bestPercent > 0 && (
                    <span className="text-xs text-amber-300 font-mono font-bold flex items-center">
                      Best: {bestPercent}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium">{currentChallenge.taskGoal}</p>
              </div>

              {/* Result of the last check: checks passed and percentage */}
              {evaluationResult && (
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                  <span
                    className={`text-sm font-bold font-mono ${
                      evaluationResult.passed === evaluationResult.total ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {Math.round((evaluationResult.passed / (evaluationResult.total || 1)) * 100)}%
                  </span>
                  <span className="text-xs text-slate-300">
                    {evaluationResult.passed} of {evaluationResult.total} checks
                    {evaluationResult.passed === evaluationResult.total ? ' — solved!' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Diagnostic Checklist Dropdown */}
            {evaluationResult && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs">
                {evaluationResult.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-2">
                    {detail.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={detail.passed ? 'text-emerald-300 font-medium' : 'text-slate-300'}>
                        {detail.description}
                      </span>
                      {!detail.passed && (
                        <p className="text-[11px] text-amber-400/90 font-mono mt-0.5">{detail.hint}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3D Stage */}
          <div className="flex-1 min-h-0 w-full pt-20">
            <Stage3D
              bubbles={displayedBubbles}
              selectedId={selectedBubbleId}
              onSelectBubble={setSelectedBubbleId}
              onUpdateBubble={handleUpdateBubble}
              onDuplicateBubble={() => {}}
              onDeleteBubble={() => {}}
              viewMode={viewMode}
              theme={theme}
              currentTime={currentTime}
              readOnly={isABComparing}
            />
          </div>

          {/* Explain your fix: reasoning, not just a score. Included in the submission code. */}
          <div className="shrink-0 border-t border-slate-800 bg-slate-950/90 px-3 py-2">
            <label className="flex items-baseline justify-between text-xs mb-1">
              <span className="font-semibold text-slate-200">Explain your fix</span>
              <span className="text-slate-500">What did you hear, what did you change, and why?</span>
            </label>
            <textarea
              value={explanations[currentChallenge.id] || ''}
              onChange={(e) => onExplanationChange(currentChallenge.id, e.target.value.slice(0, 600))}
              rows={2}
              maxLength={600}
              placeholder="e.g. The guitars and synth were piled on the kick and 808 in the low-mids, so it sounded muddy. I moved them up and panned the guitars wide so the bass has its own space."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Right Inspector */}
        <Inspector
          selectedBubble={selectedBubble}
          onUpdateBubble={handleUpdateBubble}
          onDuplicateBubble={() => {}}
          onDeleteBubble={() => {}}
          isOpen={isInspectorOpen}
          onToggleOpen={() => setIsInspectorOpen(!isInspectorOpen)}
          theme={theme}
        />
      </div>
    </div>
  );
};
