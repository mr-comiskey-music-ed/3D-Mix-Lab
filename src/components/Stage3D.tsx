import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ViewMode, ThemeMode, SoundBubble, PAN_LIMIT, clampPan } from '../types';
import { getFrequencyAssessment } from '../utils/frequencyAssessment';
import {
  Camera,
  DR,
  PAN_WORLD,
  Vec3,
  axesOf,
  cameraFor,
  depthOf,
  lighting,
  outline,
  roomGrid,
  roomHeight,
  screenToWorldDelta,
  worldOf,
} from '../stage/roomMath';

interface Stage3DProps {
  bubbles: SoundBubble[];
  selectedId: string | null;
  selectedIds?: string[];
  onSelectBubble: (id: string | null, isMulti?: boolean) => void;
  onSelectMultiple?: (ids: string[]) => void;
  onUpdateBubble: (updated: SoundBubble) => void;
  onUpdateBubbles?: (updated: SoundBubble[]) => void;
  onDuplicateBubble: (id: string) => void;
  onDuplicateBubbles?: (ids: string[]) => void;
  onDeleteBubble: (id: string) => void;
  onDeleteBubbles?: (ids: string[]) => void;
  onAddBubble?: (template: any) => void;
  viewMode: ViewMode;
  theme: ThemeMode;
  currentTime: number;
  readOnly?: boolean;
  onToggleSolo?: (id: string) => void;
  onToggleMute?: (id: string) => void;
  /**
   * Answer overlay ("Diagram a Song"): where each sound sits in the reference mix.
   * Drawn as dashed outlines, with a line from the matching sound (same id) to its spot.
   */
  ghostBubbles?: SoundBubble[];
  /** Show the frequency-guidance "!" badges (off for ear-training). */
  showGuidance?: boolean;
}

// ---------- Look ----------
const THEMES = {
  dark: {
    bgInner: '#0f1830',
    bgOuter: '#04060d',
    line: '#4fb4ff',
    label: '#9fd2ff',
    text: '#f6f8fc',
    halo: 'rgba(4,6,14,0.85)',
    blend: 'screen' as const,
    glowLines: true,
    bloom: 1,
    chip: 'bg-slate-950/80 border-slate-800 text-slate-200',
  },
  light: {
    bgInner: '#f8fafd',
    bgOuter: '#dde5f1',
    line: '#2b5cb8',
    label: '#1e3a8a',
    text: '#0f172a',
    halo: 'rgba(255,255,255,0.92)',
    blend: 'normal' as const,
    glowLines: false,
    bloom: 0.55,
    chip: 'bg-white/90 border-slate-200 text-slate-800 shadow-sm',
  },
};

const VIEW_HINT: Record<ViewMode, string> = {
  front: 'Front view · drag to set pan & frequency',
  top: "Bird's-eye view · drag to set pan & depth (volume)",
  '3d': '3D view · look only — move sounds in Front or Bird’s-eye',
};

// ---------- Small helpers ----------
const hex = (h: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
  const v = m ? m[1] : '888888';
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};
const mix = (h: string, to: string, amt: number) => {
  const a = hex(h);
  const b = hex(to);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * amt)).join(',')})`;
};
const seeded = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};
const hashId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 10000;
};

/** Ellipse outline as a path; `fuzz` adds the fine wavy edge used for saturation. */
function bodyPath(cx: number, cy: number, rx: number, ry: number, fuzz: number) {
  const n = Math.max(60, Math.min(180, Math.round((rx + ry) * 1.2)));
  const teeth = Math.round((rx + ry) / 5);
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const w = fuzz ? fuzz * (0.55 * Math.sin(t * teeth) + 0.45 * Math.sin(t * teeth * 2.3)) : 0;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(t) * (rx + w)).toFixed(1)} ${(cy + Math.sin(t) * (ry + w)).toFixed(1)}`;
  }
  return d + 'Z';
}

// A tiny tile of film grain, made once, used as a pattern inside saturated sounds.
let grainUrl: string | null = null;
function getGrainUrl() {
  if (grainUrl !== null) return grainUrl;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 96;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(96, 96);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() > 0.5 ? 255 : 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 140;
    }
    ctx.putImageData(img, 0, 0);
    grainUrl = c.toDataURL();
  } catch {
    grainUrl = '';
  }
  return grainUrl;
}

// A single region from 0:00 to the default song length (3:30) means "plays the whole song",
// so it stays on even when the loaded song is longer than 3:30.
const DEFAULT_SONG_LENGTH = 210;
const isActiveAt = (b: SoundBubble, t: number) =>
  !b.regions ||
  b.regions.length === 0 ||
  (b.regions.length === 1 && b.regions[0].start <= 0 && b.regions[0].end >= DEFAULT_SONG_LENGTH - 0.5) ||
  b.regions.some((r) => t >= r.start && t <= r.end);

