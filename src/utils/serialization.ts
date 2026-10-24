import { SoundBubble, StudentSubmission, RosterStudentRow, TimelineRegion } from '../types';
import { MIXING_CHALLENGES } from '../data/challenges';
import { SongResult } from './songMatch';
import { EXAMPLE_TRACKS } from '../data/examples';
import { TOTAL_CHECKS, checksIn, challengePercent } from './progress';

/**
 * Student submission codes.
 *
 * New codes look like  VML2-<compressed data>.<checksum>
 *   - The mix is packed into a compact list format first (short keys, numbers rounded,
 *     default values left out), then compressed with the browser's built-in compressor
 *     and written in URL-safe characters. Codes are a fraction of the old length.
 *   - The checksum catches codes that were cut off, mistyped or edited.
 *   - Nothing leaves the browser; the code is the only copy of the student's work.
 *
 * Older codes (VML-<base64>) are still read, so earlier submissions keep working.
 */

const PREFIX_V2 = 'VML2-';
const PREFIX_V1 = 'VML-';
/** Scores are checks passed; the submission's totalStars/maxStars fields hold checks passed / total checks. */
export const MAX_STARS = TOTAL_CHECKS;
export const CHALLENGE_IDS = MIXING_CHALLENGES.map((c) => c.id);

const CATEGORIES: SoundBubble['category'][] = [
  'vocals', 'drums', 'bass', 'guitars', 'keys', 'synths', 'keys_synth', 'orchestral', 'fx',
];

// ---------- small helpers ----------
function hash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36);
}

