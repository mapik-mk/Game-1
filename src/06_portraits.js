/* ============================================================
   Портреты в стиле Stardew Valley: 64x64 на одной пиксельной сетке.
   Слои рисуются в карту областей → автоматическое затенение (свет
   сверху-слева), падающие тени от волос и шляп → цветные контуры
   между областями → глаза, брови, рот по шаблонам эмоций.
   ============================================================ */
function porOutline(c) { const [r, g, b] = rgb(c); return hex([r * .36 + 6, g * .24 + 2, b * .28 + 4]); }
function porTones(base, o = {}) {
  return [shade(base, o.hl == null ? .42 : o.hl), shade(base, .18), base, shade(base, -.2), shade(base, -.38), o.out || porOutline(base)];
}
// кожа: тени уходят в тёплый красно-коричневый, а не в серый
function skinTones(sk) { return [shade(sk, .3), shade(sk, .12), sk, mix(sk, '#a8545a', .32), mix(sk, '#7a3444', .48), porOutline(mix(sk, '#a04040', .3))]; }
function inPoly(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
class PorCanvas {
  constructor() { this.rid = new Int16Array(4096).fill(-1); this.R = []; }
  // o: z (порядок для контуров), rim, shW (ширина тени), recv (тени от волос), cast, tex(x,y,t), line, noLine
  reg(name, base, o = {}) { const r = Object.assign({ name, id: this.R.length, z: 0, rim: true, shW: 2, line: true }, o); r.t = o.tones || porTones(base, o); this.R.push(r); return r; }
  put(r, x, y) { if (x < 0 || y < 0 || x > 63 || y > 63) return; this.rid[y * 64 + x] = r ? r.id : -1; }
  at(x, y) { return (x < 0 || y < 0 || x > 63 || y > 63) ? -1 : this.rid[y * 64 + x]; }
  fill(r, test, x0 = 0, y0 = 0, x1 = 63, y1 = 63) {
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(63, Math.ceil(y1)); y++)
      for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(63, Math.ceil(x1)); x++) if (test(x + .5, y + .5)) this.put(r, x, y);
  }
  ell(r, cx, cy, rx, ry, clip) { this.fill(r, (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && (!clip || clip(x, y)), cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1); }
  poly(r, pts, clip) {
    let x0 = 99, y0 = 99, x1 = -99, y1 = -99; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    this.fill(r, (x, y) => inPoly(pts, x, y) && (!clip || clip(x, y)), x0 - 1, y0 - 1, x1 + 1, y1 + 1);
  }
  mirror(r, pts, clip) { this.poly(r, pts, clip); this.poly(r, pts.map(([x, y]) => [64 - x, y]), clip ? (x, y) => clip(64 - x, y) : null); }
  rect(r, x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(r, x + i, y + j); }
  render() {
    const R = this.R, A = (x, y) => this.at(x, y), p = new PX(64, 64), tone = new Int8Array(4096);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const id = A(x, y); if (id < 0) continue; const r = R[id];
      let t = 2;
      if (r.rim) {
        let d = 0; for (let k = 1; k <= 4; k++) { if (A(x + k, y + k) !== id || A(x + k, y) !== id) break; d = k; }
        if (d < r.shW) t = d === 0 && r.deep ? 4 : 3;
        else {
          const u1 = A(x, y - 1) === id && A(x, y - 2) !== id, l1 = A(x - 1, y) === id && A(x - 2, y) !== id;
          if ((u1 || l1) && r.hlEdge !== false) t = 1;
        }
      }
      if (r.recv) for (let k = 1; k <= r.recv; k++) { const q = A(x - (k > 1 ? 1 : 0), y - k); if (q >= 0 && q !== id && R[q].cast && R[q].z > r.z) { t = Math.max(t, k === 1 ? 4 : 3); break; } }
      if (r.tex) t = r.tex(x, y, t);
      tone[y * 64 + x] = t;
    }
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const id = A(x, y); if (id < 0) continue; const r = R[id];
      let out = false;
      if (r.line) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const q = A(x + dx, y + dy);
        if (q < 0) { if (r.line !== 'inner') { out = true; break; } }
        else if (q !== id && R[q].z < r.z && !(r.noLine && r.noLine.includes(R[q].name))) { out = true; break; }
      }
      p.p(x, y, out ? r.t[5] : r.t[tone[y * 64 + x]]);
    }
    return p;
  }
}
// пряди: линии по углу от макушки + блестящее кольцо
function hairTex(cx, cy, o = {}) {
  const k = o.k || 5.5, ring = o.ring || 10, a0 = o.a0 == null ? .35 : o.a0, a1 = o.a1 == null ? 2.6 : o.a1;
  return (x, y, t) => {
    const dx = x + .5 - cx, dy = y + .5 - cy, a = Math.atan2(dy, dx), dist = Math.hypot(dx, dy);
    const s = a * k + Math.sin(dist * .45) * .12, f = s - Math.floor(s);
    if (f < .16 && dist > (o.r0 || 5) && t < 4) t = Math.max(t, 3);
    const onRing = Math.abs(dist - ring) < 1.1 && a > a0 && a < a1;
    if (onRing && f > .28 && f < .9) t = Math.min(t, 0);
    else if (Math.abs(dist - ring) < 2.4 && a > a0 && a < a1 && f > .3 && t === 2) t = 1;
    if (o.dark && dist > o.dark && t === 2) t = 3;
    return t;
  };
}
// вертикальные пряди длинных волос
function strandTex(o = {}) {
  const k = o.k || .34, wave = o.wave || 0;
  return (x, y, t) => {
    const s = (x + Math.sin(y * .33 + (o.ph || 0)) * wave) * k, f = s - Math.floor(s);
    if (f < .2 && t < 4) t = Math.max(t, 3);
    else if (f > .55 && f < .7 && t === 2 && (y + Math.floor(x / 3)) % 7 < 3) t = 1;
    return t;
  };
}

/* ---------- шаблоны глаз (правый глаз; левый — зеркально) ----------
   K ресницы, W белок, D радужка-верх, I радужка, L радужка-низ, P зрачок, H блик, h блик-2, s тень кожи */
