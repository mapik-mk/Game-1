/* ============================================================
   Карты: построение поверхностных локаций, интерьеров и этажей Колодца
   ============================================================ */
const SOLID_OBJ = new Set(['tree', 'rock', 'stump', 'bigstump', 'fence', 'chest', 'scarecrow', 'keg', 'pjar', 'furnace', 'cookpot', 'campfire', 'bonfire',
  'crate', 'mailbox', 'bin', 'board', 'altar', 'grave', 'bed', 'tv', 'fireplace', 'kitchen', 'table', 'counter', 'shelf', 'anvil', 'arcade', 'piano', 'lamp',
  'plant', 'lamppost', 'well', 'cart', 'fountain', 'mirror', 'coffin', 'pot', 'pew', 'cauldron', 'bookstack', 'sign', 'weed', 'twig', 'sprinkler', 'qsprinkler', 'fog', 'door', 'manuscript', 'bush']);
const FLAT_OBJ = new Set(['rug', 'bloodstain', 'artifact', 'ladder', 'crack', 'flower']);
const OBJ_SIZE = { well: [2, 2], bin: [2, 1], board: [2, 1], fountain: [3, 2], cart: [2, 1], altar: [2, 1], table: [2, 1], fireplace: [2, 1], kitchen: [2, 1], piano: [2, 1], shelf: [2, 1], bigstump: [2, 2], rug: [2, 1], pew: [2, 1], manuscript: [2, 1] };

class GameMap {
  constructor(id, w, h, o = {}) {
    Object.assign(this, { id, w, h, name: '', outdoor: false, theme: 'town', music: 'day', fishZone: 'pond', light: 0, farmable: false }, o);
    this.ground = new Uint8Array(w * h).fill(o.fillT === undefined ? G_.GRASS : o.fillT);
    this.objs = new Array(w * h).fill(null);
    this.block = new Uint8Array(w * h);
    this.soil = this.farmable ? new Array(w * h).fill(null) : null;
    this.bigs = []; this.warps = {}; this.npcs = []; this.mons = []; this.drops = []; this.projs = []; this.parts = []; this.lights = [];
    this.dirtyGround = true;
  }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  groundAt(x, y) { return this.inb(x, y) ? this.ground[y * this.w + x] : null; }
  set(x, y, t) { if (this.inb(x, y)) { this.ground[y * this.w + x] = t; this.dirtyGround = true; } }
  fill(x, y, w, h, t) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, t); }
  ellipse(cx, cy, rx, ry, t, jag = 0, seed = 1) { for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d <= 1 + (jag ? (U.hash(x, y, seed) - .5) * jag : 0)) this.set(x, y, t); } }
  objAt(x, y) { return this.inb(x, y) ? this.objs[y * this.w + x] : null; }
  soilAt(x, y) { return this.soil && this.inb(x, y) ? this.soil[y * this.w + x] : null; }
  put(x, y, o) {
    o.x = x; o.y = y;
    const [w, h] = o.w ? [o.w, o.h] : (OBJ_SIZE[o.t] || [1, 1]); o.w = w; o.h = h;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.inb(x + i, y + j)) this.objs[(y + j) * this.w + x + i] = o;
    return o;
  }
  remove(o) { for (let j = 0; j < (o.h || 1); j++) for (let i = 0; i < (o.w || 1); i++) { const k = (o.y + j) * this.w + o.x + i; if (this.objs[k] === o) this.objs[k] = null; } }
  building(kind, x, y, warpTo, tx, ty) {
    const B = BUILD_STYLES[kind];
    const b = { kind, x, y, w: B.w, h: B.h, door: B.door !== undefined ? { x: x + B.door, y: y + B.h - 1 } : null };
    for (let j = 0; j < B.h; j++) for (let i = 0; i < B.w; i++) this.block[(y + j) * this.w + x + i] = 1;
    if (b.door && warpTo) { this.block[b.door.y * this.w + b.door.x] = 0; this.warp(b.door.x, b.door.y, warpTo, tx, ty, 'up'); }
    this.bigs.push(b); return b;
  }
  warp(x, y, to, tx, ty, dir = 'down') { this.warps[x + ',' + y] = { to, tx, ty, dir }; }
  solidAt(x, y, forMon) {
    if (!this.inb(x, y)) return true;
    const k = y * this.w + x;
    if (this.block[k]) return true;
    if (SOLID_GROUND.has(this.ground[k])) return true;
    const o = this.objs[k];
    if (o && (SOLID_OBJ.has(o.t) || o.solid) && !o.walk) return true;
    return false;
  }
  isWater(x, y) { const g = this.groundAt(x, y); return g !== null && WATERY.has(g); }
  randomFree(pred, tries = 400) {
    for (let k = 0; k < tries; k++) { const x = U.ri(1, this.w - 2), y = U.ri(1, this.h - 2); if (!this.solidAt(x, y) && !this.objAt(x, y) && !this.warps[x + ',' + y] && (!pred || pred(x, y))) return { x, y }; }
    return null;
  }
  borderTrees(gaps, kinds = ['oak', 'pine']) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const edge = x < 2 || y < 2 || x >= this.w - 2 || y >= this.h - 2;
      if (!edge) continue;
      if (gaps.some(g => x >= g[0] && x <= g[2] && y >= g[1] && y <= g[3])) continue;
      if ((x + y) % 2 === 0 || x < 1 || y < 1 || x >= this.w - 1 || y >= this.h - 1) this.put(x, y, { t: 'tree', kind: U.hash(x, y, 5) < .5 ? kinds[0] : kinds[1], fixed: true });
      else this.set(x, y, G_.DGRASS), this.block[y * this.w + x] = 1;
    }
  }
}

