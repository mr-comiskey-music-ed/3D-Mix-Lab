import { SoundBubble, clampPan } from '../types';

/**
 * "Diagram a Song" scoring.
 *
 * A student's diagram is compared with the reference (answer key) diagram, instrument by
 * instrument, on the three things Gibson's diagrams are about:
 *   - pan (left / right)
 *   - frequency (low / high)
 *   - depth (front / back, which in this app comes from volume)
 * Being close counts fully; the score falls off gradually as the placement gets further away,
 * so a near miss still earns most of the credit. Effects (reverb, saturation, compression)
 * are not scored — they are much harder to hear reliably — but students can still set them.
 */

// [distance that still counts as 100%, distance that counts as 0%]
const TOLERANCE = {
  pan: [8, 40],   // pan units (-64 … +64)
  freq: [6, 30],  // frequency position (0 … 100)
  depth: [8, 40], // depth (0 = front … 100 = back)
} as const;

const closeness = (err: number, [full, zero]: readonly [number, number]) =>
  err <= full ? 100 : err >= zero ? 0 : Math.round((100 * (zero - err)) / (zero - full));

const depthOf = (b: SoundBubble) => 100 - b.volume;

export interface InstrumentMatch {
  id: string;
  name: string;
  color: string;
  pan: number;
  freq: number;
  depth: number;
  overall: number;
  hints: string[];
}

export function matchInstrument(mine: SoundBubble, answer: SoundBubble): InstrumentMatch {
  const dPan = clampPan(mine.x) - clampPan(answer.x);
  const dFreq = mine.y - answer.y;
  const dDepth = depthOf(mine) - depthOf(answer);
  const pan = closeness(Math.abs(dPan), TOLERANCE.pan);
  const freq = closeness(Math.abs(dFreq), TOLERANCE.freq);
  const depth = closeness(Math.abs(dDepth), TOLERANCE.depth);

  const hints: string[] = [];
  if (pan < 70) hints.push(dPan > 0 ? 'sits further left in the song' : 'sits further right in the song');
  if (freq < 70) hints.push(dFreq > 0 ? 'is lower in the song' : 'is higher in the song');
  if (depth < 70) hints.push(dDepth > 0 ? 'is further forward (louder) in the song' : 'is further back (quieter) in the song');

  return {
    id: answer.id,
    name: answer.name,
    color: answer.color,
    pan,
    freq,
    depth,
    overall: Math.round((pan + freq + depth) / 3),
    hints,
  };
}

export function matchSong(mine: SoundBubble[], answer: SoundBubble[]) {
  const byId = new Map(mine.map((b) => [b.id, b]));
  const instruments = answer
    .map((a) => {
      const m = byId.get(a.id);
      return m ? matchInstrument(m, a) : null;
    })
    .filter((x): x is InstrumentMatch => !!x);
  const overall = instruments.length
    ? Math.round(instruments.reduce((s, i) => s + i.overall, 0) / instruments.length)
    : 0;
  return { overall, instruments };
}

/**
 * Starting point for a student: the song's instruments (names and colors only), lined up
 * across the middle of the room at a neutral height and depth, with no effects — nothing
 * that gives away where they belong. Their on/off timing is kept so sounds still come and
 * go with the song.
 */
export function startingDiagram(answer: SoundBubble[]): SoundBubble[] {
  // Two staggered rows so names don't overlap: even ones a little low, odd ones a little high.
  const n = answer.length;
  return answer.map((a, i) => ({
    ...a,
    x: n > 1 ? Math.round(-52 + (104 * i) / (n - 1)) : 0,
    y: n > 4 ? (i % 2 ? 62 : 38) : 50,
    volume: 60,
    z: 40,
    width: 80,
    height: 70,
    saturation: 0,
    reverb: 0,
    compression: 0,
    notes: '',
    solo: undefined,
    mute: undefined,
  }));
}

/** What gets saved and put into the submission code for each song. */
export interface SongResult {
  /** Match % at the student's first reveal (later tries don't change it). */
  match: number;
  /** The student looked at this song's answer diagram (Examples tab) before revealing. */
  sawAnswerFirst?: boolean;
  /** When the student first revealed (ms since 1970). */
  revealedAt: number;
  /** Their placements at the first reveal: [id, pan, frequency, volume] per instrument. */
  placements: [string, number, number, number][];
}
