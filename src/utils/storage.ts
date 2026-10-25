/**
 * Small, failure-proof wrappers around localStorage.
 *
 * Everything stays in the student's own browser on their own Chromebook — nothing is sent
 * anywhere. Reads and writes are wrapped in try/catch because storage can be blocked or
 * full, and the app must keep working (just without saving) when that happens.
 */

const PREFIX = 'mixlab:';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: keep working without saving.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

/**
 * Teacher authoring tools (saving example and challenge diagrams back into the code) are
 * shown when running the app locally, or when the page is opened with ?teacher in the URL.
 * Students on the live site never see them.
 */
export const isAuthoringMode: boolean = (() => {
  try {
    const { hostname, search } = window.location;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      new URLSearchParams(search).has('teacher')
    );
  } catch {
    return false;
  }
})();
