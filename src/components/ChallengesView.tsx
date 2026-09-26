import React, { useState, useEffect } from 'react';
import { Challenge, SoundBubble, ViewMode, ThemeMode } from '../types';
import { MIXING_CHALLENGES } from '../data/challenges';
import { Stage3D } from './Stage3D';
import { Inspector } from './Inspector';
import {
  CheckCircle2,
  AlertTriangle,
  Star,
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
  onUpdateScore: (challengeId: string, stars: number) => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  viewMode,
  theme,
  currentTime,
  challengeScores,
  onUpdateScore,
}) => {
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const currentChallenge = MIXING_CHALLENGES[activeChallengeIdx];

  // Working state of bubbles for the current challenge
  const [challengeBubbles, setChallengeBubbles] = useState<SoundBubble[]>(() =>
    JSON.parse(JSON.stringify(currentChallenge.initialBubbles))
  );

  useEffect(() => {
    setChallengeBubbles(JSON.parse(JSON.stringify(currentChallenge.initialBubbles)));
    setSelectedBubbleId(null);
    setIsABComparing(false);
    setEvaluationResult(null);
  }, [activeChallengeIdx]);

  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isABComparing, setIsABComparing] = useState(false); // false = student mix; true = flawed initial mix
  const [evaluationResult, setEvaluationResult] = useState<{
    tested: boolean;
    stars: number;
    details: { description: string; passed: boolean; hint: string }[];
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Switch challenge
  const handleSelectChallenge = (idx: number) => {
    setActiveChallengeIdx(idx);
    const newChallenge = MIXING_CHALLENGES[idx];
    setChallengeBubbles(JSON.parse(JSON.stringify(newChallenge.initialBubbles)));
    setSelectedBubbleId(null);
    setIsABComparing(false);
    setEvaluationResult(null);
    setHasUnsavedChanges(false);
  };

  const handleResetChallenge = () => {
    setChallengeBubbles(JSON.parse(JSON.stringify(currentChallenge.initialBubbles)));
    setSelectedBubbleId(null);
    setIsABComparing(false);
    setEvaluationResult(null);
    setHasUnsavedChanges(false);
  };

  const generateChallengesTypeScriptContent = () => {
    const updatedChallenges = MIXING_CHALLENGES.map((ch, idx) => {
      if (idx === activeChallengeIdx) {
        return {
          ...ch,
          initialBubbles: challengeBubbles,
        };
      }
      return ch;
    });

    return `import { Challenge } from '../types';\n\nexport const MIXING_CHALLENGES: Challenge[] = ${JSON.stringify(
      updatedChallenges,
      null,
      2
    )};\n`;
  };

  const handleSaveToChallengesFile = async () => {
    setSaveStatus('saving');
    setStatusMessage('Saving challenge diagram to src/data/challenges.ts...');

    try {
      const updatedChallenges = MIXING_CHALLENGES.map((ch, idx) => {
        if (idx === activeChallengeIdx) {
          return {
            ...ch,
            initialBubbles: challengeBubbles,
          };
        }
        return ch;
      });

      const response = await fetch('/api/save-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenges: updatedChallenges }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setStatusMessage('Saved challenge diagram to src/data/challenges.ts successfully!');
      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMessage(null);
      }, 4000);
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(`Could not save automatically: ${err.message}. You can download the file or copy code.`);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generateChallengesTypeScriptContent());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
      setStatusMessage('Copied challenges.ts TypeScript code to clipboard!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      alert('Clipboard access denied. Please download the file instead.');
    }
  };

  const handleDownloadFile = () => {
    const content = generateChallengesTypeScriptContent();
    const blob = new Blob([content], { type: 'text/typescript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'challenges.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage('Downloaded challenges.ts successfully!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRevertChanges = () => {
    setChallengeBubbles(JSON.parse(JSON.stringify(currentChallenge.initialBubbles)));
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

    const passedCount = details.filter((d) => d.passed).length;
    let earnedStars = 1;
    if (passedCount === currentChallenge.requirements.length) {
      earnedStars = 3;
    } else if (passedCount >= Math.ceil(currentChallenge.requirements.length / 2)) {
      earnedStars = 2;
    }

    setEvaluationResult({
      tested: true,
      stars: earnedStars,
      details,
    });

    onUpdateScore(currentChallenge.id, earnedStars);
  };

  const selectedBubble = challengeBubbles.find((b) => b.id === selectedBubbleId) || null;

  const handleUpdateBubble = (updated: SoundBubble) => {
    setChallengeBubbles((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setHasUnsavedChanges(true);
  };

  const displayedBubbles = isABComparing ? currentChallenge.initialBubbles : challengeBubbles;
  const currentSavedStars = challengeScores[currentChallenge.id] || 0;

  return (
    <div id="challenges-view" className="w-full h-full flex flex-col overflow-hidden">
      {/* Top Challenge Selection Strip */}
      <div className="h-12 border-b border-slate-800 bg-slate-950/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {MIXING_CHALLENGES.map((ch, idx) => {
            const stars = challengeScores[ch.id] || 0;
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
                {stars > 0 && (
                  <span className="text-[10px] text-amber-300 font-mono">
                    {'★'.repeat(stars)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Save Problem Diagram Button */}
          <button
            onClick={handleSaveToChallengesFile}
            title="Save problem diagram state to challenges.ts"
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
              title="Copy formatted TypeScript code to clipboard"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownloadFile}
              title="Download challenges.ts file directly"
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
                  {currentSavedStars > 0 && (
                    <span className="text-xs text-amber-300 font-mono font-bold flex items-center">
                      Best: {currentSavedStars} / 3 Stars
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium">{currentChallenge.taskGoal}</p>
              </div>

              {/* Evaluation Stars Badge if tested */}
              {evaluationResult && (
                <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < evaluationResult.stars
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-white ml-1">
                    {evaluationResult.stars === 3 ? 'Perfect Mix!' : evaluationResult.stars === 2 ? 'Getting Warmer' : 'Keep Tweaking'}
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
          <div className="flex-1 w-full h-full pt-20">
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