/* ---------- ферма ---------- */
function buildFarm() {
  const m = new GameMap('farm', 40, 32, { name: 'Ферма «Чёрная Почва»', outdoor: true, theme: 'farm', music: 'day', fishZone: 'pond', farmable: true });
  m.borderTrees([[37, 13, 39, 17], [17, 29, 22, 31]]);
  // дорожки
  m.fill(8, 6, 1, 2, G_.DIRT); m.fill(8, 7, 31, 1, G_.DIRT); m.fill(38, 7, 1, 9, G_.DIRT); m.fill(36, 14, 4, 3, G_.DIRT);
  m.fill(20, 6, 1, 1, G_.DIRT); m.fill(33, 6, 2, 1, G_.DIRT);
  // пруд
  m.ellipse(5.5, 24.5, 3.6, 3.2, G_.WATER, .3, 3);
  // постройки
  m.building('house', 5, 3, 'house', 5, 8);
  m.building('greenhouse', 17, 3, 'greenhouse', 5, 8);
  m.put(11, 5, { t: 'mailbox' });
  m.put(12, 5, { t: 'bin' });
  m.put(33, 4, { t: 'well' });
  m.warp(39, 14, 'village', 1, 14, 'right'); m.warp(39, 15, 'village', 1, 15, 'right'); m.warp(39, 16, 'village', 1, 16, 'right');
  for (let x = 18; x <= 21; x++) m.warp(x, 31, 'forest', x, 1, 'down');
  // мусор на поле
  const r = RNG(1337);
  for (let y = 9; y < 29; y++) for (let x = 3; x < 37; x++) {
    if (m.objAt(x, y) || m.solidAt(x, y) || m.groundAt(x, y) !== G_.GRASS) continue;
    if (x < 10 && y > 19) continue;
    const v = r();
    if (v < .07) m.put(x, y, { t: 'weed', v: Math.floor(r() * 6) });
    else if (v < .11) m.put(x, y, { t: 'rock', kind: 'stone', hp: 1, v: Math.floor(r() * 4) });
    else if (v < .14) m.put(x, y, { t: 'twig' });
    else if (v < .155) m.put(x, y, { t: 'tree', kind: r() < .5 ? 'oak' : 'maple', hp: 10 });
    else if (v < .16) m.put(x, y, { t: 'stump', hp: 4 });
  }
  for (const [x, y] of [[25, 12], [14, 24]]) { m.remove(m.objAt(x, y) || { x, y, w: 1, h: 1 }); m.put(x, y, { t: 'bigstump', hp: 10 }); }
  m.put(10, 4, { t: 'flower', v: 0 }); m.put(4, 5, { t: 'bush' }); m.put(15, 5, { t: 'bush' });
  return m;
}