const EYES_F = {
  open: ['..KKKKKK.', '.KKDDDDKK', '..WHPPIW.', '..WIPPIW.', '...LLLh..', '....ss...'],
  wide: ['..KKKKKK.', '.KKWWWWKK', '..WDDDDW.', '..WHPPIW.', '...WLLW..', '....ss...'],
  half: ['.........', '.KKKKKKKK', '..WHPPIW.', '..WIPPIW.', '...LLLh..', '....ss...'],
  sad: ['..KKKKK..', '.KKDDDDKK', '..WHPPIW.', '..WIPPIW.', '...LLLh..', '...sss...'],
  closed: ['.........', '.........', '.KKKKKKKK', '...KKKK..', '.........', '.........'],
  happy: ['.........', '...KKKK..', '..KK..KK.', '.KK....KK', '.........', '.........'],
};
const EYES_M = {
  open: ['.KKKKK.', '.WHPIW.', '..IPI..', '...s...'],
  wide: ['.KKKKK.', '.WWWWW.', '.WHPIW.', '..WWW..'],
  half: ['.......', 'KKKKKKK', '.WHPIW.', '..IPI..'],
  sad: ['..KKKK.', '.WHPIW.', '..IPI..', '..sss..'],
  closed: ['.......', '.KKKKK.', '..sss..', '.......'],
  happy: ['.......', '..KKK..', '.K...K.', '.......'],
};
const MOUTHS = {
  line: ['MMM', '.l.'],
  smile: ['M...M', '.MMM.'],
  talk: ['.MMM.', 'MRRRM', '.MTM.'],
  talk2: ['.MMMM.', 'MRRRRM', 'MRTTRM', '.MMMM.'],
  happy: ['MMMMMMM', '.WWWWW.', '.RTTTR.', '..MMM..'],
  sad: ['.MMM.', 'M...M'],
  sadtalk: ['.MMM.', 'MRRRM', 'M...M'],
  angry: ['MMMMM', 'MWWWM', 'MMMMM'],
  angrytalk: ['MMMMMM', 'MWWWWM', 'MRRRRM', 'MWWWWM', 'MMMMMM'],
  surprised: ['.MM.', 'MRRM', 'MRRM', '.MM.'],
  smirk: ['....M', 'MMMM.'],
};
function stamp(p, rows, ox, oy, pal, flip, onlyIf) {
  const w = rows[0].length;
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][flip ? w - 1 - x : x]; if (ch === '.' || !pal[ch]) continue;
    if (onlyIf && !onlyIf(ox + x, oy + y)) continue;
    p.p(ox + x, oy + y, pal[ch]);
  }
}

