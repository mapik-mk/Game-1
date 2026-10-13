/* ============================================================
   Игрок: движение, инструменты, бой, взаимодействие
   ============================================================ */
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const P = { x: 0, y: 0, dir: 'down', frame: 0, animT: 0, moving: false, act: null, charging: null, roll: 0, rollCd: 0, rdx: 0, rdy: 0, inv: 0, hurtT: 0, kbx: 0, kby: 0, stepT: 0 };

function boxHits(m, x, y, hw, hh) {
  const x0 = Math.floor((x - hw) / 16), x1 = Math.floor((x + hw - .01) / 16), y0 = Math.floor((y - hh) / 16), y1 = Math.floor((y - .01) / 16);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (m.solidAt(tx, ty)) return true;
  return false;
}
function moveEnt(m, e, dx, dy, hw = 4, hh = 5, nudge = true) {
  let bx = false, by = false;
  if (dx) { if (!boxHits(m, e.x + dx, e.y, hw, hh)) e.x += dx; else { bx = true; if (nudge && !dy) { for (const o of [3, -3, 6, -6]) if (!boxHits(m, e.x + dx, e.y + o, hw, hh) && !boxHits(m, e.x, e.y + Math.sign(o), hw, hh)) { e.y += Math.sign(o) * Math.min(1, Math.abs(dx) + .5); break; } } } }
  if (dy) { if (!boxHits(m, e.x, e.y + dy, hw, hh)) e.y += dy; else { by = true; if (nudge && !dx) { for (const o of [3, -3, 6, -6]) if (!boxHits(m, e.x + o, e.y + dy, hw, hh) && !boxHits(m, e.x + Math.sign(o), e.y, hw, hh)) { e.x += Math.sign(o) * Math.min(1, Math.abs(dy) + .5); break; } } } }
  return bx || by;
}
function playerLook() { return Object.assign({ id: 'player' }, S.look, { fem: S.gender === 'f' }); }
function selStack() { return S.inv[S.sel] || null; }
function frontTile(dist = 13) { const [dx, dy] = DIRV[P.dir]; return { tx: Math.floor((P.x + dx * dist) / 16), ty: Math.floor((P.y - 5 + dy * dist) / 16) }; }
function playerTile() { return { tx: Math.floor(P.x / 16), ty: Math.floor((P.y - 3) / 16) }; }
function skillLvl(k) { let l = 0; const xp = S.skills[k] || 0; while (l < 10 && xp >= XP_TABLE[l + 1]) l++; return l; }
function toolCost(kind) {
  const sk = { hoe: 'farming', can: 'farming', axe: 'foraging', pick: 'mining', rod: 'fishing' }[kind];
  return Math.max(.6, 2 - skillLvl(sk) * .12);
}
function useEnergy(n) {
  S.energy -= n;
  if (S.energy <= 0 && !S.flags.exhaustWarned) { S.flags.exhaustWarned = true; UI.note(T('Ты {вымотан|вымотана}. Иди спать.'), 'bad'); }
  if (S.energy < -15) { S.energy = -15; Game.passOut('exhaust'); }
}
function buffMul(k) { let v = 1; for (const b of S.buffs) if (b[k]) v *= b[k]; return v; }