const round1 = (n: number) => Math.round((Number(n) || 0) * 10) / 10;

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function compress(text: string): Promise<Uint8Array> {
  const stream = new Blob([new TextEncoder().encode(text)]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

// ---------- pack / unpack ----------
type PackedBubble = [string, number, string, number, number, number, number, number, number, number, number, Record<string, unknown>?];

function packBubble(b: SoundBubble, duration: number): PackedBubble {
  const extras: Record<string, unknown> = {};
  if (b.notes) extras.o = b.notes;
  const regions = b.regions || [];
  const isDefaultRegion = regions.length === 1 && regions[0].start === 0 && Math.abs(regions[0].end - duration) < 0.5;
  if (!isDefaultRegion) extras.r = regions.map((r) => [round1(r.start), round1(r.end)]);
  if (b.mute) extras.m = 1;
  if (b.solo) extras.s = 1;
  if (Math.round(b.z) !== Math.round(100 - b.volume)) extras.z = round1(b.z);
  const cat = CATEGORIES.indexOf(b.category);
  const row: PackedBubble = [
    b.name,
    cat >= 0 ? cat : 0,
    (b.color || '#888888').replace('#', ''),
    round1(b.x), round1(b.y), round1(b.volume),
    round1(b.width), round1(b.height),
    round1(b.saturation), round1(b.reverb), round1(b.compression),
  ];
  if (Object.keys(extras).length) row.push(extras);
  return row;
}

function unpackBubble(row: PackedBubble, i: number, duration: number): SoundBubble {
  const [name, cat, color, x, y, volume, width, height, saturation, reverb, compression, extras = {}] = row;
  const ex = extras as { o?: string; r?: [number, number][]; m?: number; s?: number; z?: number };
  const regions: TimelineRegion[] = ex.r
    ? ex.r.map(([start, end], j) => ({ id: `r${i}_${j}`, start, end }))
    : [{ id: `r${i}_0`, start: 0, end: duration }];
  return {
    id: `student-${i}`,
    name,
    category: CATEGORIES[cat] ?? 'fx',
    color: `#${color}`,
    x, y, volume, width, height, saturation, reverb, compression,
    z: ex.z ?? 100 - volume,
    notes: ex.o ?? '',
    regions,
    mute: ex.m === 1 || undefined,
    solo: ex.s === 1 || undefined,
  };
}

// ---------- encode ----------
export interface SubmissionExtras {
  explanations?: Record<string, string>;
  songResults?: Record<string, SongResult>;
}

export async function encodeStudentSubmission(
  studentName: string,
  challengeScores: Record<string, number>,
  bubbles: SoundBubble[],
  songDuration: number,
  extras: SubmissionExtras = {}
): Promise<string> {
  const packed: Record<string, unknown> = {
    v: 2,
    n: studentName.trim() || 'Anonymous Student',
    t: Date.now(),
    s: CHALLENGE_IDS.map((id) => Math.min(checksIn(id), challengeScores[id] || 0)),
    d: Math.round(songDuration),
    b: bubbles.map((b) => packBubble(b, songDuration)),
  };
  // "Explain your fix" answers, in challenge order (left out when all are empty)
  const explanations = CHALLENGE_IDS.map((id) => (extras.explanations?.[id] || '').trim());
  if (explanations.some(Boolean)) packed.e = explanations;
  // "Diagram a Song": [match %, saw answer first (1/0), revealed at, placements]
  const songs = Object.entries(extras.songResults || {});
  if (songs.length) {
    packed.g = Object.fromEntries(
      songs.map(([id, r]) => [
        id,
        [r.match, r.sawAnswerFirst ? 1 : 0, r.revealedAt, r.placements.map(([pid, x, y, v]) => [pid, round1(x), round1(y), round1(v)])],
      ])
    );
  }
  const json = JSON.stringify(packed);
  return `${PREFIX_V2}${bytesToBase64Url(await compress(json))}.${hash(json)}`;
}

// ---------- decode ----------
export interface DecodeResult {
  success: boolean;
  submission?: StudentSubmission;
  isValidSignature?: boolean;
  error?: string;
}

function buildSubmission(
  studentName: string,
  timestamp: string,
  scores: Record<string, number>,
  bubbles: SoundBubble[],
  songDuration: number,
  signature: string,
  version: string
): StudentSubmission {
  const totalStars = Object.values(scores).reduce((a, b) => a + (Number(b) || 0), 0);
  return {
    version,
    studentName,
    timestamp,
    challengeScores: scores,
    totalStars,
    maxStars: MAX_STARS,
    sandboxSnapshot: { bubbles, songDuration },
    signature,
  };
}

async function decodeV2(code: string): Promise<DecodeResult> {
  const body = code.slice(PREFIX_V2.length);
  const dot = body.lastIndexOf('.');
  if (dot <= 0) return { success: false, error: 'This code is incomplete (the end is missing).' };
  let json: string;
  try {
    json = await decompress(base64UrlToBytes(body.slice(0, dot)));
  } catch {
    return { success: false, error: 'This code is incomplete or was changed after it was made.' };
  }
  if (hash(json) !== body.slice(dot + 1)) {
    return { success: false, error: 'This code was changed after it was made, or part of it is missing.' };
  }
  try {
    const p = JSON.parse(json);
    const duration = p.d || 210;
    const scores: Record<string, number> = {};
    CHALLENGE_IDS.forEach((id, i) => (scores[id] = Math.max(0, Math.min(checksIn(id), Number(p.s?.[i]) || 0))));
    const bubbles = (p.b || []).map((row: PackedBubble, i: number) => unpackBubble(row, i, duration));
    const submission = buildSubmission(p.n, new Date(p.t).toISOString(), scores, bubbles, duration, body.slice(dot + 1), '2');
    if (Array.isArray(p.e)) {
      submission.explanations = {};
      CHALLENGE_IDS.forEach((id, i) => {
        if (p.e[i]) submission.explanations![id] = String(p.e[i]);
      });
    }
    if (p.g && typeof p.g === 'object') {
      submission.songResults = {};
      for (const [id, row] of Object.entries(p.g as Record<string, any[]>)) {
        const [match, saw, revealedAt, placements] = row;
        submission.songResults[id] = { match: Number(match) || 0, sawAnswerFirst: saw === 1, revealedAt: Number(revealedAt) || 0, placements: placements || [] };
      }
    }
    return { success: true, isValidSignature: true, submission };
  } catch (err) {
    return { success: false, error: `Couldn't read this code: ${(err as Error).message}` };
  }
}

// Original (v1) format, kept so older submissions can still be opened.
function v1Signature(data: Omit<StudentSubmission, 'signature'>): string {
  const str = `${data.studentName}|${data.timestamp}|${data.totalStars}|${JSON.stringify(data.challengeScores)}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36).toUpperCase().padStart(8, '0');
}

function decodeV1(code: string): DecodeResult {
  try {
    const submission: StudentSubmission = JSON.parse(decodeURIComponent(atob(code.slice(PREFIX_V1.length))));
    if (!submission.studentName || submission.totalStars === undefined) {
      return { success: false, error: 'Missing required submission fields' };
    }
    const { signature, ...rest } = submission;
    return { success: true, submission, isValidSignature: signature === v1Signature(rest) };
  } catch (err) {
    return { success: false, error: `Couldn't read this code: ${(err as Error).message}` };
  }
}

export async function decodeStudentSubmission(code: string): Promise<DecodeResult> {
  const trimmed = code.trim().replace(/\s+/g, '');
  if (trimmed.startsWith(PREFIX_V2)) return decodeV2(trimmed);
  if (trimmed.startsWith(PREFIX_V1)) return decodeV1(trimmed);
  return { success: false, error: 'This doesn\'t look like a Mix Lab code (they start with "VML").' };
}

// ---------- batch roster ----------

/** Turn pasted HTML-ish text (tags, <br>, &nbsp;, invisible characters) into plain lines. */
export function cleanPastedText(text: string): string {
  const decode = (t: string) =>
    t
      .replace(/&nbsp;/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&amp;/gi, '&');
  return decode(decode(text))
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|tr|h\d)\s*>/gi, '\n')
    .replace(/<[^>]{0,200}>/g, ' ')
    .replace(/\\n/g, '\n')
    .replace(/[​-‍⁠﻿­]/g, '')
    .replace(/[   ]/g, ' ');
}

