/**
 * The mix as a 3D room (after David Gibson's "The Art of Mixing").
 *
 * World coordinates:
 *   X  pan        -1 (left wall) … +1 (right wall); bubbles use ±PAN_WORLD so they never sit in a wall
 *   Y  frequency   0 (floor = 20 Hz) … HR (ceiling = 20 kHz), log scale like an EQ
 *   Z  depth       0 (front, loud) … DR (back wall, quiet)
 *
 * Everything here is plain math with no React, so the stage component stays readable.
 */
import { SoundBubble, PAN_LIMIT, clampPan, ViewMode } from '../types';

export type Vec3 = [number, number, number];
export interface Projected {
  x: number;
  y: number;
  /** Pixels per world unit at this point (bigger = closer to the camera). */
  s: number;
  /** Distance in front of the camera. */
  z: number;
}
export interface Camera {
  project: (p: Vec3) => Projected;
  pos: Vec3;
}

export const DR = 1.5;
export const PAN_WORLD = 0.86;

// ---------- Frequency bands ----------
export interface Band {
  name: string;
  hz: string;
  lo: number;
  hi: number;
  good: string;
  bad: string;
}
export const BANDS: Band[] = [
  { name: 'Sub', hz: '20–60 Hz', lo: 20, hi: 60, good: 'Rumble', bad: '' },
  { name: 'Lows/Bass', hz: '60–250 Hz', lo: 60, hi: 250, good: 'Punch', bad: 'Boomy' },
  { name: 'Low-Mids', hz: '250–500 Hz', lo: 250, hi: 500, good: 'Warm', bad: 'Muddy' },
  { name: 'Mids', hz: '500 Hz–2 kHz', lo: 500, hi: 2000, good: 'Full', bad: 'Boxy' },
  { name: 'Hi-Mids', hz: '2–6 kHz', lo: 2000, hi: 6000, good: 'Presence/Clarity', bad: 'Harshness' },
  { name: 'Highs', hz: '6–20 kHz', lo: 6000, hi: 20000, good: 'Airy', bad: 'Piercing' },
];