const Player = {
  update(dt) {
    const m = World.cur; if (!m) return;
    P.inv = Math.max(0, P.inv - dt); P.hurtT = Math.max(0, P.hurtT - dt); P.rollCd = Math.max(0, P.rollCd - dt);
    if (P.show) { P.show.t += dt; if (P.show.t > 1.6) P.show = null; }
    // отброс
    if (P.kbx || P.kby) { moveEnt(m, P, P.kbx * dt, P.kby * dt); P.kbx *= .85; P.kby *= .85; if (Math.abs(P.kbx) + Math.abs(P.kby) < 5) P.kbx = P.kby = 0; }
    if (Game.locked() || Fishing.active) { P.moving = false; P.charging = null; return; }
    // действие
    if (P.act) { this.updateAct(dt); return; }
    // кувырок
    if (P.roll > 0) {
      P.roll -= dt; moveEnt(m, P, P.rdx * 190 * dt, P.rdy * 190 * dt); P.animT += dt * 3;
      if (P.roll <= 0) P.rollCd = .25; this.checkWarp(m); return;
    }
    // зарядка инструмента
    if (P.charging) {
      P.charging.t += dt; P.moving = false;
      if (!Input.down.use) { const c = P.charging; P.charging = null; this.releaseCharge(c); }
      return;
    }
    const a = Input.axis();
    if (Input.hit.roll && P.rollCd <= 0 && S.energy > 0) {
      let rx = a.x, ry = a.y; if (!rx && !ry) [rx, ry] = DIRV[P.dir];
      const l = Math.hypot(rx, ry); P.rdx = rx / l; P.rdy = ry / l; P.roll = .3; P.inv = Math.max(P.inv, .34); useEnergy(3); AU.sfx('roll'); return;
    }
    let spd = (S.energy <= 0 ? 46 : 72) * buffMul('spd');
    if (a.x || a.y) {
      P.moving = true;
      if (Math.abs(a.x) > Math.abs(a.y) * 1.05) P.dir = a.x > 0 ? 'right' : 'left'; else P.dir = a.y > 0 ? 'down' : 'up';
      moveEnt(m, P, a.x * spd * dt, a.y * spd * dt);
      P.animT += dt * (spd / 72) * 8.5;
      const stp = Math.floor(P.animT) % 4;
      if (stp !== P.lastStep) { P.lastStep = stp; if (stp === 0 || stp === 2) { AU.sfx('step'); if (m.outdoor || m.theme === 'dungeon') Parts.dust(P.x, P.y, 1); } }
    } else { P.moving = false; P.animT = 0; }
    // слоты
    for (let i = 0; i < 12; i++) if (Input.hit['s' + i]) this.select(i);
    if (Input.hit.next) this.select((S.sel + 1) % 12); if (Input.hit.prev) this.select((S.sel + 11) % 12);
    if (Input.hit.act) this.interact();
    else if (Input.hit.use || (Input.down.use && this.autoRepeat())) this.useItem();
    this.checkWarp(m);
    this.pickups(m);
  },
  autoRepeat() { const s = selStack(); return s && ITEMS[s.id] && ITEMS[s.id].type === 'weapon'; },
  select(i) { if (S.sel !== i) { S.sel = i; AU.sfx('select'); UI.toolbar(); } },
  checkWarp(m) {
    const t = playerTile(); const w = m.warps[t.tx + ',' + t.ty];
    if (w && !Game.warping) {
      if (m.id === 'farm' && w.to === 'house' && false) return;
      World.warp(w.to, w.tx, w.ty, w.dir);
    }
  },
  pickups(m) {
    const t = playerTile(); const o = m.objAt(t.tx, t.ty);
    if (o && o.t === 'forage') { if (Inv.add(o.item, 1, o.q || 0)) { m.remove(o); AU.sfx('pickup'); Skills.xp('foraging', 7); if (U.chance(skillLvl('foraging') * .03)) Inv.add(o.item, 1, 0); Quests.event('forage', o.item); } }
    if (o && o.t === 'bloodstain') { m.remove(o); if (S.blood) { S.souls += S.blood.souls; UI.note(`Души возвращены: +${S.blood.souls}`, 'good'); AU.sfx('souls'); S.blood = null; } }
    if (o && o.t === 'eye') { m.remove(o); S.flags.festEyes = (S.flags.festEyes || 0) + 1; AU.sfx('pickup'); UI.note(`Глаз найден! (${S.flags.festEyes})`); }
  },
  /* ---------- использование предмета ---------- */
  useItem() {
    const m = World.cur, st = selStack();
    const n = NPCRT.inFront(m);
    if (!st) { if (n) this.interact(); return; }
    const it = ITEMS[st.id]; if (!it) return;
    if (n && it.type !== 'tool' && it.type !== 'weapon' && it.type !== 'estus') { Social.gift(n, st); return; }
    const f = frontTile(), o = m.objAt(f.tx, f.ty);
    if (o && Machines.tryInsert(m, o, st)) return;
    switch (it.type) {
      case 'tool': {
        if (S.energy <= -15) return;
        const tier = S.tools[it.tool] || 0;
        if (it.tool === 'rod') { if (m.mons.some(mo => !mo.def.halluc && U.dist(mo.x, mo.y, P.x, P.y) < 60)) { UI.note('Слишком опасно рыбачить!', 'bad'); return; } P.charging = { item: st, t: 0, rod: true }; return; }
        if ((it.tool === 'hoe' || it.tool === 'can') && tier > 0) { P.charging = { item: st, t: 0, tier }; return; }
        P.act = { kind: 'tool', tool: it.tool, t: 0, dur: .32, level: 0 }; return;
      }
      case 'weapon': { const w = it.w; P.act = { kind: 'swing', t: 0, dur: .3 / (w.spd || 1), item: st.id, done: false }; AU.sfx('swing'); return; }
      case 'seed': return Farm.plant(m, f.tx, f.ty, st);
      case 'fert': return Farm.fertilize(m, f.tx, f.ty, st);
      case 'place': return Farm.place(m, f.tx, f.ty, st);
      case 'food': return Items.eatPrompt(st);
      case 'estus': return Items.drinkEstus();
      case 'use': return Items.useSpecial(st);
      case 'note': return Events.readBottle(st);
      default: UI.note(T(it.n + ' — ' + (it.d || '')).slice(0, 90)); return;
    }
  },
  releaseCharge(c) {
    if (c.rod) { Fishing.cast(Math.min(1, c.t / 1.0)); return; }
    const lvl = Math.min(c.tier, Math.floor(c.t / .45));
    P.act = { kind: 'tool', tool: ITEMS[c.item.id].tool, t: 0, dur: .32, level: lvl };
  },
  updateAct(dt) {
    const a = P.act; a.t += dt;
    if (a.kind === 'tool' && !a.done && a.t >= a.dur * .6) { a.done = true; Tools.apply(a.tool, a.level); }
    if (a.kind === 'swing' && !a.done && a.t >= a.dur * .35) { a.done = true; Combat.playerSwing(a.item); }
    if (a.t >= a.dur) P.act = null;
  },
  /* ---------- взаимодействие ---------- */
  interact() {
    const m = World.cur;
    const n = NPCRT.inFront(m);
    if (n) { Social.talk(n); return; }
    const f = frontTile();
    const o = m.objAt(f.tx, f.ty);
    if (o && Interact.obj(m, o)) return;
    if (m.soil) { const s = m.soilAt(f.tx, f.ty); if (s && s.crop && Farm.harvest(m, f.tx, f.ty)) return; }
    const pt = playerTile(); const o2 = m.objAt(pt.tx, pt.ty); if (o2 && Interact.obj(m, o2)) return;
    // ближние клетки (удобно на телефоне)
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const oo = m.objAt(pt.tx + dx, pt.ty + dy); if (oo && ['ladder', 'ladderUp', 'bonfire', 'bed', 'chest', 'mailbox', 'bin', 'altar', 'board', 'well', 'counter'].includes(oo.t) && Interact.obj(m, oo)) return; }
    if (m.soil) for (const [dx, dy] of [[0, 0], [0, 1], [1, 0], [-1, 0], [0, -1]]) { const s = m.soilAt(pt.tx + dx, pt.ty + dy); if (s && s.crop && cropStage(s) === 4 && !s.dead && Farm.harvest(m, pt.tx + dx, pt.ty + dy)) return; }
  },
  /* ---------- урон ---------- */
  hurt(dmg, sdmg, fromX, fromY) {
    if (P.inv > 0 || Game.locked() || Game.dead) return;
    const red = 1 - Math.min(.5, (S.lvl.vig || 0) * .01);
    dmg = Math.max(1, Math.round(dmg * red));
    S.hp -= dmg; P.inv = 1; P.hurtT = .3; Render.shake = 4; AU.sfx('hurt');
    Render.addText(P.x, P.y - 28, '-' + dmg, '#ff5060');
    if (sdmg) { Sanity.add(-sdmg); Render.addText(P.x + 8, P.y - 20, '-' + sdmg + ' рас.', '#c080ff', .8); }
    const d = Math.hypot(P.x - fromX, P.y - fromY) || 1; P.kbx = (P.x - fromX) / d * 160; P.kby = (P.y - fromY) / d * 160;
    if (Fishing.active) Fishing.cancel();
    P.charging = null;
    if (S.hp <= 0) { S.hp = 0; Game.die(); }
  },
  /* ---------- рисование ---------- */
  pose() {
    const t = Render.t, a = P.act;
    const pose = { step: P.moving ? Math.floor(P.animT) % 4 : 0, br: !P.moving && !a && Math.sin(t * 2.4) > .55 ? 1 : 0, bl: (t % 3.9) < .13 ? 1 : 0 };
    if (a) {
      const k = a.t / a.dur;
      if (a.kind === 'tool') pose.arm = a.tool === 'can' ? 'fwd' : (k < .5 ? 'up' : 'fwd');
      else if (a.kind === 'swing') pose.arm = 'fwd';
      else if (a.kind === 'eat') pose.arm = 'fwd';
      pose.step = 0; pose.br = 0;
    }
    if (P.charging) { pose.arm = P.charging.rod ? 'up' : 'up'; pose.step = 0; pose.br = 0; }
    if (Fishing.active) { pose.arm = 'fwd'; pose.step = 0; }
    if (P.show) { pose.arm = 'hold'; pose.step = 0; pose.br = 0; }
    return pose;
  },
  draw(g) {
    const L = playerLook();
    const pose = this.pose();
    const c = charSprite(L, P.dir, pose);
    const x = P.x - 8, y = P.y - 32;
    // тень
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(P.x, P.y - 1, 6.5 - (pose.step % 2) * .6, 2.6, 0, 0, 7); g.fill();
    if (P.inv > 0 && P.roll <= 0 && Math.floor(P.inv * 15) % 2) return;
    if (P.roll > 0) {
      const k = 1 - P.roll / .3;
      g.save(); g.translate(P.x, P.y - 10); g.rotate((P.rdx >= 0 ? 1 : -1) * k * Math.PI * 2); g.scale(1, .85); g.drawImage(c, -8, -18, 16, 32); g.restore();
      return;
    }
    const a = P.act;
    const behind = a && (P.dir === 'up' || (a.kind === 'tool' && a.t / a.dur < .5 && P.dir === 'down'));
    if (behind) this.drawTool(g, a);
    g.drawImage(c, x, y);
    if (P.hurtT > 0) g.drawImage(tint(c, '#ff2030', .65), x, y);
    if (a && !behind) this.drawTool(g, a);
    if (P.charging && !P.charging.rod) { const ic = itemIconCanvas(P.charging.item.id); g.save(); g.translate(P.x, P.y - 30); g.rotate(-.6 + Math.sin(Render.t * 18) * .05); g.drawImage(ic, -2, -14, 16, 16); g.restore(); }
    if (Fishing.active) Fishing.drawRod(g);
    if (P.show) { const b = Math.min(1, P.show.t * 4); g.drawImage(itemIconCanvas(P.show.id, P.show.of), P.x - 8, P.y - 46 - b * 4, 16, 16); }
    if (P.charging && !P.charging.rod) { const lv = Math.min(P.charging.tier, Math.floor(P.charging.t / .45)); g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(P.x - 10, P.y - 42, 20, 4); g.fillStyle = ['#bbb', '#e07a3a', '#d8dee6', '#f2c430'][lv]; g.fillRect(P.x - 9, P.y - 41, 18 * Math.min(1, P.charging.t / (.45 * Math.max(1, P.charging.tier))), 2); }
  },
  drawTool(g, a) {
    const id = a.kind === 'swing' ? a.item : ({ hoe: 'hoe', can: 'can', axe: 'axe', pick: 'pick' })[a.tool];
    if (!id) return;
    const ic = itemIconCanvas(id);
    const k = U.clamp(a.t / a.dur, 0, 1);
    const D = Math.PI / 180;
    g.save();
    if (a.kind === 'swing') {
      const base = { right: 0, down: 90, left: 180, up: -90 }[P.dir] * D;
      const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // плавный разгон
      const ang = base - 1.35 + e * 2.7;
      g.translate(P.x, P.y - 13); g.rotate(ang + Math.PI / 4);
      g.drawImage(ic, 1, -17, 17, 17);
      g.restore();
      if (k > .15 && k < .85) {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(255,255,255,${.35 - i * .1})`; g.lineWidth = 2.5 - i * .7; g.beginPath(); g.arc(P.x, P.y - 13, 19 - i * 2.5, base - 1.3, base - 1.3 + e * 2.6); g.stroke(); }
        g.restore();
      }
      return;
    }
    // инструмент: замах над головой → удар перед собой
    const sideL = P.dir === 'left', sideR = P.dir === 'right';
    let from, to, hx = P.x, hy = P.y - 18;
    if (a.tool === 'can') { from = to = sideL ? 200 : sideR ? -20 : P.dir === 'down' ? 60 : -100; hy = P.y - 14; if (sideL) hx -= 5; if (sideR) hx += 5; }
    else if (sideL) { from = -80; to = -200; hx -= 2; }
    else if (sideR) { from = -100; to = 20; hx += 2; }
    else if (P.dir === 'down') { from = -95; to = 75; hy = P.y - 20; }
    else { from = 95; to = -80; hy = P.y - 22; }
    const e = k < .5 ? (k / .5) * .25 : .25 + (1 - Math.pow(1 - (k - .5) / .5, 3)) * .75;
    const th = (from + (to - from) * e) * D;
    g.translate(hx, hy); g.rotate(th + Math.PI / 4);
    if (a.tool === 'can') { g.rotate(Math.sin(k * Math.PI) * .5); }
    g.drawImage(ic, -3, -15, 17, 17);
    g.restore();
  },
  drawUI(ctx, sx, sy) {
    if (P.charging && P.charging.rod) {
      const Z = Render.Z, x = (P.x - sx + 12) * Z, y = (P.y - sy - 40) * Z, h = 30 * Z, k = Math.min(1, P.charging.t / 1.0);
      ctx.fillStyle = '#2a1a0a'; ctx.fillRect(x, y, 5 * Z, h); ctx.fillStyle = k > .9 ? '#4af04a' : '#f2c430'; ctx.fillRect(x + Z, y + h - (h - 2 * Z) * k - Z, 3 * Z, (h - 2 * Z) * k);
    }
    // подсказка цели (рамка клетки)
    if (!Game.locked() && World.cur && Settings.cursor) {
      const st = selStack(); if (!st) return; const it = ITEMS[st.id]; if (!it || it.type === 'weapon') return;
      const f = frontTile(), Z = Render.Z; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Z * .6; ctx.strokeRect((f.tx * 16 - sx) * Z, (f.ty * 16 - sy) * Z, 16 * Z, 16 * Z);
    }
  },
};

/* ---------- инструменты ---------- */
const Tools = {
  tilesFor(level) {
    const f = frontTile(); const [dx, dy] = DIRV[P.dir]; const out = [];
    if (level >= 3) { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) out.push([f.tx + dx + i, f.ty + dy + j]); return out; }
    const n = [1, 3, 5][level] || 1;
    for (let k = 0; k < n; k++) out.push([f.tx + dx * k, f.ty + dy * k]);
    return out;
  },
  apply(tool, level) {
    const m = World.cur; const f = frontTile();
    const tier = S.tools[tool] || 0;
    if (tool === 'hoe') {
      const tiles = this.tilesFor(level); let did = 0;
      for (const [x, y] of tiles) did += Farm.till(m, x, y) ? 1 : 0;
      useEnergy(toolCost('hoe') * Math.max(1, level + 1)); AU.sfx('hoe');
      if (!did) this.hitObj(m, f.tx, f.ty, 'hoe', tier);
      return;
    }
    if (tool === 'can') {
      if (m.isWater(f.tx, f.ty) || (m.objAt(f.tx, f.ty) && m.objAt(f.tx, f.ty).t === 'well')) { S.water = [40, 55, 70, 85][tier]; AU.sfx('water'); UI.note('Лейка наполнена'); UI.toolbar(); return; }
      if (S.water <= 0) { UI.note('Лейка пуста. Набери воды у пруда.', 'bad'); AU.sfx('error'); return; }
      const tiles = this.tilesFor(level);
      for (const [x, y] of tiles) { if (S.water <= 0) break; const s = m.soilAt(x, y); if (s) { if (!s.water) { s.water = true; } S.water--; Parts.splash(x * 16 + 8, y * 16 + 9); } }
      useEnergy(toolCost('can') * Math.max(1, level + 1)); AU.sfx('water'); UI.toolbar(); return;
    }
    if (tool === 'axe' || tool === 'pick') { useEnergy(toolCost(tool)); this.hitObj(m, f.tx, f.ty, tool, tier); return; }
  },
  hitObj(m, x, y, tool, tier) {
    const o = m.objAt(x, y);
    if (!o) {
      if (tool === 'pick' && m.soil) { const s = m.soilAt(x, y); if (s && !s.crop) { m.soil[y * m.w + x] = null; AU.sfx('pick'); return; } if (s && s.dead) { m.soil[y * m.w + x] = null; return; } }
      if (tool === 'pick') AU.sfx('pick'); else AU.sfx('chop'); return;
    }
    const dmg = 1 + tier;
    o.hitUntil = Render.t + .15;
    switch (o.t) {
      case 'tree':
        if (tool !== 'axe') { AU.sfx('pick'); return; }
        if (o.fixed) { AU.sfx('chop'); o.shakeUntil = Render.t + .3; UI.note('Это дерево слишком старое и упрямое.'); return; }
        o.hp = (o.hp || 10) - dmg; o.shakeUntil = Render.t + .3; AU.sfx('chop'); Skills.xp('foraging', 1);
        for (let k = 0; k < 3; k++) Parts.add(x * 16 + 8, y * 16 + 4, (Math.random() - .5) * 60, -Math.random() * 40, '#7a5230', .6);
        if (o.hp <= 0) {
          AU.sfx('treefall'); m.remove(o);
          Drops.spawn(m, x * 16 + 8, y * 16 + 8, 'wood', U.ri(8, 14));
          if (U.chance(.15)) Drops.spawn(m, x * 16 + 8, y * 16 + 8, 'hardwood', 1);
          Skills.xp('foraging', 12);
          if (o.kind !== 'dead' && U.chance(.3) && S.sanity < 40) { UI.note('Дерево застонало, падая.', 'bad'); Sanity.add(-2); }
          const st = m.put(x, y, { t: 'stump', hp: 4, regrow: o.regrow, kind: o.kind });
          if (o.regrow) st.regrowDay = S.absDay + 4;
        }
        return;
      case 'stump':
        if (tool !== 'axe') { AU.sfx('pick'); return; }
        o.hp -= dmg; AU.sfx('chop'); if (o.hp <= 0) { m.remove(o); Drops.spawn(m, x * 16 + 8, y * 16 + 8, 'wood', U.ri(2, 4)); Skills.xp('foraging', 3); if (o.regrow) Spawner.regrowLater(m, x, y, o.kind); }
        return;
      case 'bigstump':
        if (tool !== 'axe') { AU.sfx('pick'); return; }
        if (tier < 1) { AU.sfx('chop'); UI.note('Нужен медный топор или лучше.', 'bad'); return; }
        o.hp -= dmg; AU.sfx('chop'); if (o.hp <= 0) { m.remove(o); Drops.spawn(m, x * 16 + 16, y * 16 + 16, 'hardwood', U.ri(2, 3)); Skills.xp('foraging', 25); if (o.regrow) o.gone = S.absDay; }
        return;
      case 'twig': m.remove(o); AU.sfx('chop'); Drops.spawn(m, x * 16 + 8, y * 16 + 8, 'wood', U.ri(1, 2)); return;
      case 'weed': this.cutWeed(m, o); return;
      case 'rock':
        if (tool !== 'pick') { AU.sfx('pick'); return; }
        o.hp -= dmg; AU.sfx('pick'); Parts.burst(x * 16 + 8, y * 16 + 8, '#8a8580', 4); Parts.sparks(x * 16 + 8, y * 16 + 6, '#ffe8a0', 4);
        if (o.hp <= 0) Mining.breakRock(m, o);
        return;
      case 'crate': if (tool === 'pick' || tool === 'axe') Mining.breakCrate(m, o); return;
      case 'grave': if (tool === 'hoe') Events.digGrave(o); return;
      default:
        if (tool === 'pick' && Farm.pickupPlaced(m, o)) return;
        AU.sfx(tool === 'pick' ? 'pick' : 'chop');
    }
  },
  cutWeed(m, o) {
    m.remove(o); AU.sfx('chop'); Parts.burst(o.x * 16 + 8, o.y * 16 + 8, '#5a9a3a', 6);
    if (U.chance(.6)) Drops.spawn(m, o.x * 16 + 8, o.y * 16 + 8, 'fiber', 1);
    if (U.chance(.03)) { const seeds = SEED_SHOP[S.season]; if (seeds.length) Drops.spawn(m, o.x * 16 + 8, o.y * 16 + 8, U.pick(seeds), 1); }
    Quests.event('clear');
  },
};
