'use strict';
/* ============================================================
   ЧЁРНЫЕ ПОЧВЫ (BLACK SOILS) — ядро: утилиты, ввод, звук, хранилище
   ============================================================ */
const TS = 16;                 // размер тайла в пикселях
const $ = (s, r = document) => r.querySelector(s);
const U = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  rnd: (a, b) => a + Math.random() * (b - a),
  ri: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  chance: p => Math.random() < p,
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  hash(x, y, s = 0) { // детерминированный шум 0..1
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  },
  approach(v, t, d) { return v < t ? Math.min(v + d, t) : Math.max(v - d, t); },
  fmt(n) { return Math.floor(n).toLocaleString('ru-RU'); },
  plural(n, a, b, c) { n = Math.abs(n) % 100; const n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; },
  wchoice(list) { // [[weight, value], ...]
    let t = 0; for (const [w] of list) t += w;
    let r = Math.random() * t;
    for (const [w, v] of list) { if ((r -= w) <= 0) return v; }
    return list[list.length - 1][1];
  },
  sleep: ms => new Promise(r => setTimeout(r, ms)),
};
function RNG(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- безопасное хранилище ---------- */
const Store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};

/* ---------- ввод: клавиатура + сенсор ---------- */
const Input = {
  down: {}, hit: {}, joy: { x: 0, y: 0, on: false }, touch: false, lastHitTime: {},
  keymap: {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    Space: 'use', KeyJ: 'use', KeyC: 'use', KeyE: 'act', KeyK: 'act', Enter: 'act', KeyX: 'act', KeyF: 'act',
    ShiftLeft: 'roll', ShiftRight: 'roll', KeyL: 'roll', KeyI: 'menu', Tab: 'menu', Escape: 'esc', KeyQ: 'prev', KeyR: 'next',
    Digit1: 's0', Digit2: 's1', Digit3: 's2', Digit4: 's3', Digit5: 's4', Digit6: 's5', Digit7: 's6', Digit8: 's7', Digit9: 's8', Digit0: 's9', Minus: 's10', Equal: 's11',
  },
  press(a) { if (!this.down[a]) this.hit[a] = true; this.down[a] = true; },
  release(a) { this.down[a] = false; },
  endFrame() { this.hit = {}; },
  clear() { this.down = {}; this.hit = {}; this.joy.x = this.joy.y = 0; },
  axis() {
    let x = 0, y = 0;
    if (this.down.left) x -= 1; if (this.down.right) x += 1; if (this.down.up) y -= 1; if (this.down.down) y += 1;
    x += this.joy.x; y += this.joy.y;
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return { x, y };
  },
  init() {
    addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const a = this.keymap[e.code]; if (!a) return;
      e.preventDefault(); this.press(a); AU.unlock();
    });
    addEventListener('keyup', e => { const a = this.keymap[e.code]; if (a) this.release(a); });
    addEventListener('blur', () => this.clear());
    this.touch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
    // джойстик
    const zone = $('#joyzone'), base = $('#joybase'), knob = $('#joyknob');
    let jid = null, bx = 0, by = 0;
    const R = 46;
    const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px,${dy}px)`; };
    const start = (id, cx, cy) => {
      jid = id; const r = zone.getBoundingClientRect(); bx = cx; by = cy;
      base.style.left = (cx - r.left) + 'px'; base.style.top = (cy - r.top) + 'px'; base.style.opacity = '1'; setKnob(0, 0); this.joy.on = true;
    };
    const move = (cx, cy) => {
      let dx = cx - bx, dy = cy - by; const l = Math.hypot(dx, dy);
      if (l > R) { dx = dx / l * R; dy = dy / l * R; }
      setKnob(dx, dy);
      const m = Math.hypot(dx, dy) / R;
      if (m < 0.18) { this.joy.x = this.joy.y = 0; } else { this.joy.x = dx / R; this.joy.y = dy / R; }
    };
    const end = () => { jid = null; this.joy.x = this.joy.y = 0; this.joy.on = false; setKnob(0, 0); base.style.opacity = '.55'; };
    zone.addEventListener('touchstart', e => { e.preventDefault(); AU.unlock(); const t = e.changedTouches[0]; if (jid === null) start(t.identifier, t.clientX, t.clientY); }, { passive: false });
    zone.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === jid) move(t.clientX, t.clientY); }, { passive: false });
    const tend = e => { for (const t of e.changedTouches) if (t.identifier === jid) end(); };
    zone.addEventListener('touchend', tend); zone.addEventListener('touchcancel', tend);
    // мышь для теста
    let md = false;
    zone.addEventListener('mousedown', e => { md = true; start('m', e.clientX, e.clientY); });
    addEventListener('mousemove', e => { if (md) move(e.clientX, e.clientY); });
    addEventListener('mouseup', () => { if (md) { md = false; end(); } });
    // кнопки
    const bind = (id, act) => {
      const b = $(id);
      const on = e => { e.preventDefault(); AU.unlock(); this.press(act); b.classList.add('on'); };
      const off = e => { e.preventDefault(); this.release(act); b.classList.remove('on'); };
      b.addEventListener('touchstart', on, { passive: false }); b.addEventListener('touchend', off, { passive: false }); b.addEventListener('touchcancel', off);
      b.addEventListener('mousedown', on); b.addEventListener('mouseup', off); b.addEventListener('mouseleave', e => { if (this.down[act]) off(e); });
    };
    bind('#b-use', 'use'); bind('#b-act', 'act'); bind('#b-roll', 'roll');
    $('#b-menu').addEventListener('click', () => { AU.unlock(); this.hit.menu = true; });
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('contextmenu', e => e.preventDefault());
  },
};

/* ---------- звук: синтез WebAudio, без файлов ---------- */
const AU = {
  ctx: null, master: null, sfxG: null, musG: null, ok: false, vol: { sfx: 0.7, mus: 0.45 },
  unlock() {
    if (this.ok) { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      this.sfxG = this.ctx.createGain(); this.sfxG.gain.value = this.vol.sfx; this.sfxG.connect(this.master);
      this.musG = this.ctx.createGain(); this.musG.gain.value = this.vol.mus; this.musG.connect(this.master);
      const len = this.ctx.sampleRate * 1.0; this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.ok = true; Music.start();
    } catch (e) { this.ok = false; }
  },
  setVol(kind, v) { this.vol[kind] = v; if (!this.ok) return; (kind === 'sfx' ? this.sfxG : this.musG).gain.value = v; },
  tone(f, dur, type = 'square', vol = 0.15, slide = 0, delay = 0, dest = null, detune = 0) {
    if (!this.ok) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
    o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.2, freq = 1200, delay = 0, q = 1, type = 'lowpass') {
    if (!this.ok) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxG); s.start(t); s.stop(t + dur + 0.05);
  },
  sfx(name) {
    if (!this.ok) return;
    switch (name) {
      case 'step': this.noise(0.05, 0.05, 600); break;
      case 'hoe': this.noise(0.12, 0.35, 500); this.tone(90, 0.1, 'triangle', 0.2, -30); break;
      case 'water': this.noise(0.35, 0.18, 2200, 0, 2, 'bandpass'); this.noise(0.25, 0.1, 3500, 0.08, 3, 'bandpass'); break;
      case 'chop': this.noise(0.09, 0.4, 900); this.tone(160, 0.08, 'square', 0.12, -60); break;
      case 'pick': this.tone(900, 0.06, 'square', 0.1, -200); this.noise(0.08, 0.3, 3000, 0, 1, 'highpass'); break;
      case 'rockbreak': this.noise(0.3, 0.45, 700); this.tone(120, 0.2, 'triangle', 0.2, -60); break;
      case 'treefall': this.noise(0.6, 0.4, 400); this.tone(80, 0.5, 'sawtooth', 0.12, -40); break;
      case 'swing': this.noise(0.12, 0.18, 1800, 0, 2, 'bandpass'); break;
      case 'hit': this.tone(220, 0.1, 'square', 0.18, -120); this.noise(0.08, 0.25, 1500); break;
      case 'hurt': this.tone(300, 0.25, 'sawtooth', 0.2, -220); this.noise(0.15, 0.2, 800); break;
      case 'kill': this.tone(440, 0.08, 'square', 0.15, 300); this.tone(660, 0.12, 'square', 0.12, 400, 0.06); this.noise(0.2, 0.2, 2000, 0.05); break;
      case 'coin': this.tone(988, 0.07, 'square', 0.1); this.tone(1319, 0.18, 'square', 0.1, 0, 0.07); break;
      case 'pickup': this.tone(660, 0.06, 'triangle', 0.15, 200); this.tone(990, 0.08, 'triangle', 0.12, 0, 0.05); break;
      case 'plant': this.noise(0.08, 0.2, 900); this.tone(500, 0.06, 'sine', 0.1, 200, 0.03); break;
      case 'harvest': this.tone(520, 0.07, 'triangle', 0.18, 300); this.tone(780, 0.1, 'triangle', 0.14, 300, 0.06); break;
      case 'eat': for (let i = 0; i < 3; i++) this.noise(0.06, 0.25, 1400, i * 0.11); break;
      case 'drink': for (let i = 0; i < 3; i++) this.tone(300 + i * 80, 0.09, 'sine', 0.15, 120, i * 0.12); break;
      case 'door': this.noise(0.18, 0.25, 500); this.tone(140, 0.15, 'triangle', 0.12, -40); break;
      case 'menu': this.tone(700, 0.05, 'square', 0.07); break;
      case 'select': this.tone(880, 0.04, 'square', 0.06); break;
      case 'buy': this.tone(784, 0.06, 'square', 0.1); this.tone(1046, 0.1, 'square', 0.1, 0, 0.06); break;
      case 'error': this.tone(160, 0.18, 'square', 0.12); break;
      case 'text': this.tone(520 + Math.random() * 60, 0.025, 'square', 0.03); break;
      case 'textcreep': this.tone(90 + Math.random() * 40, 0.05, 'sawtooth', 0.05); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'square', 0.1, 0, i * 0.09)); break;
      case 'quest': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.14, 0, i * 0.08)); break;
      case 'heart': this.tone(660, 0.1, 'sine', 0.15); this.tone(880, 0.2, 'sine', 0.15, 0, 0.1); break;
      case 'cast': this.noise(0.25, 0.2, 2500, 0, 2, 'bandpass'); this.tone(400, 0.25, 'sine', 0.06, 600); break;
      case 'splash': this.noise(0.3, 0.3, 1500, 0, 1); break;
      case 'bite': this.tone(1200, 0.06, 'square', 0.15); this.tone(1200, 0.06, 'square', 0.15, 0, 0.1); break;
      case 'reel': this.tone(1500, 0.02, 'square', 0.03); break;
      case 'catch': [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.15, 0, i * 0.07)); break;
      case 'fail': this.tone(300, 0.3, 'triangle', 0.15, -200); break;
      case 'roll': this.noise(0.18, 0.18, 700); break;
      case 'bonfire': this.noise(1.2, 0.18, 600); this.tone(110, 1.2, 'sine', 0.12, 0); this.tone(165, 1.2, 'sine', 0.08, 0, 0.1); break;
      case 'died': this.tone(110, 2.5, 'sawtooth', 0.18, -60); this.tone(55, 3, 'sine', 0.25); this.noise(2.5, 0.1, 300); break;
      case 'scream': this.tone(900, 0.6, 'sawtooth', 0.15, -600); this.tone(1100, 0.5, 'square', 0.08, -800, 0.05); this.noise(0.5, 0.2, 3000, 0, 1, 'highpass'); break;
      case 'whisper': this.noise(1.2, 0.07, 3000, 0, 4, 'bandpass'); this.noise(1.0, 0.05, 1800, 0.3, 5, 'bandpass'); break;
      case 'heartbeat': this.tone(55, 0.12, 'sine', 0.35, -10); this.tone(50, 0.14, 'sine', 0.3, -10, 0.22); break;
      case 'glitch': for (let i = 0; i < 5; i++) this.tone(100 + Math.random() * 2000, 0.03, 'square', 0.06, 0, i * 0.03); break;
      case 'thunder': this.noise(2.2, 0.5, 200); this.noise(0.4, 0.3, 1200); break;
      case 'bomb': this.noise(0.8, 0.6, 400); this.tone(60, 0.6, 'sawtooth', 0.25, -30); break;
      case 'fuse': this.noise(1.5, 0.06, 4000, 0, 1, 'highpass'); break;
      case 'boss': this.tone(55, 1.5, 'sawtooth', 0.2, 0); this.tone(58, 1.5, 'sawtooth', 0.2, 0); this.noise(1.2, 0.2, 200); break;
      case 'souls': this.tone(1200, 0.4, 'sine', 0.06, -400); this.tone(1600, 0.3, 'sine', 0.04, -600, 0.05); break;
      case 'ship': this.noise(0.15, 0.2, 700); this.tone(300, 0.1, 'triangle', 0.1); break;
      case 'ribbit': this.tone(180, 0.08, 'square', 0.15, 120); this.tone(160, 0.1, 'square', 0.15, 150, 0.12); break;
      case 'shriek': this.tone(1400, 0.35, 'sawtooth', 0.12, 900); break;
      case 'magic': [880, 1175, 1568, 2093].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.08, 0, i * 0.06)); break;
    }
  },
};

/* ---------- процедурная музыка ---------- */
const Music = {
  cur: null, next: null, step: 0, t0: 0, timer: null, nextTime: 0,
  tracks: {
    title: { bpm: 72, root: 57, scale: [0, 2, 3, 5, 7, 8, 11], seed: 13, inst: 'box', bass: true, len: 32, density: .55 },
    day: { bpm: 112, root: 60, scale: [0, 2, 4, 7, 9], seed: 7, inst: 'pluck', bass: true, len: 32, density: .7 },
    town: { bpm: 104, root: 62, scale: [0, 2, 4, 5, 7, 9, 11], seed: 21, inst: 'pluck', bass: true, len: 32, density: .65 },
    night: { bpm: 70, root: 57, scale: [0, 2, 3, 7, 8], seed: 5, inst: 'box', bass: true, len: 32, density: .4 },
    indoor: { bpm: 90, root: 60, scale: [0, 4, 7, 9, 11], seed: 3, inst: 'box', bass: false, len: 16, density: .5 },
    dungeon: { bpm: 84, root: 45, scale: [0, 1, 3, 5, 7, 8, 10], seed: 9, inst: 'saw', bass: true, len: 32, density: .35, drone: true },
    boss: { bpm: 150, root: 45, scale: [0, 1, 3, 6, 7, 8, 11], seed: 66, inst: 'saw', bass: true, len: 32, density: .8, drone: true, drums: true },
    forest: { bpm: 96, root: 55, scale: [0, 2, 3, 5, 7, 10], seed: 31, inst: 'pluck', bass: true, len: 32, density: .5 },
    library: { bpm: 60, root: 52, scale: [0, 1, 4, 5, 7, 8, 11], seed: 404, inst: 'box', bass: true, len: 32, density: .45, drone: true },
    ending: { bpm: 66, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], seed: 99, inst: 'box', bass: true, len: 32, density: .5 },
    silence: null,
  },
  gen(tr) {
    const r = RNG(tr.seed); const mel = [], bas = [];
    let deg = 4;
    for (let i = 0; i < tr.len; i++) {
      if (r() < tr.density || i % 8 === 0) { deg += Math.floor(r() * 5) - 2; deg = U.clamp(deg, 0, tr.scale.length * 2 - 1); mel.push(deg); } else mel.push(null);
      bas.push(i % 4 === 0 ? (Math.floor(i / 8) % 2 === 0 ? 0 : (r() < .5 ? 3 : 4)) : null);
    }
    // вторая половина — вариация первой
    for (let i = tr.len / 2; i < tr.len; i++) if (r() < .5) mel[i] = mel[i - tr.len / 2];
    tr._mel = mel; tr._bas = bas;
  },
  play(name) {
    if (this.cur === name) return;
    this.cur = name; this.step = 0;
    if (AU.ok) this.nextTime = AU.ctx.currentTime + 0.1;
  },
  start() {
    if (this.timer) return;
    this.nextTime = AU.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 60);
  },
  freq(tr, deg, oct = 0) {
    const n = tr.scale.length; const o = Math.floor(deg / n); const s = tr.scale[((deg % n) + n) % n];
    return 440 * Math.pow(2, (tr.root + s + 12 * (o + oct) - 69) / 12);
  },
  tick() {
    if (!AU.ok || !this.cur) return;
    const tr = this.tracks[this.cur]; if (!tr) return;
    if (!tr._mel) this.gen(tr);
    const ctx = AU.ctx; const spb = 60 / tr.bpm / 2;
    const san = (typeof S !== 'undefined' && S && S.sanity !== undefined) ? S.sanity / Math.max(1, S.maxSanity) : 1;
    const insane = U.clamp((0.45 - san) / 0.45, 0, 1);
    while (this.nextTime < ctx.currentTime + 0.25) {
      const i = this.step % tr.len; const delay = Math.max(0, this.nextTime - ctx.currentTime);
      const det = insane > 0 ? (Math.random() - .5) * 120 * insane : 0;
      const m = tr._mel[i];
      if (m !== null && !(insane > .5 && Math.random() < insane * .35)) {
        const f = this.freq(tr, m, 0);
        if (tr.inst === 'box') { AU.tone(f * 2, spb * 3, 'sine', 0.07, 0, delay, AU.musG, det); AU.tone(f * 4, spb * 1.2, 'sine', 0.02, 0, delay, AU.musG, det); }
        else if (tr.inst === 'pluck') { AU.tone(f, spb * 1.6, 'triangle', 0.08, 0, delay, AU.musG, det); AU.tone(f * 2, spb * .6, 'square', 0.015, 0, delay, AU.musG, det); }
        else AU.tone(f, spb * 2, 'sawtooth', 0.025, 0, delay, AU.musG, det);
      }
      const b = tr._bas[i];
      if (tr.bass && b !== null) AU.tone(this.freq(tr, b, -2), spb * 3.5, 'triangle', 0.09, 0, delay, AU.musG, det * .5);
      if (tr.drone && i % 16 === 0) { AU.tone(this.freq(tr, 0, -2), spb * 16, 'sawtooth', 0.02, 0, delay, AU.musG, 7); AU.tone(this.freq(tr, 0, -2), spb * 16, 'sawtooth', 0.02, 0, delay, AU.musG, -9); }
      if (tr.drums) { if (i % 4 === 0) AU.tone(70, 0.15, 'sine', 0.25, -40, delay, AU.musG); if (i % 4 === 2) { AU.noise(0.06, 0.06, 6000, delay, 1, 'highpass'); } }
      if (insane > .6 && i % 8 === 0) { AU.tone(55, 0.12, 'sine', 0.2 * insane, -10, delay, AU.musG); AU.tone(50, 0.14, 'sine', 0.18 * insane, -10, delay + 0.22, AU.musG); }
      this.nextTime += spb; this.step++;
    }
  },
};

/* ---------- текст с родом: "{устал|устала}", @ — имя ---------- */
function T(s) {
  if (!s) return '';
  const fem = typeof S !== 'undefined' && S && S.gender === 'f';
  return s.replace(/\{([^|{}]*)\|([^|{}]*)\}/g, (m, a, b) => fem ? b : a).replace(/@/g, (typeof S !== 'undefined' && S && S.name) || 'Фермер');
}
function glitchText(s, amt) {
  if (amt <= 0) return s;
  const g = '▓▒░█#@&%Ж҉';
  return s.split('').map(c => (c !== ' ' && c !== '\n' && Math.random() < amt) ? g[Math.floor(Math.random() * g.length)] : c).join('');
}
