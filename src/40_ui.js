/* ============================================================
   Интерфейс (DOM): HUD, диалоги, меню, магазины, экраны
   ============================================================ */
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k]; if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(3)) if (c !== null && c !== undefined && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
function slotEl(st, opts = {}) {
  const b = h('button', { class: 'slot' + (opts.sel ? ' sel' : ''), onclick: opts.onclick, 'aria-label': st ? itemName(st) : 'пусто' });
  if (st) {
    b.append(h('img', { src: iconURL(st.id, st.of), alt: '' }));
    if (st.n > 1) b.append(h('span', { class: 'n' }, st.n));
    if (st.q) b.append(h('span', { class: 'q q' + st.q }));
    if (st.id === 'can') b.append(h('span', { class: 'bar2' }, h('i', { style: `width:${Math.round(S.water / [40, 55, 70, 85][S.tools.can || 0] * 100)}%` })));
    if (st.id === 'estus') b.append(h('span', { class: 'n' }, S.estus));
  }
  return b;
}
function itemInfo(st) {
  if (!st) return h('div', { class: 'info' }, h('span', { class: 'muted' }, 'Выбери предмет.'));
  const it = ITEMS[st.id]; const p = itemPrice(st);
  const lines = [];
  if (it.type === 'weapon') lines.push(`Урон: ${it.w.min}–${it.w.max} · Скорость: ${it.w.spd} · Крит: ${Math.round(it.w.crit * 100)}%`);
  if (it.type === 'tool') lines.push(`Уровень: ${TIER_NAMES[S.tools[it.tool] || 0]}${it.tool === 'can' ? ` · Вода: ${S.water}` : ''}`);
  const eff = []; if (it.e) eff.push(`${it.e > 0 ? '+' : ''}${it.e} эн.`); if (it.h) eff.push(`${it.h > 0 ? '+' : ''}${it.h} HP`); if (it.s) eff.push(`${it.s > 0 ? '+' : ''}${it.s} рассудка`);
  if (eff.length && ['food', 'crop', 'forage', 'fish', 'trash'].includes(it.type)) lines.push('Съесть: ' + eff.join(', '));
  if (p) lines.push(`Цена: ${p}з` + (st.q ? (st.q === 2 ? ' (золото)' : ' (серебро)') : ''));
  return h('div', { class: 'info' }, h('h3', null, itemName(st)), h('div', null, T(it.d || '')), lines.map(l => h('div', { class: 'muted' }, l)));
}

const UI = {
  chain: Promise.resolve(), dlg: null, typing: null, openT: 0, panelOpen: false, screenOpen: false, notesEl: null,
  init() {
    this.notesEl = $('#notes');
    const ic = { '#ic-hp': 'heart', '#ic-en': 'bolt', '#ic-sn': 'eye', '#ic-soul': 'soul', '#ic-estus': 'estus', '#ic-gold': 'coin', '#b-act-ico': 'hand', '#b-roll-ico': 'roll' };
    for (const k in ic) { const e = $(k); if (e) e.src = uiIconURL(ic[k]); }
  },
  layout() {
    const w = innerWidth; const slot = Math.max(26, Math.min(44, Math.floor((w - 24) / 12) - 2));
    document.documentElement.style.setProperty('--slot', slot + 'px');
    document.documentElement.style.setProperty('--tb-h', (slot + 14) + 'px');
  },
  modal() { return !!this.dlg || this.panelOpen || this.screenOpen; },
  showHUD(on) {
    $('#hud').hidden = !on;
    const touch = Settings.touch === 'on' || (Settings.touch === 'auto' && Input.touch);
    $('#touch').hidden = !(on && touch);
  },
  hud() {
    if (!S) return;
    const set = (id, v) => { const e = $(id + ' i'); e.style.width = Math.max(0, Math.min(100, v * 100)) + '%'; };
    set('#bar-hp', S.hp / S.maxHp); set('#bar-en', Math.max(0, S.energy) / S.maxEnergy); set('#bar-sn', S.sanity / S.maxSanity);
    $('#bar-sn').classList.toggle('low', S.sanity < S.maxSanity * .3);
    const t = Math.floor(S.time / 10) * 10, hh = Math.floor(t / 60) % 24, mm = t % 60;
    const wIcon = { sun: '☀', rain: '☂', storm: '⚡', snow: '❄' }[S.weather] || '';
    const dateTxt = `${WEEKDAYS[(S.absDay - 1) % 7]}. ${S.day} ${SEASONS_GEN[S.season]}`;
    if (this._d !== dateTxt) { this._d = dateTxt; $('#c-date').textContent = dateTxt; }
    const tt = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${wIcon}`; if (this._t !== tt) { this._t = tt; $('#c-time').textContent = tt; }
    const g = U.fmt(S.money) + ' з'; if (this._g !== g) { this._g = g; $('#v-gold').textContent = g; }
    const so = U.fmt(S.souls), es = `${S.estus}/${S.estusMax}`; if (this._s !== so + es) { this._s = so + es; $('#v-souls').textContent = so; $('#v-estus').textContent = es; }
    document.documentElement.style.setProperty('--gs', String(U.clamp((0.5 - S.sanity / S.maxSanity) * 2, 0, .85).toFixed(2)));
    const st = selStack(); const key = st ? st.id + ':' + (st.id === 'estus' ? S.estus : '') + ':' + (S.tools[ITEMS[st.id] && ITEMS[st.id].tool] || 0) : 'none';
    if (this._u !== key) { this._u = key; $('#b-use-ico').src = st ? iconURL(st.id, st.of) : uiIconURL('hand'); }
  },
  toolbar() {
    if (!S) return;
    const tb = $('#toolbar'); tb.innerHTML = '';
    for (let i = 0; i < 12; i++) tb.append(slotEl(S.inv[i], { sel: i === S.sel, onclick: (e) => { e.stopPropagation(); AU.unlock(); Player.select(i); UI.toolbar(); } }));
    this._u = null;
  },
  note(text, cls = '', whisper = false, icon = null) {
    if (!this.notesEl) return;
    text = T(text);
    if (whisper) { text = glitchText(text, S && S.sanity < 20 ? .15 : 0); }
    const n = h('div', { class: 'note ' + cls }, icon ? h('img', { src: iconURL(icon), alt: '' }) : null, h('span', null, text));
    if (whisper) n.style.fontStyle = 'italic';
    this.notesEl.prepend(n);
    while (this.notesEl.children.length > 4) this.notesEl.lastChild.remove();
    setTimeout(() => { n.style.transition = 'opacity .6s'; n.style.opacity = '0'; setTimeout(() => n.remove(), 700); }, whisper ? 2500 : 3800);
  },
  pickNote(id, n, q, of) {
    const last = this.notesEl && this.notesEl.firstChild;
    const name = itemName({ id, of, q });
    if (last && last.dataset.pick === id + (of || '') && Date.now() - last.dataset.t < 2500) { last.dataset.n = +last.dataset.n + n; last.querySelector('span').textContent = `+${last.dataset.n} ${name}`; last.dataset.t = Date.now(); return; }
    const el = h('div', { class: 'note' }, h('img', { src: iconURL(id, of), alt: '' }), h('span', null, `+${n} ${name}`));
    el.dataset.pick = id + (of || ''); el.dataset.n = n; el.dataset.t = Date.now();
    this.notesEl.prepend(el); while (this.notesEl.children.length > 4) this.notesEl.lastChild.remove();
    setTimeout(() => { el.style.transition = 'opacity .6s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 700); }, 2600);
  },
  locName(name) { const e = $('#locname'); e.textContent = name; e.classList.add('on'); clearTimeout(this._ln); this._ln = setTimeout(() => e.classList.remove('on'), 2200); },
  fade(on, ms = 450) { const f = $('#fade'); f.style.transitionDuration = ms + 'ms'; f.classList.toggle('on', on); return U.sleep(ms + 20); },
  bossBar(mo) {
    let b = $('#bossbar');
    if (!mo) { if (b) b.remove(); this._boss = null; return; }
    if (!b) { b = h('div', { id: 'bossbar', style: 'position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--tb-h) + 178px);width:min(520px,80%);text-align:center;pointer-events:none;font-family:var(--f-title);color:#f3efe8;text-shadow:0 2px 0 #000' }, h('div', { id: 'bossname', style: 'font-size:20px;letter-spacing:.05em' }), h('div', { style: 'height:8px;background:#200;border:1px solid #000;margin-top:4px' }, h('div', { id: 'bosshp', style: 'height:100%;background:linear-gradient(#ff4050,#900);width:100%' }))); $('#hud').append(b); }
    $('#bossname').textContent = mo.def.n; this._boss = mo;
  },
  update(dt) {
    if (this._boss) { const e = $('#bosshp'); if (e) e.style.width = Math.max(0, this._boss.hp / this._boss.maxHp * 100) + '%'; }
    const d = this.dlg; if (!d) return;
    this.openT += dt;
    if (this.porWho && !$('#dlg-por').hidden) {
      this.porT += dt;
      const talk = d.typing && Math.floor(this.porT * 9) % 2 === 1;
      const blink = (this.porT % 3.4) > 3.25;
      const key = (talk ? 1 : 0) + (blink ? 2 : 0);
      if (key !== this._porKey) { this._porKey = key; this.drawPortrait(talk, blink); }
    }
    if (d.typing) {
      d.shown += dt * (d.creep ? 30 : 48) * (Input.down.use || Input.down.act ? 3 : 1);
      const n = Math.floor(d.shown);
      if (n !== d.lastN) {
        d.lastN = n; const txt = d.full.slice(0, n);
        d.textEl.textContent = d.glitch ? glitchText(txt, d.glitch) : txt;
        if (n % 2 === 0) AU.sfx(d.creep ? 'textcreep' : 'text');
      }
      if (n >= d.full.length) { d.typing = false; d.textEl.textContent = d.glitch ? glitchText(d.full, d.glitch * .5) : d.full; if (d.choices) this.showChoices(d); }
    }
    if (this.openT > .18) {
      const go = Input.hit.act || Input.hit.use || Input.hit.esc;
      if (d.choices && !d.typing) {
        const bs = [...$('#dlg-choices').children];
        if (Input.hit.down || Input.hit.right) { d.ci = (d.ci + 1) % bs.length; bs[d.ci].focus(); }
        if (Input.hit.up || Input.hit.left) { d.ci = (d.ci + bs.length - 1) % bs.length; bs[d.ci].focus(); }
        for (let k = 0; k < bs.length; k++) if (Input.hit['s' + k]) { this.pick(d, k); return; }
        if (Input.hit.act || Input.hit.use) this.pick(d, d.ci);
      } else if (go) this.advance();
    }
  },
  drawPortrait(talk, blink) {
    const cv = $('#dlg-cv'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, cv.width, cv.height);
    const c = portrait(this.porWho, this.porEmo, talk, blink); g.drawImage(c, 0, 0, c.width, c.height, 0, 0, cv.width, cv.height);
  },
  advance() {
    const d = this.dlg; if (!d) return;
    if (d.typing) { d.shown = d.full.length; return; }
    if (d.choices) return;
    this.closeDlg(); d.res();
  },
  pick(d, k) { AU.sfx('menu'); this.closeDlg(); d.res(k); },
  closeDlg() { this.dlg = null; $('#dlg').hidden = true; Input.clear(); },
  _dialog(o) {
    return new Promise(res => {
      const box = $('#dlg'); box.hidden = false; box.className = 'frame' + (o.narr ? ' narr' : (o.creep ? ' creepy' : ''));
      const por = $('#dlg-por');
      if (o.who && !o.narr) {
        por.hidden = false; this.porWho = o.who; this.porEmo = o.emo || 'neutral'; this.porT = 0; this.drawPortrait(false, false);
      } else por.hidden = true;
      const name = o.narr ? '' : (o.who ? (o.who === 'marysue' ? 'Мэри Сью' : o.who === 'zhmur' ? 'Жмуримо' : o.who === 'grandpa' ? 'Дед' : o.who === 'fairy' ? 'Фея Листик' : (NPCS[o.who] ? (NPCS[o.who].short || NPCS[o.who].n) : o.who)) : '');
      $('#dlg-name').textContent = name;
      $('#dlg-choices').innerHTML = '';
      $('#dlg-next').style.display = o.choices ? 'none' : '';
      const textEl = $('#dlg-text');
      const glitch = S && S.sanity < 25 && !o.narr ? (25 - S.sanity) / 120 : 0;
      this.dlg = { full: o.text || '', shown: 0, lastN: -1, typing: !!(o.text), textEl, choices: o.choices, kill: o.kill, ci: 0, res, creep: o.creep || o.emo === 'creepy', glitch };
      textEl.textContent = '';
      if (!o.text && o.choices) this.showChoices(this.dlg);
      this.openT = 0;
      box.onclick = (e) => { if (e.target.tagName !== 'BUTTON') this.advance(); };
    });
  },
  showChoices(d) {
    const c = $('#dlg-choices'); c.innerHTML = '';
    d.choices.forEach((t, k) => c.append(h('button', { class: k === d.kill ? 'kill' : '', onclick: (e) => { e.stopPropagation(); this.pick(d, k); } }, t)));
  },
  queue(fn) { const p = this.chain.then(fn); this.chain = p.catch(() => { }); return p; },
  say(who, text, emo) { return this.queue(() => this._dialog({ who, text: T(text), emo, creep: emo === 'creepy' })); },
  narr(text) { return this.queue(() => this._dialog({ narr: true, text: T(text) })); },
  choose(text, opts, kill = -1) { return this.queue(() => this._dialog({ text: T(text || ''), choices: opts, kill })); },
  /* ---------- полноэкранные ---------- */
  screen(build) {
    return new Promise(res => {
      const sc = $('#screen'); sc.innerHTML = ''; sc.hidden = false; this.screenOpen = true;
      const close = (v) => { sc.hidden = true; sc.innerHTML = ''; this.screenOpen = false; Input.clear(); res(v); };
      build(sc, close);
    });
  },
  letter(text, cursed) {
    return this.queue(() => this.screen((sc, close) => {
      sc.style.background = 'rgba(8,6,6,.92)';
      sc.append(h('div', { class: 'letter' + (cursed ? ' cursed' : '') }, T(text)), h('button', { class: 'btn', onclick: () => { AU.sfx('menu'); close(); } }, 'Закрыть'));
      AU.sfx('menu');
    }));
  },
  cinema(lines, dark) {
    return this.queue(() => this.screen((sc, close) => {
      sc.style.background = '#000'; let i = 0;
      const p = h('div', { class: 'ending-p', style: 'min-height:40vh;display:flex;align-items:center;justify-content:center;transition:opacity .4s' });
      const btn = h('button', { class: 'btn', style: 'margin-top:18px' }, 'Далее');
      const show = () => { p.style.opacity = 0; setTimeout(() => { p.textContent = T(lines[i]); p.style.opacity = 1; if (dark) AU.sfx('whisper'); }, 200); };
      btn.onclick = () => { AU.sfx('menu'); i++; if (i >= lines.length) close(); else show(); };
      sc.append(p, btn); show();
    }));
  },
  async daySummary(lines, total, info) {
    return this.screen((sc, close) => {
      sc.style.background = 'var(--ink)';
      const box = h('div', { class: 'summary frame' }, h('h2', null, `${S.day} ${SEASONS_GEN[S.season]}, год ${S.year}`));
      if (lines.length) { box.append(h('div', { style: 'font-weight:700;margin-bottom:4px' }, 'Отгружено:')); const list = h('div', { class: 'list', style: 'max-height:36vh;overflow:auto' }); for (const [n, c, v, id, of] of lines) list.append(h('div', { class: 'li' }, h('img', { src: iconURL(id, of), alt: '' }), h('div', { class: 't' }, h('b', null, n), h('small', null, '×' + c)), h('div', { class: 'p' }, v + 'з'))); box.append(list); }
      else box.append(h('div', { class: 'muted' }, 'Сегодня ничего не отгружено.'));
      box.append(h('div', { class: 'tot' }, `Итого: +${U.fmt(total)}з`));
      const extra = [];
      if (info.lost) extra.push(`Потеряно: ${info.lost}з (${info.kind === 'breakdown' ? 'лечение нервов' : 'тебя нашли без сознания'})`);
      if (info.dead) extra.push(`Сезон сменился: завяло растений — ${info.dead}.`);
      if (info.lonely) extra.push(T('Ты ни с кем не говорил{|а} вчера. Одиночество давит: рассудок −6.'));
      if (info.crows) extra.push(`Вороны поклевали урожай: ${info.crows}. Поставь пугало!`);
      for (const t of info.nightEv || []) extra.push(t);
      if (S.weather !== 'sun') extra.push(`Сегодня: ${{ rain: 'дождь — грядки политы сами', storm: 'гроза', snow: 'снег' }[S.weather] || ''}`);
      for (const t of extra) box.append(h('div', { style: 'margin-top:6px;font-size:13px' }, t));
      sc.append(box, h('button', { class: 'btn green', onclick: () => { AU.sfx('menu'); close(); } }, 'Новый день'));
      AU.sfx('coin');
    });
  },
  youDied(souls, gold) {
    return this.screen((sc, close) => {
      sc.style.background = 'radial-gradient(ellipse at center, rgba(40,0,0,.85), #000)';
      sc.append(h('div', { class: 'died' }, 'ТЫ ПОГИБ' + (S.gender === 'f' ? 'ЛА' : '')));
      const sub = h('div', { class: 'ending-p', style: 'opacity:0;transition:opacity 1s' }, `Души потеряны: ${souls}${souls && World.cur.depth ? ` — их можно вернуть с пятна крови на ${World.cur.depth}-м этаже` : ''}.\nЗолото: −${gold}.\n\n${U.pick(['Попробуй перекатываться.', 'Восхвали солнце. Потом встань.', 'Пей эстус заранее.', 'Это просто глава. Перепиши её.', 'Git gud. (Это не я, это рукопись.)'])}`);
      const btn = h('button', { class: 'btn', style: 'opacity:0;transition:opacity 1s', onclick: () => { AU.sfx('menu'); close(); } }, 'Очнуться');
      sc.append(sub, btn);
      setTimeout(() => { sub.style.opacity = 1; btn.style.opacity = 1; }, 1800);
    });
  },
  ending(title, text, kind) {
    return this.queue(() => this.screen((sc, close) => {
      sc.style.background = kind === 'good' ? 'radial-gradient(ellipse at top, #3a2a1a, #0a0606)' : 'radial-gradient(ellipse at center, #1a0006, #000)';
      Music.play('ending');
      sc.append(h('div', { class: 'ending-t' }, title), h('div', { class: 'ending-p' }, T(text)));
      const credits = h('div', { class: 'credits', style: 'margin-top:12px;opacity:.85' }, 'ЧЁРНЫЕ ПОЧВЫ\nХоррор-ферма. Пародия и омаж на Stardew Valley и Black Souls.\nКонцовок открыто: ' + Object.keys(S.endings).filter(k => ['cozy', 'true', 'author', 'sin', 'scarecrow'].includes(k)).length + ' из 5');
      credits.style.whiteSpace = 'pre-wrap';
      sc.append(credits, h('button', { class: 'btn green', onclick: () => { AU.sfx('menu'); close(); } }, 'Продолжить игру'));
    }));
  },
  /* ---------- панели ---------- */
  panel(title, build, tabs, tabIdx = 0) {
    const pn = $('#panel'); pn.innerHTML = ''; pn.hidden = false; this.panelOpen = true; Input.clear();
    const win = h('div', { class: 'win frame', role: 'dialog' });
    const head = h('div', { class: 'win-h' }, h('h2', null, title), h('button', { class: 'x', 'aria-label': 'Закрыть', onclick: () => this.closePanel() }, '✕'));
    win.append(head);
    const body = h('div', { class: 'win-b' });
    if (tabs) {
      const tb = h('div', { class: 'tabs' });
      tabs.forEach((t, i) => tb.append(h('button', { class: i === tabIdx ? 'on' : '', onclick: () => { AU.sfx('menu'); this.panel(title, build, tabs, i); } }, t)));
      win.append(tb);
    }
    win.append(body); pn.append(win);
    pn.onclick = (e) => { if (e.target === pn) this.closePanel(); };
    build(body, tabIdx, () => this.panel(title, build, tabs, tabIdx));
    this._esc = () => this.closePanel();
  },
  closePanel() { $('#panel').hidden = true; $('#panel').innerHTML = ''; this.panelOpen = false; Input.clear(); UI.toolbar(); },
  pollPanel() { if (this.panelOpen && (Input.hit.esc || Input.hit.menu)) { this.closePanel(); Input.endFrame(); } },
  /* ---------- главное меню ---------- */
  openMenu(tab = 0) {
    AU.sfx('menu');
    this.panel('Меню', (b, ti, re) => [this.tabInv, this.tabCraft, this.tabQuests, this.tabRel, this.tabSkills, this.tabSys][ti].call(this, b, re), ['Рюкзак', 'Крафт', 'Задания', 'Жители', 'Навыки', 'Система'], tab);
  },
  tabInv(b, re) {
    let sel = this._invSel ?? -1;
    const grid = h('div', { class: 'grid' });
    for (let i = 0; i < S.invSize; i++) grid.append(slotEl(S.inv[i], {
      sel: i === sel, onclick: () => {
        if (sel >= 0 && sel !== i) { const t = S.inv[sel]; S.inv[sel] = S.inv[i]; S.inv[i] = t; this._invSel = -1; AU.sfx('select'); re(); return; }
        this._invSel = sel === i ? -1 : i; AU.sfx('select'); re();
      }
    }));
    const st = sel >= 0 ? S.inv[sel] : null;
    const actions = h('div', { class: 'row' });
    if (st) {
      const it = ITEMS[st.id];
      if (it.type === 'food' || (it.e && ['crop', 'forage', 'fish', 'trash'].includes(it.type))) actions.append(h('button', { class: 'btn green', onclick: () => { Items.eat(st); this._invSel = -1; re(); } }, it.drink ? 'Выпить' : 'Съесть'));
      if (it.type === 'use') actions.append(h('button', { class: 'btn green', onclick: () => { this.closePanel(); Items.useSpecial(st); } }, 'Использовать'));
      if (it.type === 'note') actions.append(h('button', { class: 'btn green', onclick: () => { this.closePanel(); Events.readBottle(st); } }, 'Прочитать'));
      if (sel >= 12) actions.append(h('button', { class: 'btn', onclick: () => { for (let k = 0; k < 12; k++) if (!S.inv[k]) { S.inv[k] = st; S.inv[sel] = null; break; } this._invSel = -1; re(); } }, 'В панель'));
      if (!it.key && it.type !== 'tool' && it.type !== 'estus') actions.append(h('button', { class: 'btn red', onclick: async () => { if (this._trash !== sel) { this._trash = sel; re(); return; } S.inv[sel] = null; this._trash = null; this._invSel = -1; AU.sfx('error'); re(); } }, this._trash === sel ? 'Точно выбросить?' : 'Выбросить'));
    }
    actions.append(h('button', { class: 'btn', onclick: () => { this.sortInv(); this._invSel = -1; re(); } }, 'Сортировать'));
    const stats = h('div', { class: 'kv', style: 'margin-top:8px' },
      h('b', null, 'Здоровье'), `${Math.round(S.hp)}/${S.maxHp}`, h('b', null, 'Энергия'), `${Math.round(S.energy)}/${S.maxEnergy}`, h('b', null, 'Рассудок'), `${Math.round(S.sanity)}/${S.maxSanity}`,
      h('b', null, 'Души'), `${S.souls} (ур. ${S.soulLvl})`, h('b', null, 'Страницы'), `${S.pages.length}/7`, h('b', null, 'Грех'), String(S.sin), h('b', null, 'Срывы'), `${S.breakdowns}/3`,
      h('b', null, 'Колодец'), `глубина ${S.wellMax}`, h('b', null, 'Золото'), U.fmt(S.money) + 'з');
    b.append(grid, itemInfo(st), actions, stats);
  },
  sortInv() {
    const tb = S.inv.slice(0, 12), rest = S.inv.slice(12).filter(Boolean);
    const order = ['tool', 'weapon', 'estus', 'seed', 'crop', 'forage', 'fish', 'food', 'artisan', 'res', 'mineral', 'gem', 'place', 'fert', 'use', 'misc', 'key', 'note', 'trash'];
    rest.sort((a, b) => order.indexOf(ITEMS[a.id].type) - order.indexOf(ITEMS[b.id].type) || a.id.localeCompare(b.id));
    S.inv = tb.concat(rest); while (S.inv.length < S.invSize) S.inv.push(null);
  },
  tabCraft(b, re) {
    const list = h('div', { class: 'list' });
    for (const [id, r] of Object.entries(RECIPES)) {
      const locked = (r.need && skillLvl(r.need[0]) < r.need[1]) || (r.flag && !S.flags[r.flag]);
      const can = !locked && Object.entries(r.in).every(([k, n]) => Inv.has(k, n));
      const reqTxt = Object.entries(r.in).map(([k, n]) => `${ITEMS[k].n} ${Inv.count(k)}/${n}`).join(' · ');
      list.append(h('div', { class: 'li' + (locked ? ' dis' : '') }, h('img', { src: iconURL(id), alt: '' }),
        h('div', { class: 't' }, h('b', null, ITEMS[id].n + (r.out > 1 ? ' ×' + r.out : '')), h('small', null, locked ? (r.need ? `Нужно: ${SKILLS[r.need[0]]} ${r.need[1]}` : 'Рецепт неизвестен') : reqTxt), h('small', null, T(ITEMS[id].d))),
        h('button', { class: 'btn' + (can ? ' green' : ''), disabled: !can, onclick: () => { if (!Inv.canAdd(id)) { UI.note('Нет места в рюкзаке.', 'bad'); AU.sfx('error'); return; } for (const [k, n] of Object.entries(r.in)) Inv.remove(k, n); Inv.add(id, r.out); AU.sfx('buy'); re(); } }, 'Создать')));
    }
    b.append(list);
  },
  tabQuests(b) {
    const list = h('div', { class: 'list' });
    if (S.board && S.board.accepted && !S.board.done) list.append(h('div', { class: 'li' }, h('img', { src: iconURL('letter'), alt: '' }), h('div', { class: 't' }, h('b', null, 'Заказ с доски'), h('small', null, S.board.text), h('small', null, S.board.kind === 'bring' ? `Есть: ${Inv.count(S.board.item)}/${S.board.n}` : `Прогресс: ${qp(S.board.key) - S.board.base}/${S.board.n}`), h('small', null, `Награда: ${S.board.reward}з · до ${S.board.until - S.absDay > 0 ? S.board.until - S.absDay + ' дн.' : 'сегодня'}`))));
    for (const id of S.quests.active) { const q = QUESTS[id]; list.append(h('div', { class: 'li' }, h('img', { src: iconURL(id === 'q_pages' || id === 'q_author' ? 'page' : 'letter'), alt: '' }), h('div', { class: 't' }, h('b', null, q.t), h('small', null, T(q.d)), h('small', null, q.prog()), h('small', null, 'Награда: ' + q.rt)))); }
    if (!S.quests.active.length) list.append(h('div', { class: 'muted' }, 'Нет активных заданий.'));
    b.append(list);
    if (S.quests.done.length) b.append(h('div', { style: 'margin-top:10px;font-weight:700' }, 'Выполнено:'), h('div', { class: 'muted', style: 'font-size:13px' }, S.quests.done.map(id => QUESTS[id].t).join(' · ')));
  },
  tabRel(b) {
    const list = h('div', { class: 'list' });
    for (const id of SOCIAL) {
      const r = S.rel[id]; const def = NPCS[id];
      if (!r || !r.met) { list.append(h('div', { class: 'li dis' }, h('div', { class: 't' }, h('b', null, '???'), h('small', null, 'Ещё не знакомы')))); continue; }
      const hv = hearts(id); const max = def.romance ? 10 : 10;
      const hs = '♥'.repeat(hv) + '♡'.repeat(Math.max(0, max - hv));
      const img = h('img', { src: portrait(id, hv >= 6 && def.romance ? 'blush' : 'neutral').toDataURL(), alt: '', style: 'width:52px;height:52px;background:#e9c98a;border-radius:6px;border:2px solid #6b4a2a' });
      const status = S.spouse === id ? ' · супруг(а)' : S.dating === id ? ' · встречаетесь' : S.fiance === id ? ' · помолвка' : '';
      list.append(h('div', { class: 'li' }, img, h('div', { class: 't' }, h('b', null, (def.short || def.n) + status), h('small', null, def.title + (def.bday ? ` · ДР: ${def.bday[1]} ${SEASONS_GEN[def.bday[0]]}` : '')), h('span', { class: 'hearts' }, hs), h('small', null, `${r.talked ? 'Говорили сегодня' : 'Не говорили сегодня'} · Подарков за неделю: ${r.week}/2${def.romance ? ' · романтика' : ''}`))));
    }
    b.append(list);
  },
  tabSkills(b) {
    for (const [k, n] of Object.entries(SKILLS)) {
      const l = skillLvl(k); const pips = h('div', { class: 'pips' }); for (let i = 0; i < 10; i++) pips.append(h('i', { class: i < l ? 'on' : '' }));
      b.append(h('div', { class: 'sk' }, h('b', null, `${n} ${l}`), pips), h('div', { class: 'muted', style: 'font-size:12px;margin:-2px 0 8px' }, SKILL_PERKS[k]));
    }
    b.append(h('div', { style: 'font-weight:700;margin-top:10px' }, 'Душа (повышается у костров в Колодце):'),
      h('div', { class: 'kv' }, h('b', null, 'Живучесть'), String(S.lvl.vig), h('b', null, 'Выносливость'), String(S.lvl.end), h('b', null, 'Сила'), String(S.lvl.str), h('b', null, 'Вера'), String(S.lvl.fth)));
    const ends = { cozy: 'Уютная ферма', true: 'Чистый лист', author: 'Новый Автор', sin: 'Грешник', scarecrow: 'Пугало' };
    b.append(h('div', { style: 'font-weight:700;margin-top:10px' }, 'Концовки:'), h('div', { class: 'muted', style: 'font-size:13px' }, Object.entries(ends).map(([k, v]) => (S.endings[k] ? '✓ ' + v : '? ???')).join(' · ')));
  },
  tabSys(b, re) {
    const code = h('textarea', { class: 'save', id: 'savecode', readonly: true, 'aria-label': 'Код сохранения' });
    const inp = h('textarea', { class: 'save', id: 'loadcode', placeholder: 'Вставь код сохранения сюда', 'aria-label': 'Загрузить код' });
    const vol = (label, key, kind) => h('label', { style: 'display:flex;gap:8px;align-items:center;font-size:13px;margin:4px 0' }, label, h('input', { type: 'range', min: 0, max: 1, step: .05, value: Settings[key], id: 'vol-' + key, oninput: (e) => { Settings[key] = +e.target.value; AU.setVol(kind, Settings[key]); saveSettings(); } }));
    b.append(
      h('div', { class: 'row' }, h('button', { class: 'btn green', onclick: () => { Save.write(); } }, 'Сохранить сейчас'), h('button', { class: 'btn', onclick: () => { code.value = Save.exportCode(); code.select(); try { navigator.clipboard.writeText(code.value).then(() => UI.note('Код скопирован'), () => { }); } catch (e) { } } }, 'Код сохранения')),
      h('div', { class: 'muted', style: 'font-size:12px;margin:6px 0' }, 'Игра сохраняется, когда ты ложишься спать. Код сохранения можно скопировать и перенести на другое устройство.'),
      code, inp,
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { const s = Save.importCode(inp.value); if (!s) { UI.note('Код не распознан', 'bad'); return; } this.closePanel(); s.slot = S.slot; Game.start(s); } }, 'Загрузить код')),
      vol('Музыка', 'music', 'mus'), vol('Звуки', 'sfx', 'sfx'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => { Settings.zoom = Settings.zoom >= 1.4 ? .8 : +(Settings.zoom + .2).toFixed(1); saveSettings(); Render.resize(); re(); } }, `Масштаб: ${Settings.zoom}`),
        h('button', { class: 'btn', onclick: () => { Settings.touch = Settings.touch === 'auto' ? 'on' : Settings.touch === 'on' ? 'off' : 'auto'; saveSettings(); this.showHUD(true); re(); } }, `Сенсорные кнопки: ${{ auto: 'авто', on: 'вкл', off: 'выкл' }[Settings.touch]}`),
        h('button', { class: 'btn', onclick: () => { Settings.cursor = !Settings.cursor; saveSettings(); re(); } }, `Рамка цели: ${Settings.cursor ? 'вкл' : 'выкл'}`)),
      h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { this.closePanel(); Title.show(); } }, 'В главное меню')),
      h('div', { class: 'muted', style: 'font-size:12px;margin-top:8px' }, 'Управление: WASD/стрелки — ходить · Пробел/J — инструмент (удерживай для зарядки) · E/K — взаимодействие · Shift/L — кувырок · 1–0 — слоты · Q/R — листать · I/Esc — меню.'));
  },
  /* ---------- сундук ---------- */
  openChest(o) {
    o.items = o.items || []; while (o.items.length < 36) o.items.push(null);
    this.panel('Сундук', (b, ti, re) => {
      const cg = h('div', { class: 'grid' }); o.items.forEach((st, i) => cg.append(slotEl(st, { onclick: () => { if (!st) return; if (Inv.add(st.id, st.n, st.q, st.of, true)) { o.items[i] = null; AU.sfx('select'); re(); } else UI.note('Рюкзак полон'); } })));
      const ig = h('div', { class: 'grid' }); for (let i = 0; i < S.invSize; i++) { const st = S.inv[i]; ig.append(slotEl(st, { onclick: () => { if (!st) return; const it = ITEMS[st.id]; if (it.type === 'tool' || it.type === 'estus') { UI.note('Инструменты лучше держать при себе.'); return; } let k = o.items.findIndex(x => x && x.id === st.id && (x.q || 0) === (st.q || 0) && x.of === st.of); if (k >= 0) o.items[k].n += st.n; else { k = o.items.indexOf(null); if (k < 0) { UI.note('Сундук полон'); return; } o.items[k] = st; } S.inv[i] = null; AU.sfx('select'); re(); } })); }
      b.append(h('div', { class: 'muted', style: 'margin-bottom:4px' }, 'Сундук (нажми, чтобы забрать):'), cg, h('div', { class: 'muted', style: 'margin:10px 0 4px' }, 'Рюкзак (нажми, чтобы положить):'), ig);
    });
  },
  /* ---------- отгрузка ---------- */
  openShip() {
    this.panel('Ящик для отгрузки', (b, ti, re) => {
      const ig = h('div', { class: 'grid' });
      for (let i = 0; i < S.invSize; i++) { const st = S.inv[i]; const ok = st && itemPrice(st) > 0 && !ITEMS[st.id].key; ig.append(slotEl(st, { onclick: () => { if (!ok) { if (st) UI.note('Это нельзя продать.'); return; } const k = S.bin.findIndex(x => x.id === st.id && (x.q || 0) === (st.q || 0) && x.of === st.of); if (k >= 0) S.bin[k].n += st.n; else S.bin.push(Object.assign({}, st)); S.inv[i] = null; AU.sfx('ship'); re(); } })); }
      const total = S.bin.reduce((a, s) => a + itemPrice(s) * s.n, 0);
      const bl = h('div', { class: 'list', style: 'margin-top:8px' });
      S.bin.forEach((st, k) => bl.append(h('div', { class: 'li' }, h('img', { src: iconURL(st.id, st.of), alt: '' }), h('div', { class: 't' }, h('b', null, itemName(st)), h('small', null, '×' + st.n)), h('div', { class: 'p' }, itemPrice(st) * st.n + 'з'), h('button', { class: 'btn', onclick: () => { if (Inv.add(st.id, st.n, st.q, st.of, true)) { S.bin.splice(k, 1); re(); } } }, 'Вернуть'))));
      b.append(h('div', { class: 'muted' }, 'Нажми на предмет, чтобы положить весь стак. Деньги придут утром.'), ig, bl, h('div', { class: 'tot', style: 'font-weight:700;margin-top:8px;color:#8a5a00' }, `В ящике на сумму: ${U.fmt(total)}з`));
    });
  },
  /* ---------- доска ---------- */
  openBoard() {
    const bd = S.board;
    this.panel('Доска объявлений', (b, ti, re) => {
      if (!bd) { b.append(h('div', { class: 'muted' }, 'Пусто. Только объявление: «Пропал кот. Улыбается. Не подходите».')); return; }
      b.append(h('div', { class: 'letter', style: 'margin:0 auto' }, bd.text + `\n\nНаграда: ${bd.reward}з\nСрок: ${bd.until - S.absDay} дн.`));
      if (bd.done) b.append(h('div', { class: 'info' }, 'Выполнено! Спасибо.'));
      else if (bd.accepted) b.append(h('div', { class: 'info' }, 'Заказ принят. Смотри в «Задания».'));
      else b.append(h('div', { class: 'row', style: 'justify-content:center' }, h('button', { class: 'btn green', onclick: () => { bd.accepted = true; bd.base = bd.key ? qp(bd.key) : 0; AU.sfx('quest'); UI.note('Заказ принят', 'good'); re(); } }, 'Принять заказ')));
    });
  },
  /* ---------- наборы ---------- */
  openBundles() {
    this.panel('Алтарь Жмуримо', (b, ti, re) => {
      let room = null;
      for (const bd of BUNDLES) {
        if (bd.room !== room) { room = bd.room; b.append(h('div', { style: 'font-weight:700;margin:8px 0 4px' }, room + (Bundles.roomDone(room) ? ' ✓' : ''))); }
        const st = S.bundles[bd.id] || { got: {} };
        const req = h('div', { class: 'req' });
        bd.req.forEach(([id, n], k) => {
          const got = st.got && st.got[k];
          if (id === '$') { req.append(h('button', { class: 'btn' + (got ? '' : ' green'), disabled: !!got, onclick: () => { Bundles.give(bd, k); re(); } }, got ? `${n}з ✓` : `Отдать ${U.fmt(n)}з`)); return; }
          const have = Inv.count(id);
          const s = slotEl({ id, n }, { onclick: () => { if (got) return; Bundles.give(bd, k); re(); } });
          s.classList.add(got ? 'got' : have >= n ? 'have' : 'x'); s.title = `${ITEMS[id].n} ×${n} (есть ${have})`; if (!got && have < n) s.style.opacity = '.45';
          req.append(s);
        });
        const rw = bd.reward[0];
        const rwTxt = rw === 'bridge' ? 'Починка моста' : rw === 'rodup' ? 'Улучшение удочки' : rw === 'money_room' ? 'Фонарь Жмуримо' : `${ITEMS[rw].n} ×${bd.reward[1]}`;
        b.append(h('div', { class: 'bundle' + (st.done ? ' done' : '') }, h('h4', null, bd.n + (st.done ? ' — собрано' : '')), req, h('div', { class: 'muted', style: 'font-size:12px;margin-top:4px' }, 'Награда: ' + rwTxt + (bd.room === 'Кладовая' ? ' · вся Кладовая → Оранжерея' : ''))));
      }
      b.append(h('div', { class: 'muted', style: 'font-size:12px' }, 'Нажми на слот, если предмет есть в рюкзаке. Жмуримо принимают любое качество.'));
    });
  },
  /* ---------- готовка ---------- */
  openCooking() {
    this.panel('Готовка', (b, ti, re) => {
      const list = h('div', { class: 'list' });
      for (const [id, r] of Object.entries(COOKING)) {
        const known = S.recipes[id];
        if (!known) { list.append(h('div', { class: 'li dis' }, h('div', { class: 't' }, h('b', null, '??? (рецепт неизвестен)'), h('small', null, 'Рецепты: ТВ по воскресеньям, письма, таверна.')))); continue; }
        const can = Object.entries(r.in).every(([k, n]) => Inv.has(k, n));
        const nm = k => k === 'any:fish' ? 'любая рыба' : k === 'any:mushroom' ? 'любые грибы' : ITEMS[k].n;
        list.append(h('div', { class: 'li' }, h('img', { src: iconURL(id), alt: '' }), h('div', { class: 't' }, h('b', null, ITEMS[id].n), h('small', null, Object.entries(r.in).map(([k, n]) => `${nm(k)} ${Inv.count(k)}/${n}`).join(' · ')), h('small', null, T(ITEMS[id].d))),
          h('button', { class: 'btn' + (can ? ' green' : ''), disabled: !can, onclick: () => { if (!Inv.canAdd(id)) { UI.note('Нет места в рюкзаке.', 'bad'); AU.sfx('error'); return; } for (const [k, n] of Object.entries(r.in)) Inv.remove(k, n); Inv.add(id, 1); AU.sfx('eat'); re(); } }, 'Готовить')));
      }
      b.append(list);
    });
  },
  /* ---------- костёр ---------- */
  openBonfire(o) {
    if (!S.bonfires.includes(o.floor)) { S.bonfires.push(o.floor); AU.sfx('bonfire'); Render.flash = .5; Render.flashCol = '#ffa040'; UI.note('КОСТЁР ЗАЖЖЁН', 'good'); }
    this.panel('Костёр · этаж ' + o.floor, (b, ti, re) => {
      const cost = Math.round(80 * Math.pow(1.14, S.soulLvl));
      b.append(h('div', { class: 'info' }, `Души: ${U.fmt(S.souls)} · Уровень души: ${S.soulLvl} · Следующий уровень: ${cost} душ`));
      b.append(h('div', { class: 'row' },
        h('button', { class: 'btn green', disabled: !!o.rested, onclick: () => { o.rested = true; S.hp = S.maxHp; S.estus = S.estusMax; Sanity.add(20); AU.sfx('bonfire'); UI.note('Ты отдыхаешь у костра. HP и эстус восстановлены, рассудок +20.', 'good'); re(); } }, o.rested ? 'Ты уже отдохнул{|а}'.replace('{|а}', S.gender === 'f' ? 'а' : '') : 'Отдохнуть')));
      const stats = [['vig', 'Живучесть', '+8 к макс. HP, −1% урона'], ['end', 'Выносливость', '+15 к макс. энергии'], ['str', 'Сила', '+6% урона'], ['fth', 'Вера', '+6 к макс. рассудку, медленнее безумие']];
      const list = h('div', { class: 'list', style: 'margin-top:8px' });
      for (const [k, n, d] of stats) list.append(h('div', { class: 'li' }, h('div', { class: 't' }, h('b', null, `${n}: ${S.lvl[k]}`), h('small', null, d)), h('button', { class: 'btn' + (S.souls >= cost ? ' green' : ''), disabled: S.souls < cost, onclick: () => {
        S.souls -= cost; S.soulLvl++; S.lvl[k]++; AU.sfx('levelup');
        if (k === 'vig') { S.maxHp += 8; S.hp += 8; } if (k === 'end') { S.maxEnergy += 15; S.energy += 15; } if (k === 'fth') { S.maxSanity += 6; S.sanity += 6; }
        re();
      } }, `+1 (${cost})`)));
      b.append(h('div', { style: 'font-weight:700;margin-top:8px' }, 'Повысить уровень'), list);
      const warp = h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { this.closePanel(); World.warp('farm', 33, 6, 'down'); } }, 'На поверхность'));
      for (const f of [...S.bonfires].sort((a, b) => a - b)) if (f !== o.floor) warp.append(h('button', { class: 'btn', onclick: () => { this.closePanel(); Events._toBonfire(f); } }, `Этаж ${f}`));
      b.append(h('div', { style: 'font-weight:700;margin-top:8px' }, 'Перенестись'), warp);
    });
  },
};
Events._toBonfire = async function (n) {
  AU.sfx('door'); await UI.fade(true); World.enter('well:' + n);
  const m = World.cur; const b = m.objs.find(o => o && o.t === 'bonfire'); if (b) { const p = nearestFree(m, b.x, b.y + 1) || { x: b.x, y: b.y + 1 }; P.x = p.x * 16 + 8; P.y = p.y * 16 + 12; Render.snapCamera(); }
  await UI.fade(false);
};

/* ---------- магазины ---------- */
const SHOPS = {
  pierrot: { n: 'Лавка Пьеро', sells: ['crop', 'forage', 'fish', 'artisan', 'seed', 'food'], stock: () => [...SEED_SHOP[S.season], 'fert', 'torch', ...(SOCIAL.some(id => S.rel[id] && hearts(id) >= 8 && NPCS[id].romance) ? ['bouquet'] : [])] },
  rosa: { n: 'Таверна «Безумное чаепитие»', sells: ['fish', 'artisan', 'food'], stock: () => ['beer', 'pizza', 'salad', 'tea', 'spaghetti', 'coffee'], recipes: { hell_soup: 300, fish_pie: 500, borscht: 400, berry_pie: 600 } },
  eva: { n: 'Клиника', sells: [], stock: () => ['medkit', 'pills', 'jojacola'] },
  lilith: { n: 'Хижина ведьмы', sells: ['forage', 'crop'], stock: () => [...(S.season !== 3 ? ['mandrake_seed'] : []), 'growpot', 'qfert', 'clarity', 'returnpot', ...((S.flags.drinkme || 0) < 3 ? ['drinkme'] : [])] },
  klim: { n: 'Кузница Клима', sells: ['res', 'gem', 'mineral'], stock: () => ['copper_ore', 'coal', 'stone', 'wood', ...(S.wellMax >= 10 ? ['iron_ore'] : []), ...(S.wellMax >= 20 ? ['gold_ore'] : []), 'cleaver', ...(S.flags.boss10 ? ['iron_sword'] : [])] },
  grobus: { n: 'Гробус, тень-торговец', sells: ['res', 'gem', 'mineral', 'misc'], stock: () => ['pendant', 'bomb', ...((S.flags.shards || 0) < 3 ? ['estus_shard'] : []), 'essence', ...(S.flags.brokenBought ? [] : ['broken'])] },
  cheshire: { n: 'Повозка Чешира', sells: ['fish'], stock: () => { const r = RNG(S.absDay * 7 + 3); const pool = ['eatme', 'drinkme', 'quartz', 'ruby', 'emerald', 'moonstone', 'tea', 'coffee', 'qfert', 'growpot', ...SEED_SHOP[(S.season + 1) % 4], ...SEED_SHOP[(S.season + 2) % 4]].filter(Boolean); const out = []; while (out.length < 5 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]); return out; } },
};
const Shops = {
  counter(m, o) {
    const id = o.shop; const sh = SHOPS[id]; if (!sh) return false;
    const n = m.npcs.find(x => x.id === id && !x.path && U.dist(x.x, x.y, P.x, P.y) < 72);
    if (!n) { const def = NPCS[id]; UI.say(null, `Никого нет. ${def.hours ? `Часы работы: ${String(def.hours[0]).slice(0, -2)}:00–${String(def.hours[1] % 2400).slice(0, -2) || '0'}:00` : ''}${id === 'pierrot' && (S.absDay - 1) % 7 === 2 ? ' (по средам закрыто)' : ''}`); return true; }
    this.menu(id, n); return true;
  },
  async menu(id, n) {
    const sh = SHOPS[id]; const opts = ['Купить'];
    if (sh.sells.length) opts.push('Продать');
    if (id === 'klim') opts.push('Улучшить инструмент', 'Вскрыть жеоду (25з)', S.flags.kitchen ? null : 'Ремонт дома');
    if (id === 'pierrot' && S.invSize < 36) opts.push(S.invSize < 24 ? 'Рюкзак: 24 слота (2000з)' : 'Рюкзак: 36 слотов (10000з)');
    if (sh.recipes) opts.push('Рецепты');
    opts.push('Поговорить', 'Уйти');
    const list = opts.filter(Boolean);
    if (id === 'klim' && S.upgrading && S.upgrading.day <= S.absDay) { const u = S.upgrading; S.upgrading = null; S.tools[u.tool] = u.tier; Inv.give(u.tool, 1); _urlCache.clear(); for (const k of [...SPR.keys()]) if (k.startsWith('icon:')) SPR.delete(k); await UI.say('klim', `...Готово. ${ITEMS[u.tool].n}: ${TIER_NAMES[u.tier].toLowerCase()} уровень. Держи.`, 'happy'); UI.toolbar(); return; }
    const c = await UI.choose(`${sh.n}`, list);
    const o = list[c];
    if (o === 'Купить') this.open(id);
    else if (o === 'Продать') this.sell(id);
    else if (o === 'Поговорить') Social.talk(n, true);
    else if (o === 'Улучшить инструмент') this.upgrade();
    else if (o && o.startsWith('Вскрыть')) this.geode();
    else if (o === 'Ремонт дома') this.house();
    else if (o && o.startsWith('Рюкзак')) { const cost = S.invSize < 24 ? 2000 : 10000; if (S.money < cost) { UI.note('Не хватает золота', 'bad'); return; } S.money -= cost; S.invSize += 12; while (S.inv.length < S.invSize) S.inv.push(null); AU.sfx('buy'); UI.note(`Рюкзак: ${S.invSize} слотов!`, 'good'); }
    else if (o === 'Рецепты') this.recipes(id);
  },
  open(id) {
    const sh = SHOPS[id];
    UI.panel(sh.n, (b, ti, re) => {
      b.append(h('div', { class: 'info', style: 'margin:0 0 8px' }, `Золото: ${U.fmt(S.money)}з`));
      const list = h('div', { class: 'list' });
      for (const it of sh.stock()) {
        const price = BUY_PRICE[it] || ITEMS[it].p * 2 || 50;
        const pr = id === 'cheshire' && ITEMS[it].type === 'seed' ? price * 2 : price;
        const buy = (k) => {
          if (S.money < pr * k) { UI.note('Не хватает золота', 'bad'); AU.sfx('error'); return; }
          const isOnce = ['broken', 'drinkme', 'estus_shard'].includes(it);
          for (let i = 0; i < k; i++) { if (!Inv.add(it, 1, 0, undefined, true)) { UI.note('Рюкзак полон', 'bad'); break; } S.money -= pr; if (it === 'broken') S.flags.brokenBought = 1; if (it === 'drinkme') S.flags.drinkme = (S.flags.drinkme || 0) + 1; if (it === 'estus_shard') S.flags.shards = (S.flags.shards || 0) + 1; if (isOnce) break; }
          AU.sfx('buy'); re();
        };
        const multi = ['seed', 'res', 'fert', 'food'].includes(ITEMS[it].type) || it === 'torch' || it === 'bomb';
        list.append(h('div', { class: 'li' }, h('img', { src: iconURL(it), alt: '' }), h('div', { class: 't' }, h('b', null, ITEMS[it].n), h('small', null, T(ITEMS[it].d))), h('div', { class: 'p' }, pr + 'з'),
          h('button', { class: 'btn' + (S.money >= pr ? ' green' : ''), onclick: () => buy(1) }, '×1'), multi ? h('button', { class: 'btn' + (S.money >= pr * 5 ? ' green' : ''), onclick: () => buy(5) }, '×5') : null));
      }
      b.append(list);
    });
  },
  sell(id) {
    const sh = SHOPS[id];
    UI.panel(sh.n + ' · продажа', (b, ti, re) => {
      b.append(h('div', { class: 'info', style: 'margin:0 0 8px' }, `Золото: ${U.fmt(S.money)}з · Здесь покупают: ${sh.sells.map(t => ({ crop: 'урожай', forage: 'дары леса', fish: 'рыбу', artisan: 'заготовки', seed: 'семена', food: 'еду', res: 'ресурсы', gem: 'самоцветы', mineral: 'минералы', misc: 'диковинки' })[t]).join(', ')}`));
      const list = h('div', { class: 'list' });
      for (let i = 0; i < S.invSize; i++) {
        const st = S.inv[i]; if (!st) continue; const it = ITEMS[st.id];
        if (!sh.sells.includes(it.type) || it.key) continue;
        const pr = id === 'pierrot' && it.type === 'seed' ? Math.floor(it.p / 2) : itemPrice(st); if (pr <= 0) continue;
        list.append(h('div', { class: 'li' }, h('img', { src: iconURL(st.id, st.of), alt: '' }), h('div', { class: 't' }, h('b', null, itemName(st)), h('small', null, '×' + st.n)), h('div', { class: 'p' }, pr + 'з'),
          h('button', { class: 'btn green', onclick: () => { S.money += pr; S.earned += pr; Inv.takeAt(i, 1); AU.sfx('coin'); re(); } }, '×1'),
          st.n > 1 ? h('button', { class: 'btn green', onclick: () => { S.money += pr * st.n; S.earned += pr * st.n; S.inv[i] = null; AU.sfx('coin'); re(); } }, 'Всё') : null));
      }
      if (!list.children.length) list.append(h('div', { class: 'muted' }, 'Нечего продать здесь.'));
      b.append(list);
    });
  },
  async upgrade() {
    if (S.upgrading) { await UI.say('klim', `...Работаю над ${ITEMS[S.upgrading.tool].n.toLowerCase()}. Приходи ${S.upgrading.day - S.absDay > 0 ? 'через ' + (S.upgrading.day - S.absDay) + ' дн.' : 'завтра'}.`); return; }
    UI.panel('Улучшение инструментов', (b, ti, re) => {
      const list = h('div', { class: 'list' });
      for (const tool of ['hoe', 'can', 'axe', 'pick']) {
        const t = S.tools[tool] || 0; const nx = t + 1; const c = UPGRADE_COST[nx];
        if (!c) { list.append(h('div', { class: 'li done' }, h('img', { src: iconURL(tool), alt: '' }), h('div', { class: 't' }, h('b', null, ITEMS[tool].n), h('small', null, 'Максимальный уровень')))); continue; }
        const can = S.money >= c.g && Inv.has(c.bar, 5) && Inv.has(tool);
        list.append(h('div', { class: 'li' }, h('img', { src: iconURL(tool), alt: '' }), h('div', { class: 't' }, h('b', null, `${ITEMS[tool].n} → ${TIER_NAMES[nx]}`), h('small', null, `${c.g}з + ${ITEMS[c.bar].n} ×5 (есть ${Inv.count(c.bar)}) · 2 дня`), h('small', null, tool === 'hoe' || tool === 'can' ? 'Удерживай кнопку для обработки нескольких клеток' : 'Больше урона по деревьям/камням')),
          h('button', { class: 'btn' + (can ? ' green' : ''), disabled: !can, onclick: () => { S.money -= c.g; Inv.remove(c.bar, 5); const i = S.inv.findIndex(s => s && s.id === tool); S.inv[i] = null; S.upgrading = { tool, tier: nx, day: S.absDay + 2 }; AU.sfx('buy'); UI.closePanel(); UI.say('klim', '...Принял. Два дня. Без него обойдёшься.'); } }, 'Улучшить')));
      }
      b.append(list);
    });
  },
  async geode() {
    if (!Inv.has('geode')) { UI.say('klim', '...Жеоды нет. Ищи в колодце.'); return; }
    if (S.money < 25) { UI.note('Нужно 25з', 'bad'); return; }
    S.money -= 25; Inv.remove('geode', 1);
    const it = U.wchoice(GEODE_LOOT); const n = ['coal', 'iron_ore', 'gold_ore', 'clay'].includes(it) ? U.ri(2, 5) : 1;
    AU.sfx('rockbreak'); Inv.give(it, n);
    await UI.say('klim', `...Тресь. Внутри: ${ITEMS[it].n}${n > 1 ? ' ×' + n : ''}.${it === 'stoneeye' ? ' Не смотри в него.' : ''}`);
    if (Inv.has('geode')) this.geode();
  },
  async house() {
    const c = await UI.choose('Ремонт дома: кухня и место для второй половинки. 10 000з + 300 дерева. Готово завтра.', ['Заказать', 'Нет']);
    if (c !== 0) return;
    if (S.money < 10000 || !Inv.has('wood', 300)) { UI.say('klim', '...Денег или дерева мало. Приходи потом.'); return; }
    S.money -= 10000; Inv.remove('wood', 300); S.flags.kitchen = 1; World.maps.house.put(7, 2, { t: 'kitchen' });
    AU.sfx('buy'); UI.say('klim', '...Сделаю. Кухня будет. Не сожги.');
  },
  recipes(id) {
    const sh = SHOPS[id];
    UI.panel('Рецепты', (b, ti, re) => {
      const list = h('div', { class: 'list' });
      for (const [r, pr] of Object.entries(sh.recipes)) {
        const known = S.recipes[r];
        list.append(h('div', { class: 'li' + (known ? ' done' : '') }, h('img', { src: iconURL(r), alt: '' }), h('div', { class: 't' }, h('b', null, 'Рецепт: ' + ITEMS[r].n), h('small', null, T(ITEMS[r].d))), h('div', { class: 'p' }, known ? 'изучен' : pr + 'з'),
          known ? null : h('button', { class: 'btn' + (S.money >= pr ? ' green' : ''), onclick: () => { if (S.money < pr) return; S.money -= pr; S.recipes[r] = 1; AU.sfx('buy'); re(); } }, 'Купить')));
      }
      b.append(list, h('div', { class: 'muted', style: 'font-size:12px;margin-top:6px' }, 'Готовить можно на кухне (ремонт у Клима) или в походном котелке (крафт).'));
    });
  },
};
