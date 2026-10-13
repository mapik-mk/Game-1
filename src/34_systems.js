/* ============================================================
   Системы: инвентарь, еда, ферма, машины, навыки, рассудок, спавн
   ============================================================ */
const QMUL = [1, 1.25, 1.5];
function itemPrice(st) {
  const it = ITEMS[st.id]; if (!it) return 0;
  let base = it.p || 0;
  if (it.artisan && st.of && ITEMS[st.of]) { const b = ITEMS[st.of].p; base = st.id === 'wine' ? b * 3 : st.id === 'juice' ? Math.round(b * 2.25) : b * 2 + 50; }
  return Math.round(base * QMUL[st.q || 0]);
}
function itemName(st) {
  const it = ITEMS[st.id]; if (!it) return '???';
  if (it.artisan && st.of && ITEMS[st.of]) { const src = ITEMS[st.of].n; return { wine: 'Вино: ', juice: 'Сок: ', jam: 'Джем: ', pickles: 'Соленья: ' }[st.id] + src.toLowerCase(); }
  if (it.type === 'tool') return TIER_NAMES[S.tools[it.tool] || 0] + ' ' + it.n.toLowerCase();
  return it.n;
}
function itemCat(id) { const it = ITEMS[id]; return it ? (it.cat || it.type) : null; }

const Inv = {
  stackable(id) { const t = ITEMS[id] && ITEMS[id].type; return !['tool', 'weapon', 'estus'].includes(t); },
  add(id, n = 1, q = 0, of = undefined, silent = false) {
    if (!ITEMS[id]) return false;
    q = q || 0; of = of || undefined;
    if (this.stackable(id)) for (let i = 0; i < S.invSize; i++) { const s = S.inv[i]; if (s && s.id === id && (s.q || 0) === q && s.of === of) { s.n += n; this.after(id, n, q, of, silent); return true; } }
    for (let i = 0; i < S.invSize; i++) if (!S.inv[i]) { S.inv[i] = { id, n, q }; if (of) S.inv[i].of = of; this.after(id, n, q, of, silent); return true; }
    return false;
  },
  after(id, n, q, of, silent) { if (!silent) UI.pickNote(id, n, q, of); UI.toolbar(); Quests.check(); S.seen = S.seen || {}; S.seen[id] = 1; },
  canAdd(id, q = 0, of = undefined) {
    if (this.stackable(id)) for (let i = 0; i < S.invSize; i++) { const s = S.inv[i]; if (s && s.id === id && (s.q || 0) === (q || 0) && s.of === of) return true; }
    for (let i = 0; i < S.invSize; i++) if (!S.inv[i]) return true;
    return false;
  },
  // гарантированно выдать: если рюкзак полон — бросить на землю рядом
  give(id, n = 1, q = 0, of = undefined) {
    if (this.add(id, n, q, of)) return true;
    const m = World.cur; if (m) { Drops.spawn(m, P.x, P.y - 6, id, n, q, of); for (const d of m.drops.slice(-n)) d.t = -1.5; }
    UI.note(`Рюкзак полон — «${ITEMS[id].n}» на земле рядом.`, 'bad');
    return false;
  },
  free() { let c = 0; for (let i = 0; i < S.invSize; i++) if (!S.inv[i]) c++; return c; },
  count(id) {
    let c = 0;
    if (id.startsWith('any:')) { const cat = id.slice(4); for (let i = 0; i < S.invSize; i++) { const s = S.inv[i]; if (s && itemCat(s.id) === cat) c += s.n; } return c; }
    for (let i = 0; i < S.invSize; i++) { const s = S.inv[i]; if (s && s.id === id) c += s.n; } return c;
  },
  has(id, n = 1) { return this.count(id) >= n; },
  remove(id, n = 1) {
    const anyCat = id.startsWith('any:') ? id.slice(4) : null;
    for (const pass of [0, 1, 2]) for (let i = 0; i < S.invSize && n > 0; i++) {
      const s = S.inv[i]; if (!s) continue;
      if (anyCat ? itemCat(s.id) !== anyCat : s.id !== id) continue;
      if ((s.q || 0) !== pass) continue;
      const k = Math.min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) S.inv[i] = null;
    }
    UI.toolbar(); return n <= 0;
  },
  takeAt(i, n = 1) { const s = S.inv[i]; if (!s) return; s.n -= n; if (s.n <= 0) S.inv[i] = null; UI.toolbar(); },
};

