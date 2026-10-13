/* ============================================================
   Пиксельный растеризатор: рисуем всю графику процедурно
   ============================================================ */
const _rgbCache = {};
function rgb(h) {
  if (Array.isArray(h)) return h;
  let c = _rgbCache[h]; if (c) return c;
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map(x => x + x).join('');
  c = [parseInt(s.substr(0, 2), 16), parseInt(s.substr(2, 2), 16), parseInt(s.substr(4, 2), 16)];
  _rgbCache[h] = c; return c;
}
function hex(c) { return '#' + c.map(v => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function shade(h, f) { const c = rgb(h); return f >= 0 ? hex(c.map(v => v + (255 - v) * f)) : hex(c.map(v => v * (1 + f))); }
function mix(a, b, t) { const x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(i => x[i] + (y[i] - x[i]) * t)); }
function gray(h) { const c = rgb(h); const l = c[0] * .3 + c[1] * .59 + c[2] * .11; return hex([l, l, l]); }

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

class PX {
  constructor(w, h) {
    this.w = w; this.h = h; this.c = mkCanvas(w, h); this.g = this.c.getContext('2d');
    this.img = this.g.createImageData(w, h); this.d = this.img.data;
  }
  p(x, y, col, a = 255) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || col == null) return;
    const i = (y * this.w + x) * 4, c = rgb(col), d = this.d;
    if (a >= 255 || d[i + 3] === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a >= 255 ? 255 : Math.max(d[i + 3], a); }
    else { const t = a / 255; d[i] = d[i] + (c[0] - d[i]) * t; d[i + 1] = d[i + 1] + (c[1] - d[i + 1]) * t; d[i + 2] = d[i + 2] + (c[2] - d[i + 2]) * t; }
  }
  a(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.d[(y * this.w + x) * 4 + 3]; }
  get(x, y) { const i = (y * this.w + x) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]]; }
  clear(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[(y * this.w + x) * 4 + 3] = 0; }
  r(x, y, w, h, col, a) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, col, a); }
  hl(x0, x1, y, col, a) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.p(x, y, col, a); }
  vl(x, y0, y1, col, a) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.p(x, y, col, a); }
  circ(cx, cy, r, col, a) { const rr = r * r + r * 0.8; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= rr) this.p(cx + x, cy + y, col, a); }
  ell(cx, cy, rx, ry, col, a) {
    for (let y = -Math.ceil(ry); y <= ry; y++) for (let x = -Math.ceil(rx); x <= rx; x++)
      if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) this.p(cx + x, cy + y, col, a);
  }
  ring(cx, cy, r, col) { for (let t = 0; t < Math.PI * 2; t += 0.5 / Math.max(1, r)) this.p(cx + Math.round(Math.cos(t) * r), cy + Math.round(Math.sin(t) * r), col); }
  line(x0, y0, x1, y1, col, a) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (; ;) { this.p(x0, y0, col, a); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  poly(pts, col, a) {
    let minY = 1e9, maxY = -1e9; for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs = []; const yc = y + 0.5;
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= yc && y1 > yc) || (y1 <= yc && y0 > yc)) xs.push(x0 + (yc - y0) / (y1 - y0) * (x1 - x0));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k < xs.length - 1; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.p(x, y, col, a);
    }
  }
  outline(col, diag = false) {
    const w = this.w, h = this.h, src = new Uint8ClampedArray(this.d);
    const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : src[(y * w + x) * 4 + 3];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (A(x, y) > 0) continue;
      if (A(x - 1, y) > 128 || A(x + 1, y) > 128 || A(x, y - 1) > 128 || A(x, y + 1) > 128 ||
        (diag && (A(x - 1, y - 1) > 128 || A(x + 1, y + 1) > 128 || A(x + 1, y - 1) > 128 || A(x - 1, y + 1) > 128))) this.p(x, y, col);
    }
  }
  // затемнить нижнюю/правую сторону каждой формы (простая объёмность)
  shadeEdge(col, a = 120) {
    const w = this.w, h = this.h, src = new Uint8ClampedArray(this.d);
    const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : src[(y * w + x) * 4 + 3];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (A(x, y) && (!A(x, y + 1) || !A(x + 1, y))) this.p(x, y, col, a);
  }
  speck(x, y, w, h, cols, dens, seed = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const r = U.hash(x + i, y + j, seed);
      if (r < dens) this.p(x + i, y + j, cols[Math.floor(U.hash(x + i, y + j, seed + 7) * cols.length)]);
    }
  }
  map(fn) { // fn(x,y,[r,g,b,a]) → [r,g,b,a]|null
    const d = this.d;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = (y * this.w + x) * 4; if (!d[i + 3]) continue;
      const o = fn(x, y, [d[i], d[i + 1], d[i + 2], d[i + 3]]); if (o) { d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[3]; }
    }
  }
  // цветной контур: прозрачный пиксель рядом с формой получает затемнённый цвет соседа (современный pixel-art)
  selOutline(k = .55, diag = false, minA = 128) {
    const w = this.w, h = this.h, src = new Uint8ClampedArray(this.d), d = this.d;
    const nb = diag ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]] : [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; if (src[i + 3]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (const [dx, dy] of nb) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const j = (Y * w + X) * 4; if (src[j + 3] >= minA) { r += src[j]; g += src[j + 1]; b += src[j + 2]; n++; } }
      if (!n) continue;
      d[i] = r / n * (1 - k) * .9; d[i + 1] = g / n * (1 - k) * .8; d[i + 2] = b / n * (1 - k) * .85; d[i + 3] = 255;
    }
  }
  // объём: светлый край сверху-слева, тень снизу-справа
  rim(light = .22, dark = .28) {
    const w = this.w, h = this.h, src = new Uint8ClampedArray(this.d), d = this.d;
    const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : src[(y * w + x) * 4 + 3];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; if (!src[i + 3]) continue;
      const top = !A(x, y - 1) || !A(x - 1, y), bot = !A(x, y + 1) || !A(x + 1, y);
      if (top && !bot) for (let c = 0; c < 3; c++) d[i + c] = d[i + c] + (255 - d[i + c]) * light;
      else if (bot && !top) for (let c = 0; c < 3; c++) d[i + c] = d[i + c] * (1 - dark);
    }
  }
  // Scale2x (EPX): сглаженное удвоение пиксель-арта
  scale2x() {
    const w = this.w, h = this.h, s = this.d, o = new PX(w * 2, h * 2), d = o.d;
    const px = (x, y) => { x = U.clamp(x, 0, w - 1); y = U.clamp(y, 0, h - 1); const i = (y * w + x) * 4; return (s[i] << 24 | s[i + 1] << 16 | s[i + 2] << 8 | s[i + 3]) >>> 0; };
    const put = (x, y, v) => { const i = (y * w * 2 + x) * 4; d[i] = v >>> 24; d[i + 1] = (v >>> 16) & 255; d[i + 2] = (v >>> 8) & 255; d[i + 3] = v & 255; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const P_ = px(x, y), A = px(x, y - 1), B = px(x + 1, y), C = px(x - 1, y), D = px(x, y + 1);
      let e1 = P_, e2 = P_, e3 = P_, e4 = P_;
      if (C === A && C !== D && A !== B) e1 = A;
      if (A === B && A !== C && B !== D) e2 = B;
      if (D === C && D !== B && C !== A) e3 = C;
      if (B === D && B !== A && D !== C) e4 = D;
      put(x * 2, y * 2, e1); put(x * 2 + 1, y * 2, e2); put(x * 2, y * 2 + 1, e3); put(x * 2 + 1, y * 2 + 1, e4);
    }
    return o;
  }
  blit(src, dx, dy) { // копировать другой PX (с альфой)
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4; const a = src.d[i + 3]; if (!a) continue;
      this.p(dx + x, dy + y, [src.d[i], src.d[i + 1], src.d[i + 2]], a);
    }
  }
  done() { this.g.putImageData(this.img, 0, 0); return this.c; }
}

// спрайт из строк: '.' прозрачный, остальные символы — из палитры
function strSprite(rows, pal) {
  const h = rows.length, w = rows[0].length, px = new PX(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = rows[y][x]; if (ch !== '.' && pal[ch]) px.p(x, y, pal[ch]); }
  return px;
}

const SPR = new Map();
function spr(key, fn) { let c = SPR.get(key); if (!c) { c = fn(); SPR.set(key, c); } return c; }
function flipH(c) { const o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }
function tint(c, col, a = 0.5) { const o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, o.width, o.height); return o; }
function whiteOf(c) { return tint(c, '#ffffff', 1); }
const _urlCache = new Map();
function dataURL(key, canvasFn) { let u = _urlCache.get(key); if (!u) { u = canvasFn().toDataURL(); _urlCache.set(key, u); } return u; }
