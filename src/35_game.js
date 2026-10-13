/* ============================================================
   Игра: состояние, время, дни, смерть, взаимодействие, общение, сохранение
   ============================================================ */
let S = null;
function newSave(o) {
  return {
    v: 1, name: o.name || 'Фермер', gender: o.gender || 'm', look: o.look, seed: Math.floor(Math.random() * 1e9),
    day: 1, season: 0, year: 1, absDay: 1, time: 360, weather: 'sun', tomorrow: 'sun',
    money: 500, earned: 0, hp: 100, maxHp: 100, energy: 270, maxEnergy: 270, sanity: 100, maxSanity: 100,
    souls: 0, soulLvl: 1, lvl: { vig: 0, end: 0, str: 0, fth: 0 }, estus: 3, estusMax: 3,
    inv: [{ id: 'hoe', n: 1 }, { id: 'can', n: 1 }, { id: 'axe', n: 1 }, { id: 'pick', n: 1 }, { id: 'scythe', n: 1 }, { id: 'parsnip_seed', n: 15 }, { id: 'estus', n: 1 }, null, null, null, null, null],
    invSize: 12, sel: 0, tools: { hoe: 0, can: 0, axe: 0, pick: 0, rod: 0 }, water: 40,
    skills: { farming: 0, mining: 0, combat: 0, fishing: 0, foraging: 0 },
    rel: {}, flags: {}, quests: { active: [], done: [], prog: {} }, pages: [], sin: 0, breakdowns: 0, deaths: 0,
    recipes: { grilled_fish: 1, fried_mush: 1 }, mail: [], mailRead: [], bundles: {}, bin: [], stats: {}, buffs: [],
    wellMax: 0, bonfires: [], blood: null, upgrading: null, spouse: null, dating: null, board: null, regrow: [], seen: {}, endings: {},
  };
}
function rel(id) { if (!S.rel[id]) S.rel[id] = { pts: 0, met: false, talked: false, gifted: false, week: 0 }; return S.rel[id]; }
function hearts(id) { return Math.floor(rel(id).pts / 250); }