/* ---------- еда, эстус, особые предметы ---------- */
const Items = {
  async eatPrompt(st) {
    const it = ITEMS[st.id];
    const parts = []; const mul = 1 + (st.q || 0) * .4;
    if (it.e) parts.push((it.e > 0 ? '+' : '') + Math.round(it.e * mul) + ' эн.'); if (it.h) parts.push((it.h > 0 ? '+' : '') + Math.round(it.h * mul) + ' HP'); if (it.s) parts.push((it.s > 0 ? '+' : '') + it.s + ' рас.');
    const c = await UI.choose(`${it.drink ? 'Выпить' : 'Съесть'} «${itemName(st)}»? ${parts.join(', ')}`, ['Да', 'Нет']);
    if (c !== 0) return;
    this.eat(st);
  },
  eat(st) {
    const it = ITEMS[st.id]; const mul = 1 + (st.q || 0) * .4;
    if (it.e) S.energy = Math.min(S.maxEnergy, S.energy + it.e * mul);
    if (it.h) S.hp = U.clamp(S.hp + it.h * mul, 1, S.maxHp);
    if (it.s) Sanity.add(it.s);
    if (it.buff) { S.buffs = S.buffs.filter(b => !(it.buff.spd && b.spd) && !(it.buff.atk && b.atk)); S.buffs.push(Object.assign({ until: S.absDay * 1440 + S.time + it.buff.min, name: it.n }, it.buff)); UI.note(it.buff.spd ? 'Скорость повышена!' : 'Сила повышена!', 'good'); }
    AU.sfx(it.drink ? 'drink' : 'eat');
    const i = S.inv.indexOf(st); if (i >= 0) Inv.takeAt(i, 1);
    if (st.id === 'amanita') { UI.note('Грибочки шепчут тебе секреты...', 'bad'); Render.flash = .4; Render.flashCol = '#a040ff'; }
    if (st.id === 'mandrake') { AU.sfx('scream'); UI.note('Мандрагора кричит изнутри тебя.', 'bad'); }
    Quests.event('eat', st.id);
  },
  drinkEstus() {
    if (S.estus <= 0) { UI.note('Фляга пуста. Отдохни у костра или поспи.', 'bad'); AU.sfx('error'); return; }
    if (S.hp >= S.maxHp) { UI.note('Здоровье и так полное.'); return; }
    S.estus--; S.hp = Math.min(S.maxHp, S.hp + Math.round(S.maxHp * .45)); AU.sfx('drink'); Parts.burst(P.x, P.y - 16, '#ff8a20', 10);
    P.act = { kind: 'eat', t: 0, dur: .5 }; UI.toolbar();
  },
  useSpecial(st) {
    const i = S.inv.indexOf(st);
    switch (st.id) {
      case 'drinkme': S.maxEnergy += 20; S.energy += 20; Inv.takeAt(i); AU.sfx('magic'); UI.note('Ты чувствуешь себя... больше. Макс. энергия +20', 'good'); break;
      case 'eatme': S.maxHp += 15; S.hp += 15; Inv.takeAt(i); AU.sfx('magic'); UI.note('Ты вырос{|ла}? Макс. здоровье +15', 'good'); break;
      case 'estus_shard': if (S.estusMax >= 8) { UI.note('Фляга больше не растёт.'); return; } S.estusMax++; S.estus = S.estusMax; Inv.takeAt(i); AU.sfx('bonfire'); UI.note(`Фляга Эстуса: ${S.estusMax} зарядов`, 'good'); break;
      case 'returnpot': Inv.takeAt(i); AU.sfx('magic'); World.warp('farm', 8, 7, 'down'); break;
      case 'bomb': {
        const f = frontTile(); const m = World.cur;
        if (m.solidAt(f.tx, f.ty) && !(m.objAt(f.tx, f.ty) && m.objAt(f.tx, f.ty).t === 'rock')) { UI.note('Некуда положить.'); return; }
        Inv.takeAt(i); AU.sfx('fuse'); Game.bombs.push({ m, x: f.tx * 16 + 8, y: f.ty * 16 + 8, t: 2 }); break;
      }
    }
  },
  explode(b) {
    const m = b.m; if (m !== World.cur) return;
    AU.sfx('bomb'); Render.shake = 8; Render.flash = .3; Render.flashCol = '#ffb040';
    for (let k = 0; k < 30; k++) Parts.add(b.x, b.y, (Math.random() - .5) * 200, (Math.random() - .5) * 200, U.pick(['#ff8020', '#ffe060', '#555']), .6, 2);
    const tx = Math.floor(b.x / 16), ty = Math.floor(b.y / 16);
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      if (i * i + j * j > 5) continue; const o = m.objAt(tx + i, ty + j); if (!o) continue;
      if (o.t === 'rock') Mining.breakRock(m, o); else if (o.t === 'crate') Mining.breakCrate(m, o); else if (o.t === 'weed') Tools.cutWeed(m, o); else if (o.t === 'twig') m.remove(o);
    }
    for (const mo of m.mons.slice()) if (U.dist(mo.x, mo.y, b.x, b.y) < 40) Mon.hit(m, mo, 60 + (m.depth || 0) * 2, false, (mo.x - b.x) / 40, (mo.y - b.y) / 40);
    if (U.dist(P.x, P.y, b.x, b.y) < 36) Player.hurt(25, 0, b.x, b.y);
  },
};

