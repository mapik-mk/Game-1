/* ============================================================
   Мир: загрузка карт, переходы, рендер
   ============================================================ */
const World = {
  maps: {}, cur: null,
  init() {
    this.maps = {};
    this.maps.farm = buildFarm();
    this.maps.village = buildVillage();
    this.maps.forest = buildForest();
    Object.assign(this.maps, buildInteriors());
    if (S.mapState) this.restore(S.mapState);
    else this.firstSetup();
  },
  firstSetup() {
    const h = this.maps.house.objAt(1, 7);
    if (h) h.items = [{ id: 'blackseed', n: 1 }, { id: 'parsnip_seed', n: 5 }, { id: 'bottle', n: 1, of: 'grandpa' }];
    Spawner.dailyForage(true);
  },
  get(id) {
    if (id.startsWith('well:')) return buildFloor(parseInt(id.split(':')[1]));
    return this.maps[id];
  },
  // сохранение состояния карт (только то, что меняется)
  serialize() {
    const out = {};
    for (const id of ['farm', 'greenhouse', 'house', 'forest', 'village']) {
      const m = this.maps[id]; if (!m) continue;
      const objs = [], seen = new Set();
      for (const o of m.objs) if (o && !seen.has(o)) { seen.add(o); const c = Object.assign({}, o); objs.push(c); }
      const soil = [];
      if (m.soil) m.soil.forEach((s, k) => { if (s) soil.push([k % m.w, (k / m.w) | 0, s]); });
      const ground = [];
      if (id === 'forest') for (let x = 15; x <= 16; x++) ground.push(m.groundAt(x, 24));
      out[id] = { objs, soil, ground };
    }
    return out;
  },
  restore(st) {
    for (const id in st) {
      const m = this.maps[id]; if (!m) continue;
      m.objs.fill(null);
      for (const o of st[id].objs) { const c = Object.assign({}, o); delete c.w; delete c.h; m.put(o.x, o.y, Object.assign(c, { w: o.w, h: o.h })); }
      if (m.soil) { m.soil.fill(null); for (const [x, y, s] of st[id].soil || []) m.soil[y * m.w + x] = s; }
      if (id === 'forest' && S.flags.bridge) { m.fill(15, 24, 2, 1, G_.BRIDGE); }
      m.dirtyGround = true;
    }
  },
  enter(id, tx, ty, dir = 'down', silent = false) {
    const prev = this.cur;
    if (prev && prev.id.startsWith('well:') && !id.startsWith('well:')) Game.leftWell();
    const m = this.get(id);
    if (!m) { console.warn('no map', id); return; }
    UI.bossBar(null);
    this.cur = m;
    if (m.start && (tx === undefined || tx === null)) { tx = m.start.x; ty = m.start.y; }
    if (m.warps[tx + ',' + ty]) ty += dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
    P.x = tx * 16 + 8; P.y = ty * 16 + 12; P.dir = dir; P.act = null; P.roll = 0; P.kbx = P.kby = 0;
    m.drops = m.drops || []; m.projs = []; m.parts = [];
    NPCRT.populate(m);
    if (id.startsWith('well:')) { const n = m.depth; if (n > S.wellMax) S.wellMax = n; Game.inWell(m); }
    Render.snapCamera();
    Music.play(Game.musicFor(m));
    if (!silent) UI.locName(m.name);
    Events.onEnter(m);
  },
  async warp(id, tx, ty, dir) {
    if (Game.warping) return; Game.warping = true;
    AU.sfx('door'); await UI.fade(true);
    this.enter(id, tx, ty, dir);
    await U.sleep(80); await UI.fade(false);
    Game.warping = false;
  },
};