const Game = {
  state: 'title', warping: false, dead: false, bombs: [], lockN: 0, tAcc: 0, tick10Acc: 0, hidePlayer: false, paused: false,
  locked() { return this.lockN > 0 || UI.modal() || this.warping || this.state !== 'play'; },
  lock() { this.lockN++; }, unlock() { this.lockN = Math.max(0, this.lockN - 1); },
  musicFor(m) {
    if (m.theme === 'dungeon') return m.bossActive ? 'boss' : m.music;
    if (m.id === 'forest') return isNight() ? 'night' : 'forest';
    if (m.outdoor && isNight()) return 'night';
    if (S.sanity < 20) return 'library';
    return m.music;
  },
  start(save) {
    S = save; normalizeSave(S);
    for (const k of [...SPR.keys()]) if (k.includes('player') || k.startsWith('icon:') || k.startsWith('bld:')) SPR.delete(k);
    _urlCache.clear();
    World.init();
    this.state = 'play'; this.dead = false; this.lockN = 0;
    UI.showHUD(true);
    const sp = S.pos || { map: 'house', x: 9, y: 4, dir: 'down' };
    World.enter(sp.map, sp.x, sp.y, sp.dir);
    UI.toolbar(); UI.hud();
    if (!S.flags.intro) Events.intro();
  },
  update(dt) {
    if (this.state !== 'play') return;
    const m = World.cur; if (!m) return;
    Render.t += dt;
    Render.shake = Math.max(0, Render.shake - dt * 20); Render.flash = Math.max(0, Render.flash - dt * 2);
    // время
    if (!this.locked() && !m.noTime) {
      this.tAcc += dt;
      const rate = 0.7; // секунд на игровую минуту
      while (this.tAcc >= rate) { this.tAcc -= rate; S.time++; if (S.time % 10 === 0) this.tick10(); }
    }
    Player.update(dt); NPCRT.update(dt); Mon.update(dt); Proj.update(dt); Drops.update(dt); Parts.update(dt); Fishing.update(dt); Halluc.update(dt);
    for (let i = this.bombs.length - 1; i >= 0; i--) { const b = this.bombs[i]; b.t -= dt; if (Math.random() < .5) Parts.add(b.x, b.y - 8, (Math.random() - .5) * 20, -20, '#ffe060', .3); if (b.t <= 0) { this.bombs.splice(i, 1); Items.explode(b); } }
    Render.updateCamera(.2);
    if (m.depth === 30 && S.flags.authorDoorOpen && !S.flags.boss30 && !m.bossActive && P.y < 17 * 16 && !this.locked()) { UI.say('marysue', T('Вернул{ся|ась}? Я знала. Персонажи всегда возвращаются к автору.'), 'happy'); Events.startAuthor(m); }
    if (Input.hit.menu || Input.hit.esc) { if (!this.locked()) UI.openMenu(); }
    UI.hud();
  },
  tick10() {
    NPCRT.tick(); Sanity.tick10(); Machines.tick();
    S.buffs = S.buffs.filter(b => b.until > nowMin());
    const m = World.cur;
    Music.play(this.musicFor(m));
    if (S.time === 1200 && m.outdoor) UI.note('Темнеет. После полуночи рассудок тает быстрее.');
    if (S.time === 1440) UI.note('Полночь. Пора спать.', 'bad');
    if (S.time === 1530) UI.note('Ты валишься с ног...', 'bad');
    if (S.time >= 1560) this.passOut('late');
    Events.tick(m);
    if (m.outdoor && m.id === 'farm' && S.sanity < 30 && isNight() && Math.random() < .05) Halluc.overlay = { t: 1, txt: '...' };
  },
  /* ---------- конец дня ---------- */
  async sleep() {
    this.lock();
    await UI.fade(true);
    const late = S.time > 1440;
    await this.endDay(late ? 'late-sleep' : 'sleep');
    this.unlock();
  },
  async passOut(reason) {
    if (this.passing) return; this.passing = true; this.lock();
    Fishing.cancel(); P.act = null;
    UI.note(reason === 'exhaust' ? 'Ты падаешь от усталости...' : 'Ты теряешь сознание...', 'bad');
    await U.sleep(600); await UI.fade(true);
    let lost = 0;
    if (World.cur.id !== 'house' && World.cur.id !== 'farm') { lost = Math.min(1000, Math.floor(S.money * .1)); S.money -= lost; }
    await this.endDay('passout', lost);
    this.passing = false; this.unlock();
  },
  async endDay(kind, lost = 0) {
    // отгрузка
    let total = 0; const lines = [];
    for (const st of S.bin) { const v = itemPrice(st) * st.n; total += v; lines.push([itemName(st), st.n, v, st.id, st.of]); S.stats.shipped = (S.stats.shipped || 0) + st.n; }
    S.bin = []; S.money += total; S.earned += total;
    if (total) Quests.event('ship', total);
    // время и календарь
    S.day++; S.absDay++;
    let seasonChanged = false;
    if (S.day > DAYS_IN_SEASON) { S.day = 1; S.season = (S.season + 1) % 4; seasonChanged = true; if (S.season === 0) S.year++; }
    S.time = 360;
    S.weather = S.tomorrow; S.tomorrow = rollWeather();
    if (S.day === 1) S.weather = 'sun';
    // восстановление
    const sleptLate = kind === 'late-sleep', passed = kind === 'passout';
    S.energy = passed ? S.maxEnergy * .5 : sleptLate ? S.maxEnergy * .8 : S.maxEnergy;
    if (S.energy < 0) S.energy = S.maxEnergy * .4;
    S.hp = S.maxHp; S.estus = S.estusMax;
    Sanity.add(passed ? 5 : sleptLate ? 14 : 28);
    S.flags.exhaustWarned = false; S.flags.campfireUsed = false;
    const talkedToday = Object.values(S.rel).some(r => r.talked) || (S.spouse && World.cur && World.cur.id === 'house');
    const lonely = !talkedToday && S.absDay > 2;
    if (lonely) Sanity.add(-6);
    const seedGrowing = World.maps.farm.soil.some(s => s && s.crop === 'blackseed') || World.maps.greenhouse.soil.some(s => s && s.crop === 'blackseed');
    if (seedGrowing) Sanity.add(-2);
    for (const id in S.rel) { const r = S.rel[id]; if (!r.talked && r.pts > 0 && hearts(id) < 8 && !(S.spouse === id)) r.pts = Math.max(0, r.pts - 2); r.talked = false; r.gifted = false; if ((S.absDay - 1) % 7 === 0) r.week = 0; }
    // ферма
    for (const id of ['farm', 'greenhouse']) { const m = World.maps[id]; Farm.growMap(m); }
    let dead = 0; if (seasonChanged) dead = Farm.seasonKill(World.maps.farm);
    const f = World.maps.farm;
    if (S.weather === 'rain' || S.weather === 'storm') Farm.rainWater(f);
    Farm.sprinklers(f); Farm.sprinklers(World.maps.greenhouse);
    const crows = Farm.crows(f);
    if (S.spouse && Math.random() < .25) { let w = 0; for (const s of f.soil) if (s && s.crop && !s.water && w < 40) { s.water = true; w++; } if (w) S.flags.spouseWatered = 1; }
    Spawner.dailyForage(false);
    Machines.tick();
    const nightEv = Events.nightEvent(f);
    Mail.daily();
    Quests.daily();
    if (S.upgrading && S.upgrading.day <= S.absDay && !S.upgrading.notified) { S.upgrading.notified = true; Mail.send('toolready'); }
    // итоги дня
    S.pos = passed && S.lastWasWell ? { map: 'clinic', x: 9, y: 5, dir: 'down' } : { map: 'house', x: 9, y: 4, dir: 'down' };
    if (kind === 'breakdown' || kind === 'death-night') S.pos = { map: 'clinic', x: 9, y: 5, dir: 'down' };
    S.lastWasWell = false;
    await UI.daySummary(lines, total, { lost, dead, crows, nightEv, kind, lonely });
    Save.write(true);
    World.maps.village.dirtyGround = true; World.maps.forest.dirtyGround = true; World.maps.farm.dirtyGround = true;
    for (const k of [...SPR.keys()]) if (k.startsWith('bld:') || k.startsWith('weed:') || k.startsWith('bush:')) SPR.delete(k);
    World.enter(S.pos.map, S.pos.x, S.pos.y, S.pos.dir);
    await UI.fade(false);
    if (S.breakdowns >= 3 && !S.endings.scarecrow) { Events.endingScarecrow(); return; }
    Events.morning();
  },
  /* ---------- смерть и срыв ---------- */
  async die() {
    if (this.dead) return; this.dead = true; this.lock();
    Fishing.cancel(); P.act = null; P.charging = null;
    AU.sfx('died'); Music.play('silence');
    S.deaths++;
    const m = World.cur;
    if (m.depth) { S.blood = S.souls > 0 ? { floor: m.depth, souls: S.souls } : null; } else if (S.souls > 0) S.blood = null;
    const lostSouls = S.souls; S.souls = 0;
    const lost = Math.min(500, Math.floor(S.money * .1)); S.money -= lost;
    await UI.youDied(lostSouls, lost);
    S.hp = Math.round(S.maxHp * .5); S.estus = S.estusMax; Sanity.add(-10);
    S.time = Math.min(S.time + 180, 1550);
    this.dead = false; this.unlock();
    World.enter('clinic', 9, 5, 'down');
    await UI.fade(false);
    await UI.say('eva', T('Тебя принесли... нет, не спрашивай кто. Оно оставило тебя на пороге и ушло обратно в колодец. Лежи. Счёт за лечение я уже выписала.'), 'sad');
  },
  async breakdown() {
    if (this.breaking) return; this.breaking = true; this.lock();
    Fishing.cancel();
    S.breakdowns++;
    await Events.breakdownScene();
    await UI.fade(true);
    const lost = Math.min(1000, Math.floor(S.money * .1)); S.money -= lost;
    S.sanity = 0;
    this.breaking = false; this.unlock();
    await this.endDay('breakdown', lost);
    S.sanity = Math.max(S.sanity, 45);
  },
  /* ---------- колодец ---------- */
  inWell(m) { S.lastWasWell = true; if (m.bossPending) this.bossIntro(m); },
  leftWell() { S.lastWasWell = false; },
  async bossIntro(m) {
    // босс появляется, когда игрок проходит туман
  },
  startBoss(m) {
    if (m.bossActive) return;
    m.bossActive = true; m.bossPending = false;
    for (const o of m.objs.slice()) if (o && o.t === 'fog') m.remove(o);
    const mo = spawnMonster(m, m.boss, 17 * 16 + 8, 9 * 16, m.depth); mo.cd = 2;
    Music.play('boss'); AU.sfx('boss'); UI.bossBar(mo);
    for (let x = 16; x <= 18; x++) m.put(x, 20, { t: 'fog' });
  },
  bossDefeated(m, mo) {
    m.bossActive = false; UI.bossBar(null);
    for (const o of m.objs.slice()) if (o && o.t === 'fog') m.remove(o);
    Music.play('dungeon');
    S.flags['boss' + m.depth] = true;
    for (const mm of m.mons.slice()) if (mm !== mo) Mon.vanish(m, mm);
    if (m.depth === 30) { Events.authorDefeated(); return; }
    m.put(17, 8, { t: 'ladder', walk: true });
    m.put(15, 13, { t: 'bonfire', floor: m.depth }); m.lights.push({ x: 15 * 16 + 8, y: 13 * 16 + 4, r: 70, col: 'fire' });
    Render.flash = .8; Render.flashCol = '#fff';
    setTimeout(() => Events.bossVictory(m.depth), 900);
  },
};
function rollWeather() {
  const r = Math.random();
  if (S.season === 3) return r < .25 ? 'rain' : 'sun';
  if (S.season === 1) return r < .1 ? 'storm' : r < .25 ? 'rain' : 'sun';
  return r < .05 ? 'storm' : r < .28 ? 'rain' : 'sun';
}
function normalizeSave(s) {
  const d = newSave({ look: s.look });
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  while (s.inv.length < s.invSize) s.inv.push(null);
  s.stats = s.stats || {}; s.endings = s.endings || {};
}