export interface RosterParseResult {
  rows: RosterStudentRow[];
  unreadable: string[];
  duplicatesRemoved: number;
}

function toRow(sub: StudentSubmission, rawCode: string): RosterStudentRow {
  const percentage = Math.round((sub.totalStars / (sub.maxStars || MAX_STARS)) * 100);
  const status: RosterStudentRow['status'] =
    sub.totalStars === sub.maxStars ? 'Perfect' : percentage < 70 ? 'Needs Review' : 'Passed';
  return {
    studentName: sub.studentName,
    timestamp: sub.timestamp,
    totalStars: sub.totalStars,
    maxStars: sub.maxStars,
    percentage,
    status,
    rawCode,
    submission: sub,
  };
}

/**
 * Pull every Mix Lab code out of pasted text and read it. Copes with what Google Classroom
 * and spreadsheets paste: names, "Turned in", HTML tags, &nbsp;, invisible characters,
 * text glued to either end of a code, and codes broken across lines.
 */
export async function parseBatchRoster(batchInput: string): Promise<RosterParseResult> {
  const text = cleanPastedText(batchInput);
  // Split into pieces made only of characters a code can contain.
  const pieces = text.split(/[^A-Za-z0-9_.+/=-]+/).filter(Boolean);

  const rows: RosterStudentRow[] = [];
  const unreadable: string[] = [];
  const seen = new Set<string>();
  let duplicatesRemoved = 0;

  const tryRead = async (candidate: string) => {
    if (candidate.startsWith(PREFIX_V2)) {
      // Text glued on after the checksum: try shorter tails (checksums are ≤ 7 characters).
      const dot = candidate.lastIndexOf('.');
      if (dot > 0) {
        const tail = (candidate.slice(dot + 1).match(/^[a-z0-9]{1,7}/) || [''])[0];
        for (let len = tail.length; len >= 1; len--) {
          const code = `${candidate.slice(0, dot)}.${tail.slice(0, len)}`;
          const res = await decodeV2(code);
          if (res.success) return { code, res };
        }
      }
      return null;
    }
    const res = decodeV1(candidate);
    return res.success ? { code: candidate, res } : null;
  };

  for (let i = 0; i < pieces.length; i++) {
    const start = pieces[i].search(/VML2?-/);
    if (start < 0) continue;
    const piece = pieces[i].slice(start);

    let found = await tryRead(piece);
    let used = 0;
    if (!found) {
      // A code broken across lines or spaces: join the next few pieces.
      let joined = piece;
      for (let j = 1; j <= 8 && i + j < pieces.length; j++) {
        if (/VML2?-/.test(pieces[i + j])) break; // the next student's code
        joined += pieces[i + j];
        found = await tryRead(joined);
        if (found) {
          used = j;
          break;
        }
      }
    }
    if (!found || !found.res.submission) {
      unreadable.push(`code starting ${piece.slice(0, 14)}…`);
      continue;
    }
    i += used;
    if (seen.has(found.code)) {
      duplicatesRemoved++;
      continue;
    }
    seen.add(found.code);
    rows.push(toRow(found.res.submission, found.code));
  }

  // Flag students who appear more than once (e.g. resubmitted) so the teacher can pick.
  const key = (r: RosterStudentRow) => r.studentName.trim().toLowerCase();
  const counts = new Map<string, number>();
  rows.forEach((r) => counts.set(key(r), (counts.get(key(r)) || 0) + 1));
  rows.forEach((r) => (r.hasMultipleSubmissions = (counts.get(key(r)) || 0) > 1));

  rows.sort((a, b) => a.studentName.localeCompare(b.studentName) || b.timestamp.localeCompare(a.timestamp));
  return { rows, unreadable, duplicatesRemoved };
}

