/* ============================================================
   Сущности: NPC, монстры, снаряды, добыча, частицы, галлюцинации
   ============================================================ */
function hhmm() { const t = Math.floor(S.time); return Math.floor(t / 60) * 100 + (t % 60); }
function dayInfo() { return { dow: (S.absDay - 1) % 7, weather: S.weather, season: S.season, day: S.day }; }

const NPCRT = {
  where(id) {
    const def = NPCS[id]; if (!def || !def.sched) return null;
    const d = dayInfo(); let list = def.sched(d) || [];
    if (S.spouse === id) list = spouseSched(id, d, list);
    if (Fest.today() === 'eyes' && ['mayor', 'rosa', 'pierrot', 'klim', 'eva', 'lilith'].includes(id)) list = [[600, 'village', ...Fest.spot(id)]];
    const t = hhmm(); let cur = null;
    for (const e of list) if (e[0] <= t) cur = e;
    if (t < 600) { const late = list.filter(e => e[0] >= 2400 && e[0] - 2400 <= t + 0); if (late.length) cur = late[late.length - 1]; }
    return cur;
  },
  populate(m) {
    m.npcs = [];
    for (const id in NPCS) {
      const w = this.where(id);
      if (w && w[1] === m.id && w[2] >= 0) m.npcs.push(this.make(id, w[2], w[3], w[4], w));
    }
    if (m.npcSpots && m.npcSpots.grobus) m.npcs.push(this.make('grobus', m.npcSpots.grobus.x, m.npcSpots.grobus.y, 'down'));
    if (m.id === 'chapel' && !S.flags.chapelDone) for (let k = 0; k < 4; k++) m.npcs.push({ id: 'zhmur' + k, zh: k, def: { n: 'Жмуримо', noKill: true }, x: (3 + k * 2.6) * 16, y: (6 + (k % 2) * 3) * 16, dir: 'down', t: Math.random() * 5, deco: true });
  },
  make(id, tx, ty, dir, w) {
    const n = { id, def: NPCS[id], x: tx * 16 + 8, y: ty * 16 + 12, dir: dir || 'down', path: null, key: w ? w.join() : '', frame: 0, animT: 0, emote: null };
    const m = World.cur; if (m && m.solidAt(tx, ty)) { const p = nearestFree(m, tx, ty); if (p) { n.x = p.x * 16 + 8; n.y = p.y * 16 + 12; } }
    return n;
  },
  tick() {
    const m = World.cur; if (!m) return;
    for (let i = m.npcs.length - 1; i >= 0; i--) {
      const n = m.npcs[i]; if (n.deco || n.id === 'grobus' && m.theme === 'dungeon') continue;
      const w = this.where(n.id);
      if (!w || w[1] !== m.id || w[2] < 0) { n.leaving = 1; continue; }
      const key = w.join();
      if (key !== n.key) { n.key = key; n.path = bfs(m, Math.floor(n.x / 16), Math.floor((n.y - 4) / 16), w[2], w[3]); n.finalDir = w[4]; }
    }
    for (const id in NPCS) {
      if (m.npcs.some(n => n.id === id)) continue;
      const w = this.where(id);
      if (w && w[1] === m.id && w[2] >= 0) {
        const ent = m.entry || null;
        const n = ent ? this.make(id, ent.x, ent.y, 'up', w) : this.make(id, w[2], w[3], w[4], w);
        if (ent) n.path = bfs(m, ent.x, ent.y, w[2], w[3]), n.finalDir = w[4];
        n.fadeIn = 1; m.npcs.push(n);
      }
    }
  },
  update(dt) {
    const m = World.cur; if (!m) return;
    for (let i = m.npcs.length - 1; i >= 0; i--) {
      const n = m.npcs[i];
      if (n.deco) { n.t += dt; n.x += Math.sin(n.t * 1.3 + n.zh) * 6 * dt; n.y += Math.cos(n.t * 1.7 + n.zh) * 4 * dt; continue; }
      if (n.fadeIn) n.fadeIn = Math.max(0, n.fadeIn - dt * 2);
      if (n.leaving) { n.leaving -= dt * 1.5; if (n.leaving <= 0) m.npcs.splice(i, 1); continue; }
      if (n.talking) { n.talking -= dt; continue; }
      if (n.path && n.path.length) {
        const [tx, ty] = n.path[0]; const gx = tx * 16 + 8, gy = ty * 16 + 12;
        const dx = gx - n.x, dy = gy - n.y, d = Math.hypot(dx, dy), sp = 38 * dt;
        if (d <= sp) { n.x = gx; n.y = gy; n.path.shift(); }
        else { n.x += dx / d * sp; n.y += dy / d * sp; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); n.animT += dt * 6; }
        if (!n.path.length) { n.path = null; if (n.finalDir) n.dir = n.finalDir; n.animT = 0; }
      }
    }
  },
  inFront(m) {
    const [dx, dy] = DIRV[P.dir]; const fx = P.x + dx * 14, fy = P.y - 6 + dy * 14;
    let best = null, bd = 15;
    for (const n of m.npcs) { if (n.deco && !n.zh && n.zh !== 0) continue; const d = Math.hypot(n.x - fx, (n.y - 6) - fy); if (d < bd) { bd = d; best = n; } }
    // через прилавок
    if (!best) { const fx2 = P.x + dx * 30, fy2 = P.y - 6 + dy * 30; for (const n of m.npcs) { const d = Math.hypot(n.x - fx2, (n.y - 6) - fy2); if (d < 12) { const f = frontTile(); const o = m.objAt(f.tx, f.ty); if (o && o.t === 'counter') return null; best = n; } } }
    return best;
  },
  draw(g, n) {
    if (n.deco) { const c = monsterSprite('zhmur', Math.floor(Render.t * 4 + n.zh) % 2, String(n.zh % 5)); g.globalAlpha = .85; g.drawImage(c, Math.round(n.x - 6), Math.round(n.y - 14)); g.globalAlpha = 1; return; }
    const L = n.def.look; let dir = n.dir;
    const fr = n.path ? (Math.floor(n.animT) % 4 === 1 ? 1 : Math.floor(n.animT) % 4 === 3 ? 2 : 0) : 0;
    let c = drawChar(L, dir === 'right' ? 'left' : dir, fr);
    if (dir === 'right') c = spr(`flip:ch:${L.id}:${fr}`, () => flipH(drawChar(L, 'left', fr)));
    let a = 1; if (n.fadeIn) a = 1 - n.fadeIn; if (n.leaving) a = Math.max(0, n.leaving);
    const bob = n.def.ghost ? Math.sin(Render.t * 2) * 2 - 2 : 0;
    g.globalAlpha = a * (n.def.ghost ? .8 : 1);
    if (!n.def.ghost) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(n.x, n.y - 1, 6, 2.5, 0, 0, 7); g.fill(); }
    g.drawImage(c, Math.round(n.x - 8), Math.round(n.y - 31 + bob));
    if (S.sanity < 25 && !n.def.ghost && Math.floor(Render.t * 2 + n.x) % 9 === 0) g.drawImage(tint(c, '#000', .85), Math.round(n.x - 8), Math.round(n.y - 31));
    g.globalAlpha = 1;
    const r = S.rel[n.id];
    if (r && !r.talked && n.def.lines && !Game.locked()) { const b = Math.sin(Render.t * 4) * 1.5; g.fillStyle = '#fff'; g.fillRect(n.x - 3, n.y - 42 + b, 6, 6); g.fillStyle = '#c02030'; g.fillRect(n.x - 1, n.y - 41 + b, 2, 3); g.fillRect(n.x - 1, n.y - 37 + b, 2, 1); }
    if (n.emote) { g.font = '10px sans-serif'; g.fillStyle = '#fff'; g.fillText(n.emote, n.x - 4, n.y - 40); }
  },
};
function spouseSched(id, d, base) {
  if (id === 'ophelia') return [[600, 'farm', 35, 6, 'down'], [900, 'farm', -5, -5], [1900, 'farm', 35, 6, 'down']];
  const work = base.filter(e => e[0] >= 1000 && e[0] < 2200 && e[1] !== 'witch' || (e[1] === 'witch' && e[0] >= 1000 && e[0] < 2000));
  return [[600, 'house', 7, 4, 'down'], ...work, [2200, 'house', 8, 6, 'down']];
}
function nearestFree(m, x, y) {
  for (let r = 0; r < 6; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (Math.max(Math.abs(i), Math.abs(j)) === r && !m.solidAt(x + i, y + j)) return { x: x + i, y: y + j };
  return null;
}
function bfs(m, sx, sy, tx, ty, limit = 3000) {
  if (sx === tx && sy === ty) return [];
  const W = m.w, prev = new Int32Array(W * m.h).fill(-1), q = [sy * W + sx]; prev[q[0]] = q[0];
  let head = 0, found = false;
  while (head < q.length && head < limit) {
    const k = q[head++], x = k % W, y = (k / W) | 0;
    if (x === tx && y === ty) { found = true; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (!m.inb(nx, ny)) continue; const nk = ny * W + nx;
      if (prev[nk] >= 0) continue; if (m.solidAt(nx, ny) && !(nx === tx && ny === ty)) continue; if (m.warps[nx + ',' + ny] && !(nx === tx && ny === ty)) continue;
      prev[nk] = k; q.push(nk);
    }
  }
  if (!found) return [[tx, ty]];
  const path = []; let k = ty * W + tx; while (k !== sy * W + sx) { path.push([k % W, (k / W) | 0]); k = prev[k]; }
  return path.reverse();
}

/* ---------- монстры ---------- */
function spawnMonster(m, type, x, y, depth = 1) {
  const def = MON[type]; const sc = depth > 30 ? 1 + (depth - 30) * .08 : 1;
  const mo = { type, def, x, y, hp: def.hp * sc, maxHp: def.hp * sc, dmg: def.dmg * sc, vx: 0, vy: 0, t: Math.random() * 2, cd: 1 + Math.random() * 1.5, state: 'idle', frame: 0, hitT: 0, kbx: 0, kby: 0, w: def.w || 16, h: def.h || 16, z: 0 };
  m.mons.push(mo); return mo;
}
const Mon = {
  update(dt) {
    const m = World.cur;
    for (let i = m.mons.length - 1; i >= 0; i--) {
      const mo = m.mons[i];
      mo.t += dt; mo.hitT = Math.max(0, mo.hitT - dt); mo.cd -= dt;
      if (mo.kbx || mo.kby) { this.move(m, mo, mo.kbx * dt, mo.kby * dt); mo.kbx *= .82; mo.kby *= .82; if (Math.abs(mo.kbx) + Math.abs(mo.kby) < 4) mo.kbx = mo.kby = 0; }
      if (Game.locked()) continue;
      const dx = P.x - mo.x, dy = P.y - mo.y, d = Math.hypot(dx, dy) || 1;
      AI[mo.def.ai] && AI[mo.def.ai](m, mo, dt, dx, dy, d);
      // контактный урон
      if (mo.def.dmg > 0 && !mo.harmless && mo.z < 6 && Math.abs(dx) < mo.w / 2 + 3 && dy > -6 && dy < mo.h * .45 + 6) Player.hurt(mo.dmg, mo.def.sdmg || 0, mo.x, mo.y);
      else if (mo.def.sdmg && !mo.def.dmg && d < 12) Player.hurt(0, mo.def.sdmg, mo.x, mo.y);
    }
  },
  move(m, mo, dx, dy, ghost) {
    if (ghost) { mo.x += dx; mo.y += dy; return false; }
    return moveEnt(m, mo, dx, dy, Math.min(6, mo.w / 3), 4, false);
  },
  hit(m, mo, dmg, crit, kx, ky) {
    if (mo.def.halluc) { this.vanish(m, mo); return; }
    if (mo.invuln) { Render.addText(mo.x, mo.y - mo.h, 'НЕУЯЗВИМ', '#aaa', .7); return; }
    mo.hp -= dmg; mo.hitT = .15; AU.sfx('hit');
    const kb = mo.def.boss ? 30 : 140; mo.kbx = kx * kb; mo.kby = ky * kb;
    Render.addText(mo.x, mo.y - mo.h, String(Math.round(dmg)), crit ? '#ffe040' : '#fff', crit ? 1.3 : 1);
    Parts.burst(mo.x, mo.y - mo.h / 2, mo.def.spr === 'slime' ? '#5ac84a' : mo.def.spr === 'ink' || mo.def.spr === 'author' ? '#000' : '#b01020', 5);
    if (mo.hp <= 0) this.kill(m, mo);
  },
  vanish(m, mo) { const i = m.mons.indexOf(mo); if (i >= 0) m.mons.splice(i, 1); Parts.burst(mo.x, mo.y - 16, '#000', 14); AU.sfx('whisper'); },
  kill(m, mo) {
    const i = m.mons.indexOf(mo); if (i < 0) return; m.mons.splice(i, 1);
    AU.sfx('kill'); Parts.burst(mo.x, mo.y - mo.h / 2, '#fff', 10);
    const luck = S.flags.catSmile ? 1.3 : 1;
    for (const [id, ch] of mo.def.drops) if (Math.random() < ch * luck) Drops.spawn(m, mo.x, mo.y - 4, id, 1);
    if (mo.def.souls) { const s = Math.round(mo.def.souls * (1 + (m.depth || 0) / 40)); S.souls += s; Render.addText(mo.x, mo.y - mo.h - 6, '+' + s + ' душ', '#9adfff', .8); AU.sfx('souls'); }
    Skills.xp('combat', mo.def.xp); S.stats.kills = (S.stats.kills || 0) + 1;
    Quests.event('kill', mo.type);
    if (mo.def.boss) Game.bossDefeated(m, mo);
    if (m.depth && !m.ladderShown && (m.infested || U.chance(.06)) && m.mons.filter(x => !x.def.halluc).length === 0) Mining.showLadder(m, Math.floor(mo.x / 16), Math.floor((mo.y - 4) / 16));
  },
  draw(g, mo) {
    const def = mo.def; let fr = Math.floor(mo.t * (def.ai === 'fly' ? 8 : 3)) % 2;
    if (def.spr === 'eye') { const a = Math.atan2(P.y - mo.y, P.x - mo.x); fr = Math.abs(a) < Math.PI / 4 ? 1 : a > Math.PI * .75 || a < -Math.PI * .75 ? 3 : a > 0 ? 0 : 2; }
    let v = def.v || ''; if (def.spr === 'doll' && mo.moving) v = 'angry';
    let c = monsterSprite(def.spr, fr, v);
    const flip = (def.ai === 'chase' || def.ai === 'thrower' || def.spr === 'hatter' || def.spr === 'doll') && P.x < mo.x;
    if (flip) c = spr(`mflip:${def.spr}:${fr}:${v}`, () => flipH(monsterSprite(def.spr, fr, v)));
    if (!def.ai.includes('ghost') && def.ai !== 'fly' && def.ai !== 'shade') { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(mo.x, mo.y - 1, mo.w * .35, 3, 0, 0, 7); g.fill(); }
    if (mo.tele) { g.fillStyle = 'rgba(200,0,30,.35)'; g.beginPath(); g.ellipse(mo.tele.x, mo.tele.y, mo.tele.r, mo.tele.r * .55, 0, 0, 7); g.fill(); }
    const x = Math.round(mo.x - c.width / 2), y = Math.round(mo.y - c.height - mo.z + (def.ai === 'fly' ? Math.sin(mo.t * 6) * 2 - 6 : 0));
    g.globalAlpha = mo.alpha === undefined ? 1 : mo.alpha;
    g.drawImage(mo.hitT > 0 ? whiteOf(c) : c, x, y);
    g.globalAlpha = 1;
    if (!def.boss && mo.hp < mo.maxHp && !def.halluc) { g.fillStyle = '#000'; g.fillRect(mo.x - 7, y - 4, 14, 2); g.fillStyle = '#e03040'; g.fillRect(mo.x - 7, y - 4, 14 * mo.hp / mo.maxHp, 2); }
  },
};
/* ИИ */
const AI = {
  hop(m, mo, dt, dx, dy, d) {
    if (mo.state === 'jump') { mo.jt -= dt; this._mv(m, mo, mo.vx * dt, mo.vy * dt); mo.z = Math.sin((1 - mo.jt / .4) * Math.PI) * 6; if (mo.jt <= 0) { mo.state = 'idle'; mo.z = 0; mo.cd = .7 + Math.random() * .8; } return; }
    if (mo.cd <= 0 && d < 170) { mo.state = 'jump'; mo.jt = .4; const s = mo.def.spd * 2.4; mo.vx = dx / d * s; mo.vy = dy / d * s; }
    else if (mo.cd <= 0) { mo.cd = 1.5; mo.state = 'jump'; mo.jt = .4; const a = Math.random() * 7; mo.vx = Math.cos(a) * 30; mo.vy = Math.sin(a) * 30; }
  },
  _mv(m, mo, x, y) { Mon.move(m, mo, x, y); },
  fly(m, mo, dt, dx, dy, d) {
    if (d < 180) { const s = mo.def.spd; mo.vx += (dx / d * s - mo.vx) * dt * 2 + Math.sin(mo.t * 5) * 30 * dt; mo.vy += (dy / d * s - mo.vy) * dt * 2 + Math.cos(mo.t * 4) * 30 * dt; }
    else { mo.vx *= .95; mo.vy *= .95; }
    Mon.move(m, mo, mo.vx * dt, mo.vy * dt, mo.type === 'crow');
  },
  thrower(m, mo, dt, dx, dy, d) {
    if (d > 70 && d < 220) Mon.move(m, mo, dx / d * mo.def.spd * dt, dy / d * mo.def.spd * dt);
    else if (d <= 40) Mon.move(m, mo, dx / d * mo.def.spd * dt, dy / d * mo.def.spd * dt);
    if (mo.cd <= 0 && d < 150) { mo.cd = 2.2; Proj.fire(m, mo.x, mo.y - 12, dx / d * 110, dy / d * 110, 'bone', mo.dmg * .8, 0); }
  },
  ghost(m, mo, dt, dx, dy, d) { if (d < 220) Mon.move(m, mo, dx / d * mo.def.spd * dt, dy / d * mo.def.spd * dt + Math.sin(mo.t * 2) * 10 * dt, true); mo.alpha = .6 + Math.sin(mo.t * 3) * .25; },
  shooter(m, mo, dt, dx, dy, d) {
    const want = 80; const s = mo.def.spd * dt;
    if (d < 200) Mon.move(m, mo, (d > want ? 1 : -1) * dx / d * s, (d > want ? 1 : -1) * dy / d * s + Math.sin(mo.t * 3) * 8 * dt);
    if (mo.cd <= 0 && d < 170) { mo.cd = 2; Proj.fire(m, mo.x, mo.y - 8, dx / d * 95, dy / d * 95, 'tear', mo.dmg, 0); AU.sfx('shriek'); }
  },
  angel(m, mo, dt, dx, dy, d) {
    const [fx, fy] = DIRV[P.dir];
    const watched = (-dx * fx + -dy * fy) / d > .25 && d < 200;
    mo.moving = !watched && d < 220;
    if (mo.moving) Mon.move(m, mo, dx / d * mo.def.spd * dt, dy / d * mo.def.spd * dt);
    if (mo.moving && Math.random() < dt * .8) AU.sfx('step');
  },
  spore(m, mo, dt, dx, dy, d) {
    if (d < 90) Mon.move(m, mo, dx / d * mo.def.spd * dt, dy / d * mo.def.spd * dt);
    if (mo.cd <= 0 && d < 50) { mo.cd = 3; for (let k = 0; k < 8; k++) { const a = k / 8 * 7; Proj.fire(m, mo.x, mo.y - 6, Math.cos(a) * 40, Math.sin(a) * 40, 'spore', 3, 4, .9); } }
  },
  chase(m, mo, dt, dx, dy, d) { if (d < 240) Mon.move(m, mo, dx / d * mo.def.spd * dt, dy / d * mo.def.spd * dt); },
  shade(m, mo, dt, dx, dy, d) {
    mo.alpha = Math.min(.9, mo.t * .5);
    if (d < 34) { Sanity.add(-(mo.def.sdmg)); UI.note(U.pick(['Оно стояло слишком близко.', 'Ты почувствовал{|а} холодное дыхание.', 'Шёпот: «я дописываю тебя»']), 'bad'); Mon.vanish(m, mo); return; }
    if (mo.t > 7) Mon.vanish(m, mo);
  },
  kingslime(m, mo, dt, dx, dy, d) {
    if (!mo.awake) { mo.awake = true; mo.cd = 1.5; }
    if (mo.state === 'jump') {
      mo.jt -= dt; const k = 1 - mo.jt / .9; mo.x = U.lerp(mo.sx, mo.tele.x, k); mo.y = U.lerp(mo.sy, mo.tele.y, k); mo.z = Math.sin(k * Math.PI) * 40;
      mo.harmless = mo.z > 6;
      if (mo.jt <= 0) { mo.state = 'idle'; mo.z = 0; mo.harmless = false; Render.shake = 6; AU.sfx('bomb'); if (U.dist(P.x, P.y, mo.tele.x, mo.tele.y) < mo.tele.r) Player.hurt(mo.dmg * 1.4, 0, mo.x, mo.y); mo.tele = null; mo.cd = mo.hp < mo.maxHp / 2 ? .6 : 1.2; for (let k2 = 0; k2 < 12; k2++) Parts.add(mo.x, mo.y, (Math.random() - .5) * 140, -Math.random() * 60, '#5ac84a', .6, 2); }
      return;
    }
    if (mo.cd <= 0) { mo.state = 'jump'; mo.jt = .9; mo.sx = mo.x; mo.sy = mo.y; const tx = P.x + (Math.random() - .5) * 20, ty = P.y + (Math.random() - .5) * 20; mo.tele = { x: tx, y: ty, r: 30 }; }
    const th = Math.floor((1 - mo.hp / mo.maxHp) * 4); if (th > (mo.splits || 0)) { mo.splits = th; for (let k = 0; k < 3; k++) spawnMonster(m, 'slime_g', mo.x + (k - 1) * 20, mo.y + 10, 10); UI.note('Король Жиж делится!', 'bad'); }
  },
  hatter(m, mo, dt, dx, dy, d) {
    mo.alpha = mo.fade !== undefined ? mo.fade : 1;
    if (mo.state === 'tp') { mo.tt -= dt; mo.fade = Math.abs(mo.tt - .3) / .3; mo.harmless = true; if (mo.tt <= .3 && !mo.moved) { mo.moved = true; const p = m.randomFree((x, y) => U.dist(x * 16, y * 16, P.x, P.y) > 70 && U.dist(x * 16, y * 16, P.x, P.y) < 150); if (p) { mo.x = p.x * 16 + 8; mo.y = p.y * 16 + 12; } } if (mo.tt <= 0) { mo.state = 'idle'; mo.fade = 1; mo.harmless = false; mo.cd = .6; } return; }
    if (mo.state === 'dash') { mo.dt2 -= dt; Mon.move(m, mo, mo.vx * dt, mo.vy * dt); if (mo.dt2 <= 0) { mo.state = 'idle'; mo.cd = 1; } return; }
    if (mo.cd <= 0) {
      const rage = mo.hp < mo.maxHp / 2; const r = Math.random();
      if (r < .4) { const n = rage ? 12 : 8; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + mo.t; Proj.fire(m, mo.x, mo.y - 20, Math.cos(a) * 85, Math.sin(a) * 85, 'cup', mo.dmg * .7, 0); } AU.sfx('shriek'); mo.cd = rage ? .9 : 1.4; }
      else if (r < .7) { mo.state = 'tp'; mo.tt = .6; mo.moved = false; AU.sfx('magic'); }
      else { mo.state = 'dash'; mo.dt2 = .45; mo.vx = dx / d * 200; mo.vy = dy / d * 200; mo.cd = 1; AU.sfx('roll'); }
      if (rage && Math.random() < .15) { const p = m.randomFree(); if (p) spawnMonster(m, 'doll', p.x * 16 + 8, p.y * 16 + 12, 20); }
    } else if (d > 40) Mon.move(m, mo, dx / d * 30 * dt, dy / d * 30 * dt);
  },
  author(m, mo, dt, dx, dy, d) {
    const ph = mo.hp > mo.maxHp * .66 ? 1 : mo.hp > mo.maxHp * .33 ? 2 : 3;
    if (ph !== mo.phase) { mo.phase = ph; Events.authorPhase(ph); mo.cd = 2; }
    mo.z = 6 + Math.sin(mo.t * 2) * 3; mo.harmless = true;
    const tx = 17 * 16 + Math.cos(mo.t * .4) * 70, ty = 9 * 16 + Math.sin(mo.t * .55) * 30; mo.x += (tx - mo.x) * dt * .8; mo.y += (ty - mo.y) * dt * .8;
    if (mo.cd > 0) return;
    if (ph === 1 || Math.random() < .35) { const n = 14; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + mo.t * 1.7; Proj.fire(m, mo.x, mo.y - 24, Math.cos(a) * 70, Math.sin(a) * 70, 'page', mo.dmg * .6, 1); } mo.cd = ph === 1 ? 1.6 : 1.2; AU.sfx('glitch'); }
    else if (ph === 2 || Math.random() < .5) { for (let k = 0; k < 2; k++) { const p = m.randomFree((x, y) => U.dist(x * 16, y * 16, P.x, P.y) > 50); if (p) spawnMonster(m, 'ink', p.x * 16 + 8, p.y * 16 + 12, 30); } mo.cd = 2.6; AU.sfx('whisper'); }
    else { for (let k = 0; k < 3; k++) { const horiz = Math.random() < .5; const yy = P.y + (Math.random() - .5) * 60, xx = P.x + (Math.random() - .5) * 60; m.projs.push({ kind: 'word', x: horiz ? 17 * 16 : xx, y: horiz ? yy : 11 * 16, w: horiz ? 300 : 26, h: horiz ? 22 : 220, t: 0, life: 1.6, dmg: mo.dmg, from: 'mon', word: U.pick(['УМРИ', 'ЗАБУДЬ', 'ОСТАНЬСЯ', 'ПЕРЕПИШИ', 'МОЙ']) }); } mo.cd = 2.2; AU.sfx('shriek'); }
  },
};