/* ---------- взаимодействие с объектами ---------- */
const Interact = {
  obj(m, o) {
    switch (o.t) {
      case 'bed': (async () => { const c = await UI.choose('Лечь спать? (Игра сохранится)', ['Спать', 'Ещё не время']); if (c === 0) Game.sleep(); })(); return true;
      case 'tv': Events.tv(); return true;
      case 'chest':
        if (o.dungeon) { const id = o.dungeon; if (!Inv.add(id, 1)) { UI.note('Нет места!'); return true; } S.flags['chest' + o.floor] = true; m.remove(o); AU.sfx('quest'); UI.note('Найдено: ' + ITEMS[id].n, 'good'); if (id === 'shorts') Quests.start('q_shorts'); return true; }
        if (o.grandpa && !S.flags.grandpaChest) { Events.grandpaChest(o); return true; }
        UI.openChest(o); return true;
      case 'mailbox': Mail.open(); return true;
      case 'bin': UI.openShip(); return true;
      case 'board': UI.openBoard(); return true;
      case 'altar': if (S.flags.chapelSeen) UI.openBundles(); else Events.chapelFirst(); return true;
      case 'counter': return Shops.counter(m, o);
      case 'cart': if (NPCRT.where('cheshire')) Shops.open('cheshire'); return true;
      case 'well': Events.wellUse(); return true;
      case 'ladder': this.descend(m); return true;
      case 'ladderUp': (async () => { const c = await UI.choose('Подняться на поверхность?', ['Подняться', 'Остаться']); if (c === 0) World.warp('farm', 33, 6, 'down'); })(); return true;
      case 'bonfire': UI.openBonfire(o); return true;
      case 'furnace': case 'keg': case 'pjar':
        if (o.deco) { UI.note('Горн Клима. Горячо.'); return true; }
        if (o.ready) { Machines.collect(o); return true; }
        if (o.input) { UI.note(`${itemName({ id: o.input.out, of: o.input.of })}: готово через ${Machines.left(o)}`); return true; }
        UI.note(o.t === 'furnace' ? 'Выбери руду в панели и нажми «Использовать» у печи (5 руды + 1 уголь).' : 'Выбери фрукт или овощ и нажми «Использовать» у машины.'); return true;
      case 'kitchen': case 'cookpot': UI.openCooking(); return true;
      case 'campfire': Events.campfire(); return true;
      case 'grave': Events.grave(o); return true;
      case 'sign': UI.say(null, o.text || '...'); return true;
      case 'arcade': UI.say(null, U.pick(['«КОРОЛЬ ПРЕРИЙ». ВЫ ПОГИБЛИ. Снова.', 'Рекорд: 999999 — «М.С.». Твой рекорд: 3.', 'На экране мелькает твоё лицо. Потом — надпись «ИГРАЙ».'])); return true;
      case 'piano': AU.sfx('magic'); UI.note(S.sanity < 40 ? 'Клавиши нажимаются сами.' : 'Ты играешь «Собачий вальс». Плохо.'); return true;
      case 'mirror': UI.say(null, S.sanity < 40 ? T('В зеркале ты улыбаешься. Ты — не улыбаешься.') : T('Ты в зеркале. Выглядишь {уставшим|уставшей}. Но {живым|живой}. В основном.')); return true;
      case 'coffin': UI.say(null, S.flags.chapelDone ? 'Гроб пуст. На дне надпись: «Спасибо».' : 'Гроб заколочен. Изнутри кто-то тихонько стучит. Три раза. Пауза. Три раза.'); return true;
      case 'manuscript': Events.manuscript(); return true;
      case 'door': if (o.author) Events.authorDoor(m, o); return true;
      case 'fog': if (m.boss) Game.startBoss(m); return true;
      case 'fountain': (async () => { if (S.money < 10) return; const c = await UI.choose(S.sanity < 30 ? 'В фонтане кровь. Бросить монетку? (10з)' : 'Бросить монетку в фонтан? (10з)', ['Бросить', 'Нет']); if (c === 0) { S.money -= 10; AU.sfx('coin'); Sanity.add(2); UI.note('Ты загадал{|а} желание. Рассудок +2'); } })(); return true;
      case 'fireplace': UI.note('Тепло. Пахнет дедом.'); Sanity.add(.5); return true;
      case 'shelf': case 'bookstack': UI.say(null, U.pick(BOOKS)); return true;
      case 'crack': UI.note('Трещина в полу. Из неё тянет сыростью и шёпотом.'); return true;
    }
    if (FLAT_OBJ.has(o.t)) return false;
    return false;
  },
  async descend(m) {
    const n = (m.depth || 0) + 1;
    if (n > 30 && !S.flags.boss30) { UI.note('Дальше — только тьма. Пока.'); return; }
    AU.sfx('door'); await UI.fade(true);
    World.enter('well:' + n);
    await U.sleep(60); await UI.fade(false);
  },
};
const BOOKS = ['«Как вырастить пастернак и не сойти с ума». Последняя глава вырвана.', '«Сто способов приготовить мозговую капусту». Способ 101 написан кровью.',
  '«Грибы Лощины: съедобные, несъедобные и шепчущие».', '«Мэри Сью: Ферма. Черновик 47». Главный герой — ты.', '«Тёмные души: руководство по кострам». Восхвали солнце!',
  '«Алиса в Стране Удобрений».', '«Сказки братьев Гримм: неотредактированная версия». Страницы слиплись.', '«Как пережить вторник». Автор: Пьеро. Страницы мокрые от слёз.',
  '«Справочник ведьмы. Том 13: Корсеты и проклятия».', 'Дневник: «День 1408. Колодец снова зовёт. Не отвечай ей.»'];