export function generateRosterCSV(rows: RosterStudentRow[]): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const challengeHeaders = MIXING_CHALLENGES.map((c) => `${c.title.split(':')[0].replace('Challenge ', 'Ch. ')} %`);
  const songTitle = (t: { title: string }) => t.title.split(' (')[0];
  const songHeaders = EXAMPLE_TRACKS.map((t) => `Song: ${songTitle(t)} match %`);
  const explainHeaders = MIXING_CHALLENGES.map((c) => `${c.title.split(':')[0].replace('Challenge ', 'Ch. ')} explanation`);
  const headers = ['Student Name', ...challengeHeaders, 'Checks Passed', 'Total Checks', 'Overall %', 'Status', 'Submitted', 'Tracks in Mix', ...songHeaders, 'Saw answer before trying', ...explainHeaders];
  const lines = rows.map((r) =>
    [
      r.studentName,
      ...CHALLENGE_IDS.map((id) =>
        r.submission.version === '2' ? challengePercent(id, r.submission.challengeScores?.[id] ?? 0) : ''
      ),
      r.totalStars,
      r.maxStars,
      `${r.percentage}%`,
      r.status,
      new Date(r.timestamp).toLocaleString(),
      r.submission.sandboxSnapshot?.bubbles?.length ?? 0,
      ...EXAMPLE_TRACKS.map((t) => r.submission.songResults?.[t.id]?.match ?? ''),
      EXAMPLE_TRACKS.filter((t) => r.submission.songResults?.[t.id]?.sawAnswerFirst).map(songTitle).join('; '),
      ...CHALLENGE_IDS.map((id) => r.submission.explanations?.[id] ?? ''),
    ]
      .map(esc)
      .join(',')
  );
  return [headers.map(esc).join(','), ...lines].join('\n');
}