/* ---------- снаряды ---------- */
const Proj = {
  fire(m, x, y, vx, vy, kind, dmg, sdmg = 0, life = 3) {
    m.projs.push({ x, y, vx, vy, kind, dmg, sdmg, life, from: kind === 'wave' ? 'player' : 'mon', glow: kind === 'wave' ? 'blue' : kind === 'tear' ? 'blue' : kind === 'page' ? null : null });
  },
  update(dt) {
    const m = World.cur;
    for (let i = m.projs.length - 1; i >= 0; i--) {
      const p = m.projs[i]; p.life -= dt;
      if (p.kind === 'word') { p.t += dt; if (p.t > 1 && !p.boom) { p.boom = true; Render.shake = 5; AU.sfx('bomb'); if (Math.abs(P.x - p.x) < p.w / 2 && Math.abs(P.y - 6 - p.y) < p.h / 2) Player.hurt(p.dmg, 4, p.x, p.y); } if (p.life <= 0) m.projs.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const tx = Math.floor(p.x / 16), ty = Math.floor(p.y / 16);
      const solidG = SOLID_GROUND.has(m.groundAt(tx, ty)) && !WATERY.has(m.groundAt(tx, ty));
      if (p.life <= 0 || (solidG && p.kind !== 'page')) { m.projs.splice(i, 1); continue; }
      if (p.from === 'mon') { if (Math.abs(P.x - p.x) < 6 && Math.abs(P.y - 8 - p.y) < 9) { Player.hurt(p.dmg, p.sdmg, p.x, p.y); m.projs.splice(i, 1); } }
      else for (const mo of m.mons) { if (Math.abs(mo.x - p.x) < mo.w / 2 + 2 && Math.abs(mo.y - mo.h / 2 - p.y) < mo.h / 2 + 2 && !(p.hitSet && p.hitSet.has(mo))) { (p.hitSet = p.hitSet || new Set()).add(mo); Mon.hit(m, mo, p.dmg, false, Math.sign(p.vx) * .5, Math.sign(p.vy) * .5); } }
    }
  },
  draw(g, p) {
    if (p.kind === 'word') {
      const k = Math.min(1, p.t); g.fillStyle = p.boom ? `rgba(0,0,0,${Math.max(0, p.life)})` : `rgba(200,0,30,${.15 + k * .25})`;
      g.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
      g.save(); g.fillStyle = p.boom ? '#fff' : '#900'; g.font = 'bold 14px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.word, p.x, p.y); g.restore(); return;
    }
    const x = Math.round(p.x), y = Math.round(p.y);
    switch (p.kind) {
      case 'bone': g.save(); g.translate(x, y); g.rotate(Render.t * 12); g.fillStyle = '#efe8dc'; g.fillRect(-4, -1, 8, 2); g.fillRect(-5, -2, 2, 4); g.fillRect(3, -2, 2, 4); g.restore(); break;
      case 'tear': g.fillStyle = '#9ad0ff'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 1, y - 2, 1, 1); break;
      case 'cup': g.fillStyle = '#f8f8f8'; g.fillRect(x - 3, y - 2, 6, 5); g.fillStyle = '#c87a3a'; g.fillRect(x - 2, y - 2, 4, 1); g.fillStyle = '#f8f8f8'; g.fillRect(x + 3, y - 1, 1, 2); break;
      case 'page': g.save(); g.translate(x, y); g.rotate(Render.t * 6); g.fillStyle = '#f2efe6'; g.fillRect(-4, -5, 8, 10); g.fillStyle = '#333'; g.fillRect(-3, -3, 6, 1); g.fillRect(-3, -1, 6, 1); g.fillRect(-3, 1, 4, 1); g.restore(); break;
      case 'spore': g.fillStyle = 'rgba(200,120,220,.6)'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); break;
      case 'wave': g.save(); g.translate(x, y); g.rotate(Math.atan2(p.vy, p.vx)); g.fillStyle = 'rgba(160,220,255,.85)'; g.beginPath(); g.ellipse(0, 0, 4, 9, 0, -Math.PI / 2, Math.PI / 2); g.fill(); g.restore(); break;
    }
  },
};