/* ---------- общение ---------- */
const Social = {
  async talk(n, noShop) {
    if (n.deco) { await UI.say('zhmur', U.pick(['Жмур-жмур!', 'Жмуримо любят подношения!', 'Алтарь голоден. Покорми алтарь!', '...жмур? (оно смотрит на тебя с надеждой)'])); return; }
    const id = n.id, def = NPCS[id]; const r = rel(id);
    n.talking = 2; n.dir = Math.abs(P.x - n.x) > Math.abs(P.y - n.y) ? (P.x > n.x ? 'right' : 'left') : (P.y > n.y ? 'down' : 'up');
    if (!r.met) {
      r.met = true; Quests.event('meet', id);
      if (id === 'kva') { await Events.kvaIntro(n); r.talked = true; r.pts += 20; return; }
      if (id === 'ophelia') S.flags.metOphelia = true;
      await UI.say(id, T(def.lines.intro), 'neutral');
      r.talked = true; r.pts += 20; return;
    }
    if (await Events.npcHook(id, n)) return;
    if (!noShop && (id === 'grobus' || id === 'cheshire')) { if (!r.talked) { r.talked = true; this.addPts(id, 20); } Shops.menu(id, n); return; }
    const line = this.pickLine(id);
    let emo = hearts(id) >= 6 ? (def.romance ? 'blush' : 'happy') : 'neutral';
    if (S.sanity < 30 && Math.random() < .5) emo = 'creepy';
    if (!r.talked) { r.talked = true; this.addPts(id, 20); Sanity.add(hearts(id) >= 4 ? 3 : 1); }
    await UI.say(id, T(line), emo);
    if (S.sanity < 35 && !def.noKill && Math.random() < .5) {
      const c = await UI.choose('', ['Ага', 'Неа', 'Убить'], 2);
      if (c === 2) await Events.killChoice(id, n);
    }
  },
  pickLine(id) {
    const def = NPCS[id], L = def.lines, h = hearts(id);
    let pool = [...L.d];
    if (L['s' + S.season]) pool.push(...L['s' + S.season], ...L['s' + S.season]);
    if ((S.weather === 'rain' || S.weather === 'storm') && L.rain) pool.push(...L.rain, ...L.rain);
    if (h >= 4 && L.h4) pool.push(...L.h4, ...L.h4);
    if (h >= 8 && L.h8) pool.push(...L.h8, ...L.h8, ...L.h8);
    if (S.sanity < 35 && L.low) pool = L.low.concat(L.low, pool.slice(0, 2));
    if (S.spouse === id && L.married) pool = L.married.concat(L.married, pool.slice(0, 3));
    if (S.day === def.bday?.[1] && S.season === def.bday?.[0]) return 'Сегодня мой день рождения! ...Ты ведь помнишь? Подарки принимаются.';
    return U.pick(pool);
  },
  addPts(id, n) {
    const r = rel(id), def = NPCS[id]; const before = hearts(id);
    const cap = def.romance && !(S.dating === id || S.spouse === id) ? 2000 : 2500;
    r.pts = U.clamp(r.pts + n, 0, cap);
    const after = hearts(id);
    if (after > before) { AU.sfx('heart'); UI.note(`${def.short || def.n}: ${after} ♥`, 'good'); }
  },
  taste(id, item) {
    const def = NPCS[id]; const cat = 'cat:' + itemCat(item);
    const inL = l => l && (l.includes(item) || l.includes(cat));
    if (inL(def.loves)) return 'love'; if (inL(def.hates)) return 'hate'; if (inL(def.likes)) return 'like'; if (inL(def.dislikes)) return 'dislike';
    if (inL(UNIVERSAL.loves)) return 'love'; if (inL(UNIVERSAL.hates)) return 'hate'; if (inL(UNIVERSAL.likes)) return 'like'; if (inL(UNIVERSAL.dislikes)) return 'dislike';
    return 'neutral';
  },
  async gift(n, st) {
    if (n.deco) return;
    const id = n.id, def = NPCS[id], r = rel(id), it = ITEMS[st.id];
    if (!def || !def.lines) return;
    if (it.type === 'key' && !['goldball', 'shorts'].includes(st.id)) { UI.note('Это нельзя дарить.'); return; }
    if (await Events.giftHook(id, st, n)) return;
    if (!r.met) { await this.talk(n); return; }
    const bday = def.bday && def.bday[0] === S.season && def.bday[1] === S.day;
    if (r.gifted) { UI.note(`Ты уже дарил{|а} ${def.short || def.n} подарок сегодня.`); return; }
    if (r.week >= 2 && !bday) { UI.note('Уже два подарка на этой неделе.'); return; }
    const t = this.taste(id, st.id);
    let pts = { love: 80, like: 45, neutral: 20, dislike: -20, hate: -40 }[t];
    if (pts > 0) pts = Math.round(pts * (1 + (st.q || 0) * .1));
    if (bday) pts *= 8;
    Inv.takeAt(S.inv.indexOf(st), 1); r.gifted = true; r.week++;
    this.addPts(id, pts); n.talking = 2;
    if (!r.talked) { r.talked = true; this.addPts(id, 20); }
    if (t === 'love') Sanity.add(4); if (t === 'like') Sanity.add(2);
    const emo = { love: 'happy', like: 'happy', neutral: 'neutral', dislike: 'sad', hate: 'angry' }[t];
    await UI.say(id, T(def.lines.gift[t]) + (bday ? (pts > 0 ? '\nИ в мой день рождения! Ты запомнил{|а}!' : '\nВ мой день рождения?!') : ''), emo === 'happy' && def.romance ? 'blush' : emo);
    Quests.event('gift', id, st.id);
  },
};

