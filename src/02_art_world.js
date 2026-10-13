/* ============================================================
   Графика мира: тайлы земли, объекты, постройки
   ============================================================ */
// Тайлы земли
const G_ = { GRASS: 0, DIRT: 1, COBBLE: 2, SAND: 3, WATER: 4, SWAMP: 5, CLIFF: 6, WOOD: 7, IWALL: 8, BRIDGE: 9, DFLOOR: 10, DWALL: 11, CARPET: 12, TILE: 13, VOID: 14, BLOOD: 15, STONE: 16, DGRASS: 17, PAPER: 18 };
const SOLID_GROUND = new Set([G_.WATER, G_.SWAMP, G_.CLIFF, G_.IWALL, G_.DWALL, G_.VOID, G_.BLOOD]);
const WATERY = new Set([G_.WATER, G_.SWAMP, G_.BLOOD]);

const SEASON_GRASS = {
  0: ['#5f9e3c', '#6fb045', '#4f8a32', '#82c454'],   // весна
  1: ['#4c8f33', '#5aa03a', '#3f7a2a', '#6db446'],   // лето
  2: ['#a58a3c', '#b8983f', '#8a7030', '#c9a64c'],   // осень
  3: ['#e6edf3', '#f4f8fb', '#cfd9e4', '#ffffff'],   // зима
};
const DUNGEON_THEMES = {
  cellar: { floor: ['#5a4636', '#4e3c2e', '#66503e'], wall: '#2e231b', wallF: ['#4a3a2c', '#3c2f24'], acc: '#8a6a4a', light: '#ffb060' },
  flooded: { floor: ['#3c4a55', '#33404a', '#465661'], wall: '#1a232b', wallF: ['#2d3b47', '#24303a'], acc: '#5f8aa6', light: '#8fd0ff' },
  flesh: { floor: ['#5c2228', '#4c1a20', '#6a2a30'], wall: '#250a0e', wallF: ['#4a1218', '#3a0d12'], acc: '#b0303c', light: '#ff5060' },
  library: { floor: ['#e8e4dc', '#dcd6cc', '#f2efe8'], wall: '#111111', wallF: ['#2a2a2a', '#1e1e1e'], acc: '#000000', light: '#ffffff' },
  abyss: { floor: ['#2a1d3a', '#22172f', '#33244a'], wall: '#0b0710', wallF: ['#1d1428', '#160f1f'], acc: '#7a4ad0', light: '#c080ff' },
};