/** 0…1 position of a frequency on the log scale from 20 Hz to 20 kHz. */
export const fractionOfHz = (hz: number) => Math.log10(hz / 20) / 3;
/** Approximate frequency for a 0–100 bubble height. */
export const hzOfY = (y: number) => 20 * Math.pow(1000, Math.max(0, Math.min(100, y)) / 100);
export const formatHz = (hz: number) =>
  hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)} kHz` : `${Math.round(hz / 10) * 10} Hz`;
export const bandOfY = (y: number) => {
  const hz = hzOfY(y);
  return BANDS.find((b) => hz < b.hi) ?? BANDS[BANDS.length - 1];
};

// ---------- Room shape ----------
/** Room height follows the stage's shape so the front view fills the space. */
export function roomHeight(width: number, height: number): number {
  const usableW = Math.max(200, width - 16);
  const usableH = Math.max(200, height - 70);
  return Math.max(0.8, Math.min(1.6, (2 * usableH) / usableW));
}

// ---------- Bubbles in the room ----------
/** Depth comes from volume, as in the app: 100% volume = front, 0% = back wall. */
export const depthOf = (b: SoundBubble) => Math.max(0, Math.min(100, 100 - b.volume));

export function worldOf(b: SoundBubble, HR: number): Vec3 {
  return [(clampPan(b.x) / PAN_LIMIT) * PAN_WORLD, (Math.max(0, Math.min(100, b.y)) / 100) * HR, (depthOf(b) / 100) * DR];
}

/** Half-sizes of a bubble's ellipsoid: width = stereo spread, height = frequency span, plus real depth. */
export function axesOf(b: SoundBubble): Vec3 {
  const a = Math.max(20, b.width) / 1000;
  const h = Math.max(20, b.height) / 1000;
  const c = Math.max(Math.min(a, h), ((a + h) / 2) * 0.75);
  return [a, h, c];
}

// ---------- Vectors ----------
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// ---------- Cameras ----------
interface FitBox {
  width: number;
  height: number;
  pad: { l: number; r: number; t: number; b: number };
  points: Vec3[];
}

/** A pinhole camera, scaled and centered so `fit.points` fill the stage. */
function makeCamera(pos: Vec3, target: Vec3, fit: FitBox): Camera {
  const F = norm(sub(target, pos));
  const R = norm(cross([0, 1, 0], F));
  const U = cross(F, R);
  const raw = (p: Vec3) => {
    const v = sub(p, pos);
    const z = Math.max(1e-4, dot(v, F));
    return { x: dot(v, R) / z, y: -dot(v, U) / z, z };
  };
  const pts = fit.points.map(raw);
  const x0 = Math.min(...pts.map((p) => p.x));
  const x1 = Math.max(...pts.map((p) => p.x));
  const y0 = Math.min(...pts.map((p) => p.y));
  const y1 = Math.max(...pts.map((p) => p.y));
  const availW = Math.max(50, fit.width - fit.pad.l - fit.pad.r);
  const availH = Math.max(50, fit.height - fit.pad.t - fit.pad.b);
  const f = Math.min(availW / (x1 - x0), availH / (y1 - y0));
  const ox = fit.pad.l + availW / 2 - (f * (x0 + x1)) / 2;
  const oy = fit.pad.t + availH / 2 - (f * (y0 + y1)) / 2;
  return {
    pos,
    project: (p: Vec3) => {
      const r = raw(p);
      return { x: ox + f * r.x, y: oy + f * r.y, s: f / r.z, z: r.z };
    },
  };
}

const boxCorners = (HR: number): Vec3[] => {
  const out: Vec3[] = [];
  for (const x of [-1, 1]) for (const y of [0, HR]) for (const z of [0, DR]) out.push([x, y, z]);
  return out;
};

export function cameraFor(view: ViewMode, width: number, height: number, HR: number): Camera {
  if (view === 'front') {
    // Straight on from the listener's seat; the front opening fills the stage.
    return makeCamera([0, HR * 0.5, -1.18], [0, HR * 0.5, 1], {
      width,
      height,
      pad: { l: 4, r: 4, t: 8, b: 30 },
      points: [[-1, 0, 0], [1, 0, 0], [-1, HR, 0], [1, HR, 0]],
    });
  }
  if (view === 'top') {
    // High above the room, looking down at the floor plan: front of the room at the bottom.
    return makeCamera([0, 14, DR * 0.5 - 0.9], [0, 0, DR * 0.5], {
      width,
      height,
      pad: { l: 150, r: 24, t: 52, b: 34 },
      points: [[-1, 0, 0], [1, 0, 0], [-1, 0, DR], [1, 0, DR]],
    });
  }
  // 3D: up and to the left of the front corner, to see depth.
  return makeCamera([-2.0, HR * 1.35, -1.1], [0.1, HR * 0.42, DR * 0.55], {
    width,
    height,
    pad: { l: 20, r: 20, t: 40, b: 30 },
    points: boxCorners(HR),
  });
}

// ---------- Ellipsoid outline + lighting ----------
export interface Outline {
  rx: number;
  ry: number;
  /** Rotation of the outline in degrees. */
  rot: number;
  /** Half-width / half-height of the outline's bounding box. */
  bw: number;
  bh: number;
}

/** Outline of an ellipsoid (center + semi-axis vectors) as the camera sees it. */
export function outline(cam: Camera, c: Vec3, axes: Vec3[]): Outline {
  const p0 = cam.project(c);
  const e = 1e-3;
  let A = 0;
  let B = 0;
  let C = 0;
  for (const ax of axes) {
    const q = cam.project([c[0] + ax[0] * e, c[1] + ax[1] * e, c[2] + ax[2] * e]);
    const x = (q.x - p0.x) / e;
    const y = (q.y - p0.y) / e;
    A += x * x;
    B += x * y;
    C += y * y;
  }
  const tr = (A + C) / 2;
  const df = Math.sqrt(((A - C) / 2) ** 2 + B * B);
  const rx = Math.sqrt(tr + df);
  const ry = Math.sqrt(Math.max(tr - df, 1e-6));
  const th = 0.5 * Math.atan2(2 * B, A - C);
  const bw = Math.sqrt(rx * rx * Math.cos(th) ** 2 + ry * ry * Math.sin(th) ** 2);
  const bh = Math.sqrt(rx * rx * Math.sin(th) ** 2 + ry * ry * Math.cos(th) ** 2);
  return { rx, ry, rot: (th * 180) / Math.PI, bw, bh };
}

// One light, fixed in the room: above, in front, and to the right. It stays put while the
// camera moves, so in the Front view the balls are lit from the upper right, and in the 3D
// (corner) view you see their shadow side turn toward you — that's what makes them read as round.
// (It's deliberately NOT behind the camera: light from where you stand makes balls look flat.)
const LIGHT = norm([0.6, 0.85, -0.55]);

export interface Lighting {
  /** Brightest point of the body gradient, as 0–1 fractions of the (unrotated) outline box. */
  fx: number;
  fy: number;
  glint: { x: number; y: number };
  rings: { front: string; back: string }[];
  /** The light as seen from the camera, in the outline's own frame (x right, y down, z toward you). */
  view: Vec3;
}

export function lighting(cam: Camera, C: Vec3, [a, b, c]: Vec3, body: Outline, withRings: boolean): Lighting {
  const toCam = norm(sub(cam.pos, C));
  const surf = (dir: Vec3): Vec3 => {
    const u = norm([a * dir[0], b * dir[1], c * dir[2]]);
    return [C[0] + a * u[0], C[1] + b * u[1], C[2] + c * u[2]];
  };
  const p0 = cam.project(C);
  const r = (body.rot * Math.PI) / 180;
  const local = (q: Projected) => {
    const dx = q.x - p0.x;
    const dy = q.y - p0.y;
    return [(dx * Math.cos(r) + dy * Math.sin(r)) / body.rx, (-dx * Math.sin(r) + dy * Math.cos(r)) / body.ry];
  };
  const [lx, ly] = local(cam.project(surf(LIGHT)));
  const H = norm([LIGHT[0] + toCam[0], LIGHT[1] + toCam[1], LIGHT[2] + toCam[2]]);
  const sp = cam.project(surf(H));

  const ring = (fn: (t: number) => Vec3, nf: (t: number) => Vec3) => {
    let front = '';
    let back = '';
    let prev: boolean | null = null;
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      const P = fn(t);
      const q = cam.project(P);
      const n = nf(t);
      const vis = dot(n, sub(cam.pos, P)) > 0;
      const seg = `${prev === vis ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
      if (vis) front += seg;
      else back += seg;
      prev = vis;
    }
    return { front, back };
  };
  const rings = withRings
    ? [
        // equator: shows how the sphere is tilted toward you
        ring((t) => [C[0] + a * Math.cos(t), C[1], C[2] + c * Math.sin(t)], (t) => [Math.cos(t) / a, 0, Math.sin(t) / c]),
        // side meridian: shows its depth
        ring((t) => [C[0], C[1] + b * Math.cos(t), C[2] + c * Math.sin(t)], (t) => [0, Math.cos(t) / b, Math.sin(t) / c]),
      ]
    : [];
  // Light direction on screen: where a small step toward the light lands, plus how much it
  // points at the camera. Then turned into the outline's rotated frame for the sphere shader.
  const e = 1e-3;
  const pl = cam.project([C[0] + LIGHT[0] * e, C[1] + LIGHT[1] * e, C[2] + LIGHT[2] * e]);
  const sx = (pl.x - p0.x) / (e * p0.s);
  const sy = (pl.y - p0.y) / (e * p0.s);
  const sz = dot(LIGHT, toCam);
  const vlen = Math.hypot(sx, sy, sz) || 1;
  const view: Vec3 = [
    (sx * Math.cos(r) + sy * Math.sin(r)) / vlen,
    (-sx * Math.sin(r) + sy * Math.cos(r)) / vlen,
    sz / vlen,
  ];
  const clampF = (v: number) => Math.max(0.12, Math.min(0.88, v));
  return { fx: clampF(0.5 + lx * 0.5), fy: clampF(0.5 + ly * 0.5), glint: { x: sp.x, y: sp.y }, rings, view };
}