/* ---------- деревня ---------- */
function buildVillage() {
  const m = new GameMap('village', 40, 32, { name: 'Шепчущая Лощина', outdoor: true, theme: 'town', music: 'town', fishZone: 'river' });
  m.borderTrees([[0, 13, 1, 17]]);
  m.fill(0, 14, 40, 3, G_.COBBLE);
  // река
  m.fill(2, 27, 36, 2, G_.WATER); m.fill(18, 27, 2, 2, G_.BRIDGE);
  // постройки (север)
  m.building('store', 3, 9, 'store', 6, 8); m.fill(6, 12, 1, 2, G_.DIRT);
  m.building('tavern', 12, 8, 'tavern', 7, 10); m.fill(16, 12, 1, 2, G_.DIRT);
  m.building('clinic', 22, 9, 'clinic', 5, 8); m.fill(25, 12, 1, 2, G_.DIRT);
  m.building('mayor', 31, 9, 'mayor', 5, 8); m.fill(34, 12, 1, 2, G_.DIRT);
  // юг: кузница, площадь, часовня, кладбище
  m.building('smithy', 3, 18, 'smithy', 5, 8); m.fill(7, 21, 1, 1, G_.DIRT); m.fill(7, 17, 1, 4, G_.DIRT);
  m.fill(14, 17, 10, 8, G_.COBBLE);
  m.put(17, 19, { t: 'fountain' });
  m.building('chapel', 27, 19, 'chapel', 6, 10); m.fill(30, 17, 1, 6, G_.COBBLE);
  m.put(10, 12, { t: 'board' });
  for (const [x, y] of [[2, 13], [11, 13], [21, 13], [29, 13], [37, 13], [13, 23], [24, 23]]) m.put(x, y, { t: 'lamppost' });
  // кладбище
  for (let x = 34; x <= 38; x++) { m.put(x, 19, { t: 'fence', l: x > 34, r: x < 38 }); }
  for (let y = 20; y <= 25; y++) m.put(34, y, { t: 'fence' });
  const graves = [[35, 21, 0], [37, 21, 1], [35, 23, 1], [37, 23, 0], [36, 25, 2]];
  for (const [x, y, v] of graves) m.put(x, y, { t: 'grave', v, grandpa: v === 2 });
  m.fill(35, 20, 4, 7, G_.DIRT);
  for (const [x, y] of [[9, 22], [24, 25], [2, 24], [12, 26], [26, 12], [38, 12]]) m.put(x, y, { t: 'bush' });
  m.warp(0, 14, 'farm', 38, 14, 'left'); m.warp(0, 15, 'farm', 38, 15, 'left'); m.warp(0, 16, 'farm', 38, 16, 'left');
  return m;
}

/* ---------- лес ---------- */
function buildForest() {
  const m = new GameMap('forest', 40, 32, { name: 'Гнилой лес', outdoor: true, theme: 'forest', music: 'forest', fishZone: 'lake' });
  m.borderTrees([[17, 0, 22, 1]], ['pine', 'oak']);
  for (let x = 18; x <= 21; x++) m.warp(x, 0, 'farm', x, 30, 'up');
  m.fill(19, 1, 2, 9, G_.DIRT); m.fill(8, 9, 22, 1, G_.DIRT); m.fill(7, 8, 1, 2, G_.DIRT);
  m.building('witch', 4, 5, 'witch', 5, 8);
  m.ellipse(28, 15, 6.5, 5, G_.WATER, .35, 7);
  // ручей и болото
  m.fill(15, 18, 2, 12, G_.WATER); m.fill(15, 24, 2, 1, S && S.flags && S.flags.bridge ? G_.BRIDGE : G_.WATER);
  m.ellipse(7, 25, 4.5, 3, G_.SWAMP, .5, 9); m.ellipse(11, 21, 2, 1.5, G_.SWAMP, .4, 11);
  for (let y = 18; y < 30; y++) for (let x = 2; x < 15; x++) if (m.groundAt(x, y) === G_.GRASS) m.set(x, y, G_.DGRASS);
  // деревья внутри
  const r = RNG(4242);
  for (let k = 0; k < 70; k++) {
    const x = 2 + Math.floor(r() * 36), y = 2 + Math.floor(r() * 28);
    if (m.objAt(x, y) || m.solidAt(x, y) || m.groundAt(x, y) === G_.DIRT || m.block[y * m.w + x]) continue;
    if (Math.abs(x - 19.5) < 3 && y < 11) continue; if (y >= 8 && y <= 10) continue; if (x >= 29 && x <= 32 && y <= 7) continue;
    if (x >= 3 && x <= 11 && y >= 4 && y <= 9) continue;
    m.put(x, y, { t: 'tree', kind: r() < .6 ? 'pine' : (r() < .5 ? 'oak' : 'dead'), hp: 10, regrow: true });
  }
  for (const [x, y] of [[11, 14], [35, 24], [24, 27]]) { const o = m.objAt(x, y); if (o) m.remove(o); const o2 = m.objAt(x + 1, y + 1); if (o2) m.remove(o2); m.put(x, y, { t: 'bigstump', hp: 10, regrow: true }); }
  for (const [x, y] of [[13, 12], [3, 12], [36, 6], [25, 22], [33, 26], [5, 18]]) if (!m.objAt(x, y)) m.put(x, y, { t: 'bush' });
  return m;
}