/* ---------- ферма ---------- */
const Farm = {
  till(m, x, y) {
    const o = m.objAt(x, y);
    if (o && o.t === 'artifact') { m.remove(o); this.digArtifact(m, x, y); return true; }
    if (!m.farmable) return false;
    if (o || m.solidAt(x, y) || m.warps[x + ',' + y]) return false;
    const g = m.groundAt(x, y); if (![G_.GRASS, G_.DIRT, G_.DGRASS].includes(g)) return false;
    if (m.soilAt(x, y)) return false;
    if (m.id === 'farm' && (y < 8 && x > 3 && x < 37 && g === G_.DIRT)) { /* дорожку тоже можно */ }
    m.soil[y * m.w + x] = { crop: null, age: 0, water: m.outdoor && (S.weather === 'rain' || S.weather === 'storm'), fert: 0 };
    Parts.burst(x * 16 + 8, y * 16 + 10, '#6a4428', 4);
    return true;
  },
  digArtifact(m, x, y) {
    AU.sfx('hoe');
    const loot = U.wchoice([[20, 'clay'], [15, 'stone'], [10, 'bone'], [8, 'geode'], [8, 'bottle'], [6, 'coal'], [5, 'copper_ore'], [4, 'quartz'], [3, 'stoneeye'], [3, 'mirrorshard'], [2, 'amethyst'], [S.flags.shorts ? 0 : 0, 'shorts']]);
    Drops.spawn(m, x * 16 + 8, y * 16 + 8, loot, 1, 0, loot === 'bottle' ? 'r' + U.ri(0, 99) : undefined);
    Skills.xp('foraging', 5);
  },
  plant(m, x, y, st) {
    const s = m.soilAt(x, y);
    if (!s) { UI.note('Сначала вскопай землю мотыгой.'); return; }
    if (s.crop) return;
    const C = CROPS[ITEMS[st.id].crop];
    if (!m.greenhouse && !C.seasons.includes(S.season)) { UI.note(`Это семена не для этого сезона (${C.seasons.map(i => SEASONS[i]).join(', ')}).`, 'bad'); AU.sfx('error'); return; }
    s.crop = ITEMS[st.id].crop; s.age = 0; s.dead = false;
    Inv.takeAt(S.inv.indexOf(st), 1); AU.sfx('plant');
    if (s.crop === 'blackseed') Events.blackSeedPlanted(m);
    Quests.event('plant', s.crop);
  },
  fertilize(m, x, y, st) {
    const s = m.soilAt(x, y); if (!s) { UI.note('Удобрение кладут на вскопанную землю.'); return; }
    if (s.fert) { UI.note('Здесь уже есть удобрение.'); return; }
    const it = ITEMS[st.id]; if (it.fert < 3 && s.crop && s.age > 0) { UI.note('Удобрять качество нужно до посадки или сразу после.'); return; }
    s.fert = it.fert; Inv.takeAt(S.inv.indexOf(st), 1); AU.sfx('plant');
  },
  place(m, x, y, st) {
    const it = ITEMS[st.id];
    const ok = m.id === 'farm' || m.id === 'greenhouse' || m.id === 'house' || (it.place === 'torch' && m.outdoor) || (it.place === 'campfire' && m.outdoor);
    if (!ok) { UI.note('Здесь это ставить нельзя. Только на своей ферме.'); AU.sfx('error'); return; }
    if (m.solidAt(x, y) || m.objAt(x, y) || m.warps[x + ',' + y] || m.isWater(x, y)) { UI.note('Место занято.'); AU.sfx('error'); return; }
    const s = m.soilAt(x, y); if (s && s.crop) { UI.note('Тут растёт урожай.'); return; }
    if (s) m.soil[y * m.w + x] = null;
    const o = { t: it.place };
    if (it.place === 'chest') o.items = [];
    if (it.place === 'sprinkler') o.tier = 1; if (it.place === 'qsprinkler') o.tier = 2;
    m.put(x, y, o); Inv.takeAt(S.inv.indexOf(st), 1); AU.sfx('plant');
    if (it.place === 'scarecrow' && !S.flags.scarecrowNote) { S.flags.scarecrowNote = 1; setTimeout(() => UI.note('Пугало повернулось к тебе. Показалось.', 'bad'), 1500); }
  },
  pickupPlaced(m, o) {
    const back = { chest: 'chest', fence: 'fence', torch: 'torch', scarecrow: 'scarecrow', sprinkler: 'sprinkler', qsprinkler: 'qsprinkler', furnace: 'furnace', keg: 'keg', pjar: 'pjar', cookpot: 'cookpot', campfire: 'campfire' }[o.t];
    if (!back || o.deco) return false;
    if (o.t === 'chest' && o.items && o.items.some(Boolean)) { UI.note('Сначала опустоши сундук.'); return true; }
    if (o.input || o.ready) { UI.note('Внутри что-то есть.'); return true; }
    if (!Inv.add(back, 1)) { UI.note('Нет места в рюкзаке.'); return true; }
    m.remove(o); AU.sfx('pick'); return true;
  },
  quality(fert) {
    const L = skillLvl('farming');
    const gold = .2 * (L / 10) + .2 * (fert === 1 ? 1 : fert === 2 ? 2 : 0) * ((L + 2) / 12) + .01;
    const r = Math.random(); if (r < gold) return 2; if (r < Math.min(.75, gold * 2)) return 1; return 0;
  },
  harvest(m, x, y) {
    const s = m.soilAt(x, y); if (!s || !s.crop || s.dead) return false;
    if (cropStage(s) < 4) return false;
    const C = CROPS[s.crop];
    if (s.crop === 'blackseed') { if (!Inv.add('blackfruit', 1)) { UI.note('Нет места!'); return true; } s.crop = null; s.age = 0; Events.blackFruit(); return true; }
    const q = this.quality(s.fert);
    let n = C.multi || 1; if (C.extra && Math.random() < C.extra) n++;
    if (!Inv.add(C.item, 1, q)) { UI.note('Рюкзак полон!', 'bad'); return true; }
    for (let k = 1; k < n; k++) if (!Inv.add(C.item, 1, 0, undefined, true)) Drops.spawn(m, x * 16 + 8, y * 16 + 8, C.item, 1);
    if (C.seedBack && U.chance(.5) && !Inv.add(C.item + '_seed', 1, 0, undefined, true)) Drops.spawn(m, x * 16 + 8, y * 16 + 8, C.item + '_seed', 1);
    AU.sfx('harvest'); Parts.burst(x * 16 + 8, y * 16 + 4, C.col, 6);
    Skills.xp('farming', Math.round(16 * Math.log(.018 * ITEMS[C.item].p + 1)));
    S.stats.harvest = (S.stats.harvest || 0) + n;
    if (C.scream) { AU.sfx('scream'); Sanity.add(-8); Render.shake = 4; UI.note('А-А-А-А-А! (мандрагора)', 'bad'); }
    if (C.regrow) { s.age = C.days - C.regrow; } else { s.crop = null; s.age = 0; s.fert = s.fert === 3 ? 0 : s.fert; }
    Quests.event('harvest', C.item);
    return true;
  },
  // ночной рост
  growMap(m) {
    if (!m.soil) return;
    for (let k = 0; k < m.soil.length; k++) {
      const s = m.soil[k]; if (!s) continue;
      if (s.crop && !s.dead) {
        const C = CROPS[s.crop];
        if (s.water || m.greenhouse) { s.age += (s.fert === 3 ? 1.25 : 1); if (s.age > C.days) s.age = C.days; }
        else if (s.crop === 'blackseed' && !s.water) Sanity.add(-3);
      } else if (!s.crop && m.outdoor && Math.random() < .08 && !s.water) { m.soil[k] = null; continue; }
      s.water = false;
    }
  },
  seasonKill(m) { if (!m.soil || m.greenhouse) return 0; let n = 0; for (const s of m.soil) if (s && s.crop && !s.dead && !CROPS[s.crop].seasons.includes(S.season)) { s.dead = true; n++; } return n; },
  sprinklers(m) {
    const seen = new Set();
    for (const o of m.objs) {
      if (!o || seen.has(o) || (o.t !== 'sprinkler' && o.t !== 'qsprinkler')) continue; seen.add(o);
      const r = o.t === 'qsprinkler' ? [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] : [[0, -1], [-1, 0], [1, 0], [0, 1]];
      for (const [dx, dy] of r) { const s = m.soilAt(o.x + dx, o.y + dy); if (s) s.water = true; }
    }
  },
  rainWater(m) { if (!m.soil || !m.outdoor) return; for (const s of m.soil) if (s) s.water = true; },
  crows(m) {
    const crops = []; m.soil.forEach((s, k) => { if (s && s.crop && !s.dead && s.crop !== 'blackseed') crops.push(k); });
    if (crops.length < 16) return 0;
    const scares = []; const seen = new Set(); for (const o of m.objs) if (o && o.t === 'scarecrow' && !seen.has(o)) { seen.add(o); scares.push(o); }
    let eaten = 0;
    for (let c = 0; c < Math.floor(crops.length / 16); c++) {
      if (Math.random() > .5) continue;
      const k = U.pick(crops), x = k % m.w, y = (k / m.w) | 0;
      if (scares.some(o => Math.hypot(o.x - x, o.y - y) <= 8)) continue;
      m.soil[k].crop = null; m.soil[k].age = 0; eaten++;
    }
    return eaten;
  },
};

