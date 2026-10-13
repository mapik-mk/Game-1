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

/* ---------- рендер (прямо в разрешении экрана, мир масштабируется целым Z) ---------- */
const Render = {
  cv: null, ctx: null, light: null, lctx: null, Z: 3, VW: 0, VH: 0, camX: 0, camY: 0,
  shake: 0, flash: 0, flashCol: '#fff', frame: 0, t: 0, texts: [], _filter: '',
  init() {
    this.cv = $('#cv'); this.ctx = this.cv.getContext('2d');
    this.light = mkCanvas(10, 10); this.lctx = this.light.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
  },
  resize() {
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
    this.cv.width = Math.max(1, Math.round(r.width * dpr)); this.cv.height = Math.max(1, Math.round(r.height * dpr));
    const short = Math.min(this.cv.width, this.cv.height);
    const target = (Settings.zoom || 1) * (short < 700 ? 12.5 : 15);
    this.Z = Math.max(2, Math.round(short / (16 * target)));
    this.VW = this.cv.width / this.Z; this.VH = this.cv.height / this.Z;
    this.light.width = Math.ceil(this.VW / 2) + 2; this.light.height = Math.ceil(this.VH / 2) + 2;
    this.ctx.imageSmoothingEnabled = false;
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
    if (Math.abs(tx - this.camX) < .05) this.camX = tx; if (Math.abs(ty - this.camY) < .05) this.camY = ty;
  },
  groundCanvas(m) {
    const key = S.season + ':' + (m.dtheme || '');
    if (!m._gc || m.dirtyGround || m._gkey !== key) {
      const px = new PX(m.w * 16, m.h * 16);
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) drawGroundTile(px, x, y, m.ground[y * m.w + x], m);
      m._gc = px.done(); m.dirtyGround = false; m._gkey = key;
      // береговые флаги для анимации пены
      m._shore = new Uint8Array(m.w * m.h);
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const t = m.ground[y * m.w + x]; if (!WATERY.has(t)) continue;
        const land = (dx, dy) => { const n = m.groundAt(x + dx, y + dy); return n !== null && !WATERY.has(n) && n !== G_.BRIDGE; };
        m._shore[y * m.w + x] = (land(0, -1) ? 1 : 0) | (land(0, 1) ? 2 : 0) | (land(-1, 0) ? 4 : 0) | (land(1, 0) ? 8 : 0) | 16;
      }
    }
    return m._gc;
  },
  draw() {
    const m = World.cur; if (!m) return;
    this.frame++;
    const ctx = this.ctx, Z = this.Z, W = this.cv.width, H = this.cv.height;
    const shx = this.shake ? (Math.random() - .5) * this.shake : 0, shy = this.shake ? (Math.random() - .5) * this.shake : 0;
    const ox = Math.round((-this.camX + shx) * Z), oy = Math.round((-this.camY + shy) * Z);
    const sx = -ox / Z, sy = -oy / Z, VW = this.VW, VH = this.VH;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#050304'; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(Z, 0, 0, Z, ox, oy); ctx.imageSmoothingEnabled = false;
    const g = ctx;
    // земля (видимая часть)
    const gc = this.groundCanvas(m);
    const gx = Math.max(0, Math.floor(sx) - 1), gy = Math.max(0, Math.floor(sy) - 1);
    const gw = Math.min(gc.width - gx, Math.ceil(VW) + 3), gh = Math.min(gc.height - gy, Math.ceil(VH) + 3);
    if (gw > 0 && gh > 0) g.drawImage(gc, gx, gy, gw, gh, gx, gy, gw, gh);
    const x0 = Math.max(0, Math.floor(sx / 16) - 2), y0 = Math.max(0, Math.floor(sy / 16) - 2), x1 = Math.min(m.w - 1, Math.ceil((sx + VW) / 16) + 2), y1 = Math.min(m.h - 1, Math.ceil((sy + VH) / 16) + 4);
    const anim = Math.floor(this.t * 6), t = this.t;
    // анимированная вода
    if (m._shore) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const f = m._shore[y * m.w + x]; if (!f) continue;
      const tt = m.ground[y * m.w + x], blood = tt === G_.BLOOD, swamp = tt === G_.SWAMP;
      const hi = blood ? '255,120,130' : swamp ? '170,220,150' : '225,245,255';
      for (let k = 0; k < 2; k++) {
        const ph = U.hash(x, y, 4 + k) * 16, sp = 3 + k * 2;
        const wx = ((t * sp + ph) % 20) - 4, wy = 3 + k * 7 + Math.floor(U.hash(x, y, 9 + k) * 3);
        const a = .22 + .18 * Math.sin(t * 2 + ph);
        g.fillStyle = `rgba(${hi},${a})`; g.fillRect(x * 16 + Math.max(0, wx), y * 16 + wy, Math.min(4, 16 - Math.max(0, wx)), .6);
      }
      if (U.hash(x, y, 3) < .25) { const ph = (t * .8 + U.hash(x, y, 5) * 6) % 3; if (ph < 1) { g.fillStyle = `rgba(255,255,255,${(1 - ph) * .7})`; g.fillRect(x * 16 + 4 + U.hash(x, y, 6) * 8, y * 16 + 4 + U.hash(x, y, 7) * 8, .7, .7); } }
      const foam = .25 + .2 * Math.sin(t * 2.2 + x * .9 + y * .7);
      g.fillStyle = `rgba(255,255,255,${foam})`;
      if (f & 1) g.fillRect(x * 16, y * 16 + 2 + Math.sin(t * 1.7 + x) * .5, 16, .7);
      if (f & 2) g.fillRect(x * 16, y * 16 + 14.3, 16, .6);
      if (f & 4) g.fillRect(x * 16 + 1.5 + Math.sin(t * 1.5 + y) * .4, y * 16, .6, 16);
      if (f & 8) g.fillRect(x * 16 + 14, y * 16, .6, 16);
    }
    // почва
    if (m.soil) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const so = m.soil[y * m.w + x]; if (so) g.drawImage(soilSprite(so), x * 16, y * 16); }
    // плоские объекты + сортировка
    const list = [], seen = new Set();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const o = m.objs[y * m.w + x];
      if (o && !seen.has(o)) { seen.add(o); if (FLAT_OBJ.has(o.t)) this.drawObj(g, o, anim); else list.push({ y: (o.y + (o.h || 1)) * 16 - (o.t === 'forage' ? 8 : 0), o }); }
      if (m.soil) { const so = m.soil[y * m.w + x]; if (so && so.crop) list.push({ y: y * 16 + 9, crop: so, x, yy: y }); }
    }
    for (const b of m.bigs) if (b.x * 16 < sx + VW + 64 && (b.x + b.w) * 16 > sx - 64 && b.y * 16 < sy + VH + 120) list.push({ y: (b.y + b.h) * 16, b });
    for (const n of m.npcs) list.push({ y: n.y, npc: n });
    for (const mo of m.mons) list.push({ y: mo.y, mon: mo });
    for (const d of m.drops) list.push({ y: d.y, drop: d });
    if (!Game.hidePlayer) list.push({ y: P.y, player: true });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.o) this.drawObj(g, it.o, anim);
      else if (it.crop) this.drawCrop(g, it.crop, it.x, it.yy);
      else if (it.b) { const s2 = buildingSprite(it.b.kind, isNight()); g.drawImage(s2, it.b.x * 16, (it.b.y + it.b.h) * 16 - s2.height); this.chimney(it.b); }
      else if (it.npc) NPCRT.draw(g, it.npc);
      else if (it.mon) Mon.draw(g, it.mon);
      else if (it.drop) Drops.draw(g, it.drop);
      else if (it.player) Player.draw(g);
    }
    for (const p of m.projs) Proj.draw(g, p);
    Parts.draw(g);
    Ambient.draw(g, m, sx, sy, VW, VH);
    // тени облаков
    if (m.outdoor && S.weather === 'sun' && S.time < 1140) {
      for (let k = 0; k < 3; k++) {
        const cx = ((U.hash(k, 1, 77) * 900 + t * (5 + k * 2)) % (m.w * 16 + 400)) - 200, cy = U.hash(k, 2, 77) * m.h * 16;
        const gr = g.createRadialGradient(cx, cy, 10, cx, cy, 90 + k * 20); gr.addColorStop(0, 'rgba(20,30,70,.11)'); gr.addColorStop(1, 'rgba(20,30,70,0)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, 120 + k * 20, 70, 0, 0, 7); g.fill();
      }
    }
    if (m.outdoor) Weather.draw(g, sx, sy, VW, VH);
    // цвет времени суток
    if (m.outdoor) {
      const tm = S.time; let tint = null;
      if (tm >= 1020 && tm < 1200) { const k = Math.sin((tm - 1020) / 180 * Math.PI); tint = `rgba(255,120,40,${(.16 * k).toFixed(3)})`; }
      else if (tm < 420) tint = `rgba(255,160,190,${(.1 * (1 - (tm - 360) / 60)).toFixed(3)})`;
      if (tint) { g.fillStyle = tint; g.fillRect(sx - 2, sy - 2, VW + 4, VH + 4); }
    }
    // свет (низкое разрешение + сглаживание = мягкие пятна)
    const dark = darkness(m);
    if (dark > 0.02) {
      const l = this.lctx, LW = this.light.width, LH = this.light.height;
      l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, LW, LH);
      l.fillStyle = m.dtheme === 'library' ? `rgba(255,255,255,${dark * .3})` : `rgba(6,4,20,${dark})`; l.fillRect(0, 0, LW, LH);
      l.globalCompositeOperation = 'destination-out';
      const lights = collectLights(m);
      for (const L of lights) {
        const x = (L.x - sx) / 2, y = (L.y - sy) / 2, rr = L.r / 2; if (x < -rr || y < -rr || x > LW + rr || y > LH + rr) continue;
        const r = rr * (L.flick ? (0.94 + Math.sin(t * 9 + L.x) * .04 + Math.random() * .03) : 1);
        const gr = l.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.5, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        l.fillStyle = gr; l.beginPath(); l.arc(x, y, r, 0, 7); l.fill();
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.light, 0, 0, LW, LH, (Math.floor(sx) - sx) * 0, 0, LW * 2 * Z, LH * 2 * Z);
      ctx.restore(); ctx.imageSmoothingEnabled = false;
      g.globalCompositeOperation = 'lighter';
      for (const L of lights) if (L.col) {
        const r = L.r * .6;
        const gr = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, r); const c = L.col === 'fire' ? '255,140,40' : L.col === 'blue' ? '80,160,255' : L.col === 'green' ? '80,255,120' : '255,220,150';
        gr.addColorStop(0, `rgba(${c},${.25 * dark})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(L.x, L.y, r, 0, 7); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      Ambient.drawGlow(g, m);
    }
    // экранные эффекты
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const san = S.sanity / S.maxSanity;
    const gsv = U.clamp((0.62 - san) / 0.5, 0, 0.92);
    let f = gsv > 0 ? `grayscale(${gsv.toFixed(2)}) contrast(${(1 + gsv * .45).toFixed(2)})` : 'none';
    if (m.dtheme === 'library') f = 'grayscale(1) contrast(1.3)';
    if (f !== this._filter) { this._filter = f; this.cv.style.filter = f; }
    if (san < .3 && Math.random() < (0.3 - san) * .5) {
      const h = U.ri(2, 14) * Z, y = Math.random() * H;
      ctx.drawImage(this.cv, 0, y, W, h, (Math.random() - .5) * 30 * Z, y, W, h);
      if (Math.random() < .3) { ctx.fillStyle = 'rgba(200,0,30,.35)'; ctx.fillRect(0, y, W, h / 2); }
    }
    if (gsv > .45) {
      ctx.strokeStyle = `rgba(0,0,0,${(gsv - .45) * .35})`; ctx.lineWidth = Z * .6;
      const seed = Math.floor(t * 4);
      for (let k = 0; k < 40; k++) { const x = U.hash(k, seed, 1) * W, y = U.hash(k, seed, 2) * H, l = 20 + U.hash(k, seed, 3) * 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l * .7, y + l * .3); ctx.stroke(); }
    }
    this.drawTexts(ctx, sx, sy);
    if (this.flash > 0) { ctx.globalAlpha = Math.min(1, this.flash); ctx.fillStyle = this.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    Fishing.drawUI(ctx);
    Player.drawUI(ctx, sx, sy);
    Halluc.drawUI(ctx);
    $('#vignette').style.opacity = san < .35 ? String(Math.min(1, (0.35 - san) * 3.5)) : (P.hurtT > 0 ? '0.6' : '0');
  },
  chimney(b) {
    const B = BUILD_STYLES[b.kind]; if (!B.chimney || !World.cur.outdoor) return;
    if (Math.random() < .12) Parts.smoke(b.x * 16 + B.chimney[0], (b.y + b.h) * 16 - (B.h + B.roofH) * 16 + B.chimney[1]);
  },
  drawCrop(g, so, x, y) {
    const st = cropStage(so); const c = cropSprite(so.crop, so.dead ? 1 : st, S.sanity < 40);
    if (so.dead) { g.globalAlpha = .65; g.drawImage(tint(c, '#5a4020', .7), x * 16, y * 16 - 8); g.globalAlpha = 1; return; }
    const sw = Math.sin(this.t * 1.8 + x * .8 + y * .5) * (st > 1 ? .6 : .3);
    g.drawImage(c, 0, 0, 16, 14, x * 16 + sw, y * 16 - 8, 16, 14);
    g.drawImage(c, 0, 14, 16, 10, x * 16, y * 16 + 6, 16, 10);
    if (st === 4 && (this.frame >> 3) % 6 === 0) { g.fillStyle = 'rgba(255,255,220,.9)'; g.fillRect(x * 16 + 3 + U.hash(x, y, this.frame >> 5) * 10, y * 16 - 4 + U.hash(y, x, this.frame >> 5) * 8, .8, .8); }
  },
  drawObj(g, o, anim) {
    const t = this.t;
    if (o.t === 'tree') {
      const c = treeSprite(o.kind, S.season, o.stage === undefined ? 3 : o.stage, S.sanity < 35 && U.hash(o.x, o.y, 1) < .3);
      if (o.stage !== undefined && o.stage < 3) { g.drawImage(c, o.x * 16 + Math.sin(t * 2 + o.x) * .4, o.y * 16); return; }
      let a = 1;
      if (Math.abs(P.x - (o.x * 16 + 8)) < 18 && P.y < o.y * 16 + 6 && P.y > o.y * 16 - 34) a = .45;
      const hitS = o.shakeUntil > t ? Math.sin(t * 40) * 1.6 : 0;
      const wind = (S.weather === 'storm' ? 2.2 : S.weather === 'rain' ? 1.4 : 1) * (o.kind === 'dead' ? .4 : 1);
      const base = t * 1.25 + o.x * .63 + o.y * .41;
      const dx = o.x * 16 - 8, dy = o.y * 16 - 32;
      g.globalAlpha = a;
      for (let r = 0; r < 36; r += 4) { const k = 1 - r / 36; const off = (Math.sin(base + r * .04) * 1.1 + Math.sin(base * 2.3) * .3) * k * k * wind + hitS * k; g.drawImage(c, 0, r, 32, 4, dx + off, dy + r, 32, 4); }
      g.drawImage(c, 0, 36, 32, 12, dx + hitS * .1, dy + 36, 32, 12);
      g.globalAlpha = 1; return;
    }
    if (o.t === 'forage' || o.t === 'artifact') {
      if (o.t === 'artifact') { const f = (anim >> 1) % 2; g.fillStyle = '#5a3a1a'; g.fillRect(o.x * 16 + 5, o.y * 16 + 10, 6, 2); g.fillStyle = '#e07a8a'; g.fillRect(o.x * 16 + 6 + f, o.y * 16 + 7, 1, 3); g.fillRect(o.x * 16 + 9 - f, o.y * 16 + 6, 1, 4); return; }
      g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(o.x * 16 + 8, o.y * 16 + 14, 5, 1.6, 0, 0, 7); g.fill();
      g.drawImage(itemIconCanvas(o.item), o.x * 16 + 1, o.y * 16 - 1 + Math.sin(t * 3 + o.x) * .8, 14, 14);
      if ((this.frame + o.x * 7) % 90 < 6) { g.fillStyle = '#fff'; g.fillRect(o.x * 16 + 12, o.y * 16 + 1, .8, .8); }
      return;
    }
    if (o.t === 'eye') { g.drawImage(objSprite(o, anim >> 2), o.x * 16, o.y * 16); return; }
    if (o.t === 'furnace' || o.t === 'keg' || o.t === 'pjar') o.on = !!o.input;
    if (o.t === 'furnace' && o.deco) o.on = true;
    if (o.t === 'scarecrow') o.creepy = S.sanity < 40;
    if (o.t === 'well') o.hand = S.sanity < 30 && (this.frame >> 6) % 3 === 0;
    if (o.t === 'mailbox') o.flag = S.mail.length > 0;
    if (o.t === 'fence') { const l = World.cur.objAt(o.x - 1, o.y), r = World.cur.objAt(o.x + 1, o.y); o.l = !!(l && l.t === 'fence'); o.r = !!(r && r.t === 'fence'); }
    const c = o.t === 'campfire' ? objSprite({ t: 'bonfire' }, anim) : o.t === 'qsprinkler' ? objSprite({ t: 'sprinkler', tier: 2 }) : o.t === 'cookpot' ? objSprite({ t: 'pot' }) : o.t === 'pjar' ? objSprite({ t: 'jar' }) : objSprite(o, anim);
    if (!c) return;
    const fw = (o.w || 1) * 16, fh = (o.h || 1) * 16;
    const dx = o.x * 16 + Math.floor((fw - c.width) / 2), dy = o.y * 16 + fh - c.height;
    if (o.t === 'weed' || o.t === 'bush' || o.t === 'flower') {
      const sw = Math.sin(t * 2.2 + o.x * 1.3 + o.y) * (o.t === 'bush' ? .35 : .7);
      if (o.hitUntil > t) { g.drawImage(whiteOf(c), dx, dy); return; }
      g.drawImage(c, 0, 0, c.width, 8, dx + sw, dy, c.width, 8); g.drawImage(c, 0, 8, c.width, c.height - 8, dx + sw * .35, dy + 8, c.width, c.height - 8);
      return;
    }
    if (o.hitUntil > t) { g.drawImage(whiteOf(c), dx + (Math.random() - .5) * 2, dy); }
    else g.drawImage(c, dx, dy);
    if ((o.t === 'bonfire' || o.t === 'campfire' || o.t === 'torch') && Math.random() < .15) Parts.add(o.x * 16 + 8 + (Math.random() - .5) * 6, o.y * 16 + (o.t === 'torch' ? 2 : 4), (Math.random() - .5) * 8, -20 - Math.random() * 20, Math.random() < .5 ? '#ffb040' : '#ff6020', .7, 1, { g: -10, k: 'spark' });
    if (o.ready) { const b = Math.sin(t * 4) * 1.5; g.fillStyle = '#fff8e8'; g.beginPath(); g.arc(dx + c.width / 2, dy - 8 + b, 7.5, 0, 7); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = .8; g.stroke(); g.drawImage(itemIconCanvas(o.ready.id, o.ready.of), dx + c.width / 2 - 6, dy - 14 + b, 12, 12); }
  },
  addText(x, y, txt, col = '#fff', size = 1) { this.texts.push({ x, y, txt, col, t: 0, size, vx: (Math.random() - .5) * 10 }); },
  drawTexts(ctx, sx, sy) {
    const Z = this.Z;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i]; t.t += 1 / 60;
      if (t.t > 1.1) { this.texts.splice(i, 1); continue; }
      const pop = t.t < .12 ? 1 + (1 - t.t / .12) * .5 : 1;
      const x = (t.x - sx + t.vx * t.t) * Z, y = (t.y - sy - 18 * (1 - Math.pow(1 - Math.min(1, t.t * 1.4), 2))) * Z;
      ctx.font = `900 ${Math.round(6.2 * Z * t.size * pop)}px Nunito, system-ui, sans-serif`;
      ctx.globalAlpha = Math.min(1, (1.1 - t.t) * 3);
      ctx.lineJoin = 'round'; ctx.lineWidth = Z * 1.4; ctx.strokeStyle = 'rgba(20,8,6,.9)'; ctx.strokeText(t.txt, x, y); ctx.fillStyle = t.col; ctx.fillText(t.txt, x, y);
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- живой фон: бабочки, светлячки, листья, пыль ---------- */
const Ambient = {
  list: [], mapId: null,
  kinds(m) {
    const night = isNight(), out = [];
    if (m.outdoor) {
      if (!night && S.weather === 'sun' && (S.season === 0 || S.season === 1)) out.push(['butterfly', 4]);
      if (night && S.season !== 3 && S.weather !== 'rain') out.push(['firefly', m.id === 'forest' ? 18 : 10]);
      if (S.season === 2) out.push(['leaf', 12]);
      if (S.season === 0 && !night) out.push(['petal', 8]);
      if (m.id === 'forest' && S.season !== 3) out.push(['spore', 8]);
    } else if (m.theme === 'dungeon') {
      out.push([m.dtheme === 'flesh' ? 'ember' : m.dtheme === 'flooded' ? 'drip' : m.dtheme === 'library' ? 'ink' : 'mote', 14]);
    } else out.push(['mote', 10]);
    return out;
  },
  spawn(kind, sx, sy, VW, VH, anywhere) {
    const a = { kind, x: sx + Math.random() * VW, y: anywhere ? sy + Math.random() * VH : sy - 10, t: Math.random() * 10, vx: 0, vy: 0, r: Math.random() * 6, life: 8 + Math.random() * 8 };
    if (kind === 'butterfly') { a.col = U.pick(['#ffffff', '#f7e26b', '#f28cc0', '#9ad0ff', '#ffa040']); a.y = sy + Math.random() * VH; }
    if (kind === 'firefly' || kind === 'spore' || kind === 'mote' || kind === 'ember') a.y = sy + Math.random() * VH;
    if (kind === 'leaf') a.col = U.pick(['#d9772b', '#c8302a', '#e8a030', '#a0521e']);
    if (kind === 'petal') a.col = U.pick(['#f6b8d0', '#ffffff', '#f28cc0']);
    if (kind === 'drip') { a.y = sy + Math.random() * VH * .5; a.vy = 0; }
    this.list.push(a);
  },
  draw(g, m, sx, sy, VW, VH) {
    if (this.mapId !== m.id) { this.list = []; this.mapId = m.id; }
    const dt = 1 / 60, kinds = this.kinds(m), t = Render.t;
    for (const [k, n] of kinds) { const have = this.list.filter(a => a.kind === k).length; if (have < n && Math.random() < .08) this.spawn(k, sx, sy, VW, VH, have < n / 2); }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const a = this.list[i]; a.t += dt; a.life -= dt;
      if (!kinds.some(k => k[0] === a.kind) || a.life <= 0 || a.x < sx - 40 || a.x > sx + VW + 40 || a.y > sy + VH + 30 || a.y < sy - 60) { this.list.splice(i, 1); continue; }
      const fade = Math.min(1, a.life, a.t);
      switch (a.kind) {
        case 'butterfly': {
          a.vx += (Math.sin(a.t * .7 + a.r) * 18 - a.vx) * dt; a.vy += (Math.cos(a.t * 1.1 + a.r) * 12 - a.vy) * dt;
          a.x += a.vx * dt; a.y += a.vy * dt + Math.sin(a.t * 9) * .15;
          const w = Math.abs(Math.sin(a.t * 14)) * 2 + .4;
          g.globalAlpha = fade; g.fillStyle = a.col; g.fillRect(a.x - w, a.y - 1, w, 1.6); g.fillRect(a.x + .6, a.y - 1, w, 1.6); g.fillStyle = '#3a2a1a'; g.fillRect(a.x, a.y - 1, .6, 2);
          break;
        }
        case 'firefly': {
          a.x += Math.sin(a.t * .8 + a.r) * 6 * dt; a.y += Math.cos(a.t * .6 + a.r) * 5 * dt;
          a.glow = .5 + .5 * Math.sin(a.t * 2.5 + a.r * 3);
          g.globalAlpha = fade * a.glow; g.fillStyle = '#e8ff8a'; g.fillRect(a.x - .5, a.y - .5, 1, 1);
          break;
        }
        case 'leaf': case 'petal': {
          a.y += (a.kind === 'leaf' ? 10 : 7) * dt; a.x += (Math.sin(a.t * 1.6 + a.r) * 12 + 4) * dt; a.r += dt * 3;
          g.globalAlpha = fade; g.save(); g.translate(a.x, a.y); g.rotate(a.r); g.scale(1, Math.abs(Math.sin(a.t * 3)) + .2); g.fillStyle = a.col; g.fillRect(-1.2, -.6, 2.4, 1.2); g.restore();
          break;
        }
        case 'spore': case 'mote': {
          a.x += Math.sin(a.t * .5 + a.r) * 3 * dt; a.y += (Math.cos(a.t * .4 + a.r) * 2 - 1) * dt;
          g.globalAlpha = fade * (.35 + .25 * Math.sin(a.t * 2 + a.r)); g.fillStyle = a.kind === 'spore' ? '#e8ffd0' : '#fff6d8'; g.fillRect(a.x, a.y, .7, .7);
          break;
        }
        case 'ember': {
          a.y -= 9 * dt; a.x += Math.sin(a.t * 2 + a.r) * 6 * dt;
          g.globalAlpha = fade * (.5 + .5 * Math.sin(a.t * 6)); g.fillStyle = '#ff5030'; g.fillRect(a.x, a.y, .8, .8);
          break;
        }
        case 'drip': {
          a.vy += 160 * dt; a.y += a.vy * dt;
          g.globalAlpha = fade * .8; g.fillStyle = '#9ad0ff'; g.fillRect(a.x, a.y, .6, 1.6);
          if (a.vy > 120 && Math.random() < .05) { Parts.splash(a.x, a.y); a.life = 0; }
          break;
        }
        case 'ink': {
          a.y += 14 * dt; g.globalAlpha = fade; g.fillStyle = '#111'; g.fillRect(a.x, a.y, .8, 1.4);
          break;
        }
      }
    }
    g.globalAlpha = 1;
  },
  drawGlow(g, m) {
    g.globalCompositeOperation = 'lighter';
    for (const a of this.list) if (a.kind === 'firefly' || a.kind === 'ember') {
      const r = a.kind === 'firefly' ? 6 : 4, col = a.kind === 'firefly' ? '200,255,120' : '255,90,40';
      const gr = g.createRadialGradient(a.x, a.y, 0, a.x, a.y, r); gr.addColorStop(0, `rgba(${col},${.45 * (a.glow === undefined ? .8 : a.glow)})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(a.x, a.y, r, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
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
  drops: [], splashes: [],
  draw(g, sx, sy, VW, VH) {
    const w = S.weather; if (w === 'sun') return;
    const snow = S.season === 3 && (w === 'rain' || w === 'snow');
    const blood = S.sanity < 30 && !snow;
    const n = w === 'storm' ? 170 : 110;
    while (this.drops.length < n) this.drops.push({ x: Math.random() * VW, y: Math.random() * VH, s: .6 + Math.random() * .7, z: Math.random() });
    if (snow) {
      for (const d of this.drops) {
        d.y += .45 * d.s; d.x += Math.sin(Render.t * 1.3 + d.y * .05 + d.z * 6) * .35;
        g.fillStyle = `rgba(255,255,255,${.55 + d.z * .45})`; const r = .5 + d.z * .9; g.fillRect(sx + d.x, sy + d.y, r, r);
        if (d.y > VH) { d.y = -4; d.x = Math.random() * (VW + 40); } if (d.x < -4) d.x += VW; if (d.x > VW + 4) d.x -= VW;
      }
      return;
    }
    g.strokeStyle = blood ? 'rgba(200,20,40,.7)' : 'rgba(190,215,255,.5)'; g.lineWidth = .55;
    g.beginPath();
    for (const d of this.drops) {
      d.y += 5.5 * d.s; d.x -= 1.4 * d.s;
      g.moveTo(sx + d.x, sy + d.y); g.lineTo(sx + d.x + 1.1, sy + d.y - 4.5 * d.s);
      if (d.y > VH * (.5 + d.z * .5)) { if (Math.random() < .5) this.splashes.push({ x: sx + d.x, y: sy + d.y, t: 0 }); d.y = -6; d.x = Math.random() * (VW + 40); }
      if (d.x < -4) d.x += VW;
    }
    g.stroke();
    g.fillStyle = blood ? 'rgba(220,40,60,.6)' : 'rgba(210,230,255,.55)';
    for (let i = this.splashes.length - 1; i >= 0; i--) { const s2 = this.splashes[i]; s2.t += 1 / 60; if (s2.t > .2) { this.splashes.splice(i, 1); continue; } const r = s2.t * 12; g.fillRect(s2.x - r, s2.y, .6, .6); g.fillRect(s2.x + r, s2.y, .6, .6); g.fillRect(s2.x, s2.y - r * .6, .6, .6); }
    if (this.splashes.length > 80) this.splashes.splice(0, 40);
    if (w === 'storm' && Math.random() < .002) { Render.flash = .7; Render.flashCol = '#fff'; setTimeout(() => AU.sfx('thunder'), 300); }
  },
};