/* ---------- интерьеры ---------- */
function interior(id, w, h, name, floor, wall, exitX, back) {
  const m = new GameMap(id, w, h, { name, outdoor: false, theme: 'indoor', music: 'indoor', fillT: floor, wall });
  m.fill(0, 0, w, 2, G_.IWALL); m.fill(0, 0, 1, h, G_.IWALL); m.fill(w - 1, 0, 1, h, G_.IWALL); m.fill(0, h - 1, w, 1, G_.IWALL);
  m.set(exitX, h - 1, floor);
  m.warp(exitX, h - 1, back[0], back[1], back[2], 'down');
  m.entry = { x: exitX, y: h - 2 };
  return m;
}
function buildInteriors() {
  const M = {};
  { const m = interior('house', 12, 10, 'Дом деда', G_.WOOD, ['#8a6a4a', '#7a5a3a', '#c9a24a'], 5, ['farm', 8, 6]);
    m.put(9, 2, { t: 'bed' }); m.put(2, 2, { t: 'tv' }); m.put(5, 1, { t: 'fireplace' }); m.put(5, 5, { t: 'rug' }); m.put(5, 4, { t: 'table', v: 1 });
    m.put(1, 7, { t: 'chest', grandpa: true, items: [] }); m.put(10, 7, { t: 'plant' }); m.put(1, 2, { t: 'mirror' });
    if (S.flags.kitchen) m.put(7, 2, { t: 'kitchen' });
    M.house = m; }
  { const m = interior('store', 14, 10, 'Лавка Пьеро', G_.WOOD, ['#c87a6a', '#b06a5a', '#ffffff'], 6, ['village', 6, 12]);
    for (let x = 3; x <= 9; x++) m.put(x, 4, { t: 'counter', v: x === 5 ? 1 : 0, shop: 'pierrot' });
    m.put(1, 1, { t: 'shelf', v: 1 }); m.put(4, 1, { t: 'shelf', v: 0 }); m.put(8, 1, { t: 'shelf', v: 1 }); m.put(11, 1, { t: 'shelf', v: 0 });
    m.put(11, 6, { t: 'crate' }); m.put(12, 7, { t: 'crate', v: 1 }); m.put(1, 7, { t: 'plant' });
    M.store = m; }
  { const m = interior('tavern', 16, 12, 'Таверна «Безумное чаепитие»', G_.WOOD, ['#5a2a4a', '#4a1a3a', '#f0c0d0'], 7, ['village', 16, 12]);
    for (let x = 2; x <= 8; x++) m.put(x, 4, { t: 'counter', v: x === 4 ? 1 : 0, shop: 'rosa' });
    m.put(1, 1, { t: 'shelf', v: 1 }); m.put(4, 1, { t: 'shelf', v: 1 }); m.put(7, 1, { t: 'shelf', v: 0 });
    m.put(11, 4, { t: 'table', v: 1 }); m.put(11, 7, { t: 'table', v: 1 }); m.put(3, 8, { t: 'table', v: 1 });
    m.put(14, 2, { t: 'arcade' }); m.put(11, 1, { t: 'piano' }); m.put(6, 8, { t: 'rug' });
    M.tavern = m; }
  { const m = interior('clinic', 12, 10, 'Клиника доктора Евы', G_.TILE, ['#d8e8ee', '#c0d4dc', '#7aa0c0'], 5, ['village', 25, 12]);
    for (let x = 3; x <= 7; x++) m.put(x, 4, { t: 'counter', v: x === 6 ? 1 : 0, shop: 'eva' });
    m.put(9, 2, { t: 'bed', v: 0 }); m.put(10, 2, { t: 'bed', v: 0 }); m.put(1, 1, { t: 'shelf', v: 1 }); m.put(5, 1, { t: 'shelf', v: 0 }); m.put(10, 7, { t: 'plant' });
    M.clinic = m; }
  { const m = interior('smithy', 12, 10, 'Кузница Клима', G_.STONE, ['#5a5a62', '#4a4a52', '#c87a3a'], 5, ['village', 7, 21]);
    for (let x = 3; x <= 7; x++) m.put(x, 4, { t: 'counter', v: 0, shop: 'klim' });
    m.put(9, 2, { t: 'furnace', on: true, deco: true }); m.put(5, 2, { t: 'anvil' }); m.put(1, 1, { t: 'shelf', v: 0 }); m.put(10, 7, { t: 'crate' });
    M.smithy = m; }
  { const m = interior('mayor', 12, 10, 'Дом мэра', G_.CARPET, ['#a88ac0', '#9078a8', '#f2c430'], 5, ['village', 34, 12]);
    m.put(4, 3, { t: 'table', v: 2 }); m.put(9, 2, { t: 'bed', v: 1 }); m.put(1, 1, { t: 'shelf', v: 2 }); m.put(1, 6, { t: 'plant' }); m.put(10, 7, { t: 'mirror' });
    M.mayor = m; }
  { const m = interior('chapel', 14, 12, 'Заброшенная часовня', G_.STONE, ['#6a6470', '#5a5460', '#9aff9a'], 6, ['village', 30, 23]);
    m.put(6, 2, { t: 'altar' });
    for (const [x, y] of [[2, 5], [9, 5], [2, 7], [9, 7]]) m.put(x, y, { t: 'pew' });
    m.put(1, 9, { t: 'crate' }); m.put(12, 2, { t: 'coffin' }); m.put(5, 6, { t: 'crack' }); m.put(1, 2, { t: 'bookstack' });
    M.chapel = m; }
  { const m = interior('witch', 12, 10, 'Хижина ведьмы', G_.WOOD, ['#3a2a3a', '#2a1a2a', '#8a4ad0'], 5, ['forest', 7, 8]);
    m.put(5, 3, { t: 'cauldron' }); for (let x = 2; x <= 8; x++) if (x < 4 || x > 6) m.put(x, 4, { t: 'counter', v: 0, shop: 'lilith' });
    m.put(4, 4, { t: 'counter', v: 1, shop: 'lilith' }); m.put(6, 4, { t: 'counter', v: 0, shop: 'lilith' });
    m.put(1, 1, { t: 'shelf', v: 1 }); m.put(8, 1, { t: 'shelf', v: 2 }); m.put(10, 6, { t: 'bookstack' }); m.put(1, 7, { t: 'pot' }); m.put(9, 2, { t: 'bed', v: 1 });
    M.witch = m; }
  { const m = interior('greenhouse', 12, 10, 'Оранжерея', G_.DIRT, ['#9aa8a0', '#8a9890', '#e8f8ff'], 5, ['farm', 20, 6]);
    m.farmable = true; m.soil = new Array(m.w * m.h).fill(null); m.greenhouse = true;
    M.greenhouse = m; }
  return M;
}