/* ---------- добыча ---------- */
const Drops = {
  spawn(m, x, y, id, n = 1, q = 0, of) {
    for (let k = 0; k < (ITEMS[id] && ITEMS[id].type === 'res' ? 1 : n); k++) {
      const a = Math.random() * 7, s = 30 + Math.random() * 40;
      m.drops.push({ x, y, id, n: ITEMS[id] && ITEMS[id].type === 'res' ? n : 1, q, of, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .5, z: 0, vz: 70 + Math.random() * 40, t: 0 });
    }
  },
  update(dt) {
    const m = World.cur;
    for (let i = m.drops.length - 1; i >= 0; i--) {
      const d = m.drops[i]; d.t += dt;
      if (d.z > 0 || d.vz > 0) { d.vz -= 260 * dt; d.z = Math.max(0, d.z + d.vz * dt); moveEnt(m, d, d.vx * dt, d.vy * dt, 2, 2, false); if (d.z === 0) { d.vz = d.vz < -40 ? -d.vz * .35 : 0; d.vx *= .6; d.vy *= .6; } }
      if (d.t < .45) continue;
      const dist = Math.hypot(P.x - d.x, P.y - 6 - d.y);
      if (dist < 48 && !d.full) { d.x += (P.x - d.x) / dist * 140 * dt; d.y += (P.y - 6 - d.y) / dist * 140 * dt; }
      if (dist < 8) { if (Inv.add(d.id, d.n, d.q, d.of)) { m.drops.splice(i, 1); AU.sfx('pickup'); } else { d.full = true; if (!Drops.warned) { Drops.warned = true; UI.note('Инвентарь полон!', 'bad'); setTimeout(() => Drops.warned = false, 4000); } } }
      else if (dist > 60) d.full = false;
    }
  },
  draw(g, d) {
    const c = itemIconCanvas(d.id, d.of);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(d.x - 4, d.y - 1, 8, 2);
    g.drawImage(c, Math.round(d.x - 6), Math.round(d.y - 12 - d.z + Math.sin(d.t * 4) * (d.z ? 0 : 1)), 12, 12);
  },
};
/* ---------- частицы ---------- */
const Parts = {
  add(x, y, vx, vy, col, life = .5, size = 1) { const m = World.cur; if (m && m.parts.length < 300) m.parts.push({ x, y, vx, vy, col, life, max: life, size }); },
  burst(x, y, col, n = 6) { for (let k = 0; k < n; k++) { const a = Math.random() * 7, s = 20 + Math.random() * 50; this.add(x, y, Math.cos(a) * s, Math.sin(a) * s - 20, col, .4 + Math.random() * .3, Math.random() < .3 ? 2 : 1); } },
  update(dt) { const m = World.cur; for (let i = m.parts.length - 1; i >= 0; i--) { const p = m.parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; if (p.life <= 0) m.parts.splice(i, 1); } },
  draw(g) { const m = World.cur; for (const p of m.parts) { g.globalAlpha = Math.min(1, p.life / p.max * 1.5); g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); } g.globalAlpha = 1; },
};