function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sm = v => v * v * (3 - 2 * v), a = U.hash(xi, yi, s), b = U.hash(xi + 1, yi, s), c = U.hash(xi, yi + 1, s), d = U.hash(xi + 1, yi + 1, s);
  const u = sm(xf), v = sm(yf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function drawGroundTile(px, tx, ty, t, map) {
  const X = tx * TS, Y = ty * TS, season = map.outdoor ? S.season : 0;
  const H = (i, j, s) => U.hash(X + i, Y + j, s);
  const at = (dx, dy) => map.groundAt(tx + dx, ty + dy);
  const grassCols = map.theme === 'forest' && season !== 3 ? SEASON_GRASS[season].map(c => shade(c, -0.15)) : SEASON_GRASS[season];
  const fillNoise = (cols, s = 1) => { for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) { const r = H(i, j, s); px.p(X + i, Y + j, r < .6 ? cols[0] : r < .82 ? cols[1] : r < .96 ? cols[2] : cols[3] || cols[0]); } };
  switch (t) {
    case G_.GRASS: case G_.DGRASS: {
      const g = t === G_.DGRASS ? grassCols.map(c => shade(c, -.12)) : grassCols;
      const lo = shade(g[0], -.07), hi = shade(g[0], .06);
      for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) {
        const n = vnoise((X + i) / 22, (Y + j) / 22, 3) * .7 + vnoise((X + i) / 7, (Y + j) / 7, 8) * .3;
        px.p(X + i, Y + j, n < .38 ? lo : n > .66 ? hi : g[0]);
      }
      // пучки травы
      const nt = season === 3 ? 2 : 4;
      for (let k = 0; k < nt; k++) {
        const i = 1 + Math.floor(H(k, 99, 3) * 12), j = 3 + Math.floor(H(k, 77, 4) * 12);
        const dk = season === 3 ? '#b8c6d6' : shade(g[2], -.05), lt = season === 3 ? '#ffffff' : g[3];
        px.p(X + i, Y + j, dk); px.p(X + i, Y + j - 1, dk); px.p(X + i, Y + j - 2, lt);
        px.p(X + i + 2, Y + j, dk); px.p(X + i + 2, Y + j - 1, lt);
        px.p(X + i + 1, Y + j, dk); px.p(X + i - 1, Y + j - 1, lt);
      }
      if (map.outdoor && season < 2 && H(5, 5, 9) < .1) {
        const i = 3 + Math.floor(H(1, 1, 5) * 10), j = 3 + Math.floor(H(2, 2, 5) * 10); const c = ['#f7e26b', '#f6a6c8', '#ffffff', '#a8d4ff'][Math.floor(H(3, 3, 5) * 4)];
        px.p(X + i, Y + j - 1, c); px.p(X + i - 1, Y + j, c); px.p(X + i + 1, Y + j, c); px.p(X + i, Y + j + 1, c); px.p(X + i, Y + j, '#e0a020'); px.p(X + i, Y + j + 2, shade(g[2], -.2));
      }
      if (map.outdoor && season === 2 && H(6, 6, 9) < .25) { const i = 2 + Math.floor(H(1, 4, 5) * 12), j = 2 + Math.floor(H(4, 1, 5) * 12); px.p(X + i, Y + j, '#c8501e'); px.p(X + i + 1, Y + j, '#e07a2a'); }
      if (H(7, 7, 9) < .06) { const i = 2 + Math.floor(H(2, 5, 5) * 12), j = 2 + Math.floor(H(5, 2, 5) * 12); px.p(X + i, Y + j, '#a8a29a'); px.p(X + i + 1, Y + j, '#8a847c'); px.p(X + i, Y + j - 1, '#d0ccc4'); }
      if (season === 3 && H(8, 8, 9) < .3) { px.p(X + Math.floor(H(9, 1, 5) * 16), Y + Math.floor(H(1, 9, 5) * 16), '#ffffff'); }
      break;
    }
    case G_.DIRT: {
      const c = season === 3 ? ['#c4beb8', '#b0a9a2', '#dedad6', '#958d85'] : ['#a77c4c', '#966b40', '#bb915c', '#7a5532'];
      for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) { const n = vnoise((X + i) / 9, (Y + j) / 9, 11); px.p(X + i, Y + j, n < .33 ? c[1] : n > .7 ? c[2] : c[0]); }
      for (let k = 0; k < 3; k++) { const i = 1 + Math.floor(H(k, 3, 8) * 13), j = 1 + Math.floor(H(k, 4, 8) * 13); px.p(X + i, Y + j, c[3]); px.p(X + i + 1, Y + j, c[3]); px.p(X + i, Y + j - 1, shade(c[2], .2)); px.p(X + i + 1, Y + j - 1, c[2]); }
      if (H(1, 1, 15) < .3) { const i = 2 + Math.floor(H(2, 1, 16) * 10), j = 2 + Math.floor(H(1, 2, 16) * 10); px.line(X + i, Y + j, X + i + 3, Y + j + 1, c[3]); }
      // травяная кромка с пучками
      const g = grassCols, ge = (gx) => g[gx];
      if (at(0, -1) === G_.GRASS) for (let i = 0; i < 16; i++) { const d = 1 + Math.floor(H(i, 0, 11) * 3); for (let j = 0; j < d; j++) px.p(X + i, Y + j, ge(j === d - 1 ? 2 : 0)); }
      if (at(0, 1) === G_.GRASS) for (let i = 0; i < 16; i++) { const d = 1 + Math.floor(H(i, 1, 12) * 2); for (let j = 0; j < d; j++) px.p(X + i, Y + 15 - j, ge(j === d - 1 ? 3 : 0)); }
      if (at(-1, 0) === G_.GRASS) for (let j = 0; j < 16; j++) { const d = 1 + Math.floor(H(0, j, 13) * 2); for (let i = 0; i < d; i++) px.p(X + i, Y + j, ge(i === d - 1 ? 2 : 0)); }
      if (at(1, 0) === G_.GRASS) for (let j = 0; j < 16; j++) { const d = 1 + Math.floor(H(1, j, 14) * 2); for (let i = 0; i < d; i++) px.p(X + 15 - i, Y + j, ge(i === d - 1 ? 2 : 0)); }
      break;
    }
    case G_.COBBLE: case G_.STONE: {
      const base = t === G_.STONE ? '#6d6a70' : (season === 3 ? '#9aa3ad' : '#8a8580');
      px.r(X, Y, 16, 16, shade(base, -0.35));
      const stones = [[3, 3, 3, 2], [10, 2, 3, 2], [6, 8, 3, 3], [13, 9, 2, 2], [2, 12, 2, 2], [10, 13, 3, 2]];
      for (const [cx, cy, rx, ry] of stones) { px.ell(X + cx, Y + cy, rx, ry, shade(base, (H(cx, cy, 2) - .5) * .25)); px.p(X + cx - 1, Y + cy - 1, shade(base, .25)); }
      break;
    }
    case G_.SAND: fillNoise(['#e4cf95', '#d9c085', '#efdcaa', '#c9ad70'], 4); break;
    case G_.WATER: case G_.SWAMP: case G_.BLOOD: {
      const base = t === G_.SWAMP ? ['#3e5e3a', '#36522f', '#4b6d44'] : t === G_.BLOOD ? ['#7a0c18', '#650a14', '#8f1420'] : (map.theme === 'dungeon' ? ['#28445e', '#223a52', '#30506c'] : ['#3d74b8', '#3567a6', '#4a84c8']);
      for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) { const r = H(i, j, 6); px.p(X + i, Y + j, r < .7 ? base[0] : r < .9 ? base[1] : base[2]); }
      for (let k = 0; k < 2; k++) { const i = Math.floor(H(k, 7, 5) * 11), j = Math.floor(H(k, 8, 5) * 15); px.hl(X + i, X + i + 3, Y + j, shade(base[2], .25)); }
      const foam = t === G_.SWAMP ? '#7a9a5a' : t === G_.BLOOD ? '#c0303c' : '#a8d4f5';
      const land = (dx, dy) => { const n = at(dx, dy); return n !== null && !WATERY.has(n) && n !== G_.BRIDGE; };
      if (land(0, -1)) { px.hl(X, X + 15, Y, shade(base[0], -0.4)); px.hl(X, X + 15, Y + 1, shade(base[0], -0.25)); px.hl(X, X + 15, Y + 2, foam, 140); }
      if (land(0, 1)) { px.hl(X, X + 15, Y + 15, foam); px.hl(X, X + 15, Y + 14, foam, 120); }
      if (land(-1, 0)) { px.vl(X, Y, Y + 15, foam); px.vl(X + 1, Y, Y + 15, foam, 110); }
      if (land(1, 0)) { px.vl(X + 15, Y, Y + 15, foam); px.vl(X + 14, Y, Y + 15, foam, 110); }
      if (t === G_.SWAMP && H(1, 1, 33) < .15) { px.ell(X + 8, Y + 8, 3, 2, '#5f9e3c'); px.p(X + 8, Y + 7, '#3d6e28'); }
      break;
    }
    case G_.CLIFF: {
      const below = at(0, 1);
      if (below !== G_.CLIFF && below !== null) { // лицевая сторона скалы
        px.r(X, Y, 16, 16, '#6b5a48');
        for (let j = 0; j < 16; j += 4) for (let i = 0; i < 16; i++) if (H(i, j, 3) < .5) px.p(X + i, Y + j, '#4f4235');
        for (let i = 0; i < 16; i++) { px.p(X + i, Y + 15, '#3a3027'); px.p(X + i, Y, '#8a7860'); }
      } else { fillNoise(season === 3 ? ['#dfe6ee', '#cfd8e2', '#f0f4f8', '#b8c4d0'] : ['#4a5a3a', '#405032', '#55663f', '#384628'], 9); }
      break;
    }
    case G_.WOOD: {
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const row = Math.floor(j / 4); px.p(X + i, Y + j, (j % 4 === 3) ? '#5a3a1e' : (H(i, row, 2) < .2 ? '#a06e3e' : '#94643a')); }
      for (let r = 0; r < 4; r++) { const off = Math.floor(H(r, ty, 7) * 16); px.vl(X + off, Y + r * 4, Y + r * 4 + 2, '#6e4a28'); }
      break;
    }
    case G_.IWALL: {
      const pal = map.wall || ['#7b5a8c', '#6a4b7a', '#c9a24a'];
      const isF = (v) => v !== null && v !== G_.IWALL && v !== G_.VOID && v !== G_.DWALL;
      const face = isF(at(0, 1)) || (at(0, 1) === G_.IWALL && isF(at(0, 2)));
      if (!face) {
        // верх стены (вид сверху): тёмное дерево с окантовкой со стороны пола
        px.r(X, Y, 16, 16, '#2a1a10');
        for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if (H(i >> 2, j, 5) < .08) px.p(X + i, Y + j, '#332014');
        if (isF(at(1, 0))) { px.vl(X + 13, Y, Y + 15, '#5a3820'); px.vl(X + 14, Y, Y + 15, '#8a5a32'); px.vl(X + 15, Y, Y + 15, '#3a2414'); }
        if (isF(at(-1, 0))) { px.vl(X + 2, Y, Y + 15, '#5a3820'); px.vl(X + 1, Y, Y + 15, '#8a5a32'); px.vl(X, Y, Y + 15, '#3a2414'); }
        if (isF(at(0, -1))) { px.hl(X, X + 15, Y + 2, '#5a3820'); px.hl(X, X + 15, Y + 1, '#8a5a32'); px.hl(X, X + 15, Y, '#3a2414'); }
        break;
      }
      const lower = isF(at(0, 1));
      // обои: вертикальные полосы с мелким узором
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const gx = i + tx * 16, st = gx % 8;
        let c = st < 3 ? pal[1] : pal[0];
        if (st === 5 && (j + Y) % 6 === 2) c = pal[2];
        if (st === 3 || st === 7) c = mix(pal[0], pal[1], .5);
        px.p(X + i, Y + j, c);
      }
      if (!isF(at(0, 2)) && at(0, -1) !== G_.IWALL) { px.r(X, Y, 16, 3, '#5a3a22'); px.hl(X, X + 15, Y + 3, '#8a5a32'); px.hl(X, X + 15, Y, '#3a2414'); }
      else if (at(0, -1) !== G_.IWALL) { px.r(X, Y, 16, 2, '#5a3a22'); px.hl(X, X + 15, Y + 2, '#8a5a32'); }
      if (lower) {
        // деревянная панель и плинтус
        px.r(X, Y + 6, 16, 10, '#8a5a32');
        px.hl(X, X + 15, Y + 6, '#b07a42'); px.hl(X, X + 15, Y + 7, '#5a3a22');
        for (let i = 0; i < 16; i += 8) { const x0 = X + i + 1; px.r(x0, Y + 9, 6, 4, '#7a4e2a'); px.hl(x0, x0 + 5, Y + 9, '#5a3a22'); px.vl(x0, Y + 9, Y + 12, '#5a3a22'); px.hl(x0, x0 + 5, Y + 13, '#a06e3e'); px.vl(x0 + 5, Y + 9, Y + 13, '#a06e3e'); }
        px.r(X, Y + 14, 16, 2, '#4a2e18'); px.hl(X, X + 15, Y + 14, '#6a4426');
      }
      break;
    }
    case G_.BRIDGE: {
      const vert = WATERY.has(at(-1, 0) || 0) && WATERY.has(at(1, 0) || 0);
      px.r(X, Y, 16, 16, '#8a5a30');
      if (vert) { for (let j = 0; j < 16; j += 4) { px.hl(X, X + 15, Y + j, '#5a3818'); } px.vl(X, Y, Y + 15, '#4a2e14'); px.vl(X + 15, Y, Y + 15, '#4a2e14'); }
      else { for (let i = 0; i < 16; i += 4) { px.vl(X + i, Y, Y + 15, '#5a3818'); } px.hl(X, X + 15, Y, '#4a2e14'); px.hl(X, X + 15, Y + 15, '#4a2e14'); }
      break;
    }
    case G_.DFLOOR: {
      const th = DUNGEON_THEMES[map.dtheme || 'cellar'];
      fillNoise(th.floor.concat([shade(th.floor[0], .1)]), 21);
      if (H(0, 0, 40) < .25) { const i = Math.floor(H(1, 0, 41) * 10) + 2, j = Math.floor(H(0, 1, 42) * 10) + 2; px.line(X + i, Y + j, X + i + 3, Y + j + 2, shade(th.floor[0], -.3)); px.line(X + i + 3, Y + j + 2, X + i + 4, Y + j + 5, shade(th.floor[0], -.3)); }
      if (map.dtheme === 'library' && H(2, 2, 43) < .3) { const j = 3 + Math.floor(H(3, 3, 44) * 10); px.hl(X + 2, X + 2 + Math.floor(H(4, 4, 45) * 10), Y + j, '#999'); }
      if (map.dtheme === 'flesh' && H(5, 5, 46) < .2) { px.circ(X + 8, Y + 8, 2, '#8a1a24'); }
      break;
    }
    case G_.DWALL: {
      const th = DUNGEON_THEMES[map.dtheme || 'cellar'];
      const below = at(0, 1);
      if (below !== null && below !== G_.DWALL && below !== G_.VOID) {
        for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const brick = ((Math.floor(j / 4) % 2) ? (i + 4) : i) % 8 === 0 || j % 4 === 0; px.p(X + i, Y + j, brick ? th.wallF[1] : th.wallF[0]); }
        px.hl(X, X + 15, Y, shade(th.wallF[0], .25)); px.hl(X, X + 15, Y + 15, shade(th.wallF[1], -.4));
        if (map.dtheme === 'library') { for (let i = 1; i < 15; i += 3) { px.r(X + i, Y + 3, 2, 10, ['#7a2a2a', '#2a3a6a', '#3a5a2a', '#5a4a2a'][Math.floor(H(i, ty, 5) * 4)]); } px.hl(X, X + 15, Y + 13, '#3a2a1a'); }
        if (map.dtheme === 'flesh' && H(3, 3, 9) < .3) { px.ell(X + 8, Y + 8, 3, 2, '#f0e0d0'); px.circ(X + 8, Y + 8, 1, '#200'); }
      } else { px.r(X, Y, 16, 16, th.wall); for (let k = 0; k < 4; k++) px.p(X + Math.floor(H(k, 1, 3) * 16), Y + Math.floor(H(k, 2, 3) * 16), shade(th.wall, .15)); }
      break;
    }
    case G_.CARPET: { px.r(X, Y, 16, 16, '#8a2030'); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if ((i + j) % 6 === 0) px.p(X + i, Y + j, '#a8343f'); px.r(X, Y, 16, 1, '#c9a24a', 80); break; }
    case G_.TILE: { for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) px.p(X + i, Y + j, ((i >> 3) + (j >> 3)) % 2 ? '#d8e2e6' : '#b9cad2'); break; }
    case G_.PAPER: { px.r(X, Y, 16, 16, '#efece4'); for (let j = 2; j < 16; j += 4) px.hl(X, X + 15, Y + j, '#cfd6e0'); if (tx % 6 === 0) px.vl(X + 2, Y, Y + 15, '#e0a0a0'); break; }
    case G_.VOID: default: px.r(X, Y, 16, 16, '#000'); break;
  }
}