/**
 * Converts a screen drag into movement along two world axes at a point (front view: X & Y,
 * bird's-eye: X & Z), so a dragged bubble stays under the pointer at any depth.
 */
export function screenToWorldDelta(cam: Camera, at: Vec3, axisA: 0 | 1 | 2, axisB: 0 | 1 | 2) {
  const e = 1e-3;
  const p0 = cam.project(at);
  const step = (axis: number) => {
    const p: Vec3 = [...at] as Vec3;
    p[axis] += e;
    const q = cam.project(p);
    return [(q.x - p0.x) / e, (q.y - p0.y) / e];
  };
  const [ax, ay] = step(axisA);
  const [bx, by] = step(axisB);
  const det = ax * by - bx * ay || 1e-9;
  return (dx: number, dy: number): [number, number] => [(by * dx - bx * dy) / det, (-ay * dx + ax * dy) / det];
}

// ---------- The room's grid and wall labels ----------
export interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  o: number;
  w: number;
}
export interface GridPoly {
  points: string;
  o: number;
}
export interface GridLabel {
  x: number;
  y: number;
  text: string;
  size: number;
  weight: number;
  o: number;
  anchor: 'start' | 'middle' | 'end';
}

export function roomGrid(cam: Camera, view: ViewMode, HR: number) {
  const lines: GridLine[] = [];
  const polys: GridPoly[] = [];
  const labels: GridLabel[] = [];
  const P = cam.project;
  const L = (a: Vec3, b: Vec3, o: number, w = 1) => {
    const A = P(a);
    const B = P(b);
    lines.push({ x1: A.x, y1: A.y, x2: B.x, y2: B.y, o, w });
  };
  const poly = (pts: Vec3[], o: number) =>
    polys.push({ points: pts.map((p) => { const q = P(p); return `${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join(' '), o });
  const lab = (x: number, y: number, text: string, o = 0.8, size = 11.5, weight = 600, anchor: GridLabel['anchor'] = 'middle') =>
    labels.push({ x, y, text, o, size, weight, anchor });
  const center = (pts: Vec3[]) => pts.map(P).reduce((a, q) => ({ x: a.x + q.x / pts.length, y: a.y + q.y / pts.length }), { x: 0, y: 0 });

  // Bird's-eye: the floor plan, with Gibson's foreground / midground / background zones.
  function topLabels() {
    const zones: [string, string, number, number][] = [
      ['Foreground', 'lead vocal, kick, snare, bass', 0, 0.33],
      ['Midground', 'rhythm guitars, keys, backing vocals, other percussion', 0.33, 0.66],
      ['Background', 'pads, ambience, reverb returns', 0.66, 1],
    ];
    zones.forEach(([name, who, z0, z1], i) => {
      const pts: Vec3[] = [[-1, 0, z0 * DR], [1, 0, z0 * DR], [1, 0, z1 * DR], [-1, 0, z1 * DR]];
      poly(pts, i % 2 ? 0.05 : 0.025);
      const q = P([-1, 0, ((z0 + z1) / 2) * DR]);
      lab(q.x - 12, q.y - 4, name, 0.9, 12.5, 650, 'end');
      who.split(', ').reduce<string[]>((rows, w) => {
        const last = rows[rows.length - 1];
        if (last && (last + ', ' + w).length <= 18) rows[rows.length - 1] = last + ', ' + w;
        else rows.push(w);
        return rows;
      }, []).forEach((row, j) => lab(q.x - 12, q.y + 11 + j * 12, row, 0.5, 10, 500, 'end'));
    });
    ([['Left', -1], ['Center', 0], ['Right', 1]] as [string, number][]).forEach(([t, x]) => {
      const q = P([x * PAN_WORLD, 0, 0]);
      lab(q.x, q.y + 20, t, 0.8, 12);
    });
    ([['Front (loud)', 0.02], ['Back (quiet)', DR - 0.02]] as [string, number][]).forEach(([t, z]) => {
      const q = P([0.625, 0, z]);
      lab(q.x, q.y + (z < 0.1 ? -6 : 14), t, 0.6, 11);
    });
      return { lines, polys, labels };
  }

  // Depth lines: quarters in the room views; the three zone edges in bird's-eye.
  const zs = (view === 'top' ? [0, 0.33, 0.66, 1] : [0, 0.25, 0.5, 0.75, 1]).map((t) => t * DR);
  const xs = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
  const bandY = [0, ...BANDS.map((b) => fractionOfHz(b.hi) * HR)];
  const walls = view === '3d' ? [1] : [-1, 1];

  // floor
  xs.forEach((x) => L([x, 0, 0], [x, 0, DR], x === 0 ? 0.32 : Math.abs(x) === 1 ? 0.6 : 0.2, Math.abs(x) === 1 && view === 'top' ? 1.2 : 1));
  zs.forEach((z) => L([-1, 0, z], [1, 0, z], z === 0 || z === DR ? 0.6 : 0.2, z === 0 || z === DR ? 1.2 : 1));
  if (view === 'top') return topLabels();
  // back wall
  xs.forEach((x) => L([x, 0, DR], [x, HR, DR], Math.abs(x) === 1 ? 0.6 : 0.12, Math.abs(x) === 1 ? 1.2 : 1));
  bandY.forEach((y, i) => L([-1, y, DR], [1, y, DR], i === 0 ? 0.6 : 0.14));
  L([-1, HR, DR], [1, HR, DR], 0.6, 1.2);
  // side walls
  walls.forEach((x) => {
    bandY.forEach((y) => L([x, y, 0], [x, y, DR], 0.14));
    zs.forEach((z) => L([x, 0, z], [x, HR, z], z === 0 ? 0.55 : 0.12, z === 0 ? 1.2 : 1));
    L([x, HR, 0], [x, HR, DR], 0.55, 1.2);
  });
  if (view === 'front') {
    xs.forEach((x) => L([x, HR, 0], [x, HR, DR], 0.07));
    zs.forEach((z) => L([-1, HR, z], [1, HR, z], 0.08));
  }

  if (view !== 'top') {
    // Each frequency band gets its own box (name + Hz) and, opposite, what it sounds like.
    const bandBox = (y0: number, y1: number): Vec3[] =>
      view === 'front'
        ? [[-1, y1, 0], [-1, y1, DR * 0.3], [-1, y0, DR * 0.3], [-1, y0, 0]]
        : [[-1, y1, DR], [-0.62, y1, DR], [-0.62, y0, DR], [-1, y0, DR]];
    const descBox = (y0: number, y1: number): Vec3[] => [[1, y1, DR * 0.3], [1, y1, 0], [1, y0, 0], [1, y0, DR * 0.3]];
    BANDS.forEach((band, i) => {
      const y0 = bandY[i];
      const y1 = bandY[i + 1];
      const box = bandBox(y0, y1);
      poly(box, i % 2 ? 0.07 : 0.035);
      let c = center(box);
      lab(c.x, c.y - 2, band.name, 0.9, 11.5);
      lab(c.x, c.y + 12, band.hz, 0.55, 10, 500);
      const d = descBox(y0, y1);
      poly(d, i % 2 ? 0.07 : 0.035);
      c = center(d);
      if (band.bad) {
        lab(c.x, c.y - 2, band.good, 0.9, 11.5);
        lab(c.x, c.y + 12, `vs. ${band.bad}`, 0.55, 10.5, 500);
      } else {
        lab(c.x, c.y + 4, band.good, 0.9, 11.5);
      }
    });
    // pan along the front edge of the floor, depth one box in from the right wall
    ([['Left', -1], ['Center', 0], ['Right', 1]] as [string, number][]).forEach(([t, x]) => {
      const q = P([x * PAN_WORLD, 0, 0]);
      lab(q.x, q.y + 20, t, 0.8, 12);
    });
    ([['Front', 0.125], ['Back', 0.875]] as [string, number][]).forEach(([t, z]) => {
      const q = P([0.625, 0, z * DR]);
      lab(q.x, q.y + 4, t, 0.6, 11);
    });
  }
  return { lines, polys, labels };
}