/* ---------- головы, причёски, одежда, головные уборы ---------- */
function porHead(pc, L, fem) {
  const sk = L.skin || '#f2c6a0';
  const T = skinTones(sk);
  const face = pc.reg('face', sk, { z: 3, recv: 2, cast: true, shW: 3, hlEdge: false, tones: T });
  const ear = pc.reg('ear', sk, { z: 2.5, shW: 1, tones: T });
  const neck = pc.reg('neck', sk, { z: 1, recv: 2, shW: 3, hlEdge: false, tones: T });
  pc.poly(neck, fem ? [[27.5, 34], [36.5, 34], [36.5, 45], [38.5, 50], [25.5, 50], [27.5, 45]] : [[26, 34], [38, 34], [38.5, 45], [41, 50], [23, 50], [25.5, 45]]);
  pc.ell(ear, 19.6, 31, 2.4, 3.4); pc.ell(ear, 44.4, 31, 2.4, 3.4);
  pc.ell(face, 32, 26, 12.6, 13.2);
  pc.poly(face, fem ? [[19.5, 26], [44.5, 26], [43.8, 32.5], [40.5, 38], [36, 41.6], [32, 42.8], [28, 41.6], [23.5, 38], [20.2, 32.5]]
    : [[19.4, 26], [44.6, 26], [44.6, 33.5], [41.6, 39.5], [36.6, 43], [32, 44], [27.4, 43], [22.4, 39.5], [19.4, 33.5]]);
  return { face, ear, neck };
}
const TORSO_F = [[7, 64], [57, 64], [56, 58], [50, 52.5], [39.5, 49], [24.5, 49], [14, 52.5], [8, 58]];
const TORSO_M = [[2, 64], [62, 64], [60.5, 56.5], [52.5, 50.5], [40, 47.5], [24, 47.5], [11.5, 50.5], [3.5, 56.5]];
function porClothes(pc, L, fem) {
  const sk = L.skin || '#f2c6a0', top = L.top || '#4a6a9a', torso = fem ? TORSO_F : TORSO_M;
  const cloth = (name, col, o = {}) => pc.reg(name, col, Object.assign({ z: 2, shW: 3, recv: 2, deep: true }, o));
  const skin = (name) => pc.reg(name, sk, { z: 2, shW: 2, recv: 3, hlEdge: true, tones: skinTones(sk) });
  switch (L.outfit) {
    case 'corset': {
      const ch = skin('chest'); pc.poly(ch, torso);
      const c = cloth('corset', top, { z: 2.2, shW: 2 }); pc.poly(c, [[7, 64], [57, 64], [55.5, 56], [45, 53], [38, 56.5], [32, 58], [26, 56.5], [19, 53], [8.5, 56]]);
      const lace = pc.reg('lace', '#b88ae8', { z: 2.3, rim: false, line: false }); for (let y = 59; y < 64; y += 2) { pc.put(lace, 31, y); pc.put(lace, 33, y); pc.put(lace, 32, y + 1); }
      const chk = pc.reg('choker', '#1a0e1e', { z: 2.4, rim: false }); pc.rect(chk, 27, 43, 10, 2);
      const gem = pc.reg('gem', '#e040e0', { z: 2.5, rim: false, line: false }); pc.rect(gem, 31, 44, 2, 2);
      return { cleave: [32, 52, 56] };
    }
    case 'bunny': {
      const ch = skin('chest'); pc.poly(ch, torso);
      const c = cloth('suit', '#1c181e', { z: 2.2, shW: 2, hl: .3 }); pc.poly(c, [[6, 64], [58, 64], [56.5, 57], [46, 54], [38.5, 57], [32, 59], [25.5, 57], [18, 54], [7.5, 57]]);
      const col = pc.reg('collar', '#ffffff', { z: 2.4, shW: 1 }); pc.rect(col, 26, 45, 12, 3);
      const bow = pc.reg('bow', '#d02030', { z: 2.6, shW: 1 }); pc.poly(bow, [[26, 44], [32, 46.5], [26, 49.5]]); pc.poly(bow, [[38, 44], [32, 46.5], [38, 49.5]]); pc.rect(bow, 31, 45, 2, 3);
      return { cleave: [32, 52, 57] };
    }
    case 'nurse': {
      const c = cloth('coat', '#f2f2f6'); pc.poly(c, torso);
      const v = skin('v'); v.z = 2.2; pc.poly(v, [[28, 48], [36, 48], [32, 56]]);
      const col = pc.reg('collar', '#ffffff', { z: 2.3, shW: 1 }); pc.poly(col, [[24, 48], [28, 48], [32, 57], [30, 58]]); pc.poly(col, [[40, 48], [36, 48], [32, 57], [34, 58]]);
      const cross = pc.reg('cross', '#d02030', { z: 2.4, rim: false, line: false }); pc.rect(cross, 44, 55, 2, 6); pc.rect(cross, 42, 57, 6, 2);
      const pen = pc.reg('pen', '#5a8ac8', { z: 2.4, shW: 1 }); pc.rect(pen, 18, 54, 2, 7);
      return {};
    }
    case 'gown': {
      const ch = skin('chest'); pc.poly(ch, torso);
      const c = cloth('gown', '#e4ecf2', { hl: .3 }); c.z = 2.2; pc.poly(c, [[3, 64], [61, 64], [58.5, 57], [43, 54], [32, 58.5], [21, 54], [10, 51.5], [4.5, 56]]);
      c.tex = (x, y, t) => ((x + y * .4) % 7 < 1 && y > 57 && t < 3 ? 3 : t);
      return { cleave: [32, 52, 57] };
    }
    case 'frog': {
      const c = cloth('dress', '#4a9a3a'); pc.poly(c, torso);
      const fr = pc.reg('frill', '#fff8ee', { z: 2.3, shW: 1 });
      for (let k = 0; k < 7; k++) pc.ell(fr, 21 + k * 3.7, 49.5 + (k % 2) * .6, 2.4, 2);
      const rb = pc.reg('ribbon', '#f2c430', { z: 2.5, shW: 1 }); pc.poly(rb, [[28, 52], [32, 54], [28, 56]]); pc.poly(rb, [[36, 52], [32, 54], [36, 56]]);
      return {};
    }
    case 'lolita': {
      const c = cloth('dress', '#1a161c', { hl: .25 }); pc.poly(c, torso);
      const col = pc.reg('collar', '#f4f0f0', { z: 2.3, shW: 1 }); pc.poly(col, [[24, 47.5], [40, 47.5], [44, 52.5], [37, 54.5], [32, 51], [27, 54.5], [20, 52.5]]);
      const br = pc.reg('brooch', '#c0102a', { z: 2.5, shW: 1 }); pc.ell(br, 32, 52.5, 2.2, 2.2);
      for (let k = 0; k < 4; k++) { const lc = pc.reg('lace' + k, '#f4f0f0', { z: 2.3, rim: false }); pc.ell(lc, 9 + k * 15, 62, 2, 1.6); }
      return {};
    }
    case 'suit': {
      const c = cloth('jacket', top); pc.poly(c, torso);
      const sh = pc.reg('shirt', '#f4f4f0', { z: 2.2, shW: 1 }); pc.poly(sh, [[26, 47.5], [38, 47.5], [32, 62]]);
      const tie = pc.reg('tie', '#8a2a3a', { z: 2.4, shW: 1 }); pc.poly(tie, [[30.5, 48], [33.5, 48], [34.5, 58], [32, 61], [29.5, 58]]);
      const lap = pc.reg('lapel', shade(top, -.12), { z: 2.3, shW: 1 }); pc.poly(lap, [[24, 47.5], [27, 47.5], [31, 60], [27, 56]]); pc.poly(lap, [[40, 47.5], [37, 47.5], [33, 60], [37, 56]]);
      return {};
    }
    case 'ruff': {
      const c = cloth('suit', '#f6f6f8', { hl: .2 }); pc.poly(c, torso);
      const rf = pc.reg('ruff', '#ffffff', { z: 2.5, shW: 1 }); for (let k = 0; k < 9; k++) pc.ell(rf, 14 + k * 4.5, 48 + (k % 2), 3.2, 2.6);
      for (const y of [56, 62]) { const pm = pc.reg('pom' + y, '#151215', { z: 2.6, shW: 1 }); pc.ell(pm, 32, y, 2.2, 2.2); }
      return {};
    }
    case 'apron': {
      const ch = skin('chest'); pc.poly(ch, torso);
      const ap = cloth('apron', '#6a4224'); ap.z = 2.2; pc.poly(ap, [[17, 64], [47, 64], [46, 52], [18, 52]]);
      const st = pc.reg('strap', '#4a2a14', { z: 2.3, rim: false }); pc.poly(st, [[18, 52], [21, 52], [27, 47], [25, 47]]); pc.poly(st, [[46, 52], [43, 52], [37, 47], [39, 47]]);
      const rv = pc.reg('rivet', '#c8a040', { z: 2.4, rim: false, line: false }); pc.put(rv, 20, 54); pc.put(rv, 44, 54);
      return { pecs: true };
    }
    default: {
      const c = cloth('shirt', top); pc.poly(c, torso);
      const v = skin('v'); v.z = 2.2; pc.poly(v, [[29, 47.5], [35, 47.5], [32, 53]]);
      const col = pc.reg('collar', shade(top, .2), { z: 2.3, shW: 1 }); pc.poly(col, [[24, 47.5], [29, 47.5], [32, 53], [28, 54]]); pc.poly(col, [[40, 47.5], [35, 47.5], [32, 53], [36, 54]]);
      const bt = pc.reg('btn', shade(top, .45), { z: 2.4, rim: false, line: false }); pc.put(bt, 32, 57); pc.put(bt, 32, 61);
      return {};
    }
  }
}
function porHair(pc, L, fem, back) {
  const st = L.hairStyle || 'short', hc = L.hair || '#3a2a1a';
  if (st === 'bald') {
    if (L.hair && !back) { const tf = pc.reg('tuft', hc, { z: 4, shW: 1 }); pc.ell(tf, 18.5, 25, 2.6, 5); pc.ell(tf, 45.5, 25, 2.6, 5); }
    return;
  }
  const crown = [st === 'bun' || st === 'veil' ? 32 : 29, 7];
  const tex = hairTex(crown[0], crown[1], { ring: 10.5, k: fem ? 6 : 5 });
  if (back) {
    const hb = pc.reg('hairB', shade(hc, -.08), { z: 0, shW: 3, deep: true, tex: strandTex({ wave: st === 'wavy' ? 1.6 : st === 'veil' ? .8 : 0 }) });
    switch (st) {
      case 'long': pc.poly(hb, [[16, 14], [48, 14], [51.5, 30], [52, 56], [50, 62], [47, 59], [45, 64], [19, 64], [17, 59], [14, 62], [12, 56], [12.5, 30]]); break;
      case 'wavy': pc.fill(hb, (x, y) => y > 13 && x > 9 + 2.2 * Math.sin(y * .36) - (y > 40 ? 2 : 0) && x < 55 - 2.2 * Math.sin(y * .36 + 1.2) + (y > 40 ? 2 : 0) && (y < 60 || (x + y) % 6 < 4)); break;
      case 'veil': pc.poly(hb, [[16, 14], [48, 14], [51, 32], [53, 52], [51, 64], [48, 58], [46, 64], [18, 64], [16, 58], [13, 64], [11, 52], [13, 32]]); break;
      case 'ponytail': {
        const tl = pc.reg('tail', hc, { z: 0, shW: 3, deep: true, tex: strandTex({ k: .4, wave: 1 }) });
        pc.poly(tl, [[38, 9], [47, 6], [54.5, 13], [56, 28], [54, 44], [49, 52], [48, 38], [47, 22]]);
        break;
      }
      case 'bun': { const bn = pc.reg('bun', hc, { z: 0, shW: 2, tex: hairTex(32, 8, { ring: 4, k: 3, r0: 1 }) }); pc.ell(bn, 32, 8.5, 7.5, 6.5); break; }
      case 'twintail': {
        const tt = pc.reg('tails', hc, { z: 0, shW: 3, deep: true, tex: strandTex({ k: .45, wave: 1.2 }) });
        pc.mirror(tt, [[15, 13], [10.5, 17], [7, 27], [6, 40], [7.5, 52], [10.5, 60], [11, 50], [11.5, 38], [13.5, 27], [17.5, 20]]);
        break;
      }
      case 'bob': pc.poly(hb, [[16, 16], [48, 16], [50, 36], [48, 41], [16, 41], [14, 36]]); break;
    }
    return;
  }
  // передние волосы: «шапка» + чёлка + боковые пряди
  const hf = pc.reg('hairF', hc, { z: 5, shW: 2, cast: true, tex });
  const hs = pc.reg('hairS', shade(hc, -.04), { z: 4, shW: 2, cast: true, tex: strandTex({ wave: st === 'wavy' ? 1.4 : 0, ph: 2 }) });
  const capTop = st === 'messy' || st === 'spiky' ? 8.5 : 9.5;
  pc.ell(hf, 32, 22, 16.4, 22 - capTop, (x, y) => y < 21);
  const zig = (pts) => pc.poly(hf, [[17, 15], [47, 15], ...pts.slice().reverse()]);
  switch (st) {
    case 'long':
      zig([[17.5, 27], [20, 28], [22, 27], [24, 28.5], [26, 27], [28, 28.5], [30, 27], [32, 28.5], [34, 27], [36, 28.5], [38, 27], [40, 28.5], [42, 27], [44, 28], [46.5, 27]]);
      pc.mirror(hs, [[15.5, 18], [22, 18], [22.5, 38], [22, 50], [20.5, 52], [19, 50.5], [17.5, 52.5], [16, 49], [15, 36]]);
      break;
    case 'wavy':
      zig([[17.5, 24], [20, 27], [22.5, 23], [25.5, 27], [28, 22.5], [31.5, 27.5], [34, 23], [37.5, 29], [40, 25], [43.5, 31], [46.5, 28]]);
      pc.fill(hs, (x, y) => y > 17 && y < 58 && ((x > 14.5 + 1.6 * Math.sin(y * .4) && x < 22 + 1.6 * Math.sin(y * .4)) || (x > 42 - 1.6 * Math.sin(y * .4 + 1) && x < 49.5 - 1.6 * Math.sin(y * .4 + 1))));
      break;
    case 'veil':
      zig([[17.5, 24], [21, 27.5], [24, 23], [27, 27], [30, 23.5], [32.5, 28], [33, 20]]);
      pc.poly(hf, [[32, 15], [47, 15], [47, 38], [44, 42], [41.5, 36], [38.5, 40], [35.5, 34], [33, 36], [31.5, 26]]);
      pc.poly(hs, [[15.5, 18], [22, 18], [22.5, 38], [21.5, 52], [20, 58], [18.5, 54], [16.5, 58], [15.5, 50], [15, 36]]);
      break;
    case 'ponytail':
      zig([[17.5, 26], [20, 22.5], [22.5, 27], [25.5, 23], [28.5, 28], [31.5, 23.5], [34.5, 27.5], [37.5, 22.5], [40.5, 26], [43.5, 21.5], [46.5, 24]]);
      pc.mirror(hs, [[16, 18], [21.5, 18], [22, 28], [21.5, 34], [20, 39.5], [18.5, 35], [16.5, 29]]);
      { const sc = pc.reg('scrunchie', '#f2f2f2', { z: 5.5, shW: 1 }); pc.ell(sc, 44.5, 10.5, 2.4, 2.4); }
      break;
    case 'bun':
      pc.poly(hf, [[32.5, 13], [18, 17], [17, 29], [20, 26], [23.5, 23], [27.5, 20.5], [31, 19.5], [32.5, 17]]);
      pc.poly(hf, [[31.5, 13], [46, 17], [47, 29], [44, 26], [40.5, 23], [36.5, 20.5], [33, 19.5], [31.5, 17]]);
      pc.mirror(hs, [[16, 19], [21, 19], [21.8, 30], [21, 36], [19.5, 41], [18, 35], [16.5, 28]]);
      break;
    case 'twintail':
      zig([[17.5, 26], [20, 22], [22.5, 27.5], [25, 22], [28, 28], [31, 22], [33.5, 28.5], [36.5, 22], [39.5, 27.5], [42.5, 22], [46.5, 26]]);
      pc.mirror(hs, [[16, 18], [21.5, 18], [22, 30], [21.2, 37], [19.5, 42], [18, 36], [16.5, 29]]);
      { const tie = pc.reg('ties', '#e04848', { z: 5.5, shW: 1 }); pc.ell(tie, 15.5, 16, 2.4, 2.2); pc.ell(tie, 48.5, 16, 2.4, 2.2); }
      break;
    case 'bob':
      zig([[17.5, 27], [20.5, 26], [23, 28], [26, 26.5], [29, 28], [32, 26.5], [35, 28], [38, 26.5], [41, 28], [43.5, 26], [46.5, 27]]);
      pc.mirror(hs, [[15, 18], [22, 18], [23, 36], [22, 40.5], [19, 42], [16, 40], [14.5, 33]]);
      break;
    case 'messy':
      zig([[17.5, 24], [19.5, 21], [22, 25], [25, 20], [28, 24.5], [31, 19.5], [34, 24], [37, 19.5], [40, 23.5], [43, 19.5], [46.5, 22]]);
      pc.poly(hf, [[17, 17], [13, 12], [20, 13]]); pc.poly(hf, [[21, 12], [20, 5], [27, 10]]); pc.poly(hf, [[28, 10], [32, 3], [35, 10]]); pc.poly(hf, [[37, 10], [44, 5], [43, 13]]); pc.poly(hf, [[45, 14], [51, 12], [47, 18]]);
      pc.poly(hs, [[16.5, 18], [21, 18], [20.5, 30], [17.5, 28]]); pc.poly(hs, [[47.5, 18], [43, 18], [43.5, 30], [46.5, 28]]);
      break;
    case 'spiky':
      zig([[17.5, 22], [20, 20], [23, 23], [26, 19.5], [29, 23], [32, 19.5], [35, 23], [38, 19.5], [41, 22.5], [44, 19.5], [46.5, 21]]);
      for (const [x, y] of [[18, 5], [25, 1], [32, 0], [39, 1], [46, 5]]) pc.poly(hf, [[x - 4.5, 14], [x, y], [x + 4.5, 14]]);
      pc.poly(hs, [[16.5, 18], [21, 18], [20.5, 29], [17.5, 27]]); pc.poly(hs, [[47.5, 18], [43, 18], [43.5, 29], [46.5, 27]]);
      break;
    default: // short
      zig([[17.5, 24], [20, 21], [22.5, 24.5], [25.5, 20.5], [28.5, 24.5], [31.5, 20], [34.5, 24], [37.5, 20.5], [40.5, 23.5], [43.5, 20.5], [46.5, 22.5]]);
      pc.poly(hs, [[16.5, 18], [21, 18], [20.5, 30], [17.5, 28.5]]); pc.poly(hs, [[47.5, 18], [43, 18], [43.5, 30], [46.5, 28.5]]);
  }
}
function porHat(pc, L) {
  const hat = (name, col, o = {}) => pc.reg(name, col, Object.assign({ z: 6, shW: 2, cast: true }, o));
  switch (L.hat) {
    case 'witch': {
      const h1 = hat('hat', '#2e1a40', { hl: .25 }); pc.poly(h1, [[19, 14], [45, 14], [41, 3], [35, -3], [27, 1]]); pc.poly(h1, [[34, -3], [43, -1], [52, 4], [49, 6], [41, 3]]);
      const br = hat('brim', '#24142e', { z: 6.2, hl: .25, shW: 1 }); pc.ell(br, 32, 14.5, 24, 3.6);
      const bd = hat('band', '#8a4ad0', { z: 6.1, shW: 1 }); pc.poly(bd, [[19.5, 10.5], [44.5, 10.5], [45, 13.5], [19, 13.5]]);
      const bk = hat('buckle', '#f2c430', { z: 6.3, shW: 1, line: false }); pc.rect(bk, 37, 10, 3, 4);
      break;
    }
    case 'bunny': {
      const e = hat('ears', '#ffffff', { hl: .1 }); pc.ell(e, 24.5, 3.5, 3.6, 10.5); pc.ell(e, 40, 2.5, 3.6, 10.5);
      const ei = hat('earIn', '#f5a0b8', { z: 6.1, shW: 1, line: false }); pc.ell(ei, 24.5, 4, 1.6, 7); pc.ell(ei, 40, 3, 1.6, 7);
      const hb = hat('band', '#151215', { z: 6.2, shW: 1, hl: .4 }); pc.fill(hb, (x, y) => { const v = ((x - 32) / 16) ** 2 + ((y - 21.5) / 12.2) ** 2; return v <= 1 && v >= .8 && y < 17; });
      break;
    }
    case 'nurse': {
      const c = hat('cap', '#ffffff', { hl: .1 }); pc.poly(c, [[21, 13], [43, 13], [41, 5], [23, 5]]);
      const cr = hat('cross', '#d02030', { z: 6.1, rim: false, line: false }); pc.rect(cr, 31, 6, 2, 6); pc.rect(cr, 29, 8, 6, 2);
      break;
    }
    case 'frog': {
      const f = hat('frog', '#3a8a30'); pc.ell(f, 32, 15, 18.5, 9, (x, y) => y < 19); pc.poly(f, [[13.5, 15], [50.5, 15], [51.5, 22], [47, 19], [17, 19], [12.5, 22]]);
      const ey = hat('eyes', '#5cb444', { z: 6.1 }); pc.ell(ey, 21, 6, 5.5, 5.5); pc.ell(ey, 43, 6, 5.5, 5.5);
      const ew = hat('ew', '#ffffff', { z: 6.2, shW: 1 }); pc.ell(ew, 21, 5.5, 3.2, 3.2); pc.ell(ew, 43, 5.5, 3.2, 3.2);
      const ep = hat('ep', '#141014', { z: 6.3, rim: false, line: false }); pc.rect(ep, 21, 4, 2, 3); pc.rect(ep, 43, 4, 2, 3);
      const cr = hat('crown', '#f2c430', { z: 6.2, shW: 1 }); pc.poly(cr, [[27, 11], [37, 11], [38, 4], [35, 7.5], [32, 3], [29, 7.5], [26, 4]]);
      break;
    }
    case 'clown': {
      const c = hat('cone', '#ffffff', { hl: .1 }); pc.poly(c, [[21, 14], [43, 14], [32, -4]]);
      const pm = hat('pom', '#151215', { z: 6.1, shW: 1 }); pc.ell(pm, 29, 9, 1.8, 1.8); pc.ell(pm, 34, 3, 1.6, 1.6);
      const rb = hat('ball', '#d02030', { z: 6.2, shW: 1 }); pc.ell(rb, 32, -1, 3, 3);
      break;
    }
    case 'bandana': {
      const b = hat('bandana', '#a02a2a', { tex: (x, y, t) => ((x * 3 + y * 5) % 11 === 0 && t === 2 ? 0 : t) }); pc.poly(b, [[16, 19], [48, 19], [47, 12], [17, 12]]); pc.poly(b, [[46, 15], [56, 20], [53, 25], [47, 19]]);
      break;
    }
    case 'ribbon': {
      const r = hat('bows', '#1c181e', { hl: .35 });
      for (const sx of [1, -1]) { const cx = sx > 0 ? 18 : 46; pc.ell(r, cx - 4 * sx, 9, 4, 3.2); pc.ell(r, cx + 3.5 * sx, 12.5, 3.4, 2.6); pc.poly(r, [[cx, 11], [cx - 3 * sx, 18], [cx - .5 * sx, 17]]); }
      const k = hat('knot', '#c0102a', { z: 6.1, shW: 1 }); pc.ell(k, 18, 11, 1.6, 1.6); pc.ell(k, 46, 11, 1.6, 1.6);
      const nd = hat('quill', '#f4f0e8', { z: 5.9, shW: 1, tex: (x, y, t) => ((x + y) % 2 && t === 2 ? 1 : t) }); pc.poly(nd, [[49, 11], [55, 0], [59, -2], [57, 4], [51, 12]]);
      break;
    }
    case 'crown': { const c = hat('crown', '#f2c430'); pc.poly(c, [[24, 12], [40, 12], [42, 1], [37, 6], [32, -1], [27, 6], [22, 1]]); const g = hat('cgem', '#d02030', { z: 6.1, shW: 1 }); pc.ell(g, 32, 8, 1.6, 1.6); break; }
    case 'straw': {
      const s = hat('straw', '#e2bc6c', { tex: (x, y, t) => ((x + y) % 4 === 0 && t === 2 ? 3 : t) }); pc.ell(s, 32, 9.5, 13.5, 7, (x, y) => y < 14);
      const br = hat('brim', '#d8b060', { z: 6.2, shW: 1 }); pc.ell(br, 32, 14.5, 27, 4.2);
      const bd = hat('band', '#a03030', { z: 6.1, shW: 1 }); pc.rect(bd, 19, 11, 26, 2);
      break;
    }
  }
}
function porFace(p, pc, L, fem, emo, talk, blink) {
  const sk = L.skin || '#f2c6a0', T = skinTones(sk), faceId = pc.R.find(r => r.name === 'face').id;
  const onFace = (x, y) => pc.at(x, y) === faceId;
  const lash = mix('#22101a', porOutline(L.hair || '#3a2a1a'), .35);
  const ec = L.eyes || '#3a6a9a';
  const pal = { K: lash, W: '#fbf8f6', D: shade(ec, -.4), I: ec, L: shade(ec, .38), P: '#140a14', H: '#ffffff', h: '#e8f4ff', s: T[3] };
  const creepy = emo === 'creepy';
  // брови
  const bc = mix(porOutline(L.hair || '#3a2a1a'), L.hair || '#3a2a1a', .35);
  const browY = fem ? 25 : 25.5;
  const brow = (x0, dir) => {
    for (let i = 0; i < 7; i++) {
      const inner = dir > 0 ? i : 6 - i; // 0 — у переносицы
      let y = browY + (inner > 1 && inner < 6 ? -1 : 0);
      if (emo === 'angry') y = browY - 2 + Math.round((6 - inner) * .45);
      else if (emo === 'sad') y = browY - 1 + Math.round(inner * .35) - (inner < 2 ? 1 : 0);
      else if (emo === 'surprised') y -= 2;
      const x = x0 + i;
      if (onFace(x, Math.round(y))) p.p(x, Math.round(y), bc);
      if (!fem && onFace(x, Math.round(y) + 1) && inner < 5) p.p(x, Math.round(y) + 1, bc);
    }
  };
  if (!creepy) { brow(35, 1); brow(22, -1); }
  // глаза
  const E = fem ? EYES_F : EYES_M, rx = fem ? 34 : 35, ey = fem ? 28 : 29, w = E.open[0].length;
  const lx = 64 - rx - w;
  let kR = 'open', kL = 'open';
  if (emo === 'happy') kR = kL = 'happy';
  else if (emo === 'surprised') kR = kL = 'wide';
  else if (emo === 'angry') kR = kL = 'half';
  else if (emo === 'sad') kR = kL = 'sad';
  else if (emo === 'wink') kR = 'happy';
  else if (emo === 'blush') kR = kL = fem ? 'open' : 'half';
  if (blink && kR !== 'happy') kR = 'closed'; if (blink && kL !== 'happy') kL = 'closed';
  if (creepy) {
    for (const cx of [lx + w / 2, rx + w / 2]) { for (let y = ey; y < ey + 5; y++) for (let x = Math.floor(cx - 4); x < cx + 4; x++) if (((x + .5 - cx) / 4) ** 2 + ((y + .5 - ey - 2.5) / 2.6) ** 2 <= 1) p.p(x, y, '#0a0406'); p.p(Math.floor(cx), ey + 2, '#ff1a2a'); p.p(Math.floor(cx), ey + 1, '#ff8a8a'); }
  } else {
    stamp(p, E[kR], rx, ey, pal, false, onFace);
    stamp(p, E[kL], lx, ey, pal, true, onFace);
  }
  if (L.eyeStyle === 'void') { for (const cx of [lx + 4, rx + 4]) { p.r(cx - 2, ey + 1, 4, 3, '#000'); p.p(cx, ey + 2, '#f00'); } }
  // румянец
  const cheek = (cx) => { for (let x = cx - 2; x <= cx + 2; x++) for (let y = 34; y <= 35; y++) if (onFace(x, y)) p.p(x, y, '#f07890', emo === 'blush' || emo === 'wink' ? 150 : 60); };
  if (fem || emo === 'blush') { cheek(25); cheek(39); }
  if (emo === 'blush' || emo === 'wink') for (const cx of [24, 38]) for (let k = 0; k < 3; k++) { p.p(cx + k * 2, 35, '#e04a68'); p.p(cx + k * 2 + 1, 34, '#e04a68'); }
  // нос
  if (fem) { p.p(32, 35, T[3]); p.p(32, 36, T[4]); p.p(31, 34, T[1]); }
  else { p.p(33, 33, T[3]); p.p(33, 34, T[3]); p.p(32, 35, T[4]); p.p(33, 35, T[4]); p.p(32, 33, T[1]); }
  // рот
  const lip = L.lips || mix(T[4], '#c04050', .35);
  const mpal = { M: mix(porOutline(sk), lip, .3), l: shade(lip, .25), R: '#7a1828', T: '#e86a7a', W: '#ffffff' };
  let mk = 'line';
  if (creepy) {
    for (let x = 24; x <= 40; x++) { const yy = 38 + Math.round(((x - 32) / 8) ** 2 * -2) + 2; p.p(x, yy - 1, '#2a0408'); p.p(x, yy, x % 2 ? '#f2ece0' : '#2a0408'); p.p(x, yy + 1, '#2a0408'); }
  } else {
    if (emo === 'happy') mk = talk ? 'talk2' : 'happy';
    else if (emo === 'sad') mk = talk ? 'sadtalk' : 'sad';
    else if (emo === 'angry') mk = talk ? 'angrytalk' : 'angry';
    else if (emo === 'surprised') mk = 'surprised';
    else if (emo === 'wink') mk = talk ? 'talk' : 'smirk';
    else if (emo === 'blush') mk = talk ? 'talk' : 'smile';
    else mk = talk ? 'talk' : 'line';
    const m = MOUTHS[mk], mw = m[0].length, my = fem ? 38 : 39 + (mk === 'happy' || mk === 'angrytalk' ? -1 : 0);
    stamp(p, m, 32 - Math.floor(mw / 2), my, mpal);
    if (fem && mk === 'line') { p.p(31, 38, mix(mpal.M, lip, .6)); p.p(33, 38, mix(mpal.M, lip, .6)); p.p(32, 39, lip); }
  }
  if (emo === 'sad' && fem) { p.p(rx + 7, ey + 5, '#9ad8ff'); p.p(rx + 7, ey + 6, '#6ab8ef'); }
}
function porSpecialDetails(p, pc, L) {
  if (L.glasses) {
    const fr = '#3a3a44', lens = 'rgba(0,0,0,0)';
    for (const x0 of [21, 35]) { p.hl(x0, x0 + 8, 27, fr); p.hl(x0, x0 + 8, 34, fr); p.vl(x0, 27, 34, fr); p.vl(x0 + 8, 27, 34, fr); p.p(x0 + 1, 28, '#ffffff'); p.p(x0 + 2, 28, '#d8e8ff'); }
    p.hl(30, 34, 29, fr);
  }
  if (L.scar) { for (let k = 0; k < 9; k++) p.p(39 + Math.round(k * .35), 22 + k, '#b05a50'); }
}
function porBeard(pc, L) {
  if (L.beard) { const b = pc.reg('beard', L.beard, { z: 3.5, shW: 2, cast: true, tex: strandTex({ k: .5 }) }); pc.poly(b, [[19.6, 31], [23, 36], [27, 38], [37, 38], [41, 36], [44.4, 31], [44, 40], [38, 47], [32, 49], [26, 47], [20, 40]]); }
  if (L.mustache) { const m = pc.reg('stache', L.mustache, { z: 3.6, shW: 1, cast: true }); pc.poly(m, [[24.5, 38.5], [28, 36], [32, 36.8], [36, 36], [39.5, 38.5], [41.5, 41.5], [36, 39.2], [32, 39.6], [28, 39.2], [22.5, 41.5]]); }
}