/* ---------- машины ---------- */
const SMELT = { copper_ore: ['copper_bar', 30], iron_ore: ['iron_bar', 120], gold_ore: ['gold_bar', 300] };
function nowMin() { return S.absDay * 1440 + S.time; }
const Machines = {
  tryInsert(m, o, st) {
    if (!['furnace', 'keg', 'pjar'].includes(o.t) || o.deco) return false;
    if (o.ready) { this.collect(o); return true; }
    if (o.input) { UI.note('Машина работает. Готово через ' + this.left(o)); return true; }
    const it = ITEMS[st.id];
    if (o.t === 'furnace') {
      const sm = SMELT[st.id]; if (!sm) return false;
      if (st.n < 5 && Inv.count(st.id) < 5) { UI.note('Нужно 5 руды.', 'bad'); return true; }
      if (!Inv.has('coal')) { UI.note('Нужен уголь.', 'bad'); return true; }
      Inv.remove(st.id, 5); Inv.remove('coal', 1); o.input = { out: sm[0], at: nowMin() + sm[1] }; AU.sfx('bonfire'); return true;
    }
    if (!['crop', 'forage'].includes(it.type) || !['fruit', 'veg'].includes(it.cat)) return false;
    let out, dur;
    if (o.t === 'keg') { out = it.cat === 'fruit' ? 'wine' : 'juice'; dur = it.cat === 'fruit' ? 1440 * 5 : 1440 * 3; }
    else { out = it.cat === 'fruit' ? 'jam' : 'pickles'; dur = 1440 * 2; }
    o.input = { out, of: st.id, at: nowMin() + dur }; Inv.takeAt(S.inv.indexOf(st), 1); AU.sfx('water'); UI.note(`Готовится: ${itemName({ id: out, of: st.id })}`);
    return true;
  },
  left(o) { const d = o.input.at - nowMin(); return d > 1440 ? Math.ceil(d / 1440) + ' дн.' : d >= 60 ? Math.ceil(d / 60) + ' ч.' : Math.max(10, Math.ceil(d / 10) * 10) + ' мин.'; },
  collect(o) { if (Inv.add(o.ready.id, 1, 0, o.ready.of)) { o.ready = null; AU.sfx('pickup'); } else UI.note('Рюкзак полон!', 'bad'); },
  tick() {
    const now = nowMin();
    for (const id of ['farm', 'greenhouse', 'house']) {
      const m = World.maps[id]; if (!m) continue; const seen = new Set();
      for (const o of m.objs) if (o && !seen.has(o) && o.input) { seen.add(o); if (now >= o.input.at) { o.ready = { id: o.input.out, of: o.input.of }; o.input = null; } }
    }
  },
};

