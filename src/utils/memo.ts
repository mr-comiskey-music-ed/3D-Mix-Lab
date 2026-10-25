import React from 'react';

/**
 * React.memo that ignores callback props when deciding whether to redraw.
 * Used for panels that get fresh inline callbacks from App on every render (e.g. while the
 * play clock ticks) but only need to redraw when their data changes. The callbacks passed
 * in either stay the same or read the latest data themselves, so skipping them is safe.
 */
export function memoIgnoringCallbacks<P extends object>(Component: React.ComponentType<P>) {
  return React.memo(Component, (prev, next) => {
    for (const key of Object.keys({ ...prev, ...next }) as (keyof P)[]) {
      if (typeof prev[key] === 'function' && typeof next[key] === 'function') continue;
      if (prev[key] !== next[key]) return false;
    }
    return true;
  });
}