/* ---------- сборка ---------- */
function portrait(id, emo = 'neutral', talk = false, blink = false) {
  return spr(`por:${id}:${emo}:${talk ? 1 : 0}:${blink ? 1 : 0}`, () => {
    const D = PORTRAITS[id] || PORTRAITS.player;
    const L = (typeof D === 'function') ? D() : D;
    if (L.special) return L.special(emo, talk, blink);
    return drawPortrait(L, emo, talk, blink);
  });
}
function drawPortrait(L, emo, talk = false, blink = false) {
  const fem = !!L.fem, pc = new PorCanvas();
  porHair(pc, L, fem, true);
  porHead(pc, L, fem);
  const cl = porClothes(pc, L, fem) || {};
  if (L.clownface) { const f = pc.R.find(r => r.name === 'face'); f.t = skinTones('#f6f2ee'); }
  porBeard(pc, L);
  porHair(pc, L, fem, false);
  porHat(pc, L);
  const p = pc.render();
  const skT = skinTones(L.skin || '#f2c6a0');
  if (cl.cleave) { const [x, y0, y1] = cl.cleave; for (let y = y0; y <= y1; y++) { const id = pc.at(x, y); if (id >= 0 && pc.R[id].name === 'chest') p.p(x, y, y === y1 ? skT[3] : skT[4]); } }
  for (const sx of [1, -1]) for (let y = 56; y < 64; y++) { const x = 32 + sx * (fem ? 18 : 22) + sx * Math.round((y - 56) * .15); const id = pc.at(x, y); if (id >= 0 && pc.R[id].z >= 2 && pc.R[id].z < 2.2) p.p(x, y, pc.R[id].t[4]); }
  if (cl.cleave) for (const sx of [1, -1]) for (let k = 0; k < 4; k++) { const x = 32 + sx * (3 + k), y = 50 + (k > 1 ? 1 : 0); const id = pc.at(x, y); if (id >= 0 && pc.R[id].name === 'chest') p.p(x, y, skT[3]); }
  if (cl.pecs) { for (let x = 22; x <= 42; x++) { const id = pc.at(x, 50); if (id >= 0 && pc.R[id].name === 'chest' && Math.abs(x - 32) > 2) p.p(x, 50 + (Math.abs(x - 32) > 7 ? 1 : 0), skT[3]); } }
  porFace(p, pc, L, fem, emo, talk, blink);
  porSpecialDetails(p, pc, L);
  if (L.clownface) { p.p(26, 34, '#141014'); p.p(25, 35, '#141014'); p.p(38, 34, '#141014'); p.p(39, 35, '#141014'); p.r(31, 34, 3, 3, '#d02030'); p.p(31, 34, '#ff8a9a'); }
  if (emo === 'creepy' && !L.ghost) { for (const x of [26, 38]) for (let y = 34; y < 34 + 6 + (x % 3); y++) p.p(x, y, '#8a0010'); }
  if (L.ghost || emo === 'creepy') p.map((x, y, c) => emo === 'creepy' && !L.ghost ? [c[0] * .92 + 18, c[1] * .74, c[2] * .76, c[3]] : [c[0] * .72 + 62, c[1] * .78 + 60, c[2] * .8 + 70, c[3] * .92]);
  return p.done();
}

