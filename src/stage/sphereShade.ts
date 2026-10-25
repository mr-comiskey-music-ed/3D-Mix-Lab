/**
 * Paints a lit sphere into a small image, the way a 3D program would shade a ball:
 *   - diffuse light that wraps softly around to a shadow side (the "terminator"),
 *   - a sharp specular highlight where the light reflects toward you,
 *   - a faint rim of light around the edge (dark mode) or a soft edge shade (light mode).
 *
 * The light direction is given in the sphere's own screen frame (x right, y down, z toward
 * the viewer), worked out from one fixed light in the room. So when the camera moves (Front
 * vs. 3D view), the bright and shadow sides move around the ball like they would on a real
 * object — which is what makes it read as round.
 *
 * Images are cached by color + light direction (rounded), so a stage with ten sounds paints
 * only a handful of small images, and dragging rarely repaints anything.
 */

type RGB = [number, number, number];

const hexToRgb = (h: string): RGB => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
  const v = m ? m[1] : '888888';
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as RGB;
};

export interface SphereLook {
  color: string;
  /** Light direction in the sphere's screen frame: x right, y down, z toward the viewer. */
  light: [number, number, number];
  theme: 'dark' | 'light';
  /** 0–1: how solid the ball is (compression makes it denser). */
  density: number;
}

const SIZE = 128;
const cache = new Map<string, string>();
const MAX_CACHE = 160;

export function sphereImage(look: SphereLook): string {
  const q = (v: number, step: number) => Math.round(v / step) * step;
  const [lx, ly, lz] = look.light;
  const key = `${look.color}|${q(lx, 0.06)}|${q(ly, 0.06)}|${q(lz, 0.06)}|${look.theme}|${q(look.density, 0.1)}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  let url = '';
  try {
    url = paint({ ...look, light: [q(lx, 0.06), q(ly, 0.06), q(lz, 0.06)], density: q(look.density, 0.1) });
  } catch {
    url = '';
  }
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string);
  cache.set(key, url);
  return url;
}

function paint({ color, light, theme, density }: SphereLook): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(SIZE, SIZE);

  const base = hexToRgb(color);
  const len = Math.hypot(light[0], light[1], light[2]) || 1;
  const L = [light[0] / len, light[1] / len, light[2] / len];
  // Half-way vector between light and viewer (0,0,1) for the specular highlight
  const hl = Math.hypot(L[0], L[1], L[2] + 1) || 1;
  const H = [L[0] / hl, L[1] / hl, (L[2] + 1) / hl];

  const dark = theme === 'dark';
  const wrap = 0.3; // softens the shadow edge so it wraps a little around the ball
  // The shadow side is a deeper shade of the ball's own color (never grey or muddy):
  // dark mode sinks toward the night-blue room, light mode stays rich and saturated.
  const deep = (to: RGB, amt: number): RGB => base.map((v, k) => v + (to[k] - v) * amt) as RGB;
  const shadowTint: RGB = dark ? deep([6, 8, 22], 0.78) : deep([24, 14, 48], 0.5);
  const alphaLit = dark ? 0.78 + density * 0.18 : 0.88 + density * 0.1;
  const alphaShadow = dark ? 0.5 + density * 0.3 : 0.82 + density * 0.12; // dark mode: shadow side stays a little glassy
  const edge = 1.6 / (SIZE / 2); // anti-aliasing width at the outline

  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const x = ((px + 0.5) / SIZE) * 2 - 1;
      const y = ((py + 0.5) / SIZE) * 2 - 1;
      const r2 = x * x + y * y;
      const i = (py * SIZE + px) * 4;
      if (r2 > 1) {
        img.data[i + 3] = 0;
        continue;
      }
      const nz = Math.sqrt(1 - r2);
      const ndl = x * L[0] + y * L[1] + nz * L[2];
      const diffuse = Math.max(0, (ndl + wrap) / (1 + wrap));
      const ndh = Math.max(0, x * H[0] + y * H[1] + nz * H[2]);
      const spec = Math.pow(ndh, 60) * 0.95 + Math.pow(ndh, 12) * 0.12;
      const fres = Math.pow(1 - nz, 3);

      let r = shadowTint[0] + (base[0] - shadowTint[0]) * diffuse;
      let g = shadowTint[1] + (base[1] - shadowTint[1]) * diffuse;
      let b = shadowTint[2] + (base[2] - shadowTint[2]) * diffuse;

      if (dark) {
        // Glassy rim: the edge catches a little light all the way around
        const rim = fres * 0.55;
        r += (Math.min(255, base[0] + 120) - r) * rim;
        g += (Math.min(255, base[1] + 120) - g) * rim;
        b += (Math.min(255, base[2] + 120) - b) * rim;
      } else {
        // Light mode: a soft darker edge gives the ball a clean silhouette on a pale room
        const shade = fres * 0.35;
        r *= 1 - shade;
        g *= 1 - shade;
        b *= 1 - shade;
      }
      // Specular highlight (white)
      r += (255 - r) * spec;
      g += (255 - g) * spec;
      b += (255 - b) * spec;

      let a = alphaShadow + (alphaLit - alphaShadow) * Math.min(1, diffuse * 1.2);
      a = Math.min(1, a + spec * 0.5);
      // anti-aliased outline
      const d = 1 - Math.sqrt(r2);
      if (d < edge) a *= d / edge;

      img.data[i] = Math.max(0, Math.min(255, r));
      img.data[i + 1] = Math.max(0, Math.min(255, g));
      img.data[i + 2] = Math.max(0, Math.min(255, b));
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}
