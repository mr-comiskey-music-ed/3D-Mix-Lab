import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundBubble } from '../types';

const MAX_HISTORY = 100;
// Continuous edits made without the mouse (keyboard on a slider, typing notes) are grouped
// into one undo step when they happen within this long of each other.
const IDLE_GAP_MS = 500;

export interface CommitOptions {
  /**
   * true for continuous edits (dragging a bubble, moving a slider, resizing, typing):
   * everything from pointer-down to pointer-up becomes ONE undo step.
   * false/omitted for one-off actions (add, delete, duplicate, hotkey, load preset).
   */
  coalesce?: boolean;
}

/**
 * The sandbox mix plus its undo/redo history.
 *
 * - Bubbles are updated immutably, so history stores references (no deep copies).
 * - A drag sends many updates; they are merged into the step that started when the
 *   pointer went down, so one Ctrl+Z puts the bubble back where it started.
 * - History is recorded outside React's state updater, so it is never doubled by
 *   StrictMode's double-invoked updaters.
 */
export function useMixHistory(initial: SoundBubble[]) {
  const [bubbles, setBubbles] = useState<SoundBubble[]>(initial);
  const presentRef = useRef<SoundBubble[]>(initial);
  const pastRef = useRef<SoundBubble[][]>([]);
  const futureRef = useRef<SoundBubble[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const streakOpenRef = useRef(false);
  const pointerDownRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);

  const syncFlags = () => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  };

  const endStreak = useCallback(() => {
    streakOpenRef.current = false;
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  // A gesture ends when the mouse/finger/pen is released anywhere on the page.
  useEffect(() => {
    const down = () => {
      pointerDownRef.current = true;
      endStreak(); // a new gesture always starts a new undo step
    };
    const up = () => {
      pointerDownRef.current = false;
      endStreak();
    };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
    };
  }, [endStreak]);

  const commit = useCallback(
    (next: SoundBubble[], options: CommitOptions = {}) => {
      if (next === presentRef.current) return;
      const coalesce = !!options.coalesce;

      if (!coalesce || !streakOpenRef.current) {
        pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), presentRef.current];
        futureRef.current = [];
      }

      if (coalesce) {
        streakOpenRef.current = true;
        if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
        if (!pointerDownRef.current) {
          idleTimerRef.current = window.setTimeout(endStreak, IDLE_GAP_MS);
        }
      } else {
        endStreak();
      }

      presentRef.current = next;
      setBubbles(next);
      syncFlags();
    },
    [endStreak]
  );

  /** Apply a change based on the latest mix (safe to call several times in one event). */
  const update = useCallback(
    (fn: (prev: SoundBubble[]) => SoundBubble[], options?: CommitOptions) => {
      commit(fn(presentRef.current), options);
    },
    [commit]
  );

  const undo = useCallback(() => {
    endStreak();
    const prev = pastRef.current[pastRef.current.length - 1];
    if (!prev) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [presentRef.current, ...futureRef.current].slice(0, MAX_HISTORY);
    presentRef.current = prev;
    setBubbles(prev);
    syncFlags();
  }, [endStreak]);

  const redo = useCallback(() => {
    endStreak();
    const next = futureRef.current[0];
    if (!next) return;
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, presentRef.current].slice(-MAX_HISTORY);
    presentRef.current = next;
    setBubbles(next);
    syncFlags();
  }, [endStreak]);

  return { bubbles, bubblesRef: presentRef, commit, update, undo, redo, canUndo, canRedo };
}