/* ---------- объекты (16x16 и крупнее) ---------- */
const OBJ_ART = {};
function treeSprite(kind, season, stage = 3, face = false) {
  return spr(`tree:${kind}:${season}:${stage}:${face}`, () => {
    if (stage < 3) { // саженец
      const p = new PX(16, 16);
      p.vl(8, 7, 15, '#6a4a2a'); p.p(9, 10, '#8a6a3a');
      const c = season === 2 ? '#c87a30' : '#4f9a3a';
      p.circ(8, 6 - stage, 2 + stage, shade(c, -.2)); p.circ(7, 5 - stage, 1 + stage, c); p.p(6, 4 - stage, shade(c, .35));
      p.selOutline(.6); return p.done();
    }
    const p = new PX(32, 48);
    const trunk = kind === 'dead' ? '#4e4444' : '#6e4a2a', trunkD = shade(trunk, -.32), trunkL = shade(trunk, .22);
    // корни и ствол
    p.poly([[12, 47], [20, 47], [19, 30], [13, 30]], trunk);
    p.poly([[9, 47], [13, 43], [14, 47]], trunk); p.poly([[23, 47], [19, 43], [18, 47]], trunk);
    for (let y = 30; y < 47; y++) { p.p(13, y, trunkL); p.p(19, y, trunkD); if (y % 4 === 0) p.p(16, y, trunkD); if (y % 5 === 2) p.p(15, y + 1, trunkD); }
    p.p(17, 38, trunkD); p.p(17, 37, shade(trunk, -.45)); p.hl(9, 23, 47, trunkD);
    if (face) { p.r(14, 35, 1, 2, '#000'); p.r(17, 35, 1, 2, '#000'); p.p(14, 35, '#ff2030'); p.p(17, 35, '#ff2030'); p.hl(14, 17, 40, '#000'); p.p(15, 41, '#000'); }
    const seasonCols = {
      oak: [['#5aa83c', '#3d8a2c', '#86cc5e', '#f6b0cc'], ['#3f8f2e', '#2a6a20', '#62b242', '#d02a2a'], ['#d9772b', '#a8481a', '#f2a845', '#f6d060'], null],
      pine: [['#2f7a46', '#1d5232', '#4f9e62'], ['#2a6e40', '#1a4a2c', '#45905a'], ['#2f6e46', '#1d4c32', '#4a8a5e'], ['#2f6e46', '#1d4c32', '#ffffff']],
      maple: [['#6ab04c', '#468830', '#92d26c'], ['#4a9a3a', '#2e6e24', '#6eb85a'], ['#c8302a', '#821818', '#f06040', '#f2a040'], null],
      dead: [null, null, null, null],
    }[kind] || [];
    const cols = seasonCols[season];
    if (kind === 'pine') {
      const c = cols;
      for (let k = 0; k < 4; k++) {
        const y0 = 3 + k * 7, w = 5 + k * 3, yb = y0 + 11;
        const pts = [[16, y0 - 2]]; for (let x = 16 + w; x >= 16 - w; x -= 2) pts.push([x, yb - ((x / 2) % 2 ? 1 : 0)]);
        p.poly(pts, c[1]);
        p.poly([[16, y0 - 2], [17, yb - 2], [16 - w + 2, yb - 2]], c[0]);
        p.poly([[16, y0], [16 - w / 3, y0 + 6], [15, y0 + 6]], c[2]);
        for (let x = 16 - w + 1; x < 16 + w; x += 3) p.p(x, yb - 2, shade(c[1], -.2));
        if (season === 3) { p.hl(16 - w + 2, 16 + w - 3, yb - 2, '#ffffff'); p.hl(16 - w + 3, 16, yb - 3, '#e8f0ff'); p.p(16, y0 - 1, '#fff'); }
      }
    } else if (cols) {
      const blobs = [[16, 15, 11], [7, 21, 7], [25, 21, 7], [11, 9, 7], [21, 9, 7], [16, 25, 8], [9, 15, 6], [23, 15, 6]];
      for (const [x, y, r] of blobs) p.circ(x, y, r, cols[1]);
      for (const [x, y, r] of blobs) p.circ(x - 1, y - 2, r - 2, cols[0]);
      for (const [x, y, r] of blobs) p.circ(x - 3, y - 4, Math.max(1, r - 5), cols[2]);
      // фактура листвы: «чешуйки» снизу каждого облачка
      for (const [x, y, r] of blobs) for (let a = .3; a < 2.9; a += .55) { const lx = x + Math.cos(a) * (r - 2), ly = y + Math.sin(a) * (r - 2); p.p(lx, ly, shade(cols[1], -.25)); p.p(lx + 1, ly - 1, cols[1]); }
      for (let k = 0; k < 14; k++) { const x = 4 + Math.floor(U.hash(k, 3, kind.length) * 22), y = 3 + Math.floor(U.hash(k, 4, season) * 20); p.p(x, y, cols[2]); p.p(x + 1, y, shade(cols[2], .2)); }
      if (cols[3]) for (let k = 0; k < 10; k++) { const x = 4 + Math.floor(U.hash(k, 7, 1) * 24), y = 4 + Math.floor(U.hash(k, 8, 1) * 22); if (p.a(x, y)) { p.p(x, y, cols[3]); if (season !== 1) p.p(x + 1, y, shade(cols[3], .3)); } }
      // ветка сквозь крону
      p.line(16, 30, 16, 26, trunk); p.line(16, 27, 12, 24, trunkD);
    } else { // голые ветки
      const bc = kind === 'dead' ? '#3a3232' : '#5a4030', bl = shade(bc, .25);
      const br = [[16, 30, 16, 6], [16, 20, 6, 10], [16, 16, 26, 6], [16, 24, 25, 16], [16, 26, 7, 18], [10, 14, 9, 7], [22, 11, 24, 3], [6, 10, 3, 8], [26, 6, 29, 5]];
      for (const [a, b, c, d] of br) { p.line(a, b, c, d, bc); p.line(a - 1, b, c - 1, d, bl); }
      p.r(15, 22, 3, 9, bc);
      if (season === 3 && kind !== 'dead') for (const [x, y] of [[6, 9], [26, 5], [16, 5], [25, 15], [9, 17], [10, 7]]) { p.p(x, y, '#fff'); p.p(x + 1, y, '#e8f0ff'); }
    }
    p.selOutline(.62);
    return p.done();
  });
}