interface Drawn {
  b: SoundBubble;
  C: Vec3;
  axes: Vec3;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  bw: number;
  bh: number;
  depthZ: number;
  fade: number;
  floor: { x: number; y: number; rx: number; ry: number; rot: number } | null;
  drift: { x: number; y: number };
  light: ReturnType<typeof lighting>;
  scale: number;
}

const Stage3DInner: React.FC<Stage3DProps> = ({
  bubbles,
  selectedId,
  selectedIds,
  onSelectBubble,
  onSelectMultiple,
  onUpdateBubble,
  onUpdateBubbles,
  onDuplicateBubble,
  onDuplicateBubbles,
  onAddBubble,
  viewMode,
  theme,
  currentTime,
  readOnly = false,
  onToggleSolo,
  onToggleMute,
  ghostBubbles,
  showGuidance = true,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDragPos = useRef<{ clientX: number; clientY: number } | null>(null);
  const [dims, setDims] = useState({ width: 900, height: 600 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const T = THEMES[theme === 'light' ? 'light' : 'dark'];

  const currentSelectedIds = selectedIds && selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : [];
  const canEdit = !readOnly && viewMode !== '3d';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setDims({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------- Camera + room ----------
  const HR = roomHeight(dims.width, dims.height);
  const cam: Camera = useMemo(() => cameraFor(viewMode, dims.width, dims.height, HR), [viewMode, dims.width, dims.height, HR]);
  const grid = useMemo(() => roomGrid(cam, viewMode, HR), [cam, viewMode, HR]);

  // ---------- Sounds as the camera sees them ----------
  const drawn: Drawn[] = useMemo(() => {
    const sFront = cam.project([0, HR / 2, 0]).s;
    const sBack = cam.project([0, HR / 2, DR]).s;
    return bubbles
      .map((b) => {
        const C = worldOf(b, HR);
        const axes = axesOf(b);
        const p = cam.project(C);
        const body = outline(cam, C, [[axes[0], 0, 0], [0, axes[1], 0], [0, 0, axes[2]]]);
        const fl = cam.project([C[0], 0, C[2]]);
        const sh = outline(cam, [C[0], 0, C[2]], [[axes[0] * 0.9, 0, 0], [0, 0, axes[2] * 0.9]]);
        const bk = cam.project([C[0], C[1], C[2] + 0.8]);
        const t = Math.max(0, Math.min(1, (p.s - sBack) / (sFront - sBack || 1)));
        return {
          b,
          C,
          axes,
          cx: p.x,
          cy: p.y,
          rx: body.rx,
          ry: body.ry,
          rot: body.rot,
          bw: body.bw,
          bh: body.bh,
          depthZ: p.z,
          fade: 0.55 + 0.45 * t,
          floor: viewMode === 'top' ? null : { x: fl.x, y: fl.y, rx: sh.rx, ry: sh.ry, rot: sh.rot },
          drift: { x: (bk.x - p.x) * 0.5, y: (bk.y - p.y) * 0.5 },
          light: lighting(cam, C, axes, body, true),
          scale: Math.min(1.1, p.s / sFront + 0.15),
        };
      })
      .sort((a, b) => b.depthZ - a.depthZ); // far first, near last (on top)
  }, [bubbles, cam, HR, viewMode]);

  // Answer overlay positions (same projection as the sounds themselves)
  const ghosts = useMemo(
    () =>
      (ghostBubbles || []).map((b) => {
        const C = worldOf(b, HR);
        const axes = axesOf(b);
        const p = cam.project(C);
        const body = outline(cam, C, [[axes[0], 0, 0], [0, axes[1], 0], [0, 0, axes[2]]]);
        return { b, cx: p.x, cy: p.y, rx: body.rx, ry: body.ry, rot: body.rot };
      }),
    [ghostBubbles, cam, HR]
  );

  const anySolo = bubbles.some((b) => b.solo);
  const isDimmed = (b: SoundBubble) => !isActiveAt(b, currentTime) || !!b.mute || (anySolo && !b.solo);

  // ---------- Interaction state ----------
  const [dragState, setDragState] = useState<{
    ids: string[];
    startX: number;
    startY: number;
    init: Record<string, { x: number; y: number; depth: number; map: (dx: number, dy: number) => [number, number] }>;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    id: string;
    handle: 'left' | 'right' | 'top' | 'bottom';
    startX: number;
    startY: number;
    initW: number;
    initH: number;
    map: (dx: number, dy: number) => [number, number];
  } | null>(null);
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isShift: boolean;
    initial: string[];
  } | null>(null);
  const [snapDepth, setSnapDepth] = useState<number | null>(null);

  const handleBubblePointerDown = (e: React.PointerEvent, b: SoundBubble) => {
    e.stopPropagation();
    if (!canEdit) {
      onSelectBubble(b.id, e.shiftKey);
      return;
    }
    if (e.altKey) {
      if (currentSelectedIds.includes(b.id) && currentSelectedIds.length > 1) {
        if (onDuplicateBubbles) onDuplicateBubbles(currentSelectedIds);
        else currentSelectedIds.forEach((id) => onDuplicateBubble(id));
      } else {
        onDuplicateBubble(b.id);
      }
      return;
    }
    let ids: string[];
    if (e.shiftKey) {
      ids = currentSelectedIds.includes(b.id) ? currentSelectedIds.filter((id) => id !== b.id) : [...currentSelectedIds, b.id];
      if (onSelectMultiple) onSelectMultiple(ids);
      else onSelectBubble(b.id, true);
    } else if (currentSelectedIds.includes(b.id) && currentSelectedIds.length > 1) {
      ids = currentSelectedIds; // keep the group for a group drag
    } else {
      ids = [b.id];
      if (onSelectMultiple) onSelectMultiple(ids);
      else onSelectBubble(b.id, false);
    }
    const init: Record<string, { x: number; y: number; depth: number; map: (dx: number, dy: number) => [number, number] }> = {};
    bubbles
      .filter((x) => ids.includes(x.id))
      .forEach((x) => {
        init[x.id] = {
          x: x.x,
          y: x.y,
          depth: depthOf(x),
          map: screenToWorldDelta(cam, worldOf(x, HR), 0, viewMode === 'top' ? 2 : 1),
        };
      });
    setDragState({ ids, startX: e.clientX, startY: e.clientY, init });
  };

  const handleResizePointerDown = (e: React.PointerEvent, d: Drawn, handle: 'left' | 'right' | 'top' | 'bottom') => {
    if (!canEdit || viewMode !== 'front') return;
    e.stopPropagation();
    setResizeState({
      id: d.b.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initW: d.b.width,
      initH: d.b.height,
      map: screenToWorldDelta(cam, d.C, 0, 1),
    });
  };

  useEffect(() => {
    if (!dragState && !resizeState && !marquee) return;
    const onMove = (e: PointerEvent) => {
      if (dragState) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        let snapped: number | null = null;
        const updated: SoundBubble[] = [];
        dragState.ids.forEach((id) => {
          const b = bubbles.find((x) => x.id === id);
          const init = dragState.init[id];
          if (!b || !init) return;
          const [dA, dB] = init.map(dx, dy);
          let x = clampPan(init.x + (dA / PAN_WORLD) * PAN_LIMIT);
          if (Math.abs(x) <= 1.8) {
            x = 0;
            snapped = depthOf(b);
          }
          if (viewMode === 'top') {
            const depth = Math.round(Math.max(0, Math.min(100, init.depth + (dB / DR) * 100)));
            updated.push({ ...b, x, z: depth, volume: 100 - depth });
          } else {
            const y = Math.round(Math.max(0, Math.min(100, init.y + (dB / HR) * 100)));
            updated.push({ ...b, x, y });
          }
        });
        setSnapDepth(snapped);
        if (updated.length) {
          if (onUpdateBubbles) onUpdateBubbles(updated);
          else updated.forEach((u) => onUpdateBubble(u));
        }
      } else if (resizeState) {
        const b = bubbles.find((x) => x.id === resizeState.id);
        if (!b) return;
        const [dX, dY] = resizeState.map(e.clientX - resizeState.startX, e.clientY - resizeState.startY);
        let w = resizeState.initW;
        let h = resizeState.initH;
        if (resizeState.handle === 'right') w += dX * 1000;
        if (resizeState.handle === 'left') w -= dX * 1000;
        if (resizeState.handle === 'top') h += dY * 1000;
        if (resizeState.handle === 'bottom') h -= dY * 1000;
        onUpdateBubble({
          ...b,
          width: Math.round(Math.max(20, Math.min(600, w))),
          height: Math.round(Math.max(20, Math.min(300, h))),
        });
      } else if (marquee && containerRef.current) {
        setMarquee((m) => (m ? { ...m, currentX: e.clientX, currentY: e.clientY } : null));
        if (Math.hypot(e.clientX - marquee.startX, e.clientY - marquee.startY) > 5) {
          const rect = containerRef.current.getBoundingClientRect();
          const l = Math.min(marquee.startX, e.clientX) - rect.left;
          const t = Math.min(marquee.startY, e.clientY) - rect.top;
          const r = l + Math.abs(e.clientX - marquee.startX);
          const btm = t + Math.abs(e.clientY - marquee.startY);
          const hit = drawn
            .filter((d) => !(d.cx + d.bw < l || d.cx - d.bw > r || d.cy + d.bh < t || d.cy - d.bh > btm))
            .map((d) => d.b.id);
          const combined = marquee.isShift ? Array.from(new Set([...marquee.initial, ...hit])) : hit;
          if (onSelectMultiple) onSelectMultiple(combined);
          else if (combined.length) onSelectBubble(combined[0]);
        }
      }
    };
    const onUp = () => {
      if (marquee && Math.hypot(marquee.currentX - marquee.startX, marquee.currentY - marquee.startY) <= 5) {
        if (onSelectMultiple) onSelectMultiple([]);
        else onSelectBubble(null);
      }
      setMarquee(null);
      setDragState(null);
      setResizeState(null);
      setSnapDepth(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragState, resizeState, marquee, bubbles, drawn, viewMode, HR, onUpdateBubble, onUpdateBubbles, onSelectMultiple, onSelectBubble]);

  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || readOnly) return;
    const target = e.target as Element;
    if (target.closest('button') || target.closest('[data-no-marquee="true"]')) return;
    setMarquee({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isShift: e.shiftKey,
      initial: e.shiftKey ? currentSelectedIds : [],
    });
  };

  // Drop an instrument from the palette where the pointer is (at its starting depth).
  const handleStageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw || !onAddBubble) return;
      const item = JSON.parse(raw);
      if (!item || !item.name) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || viewMode === '3d') {
        onAddBubble(item);
        return;
      }
      const clientX = e.clientX || lastDragPos.current?.clientX || rect.left + rect.width / 2;
      const clientY = e.clientY || lastDragPos.current?.clientY || rect.top + rect.height / 2;
      const depth = 100 - (item.volume ?? 80);
      const startY = typeof item.y === 'number' ? item.y : 60;
      const anchor: Vec3 = [0, (startY / 100) * HR, (depth / 100) * DR];
      const p0 = cam.project(anchor);
      const map = screenToWorldDelta(cam, anchor, 0, viewMode === 'top' ? 2 : 1);
      const [dA, dB] = map(clientX - rect.left - p0.x, clientY - rect.top - p0.y);
      const x = clampPan((dA / PAN_WORLD) * PAN_LIMIT);
      if (viewMode === 'top') {
        const d = Math.round(Math.max(0, Math.min(100, depth + (dB / DR) * 100)));
        onAddBubble({ ...item, x, y: startY, volume: 100 - d });
      } else {
        onAddBubble({ ...item, x, y: Math.round(Math.max(0, Math.min(100, startY + (dB / HR) * 100))) });
      }
    } catch (err) {
      console.error('Failed to drop instrument onto stage', err);
    }
  };

  // ---------- Name placement (nearest first; centered, then below, then above) ----------
  const labelSpots = useMemo(() => {
    const placed: { l: number; r: number; t: number; b: number }[] = [];
    const out: Record<string, { y: number; inside: boolean }> = {};
    [...drawn].reverse().forEach((d) => {
      const size = 11 + d.scale * 2.2;
      const w = d.b.name.length * size * 0.56;
      const fitsInside = w <= d.bw * 1.75 && d.bh > size;
      const options = [
        ...(fitsInside ? [{ y: d.cy + size * 0.36, inside: true }] : []),
        { y: d.cy + d.bh + size + 3, inside: false },
        { y: d.cy - d.bh - 7, inside: false },
        { y: d.cy + d.bh + size * 2 + 6, inside: false },
      ];
      let pick = options[0];
      for (const o of options) {
        const box = { l: d.cx - w / 2 - 3, r: d.cx + w / 2 + 3, t: o.y - size, b: o.y + 3 };
        if (!placed.some((p) => box.l < p.r && p.l < box.r && box.t < p.b && p.t < box.b)) {
          pick = o;
          break;
        }
      }
      placed.push({ l: d.cx - w / 2 - 3, r: d.cx + w / 2 + 3, t: pick.y - size, b: pick.y + 3 });
      out[d.b.id] = pick;
    });
    return out;
  }, [drawn]);

  const grain = getGrainUrl();
  const snapLine = useMemo(() => {
    if (snapDepth === null) return null;
    if (viewMode === 'top') {
      const a = cam.project([0, 0, 0]);
      const b = cam.project([0, 0, DR]);
      return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
    }
    const z = (snapDepth / 100) * DR;
    const a = cam.project([0, 0, z]);
    const b = cam.project([0, HR, z]);
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }, [snapDepth, cam, viewMode, HR]);

  const marqueeBox =
    marquee && containerRef.current && Math.hypot(marquee.currentX - marquee.startX, marquee.currentY - marquee.startY) > 5
      ? (() => {
          const rect = containerRef.current!.getBoundingClientRect();
          return {
            left: Math.min(marquee.startX, marquee.currentX) - rect.left,
            top: Math.min(marquee.startY, marquee.currentY) - rect.top,
            width: Math.abs(marquee.currentX - marquee.startX),
            height: Math.abs(marquee.currentY - marquee.startY),
          };
        })()
      : null;

  const singleSelected =
    canEdit && viewMode === 'front' && currentSelectedIds.length === 1 ? drawn.find((d) => d.b.id === currentSelectedIds[0]) : undefined;

  return (
    <div
      ref={containerRef}
      id="mix-diagram-stage"
      onPointerDown={handleStagePointerDown}
      onDragOver={(e) => {
        e.preventDefault();
        lastDragPos.current = { clientX: e.clientX, clientY: e.clientY };
      }}
      onDrop={handleStageDrop}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: `radial-gradient(ellipse at 50% 44%, ${T.bgInner} 0%, ${T.bgOuter} 75%)` }}
    >
      <svg
        width={dims.width}
        height={dims.height}
        className="absolute inset-0"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        <defs>
          <radialGradient id={`${uid}-glint`}>
            <stop offset="0%" stopColor="#fff" stopOpacity={0.75} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          {grain && (
            <pattern id={`${uid}-grain`} width="96" height="96" patternUnits="userSpaceOnUse">
              <image href={grain} width="96" height="96" />
            </pattern>
          )}
          {drawn.map((d) => {
            const { b } = d;
            const C = b.compression / 100;
            const S = b.saturation / 100;
            const hot = mix(b.color, '#ffffff', 0.45 + S * 0.3);
            const rim = mix(b.color, '#ffffff', 0.55);
            return (
              <React.Fragment key={b.id}>
                {/* Body: lit from the front; color holds most of the way out, then a thin dark edge. */}
                <radialGradient
                  id={`${uid}-body-${b.id}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx={`${(d.light.fx * 100).toFixed(1)}%`}
                  fy={`${(d.light.fy * 100).toFixed(1)}%`}
                >
                  <stop offset="0%" stopColor={hot} stopOpacity={0.66 + C * 0.24} />
                  <stop offset="45%" stopColor={b.color} stopOpacity={0.55 + C * 0.3} />
                  <stop offset="78%" stopColor={mix(b.color, '#000000', 0.12)} stopOpacity={0.55 + C * 0.3} />
                  <stop offset="93%" stopColor={mix(b.color, '#000000', 0.62)} stopOpacity={0.62 + C * 0.3} />
                  <stop offset="100%" stopColor={rim} stopOpacity={0.7 + C * 0.3} />
                </radialGradient>
                <radialGradient id={`${uid}-bloom-${b.id}`}>
                  <stop offset="35%" stopColor={b.color} stopOpacity={(0.34 + (b.reverb / 100) * 0.26) * T.bloom} />
                  <stop offset="100%" stopColor={b.color} stopOpacity={0} />
                </radialGradient>
                <radialGradient id={`${uid}-shadow-${b.id}`}>
                  <stop offset="0%" stopColor={b.color} stopOpacity={theme === 'light' ? 0.35 : 0.55} />
                  <stop offset="100%" stopColor={b.color} stopOpacity={0} />
                </radialGradient>
                {S > 0.08 && (
                  <clipPath id={`${uid}-clip-${b.id}`}>
                    <ellipse cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} transform={`rotate(${d.rot} ${d.cx} ${d.cy})`} />
                  </clipPath>
                )}
              </React.Fragment>
            );
          })}
        </defs>

        {/* The room */}
        <g pointerEvents="none">
          {grid.polys.map((p, i) => (
            <polygon key={i} points={p.points} fill={T.line} opacity={p.o} />
          ))}
          {T.glowLines &&
            grid.lines.map((l, i) => (
              <line key={`g${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={T.line} strokeOpacity={l.o * 0.22} strokeWidth={l.w * 4} />
            ))}
          {grid.lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={T.line} strokeOpacity={l.o} strokeWidth={l.w} />
          ))}
          {grid.labels.map((l, i) => (
            <text key={i} x={l.x} y={l.y} textAnchor={l.anchor} fontSize={l.size} fontWeight={l.weight} fill={T.label} fillOpacity={l.o}>
              {l.text}
            </text>
          ))}
        </g>

        {snapLine && <line {...snapLine} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 3" pointerEvents="none" />}

        {/* Sounds, far to near */}
        {drawn.map((d) => {
          const { b } = d;
          const dimmed = isDimmed(b);
          const R = b.reverb / 100;
          const C = b.compression / 100;
          const S = b.saturation / 100;
          const rim = mix(b.color, theme === 'light' ? '#000000' : '#ffffff', theme === 'light' ? 0.25 : 0.55);
          const light = mix(b.color, '#ffffff', 0.3);
          const fuzz = S > 0.25 ? (S - 0.25) * Math.min(d.rx, d.ry) * 0.09 : 0;
          const path = bodyPath(d.cx, d.cy, d.rx, d.ry, fuzz);
          const rot = `rotate(${d.rot.toFixed(2)} ${d.cx.toFixed(1)} ${d.cy.toFixed(1)})`;
          const seed = hashId(b.id);
          const particles = !dimmed && R > 0.05 ? Math.round(R * 40) : 0;
          return (
            <g key={b.id} opacity={dimmed ? 0.18 : d.fade} style={{ mixBlendMode: T.blend }} pointerEvents="none">
              {d.floor && (
                <>
                  <line x1={d.cx} y1={d.cy + d.bh} x2={d.floor.x} y2={d.floor.y} stroke={light} strokeOpacity={0.25} strokeDasharray="2 4" />
                  <ellipse
                    cx={d.floor.x}
                    cy={d.floor.y}
                    rx={d.floor.rx}
                    ry={Math.max(2, d.floor.ry)}
                    transform={`rotate(${d.floor.rot.toFixed(2)} ${d.floor.x.toFixed(1)} ${d.floor.y.toFixed(1)})`}
                    fill={`url(#${uid}-shadow-${b.id})`}
                  />
                </>
              )}
              {/* Reverb: a glow plus a cloud of particles drifting back into the room */}
              <ellipse
                cx={d.cx}
                cy={d.cy}
                rx={d.rx * (1.35 + R * 0.55)}
                ry={d.ry * (1.35 + R * 0.55)}
                transform={rot}
                fill={`url(#${uid}-bloom-${b.id})`}
              />
              {Array.from({ length: particles }).map((_, i) => {
                const a = seeded(seed * 31 + i) * Math.PI * 2;
                const dist = 1.1 + Math.pow(seeded(seed * 17 + i), 1.4) * (0.6 + R * 1.6);
                const back = seeded(seed * 7 + i) * R;
                const px = d.cx + Math.cos(a) * d.bw * dist + d.drift.x * back;
                const py = d.cy + Math.sin(a) * d.bh * dist * 0.9 + d.drift.y * back;
                return (
                  <circle
                    key={i}
                    cx={px.toFixed(1)}
                    cy={py.toFixed(1)}
                    r={((0.8 + seeded(i * 3 + seed) * 2.2) * d.scale).toFixed(2)}
                    fill={seeded(i + seed * 5) > 0.4 ? light : theme === 'light' ? b.color : '#ffffff'}
                    opacity={Math.max(0.1, 0.85 - (dist - 1) * 0.35)}
                  />
                );
              })}
              {/* Body */}
              <path d={path} fill={`url(#${uid}-body-${b.id})`} transform={rot} />
              {/* Saturation: grain inside + a warm, fuzzy edge */}
              {S > 0.08 && grain && (
                <rect
                  x={d.cx - d.bw - 4}
                  y={d.cy - d.bh - 4}
                  width={d.bw * 2 + 8}
                  height={d.bh * 2 + 8}
                  fill={`url(#${uid}-grain)`}
                  clipPath={`url(#${uid}-clip-${b.id})`}
                  opacity={0.06 + S * 0.22}
                />
              )}
              {S > 0.3 && (
                <>
                  <path d={path} transform={rot} fill="none" stroke={mix(b.color, '#fff1c2', 0.55)} strokeOpacity={S * 0.22} strokeWidth={4 + S * 7} />
                  <path d={path} transform={rot} fill="none" stroke={mix(b.color, '#fff1c2', 0.55)} strokeOpacity={S * 0.45} strokeWidth={1.5 + S * 2} />
                </>
              )}
              {/* Specular glint where the light hits */}
              <ellipse
                cx={d.light.glint.x}
                cy={d.light.glint.y}
                rx={Math.min(d.rx, d.ry) * 0.3}
                ry={Math.min(d.rx, d.ry) * 0.17}
                fill={`url(#${uid}-glint)`}
                opacity={0.55}
              />
              {/* Gridlines on the sphere show which way it's turned */}
              {d.light.rings.map((r, i) => (
                <React.Fragment key={i}>
                  {r.back && <path d={r.back} fill="none" stroke={rim} strokeWidth={0.8} opacity={viewMode === 'front' ? 0.08 : 0.14} />}
                  {r.front && <path d={r.front} fill="none" stroke={rim} strokeWidth={1} opacity={viewMode === 'front' ? 0.22 : 0.4} />}
                </React.Fragment>
              ))}
              {/* Compression: a firmer, brighter shell */}
              <path
                d={path}
                transform={rot}
                fill="none"
                stroke={rim}
                strokeWidth={(0.8 + C * 2.2) * Math.max(0.7, d.scale)}
                strokeOpacity={0.35 + C * 0.6}
              />
            </g>
          );
        })}

        {/* Selection outlines */}
        {drawn
          .filter((d) => currentSelectedIds.includes(d.b.id))
          .map((d) => (
            <ellipse
              key={`sel-${d.b.id}`}
              cx={d.cx}
              cy={d.cy}
              rx={d.rx + 7}
              ry={d.ry + 7}
              transform={`rotate(${d.rot} ${d.cx} ${d.cy})`}
              fill="none"
              stroke={theme === 'light' ? '#4f46e5' : '#a5b4fc'}
              strokeWidth={1.6}
              strokeDasharray="5 4"
              pointerEvents="none"
            />
          ))}

        {/* Hit areas (nearest on top) */}
        {drawn.map((d) => (
          <ellipse
            key={`hit-${d.b.id}`}
            id={`bubble-node-${d.b.id}`}
            cx={d.cx}
            cy={d.cy}
            rx={Math.max(10, d.rx)}
            ry={Math.max(10, d.ry)}
            transform={`rotate(${d.rot} ${d.cx} ${d.cy})`}
            fill="transparent"
            pointerEvents="all"
            style={{ cursor: canEdit ? (dragState ? 'grabbing' : 'grab') : 'pointer' }}
            onPointerDown={(e) => handleBubblePointerDown(e, d.b)}
            onClick={(e) => e.stopPropagation()}
            onPointerEnter={() => setHoverId(d.b.id)}
            onPointerLeave={() => setHoverId((h) => (h === d.b.id ? null : h))}
          />
        ))}

        {/* Answer overlay: dashed outline where each sound sits in the song, linked to the student's sound */}
        {ghosts.length > 0 && (
          <g pointerEvents="none">
            {ghosts.map((g) => {
              const mine = drawn.find((d) => d.b.id === g.b.id);
              return (
                <g key={`ghost-${g.b.id}`}>
                  {mine && (
                    <line
                      x1={mine.cx}
                      y1={mine.cy}
                      x2={g.cx}
                      y2={g.cy}
                      stroke={g.b.color}
                      strokeWidth={1.6}
                      strokeDasharray="3 4"
                      opacity={0.9}
                    />
                  )}
                  <ellipse
                    cx={g.cx}
                    cy={g.cy}
                    rx={Math.max(8, g.rx)}
                    ry={Math.max(8, g.ry)}
                    transform={`rotate(${g.rot} ${g.cx} ${g.cy})`}
                    fill={g.b.color}
                    fillOpacity={0.1}
                    stroke={g.b.color}
                    strokeWidth={2}
                    strokeDasharray="7 5"
                  />
                  <circle cx={g.cx} cy={g.cy} r={3.5} fill={g.b.color} />
                </g>
              );
            })}
          </g>
        )}

        {/* Names */}
        <g pointerEvents="none">
          {drawn.map((d) => (
            <text
              key={`lbl-${d.b.id}`}
              x={d.cx}
              y={labelSpots[d.b.id]?.y ?? d.cy}
              textAnchor="middle"
              fontSize={11 + d.scale * 2.2}
              fontWeight={650}
              fill={T.text}
              opacity={isDimmed(d.b) ? 0.35 : 1}
              stroke={T.halo}
              strokeWidth={3.2}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {d.b.name}
            </text>
          ))}
        </g>

        {/* Badges: frequency guidance, notes, solo / mute */}
        {drawn.map((d) => {
          const { b } = d;
          const guidance = showGuidance ? getFrequencyAssessment(b) : null;
          const showSM =
            !!(onToggleSolo || onToggleMute) && (hoverId === b.id || currentSelectedIds.includes(b.id) || !!b.solo || !!b.mute);
          const spot = labelSpots[b.id];
          const smY = spot && !spot.inside ? spot.y + 6 : d.cy + d.bh + 4;
          return (
            <g key={`badge-${b.id}`} data-no-marquee="true">
              {guidance && (
                <g
                  transform={`translate(${(d.cx - d.bw * 0.72).toFixed(1)} ${(d.cy - d.bh * 0.72).toFixed(1)})`}
                  style={{ cursor: 'help' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelectBubble(b.id, false);
                  }}
                >
                  <title>{`${guidance.title}: ${guidance.message}\nRecommendation: ${guidance.recommendation}`}</title>
                  <circle r={7.5} fill="#e11d48" stroke="#fff" strokeWidth={1.2} />
                  <text y={3.6} textAnchor="middle" fontSize={10} fontWeight={900} fill="#fff">
                    !
                  </text>
                </g>
              )}
              {b.notes && b.notes.trim() && (
                <g
                  transform={`translate(${(d.cx + d.bw * 0.72).toFixed(1)} ${(d.cy - d.bh * 0.72).toFixed(1)})`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelectBubble(b.id, false);
                  }}
                >
                  <title>{`Track notes: ${b.notes}`}</title>
                  <circle r={6.5} fill="#fbbf24" stroke="#fff" strokeWidth={1} />
                  <rect x={-2.6} y={-3.2} width={5.2} height={6.4} rx={0.8} fill="none" stroke="#0f172a" strokeWidth={1.1} />
                </g>
              )}
              {showSM && (
                <g transform={`translate(${d.cx.toFixed(1)} ${smY.toFixed(1)})`}>
                  {onToggleSolo && (
                    <g
                      transform="translate(-19 0)"
                      style={{ cursor: 'pointer' }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerEnter={() => setHoverId(b.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSolo(b.id);
                      }}
                    >
                      <title>{b.solo ? 'Unsolo track' : 'Solo track'}</title>
                      <rect width={16} height={15} rx={3} fill={b.solo ? '#fbbf24' : 'rgba(15,23,42,0.9)'} stroke="rgba(255,255,255,0.25)" />
                      <text x={8} y={11} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={b.solo ? '#0f172a' : '#cbd5e1'}>
                        S
                      </text>
                    </g>
                  )}
                  {onToggleMute && (
                    <g
                      transform="translate(3 0)"
                      style={{ cursor: 'pointer' }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerEnter={() => setHoverId(b.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMute(b.id);
                      }}
                    >
                      <title>{b.mute ? 'Unmute track' : 'Mute track'}</title>
                      <rect width={16} height={15} rx={3} fill={b.mute ? '#ef4444' : 'rgba(15,23,42,0.9)'} stroke="rgba(255,255,255,0.25)" />
                      <text x={8} y={11} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={b.mute ? '#fff' : '#cbd5e1'}>
                        M
                      </text>
                    </g>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Resize handles: stereo width (left/right) and frequency span (top/bottom) */}
        {singleSelected &&
          (['left', 'right', 'top', 'bottom'] as const).map((h) => {
            const d = singleSelected;
            const [a, bb] = d.axes;
            const off: Vec3 = h === 'right' ? [a, 0, 0] : h === 'left' ? [-a, 0, 0] : h === 'top' ? [0, bb, 0] : [0, -bb, 0];
            const q = cam.project([d.C[0] + off[0], d.C[1] + off[1], d.C[2] + off[2]]);
            const horiz = h === 'left' || h === 'right';
            const w = horiz ? 8 : 20;
            const ht = horiz ? 20 : 8;
            const nx = h === 'right' ? 7 : h === 'left' ? -7 : 0;
            const ny = h === 'top' ? -7 : h === 'bottom' ? 7 : 0;
            return (
              <rect
                key={h}
                data-no-marquee="true"
                x={q.x + nx - w / 2}
                y={q.y + ny - ht / 2}
                width={w}
                height={ht}
                rx={2.5}
                fill="#ffffff"
                stroke="#334155"
                style={{ cursor: horiz ? 'ew-resize' : 'ns-resize' }}
                onPointerDown={(e) => handleResizePointerDown(e, d, h)}
              >
                <title>{horiz ? 'Stretch stereo width' : 'Stretch frequency span'}</title>
              </rect>
            );
          })}
      </svg>

      {/* View name */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <div className={`px-2.5 py-1 rounded-lg border backdrop-blur text-xs font-semibold ${T.chip}`}>{VIEW_HINT[viewMode]}</div>
      </div>

      {marqueeBox && (
        <div
          className="absolute pointer-events-none z-50 border border-indigo-400 bg-indigo-500/15 rounded-sm"
          style={{ ...marqueeBox, boxShadow: '0 0 12px rgba(99,102,241,0.35)' }}
        >
          <div className="absolute top-1 left-1.5 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-mono rounded shadow">
            {currentSelectedIds.length} selected
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Only redraw the stage when something it shows has changed. While audio plays, the clock
 * ticks ~20 times a second; the stage only needs to redraw when a sound enters or leaves its
 * timeline region. Callback props are ignored in the comparison: the ones passed in are either
 * stable or read the latest data themselves.
 */
const activeSignature = (bubbles: SoundBubble[], t: number) => bubbles.map((b) => (isActiveAt(b, t) ? '1' : '0')).join('');

export const Stage3D = React.memo(Stage3DInner, (prev, next) => {
  for (const key of Object.keys({ ...prev, ...next }) as (keyof Stage3DProps)[]) {
    if (key === 'currentTime') continue;
    if (typeof prev[key] === 'function' && typeof next[key] === 'function') continue;
    if (prev[key] !== next[key]) return false;
  }
  return activeSignature(prev.bubbles, prev.currentTime) === activeSignature(next.bubbles, next.currentTime);
});