/* ---------- бой ---------- */
const Combat = {
  playerSwing(itemId) {
    const m = World.cur, it = ITEMS[itemId], w = it.w;
    const [fx, fy] = DIRV[P.dir]; const cx = P.x, cy = P.y - 10;
    let any = false;
    for (const mo of m.mons.slice()) {
      const mx = mo.x, my = mo.y - mo.h / 2 + mo.z * 0;
      const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy);
      const reach = 24 + mo.w / 2;
      if (d > reach) continue;
      if (d > 8 && (dx * fx + dy * fy) / d < -.1) continue;
      if (mo.z > 14) continue;
      let dmg = U.rnd(w.min, w.max) * (1 + skillLvl('combat') * .03 + (S.lvl.str || 0) * .06) * buffMul('atk');
      const crit = Math.random() < (w.crit || .03); if (crit) dmg *= itemId === 'broken' ? 3.2 : 2.4;
      Mon.hit(m, mo, Math.round(dmg), crit, fx || dx / (d || 1), fy || dy / (d || 1)); any = true;
      if (w.leech) { S.hp = Math.min(S.maxHp, S.hp + dmg * w.leech); }
    }
    if (w.wave && S.energy > 0) { Proj.fire(m, P.x + fx * 8, P.y - 10 + fy * 8, fx * 170, fy * 170, 'wave', Math.round((w.min + w.max) / 2 * .6), 0, .6); }
    if (any) Render.shake = 2;
    // режем траву / ломаем ящики
    const f = frontTile();
    for (const [x, y] of [[f.tx, f.ty], [f.tx + (fy ? 1 : 0), f.ty + (fx ? 1 : 0)], [f.tx - (fy ? 1 : 0), f.ty - (fx ? 1 : 0)]]) {
      const o = m.objAt(x, y);
      if (o && o.t === 'weed') Tools.cutWeed(m, o);
      else if (o && o.t === 'crate') Mining.breakCrate(m, o);
      if (it.cut && m.soil) { const s = m.soilAt(x, y); if (s && s.crop && cropStage(s) === 4 && !s.dead && s.crop !== 'blackseed') Farm.harvest(m, x, y); }
    }
  },
};