/* ---------- особые портреты (Чешир, Гробус, Жмуримо, фея) ---------- */
function specialPortrait(kind, emo, talk, blink) {
  const pc = new PorCanvas();
  if (kind === 'cat') {
    const fur = pc.reg('fur', '#9a5ad0', { z: 3, shW: 3, deep: true, tex: (x, y, t) => { const a = Math.atan2(y - 30, x - 32) * 3 + Math.hypot(x - 32, y - 30) * .25; return (a - Math.floor(a)) < .3 && t < 4 ? Math.min(4, t + 1) : t; } });
    pc.ell(fur, 32, 34, 23, 19); pc.poly(fur, [[11, 26], [14, 3], [27, 19]]); pc.poly(fur, [[53, 26], [50, 3], [37, 19]]);
    const ein = pc.reg('earIn', '#e070c0', { z: 3.5, shW: 1 }); pc.poly(ein, [[15, 22], [16.5, 9], [23, 19]]); pc.poly(ein, [[49, 22], [47.5, 9], [41, 19]]);
    const body = pc.reg('body', '#7a3a8a', { z: 1, shW: 3 }); pc.poly(body, [[6, 64], [58, 64], [52, 50], [12, 50]]);
    const p = pc.render();
    for (const cx of [23, 41]) { if (blink) { p.hl(cx - 4, cx + 4, 30, '#2a0a2a'); continue; } p.ell(cx, 30, 5, 6, emo === 'creepy' ? '#100008' : '#f2e040'); p.ell(cx, 31, 5, 4, emo === 'creepy' ? '#100008' : '#d8b820'); p.r(cx - 1, 25, 2, 11, '#120a14'); p.p(cx + 2, 27, '#ffffff'); if (emo === 'creepy') p.p(cx, 30, '#ff1a2a'); }
    const gw = talk ? 7 : 5;
    p.poly([[11, 40], [53, 40], [45, 40 + gw + 4], [19, 40 + gw + 4]], '#2a0a2a');
    for (let x = 14; x < 50; x += 3) p.r(x, 40, 2, 3, '#fff8f0');
    for (let x = 21; x < 44; x += 3) p.r(x, 40 + gw + 1, 2, 3, '#fff8f0');
    p.hl(11, 53, 39, '#2a0a2a'); p.poly([[30, 36], [34, 36], [32, 38]], '#e070c0');
    return p.done();
  }
  if (kind === 'shadow') {
    const b = pc.reg('cloak', '#1c1622', { z: 1, shW: 4, deep: true, hl: .25 }); pc.ell(b, 32, 28, 17, 19); pc.poly(b, [[4, 64], [60, 64], [52, 42], [12, 42]]);
    const p = pc.render();
    for (const cx of [25, 39]) { if (blink) { p.hl(cx - 3, cx + 3, 28, '#8a6ae0'); continue; } p.ell(cx, 28, 4, 5, '#e8e0ff'); p.ell(cx, 29, 2, 3, '#6a40c0'); p.p(cx - 1, 27, '#ffffff'); }
    if (emo === 'happy' || talk) { p.line(27, 40, 32, 43, '#cfc4ff'); p.line(32, 43, 37, 40, '#cfc4ff'); }
    p.map((x, y, c) => U.hash(x, y, 7) < .07 && c[0] < 60 ? [46, 38, 56, c[3]] : null);
    return p.done();
  }
  if (kind === 'zhmur') {
    const g = pc.reg('jelly', '#8ef08e', { z: 2, shW: 3, deep: true, hl: .5 }); pc.ell(g, 32, 38, 21, 19); pc.ell(g, 32, 52, 24, 12);
    const st = pc.reg('stem', '#3a8a3a', { z: 3, shW: 1 }); pc.rect(st, 31, 9, 2, 12);
    const lf = pc.reg('leaf', '#5ac85a', { z: 3.1, shW: 1 }); pc.ell(lf, 37, 9, 5, 2.6); pc.ell(lf, 26, 12, 4, 2.2);
    const p = pc.render();
    for (const cx of [24, 40]) { if (blink) { p.hl(cx - 3, cx + 3, 35, '#123a12'); continue; } p.ell(cx, 35, 3.5, 4.5, '#0e1a0e'); p.p(cx - 1, 33, '#ffffff'); p.p(cx, 33, '#ffffff'); }
    if (talk || emo === 'happy') p.ell(32, 45, 3.5, 2.5, '#2a5a2a'); else p.hl(30, 34, 45, '#2a5a2a');
    p.ell(19, 42, 3, 1.5, '#f08aa0', 120); p.ell(45, 42, 3, 1.5, '#f08aa0', 120);
    return p.done();
  }
  if (kind === 'fairy') {
    const L = { fem: true, skin: '#f8e0c8', hair: '#5aca5a', hairStyle: 'bob', eyes: '#3a9a5a', top: '#7ad87a', outfit: 'frog', lips: '#d07070' };
    const wing = pc.reg('wing', '#c8f8e8', { z: -1, shW: 2, hl: .3 }); pc.ell(wing, 12, 28, 11, 17); pc.ell(wing, 52, 28, 11, 17);
    porHair(pc, L, true, true); porHead(pc, L, true); porClothes(pc, L, true); porHair(pc, L, true, false);
    const lf = pc.reg('leafhat', '#3aa03a', { z: 6, shW: 2, tex: (x, y, t) => (Math.abs(y - 9.5 - (x - 32) * -.12) < .6 && x > 21 && x < 44 ? 3 : t) }); pc.poly(lf, [[19, 13], [26, 7], [35, 5], [45, 6], [41, 11], [32, 14]]);
    const stm = pc.reg('stem', '#2a7a2a', { z: 6.1, shW: 1 }); pc.poly(stm, [[44, 6], [49, 1], [50, 2], [46, 7]]);
    const p = pc.render();
    p.map((x, y, c) => (pc.R[pc.at(x, y)] && pc.R[pc.at(x, y)].name === 'wing') ? [c[0], c[1], c[2], 170] : null);
    porFace(p, pc, L, true, emo, talk, blink);
    return p.done();
  }
  return new PX(64, 64).done();
}