/* ---------- рендер ---------- */
const Render = {
  cv: null, ctx: null, buf: null, bctx: null, light: null, lctx: null, Z: 3, VW: 0, VH: 0, camX: 0, camY: 0,
  shake: 0, flash: 0, flashCol: '#fff', frame: 0, t: 0, texts: [],
  init() {
    this.cv = $('#cv'); this.ctx = this.cv.getContext('2d');
    this.buf = mkCanvas(10, 10); this.bctx = this.buf.getContext('2d');
    this.light = mkCanvas(10, 10); this.lctx = this.light.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
  },
  resize() {
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    const short = Math.min(this.cv.width, this.cv.height);
    const target = (Settings.zoom || 1) * (short < 700 ? 12.5 : 15);
    this.Z = Math.max(1, Math.round(short / (16 * target)));
    this.VW = Math.ceil(this.cv.width / this.Z); this.VH = Math.ceil(this.cv.height / this.Z);
    this.buf.width = this.VW; this.buf.height = this.VH; this.light.width = this.VW; this.light.height = this.VH;
    this.ctx.imageSmoothingEnabled = false; this.bctx.imageSmoothingEnabled = false;
    UI.layout();
  },
  snapCamera() { this.updateCamera(1); },
  updateCamera(k = 0.15) {
    const m = World.cur; if (!m) return;
    let tx = P.x - this.VW / 2, ty = P.y - 12 - this.VH / 2;
    const mw = m.w * 16, mh = m.h * 16;
    tx = mw <= this.VW ? (mw - this.VW) / 2 : U.clamp(tx, 0, mw - this.VW);
    ty = mh <= this.VH ? (mh - this.VH) / 2 : U.clamp(ty, 0, mh - this.VH);
    this.camX += (tx - this.camX) * k; this.camY += (ty - this.camY) * k;
    if (Math.abs(tx - this.camX) < .3) this.camX = tx; if (Math.abs(ty - this.camY) < .3) this.camY = ty;
  },
  groundCanvas(m) {
    const key = S.season + ':' + (m.dtheme || '');
    if (!m._gc || m.dirtyGround || m._gkey !== key) {
      const px = new PX(m.w * 16, m.h * 16);
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) drawGroundTile(px, x, y, m.ground[y * m.w + x], m);
      m._gc = px.done(); m.dirtyGround = false; m._gkey = key;
    }
    return m._gc;
  },
  draw() {
    const m = World.cur; if (!m) return;
    this.frame++;
    const g = this.bctx, VW = this.VW, VH = this.VH;
    const sx = Math.round(this.camX + (this.shake ? (Math.random() - .5) * this.shake : 0)), sy = Math.round(this.camY + (this.shake ? (Math.random() - .5) * this.shake : 0));
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH);
    g.drawImage(this.groundCanvas(m), -sx, -sy);
    g.translate(-sx, -sy);
    const x0 = Math.max(0, Math.floor(sx / 16) - 2), y0 = Math.max(0, Math.floor(sy / 16) - 2), x1 = Math.min(m.w - 1, Math.ceil((sx + VW) / 16) + 2), y1 = Math.min(m.h - 1, Math.ceil((sy + VH) / 16) + 4);
    const anim = Math.floor(this.t * 6);
    // вода — блики
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = m.ground[y * m.w + x];
      if (WATERY.has(t)) { const ph = (this.t * 1.5 + U.hash(x, y, 2) * 6) % 6; if (ph < 3) { g.fillStyle = t === G_.BLOOD ? 'rgba(255,120,120,.5)' : 'rgba(220,240,255,.55)'; g.fillRect(x * 16 + 3 + Math.floor(ph * 2), y * 16 + 4 + Math.floor(U.hash(x, y, 3) * 8), 3, 1); } }
    }
    // почва
    if (m.soil) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const s = m.soil[y * m.w + x]; if (s) g.drawImage(soilSprite(s), x * 16, y * 16); }
    // плоские объекты
    const list = [];
    const seen = new Set();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const o = m.objs[y * m.w + x];
      if (o && !seen.has(o)) {
        seen.add(o);
        if (FLAT_OBJ.has(o.t)) this.drawObj(g, o, anim); else list.push({ y: (o.y + (o.h || 1)) * 16 - (o.t === 'forage' ? 8 : 0), o });
      }
      if (m.soil) { const s = m.soil[y * m.w + x]; if (s && s.crop) list.push({ y: y * 16 + 9, crop: s, x, yy: y }); }
    }
    for (const b of m.bigs) if (b.x * 16 < sx + VW + 64 && (b.x + b.w) * 16 > sx - 64 && b.y * 16 < sy + VH + 96) list.push({ y: (b.y + b.h) * 16, b });
    for (const n of m.npcs) list.push({ y: n.y, npc: n });
    for (const mo of m.mons) list.push({ y: mo.y, mon: mo });
    for (const d of m.drops) list.push({ y: d.y, drop: d });
    if (!Game.hidePlayer) list.push({ y: P.y, player: true });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.o) this.drawObj(g, it.o, anim);
      else if (it.crop) { const st = cropStage(it.crop); const c = cropSprite(it.crop.crop, it.crop.dead ? 1 : st, S.sanity < 40); if (it.crop.dead) { g.globalAlpha = .6; g.filter = 'sepia(1) brightness(.6)'; } g.drawImage(c, it.x * 16, it.yy * 16 - 8); g.globalAlpha = 1; g.filter = 'none'; if (st === 4 && !it.crop.dead && (this.frame >> 4) % 4 === 0) { g.fillStyle = 'rgba(255,255,200,.7)'; g.fillRect(it.x * 16 + 13, it.yy * 16 - 6, 1, 1); } }
      else if (it.b) { const night = isNight(); const s = buildingSprite(it.b.kind, night); g.drawImage(s, it.b.x * 16, (it.b.y + it.b.h) * 16 - s.height); }
      else if (it.npc) NPCRT.draw(g, it.npc);
      else if (it.mon) Mon.draw(g, it.mon);
      else if (it.drop) Drops.draw(g, it.drop);
      else if (it.player) Player.draw(g);
    }
    // снаряды и частицы
    for (const p of m.projs) Proj.draw(g, p);
    Parts.draw(g);
    // погода
    if (m.outdoor) Weather.draw(g, sx, sy, VW, VH);
    // свет
    const dark = darkness(m);
    if (dark > 0.02) {
      const l = this.lctx; l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, VW, VH);
      l.fillStyle = m.dtheme === 'library' ? `rgba(255,255,255,${dark * .3})` : `rgba(6,4,18,${dark})`; l.fillRect(0, 0, VW, VH);
      l.globalCompositeOperation = 'destination-out';
      const lights = collectLights(m);
      for (const L of lights) {
        const x = L.x - sx, y = L.y - sy; if (x < -L.r || y < -L.r || x > VW + L.r || y > VH + L.r) continue;
        const r = L.r * (L.flick ? (0.94 + Math.sin(this.t * 9 + L.x) * .04 + Math.random() * .03) : 1);
        const gr = l.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.55, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        l.fillStyle = gr; l.beginPath(); l.arc(x, y, r, 0, 7); l.fill();
      }
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(this.light, 0, 0);
      g.globalCompositeOperation = 'lighter';
      for (const L of lights) if (L.col) {
        const x = L.x - sx, y = L.y - sy; const r = L.r * .6;
        const gr = g.createRadialGradient(x, y, 0, x, y, r); const c = L.col === 'fire' ? '255,140,40' : L.col === 'blue' ? '80,160,255' : L.col === 'green' ? '80,255,120' : '255,220,150';
        gr.addColorStop(0, `rgba(${c},${.22 * dark})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    // финальный вывод с эффектом рассудка
    const ctx = this.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const san = S.sanity / S.maxSanity;
    const gsv = U.clamp((0.62 - san) / 0.5, 0, 0.92);
    let f = gsv > 0 ? `grayscale(${gsv.toFixed(2)}) contrast(${(1 + gsv * .45).toFixed(2)})` : 'none';
    if (m.dtheme === 'library') f = 'grayscale(1) contrast(1.3)';
    ctx.filter = f;
    ctx.imageSmoothingEnabled = false;
    let ox = 0;
    if (san < .25 && Math.random() < .02) ox = (Math.random() - .5) * 8 * this.Z;
    ctx.drawImage(this.buf, 0, 0, VW, VH, ox, 0, VW * this.Z, VH * this.Z);
    ctx.filter = 'none';
    // глитч-полосы
    if (san < .3 && Math.random() < (0.3 - san) * .5) {
      const h = U.ri(2, 14) * this.Z, y = Math.random() * this.cv.height;
      ctx.drawImage(this.cv, 0, y, this.cv.width, h, (Math.random() - .5) * 30 * this.Z, y, this.cv.width, h);
      if (Math.random() < .3) { ctx.fillStyle = 'rgba(200,0,30,.35)'; ctx.fillRect(0, y, this.cv.width, h / 2); }
    }
    // штрихи «карандашного наброска» (Black Souls)
    if (gsv > .45) {
      ctx.strokeStyle = `rgba(0,0,0,${(gsv - .45) * .35})`; ctx.lineWidth = this.Z * .6;
      const seed = Math.floor(this.t * 4);
      for (let k = 0; k < 40; k++) { const x = U.hash(k, seed, 1) * this.cv.width, y = U.hash(k, seed, 2) * this.cv.height, l = 20 + U.hash(k, seed, 3) * 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l * .7, y + l * .3); ctx.stroke(); }
    }
    // тексты в мире
    this.drawTexts(ctx, sx, sy);
    // вспышка
    if (this.flash > 0) { ctx.globalAlpha = Math.min(1, this.flash); ctx.fillStyle = this.flashCol; ctx.fillRect(0, 0, this.cv.width, this.cv.height); ctx.globalAlpha = 1; }
    // мини-игра рыбалки и индикаторы
    Fishing.drawUI(ctx);
    Player.drawUI(ctx, sx, sy);
    Halluc.drawUI(ctx);
    $('#vignette').style.opacity = san < .35 ? String(Math.min(1, (0.35 - san) * 3.5)) : (P.hurtT > 0 ? '0.6' : '0');
  },
  drawObj(g, o, anim) {
    if (o.t === 'tree') {
      const c = treeSprite(o.kind, S.season, o.stage === undefined ? 3 : o.stage, S.sanity < 35 && U.hash(o.x, o.y, 1) < .3);
      if (o.stage !== undefined && o.stage < 3) { g.drawImage(c, o.x * 16, o.y * 16); return; }
      let a = 1;
      if (Math.abs(P.x - (o.x * 16 + 8)) < 18 && P.y < o.y * 16 + 6 && P.y > o.y * 16 - 34) a = .45;
      const shakeX = o.shakeUntil > this.t ? Math.sin(this.t * 40) * 2 : 0;
      g.globalAlpha = a; g.drawImage(c, o.x * 16 - 8 + shakeX, o.y * 16 - 32); g.globalAlpha = 1; return;
    }
    if (o.t === 'forage' || o.t === 'artifact') {
      if (o.t === 'artifact') { const f = (anim >> 1) % 2; g.fillStyle = '#5a3a1a'; g.fillRect(o.x * 16 + 5, o.y * 16 + 10, 6, 2); g.fillStyle = '#e07a8a'; g.fillRect(o.x * 16 + 6 + f, o.y * 16 + 7, 1, 3); g.fillRect(o.x * 16 + 9 - f, o.y * 16 + 6, 1, 4); return; }
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(o.x * 16 + 4, o.y * 16 + 13, 8, 2);
      g.drawImage(itemIconCanvas(o.item), o.x * 16, o.y * 16 - 2 + Math.sin(this.t * 3 + o.x) * 1); return;
    }
    if (o.t === 'eye') { g.drawImage(objSprite(o, anim >> 2), o.x * 16, o.y * 16); return; }
    let fr = anim;
    if (o.t === 'furnace' || o.t === 'keg' || o.t === 'pjar') o.on = !!o.input;
    if (o.t === 'furnace' && o.deco) o.on = true;
    if (o.t === 'scarecrow') o.creepy = S.sanity < 40;
    if (o.t === 'well') o.hand = S.sanity < 30 && (this.frame >> 6) % 3 === 0;
    if (o.t === 'mailbox') o.flag = S.mail.length > 0;
    if (o.t === 'fence') { const l = World.cur.objAt(o.x - 1, o.y), r = World.cur.objAt(o.x + 1, o.y); o.l = !!(l && l.t === 'fence'); o.r = !!(r && r.t === 'fence'); }
    const c = o.t === 'campfire' ? objSprite({ t: 'bonfire' }, anim) : o.t === 'qsprinkler' ? objSprite({ t: 'sprinkler', tier: 2 }) : o.t === 'cookpot' ? objSprite({ t: 'pot' }) : o.t === 'pjar' ? objSprite({ t: 'jar' }) : objSprite(o, fr);
    if (!c) return;
    const fw = (o.w || 1) * 16, fh = (o.h || 1) * 16;
    const dx = o.x * 16 + Math.floor((fw - c.width) / 2), dy = o.y * 16 + fh - c.height;
    if (o.hitUntil > this.t) { g.drawImage(whiteOf(c), dx + (Math.random() - .5) * 2, dy); }
    else g.drawImage(c, dx, dy);
    if (o.ready) { const b = Math.sin(this.t * 4) * 2; g.fillStyle = '#fff'; g.fillRect(dx + c.width / 2 - 6, dy - 14 + b, 12, 12); g.strokeStyle = '#3a2410'; g.strokeRect(dx + c.width / 2 - 6.5, dy - 14.5 + b, 13, 13); g.drawImage(itemIconCanvas(o.ready.id, o.ready.of), dx + c.width / 2 - 6, dy - 14 + b, 12, 12); }
  },
  addText(x, y, txt, col = '#fff', size = 1) { this.texts.push({ x, y, txt, col, t: 0, size }); },
  drawTexts(ctx, sx, sy) {
    const Z = this.Z;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i]; t.t += 1 / 60;
      if (t.t > 1.1) { this.texts.splice(i, 1); continue; }
      const x = (t.x - sx) * Z, y = (t.y - sy - t.t * 18) * Z;
      ctx.font = `700 ${Math.round(6 * Z * t.size)}px 'Pixelify Sans', monospace`;
      ctx.globalAlpha = Math.min(1, (1.1 - t.t) * 3);
      ctx.lineWidth = Z * 1.2; ctx.strokeStyle = '#000'; ctx.strokeText(t.txt, x, y); ctx.fillStyle = t.col; ctx.fillText(t.txt, x, y);
    }
    ctx.globalAlpha = 1;
  },
};
function soilSprite(s) {
  return spr(`soil:${s.water ? 1 : 0}:${s.fert || 0}:${S.season === 3 ? 1 : 0}`, () => {
    const p = new PX(16, 16); const c = s.water ? ['#3e2a1a', '#4a3220', '#30200f'] : ['#7a5232', '#8a6040', '#6a4428'];
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) p.p(i, j, j % 4 === 0 ? c[2] : (U.hash(i, j, 3) < .2 ? c[1] : c[0]));
    p.hl(1, 14, 1, c[1]); p.vl(0, 1, 14, c[2]); p.vl(15, 1, 14, c[2]); p.hl(0, 15, 15, c[2]);
    if (s.fert === 1) p.speck(2, 2, 12, 12, ['#d0c8a0'], .06, 4); if (s.fert === 2) p.speck(2, 2, 12, 12, ['#a060e0'], .07, 5); if (s.fert === 3) p.speck(2, 2, 12, 12, ['#60f060'], .07, 6);
    return p.done();
  });
}
function isNight() { return S.time >= 1140; }
function darkness(m) {
  if (m.theme === 'dungeon') return m.dark;
  const t = S.time;
  if (!m.outdoor) return t >= 1200 ? .3 : t >= 1080 ? (t - 1080) / 120 * .3 : 0;
  let d = 0;
  if (t >= 1080) d = Math.min(.82, (t - 1080) / 150 * .82);
  if (S.weather === 'rain' || S.weather === 'storm') d = Math.max(d, .22) + (t >= 1080 ? .05 : 0);
  return Math.min(.88, d);
}
function collectLights(m) {
  const L = [];
  const pr = m.theme === 'dungeon' ? (m.dtheme === 'library' ? 110 : 80 + (S.flags.lantern ? 34 : 0)) : 44;
  L.push({ x: P.x, y: P.y - 10, r: pr, flick: m.theme === 'dungeon' });
  for (const l of m.lights) L.push(l);
  const seen = new Set();
  for (const o of m.objs) {
    if (!o || seen.has(o)) continue; seen.add(o);
    if (o.t === 'torch' || o.t === 'campfire' || o.t === 'bonfire') L.push({ x: o.x * 16 + 8, y: o.y * 16 + 4, r: o.t === 'torch' ? 56 : 80, col: 'fire', flick: true });
    else if (o.t === 'lamppost' || o.t === 'lamp') L.push({ x: o.x * 16 + 8, y: o.y * 16 - 14, r: 60, col: 'warm' });
    else if (o.t === 'fireplace') L.push({ x: o.x * 16 + 16, y: o.y * 16 + 6, r: 80, col: 'fire', flick: true });
    else if (o.t === 'furnace' && o.on) L.push({ x: o.x * 16 + 8, y: o.y * 16 + 6, r: 40, col: 'fire', flick: true });
    else if (o.t === 'altar') L.push({ x: o.x * 16 + 16, y: o.y * 16, r: 70, col: 'green' });
    else if (o.t === 'cauldron') L.push({ x: o.x * 16 + 8, y: o.y * 16 + 4, r: 50, col: 'green', flick: true });
    else if (o.t === 'tv') L.push({ x: o.x * 16 + 8, y: o.y * 16 + 6, r: 30, col: 'blue' });
    else if (o.t === 'bloodstain') L.push({ x: o.x * 16 + 8, y: o.y * 16 + 8, r: 26, col: 'green' });
  }
  if (m.outdoor) for (const b of m.bigs) { const B = BUILD_STYLES[b.kind]; for (const [wx] of B.windows || []) L.push({ x: b.x * 16 + wx * 16 + 8, y: (b.y + b.h) * 16 - 24, r: 34, col: 'warm' }); }
  for (const mo of m.mons) if (mo.def.spr === 'eye' || mo.def.spr === 'ghost') L.push({ x: mo.x, y: mo.y - 8, r: 22, col: mo.def.spr === 'ghost' ? 'blue' : null });
  for (const p of m.projs) if (p.glow) L.push({ x: p.x, y: p.y, r: 20, col: p.glow });
  for (const n of m.npcs) if (n.def.ghost) L.push({ x: n.x, y: n.y - 12, r: 36, col: 'blue' });
  return L;
}

/* ---------- погода ---------- */
const Weather = {
  drops: [],
  draw(g, sx, sy, VW, VH) {
    const w = S.weather; if (w === 'sun') return;
    const snow = S.season === 3 && (w === 'rain' || w === 'snow');
    const blood = S.sanity < 30 && !snow;
    const n = w === 'storm' ? 140 : 90;
    while (this.drops.length < n) this.drops.push({ x: Math.random() * VW, y: Math.random() * VH, s: .6 + Math.random() * .6 });
    g.fillStyle = snow ? 'rgba(255,255,255,.85)' : blood ? 'rgba(190,10,30,.7)' : 'rgba(170,200,255,.55)';
    for (const d of this.drops) {
      if (snow) { d.y += .5 * d.s; d.x += Math.sin(Render.t + d.y * .05) * .3; g.fillRect(sx + d.x, sy + d.y, 1, 1); }
      else { d.y += 5 * d.s; d.x -= 1.2 * d.s; g.fillRect(sx + d.x, sy + d.y, 1, 3); }
      if (d.y > VH) { d.y = -4; d.x = Math.random() * (VW + 40); } if (d.x < -4) d.x += VW;
    }
    if (w === 'storm' && Math.random() < .002) { Render.flash = .7; Render.flashCol = '#fff'; setTimeout(() => AU.sfx('thunder'), 300); }
  },
};