/* ---------- сохранения ---------- */
const Save = {
  key(slot) { return 'bs_save_' + (slot || S && S.slot || 1); },
  data(keepPos) {
    S.mapState = World.serialize();
    const m = World.cur;
    if (!keepPos && m) S.pos = m.theme === 'dungeon' ? { map: 'farm', x: 33, y: 6, dir: 'down' } : { map: m.id, x: Math.floor(P.x / 16), y: Math.floor((P.y - 4) / 16), dir: P.dir };
    return JSON.stringify(S);
  },
  write(keepPos) { const ok = Store.set(this.key(), this.data(keepPos)); if (ok) UI.note('Игра сохранена'); else UI.note('Не удалось сохранить в браузере — используй «Код сохранения».', 'bad'); return ok; },
  read(slot) { const s = Store.get(this.key(slot)); if (!s) return null; try { return JSON.parse(s); } catch (e) { return null; } },
  exportCode() { try { const s = this.data(); return 'BS1:' + btoa(unescape(encodeURIComponent(s))); } catch (e) { return ''; } },
  importCode(code) { try { code = code.trim(); if (code.startsWith('BS1:')) code = code.slice(4); return JSON.parse(decodeURIComponent(escape(atob(code)))); } catch (e) { return null; } },
  slots() { const out = []; for (let i = 1; i <= 3; i++) { const s = this.read(i); out.push(s ? { slot: i, name: s.name, day: s.day, season: s.season, year: s.year, money: s.money } : null); } return out; },
};
