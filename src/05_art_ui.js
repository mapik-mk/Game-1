/* ============================================================
   Интерфейс в духе Stardew Valley: пиксельные 9-slice рамки,
   деревянные панели, пергамент, циферблат часов
   ============================================================ */
const UIPAL = {
  out: '#3e1708', w0: '#ffd27a', w1: '#f7a845', w2: '#dd7d26', w3: '#b65a17', w4: '#7a3410',
  p0: '#fff3d0', p1: '#ffdea0', p2: '#f8c77e', p3: '#e3a35c', p4: '#b9773a',
};
function upscale(c, k) { const o = mkCanvas(c.width * k, c.height * k), g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, o.width, o.height); return o; }

// Описание рамок: s — толщина края (в пикселях арта), m — длина повторяемой середины,
// band(d, lit, x, y) — цвет пикселя на расстоянии d от внешнего края (lit — верх/лево)
const FRAMES = {
  box: { s: 6, m: 16, band(d, lit, x, y) {
    const P = UIPAL;
    if (d === 0) return P.out;
    if (d === 1) return lit ? P.w0 : P.w2;
    if (d === 2) return U.hash(x, y, 3) < .12 ? P.w2 : P.w1;
    if (d === 3) return lit ? P.w2 : P.w3;
    if (d === 4) return P.w4;
    if (d === 5) return lit ? P.p3 : P.p1;
    const r = U.hash(x, y, 5); return r < .05 ? P.p2 : r > .97 ? P.p0 : P.p1;
  } },
  plate: { s: 3, m: 12, band(d, lit) {
    const P = UIPAL;
    if (d === 0) return P.out;
    if (d === 1) return lit ? P.p1 : P.p4;
    if (d === 2) return lit ? P.p0 : P.p2;
    return P.p0;
  } },
  slot: { s: 2, m: 10, band(d, lit) {
    const P = UIPAL;
    if (d === 0) return lit ? P.p4 : P.p3;
    if (d === 1) return lit ? P.p3 : P.p0;
    return '#fde5b0';
  } },
  sel: { s: 2, m: 10, band(d) {
    if (d === 0) return '#b01020';
    if (d === 1) return '#ff4a3a';
    return '#ffeec8';
  } },
  inset: { s: 3, m: 12, band(d, lit) {
    const P = UIPAL;
    if (d === 0) return lit ? P.p4 : P.p3;
    if (d === 1) return lit ? P.p2 : P.p0;
    return '#fff0c8';
  } },
  btn: { s: 4, m: 12, band(d, lit, x, y) {
    const P = UIPAL;
    if (d === 0) return P.out;
    if (d === 1) return lit ? P.w0 : P.w3;
    if (d === 2) return lit ? P.w1 : P.w2;
    return U.hash(x >> 2, y, 9) < .18 ? P.w3 : P.w2;
  } },
  btnr: { s: 4, m: 12, band(d, lit) {
    if (d === 0) return '#3a0608';
    if (d === 1) return lit ? '#ff9a8a' : '#8a0e18';
    if (d === 2) return lit ? '#f4555a' : '#c21c2a';
    return '#d8303a';
  } },
  btng: { s: 4, m: 12, band(d, lit) {
    if (d === 0) return '#16300a';
    if (d === 1) return lit ? '#d4f59a' : '#3c6e18';
    if (d === 2) return lit ? '#9bd65a' : '#5c9a28';
    return '#73b236';
  } },
  tab: { s: 4, m: 12, band(d, lit) {
    const P = UIPAL;
    if (d === 0) return P.out;
    if (d === 1) return lit ? P.w1 : P.w3;
    if (d === 2) return P.w4;
    return P.p2;
  } },
  tabon: { s: 4, m: 12, band(d, lit) {
    const P = UIPAL;
    if (d === 0) return P.out;
    if (d === 1) return lit ? P.w0 : P.w2;
    if (d === 2) return P.w4;
    return P.p1;
  } },
  por: { s: 4, m: 16, band(d, lit) {
    const P = UIPAL;
    if (d === 0) return P.out;
    if (d === 1) return lit ? P.w0 : P.w3;
    if (d === 2) return lit ? P.w1 : P.w2;
    if (d === 3) return P.w4;
    return null;
  } },
  bar: { s: 3, m: 10, band(d, lit) {
    const P = UIPAL;
    if (d === 0) return P.out;
    if (d === 1) return lit ? P.w1 : P.w3;
    if (d === 2) return '#2a1208';
    return '#3a1c10';
  } },
  dark: { s: 5, m: 14, band(d, lit, x, y) {
    if (d === 0) return '#000000';
    if (d === 1) return lit ? '#6e5a74' : '#2a1f2e';
    if (d === 2) return '#463a4c';
    if (d === 3) return lit ? '#2a1f2e' : '#5e4c64';
    if (d === 4) return '#120c14';
    return U.hash(x, y, 4) < .06 ? '#221a26' : '#1a141e';
  } },
};
function frameCanvas(kind) {
  return spr('uifr:' + kind, () => {
    const f = FRAMES[kind], W = f.s * 2 + f.m, p = new PX(W, W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const dx = Math.min(x, W - 1 - x), dy = Math.min(y, W - 1 - y);
      if (dx + dy < 2) continue; // скруглённый угол
      const d = Math.min(dx, dy, dx + dy - 2);
      const lit = (dy === d && y < W / 2) || (dx === d && x < W / 2 && !(dy === d && y >= W / 2));
      const c = f.band(d, lit, x, y); if (c) p.p(x, y, c);
    }
    // заклёпки по углам большой рамки
    if (kind === 'box') for (const [cx, cy] of [[2, 2], [W - 3, 2], [2, W - 3], [W - 3, W - 3]]) { p.p(cx, cy, UIPAL.w0); p.p(cx + (cx < W / 2 ? 1 : -1), cy + (cy < W / 2 ? 1 : -1), UIPAL.w4); }
    return upscale(p.done(), 4);
  });
}
// доски (фон портрета, панелей)
function plankCanvas(dark) {
  return spr('uiplank:' + (dark ? 1 : 0), () => {
    const W = 48, H = 32, p = new PX(W, H);
    const base = dark ? ['#8a4a1e', '#7a3f18', '#6a3414', '#4a220c'] : [UIPAL.w1, UIPAL.w2, UIPAL.w3, UIPAL.w4];
    for (let y = 0; y < H; y++) {
      const row = Math.floor(y / 8), yy = y % 8, off = (row * 19) % W;
      for (let x = 0; x < W; x++) {
        let c = base[1];
        const gr = U.hash(Math.floor((x + off) / 3), row * 8 + yy, 11);
        if (gr < .16) c = base[2]; else if (gr > .9) c = base[0];
        if (yy === 0) c = base[0];
        if (yy === 7) c = base[3];
        if (yy === 6) c = base[2];
        if ((x + off) % W === 0 && yy < 7) c = base[3];
        if ((x + off) % W === 1 && yy < 7) c = base[2];
        p.p(x, y, c);
      }
      if (y % 8 === 3) { const nx = (row * 19 + 6) % W; p.p(nx, y, base[3]); p.p(nx, y - 1, base[0]); }
    }
    return upscale(p.done(), 4);
  });
}
// круговой циферблат часов: день — солнце, ночь — луна, стрелка — текущее время
function clockDial(time) {
  const W = 28, H = 16, p = new PX(W, H);
  const cx = 13.5, cy = 15;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
    if (r > 14) continue;
    if (r > 13) { p.p(x, y, UIPAL.out); continue; }
    if (r > 12) { p.p(x, y, UIPAL.w2); continue; }
    const a = Math.atan2(-dy, dx); // 0..π: справа → слева
    const day = a > Math.PI / 2;
    p.p(x, y, day ? (r < 7 ? '#ffe9a0' : '#a8d8f0') : (r < 7 ? '#5a5aa0' : '#2c2a5a'));
  }
  // солнце и луна
  p.circ(7, 9, 2, '#ffcc33'); p.p(7, 9, '#fff6c0');
  p.circ(20, 9, 2, '#e8e8ff'); p.p(21, 8, '#2c2a5a'); p.p(21, 9, '#2c2a5a');
  // стрелка: 6:00 → левый край, 2:00 ночи → правый
  const k = U.clamp((time - 360) / (1560 - 360), 0, 1), ang = Math.PI - k * Math.PI;
  for (let t = 0; t <= 11; t += .5) p.p(Math.round(cx + Math.cos(ang) * t), Math.round(cy - Math.sin(ang) * t), t > 9 ? '#c21c2a' : UIPAL.out);
  p.r(12, 13, 3, 3, UIPAL.out); p.p(13, 14, UIPAL.w1);
  return p.done();
}
// нарисовать 9-slice рамку прямо на холсте (k — размер пикселя арта в пикселях экрана)
function drawFrame9(ctx, kind, x, y, w, h, k) {
  const f = FRAMES[kind], c = frameCanvas(kind), S4 = 4, s = f.s * S4, m = f.m * S4, d = f.s * k;
  ctx.imageSmoothingEnabled = false;
  const cols = [[0, s, x, d], [s, m, x + d, w - 2 * d], [s + m, s, x + w - d, d]];
  const rws = [[0, s, y, d], [s, m, y + d, h - 2 * d], [s + m, s, y + h - d, d]];
  for (const [sy, sh, dy, dh] of rws) for (const [sx, sw, dx, dw] of cols) if (dw > 0 && dh > 0) ctx.drawImage(c, sx, sy, sw, sh, dx, dy, dw, dh);
}
// применить рамки как CSS-переменные
function applyUIArt() {
  const root = document.documentElement.style;
  for (const k of Object.keys(FRAMES)) root.setProperty('--fr-' + k, `url(${dataURL('frurl:' + k, () => frameCanvas(k))})`);
  root.setProperty('--plank', `url(${dataURL('plank0', () => plankCanvas(false))})`);
  root.setProperty('--plank-d', `url(${dataURL('plank1', () => plankCanvas(true))})`);
  // пропорции срезов в процентах (не зависят от масштаба картинки)
  for (const k of Object.keys(FRAMES)) { const f = FRAMES[k]; root.setProperty('--fs-' + k, (f.s / (f.s * 2 + f.m) * 100).toFixed(3) + '%'); }
}
