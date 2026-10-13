/* ============================================================
   Титульный экран, создание персонажа, главный цикл
   ============================================================ */
const LOOK_OPTS = {
  skin: ['#f8e0cc', '#f2c6a0', '#d8a880', '#a87850', '#6a4a30', '#e8eef4'],
  hair: ['#2a1a10', '#5a3a1a', '#d04a2a', '#e8d070', '#c8c8d0', '#1a1a2a', '#4a2a6a', '#3a8a5a', '#d070a0'],
  hairStyle: [['short', 'Короткие'], ['messy', 'Лохматые'], ['bob', 'Каре'], ['long', 'Длинные'], ['ponytail', 'Хвост'], ['twintail', 'Хвостики'], ['bun', 'Пучок'], ['spiky', 'Ёжик']],
  top: ['#4a6a9a', '#a83a3a', '#3a7a3a', '#6a3a8a', '#2a2a2a', '#d8c8a0', '#e07a20', '#f0f0f0'],
  bottom: ['#3a3a4a', '#4a3a2a', '#2a3a5a', '#1a1a1a', '#6a2a3a'],
  eyes: ['#3a2a5a', '#2a6a9a', '#3a8a4a', '#8a4a2a', '#b01020', '#7a2bd1'],
};
const Title = {
  t: 0, pages: [],
  show() {
    Game.state = 'title'; UI.showHUD(false); UI.closePanel(); UI.bossBar(null);
    Music.play('title');
    const sc = $('#screen'); sc.hidden = false; UI.screenOpen = true; sc.innerHTML = '';
    sc.style.background = 'linear-gradient(rgba(5,3,8,.15), rgba(5,3,8,.55) 55%, rgba(5,3,8,.9))';
    const slots = Save.slots();
    const col = h('div', { class: 'menu-col' });
    const latest = slots.filter(Boolean).sort((a, b) => (b.year * 200 + b.season * 30 + b.day) - (a.year * 200 + a.season * 30 + a.day))[0];
    if (latest) col.append(h('button', { class: 'btn green', onclick: () => this.load(latest.slot) }, `Продолжить · ${latest.name}, ${latest.day} ${SEASONS_GEN[latest.season]}`));
    col.append(h('button', { class: 'btn', onclick: () => this.newGame() }, 'Новая игра'));
    if (slots.filter(Boolean).length > 1) col.append(h('button', { class: 'btn', onclick: () => this.slotList() }, 'Загрузить'));
    col.append(h('button', { class: 'btn', onclick: () => this.importCode() }, 'Ввести код сохранения'));
    sc.append(
      h('div', { class: 'title-logo' }, 'BLACK SOILS', h('em', null, 'Чёрные Почвы')),
      h('div', { class: 'title-sub' }, 'Уютная ферма. Тёплая деревня. Колодец, который зовёт по ночам.'),
      col,
      h('div', { class: 'small-note' }, 'Хоррор-ферма · пародия и омаж на Stardew Valley и Black Souls · 16+'));
  },
  async load(slot) { const s = Save.read(slot); if (!s) { UI.note('Сохранение повреждено', 'bad'); return; } s.slot = slot; AU.unlock(); this.closeScreen(); Game.start(s); },
  closeScreen() { const sc = $('#screen'); sc.hidden = true; sc.innerHTML = ''; UI.screenOpen = false; },
  slotList() {
    const sc = $('#screen'); sc.innerHTML = '';
    const col = h('div', { class: 'menu-col' });
    Save.slots().forEach((s, i) => col.append(h('button', { class: 'btn' + (s ? ' green' : ''), disabled: !s, onclick: () => this.load(i + 1) }, s ? `Слот ${i + 1}: ${s.name} · ${s.day} ${SEASONS_GEN[s.season]}, год ${s.year} · ${U.fmt(s.money)}з` : `Слот ${i + 1}: пусто`)));
    col.append(h('button', { class: 'btn red', onclick: () => this.show() }, 'Назад'));
    sc.append(h('div', { class: 'ending-t' }, 'Загрузка'), col);
  },
  importCode() {
    const sc = $('#screen'); sc.innerHTML = '';
    const ta = h('textarea', { class: 'save', id: 'title-code', placeholder: 'Вставь код сохранения (BS1:...)', style: 'max-width:420px' });
    sc.append(h('div', { class: 'ending-t' }, 'Код сохранения'), ta, h('div', { class: 'menu-col' },
      h('button', { class: 'btn green', onclick: () => { const s = Save.importCode(ta.value); if (!s) { UI.note('Код не распознан', 'bad'); return; } s.slot = 1; AU.unlock(); this.closeScreen(); Game.start(s); } }, 'Загрузить'),
      h('button', { class: 'btn red', onclick: () => this.show() }, 'Назад')));
  },
  newGame() {
    AU.unlock();
    const sc = $('#screen'); sc.innerHTML = '';
    const look = { skin: LOOK_OPTS.skin[1], hair: LOOK_OPTS.hair[1], hairStyle: 'short', top: LOOK_OPTS.top[0], bottom: LOOK_OPTS.bottom[0], bottomStyle: 'pants', eyes: LOOK_OPTS.eyes[0], shoes: '#2a1a10' };
    let gender = 'm', name = '';
    const prev = h('canvas', { id: 'cc-preview', width: 64, height: 64 });
    const draw = () => {
      for (const k of [...SPR.keys()]) if (k.startsWith('ch:player') || k.startsWith('por:player')) SPR.delete(k);
      const g = prev.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 64, 64);
      const L = Object.assign({ id: 'player' }, look, { fem: gender === 'f', neck: gender === 'f' ? 'v' : null });
      g.drawImage(drawChar(L, 'down', 0), 0, 0, 16, 32, 16, 0, 32, 64);
    };
    const swatches = (key) => { const d = h('div', { class: 'opts' }); for (const c of LOOK_OPTS[key]) d.append(h('button', { class: 'sw' + (look[key] === c ? ' on' : ''), style: `background:${c};border-color:${look[key] === c ? '#c2142e' : '#3f2311'}`, 'aria-label': c, onclick: () => { look[key] = c; rebuild(); } })); return d; };
    const rebuild = () => {
      sc.innerHTML = '';
      const nameIn = h('input', { id: 'cc-name', maxlength: 14, placeholder: 'Имя', value: name, oninput: (e) => { name = e.target.value; } });
      const gen = h('div', { class: 'opts' }, ...[['m', 'Фермер'], ['f', 'Фермерша']].map(([v, t]) => h('button', { class: gender === v ? 'on' : '', onclick: () => { gender = v; if (v === 'f' && look.bottomStyle === 'pants') look.bottomStyle = 'skirt'; if (v === 'm' && look.bottomStyle === 'skirt') look.bottomStyle = 'pants'; rebuild(); } }, t)));
      const hs = h('div', { class: 'opts' }, ...LOOK_OPTS.hairStyle.map(([v, t]) => h('button', { class: look.hairStyle === v ? 'on' : '', onclick: () => { look.hairStyle = v; rebuild(); } }, t)));
      const bs = h('div', { class: 'opts' }, ...[['pants', 'Брюки'], ['skirt', 'Юбка'], ['long', 'Платье']].map(([v, t]) => h('button', { class: look.bottomStyle === v ? 'on' : '', onclick: () => { look.bottomStyle = v; rebuild(); } }, t)));
      sc.append(h('div', { class: 'ending-t', style: 'font-size:30px' }, 'Новый фермер'), prev,
        h('div', { class: 'cc' }, h('label', { for: 'cc-name' }, 'Имя'), nameIn, h('span', null, 'Кто ты'), gen, h('span', null, 'Кожа'), swatches('skin'), h('span', null, 'Волосы'), swatches('hair'), h('span', null, 'Причёска'), hs,
          h('span', null, 'Глаза'), swatches('eyes'), h('span', null, 'Рубашка'), swatches('top'), h('span', null, 'Низ'), swatches('bottom'), h('span', null, 'Фасон'), bs),
        h('div', { class: 'menu-col' }, h('button', { class: 'btn green', onclick: () => this.begin(name, gender, look) }, 'Начать'), h('button', { class: 'btn red', onclick: () => this.show() }, 'Назад')));
      draw();
    };
    rebuild();
  },
  begin(name, gender, look) {
    name = (name || '').trim() || (gender === 'f' ? 'Фермерша' : 'Фермер');
    const slots = Save.slots(); let slot = slots.findIndex(s => !s) + 1; if (!slot) slot = 1;
    const s = newSave({ name, gender, look }); s.slot = slot;
    this.closeScreen();
    Game.start(s);
  },
  // анимированная сцена на титульном экране
  draw(dt) {
    this.t += dt;
    const ctx = Render.ctx, c = Render.cv, W = c.width, H = c.height, Z = Render.Z;
    const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.imageSmoothingEnabled = false;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0a0614'); sky.addColorStop(.6, '#2a1430'); sky.addColorStop(1, '#3a1a1a');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 80; k++) { const x = U.hash(k, 1, 9) * W, y = U.hash(k, 2, 9) * H * .55; g.fillStyle = `rgba(255,255,255,${.3 + .5 * Math.abs(Math.sin(this.t + k))})`; g.fillRect(x, y, Z * .7, Z * .7); }
    g.fillStyle = '#f0e8d0'; g.beginPath(); g.arc(W * .78, H * .18, 18 * Z, 0, 7); g.fill(); g.fillStyle = '#2a1430'; g.beginPath(); g.arc(W * .78 + 7 * Z, H * .18 - 3 * Z, 16 * Z, 0, 7); g.fill();
    const gy = H * .72;
    g.fillStyle = '#120a0c'; g.beginPath(); g.moveTo(0, gy); for (let x = 0; x <= W; x += 8 * Z) g.lineTo(x, gy - Math.sin(x / (40 * Z)) * 6 * Z - U.hash(x, 3, 1) * 3 * Z); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    // деревья, колодец, пугало
    const old = S; if (!S) S = { season: 2, sanity: 20, maxSanity: 100, flags: {} };
    try {
      const tree = treeSprite('dead', 2); for (const [fx, s] of [[.08, 1.4], [.22, 1], [.9, 1.6]]) { const sz = Z * s * 2; g.globalAlpha = .9; g.drawImage(tree, W * fx - 16 * sz / 2, gy - 48 * sz + 6 * sz, 32 * sz, 48 * sz); }
      g.globalAlpha = 1;
      const well = objSprite({ t: 'well', hand: Math.floor(this.t * 1.5) % 5 === 0 }); const ws = Z * 3; g.drawImage(well, W * .5 - 16 * ws, gy - 36 * ws, 32 * ws, 40 * ws);
      const sc = objSprite({ t: 'scarecrow', creepy: true }); const ss = Z * 2.5; g.drawImage(sc, W * .28 - 8 * ss, gy - 30 * ss, 16 * ss, 32 * ss);
      const ms = monsterSprite('author', Math.floor(this.t * 2) % 2); const show = Math.sin(this.t * .7) > .85; if (show) { g.globalAlpha = .6; g.drawImage(ms, W * .7, gy - 52 * Z * 2, 32 * Z * 2, 52 * Z * 2); g.globalAlpha = 1; }
    } finally { S = old; }
    // летящие страницы
    if (this.pages.length < 14) this.pages.push({ x: Math.random() * W, y: -20, v: (.3 + Math.random() * .6) * Z * 20, r: Math.random() * 6 });
    for (const p of this.pages) { p.y += p.v * dt; p.x += Math.sin(this.t + p.r) * Z * .5; p.r += dt * 2; if (p.y > H) { p.y = -20; p.x = Math.random() * W; } g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = '#e8e2d4'; g.fillRect(-4 * Z, -5 * Z, 8 * Z, 10 * Z); g.fillStyle = '#555'; for (let k = 0; k < 3; k++) g.fillRect(-3 * Z, (-3 + k * 2) * Z, 6 * Z, Z * .6); g.restore(); }
  },
};

/* ---------- запуск ---------- */
let _lastT = 0, _errShown = false;
function frame(now) {
  const dt = Math.min(.05, (now - _lastT) / 1000 || 0); _lastT = now;
  try {
    if (Game.state === 'play') { UI.pollPanel(); if (!UI.panelOpen) Game.update(dt); else { Render.t += dt; UI.hud(); } UI.update(dt); Render.draw(); }
    else { Title.draw(dt); UI.update(dt); }
  } catch (e) {
    console.error(e);
    if (!_errShown) { _errShown = true; UI.note('Ошибка: ' + (e && e.message), 'bad'); setTimeout(() => _errShown = false, 5000); }
  }
  Input.endFrame();
  requestAnimationFrame(frame);
}
function boot() {
  Input.init(); UI.init(); Render.init();
  AU.vol.mus = Settings.music; AU.vol.sfx = Settings.sfx;
  document.addEventListener('visibilitychange', () => { if (document.hidden && AU.ctx) AU.ctx.suspend(); else if (AU.ctx) AU.ctx.resume(); });
  addEventListener('pointerdown', () => AU.unlock(), { once: false });
  Title.show();
  requestAnimationFrame(frame);
  window.__BS = { Game, World, P, get S() { return S; }, UI, Render, Input };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
