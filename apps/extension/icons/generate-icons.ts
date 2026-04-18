/**
 * Generates NoteSeed PNG icons with a seed-sprout design.
 * Run: pnpm run icons (from apps/extension)
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BG = { r: 0x4a, g: 0x8b, b: 0x5c };
const FG = { r: 0xff, g: 0xff, b: 0xff };

type Color = { r: number; g: number; b: number };

function setPixel(png: PNG, x: number, y: number, c: Color, alpha: number): void {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const idx = (png.width * iy + ix) << 2;
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  const existing = png.data[idx + 3];
  if (existing === 0) {
    png.data[idx] = c.r;
    png.data[idx + 1] = c.g;
    png.data[idx + 2] = c.b;
    png.data[idx + 3] = a;
  } else {
    const t = a / 255;
    png.data[idx] = Math.round(png.data[idx] * (1 - t) + c.r * t);
    png.data[idx + 1] = Math.round(png.data[idx + 1] * (1 - t) + c.g * t);
    png.data[idx + 2] = Math.round(png.data[idx + 2] * (1 - t) + c.b * t);
    png.data[idx + 3] = Math.max(existing, a);
  }
}

function fillRoundedRect(png: PNG, c: Color, cornerRadius: number): void {
  const s = png.width;
  const r = cornerRadius;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      let inside = true;
      let alpha = 1.0;
      const corners = [
        [r, r],
        [s - r - 1, r],
        [r, s - r - 1],
        [s - r - 1, s - r - 1],
      ];
      for (const [cx, cy] of corners) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        if (
          ((x < r && y < r) ||
            (x >= s - r && y < r) ||
            (x < r && y >= s - r) ||
            (x >= s - r && y >= s - r)) &&
          dx * dx + dy * dy > r * r
        ) {
          const dist = Math.sqrt(dx * dx + dy * dy) - r;
          if (dist > 1) {
            inside = false;
          } else if (dist > 0) {
            alpha = 1 - dist;
          }
        }
      }
      if (inside) setPixel(png, x, y, c, alpha);
    }
  }
}

function fillEllipse(
  png: PNG,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  c: Color,
): void {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d <= 1.0) {
        const edge = 1 - d;
        const alpha = edge < 0.05 ? edge / 0.05 : 1.0;
        setPixel(png, x, y, c, alpha * 0.95);
      }
    }
  }
}

function fillLine(
  png: PNG,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  c: Color,
): void {
  const hw = width / 2;
  const minX = Math.floor(Math.min(x1, x2) - hw - 1);
  const maxX = Math.ceil(Math.max(x1, x2) + hw + 1);
  const minY = Math.floor(Math.min(y1, y2) - hw - 1);
  const maxY = Math.ceil(Math.max(y1, y2) + hw + 1);
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  if (len === 0) return;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.abs((x - x1) * nx + (y - y1) * ny);
      const t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (len * len);
      if (t >= -hw / len && t <= 1 + hw / len && dist <= hw + 0.5) {
        const alpha = dist > hw - 0.5 ? 1 - (dist - hw + 0.5) : 1.0;
        setPixel(png, x, y, c, Math.max(0, alpha) * 0.95);
      }
    }
  }
}

function fillLeaf(
  png: PNG,
  tipX: number,
  tipY: number,
  baseX: number,
  baseY: number,
  bulge: number,
  c: Color,
): void {
  const midX = (tipX + baseX) / 2;
  const midY = (tipY + baseY) / 2;
  const dx = baseX - tipX;
  const dy = baseY - tipY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;
  const ctrlX = midX + nx * bulge;
  const ctrlY = midY + ny * bulge;
  const ctrl2X = midX - nx * bulge;
  const ctrl2Y = midY - ny * bulge;

  const minX = Math.floor(Math.min(tipX, baseX, ctrlX, ctrl2X) - 2);
  const maxX = Math.ceil(Math.max(tipX, baseX, ctrlX, ctrl2X) + 2);
  const minY = Math.floor(Math.min(tipY, baseY, ctrlY, ctrl2Y) - 2);
  const maxY = Math.ceil(Math.max(tipY, baseY, ctrlY, ctrl2Y) + 2);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let inside = false;
      const side1 = pointSideOfQuadBezier(x, y, tipX, tipY, ctrlX, ctrlY, baseX, baseY);
      const side2 = pointSideOfQuadBezier(x, y, tipX, tipY, ctrl2X, ctrl2Y, baseX, baseY);
      if (side1 >= 0 && side2 <= 0) inside = true;
      if (side1 <= 0 && side2 >= 0) inside = true;
      if (inside) setPixel(png, x, y, c, 0.92);
    }
  }
}

function pointSideOfQuadBezier(
  px: number,
  py: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
): number {
  let minDist = Infinity;
  let bestSide = 0;
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    const dtx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
    const dty = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
    const dx = px - bx;
    const dy = py - by;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      bestSide = dx * (-dty) + dy * dtx;
    }
  }
  return bestSide;
}

function drawNoteSeedIcon(size: number): PNG {
  const png = new PNG({ width: size, height: size });
  const s = size;
  const cornerR = Math.round(s * 0.22);

  fillRoundedRect(png, BG, cornerR);

  const cx = s / 2;
  fillEllipse(png, cx, s * 0.62, s * 0.14, s * 0.18, FG);
  fillLine(png, cx, s * 0.44, cx, s * 0.2, s * 0.04, FG);
  fillLeaf(png, s * 0.30, s * 0.26, cx - s * 0.02, s * 0.36, s * 0.08, FG);
  fillLeaf(png, s * 0.70, s * 0.18, cx + s * 0.02, s * 0.30, -s * 0.08, FG);

  return png;
}

for (const [size, name] of [
  [16, '16.png'],
  [48, '48.png'],
  [128, '128.png'],
] as const) {
  const png = drawNoteSeedIcon(size);
  writeFileSync(join(__dirname, name), PNG.sync.write(png));
}

console.info('[generate-icons] wrote 16.png, 48.png, 128.png');