function objSprite(o, frame = 0) {
  const t = o.t;
  switch (t) {
    case 'rock': return spr(`rock:${o.kind}:${o.v || 0}:${o.dt || ''}`, () => {
      const p = new PX(16, 16);
      const dark = o.dt === 'flesh' ? '#6a3a3e' : o.dt === 'library' ? '#c8c4bc' : o.dt === 'flooded' ? '#5f6e78' : '#7c7570';
      const big = o.kind === 'boulder';
      p.ell(8, 10, big ? 7 : 6, big ? 6 : 5, shade(dark, -.25));
      p.ell(7, 9, big ? 6 : 5, big ? 5 : 4, dark);
      p.ell(6, 7, 3, 2, shade(dark, .25));
      const ores = { copper: ['#e07a3a', '#ffb070'], iron: ['#c8d0d8', '#ffffff'], gold: ['#f2c430', '#fff2a0'], gem: ['#b04ae0', '#ff9cff'], coal: ['#1a1a1a', '#444'], mystic: ['#40e0d0', '#ff60ff'], geode: ['#a0784a', '#d8b080'] }[o.kind];
      if (ores) { for (let k = 0; k < 5; k++) { const x = 4 + Math.floor(U.hash(k, o.v || 0, 2) * 8), y = 6 + Math.floor(U.hash(k, 3, (o.v || 0) + 1) * 6); p.p(x, y, ores[0]); p.p(x + 1, y, ores[0]); p.p(x, y - 1, ores[1]); } }
      if (o.kind === 'geode') { p.ell(8, 10, 5, 4, '#8a6a44'); p.line(6, 8, 10, 12, '#4a3a24'); }
      p.selOutline(.62); return p.done();
    });
    case 'weed': return spr(`weed:${S.season}:${o.v || 0}`, () => {
      const p = new PX(16, 16); const c = [['#4f8f2e', '#6bb83e'], ['#3f7f26', '#5aa83a'], ['#a07a2a', '#c89a3a'], ['#7a8a8a', '#a0b0b0']][S.season];
      const v = o.v || 0;
      for (let k = 0; k < 6; k++) { const x = 3 + k * 2 + (v % 2), h = 4 + Math.floor(U.hash(k, v, 3) * 6); p.line(x, 14, x + (k % 2 ? 1 : -1), 14 - h, k % 2 ? c[0] : c[1]); }
      if (v % 3 === 0) { p.p(6, 6, '#f0e060'); p.p(11, 7, '#f0e060'); }
      p.selOutline(.62); return p.done();
    });
    case 'twig': return spr('twig', () => { const p = new PX(16, 16); p.line(3, 12, 13, 8, '#7a5230'); p.line(5, 9, 9, 11, '#6a4224'); p.line(10, 9, 12, 6, '#7a5230'); p.selOutline(.62); return p.done(); });
    case 'stump': return spr('stump', () => { const p = new PX(16, 16); p.ell(8, 11, 6, 4, '#6b4a2b'); p.ell(8, 9, 6, 3, '#c4955a'); p.ring(8, 9, 2, '#8a6236'); p.selOutline(.62); return p.done(); });
    case 'bigstump': return spr('bigstump', () => { const p = new PX(32, 32); p.ell(16, 20, 13, 9, '#5a3a20'); p.ell(16, 16, 13, 7, '#b88a52'); p.ring(16, 16, 4, '#8a6236'); p.ring(16, 16, 8, '#8a6236'); p.line(4, 22, 1, 28, '#5a3a20'); p.line(28, 22, 31, 28, '#5a3a20'); p.selOutline(.62); return p.done(); });
    case 'fence': return spr(`fence:${o.l ? 1 : 0}${o.r ? 1 : 0}`, () => {
      const p = new PX(16, 16); p.r(6, 3, 4, 12, '#8a5a30'); p.vl(9, 3, 14, '#5a3818'); p.hl(6, 9, 3, '#b07a42');
      if (o.l) { p.r(0, 6, 6, 2, '#8a5a30'); p.r(0, 10, 6, 2, '#8a5a30'); }
      if (o.r) { p.r(10, 6, 6, 2, '#8a5a30'); p.r(10, 10, 6, 2, '#8a5a30'); }
      p.selOutline(.62); return p.done();
    });
    case 'chest': return spr('chest', () => { const p = new PX(16, 16); p.r(2, 5, 12, 10, '#8a5228'); p.r(2, 5, 12, 4, '#a86a34'); p.hl(2, 13, 9, '#4a2810'); p.r(7, 8, 2, 3, '#f2c430'); p.vl(2, 5, 14, '#c9a24a'); p.vl(13, 5, 14, '#c9a24a'); p.selOutline(.62); return p.done(); });
    case 'scarecrow': return spr(`scarecrow:${o.creepy ? 1 : 0}`, () => {
      const p = new PX(16, 32); p.vl(8, 10, 31, '#6a4a2a'); p.hl(2, 14, 14, '#6a4a2a');
      p.r(4, 12, 9, 9, '#5a6a8a'); p.r(4, 12, 9, 2, '#4a5a7a'); p.p(3, 14, '#e8c060'); p.p(14, 14, '#e8c060'); p.p(2, 15, '#e8c060');
      p.circ(8, 7, 4, '#e07a20'); p.vl(8, 2, 3, '#4a7a2a');
      if (o.creepy) { p.p(6, 6, '#000'); p.p(10, 6, '#000'); p.p(6, 7, '#ff0000'); p.p(10, 7, '#ff0000'); p.hl(5, 11, 9, '#000'); for (let x = 5; x <= 11; x += 2) p.p(x, 10, '#fff'); }
      else { p.p(6, 6, '#3a1a00'); p.p(10, 6, '#3a1a00'); p.hl(6, 10, 9, '#3a1a00'); }
      p.poly([[3, 4], [13, 4], [8, -1]], '#3a2a1a'); p.hl(2, 14, 4, '#3a2a1a');
      p.selOutline(.62); return p.done();
    });
    case 'sprinkler': return spr(`spr:${o.tier || 1}`, () => { const p = new PX(16, 16); const c = o.tier > 1 ? '#c8d0d8' : '#c87a3a'; p.ell(8, 11, 5, 3, shade(c, -.3)); p.ell(8, 10, 4, 2, c); p.vl(8, 5, 9, '#888'); p.r(7, 4, 3, 2, '#4aa0ff'); if (o.tier > 1) { p.p(4, 9, '#4aa0ff'); p.p(12, 9, '#4aa0ff'); } p.selOutline(.62); return p.done(); });
    case 'keg': return spr('keg', () => { const p = new PX(16, 20); p.ell(8, 11, 6, 8, '#8a5228'); for (const y of [5, 11, 17]) p.hl(2, 14, y, '#4a4a4a'); p.vl(5, 4, 18, '#a86a34'); p.ell(8, 3, 5, 2, '#6a3a18'); p.r(7, 13, 2, 2, '#c9a24a'); p.selOutline(.62); return p.done(); });
    case 'jar': return spr('jar', () => { const p = new PX(16, 20); p.r(4, 6, 8, 12, '#bcd8e8'); p.r(5, 9, 6, 8, '#d8a040'); p.r(4, 4, 8, 2, '#8a8a8a'); p.vl(5, 7, 16, '#ffffff'); p.selOutline(.62); return p.done(); });
    case 'furnace': return spr(`furnace:${o.on ? 1 : 0}:${frame % 2}`, () => {
      const p = new PX(16, 24); p.r(2, 6, 12, 17, '#6d6a70'); p.r(2, 6, 12, 2, '#8d8a90'); for (let j = 8; j < 23; j += 3) p.hl(2, 13, j, '#55525a');
      p.r(5, 14, 6, 6, '#1a1010'); if (o.on) { p.r(6, 16 - frame % 2, 4, 4 + frame % 2, '#ff8020'); p.r(7, 17, 2, 3, '#ffe060'); }
      p.r(6, 1, 4, 5, '#55525a'); if (o.on) p.p(8, 0, '#888'); p.selOutline(.62); return p.done();
    });
    case 'cauldron': return spr(`cauldron:${frame % 3}`, () => { const p = new PX(16, 16); p.ell(8, 10, 7, 5, '#2a2a2a'); p.ell(8, 7, 6, 2, '#4af04a'); for (let k = 0; k < 3; k++) p.circ(4 + k * 4, 6 - ((frame + k) % 3), 1, '#8aff8a'); p.r(3, 14, 2, 2, '#2a2a2a'); p.r(11, 14, 2, 2, '#2a2a2a'); p.selOutline(.62); return p.done(); });
    case 'torch': return spr(`torch:${frame % 3}`, () => { const p = new PX(16, 16); p.vl(8, 6, 15, '#6a4a2a'); p.circ(8, 4, 2, '#ff8020'); p.p(8, 2 - frame % 2, '#ffe060'); p.p(8, 4, '#ffe060'); return p.done(); });
    case 'bonfire': return spr(`bonfire:${frame % 4}`, () => {
      const p = new PX(16, 24);
      p.ell(8, 21, 7, 2, '#3a3030'); for (let k = 0; k < 6; k++) p.circ(3 + k * 2, 20, 1, '#6a6060');
      p.line(8, 21, 10, 4, '#8a8a90'); p.line(9, 21, 11, 4, '#c8c8d0'); p.hl(7, 13, 8, '#6a5a40'); // меч
      const f = frame % 4;
      p.poly([[3, 21], [13, 21], [10 + (f % 2), 11 - f], [8, 14], [6 - (f % 2), 12 + f % 2]], '#ff7a1a');
      p.poly([[5, 21], [11, 21], [9, 15 - f % 2], [7, 16]], '#ffd23a');
      p.p(8, 9 - f, '#ffaa30'); p.p(5, 10 + f % 2, '#ff6010');
      return p.done();
    });
    case 'ladder': return spr(`ladder:${o.dt || ''}`, () => { const p = new PX(16, 16); p.r(2, 2, 12, 12, '#000'); p.r(2, 2, 12, 2, '#222'); p.vl(4, 1, 15, '#8a5a30'); p.vl(11, 1, 15, '#8a5a30'); for (let y = 4; y < 16; y += 3) p.hl(4, 11, y, '#a86a34'); return p.done(); });
    case 'ladderUp': return spr('ladderUp', () => { const p = new PX(16, 32); p.vl(4, 0, 31, '#8a5a30'); p.vl(11, 0, 31, '#8a5a30'); for (let y = 2; y < 32; y += 4) p.hl(4, 11, y, '#a86a34'); p.selOutline(.62); return p.done(); });
    case 'crate': return spr(`crate:${o.v || 0}`, () => {
      const p = new PX(16, 16);
      if (o.v) { p.ell(8, 9, 6, 7, '#7a4a24'); p.hl(2, 14, 5, '#3a3a3a'); p.hl(2, 14, 13, '#3a3a3a'); p.vl(6, 3, 15, '#9a6a3a'); }
      else { p.r(2, 3, 12, 12, '#9a6a3a'); p.line(2, 3, 13, 14, '#6a4220'); p.line(13, 3, 2, 14, '#6a4220'); p.hl(2, 13, 3, '#b88a52'); }
      p.selOutline(.62); return p.done();
    });
    case 'mailbox': return spr(`mailbox:${o.flag ? 1 : 0}`, () => { const p = new PX(16, 24); p.vl(8, 10, 23, '#6a4a2a'); p.r(3, 4, 10, 7, '#c0303c'); p.r(3, 4, 10, 2, '#e05050'); p.r(4, 7, 3, 2, '#2a0a0a'); if (o.flag) { p.vl(13, 0, 6, '#333'); p.r(13, 0, 3, 2, '#f2c430'); } p.selOutline(.62); return p.done(); });
    case 'bin': return spr('bin', () => { const p = new PX(32, 20); p.r(1, 6, 30, 13, '#8a5228'); p.r(1, 2, 30, 6, '#a86a34'); p.hl(1, 30, 7, '#4a2810'); for (let x = 4; x < 30; x += 6) p.vl(x, 9, 18, '#6a3a18'); p.r(13, 3, 6, 2, '#c9a24a'); p.selOutline(.62); return p.done(); });
    case 'board': return spr('board', () => { const p = new PX(32, 32); p.vl(4, 8, 31, '#5a3a20'); p.vl(27, 8, 31, '#5a3a20'); p.r(2, 4, 28, 18, '#8a5a30'); p.r(4, 6, 24, 14, '#c4955a'); p.r(6, 8, 6, 8, '#f6ecd2'); p.r(14, 7, 7, 6, '#f6ecd2'); p.r(22, 9, 5, 9, '#f6ecd2'); p.p(9, 8, '#c00'); p.p(17, 7, '#c00'); p.p(24, 9, '#c00'); p.r(15, 15, 6, 4, '#ffd0d0'); p.selOutline(.62); return p.done(); });
    case 'altar': return spr(`altar:${frame % 4}`, () => { const p = new PX(32, 24); p.r(2, 10, 28, 13, '#7a7480'); p.r(2, 8, 28, 4, '#9a94a0'); p.r(6, 12, 20, 2, '#5a5460'); p.circ(16, 5, 3 + (frame % 2), '#9aff9a', 120); p.circ(16, 5, 2, '#e0ffe0'); p.selOutline(.62); return p.done(); });
    case 'grave': return spr(`grave:${o.v || 0}:${o.dug ? 1 : 0}`, () => {
      const p = new PX(16, 24);
      if (o.dug) { p.ell(8, 18, 6, 4, '#2a1a0e'); p.ell(8, 17, 4, 2, '#000'); }
      else if (o.v === 2) { p.ell(8, 19, 6, 3, '#5a3a1e'); }
      if ((o.v || 0) % 2 === 0) { p.r(4, 4, 8, 14, '#8a8a90'); p.circ(8, 5, 4, '#8a8a90'); p.vl(8, 6, 12, '#5a5a60'); p.hl(6, 10, 8, '#5a5a60'); p.vl(11, 5, 17, '#6a6a70'); }
      else { p.vl(8, 4, 18, '#7a7a80'); p.hl(4, 12, 8, '#7a7a80'); }
      p.selOutline(.62); return p.done();
    });
    case 'bed': return spr(`bed:${o.v || 0}`, () => { const p = new PX(16, 32); p.r(1, 2, 14, 29, '#6a3a1a'); p.r(2, 4, 12, 6, '#f0f0f0'); p.r(2, 10, 12, 20, o.v ? '#5a3a8a' : '#a83a3a'); for (let y = 12; y < 30; y += 4) p.hl(2, 13, y, o.v ? '#4a2a6a' : '#8a2a2a'); p.selOutline(.62); return p.done(); });
    case 'tv': return spr(`tv:${frame % 2}`, () => { const p = new PX(16, 20); p.r(1, 3, 14, 12, '#3a3030'); p.r(3, 5, 10, 8, frame % 2 ? '#8aa0b0' : '#a0b8c8'); p.speck(3, 5, 10, 8, ['#fff', '#556'], .3, frame); p.line(5, 0, 8, 3, '#888'); p.line(11, 0, 8, 3, '#888'); p.r(3, 15, 2, 4, '#3a3030'); p.r(11, 15, 2, 4, '#3a3030'); p.selOutline(.62); return p.done(); });
    case 'fireplace': return spr(`fire:${frame % 3}`, () => { const p = new PX(32, 32); p.r(0, 4, 32, 28, '#7a6a6a'); for (let y = 6; y < 32; y += 4) for (let x = (y % 8 ? 0 : 4); x < 32; x += 8) p.r(x, y, 7, 3, '#8a7a7a'); p.r(6, 14, 20, 18, '#1a0a0a'); p.r(0, 2, 32, 4, '#5a4a4a'); const f = frame % 3; p.poly([[9, 31], [23, 31], [19, 20 - f], [16, 24], [12, 19 + f]], '#ff7a1a'); p.poly([[12, 31], [20, 31], [17, 24 - f], [14, 26]], '#ffd23a'); p.selOutline(.62); return p.done(); });
    case 'kitchen': return spr('kitchen', () => { const p = new PX(32, 24); p.r(0, 6, 32, 18, '#c8b8a0'); p.r(0, 6, 32, 3, '#e8dcc8'); p.r(2, 12, 12, 10, '#a89880'); p.r(18, 10, 12, 12, '#3a3a3a'); p.circ(21, 13, 2, '#5a5a5a'); p.circ(27, 13, 2, '#5a5a5a'); p.r(20, 17, 8, 4, '#222'); p.selOutline(.62); return p.done(); });
    case 'table': return spr(`table:${o.v || 0}`, () => { const p = new PX(32, 24); p.r(1, 4, 30, 10, '#8a5a30'); p.r(1, 4, 30, 2, '#a87a48'); p.r(3, 14, 3, 9, '#6a4220'); p.r(26, 14, 3, 9, '#6a4220'); if (o.v === 1) { p.ell(10, 6, 3, 2, '#fff'); p.ell(22, 6, 3, 2, '#fff'); p.r(15, 2, 2, 4, '#c03030'); } if (o.v === 2) { p.r(6, 1, 6, 5, '#f6ecd2'); p.r(18, 2, 8, 4, '#7a2a2a'); p.r(20, 0, 2, 3, '#222'); } p.selOutline(.62); return p.done(); });
    case 'counter': return spr(`counter:${o.v || 0}`, () => { const p = new PX(16, 24); p.r(0, 6, 16, 18, '#7a4a24'); p.r(0, 4, 16, 4, '#b07a42'); p.hl(0, 15, 8, '#4a2810'); for (let x = 2; x < 16; x += 5) p.vl(x, 10, 22, '#6a3a18'); if (o.v === 1) { p.r(4, 0, 4, 5, '#d0e8f0'); p.r(10, 1, 3, 4, '#a03030'); } p.selOutline(.62); return p.done(); });
    case 'shelf': return spr(`shelf:${o.v || 0}`, () => {
      const p = new PX(32, 32); p.r(1, 0, 30, 32, '#6a4220'); for (let y = 2; y < 32; y += 10) { p.r(3, y, 26, 8, '#3a220e'); p.hl(3, 28, y + 8, '#8a5a30'); }
      const pal = o.v === 1 ? ['#4a8a3a', '#c04040', '#8a4ac0', '#40a0c0', '#e0c040'] : o.v === 2 ? ['#7a2a2a', '#2a3a6a', '#3a5a2a', '#5a4a2a', '#222'] : ['#c87a3a', '#e0c040', '#6aa84f', '#c04040', '#f0f0f0'];
      for (let y = 2; y < 32; y += 10) for (let x = 4; x < 28; x += 4) { const c = pal[Math.floor(U.hash(x, y, o.v || 0) * pal.length)]; if (o.v === 2) p.r(x, y + 1, 3, 7, c); else { p.r(x, y + 3, 3, 5, c); p.p(x + 1, y + 2, shade(c, .4)); } }
      p.selOutline(.62); return p.done();
    });
    case 'anvil': return spr('anvil', () => { const p = new PX(16, 16); p.r(2, 5, 12, 3, '#5a5a62'); p.r(0, 5, 3, 2, '#5a5a62'); p.r(5, 8, 6, 3, '#4a4a52'); p.r(3, 11, 10, 4, '#3a3a42'); p.hl(2, 13, 5, '#8a8a92'); p.selOutline(.62); return p.done(); });
    case 'arcade': return spr(`arcade:${frame % 2}`, () => { const p = new PX(16, 32); p.r(1, 2, 14, 29, '#3a2a6a'); p.r(3, 5, 10, 9, '#000'); p.speck(3, 5, 10, 9, ['#ff0', '#f0f', '#0ff'], .15, frame); p.r(5, 9, 2, 2, '#f2c430'); p.r(2, 17, 12, 4, '#2a1a4a'); p.p(5, 18, '#f00'); p.p(10, 18, '#0f0'); p.r(1, 0, 14, 3, '#e04080'); p.selOutline(.62); return p.done(); });
    case 'piano': return spr('piano', () => { const p = new PX(32, 24); p.r(1, 2, 30, 20, '#1a1a1a'); p.r(3, 12, 26, 4, '#fff'); for (let x = 4; x < 29; x += 3) p.r(x, 12, 1, 2, '#000'); p.selOutline(.62); return p.done(); });
    case 'lamp': return spr(`lamp:${o.v || 0}`, () => { const p = new PX(16, 32); p.vl(8, 6, 31, '#3a3a3a'); p.r(6, 29, 5, 2, '#3a3a3a'); p.r(5, 1, 7, 6, '#2a2a2a'); p.r(6, 2, 5, 4, '#ffe090'); return p.done(); });
    case 'plant': return spr('plant', () => { const p = new PX(16, 16); p.r(5, 10, 6, 5, '#b05a30'); p.circ(8, 6, 4, '#4a9a3a'); p.circ(6, 4, 2, '#6ab854'); p.selOutline(.62); return p.done(); });
    case 'rug': return spr('rug', () => { const p = new PX(32, 16); p.r(0, 0, 32, 16, '#7a2a3a'); p.r(2, 2, 28, 12, '#a83a4a'); p.r(4, 4, 24, 8, '#c9a24a'); p.r(6, 6, 20, 4, '#7a2a3a'); return p.done(); });
    case 'bookstack': return spr('books', () => { const p = new PX(16, 16); const c = ['#7a2a2a', '#2a3a6a', '#3a5a2a', '#5a4a2a', '#222']; for (let k = 0; k < 5; k++) p.r(2 + (k % 2), 14 - k * 3, 11, 3, c[k]); p.selOutline(.62); return p.done(); });
    case 'fountain': return spr(`fountain:${frame % 3}`, () => { const p = new PX(48, 40); p.ell(24, 28, 22, 10, '#7a7a82'); p.ell(24, 27, 19, 8, S.sanity < 30 ? '#8a0a18' : '#4a84c8'); p.r(21, 8, 6, 20, '#8a8a92'); p.ell(24, 10, 7, 3, '#9a9aa2'); const w = S.sanity < 30 ? '#c0203a' : '#a8d4f5'; for (let k = 0; k < 4; k++) p.p(18 + k * 4 + (frame % 3), 12 + k % 2, w); p.vl(24, 2, 8, w); p.selOutline(.62); return p.done(); });
    case 'lamppost': return spr('lamppost', () => { const p = new PX(16, 40); p.vl(7, 8, 39, '#2a2a2a'); p.vl(8, 8, 39, '#3a3a3a'); p.r(5, 37, 6, 3, '#2a2a2a'); p.r(4, 2, 8, 7, '#1a1a1a'); p.r(5, 3, 6, 5, '#ffe090'); p.p(8, 0, '#1a1a1a'); return p.done(); });
    case 'well': return spr(`well:${o.hand ? 1 : 0}`, () => {
      const p = new PX(32, 40);
      p.ell(16, 30, 13, 8, '#6d6a70'); for (let a = 0; a < 6; a++) { p.r(4 + a * 4, 24 + (a % 2), 4, 3, '#8a8590'); } p.ell(16, 28, 10, 5, '#000');
      p.r(4, 6, 3, 24, '#5a3a20'); p.r(25, 6, 3, 24, '#5a3a20'); p.poly([[0, 8], [32, 8], [16, -1]], '#7a2a2a'); p.hl(0, 31, 8, '#4a1a1a');
      p.hl(7, 24, 14, '#6a4a2a'); p.vl(16, 14, 22, '#c8b080'); p.r(14, 22, 5, 4, '#6a4a2a');
      if (o.hand) { p.r(12, 22, 3, 6, '#d8d8d0'); p.p(11, 22, '#d8d8d0'); p.p(15, 21, '#d8d8d0'); p.p(13, 21, '#d8d8d0'); }
      p.selOutline(.62); return p.done();
    });
    case 'cart': return spr('cart', () => { const p = new PX(32, 32); p.r(2, 12, 28, 12, '#7a3a8a'); p.r(2, 10, 28, 3, '#5a2a6a'); p.poly([[0, 12], [32, 12], [26, 2], [6, 2]], '#e070c0'); for (let x = 2; x < 30; x += 6) p.poly([[x, 12], [x + 3, 12], [x + 2, 4]], '#ffffff', 90); p.circ(8, 26, 4, '#4a2a1a'); p.circ(24, 26, 4, '#4a2a1a'); p.circ(8, 26, 1, '#c9a24a'); p.circ(24, 26, 1, '#c9a24a'); p.selOutline(.62); return p.done(); });
    case 'fog': return spr(`fog:${frame % 4}`, () => { const p = new PX(16, 16); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const r = U.hash(i + frame, j, 3); if (r < .55) p.p(i, j, '#ffffff', 60 + Math.floor(r * 120)); } return p.done(); });
    case 'bloodstain': return spr(`blood:${frame % 4}`, () => { const p = new PX(16, 16); p.ell(8, 10, 6, 3, '#8a0010'); p.ell(7, 10, 3, 2, '#c01020'); p.circ(8, 6 - frame % 4, 1, '#60ff90', 160); return p.done(); });
    case 'forage': case 'artifact': case 'drop': return null; // рисуются иконкой предмета
    case 'eye': return spr(`festeye:${frame % 2}`, () => { const p = new PX(16, 16); p.ell(8, 9, 5, 4, '#fff'); p.circ(8 + (frame % 2), 9, 2, '#3a7ad0'); p.p(8 + (frame % 2), 9, '#000'); p.selOutline(.62); return p.done(); });
    case 'flower': return spr(`flower:${o.v || 0}`, () => { const p = new PX(16, 16); const c = ['#f28cc0', '#f7e26b', '#ffffff', '#9ad0ff', '#c0303c'][(o.v || 0) % 5]; p.vl(8, 8, 14, '#3d8a2c'); p.circ(8, 6, 2, c); p.p(8, 6, '#d1a020'); p.p(6, 11, '#3d8a2c'); p.p(10, 10, '#3d8a2c'); return p.done(); });
    case 'bush': return spr(`bush:${S.season}`, () => { const p = new PX(16, 16); const c = [['#4f9a3a', '#6ab854', '#f28cc0'], ['#3f8a2e', '#5aab3c', '#c03050'], ['#b0601e', '#d9772b', '#5a1a40'], ['#8a9aa0', '#e8eef5', '#c03030']][S.season]; p.circ(5, 9, 5, c[0]); p.circ(11, 9, 5, c[0]); p.circ(8, 7, 5, c[1]); p.speck(2, 3, 12, 10, [c[2]], .06, 5); p.selOutline(.62); return p.done(); });
    case 'sign': return spr('sign', () => { const p = new PX(16, 16); p.vl(8, 8, 15, '#5a3a20'); p.r(2, 2, 12, 8, '#a87a48'); p.hl(4, 11, 4, '#4a2a10'); p.hl(4, 9, 6, '#4a2a10'); p.selOutline(.62); return p.done(); });
    case 'mirror': return spr(`mirror:${o.v || 0}`, () => { const p = new PX(16, 32); p.r(2, 2, 12, 26, '#c9a24a'); p.r(4, 4, 8, 22, S.sanity < 40 ? '#2a0a10' : '#a8c8d8'); if (S.sanity < 40) { p.p(7, 10, '#f00'); p.p(9, 10, '#f00'); } else p.line(5, 8, 9, 4, '#e8f4fa'); p.selOutline(.62); return p.done(); });
    case 'coffin': return spr('coffin', () => { const p = new PX(16, 32); p.poly([[4, 1], [12, 1], [15, 8], [12, 31], [4, 31], [1, 8]], '#3a2418'); p.vl(8, 6, 22, '#c9a24a'); p.hl(5, 11, 11, '#c9a24a'); p.selOutline(.62); return p.done(); });
    case 'barrel': return objSprite({ t: 'crate', v: 1 });
    case 'pot': return spr('pot', () => { const p = new PX(16, 16); p.ell(8, 10, 5, 5, '#3a3a3a'); p.ell(8, 6, 4, 1, '#c8a060'); p.r(3, 14, 2, 2, '#3a3a3a'); p.r(11, 14, 2, 2, '#3a3a3a'); p.selOutline(.62); return p.done(); });
    case 'pew': return spr('pew', () => { const p = new PX(32, 16); p.r(0, 2, 32, 5, '#5a3a20'); p.r(0, 8, 32, 4, '#7a4a24'); p.r(1, 12, 2, 4, '#4a2a10'); p.r(29, 12, 2, 4, '#4a2a10'); if (U.hash(1, 2, 3) < 1) p.line(20, 2, 26, 11, '#2a1408'); p.selOutline(.62); return p.done(); });
    case 'crack': return spr('crack', () => { const p = new PX(16, 16); p.line(2, 4, 8, 9, '#000'); p.line(8, 9, 14, 7, '#000'); p.line(8, 9, 9, 15, '#000'); return p.done(); });
    case 'manuscript': return spr(`manu:${frame % 2}`, () => { const p = new PX(32, 24); p.r(2, 8, 28, 14, '#2a1a1a'); p.r(4, 2 + frame % 2, 24, 12, '#f2efe6'); for (let y = 5; y < 13; y += 2) p.hl(6, 25, y + frame % 2, '#555'); p.line(26, 0, 20, 9, '#000'); p.p(20, 9, '#c00'); p.selOutline(.62); return p.done(); });
    case 'door': return spr(`door:${o.v || 0}`, () => { const p = new PX(16, 24); p.r(1, 0, 14, 24, o.v === 1 ? '#1a1a1a' : '#6a3a1a'); p.r(3, 2, 10, 22, o.v === 1 ? '#000' : '#8a5228'); p.p(11, 13, '#c9a24a'); if (o.v === 1) { p.r(5, 6, 6, 1, '#c00'); p.r(7, 4, 2, 8, '#c00'); } p.selOutline(.62); return p.done(); });
  }
  return null;
}