/* ---------- шахта ---------- */
const Mining = {
  breakRock(m, o) {
    m.remove(o); AU.sfx('rockbreak'); Parts.burst(o.x * 16 + 8, o.y * 16 + 8, '#9a9590', 10);
    const x = o.x * 16 + 8, y = o.y * 16 + 8, lv = skillLvl('mining');
    const extra = () => U.chance(lv * .04) ? 1 : 0;
    switch (o.kind) {
      case 'stone': Drops.spawn(m, x, y, 'stone', U.ri(1, 2) + extra()); if (m.depth) { if (U.chance(.05)) Drops.spawn(m, x, y, 'coal', 1); if (U.chance(.025)) Drops.spawn(m, x, y, 'geode', 1); if (U.chance(.02)) Drops.spawn(m, x, y, 'clay', 1); } Skills.xp('mining', 1); break;
      case 'copper': Drops.spawn(m, x, y, 'copper_ore', U.ri(1, 3) + extra()); Skills.xp('mining', 5); break;
      case 'iron': Drops.spawn(m, x, y, 'iron_ore', U.ri(1, 3) + extra()); Skills.xp('mining', 10); break;
      case 'gold': Drops.spawn(m, x, y, 'gold_ore', U.ri(1, 3) + extra()); Skills.xp('mining', 18); break;
      case 'coal': Drops.spawn(m, x, y, 'coal', U.ri(1, 2) + extra()); Skills.xp('mining', 5); break;
      case 'geode': Drops.spawn(m, x, y, 'geode', 1); Skills.xp('mining', 8); break;
      case 'gem': { const d = m.depth || 1; const g = U.wchoice(d <= 10 ? [[5, 'amethyst'], [5, 'topaz'], [3, 'quartz']] : d <= 20 ? [[4, 'amethyst'], [4, 'topaz'], [3, 'emerald'], [2, 'ruby'], [2, 'quartz']] : [[3, 'emerald'], [3, 'ruby'], [2, 'diamond'], [2, 'soulgem']]); Drops.spawn(m, x, y, g, 1); Skills.xp('mining', 15); break; }
      case 'mystic': Drops.spawn(m, x, y, U.pick(['diamond', 'soulgem', 'nightcrystal']), 1); Drops.spawn(m, x, y, 'gold_ore', 3); Skills.xp('mining', 40); break;
    }
    Quests.event('mine', o.kind);
    if (m.depth && !m.ladderShown && !m.infested && !m.boss) {
      m.rocksLeft = Math.max(1, (m.rocksLeft || 1) - 1);
      const p = .022 + 1 / (m.rocksLeft + 3) * .9;
      if (U.chance(p)) this.showLadder(m, o.x, o.y);
    }
  },
  showLadder(m, x, y) { if (m.ladderShown) return; m.ladderShown = true; if (m.objAt(x, y)) { const p = nearestFree(m, x, y); if (!p) return; x = p.x; y = p.y; } m.put(x, y, { t: 'ladder', walk: true }); UI.note('Найдена лестница вниз!', 'good'); AU.sfx('pickup'); },
  breakCrate(m, o) {
    m.remove(o); AU.sfx('chop'); Parts.burst(o.x * 16 + 8, o.y * 16 + 8, '#9a6a3a', 8);
    const x = o.x * 16 + 8, y = o.y * 16 + 8; const r = Math.random();
    if (r < .3) Drops.spawn(m, x, y, 'coal', 1); else if (r < .5) Drops.spawn(m, x, y, 'wood', U.ri(2, 5)); else if (r < .6) Drops.spawn(m, x, y, U.pick(['salad', 'beer', 'medkit', 'jojacola']), 1); else if (r < .7) Drops.spawn(m, x, y, U.pick(['copper_ore', 'iron_ore']), U.ri(1, 3));
    else if (r < .75) Drops.spawn(m, x, y, 'bomb', 1);
    if (m.depth && !m.ladderShown && U.chance(.05)) this.showLadder(m, o.x, o.y);
  },
};