/* ---------- этажи Колодца ---------- */
function floorTheme(n) {
  if (n >= 31) return 'abyss'; if (n === 30) return 'library'; if (n > 20) return 'flesh'; if (n > 10) return 'flooded'; return 'cellar';
}
function buildFloor(n) {
  const th = floorTheme(n);
  const m = new GameMap('well:' + n, 34, 28, { name: n === 30 ? 'Библиотека Автора' : `Колодец · этаж ${n}`, outdoor: false, theme: 'dungeon', dtheme: th, music: th === 'library' ? 'library' : 'dungeon', fishZone: 'well', fillT: G_.DWALL, depth: n });
  m.dark = th === 'library' ? 0.55 : th === 'cellar' ? 0.74 : 0.78;
  if (n % 10 === 0 && n <= 30) return buildBossFloor(m, n);
  // клеточный автомат
  const W = m.w, H = m.h; let g = new Uint8Array(W * H);
  const r = Math.random;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[y * W + x] = (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) ? 1 : (r() < .44 ? 1 : 0);
  for (let it = 0; it < 5; it++) {
    const ng = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) { ng[y * W + x] = 1; continue; }
      let c = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) c += g[(y + j) * W + x + i];
      ng[y * W + x] = c >= 5 ? 1 : 0;
    }
    g = ng;
  }
  // крупнейшая область
  const lab = new Int32Array(W * H).fill(-1); let best = -1, bestN = 0, id = 0;
  for (let k = 0; k < W * H; k++) {
    if (g[k] || lab[k] >= 0) continue;
    const st = [k]; lab[k] = id; let cnt = 0;
    while (st.length) { const q = st.pop(); cnt++; const x = q % W, y = (q / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nk = (y + dy) * W + x + dx; if (!g[nk] && lab[nk] < 0) { lab[nk] = id; st.push(nk); } } }
    if (cnt > bestN) { bestN = cnt; best = id; } id++;
  }
  if (bestN < 180) return buildFloor(n);
  for (let k = 0; k < W * H; k++) m.ground[k] = (lab[k] === best) ? G_.DFLOOR : G_.DWALL;
  // вода/кровь
  if (th === 'flooded' || th === 'flesh' || th === 'abyss') {
    for (let k = 0; k < 3; k++) { const p = m.randomFree(); if (p) { for (let j = -1; j <= 1; j++) for (let i = -2; i <= 2; i++) { if (m.groundAt(p.x + i, p.y + j) === G_.DFLOOR && r() < .8) m.set(p.x + i, p.y + j, th === 'flesh' ? G_.BLOOD : G_.WATER); } } }
  }
  // старт
  const start = m.randomFree(); m.start = start;
  m.put(start.x, start.y - 1 >= 0 && m.groundAt(start.x, start.y - 1) === G_.DFLOOR ? start.y - 1 : start.y, { t: 'ladderUp', walk: true });
  const lu = m.objAt(start.x, start.y) || m.objAt(start.x, start.y - 1); if (lu) m.start = { x: lu.x, y: lu.y + 1 <= m.h - 2 && m.groundAt(lu.x, lu.y + 1) === G_.DFLOOR ? lu.y + 1 : lu.y };
  if (m.objAt(m.start.x, m.start.y)) m.start = start;
  // костёр
  if (n % 5 === 0) {
    const b = m.randomFree((x, y) => Math.abs(x - m.start.x) + Math.abs(y - m.start.y) < 6 && Math.abs(x - m.start.x) + Math.abs(y - m.start.y) > 1);
    if (b) { m.put(b.x, b.y, { t: 'bonfire', floor: n }); m.lights.push({ x: b.x * 16 + 8, y: b.y * 16 + 4, r: 70, col: 'fire' }); }
    if (n === 5) { const g2 = m.randomFree((x, y) => b && Math.abs(x - b.x) + Math.abs(y - b.y) <= 3 && Math.abs(x - b.x) + Math.abs(y - b.y) >= 2); if (g2) m.npcSpots = { grobus: g2 }; }
  }
  // камни
  const rockChance = .16 + Math.min(.08, n * .003);
  const ores = n <= 10 ? [[70, 'stone'], [12, 'copper'], [5, 'coal'], [4, 'geode'], [2, 'gem']] :
    n <= 20 ? [[62, 'stone'], [8, 'copper'], [12, 'iron'], [6, 'coal'], [5, 'geode'], [3, 'gem']] :
      [[55, 'stone'], [12, 'iron'], [10, 'gold'], [7, 'coal'], [6, 'geode'], [4, 'gem'], [1, 'mystic']];
  for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
    if (m.groundAt(x, y) !== G_.DFLOOR || m.objAt(x, y)) continue;
    if (Math.abs(x - m.start.x) + Math.abs(y - m.start.y) < 3) continue;
    const v = r();
    if (v < rockChance) { const kind = U.wchoice(ores); m.put(x, y, { t: 'rock', kind, hp: { stone: 1, copper: 3, iron: 4, gold: 6, coal: 2, geode: 3, gem: 5, mystic: 10 }[kind] + Math.floor(n / 12), v: Math.floor(r() * 4), dt: th }); }
    else if (v < rockChance + .012) m.put(x, y, { t: 'crate', v: r() < .5 ? 1 : 0, hp: 2 });
  }
  // сундук с особой наградой
  const CHESTS = { 3: 'copper_sword', 7: 'shorts', 13: 'blood_scythe', 17: 'eatme', 23: 'moonsword', 27: 'drinkme', 50: 'void_sword' };
  if (CHESTS[n] && !(S.flags['chest' + n])) { const c = m.randomFree((x, y) => Math.abs(x - m.start.x) + Math.abs(y - m.start.y) > 8); if (c) m.put(c.x, c.y, { t: 'chest', dungeon: CHESTS[n], floor: n }); }
  // монстры
  const spawnKey = th === 'cellar' ? (n >= 5 ? 'cellar2' : 'cellar') : th;
  const cnt = 5 + Math.floor(n / 3) + U.ri(0, 4);
  m.infested = n > 3 && n % 10 !== 5 && r() < .12;
  for (let k = 0; k < (m.infested ? cnt * 2 : cnt); k++) {
    const p = m.randomFree((x, y) => Math.abs(x - m.start.x) + Math.abs(y - m.start.y) > 7); if (!p) continue;
    spawnMonster(m, U.wchoice(DUNGEON_SPAWNS[spawnKey]), p.x * 16 + 8, p.y * 16 + 12, n);
  }
  // пятно крови (души)
  if (S.blood && S.blood.floor === n) { const p = m.randomFree(); if (p) m.put(p.x, p.y, { t: 'bloodstain', walk: true }); }
  m.rocksLeft = m.objs.filter(o => o && o.t === 'rock').length;
  return m;
}
function buildBossFloor(m, n) {
  const W = m.w, H = m.h, cx = 17, cy = 11;
  m.dark = .5;
  m.fill(0, 0, W, H, G_.DWALL);
  m.ellipse(cx, cy, 9.5, 7.5, G_.DFLOOR);
  m.fill(16, 18, 3, 8, G_.DFLOOR);
  m.start = { x: 17, y: 24 };
  m.put(17, 25, { t: 'ladderUp', walk: true });
  m.boss = n === 10 ? 'kingslime' : n === 20 ? 'hatter' : 'author';
  const done = S.flags['boss' + n];
  if (n === 30) {
    m.dark = .45;
    // дверь Автора перед ареной
    if (!S.flags.authorDoorOpen && !S.flags.boss30) m.put(17, 18, { t: 'door', v: 1, author: true }); else m.put(17, 18, { t: 'crack' });
    m.put(16, 18, { t: 'bookstack' }); m.put(18, 18, { t: 'bookstack' });
    m.put(15, 22, { t: 'manuscript' });
    for (const [x, y] of [[11, 8], [23, 8], [11, 14], [23, 14]]) m.put(x, y, { t: 'bookstack' });
  } else if (!done) { for (let x = 16; x <= 18; x++) m.put(x, 19, { t: 'fog', walk: false }); }
  if (done) {
    m.put(cx, cy - 3, { t: 'ladder', walk: true });
    m.put(cx - 2, cy + 2, { t: 'bonfire', floor: n }); m.lights.push({ x: (cx - 2) * 16 + 8, y: (cy + 2) * 16 + 4, r: 70, col: 'fire' });
  } else if (n !== 30) m.bossPending = true;
  return m;
}