/* ---------- постройки ---------- */
function buildingSprite(kind, night = false) {
  return spr(`bld:${kind}:${night ? 1 : 0}:${S.season === 3 ? 1 : 0}:${S.flags && S.flags.greenhouse ? 1 : 0}`, () => {
    const B = BUILD_STYLES[kind];
    const w = B.w * 16, h = (B.h + B.roofH) * 16;
    const p = new PX(w, h);
    const wallTop = B.roofH * 16 - 4, wallH = h - wallTop;
    const snow = S.season === 3;
    const wl = B.wall, wD = shade(wl, -.2), wDD = shade(wl, -.38), wL = shade(wl, .15);
    // стены
    p.r(0, wallTop, w, wallH, wl);
    if (B.planks) for (let y = wallTop; y < h; y += 4) { p.hl(0, w - 1, y, wD); p.hl(0, w - 1, y + 1, wL); for (let x = (y * 7) % 13; x < w; x += 13) p.vl(x, y + 1, y + 3, wD); for (let x = (y * 5) % 17 + 2; x < w; x += 17) p.p(x, y + 2, wDD); }
    if (B.bricks) for (let y = wallTop; y < h; y += 4) { p.hl(0, w - 1, y, wD); for (let x = ((y / 4) % 2) * 4; x < w; x += 8) { p.vl(x, y, y + 3, wD); p.hl(x + 1, x + 6, y + 1, wL); } }
    if (B.logs) for (let y = wallTop; y < h; y += 5) { p.hl(0, w - 1, y, wDD); p.hl(0, w - 1, y + 1, wL); p.hl(0, w - 1, y + 4, wD); p.circ(1, y + 2, 1, shade(wl, .25)); p.circ(w - 2, y + 2, 1, shade(wl, .25)); }
    // угловые столбы и фундамент
    p.r(0, wallTop, 3, wallH, wD); p.vl(0, wallTop, h - 1, wDD); p.r(w - 3, wallTop, 3, wallH, wDD); p.vl(1, wallTop, h - 1, wL);
    for (let x = 0; x < w; x += 6) { p.r(x, h - 4, 6, 4, x % 12 ? '#7a7470' : '#8a847e'); p.hl(x, x + 5, h - 4, '#a8a29c'); p.vl(x, h - 4, h - 1, '#5a5450'); }
    // тень от крыши на стене
    p.r(0, wallTop + 6, w, 3, wDD, 90);
    // крыша
    const rc = B.roof, rd = shade(rc, -.28), rl = shade(rc, .22), rdd = shade(rc, -.45);
    if (B.roofStyle === 'gable') {
      p.poly([[-2, wallTop + 7], [w + 2, wallTop + 7], [w - 10, 2], [10, 2]], rc);
      for (let y = 4, row = 0; y < wallTop + 7; y += 4, row++) { p.hl(0, w - 1, y, rd); for (let x = (row % 2) * 4; x < w; x += 8) { p.vl(x, y + 1, y + 3, rd); p.p(x + 1, y + 1, rl); } }
      p.hl(-2, w + 2, wallTop + 7, rdd); p.hl(-2, w + 2, wallTop + 8, rdd); p.hl(10, w - 10, 2, rl); p.hl(9, w - 9, 3, rl);
      p.line(10, 2, -2, wallTop + 7, rdd); p.line(w - 10, 2, w + 2, wallTop + 7, rdd);
      if (snow) { p.poly([[10, 2], [w - 10, 2], [w - 6, 7], [6, 7]], '#f4f8fb'); for (let x = 4; x < w - 4; x += 5) p.vl(x, 7, 8 + (x % 3), '#f4f8fb'); p.hl(10, w - 10, 3, '#ffffff'); for (let x = 2; x < w; x += 7) p.vl(x, wallTop + 8, wallTop + 9 + (x % 3), '#dfeaf5'); }
    } else if (B.roofStyle === 'spire') { // часовня
      p.poly([[-2, wallTop + 7], [w + 2, wallTop + 7], [w / 2, 10]], rc);
      for (let y = 14, row = 0; y < wallTop + 7; y += 4, row++) { p.hl(0, w - 1, y, rd, 150); for (let x = (row % 2) * 4; x < w; x += 8) p.vl(x, y + 1, y + 3, rd, 120); }
      p.hl(-2, w + 2, wallTop + 7, rdd);
      p.r(w / 2 - 5, 0, 10, 20, shade(wl, -.1)); p.vl(w / 2 - 5, 0, 19, wL); p.vl(w / 2 + 4, 0, 19, wDD);
      p.poly([[w / 2 - 6, 4], [w / 2 + 6, 4], [w / 2, -12]], rd); p.line(w / 2, -12, w / 2 - 6, 4, rl);
      p.vl(w / 2, -2, 6, '#c9a24a'); p.hl(w / 2 - 2, w / 2 + 2, 1, '#c9a24a');
      p.circ(w / 2, 12, 3, '#3a2a4a'); p.circ(w / 2, 12, 2, night ? '#ffd070' : '#7a6aa0'); p.p(w / 2 - 1, 11, '#c8b8e8');
      if (!S.flags || !S.flags.chapelDone) { p.line(w / 2 - 14, 18, w / 2 - 6, 26, '#000'); p.r(w - 20, wallTop - 2, 6, 4, '#000'); for (let k = 0; k < 6; k++) p.p(4 + k * 13, wallTop + 12 + (k % 3) * 9, '#3a5a2a'); }
    } else if (B.roofStyle === 'crooked') { // ведьма
      p.poly([[-4, wallTop + 7], [w + 4, wallTop + 3], [w / 2 + 10, -4], [w / 2 - 2, 8]], rc);
      for (let y = 6, row = 0; y < wallTop + 7; y += 5, row++) { p.hl(0, w - 1, y, rd, 160); for (let x = (row % 2) * 5; x < w; x += 10) p.vl(x, y + 1, y + 3, rd, 140); }
      p.line(w / 2 - 2, 8, -4, wallTop + 7, rdd); p.line(w / 2 + 10, -4, w + 4, wallTop + 3, rdd);
      p.r(w - 18, 0, 6, 14, '#5a5050'); p.vl(w - 18, 0, 13, '#7a7070'); p.r(w - 19, 0, 8, 2, '#3a3030');
      for (let k = 0; k < 5; k++) p.p(6 + k * 15, wallTop + 4 + (k % 2) * 3, '#5aa83c');
    } else if (B.roofStyle === 'glass') {
      const ok = S.flags && S.flags.greenhouse;
      p.r(0, 4, w, wallTop + 3, ok ? '#a8dcec' : '#56686a');
      for (let x = 0; x < w; x += 8) { p.vl(x, 4, wallTop + 6, ok ? '#f0fbff' : '#8a9a9a'); p.vl(x + 1, 4, wallTop + 6, ok ? '#c8ecf6' : '#6a7a7a'); }
      for (let y = 4; y < wallTop + 6; y += 8) p.hl(0, w - 1, y, ok ? '#f0fbff' : '#8a9a9a');
      if (ok) { for (let k = 0; k < 6; k++) p.line(4 + k * 18, 6, 10 + k * 18, 14, '#ffffff', 160); for (let k = 0; k < 8; k++) p.circ(6 + k * 13, wallTop - 2, 2, k % 2 ? '#5ab83a' : '#e05a7a'); }
      else for (let k = 0; k < 9; k++) { const x = Math.floor(U.hash(k, 1, 7) * w), y = 6 + Math.floor(U.hash(k, 2, 7) * wallTop); p.r(x, y, 5, 4, '#1a2420'); p.line(x, y, x + 6, y + 6, '#1a2420'); }
    } else { // плоская крыша с карнизом и навесом
      p.r(-2, wallTop - 7, w + 4, 13, rc); p.hl(-2, w + 2, wallTop - 7, rl); p.hl(-2, w + 2, wallTop - 6, rl); p.hl(-2, w + 2, wallTop + 5, rdd);
      for (let x = 0; x < w; x += 6) { p.vl(x, wallTop - 5, wallTop + 4, rd, 140); p.p(x + 2, wallTop - 4, rl); }
      if (snow) p.hl(-2, w + 2, wallTop - 8, '#f4f8fb');
    }
    // окна: рама, стекло с бликом, шторы, подоконник с цветами
    for (const [wx, wy] of B.windows || []) {
      const x = Math.round(wx * 16 + 3), y = wallTop + wy;
      p.r(x - 2, y - 2, 14, 13, '#3a2410'); p.r(x - 1, y - 1, 12, 11, '#6a4a2a');
      const glass = night ? '#ffd27a' : '#86bfe0';
      p.r(x, y, 10, 9, glass);
      if (night) { p.r(x + 1, y + 1, 8, 3, '#ffe9a8'); }
      else { p.line(x + 1, y + 6, x + 5, y + 1, '#e2f2fb'); p.line(x + 6, y + 7, x + 8, y + 5, '#e2f2fb'); p.hl(x, x + 9, y + 8, shade(glass, -.2)); }
      p.vl(x, y, y + 8, B.curtain || '#c8506a'); p.vl(x + 1, y, y + 5, B.curtain || '#c8506a'); p.vl(x + 9, y, y + 8, B.curtain || '#c8506a'); p.vl(x + 8, y, y + 5, B.curtain || '#c8506a');
      p.vl(x + 5, y, y + 8, '#4a2c14'); p.hl(x, x + 9, y + 4, '#4a2c14');
      p.r(x - 3, y + 9, 16, 2, '#7a5030'); p.hl(x - 3, x + 12, y + 9, '#9a6a40');
      if (!snow && B.flowers) { p.r(x - 2, y + 11, 14, 3, '#6a3a1a'); for (let k = 0; k < 6; k++) { p.p(x - 1 + k * 2.4, y + 10, k % 2 ? '#e05a7a' : '#f2d040'); p.p(x + k * 2.4, y + 11, '#4a9a3a'); } }
      if (night && S.sanity < 35 && U.hash(wx, wy, kind.length) < .5) { p.r(x + 3, y + 2, 3, 6, '#000'); p.p(x + 3, y + 3, '#f00'); p.p(x + 5, y + 3, '#f00'); }
    }
    // дверь с наличником, ручкой и порогом
    if (B.door !== undefined) {
      const dx = B.door * 16 + 2, dy = h - 23;
      const dc = B.doorCol || '#6a3a1a';
      p.r(dx - 2, dy - 2, 16, 25, '#3a2410'); p.r(dx - 1, dy - 1, 14, 24, shade(dc, -.4));
      p.r(dx, dy, 12, 21, dc);
      for (let k = 0; k < 3; k++) p.vl(dx + 2 + k * 4, dy + 1, dy + 20, shade(dc, -.18));
      p.r(dx + 2, dy + 3, 8, 6, shade(dc, .12)); p.r(dx + 2, dy + 12, 8, 6, shade(dc, .12)); p.hl(dx + 2, dx + 9, dy + 3, shade(dc, .3)); p.hl(dx + 2, dx + 9, dy + 12, shade(dc, .3));
      p.circ(dx + 9, dy + 11, 1, '#f2c430'); p.p(dx + 9, dy + 10, '#fff2a0');
      p.r(dx - 3, h - 3, 18, 3, '#8a847e'); p.hl(dx - 3, dx + 14, h - 3, '#b0aaa4');
      p.r(dx - 3, dy - 4, 18, 2, shade(rc, -.2));
    }
    // вывеска
    if (B.sign) {
      const sx = Math.round(B.sign[0] * 16), sy = wallTop + B.sign[1];
      p.vl(sx + 4, sy - 3, sy, '#3a3a3a'); p.vl(sx + 23, sy - 3, sy, '#3a3a3a');
      p.r(sx, sy, 28, 13, '#3a2410'); p.r(sx + 1, sy + 1, 26, 11, '#d0a066'); p.hl(sx + 1, sx + 26, sy + 1, '#e8bc80'); p.hl(sx + 1, sx + 26, sy + 11, '#a87a48');
      drawSignIcon(p, B.signIcon, sx + 8, sy + 2);
    }
    if (B.extra) B.extra(p, w, h, wallTop, night);
    p.selOutline(.62);
    return p.done();
  });
}
function drawSignIcon(p, ic, x, y) {
  switch (ic) {
    case 'seed': p.ell(x + 6, y + 4, 3, 3, '#4a8a2a'); p.vl(x + 6, y + 1, y + 7, '#2a5a1a'); break;
    case 'mug': p.r(x + 2, y + 1, 7, 7, '#e8c060'); p.r(x + 2, y + 1, 7, 2, '#ffffff'); p.r(x + 9, y + 3, 2, 3, '#e8c060'); break;
    case 'cross': p.r(x + 5, y, 3, 8, '#c00'); p.r(x + 2, y + 3, 9, 3, '#c00'); break;
    case 'hammer': p.r(x + 2, y, 8, 3, '#555'); p.vl(x + 6, y + 3, y + 8, '#7a4a24'); break;
    case 'star': p.p(x + 6, y, '#c9a24a'); p.hl(x + 3, x + 9, y + 3, '#c9a24a'); p.r(x + 4, y + 1, 5, 6, '#c9a24a'); break;
    case 'potion': p.r(x + 5, y, 3, 2, '#888'); p.circ(x + 6, y + 5, 3, '#4af04a'); break;
  }
}
const BUILD_STYLES = {
  house: { w: 6, h: 3, roofH: 2, wall: '#c9a172', roof: '#a8343f', roofStyle: 'gable', planks: true, windows: [[1, 8], [4, 8]], door: 3, doorCol: '#7a3a1a', chimney: [81, -2], flowers: true,
    extra(p, w, h, wt) { p.r(w - 18, 0, 6, 12, '#7a6a6a'); p.r(w - 19, 0, 8, 2, '#5a4a4a'); } },
  store: { w: 7, h: 3, roofH: 2, wall: '#e0c8a0', roof: '#4a7a3a', roofStyle: 'flat', planks: true, flowers: true, curtain: '#4a8a3a', windows: [[1, 10], [5, 10]], door: 3, sign: [2.6, -2], signIcon: 'seed',
    extra(p, w, h, wt) { for (let x = 0; x < w; x += 8) p.r(x, wt + 4, 4, 4, '#c03030'); for (let x = 4; x < w; x += 8) p.r(x, wt + 4, 4, 4, '#ffffff'); } },
  tavern: { w: 8, h: 4, roofH: 2, wall: '#8a5a3a', roof: '#5a2a4a', roofStyle: 'gable', logs: true, flowers: true, curtain: '#c02040', windows: [[1, 10], [2, 26], [5, 10], [6, 26]], door: 4, sign: [2.4, -6], signIcon: 'mug',
    extra(p, w, h, wt) { p.r(w - 22, 2, 7, 14, '#6a5a5a'); p.r(w - 23, 1, 9, 2, '#4a3a3a'); } , chimney: [108, 0] },
  clinic: { w: 6, h: 3, roofH: 2, wall: '#e8eef2', roof: '#5a8aa8', roofStyle: 'flat', bricks: true, curtain: '#ffffff', windows: [[0.6, 10], [4.4, 10]], door: 3, doorCol: '#3a6a8a', sign: [2.2, -1], signIcon: 'cross' },
  smithy: { w: 6, h: 3, roofH: 2, wall: '#6d6a70', roof: '#3a3a42', roofStyle: 'gable', bricks: true, chimney: [10, -2], curtain: '#5a5a62', windows: [[0.7, 10]], door: 4, sign: [1.6, -9], signIcon: 'hammer',
    extra(p, w, h, wt) { p.r(6, 0, 8, 16, '#4a4a52'); p.circ(10, -2, 3, '#888', 100); } },
  mayor: { w: 6, h: 3, roofH: 2, wall: '#d8c0e0', roof: '#6a3a8a', roofStyle: 'gable', planks: true, flowers: true, curtain: '#8a4ab0', windows: [[0.7, 8], [4.3, 8]], door: 3, doorCol: '#5a2a6a', sign: [1.6, -14], signIcon: 'star' },
  chapel: { w: 7, h: 4, roofH: 3, wall: '#a8a4ac', roof: '#4a4458', roofStyle: 'spire', bricks: true, windows: [[0.6, 10], [5.4, 10]], door: 3, doorCol: '#4a3a2a' },
  witch: { w: 6, h: 3, roofH: 2, wall: '#5a4a3a', roof: '#3a2a4a', roofStyle: 'crooked', logs: true, chimney: [81, -2], curtain: '#6a2a8a', windows: [[0.7, 9], [4.2, 12]], door: 3, doorCol: '#3a1a3a', sign: [3.6, -4], signIcon: 'potion',
    extra(p, w, h, wt) { p.line(2, wt + 20, 10, wt + 30, '#3a2a1a'); p.circ(w - 6, wt + 30, 3, '#e07a20'); p.p(w - 7, wt + 29, '#000'); p.p(w - 5, wt + 29, '#000'); } },
  greenhouse: { w: 7, h: 3, roofH: 2, wall: '#9aa8a0', roof: '#9fd8e8', roofStyle: 'glass', flags_broken: true, door: 3, doorCol: '#5a6a5a' },
  shed: { w: 4, h: 2, roofH: 1, wall: '#8a6a4a', roof: '#5a3a2a', roofStyle: 'gable', planks: true, door: 2 },
};