/* ---------- навыки ---------- */
const Skills = {
  xp(k, n) {
    const before = skillLvl(k);
    S.skills[k] = (S.skills[k] || 0) + n;
    const after = skillLvl(k);
    if (after > before) {
      AU.sfx('levelup'); UI.note(`${SKILLS[k]}: уровень ${after}!`, 'good');
      if (k === 'combat') { S.maxHp += 5; S.hp += 5; }
      const unl = Object.entries(RECIPES).filter(([id, r]) => r.need && r.need[0] === k && r.need[1] === after).map(([id]) => ITEMS[id].n);
      if (unl.length) setTimeout(() => UI.note('Новый рецепт: ' + unl.join(', '), 'good'), 900);
    }
  },
};
/* ---------- рассудок ---------- */
const Sanity = {
  add(n) {
    const was = S.sanity;
    S.sanity = U.clamp(S.sanity + n, 0, S.maxSanity);
    if (n < 0 && was > 0 && S.sanity <= 0) Game.breakdown();
    if (was >= 35 && S.sanity < 35 && !S.flags.lowSanNote) { S.flags.lowSanNote = 1; UI.note('Мир теряет цвет... Рассудок на исходе. Спи, ешь, говори с людьми.', 'bad'); }
  },
  tick10() {
    const m = World.cur; if (!m) return;
    let d = 0; const t = S.time;
    if (t >= 1200) d -= .35; if (t >= 1440) d -= .6;
    if (m.theme === 'dungeon') d -= .18 * (1 + (m.depth || 1) / 10);
    if (S.weather === 'storm' && m.outdoor) d -= .08;
    if (m.id === 'house' && t < 1200) d += .25;
    if (S.spouse && m.id === 'house') d += .2;
    if (d < 0) d *= Math.max(.3, 1 - (S.lvl.fth || 0) * .06);
    if (d) this.add(d);
  },
};