/* ---------- галлюцинации ---------- */
const Halluc = {
  t: 0, overlay: null,
  update(dt) {
    const s = S.sanity / S.maxSanity; this.t += dt;
    if (this.overlay) { this.overlay.t -= dt; if (this.overlay.t <= 0) this.overlay = null; }
    if (s > .5 || Game.locked()) return;
    const k = (0.5 - s) * 2; // 0..1
    if (Math.random() < dt * .02 * (1 + k * 3)) UI.note(U.pick(WHISPERS), 'bad', true);
    if (Math.random() < dt * .006 * k) AU.sfx('whisper');
    if (s < .2 && Math.random() < dt * .012) this.overlay = { t: 1.2, txt: U.pick(['Я ПИШУ ТЕБЯ', 'ГЛАВА ' + (S.absDay + 6), 'НЕ ОБОРАЧИВАЙСЯ', 'ТЫ ВЕДЬ НЕ НАСТОЯЩ' + (S.gender === 'f' ? 'АЯ' : 'ИЙ'), 'М.С.']) };
    if (s < .2 && Math.random() < dt * .02) AU.sfx('heartbeat');
    const m = World.cur;
    if (s < .35 && m.outdoor && isNight() && Math.random() < dt * .03 && m.mons.filter(x => x.def.halluc).length < 2) {
      const a = Math.random() * 7, r = 90; const x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r * .7;
      if (!m.solidAt(Math.floor(x / 16), Math.floor(y / 16))) spawnMonster(m, 'shade', x, y);
    }
  },
  drawUI(ctx) {
    if (!this.overlay) return;
    const c = Render.cv; ctx.save(); ctx.globalAlpha = Math.min(.55, this.overlay.t);
    ctx.font = `${Math.round(c.width / 12)}px 'Rubik Wet Paint', serif`; ctx.fillStyle = '#c0102a'; ctx.textAlign = 'center';
    ctx.fillText(this.overlay.txt, c.width / 2 + (Math.random() - .5) * 6, c.height / 2); ctx.restore();
  },
};
const WHISPERS = ['...ты слышишь?', 'кто-то стоит за тобой', 'не смотри в колодец', 'она пишет', 'ты уже был{|а} здесь', 'вчера было сегодня', 'пастернак смотрит', '...дед не умер', 'ЗАЧЕМ ТЫ ПРИЕХАЛ{|А}', 'это не твоя ферма', 'ла-ла-лалала', 'проверь сундук деда', 'убей их', 'нет. не убивай.', 'М.С. следит', 'Да / Нет / Убить'];
