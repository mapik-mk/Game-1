/* ============================================================
   Рыбалка: заброс, поклёвка, мини-игра с полосой
   ============================================================ */
const Fishing = {
  active: false, state: null, bob: null, t: 0, fish: null, mini: null,
  cast(power) {
    const m = World.cur; const [dx, dy] = DIRV[P.dir];
    const dist = 16 + power * 56;
    const bx = P.x + dx * dist, by = P.y - 6 + dy * dist;
    useEnergy(Math.max(1, 4 - skillLvl('fishing') * .25));
    AU.sfx('cast');
    const tx = Math.floor(bx / 16), ty = Math.floor(by / 16);
    if (!m.isWater(tx, ty) || m.groundAt(tx, ty) === G_.BLOOD) { UI.note(m.groundAt(tx, ty) === G_.BLOOD ? 'В крови рыба не водится. Наверное, к счастью.' : 'Нужно забросить в воду. Держи кнопку дольше — дальше заброс.', 'bad'); return; }
    let edge = 0; for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (m.isWater(tx + ex, ty + ey)) edge++;
    this.active = true; this.state = 'fly'; this.t = 0; this.bob = { sx: P.x + dx * 8, sy: P.y - 18, x: bx, y: by, deep: edge };
    this.waitT = U.rnd(1.2, 5.5) * (S.flags.lureBonus ? .7 : 1);
  },
  cancel() { this.active = false; this.state = null; this.mini = null; },
  update(dt) {
    if (!this.active) return;
    this.t += dt;
    if (this.state === 'fly') { if (this.t > .45) { this.state = 'wait'; this.t = 0; AU.sfx('splash'); } return; }
    if (this.state === 'wait') {
      if (Input.hit.use || Input.hit.act) { this.cancel(); AU.sfx('fail'); return; }
      if (this.t > this.waitT) { this.state = 'bite'; this.t = 0; AU.sfx('bite'); Render.addText(P.x, P.y - 40, '!', '#ffe040', 1.6); if (navigator.vibrate) try { navigator.vibrate(80); } catch (e) { } }
      return;
    }
    if (this.state === 'bite') {
      if (Input.hit.use || Input.hit.act) { this.hook(); return; }
      if (this.t > 1.0) { UI.note('Сорвалась...', 'bad'); AU.sfx('fail'); this.cancel(); }
      return;
    }
    if (this.state === 'mini') this.updateMini(dt);
    if (this.state === 'done') { if (this.t > .2) this.cancel(); }
  },
  pickFish() {
    const m = World.cur, zone = m.fishZone, t = hhmm(), lvl = skillLvl('fishing');
    if (zone === 'lake' && S.quests.active.includes('q_frog') && !S.flags.goldball && Math.random() < .15) return 'goldball';
    if (Math.random() < .12 - lvl * .006) return U.pick(['shoe', 'seaweed', 'seaweed', 'bottle', 'shoe']);
    const cands = [];
    for (const [id, f] of Object.entries(FISH)) {
      if (!f.loc.includes(zone)) continue;
      if (f.seasons && !f.seasons.includes(S.season)) continue;
      if (t < f.time[0] * 100 || t > f.time[1] * 100) continue;
      if (f.weather === 'rain' && S.weather !== 'rain' && S.weather !== 'storm') continue;
      if (f.minLvl && lvl < f.minLvl) continue;
      if (f.legend) { if (S.flags.legendCaught) continue; cands.push([3 + lvl, id]); continue; }
      cands.push([Math.max(4, 100 - f.diff) * (1 + this.bob.deep * .1), id]);
    }
    if (!cands.length) return 'carp';
    return U.wchoice(cands);
  },
  hook() {
    const id = this.pickFish();
    const it = ITEMS[id];
    if (it.type !== 'fish') {
      this.state = 'done'; this.t = 0;
      if (id === 'goldball') { S.flags.goldball = true; Inv.add('goldball', 1); UI.note('Выловлен Золотой мяч!', 'good'); AU.sfx('catch'); Quests.check(); return; }
      if (Inv.add(id, 1)) { UI.note(`Выловлено: ${it.n}`); AU.sfx('pickup'); } Skills.xp('fishing', 3);
      return;
    }
    const f = FISH[id];
    const lvl = skillLvl('fishing');
    this.fish = id;
    this.mini = { fy: .5, fv: 0, ftgt: .5, ft: 0, bar: .15, bv: 0, bsize: .2 + lvl * .014 + (S.tools.rod || 0) * .02, prog: .3, perfect: true, diff: f.diff, beh: f.beh };
    this.state = 'mini'; this.t = 0;
  },
  updateMini(dt) {
    const M = this.mini;
    // движение рыбы
    M.ft -= dt; const df = M.diff / 100;
    if (M.ft <= 0) {
      const jump = M.beh === 'dart' ? 1 : M.beh === 'smooth' ? .45 : .7;
      M.ftgt = U.clamp(M.fy + (Math.random() - .5) * jump * (.5 + df), 0, 1);
      if (M.beh === 'sinker') M.ftgt = U.clamp(M.ftgt + .15, 0, 1); if (M.beh === 'floater') M.ftgt = U.clamp(M.ftgt - .15, 0, 1);
      M.ft = (M.beh === 'dart' ? .35 : .8) * (1.4 - df) + Math.random() * .5;
    }
    const acc = (M.ftgt - M.fy) * (3 + df * 9);
    M.fv += acc * dt; M.fv *= M.beh === 'smooth' ? .94 : .9; M.fy = U.clamp(M.fy + M.fv * dt, 0, 1);
    // полоса игрока (вверх = 0)
    const hold = Input.down.use || Input.down.act || this.touchHold;
    M.bv += (hold ? -2.6 : 2.2) * dt; M.bv *= .985; M.bar += M.bv * dt;
    if (M.bar < 0) { M.bar = 0; M.bv = Math.max(0, M.bv) * -.3; } if (M.bar > 1 - M.bsize) { M.bar = 1 - M.bsize; M.bv = Math.min(0, M.bv) * -.3; }
    const inside = M.fy >= M.bar && M.fy <= M.bar + M.bsize;
    if (inside) { M.prog += dt * .28; if (Math.random() < dt * 8) AU.sfx('reel'); } else { M.prog -= dt * (.16 + df * .1); M.perfect = false; }
    if (M.prog >= 1) this.caught();
    else if (M.prog <= 0) { UI.note('Рыба ушла!', 'bad'); AU.sfx('fail'); this.cancel(); }
  },
  caught() {
    const id = this.fish, f = FISH[id], M = this.mini;
    const lvl = skillLvl('fishing');
    let q = 0; const r = Math.random(); if (M.perfect && r < .4 + lvl * .04) q = 2; else if (r < .2 + lvl * .04 + (M.perfect ? .3 : 0)) q = 1;
    if (Inv.add(id, 1, q)) { UI.note(`Поймано: ${f.n}${M.perfect ? ' — идеально!' : ''}`, 'good', false, id); } else Drops.spawn(World.cur, P.x, P.y - 8, id, 1, q);
    AU.sfx('catch');
    Skills.xp('fishing', Math.round(3 + f.diff / 2.5 * (M.perfect ? 1.4 : 1)));
    if (f.s) Sanity.add(f.s);
    S.stats.fish = (S.stats.fish || 0) + 1;
    Quests.event('fish', id);
    if (f.legend && !S.flags.legendCaught) { S.flags.legendCaught = true; setTimeout(() => Events.legendFish(), 400); }
    this.state = 'done'; this.t = 0; this.mini = null;
  },
  drawRod(g) {
    const b = this.bob; if (!b) return;
    const [dx] = DIRV[P.dir];
    const rx = P.x + dx * 10, ry = P.y - 26;
    let bx = b.x, by = b.y;
    if (this.state === 'fly') { const k = Math.min(1, this.t / .45); bx = U.lerp(rx, b.x, k); by = U.lerp(ry, b.y, k) - Math.sin(k * Math.PI) * 30; }
    else by += Math.sin(Render.t * 3) * 1 + (this.state === 'bite' ? Math.sin(Render.t * 40) * 2 : 0);
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = .7; g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo((rx + bx) / 2, Math.max(ry, by) + 8, bx, by); g.stroke();
    g.fillStyle = '#d02030'; g.fillRect(bx - 1, by - 2, 3, 2); g.fillStyle = '#fff'; g.fillRect(bx - 1, by, 3, 1);
  },
  drawUI(ctx) {
    if (!this.mini) return;
    const M = this.mini, c = Render.cv, Z = Render.Z;
    const H = Math.min(c.height * .55, 150 * Z), W = 22 * Z;
    const x = c.width * .5 + 30 * Z, y = (c.height - H) / 2;
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - 4 * Z, y - 4 * Z, W + 18 * Z, H + 8 * Z);
    ctx.fillStyle = '#2a4a6a'; ctx.fillRect(x, y, W, H);
    ctx.fillStyle = 'rgba(120,230,90,.85)'; ctx.fillRect(x + Z, y + M.bar * H, W - 2 * Z, M.bsize * H);
    const fc = itemIconCanvas(this.fish); ctx.imageSmoothingEnabled = false; ctx.drawImage(fc, x + W / 2 - 8 * Z, y + M.fy * H - 8 * Z, 16 * Z, 16 * Z);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x + W + 4 * Z, y, 8 * Z, H);
    ctx.fillStyle = M.prog > .66 ? '#4af04a' : M.prog > .33 ? '#f2c430' : '#e04040'; ctx.fillRect(x + W + 5 * Z, y + H * (1 - M.prog), 6 * Z, H * M.prog);
    ctx.font = `700 ${7 * Z}px 'Pixelify Sans', monospace`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('Держи, чтобы поднять', x + W / 2 + 4 * Z, y + H + 14 * Z);
  },
};