/* ---------- ежедневный спавн ---------- */
const Spawner = {
  dailyForage(first) {
    for (const [id, cnt] of [['farm', 3], ['village', 4], ['forest', 8]]) {
      const m = World.maps[id]; if (!m) continue;
      let have = 0; const seen = new Set(); for (const o of m.objs) if (o && o.t === 'forage' && !seen.has(o)) { seen.add(o); have++; }
      const pool = FORAGE[id][S.season];
      for (let k = have; k < cnt + (first ? 2 : 0); k++) {
        const p = m.randomFree((x, y) => [G_.GRASS, G_.DGRASS].includes(m.groundAt(x, y)) && !m.soilAt(x, y) && !m.block[y * m.w + x]); if (p) m.put(p.x, p.y, { t: 'forage', item: U.pick(pool) });
      }
      // артефакты (червячки)
      let art = 0; seen.clear(); for (const o of m.objs) if (o && o.t === 'artifact' && !seen.has(o)) { seen.add(o); art++; }
      for (let k = art; k < 2; k++) { if (Math.random() < .5) continue; const p = m.randomFree((x, y) => [G_.GRASS, G_.DGRASS, G_.DIRT].includes(m.groundAt(x, y)) && !m.soilAt(x, y) && !m.block[y * m.w + x]); if (p) m.put(p.x, p.y, { t: 'artifact', walk: true }); }
    }
    // сорняки на ферме
    const f = World.maps.farm;
    if (f && S.season !== 3 && !first) for (let k = 0; k < U.ri(2, 6); k++) { const p = f.randomFree((x, y) => y > 8 && f.groundAt(x, y) === G_.GRASS && !f.soilAt(x, y)); if (p) f.put(p.x, p.y, { t: 'weed', v: U.ri(0, 5) }); }
    // восстановление деревьев
    for (const id of ['forest', 'farm']) {
      const m = World.maps[id]; const seen = new Set();
      for (const o of m.objs) {
        if (!o || seen.has(o)) continue; seen.add(o);
        if (o.t === 'stump' && o.regrowDay && o.regrowDay <= S.absDay) { m.remove(o); m.put(o.x, o.y, { t: 'tree', kind: o.kind || 'pine', hp: 10, regrow: true }); }
        if (o.t === 'tree' && o.stage !== undefined && o.stage < 3 && Math.random() < .3) o.stage++;
        if (o.t === 'tree' && o.stage === 3) delete o.stage;
      }
    }
    S.regrow = (S.regrow || []).filter(r => {
      if (r.day > S.absDay) return true;
      const m = World.maps[r.map]; if (m && !m.objAt(r.x, r.y) && !m.solidAt(r.x, r.y)) m.put(r.x, r.y, { t: 'tree', kind: r.kind || 'pine', hp: 10, regrow: true, stage: 0 });
      return false;
    });
    // фестиваль
    const v = World.maps.village; const seen2 = new Set();
    for (const o of v.objs) if (o && o.t === 'eye' && !seen2.has(o)) { seen2.add(o); v.remove(o); }
    if (Fest.today() === 'eyes') { S.flags.festEyes = 0; for (let k = 0; k < 16; k++) { const p = v.randomFree((x, y) => !v.block[y * v.w + x]); if (p) v.put(p.x, p.y, { t: 'eye', walk: true }); } }
  },
  regrowLater(m, x, y, kind) { if (m.id !== 'forest') return; S.regrow = S.regrow || []; S.regrow.push({ map: m.id, x, y, kind, day: S.absDay + U.ri(5, 9) }); },
};

/* ---------- праздники ---------- */
const Fest = {
  today() { if (S.season === 0 && S.day === 13) return 'eyes'; if (S.season === 2 && S.day === 27) return 'spirits'; return null; },
  spot(id) { return { mayor: [16, 22, 'down'], rosa: [21, 18, 'down'], pierrot: [14, 21, 'right'], klim: [22, 22, 'left'], eva: [19, 23, 'up'], lilith: [23, 19, 'left'] }[id]; },
};

/* ---------- настройки ---------- */
const Settings = Object.assign({ zoom: 1, cursor: true, music: .45, sfx: .7, touch: 'auto' }, (() => { try { return JSON.parse(Store.get('bs_settings') || '{}'); } catch (e) { return {}; } })());
function saveSettings() { Store.set('bs_settings', JSON.stringify(Settings)); }
