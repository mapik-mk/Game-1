/* ============================================================
   Персонажи: спрайты 16x32, портреты 64x64, монстры
   ============================================================ */
const OUTLINE = '#1d1214';

// pose: { step: 0..3 (шаг), br: 0/1 (дыхание), bl: 0/1 (моргание), arm: ''|'up'|'fwd'|'hold' }
// Пропорции как у фермера Stardew: голова 12px, плечи с руками 12px, ноги 3px, ботинки 2px.
function drawChar(L, dir, pose = {}) {
  if (typeof pose === 'number') pose = { step: [0, 1, 0, 3][pose] || 0 };
  const step = pose.step | 0, br = pose.br | 0, bl = pose.bl | 0, arm = pose.arm || '';
  const key = `ch:${L.id || JSON.stringify(L)}:${dir}:${step}:${br}:${bl}:${arm}`;
  return spr(key, () => {
    const sk = L.skin || '#f2c6a0', skD = mix(sk, '#a8545a', .3), skDD = mix(sk, '#7a3444', .5), skL = shade(sk, .18);
    const hr = L.hair || '#3a2a1a', hrD = shade(hr, -.3), hrDD = shade(hr, -.48), hrL = shade(hr, .28), hrLL = shade(hr, .5);
    const top = L.top || '#4a6a9a', topD = shade(top, -.24), topDD = shade(top, -.4), topL = shade(top, .2);
    const bot = L.bottom || '#3a3a4a', botD = shade(bot, -.25), botL = shade(bot, .16), shoe = L.shoes || '#2a1a10', shoeL = shade(shoe, .35);
    const fem = !!L.fem, st = L.hairStyle || 'short', ghost = !!L.ghost, bs = L.bottomStyle || 'pants';
    const longHair = ['long', 'veil', 'wavy'].includes(st);
    const bare = L.sleeve === 'none', sl = bare ? sk : top, slD = bare ? skD : topD;
    const lo = new PX(16, 32), bk = new PX(16, 32), up = new PX(16, 32);
    const dy = (step === 1 || step === 3 ? -1 : 0) + (br ? 1 : 0);
    const lift = step === 1 ? 'l' : step === 3 ? 'r' : '';
    const sw = arm ? 0 : (step === 1 ? 1 : step === 3 ? -1 : 0);
    const rows = (p, list, col, colL, colD) => { for (const [y, a, b] of list) { p.hl(a, b, y, col); if (colL) p.p(a, y, colL); if (colD) p.p(b, y, colD); } };
    const legsSkin = L.legs || sk;
    const side = dir === 'left' || dir === 'right';
    const back = dir === 'up';
    if (!side) {
      /* ---------- ноги ---------- */
      const ly = lift === 'l' ? 1 : 0, ry = lift === 'r' ? 1 : 0;
      if (ghost) {
        for (let y = 23; y < 32; y++) { const a = 230 - (y - 23) * 26; for (let x = 4; x <= 11; x++) if (!(y > 27 && (x + y + step) % 3 === 0)) lo.p(x, y, bot, Math.max(30, a)); }
      } else {
        const lc = bs === 'pants' ? bot : legsSkin, lcD = bs === 'pants' ? botD : shade(legsSkin, -.15), lcL = bs === 'pants' ? botL : shade(legsSkin, .1);
        for (let y = 24; y <= 29 - ly; y++) { lo.hl(5, 7, y, lc); lo.p(5, y, lcL); }
        for (let y = 24; y <= 29 - ry; y++) { lo.hl(8, 10, y, lc); lo.p(10, y, lcD); lo.p(9, y, y > 26 ? lcD : lc); }
        if (bs === 'pants') { lo.vl(7, 24, 25, botD); lo.vl(8, 24, 25, botD); }
        lo.hl(5, 7, 30 - ly, shoe); lo.hl(4, 7, 31 - ly, shoe); lo.p(5, 30 - ly, shoeL);
        lo.hl(8, 10, 30 - ry, shoe); lo.hl(8, 11, 31 - ry, shoe); lo.p(8, 30 - ry, shoeL);
      }
      /* ---------- волосы за спиной (вид спереди) ---------- */
      if (!back) {
        if (longHair) { for (let y = 8; y <= 23; y++) { const w = st === 'wavy' ? Math.round(Math.sin(y * .7)) : 0; bk.hl(1 + w, 14 + w, y, y > 20 ? hrD : hr); bk.p(14 + w, y, hrD); } }
        if (st === 'twintail') { const s2 = step === 1 ? 1 : step === 3 ? -1 : 0; for (let y = 6; y <= 21; y++) { const o = y > 14 ? s2 : 0; bk.hl(0 - o, 1 - o, y, hr); bk.p(1 - o, y, hrD); bk.hl(14 + o, 15 + o, y, hr); bk.p(15 + o, y, hrD); } }
        if (st === 'ponytail') { const s2 = step === 1 ? 1 : step === 3 ? -1 : 0; for (let y = 3; y <= 15; y++) { bk.p(14 + (y > 10 ? s2 : 0), y, hr); bk.p(15 + (y > 10 ? s2 : 0), y, hrD); } }
      }
      const p = up;
      /* ---------- туловище ---------- */
      const torso = fem ? [[16, 5, 10], [17, 4, 11], [18, 4, 11], [19, 4, 11], [20, 5, 10], [21, 5, 10], [22, 4, 11], [23, 4, 11]]
        : [[16, 4, 11], [17, 4, 11], [18, 4, 11], [19, 4, 11], [20, 4, 11], [21, 4, 11], [22, 4, 11], [23, 4, 11]];
      for (const [y, a, b] of torso) { p.hl(a, b, y, top); p.p(a, y, topL); p.p(b, y, topD); if (b - 1 > a) p.p(b - 1, y, y > 19 ? topD : top); }
      p.hl(5, 10, 23, topD);
      if (!back) {
        if (L.neck === 'v') { p.hl(6, 9, 16, sk); p.hl(7, 8, 17, sk); if (fem) p.p(7, 18, skD); }
        else if (L.neck === 'corset') { p.hl(5, 10, 16, sk); p.hl(5, 10, 17, sk); p.p(5, 18, sk); p.p(10, 18, sk); p.p(7, 18, skDD); p.p(8, 18, skD); p.p(6, 17, skL); for (let y = 19; y <= 22; y++) p.p(7 + (y % 2), y, shade(top, .55)); }
        else if (L.neck === 'bunny') { p.hl(4, 11, 16, sk); p.hl(4, 11, 17, sk); p.p(7, 17, skDD); p.p(5, 17, skL); p.hl(4, 11, 18, shade(top, .12)); p.p(7, 15, '#fff'); p.p(8, 15, '#fff'); p.p(7, 16, '#d02030'); p.p(8, 16, '#d02030'); }
        else if (L.neck === 'collar') { p.hl(6, 9, 16, '#ffffff'); p.p(7, 17, '#ffffff'); }
        else if (L.neck === 'ruff') { p.hl(3, 12, 15, '#ffffff'); p.hl(4, 11, 16, '#e4e4ea'); p.p(5, 15, '#d0d0d8'); p.p(9, 15, '#d0d0d8'); p.p(7, 19, '#111'); p.p(7, 21, '#111'); }
        else { p.hl(6, 9, 16, topL); p.p(7, 16, skD); p.p(8, 16, skD); p.p(7, 19, topD); p.p(7, 21, topD); }
        if (L.apron) { p.r(5, 18, 6, 6, L.apron); p.vl(5, 18, 23, shade(L.apron, .2)); p.hl(5, 10, 18, shade(L.apron, -.2)); p.vl(10, 18, 23, shade(L.apron, -.2)); }
      }
      if (L.belt && bs === 'pants') { p.hl(4, 11, 23, L.belt); p.p(7, 23, '#d8b040'); }
      if (!ghost && bs === 'skirt') { for (let y = 22; y <= 26; y++) { const a = y < 24 ? 4 : 3, b = y < 24 ? 11 : 12; p.hl(a, b, y, bot); p.p(a, y, botL); p.p(b, y, botD); } for (const x of [5, 8, 10]) p.vl(x, 24, 26, botD); p.hl(3, 12, 26, botD); }
      if (!ghost && bs === 'long') { for (let y = 22; y <= 29; y++) { const a = y < 25 ? 4 : 3, b = y < 25 ? 11 : 12; p.hl(a, b, y, bot); p.p(a, y, botL); p.p(b, y, botD); } for (const x of [5, 8, 10]) p.vl(x, 25, 29, botD); p.hl(3, 12, 29, botD); }
      if (ghost) p.hl(4, 11, 23, bot);
      /* ---------- руки (2px) ---------- */
      if (arm === 'up' || arm === 'hold') {
        const hy = arm === 'hold' ? 3 : 8;
        for (let y = hy + 2; y <= 19; y++) { p.hl(2, 3, y, sl); p.p(3, y, slD); p.hl(12, 13, y, sl); p.p(13, y, slD); }
        p.r(2, hy, 2, 2, sk); p.r(12, hy, 2, 2, sk);
      } else if (arm === 'fwd') {
        p.vl(2, 17, 20, sl); p.vl(3, 17, 20, slD); p.vl(12, 17, 20, sl); p.vl(13, 17, 20, slD);
        p.hl(3, 5, 21, sl); p.hl(10, 12, 21, slD); p.r(6, 21, 4, 2, sk); p.hl(6, 9, 22, skD);
      } else {
        const la = Math.max(0, sw), ra = Math.max(0, -sw);
        for (let y = 17; y <= 20 + sw; y++) { p.p(2, y + (y > 18 ? la : 0), sl); p.p(3, y + (y > 18 ? la : 0), slD); }
        for (let y = 17; y <= 20 - sw; y++) { p.p(12, y + (y > 18 ? ra : 0), sl); p.p(13, y + (y > 18 ? ra : 0), slD); }
        p.r(2, 21 + sw + la, 2, 2, sk); p.p(3, 22 + sw + la, skD);
        p.r(12, 21 - sw + ra, 2, 2, sk); p.p(13, 22 - sw + ra, skD);
        if (!bare) { p.hl(2, 3, 16, top); p.hl(12, 13, 16, topD); }
      }
      /* ---------- голова 12px ---------- */
      p.hl(6, 9, 15, skD); p.p(6, 15, skDD);
      const head = [[3, 5, 10], [4, 4, 11], [5, 3, 12], [6, 2, 13], [7, 2, 13], [8, 2, 13], [9, 2, 13], [10, 2, 13], [11, 2, 13], [12, 3, 12], [13, 4, 11], [14, 5, 10]];
      for (const [y, a, b] of head) { p.hl(a, b, y, sk); p.p(b, y, skD); }
      p.p(12, 12, skD); p.p(11, 13, skD); p.hl(6, 9, 14, skD);
      if (!back) {
        const ec = L.eyes || '#3a2a5a', lash = '#1d1018';
        if (L.eyeStyle === 'void') { p.r(4, 9, 2, 3, '#000'); p.r(10, 9, 2, 3, '#000'); p.p(5, 10, '#f00'); p.p(10, 10, '#f00'); }
        else if (bl) { p.hl(4, 5, 11, lash); p.hl(10, 11, 11, lash); }
        else {
          p.p(5, 10, lash); p.p(5, 11, ec); p.p(10, 10, lash); p.p(10, 11, ec);
          p.p(4, 10, fem ? lash : shade(sk, .1)); p.p(11, 10, fem ? lash : shade(sk, .1));
          if (fem) { p.p(4, 11, '#ffffff'); p.p(11, 11, '#ffffff'); }
        }
        if (L.glasses) { p.hl(3, 6, 9, '#555'); p.hl(9, 12, 9, '#555'); p.p(3, 12, '#555'); p.p(6, 12, '#555'); p.p(9, 12, '#555'); p.p(12, 12, '#555'); p.hl(7, 8, 10, '#555'); }
        p.p(3, 12, fem ? '#f2909e' : skD); p.p(12, 12, fem ? '#f2909e' : skD);
        p.hl(7, 8, 13, L.lips || skDD);
        if (L.beard) { p.hl(3, 12, 13, L.beard); p.hl(4, 11, 14, L.beard); p.hl(5, 10, 15, L.beard); p.hl(6, 9, 12, L.beard); p.hl(7, 8, 13, shade(L.beard, -.35)); p.p(3, 12, shade(L.beard, .2)); p.p(12, 13, shade(L.beard, -.2)); }
        if (L.mustache) { p.hl(5, 10, 12, L.mustache); p.p(4, 13, L.mustache); p.p(11, 13, L.mustache); p.hl(6, 9, 12, shade(L.mustache, .15)); }
        if (L.clownface) { p.p(5, 12, '#000'); p.p(10, 12, '#000'); p.hl(7, 8, 13, '#d02030'); p.p(7, 12, '#d02030'); }
      }
      /* ---------- волосы ---------- */
      if (st !== 'bald') {
        // «шапка» объёмом на 1px шире головы
        rows(p, [[1, 5, 10], [2, 3, 12], [3, 2, 13], [4, 1, 14], [5, 1, 14], [6, 1, 14], [7, 1, 14]], hr, null, hrD);
        p.p(14, 7, hrDD); p.p(13, 3, hrD);
        if (back) {
          const end = longHair ? 14 : st === 'bob' ? 14 : 12;
          for (let y = 8; y <= end; y++) { const a = y > 12 ? 2 : 1, b = y > 12 ? 13 : 14; p.hl(a, b, y, y >= end - 1 ? hrD : hr); p.p(b, y, hrD); p.p(b - 1, y, y > 9 ? hrD : hr); }
          p.hl(4, 9, 3, hrL); p.hl(3, 10, 4, hrL); p.hl(5, 8, 4, hrLL); p.p(11, 4, hrL);
          p.vl(5, 7, end - 1, hrD); p.vl(10, 8, end - 1, hrD); p.p(5, 6, hr); p.p(7, 9, hrD); p.p(7, 10, hrD);
          if (!longHair && st !== 'bob') { p.hl(5, 10, 13, sk); p.hl(5, 10, 14, skD); }
          if (longHair) for (let y = 15; y <= 23; y++) { const w = st === 'wavy' ? Math.round(Math.sin(y * .7)) : 0; p.hl(3 + w, 12 + w, y, y > 21 ? hrD : hr); p.p(12 + w, y, hrD); p.p(3 + w, y, hrL); if (y % 3 === 0) p.p(7 + w, y, hrD); }
          if (st === 'ponytail') { const s2 = step === 1 ? 1 : step === 3 ? -1 : 0; for (let y = 10; y <= 21; y++) { const o = y > 15 ? s2 : 0; p.p(7 + o, y, hr); p.p(8 + o, y, hrD); } p.hl(6, 9, 10, '#f2f2f2'); }
          if (st === 'twintail') { const s2 = step === 1 ? 1 : step === 3 ? -1 : 0; for (let y = 6; y <= 21; y++) { const o = y > 14 ? s2 : 0; p.hl(0 - o, 1 - o, y, hr); p.p(1 - o, y, hrD); p.hl(14 + o, 15 + o, y, hr); p.p(15 + o, y, hrD); } p.p(1, 6, '#e04848'); p.p(14, 6, '#e04848'); }
          if (st === 'bun') { p.circ(7, 1, 2, hr); p.p(6, 0, hrL); p.p(8, 2, hrD); }
        } else {
          // блик и тень
          p.hl(4, 9, 3, hrL); p.hl(3, 8, 4, hrL); p.hl(5, 7, 3, hrLL); p.p(10, 4, hrL); p.hl(12, 14, 6, hrD); p.hl(12, 13, 7, hrD);
          // чёлка
          const bang = {
            short: [[2, 8], [3, 8], [4, 9], [6, 8], [7, 9], [9, 8], [10, 9], [12, 8], [13, 8]],
            messy: [[2, 8], [3, 9], [5, 8], [6, 9], [8, 8], [10, 9], [11, 8], [13, 9]],
            spiky: [[2, 8], [4, 8], [5, 9], [8, 8], [9, 9], [11, 8], [13, 8]],
            bob: [[2, 8], [3, 9], [4, 9], [5, 8], [6, 9], [7, 9], [8, 8], [9, 9], [10, 9], [11, 8], [12, 9], [13, 9]],
            long: [[2, 8], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 8]],
            veil: [[2, 8], [3, 9], [4, 8], [5, 8], [8, 8], [9, 9], [10, 10], [11, 11], [12, 11], [13, 10]],
            wavy: [[2, 8], [3, 8], [4, 9], [5, 8], [7, 9], [8, 10], [9, 9], [11, 8], [12, 9], [13, 8]],
            ponytail: [[2, 9], [3, 8], [4, 9], [6, 8], [7, 9], [9, 8], [10, 9], [11, 9], [12, 8], [13, 8]],
            twintail: [[2, 8], [3, 9], [5, 8], [6, 9], [7, 8], [8, 8], [9, 9], [10, 8], [12, 9], [13, 8]],
            bun: [[2, 9], [3, 8], [4, 8], [5, 9], [6, 8], [9, 8], [10, 9], [11, 8], [12, 8], [13, 9]],
          }[st] || [];
          for (const [x, y] of bang) { p.vl(x, 8, y, hr); p.p(x, y, x > 9 ? hrD : hr); }
          for (const x of [4, 7, 10]) p.p(x, 7, hrD);
          // боковые пряди
          const sideTo = longHair ? 22 : st === 'bob' ? 14 : st === 'ponytail' || st === 'twintail' || st === 'bun' ? 12 : 10;
          for (let y = 8; y <= sideTo; y++) { const w = st === 'wavy' && y > 12 ? Math.round(Math.sin(y * .7)) : 0; const l = y > 14 ? 2 : 1, r = y > 14 ? 13 : 14; p.p(l + w, y, hr); p.p(l + 1 + w, y, y > 12 ? hrD : hr); p.p(r + w, y, hrD); p.p(r - 1 + w, y, y > 12 ? hrDD : hrD); }
          if (st === 'bob') { p.hl(2, 4, 14, hrD); p.hl(11, 13, 14, hrDD); }
          if (st === 'spiky') { for (const [x, y] of [[3, 1], [6, 0], [9, 0], [12, 1]]) { p.vl(x, y, 2, hr); p.p(x, y, hrL); } }
          if (st === 'messy') { p.p(2, 2, hr); p.p(13, 2, hr); p.p(7, 0, hr); p.p(0, 6, hr); p.p(15, 5, hrD); }
          if (st === 'bun') { p.circ(7, 0, 2, hr); p.p(6, -1, hrL); p.p(8, 1, hrD); p.p(6, 0, hrL); }
          if (st === 'ponytail') { p.p(13, 3, '#f2f2f2'); p.p(14, 4, '#f2f2f2'); }
          if (st === 'twintail') { p.p(1, 6, '#e04848'); p.p(14, 6, '#e04848'); }
        }
      } else {
        p.hl(5, 10, 4, skL); p.p(6, 5, skL);
        if (L.beard || L.mustache || L.hair) { p.vl(2, 8, 10, '#d8d8d8'); p.vl(13, 8, 10, '#c8c8c8'); p.p(3, 8, '#e8e8e8'); }
      }
      drawHatSmall2(p, L, back, false);
    } else {
      /* ---------- профиль (влево; вправо — зеркально) ---------- */
      const fwd = step === 1 ? 1 : step === 3 ? -1 : 0;
      if (ghost) { for (let y = 23; y < 32; y++) { const a = 230 - (y - 23) * 26; lo.hl(5, 10, y, bot, Math.max(30, a)); } }
      else {
        const lc = bs === 'pants' ? bot : legsSkin, lcD = bs === 'pants' ? botD : shade(legsSkin, -.18);
        // дальняя нога
        for (let y = 24; y <= 29; y++) { const o = y > 25 ? -fwd : 0; lo.hl(7 + o, 9 + o, y, lcD); }
        lo.hl(6 - fwd, 9 - fwd, 30, shade(shoe, -.15)); lo.hl(5 - fwd, 9 - fwd, 31, shade(shoe, -.15));
        // ближняя нога
        for (let y = 24; y <= 29; y++) { const o = y > 25 ? fwd : 0; lo.hl(6 + o, 8 + o, y, lc); lo.p(6 + o, y, bs === 'pants' ? botL : shade(legsSkin, .1)); }
        lo.hl(5 + fwd, 8 + fwd, 30, shoe); lo.hl(4 + fwd, 8 + fwd, 31, shoe); lo.p(5 + fwd, 30, shoeL);
      }
      const p = up;
      if (longHair) for (let y = 8; y <= 22; y++) { const w = st === 'wavy' ? Math.round(Math.sin(y * .7)) : 0; bk.hl(8 + w, 13 + w, y, y > 19 ? hrD : hr); bk.p(13 + w, y, hrD); }
      // дальняя рука (за телом)
      if (!arm) { for (let y = 17; y <= 21; y++) p.p(9 + (y > 18 ? sw : 0), y, slD); p.p(9 + sw, 22, skD); }
      // туловище
      for (let y = 16; y <= 23; y++) { p.hl(5, 10, y, top); p.p(5, y, topL); p.p(10, y, topD); p.p(9, y, y > 19 ? topD : top); }
      if (fem) { p.p(4, 18, top); p.p(4, 19, topL); if (['v', 'corset', 'bunny'].includes(L.neck)) { p.p(4, 16, sk); p.p(5, 16, sk); p.p(5, 17, skD); } }
      if (L.neck === 'ruff') { p.hl(3, 11, 15, '#ffffff'); p.hl(4, 10, 16, '#e4e4ea'); }
      if (L.neck === 'bunny') { p.p(4, 15, '#d02030'); }
      if (L.apron) { p.r(4, 18, 3, 6, L.apron); p.p(4, 18, shade(L.apron, .2)); }
      if (L.belt && bs === 'pants') p.hl(5, 10, 23, L.belt);
      if (!ghost && bs === 'skirt') { for (let y = 22; y <= 26; y++) { const a = y < 24 ? 4 : 3, b = y < 24 ? 11 : 12; p.hl(a, b, y, bot); p.p(a, y, botL); p.p(b, y, botD); } p.vl(7, 24, 26, botD); p.hl(3, 12, 26, botD); }
      if (!ghost && bs === 'long') { for (let y = 22; y <= 29; y++) { const a = y < 25 ? 4 : 3; p.hl(a, 11, y, bot); p.p(a, y, botL); p.p(11, y, botD); } p.vl(7, 25, 29, botD); }
      // ближняя рука
      if (arm === 'up' || arm === 'hold') { for (let y = (arm === 'hold' ? 5 : 9); y <= 18; y++) { p.p(6, y, sl); p.p(7, y, slD); } p.r(5, arm === 'hold' ? 3 : 7, 2, 2, sk); }
      else if (arm === 'fwd') { p.hl(3, 8, 19, sl); p.hl(3, 8, 20, slD); p.r(1, 19, 2, 2, sk); p.p(1, 20, skD); }
      else {
        for (let y = 17; y <= 21; y++) { const o = y > 18 ? -sw : 0; p.p(7 + o, y, sl); p.p(8 + o, y, slD); }
        p.r(7 - sw * 2, 22, 2, 2, sk); p.p(8 - sw * 2, 23, skD);
      }
      // голова в профиль: нос, подбородок, ухо
      p.hl(6, 9, 15, skD);
      const head = [[3, 5, 10], [4, 4, 11], [5, 3, 12], [6, 3, 12], [7, 3, 12], [8, 3, 12], [9, 3, 12], [10, 2, 12], [11, 3, 12], [12, 3, 11], [13, 4, 10], [14, 5, 9]];
      for (const [y, a, b] of head) { p.hl(a, b, y, sk); p.p(b, y, skD); }
      p.p(2, 10, skL); p.p(3, 11, skD); p.p(10, 13, skD); p.p(9, 14, skD);
      p.p(9, 10, skD); p.p(9, 11, skD); p.p(10, 10, skDD);
      if (L.eyeStyle === 'void') { p.r(4, 9, 2, 3, '#000'); p.p(4, 10, '#f00'); }
      else if (bl) p.hl(4, 5, 11, '#1d1018');
      else { p.p(4, 10, '#1d1018'); p.p(4, 11, L.eyes || '#3a2a5a'); if (fem) { p.p(3, 10, '#1d1018'); p.p(5, 11, '#ffffff'); } }
      p.p(3, 12, fem ? '#f2909e' : skD);
      if (L.glasses) { p.hl(3, 6, 9, '#555'); p.vl(3, 9, 11, '#555'); p.vl(6, 9, 11, '#555'); p.hl(7, 10, 9, '#555'); }
      p.p(3, 13, L.lips || skDD);
      if (L.beard) { p.hl(3, 9, 13, L.beard); p.hl(4, 9, 14, L.beard); p.hl(5, 8, 15, L.beard); p.hl(3, 6, 12, L.beard); p.p(4, 13, shade(L.beard, -.3)); }
      if (L.mustache) { p.hl(2, 6, 12, L.mustache); p.p(2, 13, L.mustache); }
      if (L.clownface) { p.p(4, 12, '#000'); p.p(2, 10, '#d02030'); p.p(3, 13, '#d02030'); }
      if (st !== 'bald') {
        rows(p, [[1, 5, 10], [2, 4, 12], [3, 3, 13], [4, 3, 13], [5, 3, 14], [6, 3, 14], [7, 3, 14]], hr, null, hrD);
        p.hl(5, 10, 3, hrL); p.hl(4, 8, 4, hrL); p.hl(6, 8, 3, hrLL);
        // чёлка спереди и затылок
        p.p(3, 8, hr); p.p(4, 8, hr); p.p(5, 8, hrD); if (st === 'veil' || st === 'long' || st === 'bob') { p.p(3, 9, hr); p.p(4, 9, hrD); }
        const backTo = longHair ? 22 : st === 'bob' ? 14 : st === 'messy' ? 12 : 11;
        for (let y = 8; y <= backTo; y++) { const w = st === 'wavy' && y > 12 ? Math.round(Math.sin(y * .7)) : 0; const a = y > 14 ? 9 : 8; p.hl(a + w, 13 + w, y, y % 4 === 1 ? hrD : hr); p.p(13 + w, y, hrD); p.p(a + w, y, y > 10 ? hrD : hr); }
        p.p(8, 9, hrD); p.p(8, 10, hrD);
        if (st === 'ponytail') { const s2 = step === 1 ? 1 : step === 3 ? -1 : 0; for (let y = 4; y <= 17; y++) { p.p(13 + (y > 11 ? s2 : 0), y, hr); p.p(14 + (y > 11 ? s2 : 0), y, hrD); } p.p(13, 4, '#f2f2f2'); }
        if (st === 'twintail') { for (let y = 6; y <= 20; y++) { p.p(12 + (y > 13 ? 1 : 0), y, hr); p.p(13 + (y > 13 ? 1 : 0), y, hrD); } p.p(12, 6, '#e04848'); }
        if (st === 'bun') { p.circ(9, 1, 2, hr); p.p(8, 0, hrL); }
        if (st === 'spiky') { for (const [x, y] of [[5, 1], [8, 0], [11, 1], [13, 3]]) { p.vl(x, y, 2, hr); p.p(x, y, hrL); } }
        if (st === 'messy') { p.p(14, 4, hr); p.p(7, 0, hr); p.p(12, 1, hr); }
      } else { p.hl(5, 10, 4, skL); p.vl(8, 8, 10, '#d8d8d8'); p.vl(9, 8, 10, '#c8c8c8'); }
      drawHatSmall2(p, L, false, true);
    }
    // сборка: волосы за спиной + ноги + верх со сдвигом
    const out = new PX(16, 32);
    out.blit(bk, 0, dy + 1); out.blit(lo, 0, 0); out.blit(up, 0, dy + 1);
    if (ghost) out.map((x, y, c) => [Math.min(255, c[0] * .8 + 50), Math.min(255, c[1] * .8 + 55), Math.min(255, c[2] * .8 + 65), Math.min(c[3], 210)]);
    out.selOutline(.66);
    return out.done();
  });
}
// головные уборы рисуются старой функцией на голове, которая стала на 2px выше
function drawHatSmall2(p, L, back, side) {
  if (!L.hat) return;
  const h = new PX(16, 34); drawHatSmall(h, L, back, side);
  p.blit(h, 0, -2);
}
function charSprite(L, dir, pose = {}) {
  if (dir !== 'right') return drawChar(L, dir, pose);
  const k = `flipch:${L.id || JSON.stringify(L)}:${pose.step | 0}:${pose.br | 0}:${pose.bl | 0}:${pose.arm || ''}`;
  return spr(k, () => flipH(drawChar(L, 'left', pose)));
}
function drawHatSmall(p, L, back, side) {
  switch (L.hat) {
    case 'witch': p.hl(1, 14, 6, '#2a1a3a'); p.hl(2, 13, 5, '#3a2450'); p.poly([[4, 5], [12, 5], [10, 0], [7, -1]], '#3a2450'); p.p(11, 0, '#3a2450'); p.p(12, 1, '#3a2450'); p.hl(4, 11, 4, '#8a4ad0'); break;
    case 'bunny': p.r(4, 0, 2, 5, '#ffffff'); p.r(10, 0, 2, 5, '#ffffff'); p.p(5, 1, '#f5a0b0'); p.p(10, 1, '#f5a0b0'); p.hl(4, 11, 5, '#111'); break;
    case 'nurse': p.r(5, 3, 6, 3, '#ffffff'); if (!back) { p.p(8, 3, '#d02030'); p.hl(7, 9, 4, '#d02030'); } break;
    case 'frog': p.hl(3, 12, 5, '#4a9a3a'); p.hl(2, 13, 6, '#4a9a3a'); p.hl(2, 13, 7, '#3d8a2c'); p.r(3, 2, 3, 3, '#5aab3c'); p.r(10, 2, 3, 3, '#5aab3c'); if (!back) { p.p(4, 3, '#000'); p.p(11, 3, '#000'); } p.p(8, 4, '#f2c430'); break;
    case 'clown': p.poly([[5, 5], [11, 5], [8, -1]], '#ffffff'); p.p(8, 0, '#d02030'); p.p(7, 3, '#000'); p.p(9, 2, '#000'); break;
    case 'top': p.r(4, 0, 8, 5, '#222'); p.hl(2, 13, 5, '#222'); p.hl(4, 11, 3, '#a02040'); break;
    case 'bandana': p.hl(3, 12, 6, '#a02a2a'); p.hl(3, 12, 7, '#802020'); if (!back) p.p(13, 8, '#a02a2a'); break;
    case 'ribbon': p.r(2, 3, 4, 3, '#111'); p.r(10, 3, 4, 3, '#111'); p.r(7, 4, 2, 2, '#e8e8e8'); break;
    case 'straw': p.hl(1, 14, 6, '#d8b060'); p.r(4, 3, 8, 3, '#e8c070'); p.hl(4, 11, 5, '#a03030'); break;
    case 'hood': p.hl(3, 12, 4, L.hoodCol || '#222'); for (let y = 5; y <= 14; y++) { p.p(2, y, L.hoodCol || '#222'); p.p(13, y, L.hoodCol || '#222'); } p.hl(3, 12, 5, L.hoodCol || '#222'); break;
  }
}

/* ---------- монстры ---------- */
function monsterSprite(type, frame = 0, variant = '') {
  return spr(`mon:${type}:${frame}:${variant}`, () => {
    switch (type) {
      case 'slime': {
        const col = { g: '#5ac84a', b: '#4a8ae0', r: '#e04a4a', p: '#a04ae0', k: '#2a2a2a' }[variant || 'g'] || '#5ac84a';
        const p = new PX(16, 16); const sq = frame % 2;
        p.ell(8, 10 + sq, 7 + sq, 5 - sq, shade(col, -.25)); p.ell(8, 9 + sq, 6 + sq, 4 - sq, col); p.ell(5, 7 + sq, 2, 1, shade(col, .5));
        p.r(5, 9, 2, 2 + (1 - sq), '#111'); p.r(10, 9, 2, 2 + (1 - sq), '#111'); p.p(5, 9, '#fff'); p.p(10, 9, '#fff');
        if (S.sanity < 35) { p.hl(6, 10, 12 + sq, '#fff'); p.hl(6, 10, 13 + sq, '#600'); }
        p.outline('#101810'); return p.done();
      }
      case 'bat': {
        const col = { a: '#4a3a5a', b: '#3a4a6a', c: '#6a1a2a' }[variant || 'a'] || '#4a3a5a';
        const p = new PX(16, 16); const up = frame % 2 === 0;
        p.circ(8, 8, 3, col);
        if (up) { p.poly([[5, 8], [0, 2], [2, 9]], col); p.poly([[11, 8], [16, 2], [14, 9]], col); } else { p.poly([[5, 8], [0, 13], [3, 10]], col); p.poly([[11, 8], [16, 13], [13, 10]], col); }
        p.ell(8, 8, 2, 2, '#fff'); p.p(8, 8, '#d02030'); p.p(7, 5, col); p.p(9, 5, col);
        p.outline('#0a0810'); return p.done();
      }
      case 'skeleton': {
        const p = new PX(16, 24); const s = frame % 2;
        p.ell(8, 5, 4, 4, '#e8e4d8'); p.r(6, 5, 2, 2, '#000'); p.r(9, 5, 2, 2, '#000'); p.hl(6, 10, 8, '#000');
        p.vl(8, 9, 16, '#e8e4d8'); for (let y = 11; y < 16; y += 2) p.hl(5, 11, y, '#e8e4d8');
        p.line(5, 10, 3, 16 - s, '#e8e4d8'); p.line(11, 10, 13, 16 + s - 1, '#e8e4d8');
        p.line(8, 16, 5 + s, 23, '#e8e4d8'); p.line(8, 16, 11 - s, 23, '#e8e4d8');
        p.r(5, 2, 7, 2, '#c8a040'); // соломенная шляпа фермера
        p.outline('#1a1810'); return p.done();
      }
      case 'ghost': {
        const p = new PX(16, 20);
        p.ell(8, 8, 6, 7, '#e8f0ff', 200); for (let y = 8; y < 19; y++) p.hl(2, 14, y, '#e8f0ff', 200 - (y - 8) * 12);
        for (let x = 2; x < 15; x += 3) p.clear(x + frame % 3, 18);
        p.ell(6, 7, 1, 2, '#000'); p.ell(10, 7, 1, 2, '#000'); p.ell(8, 12, 2, 2, '#000');
        return p.done();
      }
      case 'eye': {
        const p = new PX(16, 16);
        p.circ(8, 8, 6, '#f4ece4'); p.line(2, 6, 5, 8, '#d03040'); p.line(13, 11, 10, 9, '#d03040'); p.line(9, 2, 8, 5, '#d03040');
        const dx = [0, 1, 0, -1][frame % 4], dy = [1, 0, -1, 0][frame % 4];
        p.circ(8 + dx * 2, 8 + dy * 2, 3, variant === 'r' ? '#d02030' : '#3a8a5a'); p.circ(8 + dx * 2, 8 + dy * 2, 1, '#000'); p.p(7 + dx * 2, 7 + dy * 2, '#fff');
        p.outline('#3a0a10'); return p.done();
      }
      case 'doll': {
        const p = new PX(16, 24); const s = frame % 2;
        p.r(4, 12, 8, 9, '#8a2a3a'); p.hl(3, 12, 20, '#8a2a3a'); p.hl(3, 12, 21, '#6a1a2a');
        p.hl(5, 10, 12, '#fff'); p.vl(6, 21, 23 - s, '#f0e8e0'); p.vl(9, 21, 22 + s, '#f0e8e0');
        p.ell(8, 7, 5, 5, '#f4ece6'); p.r(4, 2, 9, 3, '#e8c060'); p.vl(3, 3, 12, '#e8c060'); p.vl(13, 3, 12, '#e8c060');
        p.r(6, 6, 1, 2, '#2a4aa0'); p.r(10, 6, 1, 2, '#2a4aa0'); p.p(8, 10, '#c03040');
        p.line(10, 3, 9, 9, '#3a2a2a'); // трещина
        if (variant === 'angry') { p.r(6, 6, 1, 2, '#f00'); p.r(10, 6, 1, 2, '#f00'); p.hl(6, 10, 10, '#000'); }
        p.outline('#1a0a0a'); return p.done();
      }
      case 'shadow': {
        const p = new PX(24, 32); const s = frame % 2;
        p.ell(12, 9, 6, 7, '#120c16'); p.poly([[4, 16], [20, 16], [22, 28], [2, 28]], '#120c16');
        p.line(4, 16, 0, 26 + s, '#120c16'); p.line(20, 16, 24, 26 - s, '#120c16'); p.line(8, 28, 6 + s, 31, '#120c16'); p.line(16, 28, 18 - s, 31, '#120c16');
        p.r(8, 8, 2, 2, '#e0d0ff'); p.r(14, 8, 2, 2, '#e0d0ff'); p.speck(2, 2, 20, 28, ['#2a2030'], .06, frame);
        return p.done();
      }
      case 'mushroom': {
        const p = new PX(16, 16); const s = frame % 2;
        p.r(6, 9, 4, 6, '#e8dcc8'); p.ell(8, 7 + s, 7, 4, '#c8302a'); p.circ(5, 6 + s, 1, '#fff'); p.circ(10, 5 + s, 1, '#fff'); p.p(12, 8 + s, '#fff');
        p.p(7, 11, '#000'); p.p(9, 11, '#000'); p.hl(7, 9, 13, '#5a2a2a');
        p.outline('#2a0a0a'); return p.done();
      }
      case 'ink': {
        const p = new PX(16, 16); const s = frame % 2;
        p.ell(8, 10, 7, 5 - s, '#0a0a0a'); p.circ(4, 6 + s, 2, '#0a0a0a'); p.circ(11, 5 - s, 2, '#0a0a0a');
        p.r(5, 9, 2, 2, '#fff'); p.r(10, 9, 2, 2, '#fff'); p.p(6, 10, '#c00'); p.p(10, 10, '#c00');
        return p.done();
      }
      case 'crow': {
        const p = new PX(16, 16); const s = frame % 2;
        p.ell(8, 9, 4, 3, '#1a1a22'); p.circ(11, 6, 2, '#1a1a22'); p.poly([[13, 6], [16, 7], [13, 7]], '#e0a020'); p.p(11, 5, '#f00');
        if (s) p.poly([[5, 8], [1, 3], [8, 7]], '#2a2a32'); else p.poly([[5, 9], [1, 12], [8, 10]], '#2a2a32');
        p.vl(7, 12, 14, '#e0a020'); p.vl(9, 12, 14, '#e0a020');
        return p.done();
      }
      case 'shade': {
        const p = new PX(16, 40);
        for (let y = 0; y < 40; y++) { const w = y < 8 ? 3 : y < 34 ? 4 + Math.floor(y / 12) : 6; p.hl(8 - w, 8 + w, y, '#050305', y > 34 ? 255 - (y - 34) * 40 : 240); }
        p.p(6, 4, '#fff'); p.p(10, 4, '#fff'); p.line(4, 12, 1, 30 + frame % 2, '#050305'); p.line(12, 12, 15, 30 - frame % 2, '#050305');
        return p.done();
      }
      case 'kingslime': {
        const p = new PX(48, 44); const sq = frame % 2;
        p.ell(24, 30 + sq, 22 + sq * 2, 13 - sq, '#2e8a26'); p.ell(24, 28 + sq, 20 + sq * 2, 12 - sq, '#5ac84a'); p.ell(14, 22 + sq, 5, 2, '#b8f0a8');
        p.r(14, 26, 5, 5, '#111'); p.r(29, 26, 5, 5, '#111'); p.r(15, 27, 2, 2, '#fff'); p.r(30, 27, 2, 2, '#fff');
        p.poly([[16, 34 + sq], [32, 34 + sq], [28, 38 + sq], [20, 38 + sq]], '#1a3a10');
        p.poly([[12, 16 + sq], [36, 16 + sq], [38, 4 + sq], [31, 10 + sq], [24, 2 + sq], [17, 10 + sq], [10, 4 + sq]], '#f2c430'); p.circ(24, 10 + sq, 2, '#d02030'); p.circ(15, 12 + sq, 1, '#4a8ae0'); p.circ(33, 12 + sq, 1, '#4a8ae0');
        p.outline('#0a1808'); return p.done();
      }
      case 'hatter': {
        const p = new PX(32, 48); const s = frame % 2;
        p.r(6, 0, 20, 14, '#3a2a5a'); p.hl(2, 29, 14, '#2a1a4a'); p.hl(2, 29, 15, '#2a1a4a'); p.r(6, 10, 20, 3, '#d02030'); p.r(20, 4, 5, 6, '#f2f2f2'); p.p(22, 6, '#000');
        p.ell(16, 21, 7, 6, '#f2dcc8'); p.r(12, 19, 2, 3, '#000'); p.r(19, 19, 2, 3, '#000'); p.p(12, 19, '#ff0'); p.p(19, 19, '#ff0');
        p.poly([[11, 24], [21, 24], [19, 27], [13, 27]], '#2a0a0a'); for (let x = 12; x < 21; x += 2) p.p(x, 24, '#fff');
        p.vl(8, 14, 26, '#e07a20'); p.vl(24, 14, 26, '#e07a20');
        p.poly([[6, 28], [26, 28], [28, 44], [4, 44]], '#3a6a3a'); p.poly([[13, 28], [19, 28], [16, 36]], '#f2f2f2'); p.circ(16, 30, 2, '#f2c430');
        p.line(6, 30, 0, 38 - s * 3, '#3a6a3a'); p.line(26, 30, 32, 36 + s * 3, '#3a6a3a');
        p.ell(1, 39 - s * 3, 3, 2, '#f8f8f8'); p.r(30, 34 + s * 3, 3, 3, '#f8f8f8');
        p.r(8, 44, 5, 4, '#2a1a1a'); p.r(19, 44, 5, 4, '#2a1a1a');
        p.outline('#0a0610'); return p.done();
      }
      case 'author': {
        const p = new PX(32, 52); const s = frame % 2;
        // платье
        p.poly([[10, 24], [22, 24], [28, 50], [4, 50]], '#18141a'); for (let k = 0; k < 6; k++) p.circ(5 + k * 4.5, 49, 2, '#f0f0f0');
        p.poly([[12, 24], [20, 24], [16, 34]], '#f0f0f0'); p.circ(16, 26, 2, '#b01020');
        // руки и перо
        p.line(10, 26, 4, 34 + s, '#18141a'); p.line(22, 26, 28, 20 - s, '#18141a');
        p.line(28, 20 - s, 31, 2 - s, '#f0eadc'); p.line(29, 20 - s, 32, 4 - s, '#c8c0b0'); p.p(28, 21 - s, '#000');
        // голова
        p.ell(16, 14, 7, 8, '#f4e8e0'); p.ell(16, 10, 9, 6, '#1a1418'); p.r(7, 10, 3, 16, '#1a1418'); p.r(22, 10, 3, 16, '#1a1418');
        p.r(12, 14, 2, 3, '#000'); p.r(18, 14, 2, 3, '#000'); p.p(12, 15, '#d02030'); p.p(19, 15, '#d02030');
        p.hl(13, 19, 19, '#800010');
        p.poly([[4, 4], [12, 7], [4, 10]], '#f0f0f0'); p.poly([[28, 4], [20, 7], [28, 10]], '#f0f0f0'); p.circ(16, 6, 2, '#b01020');
        for (let k = 0; k < 6; k++) p.p(4 + Math.floor(U.hash(k, s, 3) * 24), 30 + Math.floor(U.hash(s, k, 4) * 20), '#000');
        p.outline('#000'); return p.done();
      }
      case 'fairy': {
        const p = new PX(16, 16); const s = frame % 2;
        p.ell(4, 7 - s, 3, 4, '#d8ffe8', 160); p.ell(12, 7 - s, 3, 4, '#d8ffe8', 160);
        p.circ(8, 6, 2, '#f8e0c8'); p.hl(6, 10, 4, '#5aca5a'); p.r(7, 8, 3, 5, '#7ad87a'); p.p(7, 6, '#000'); p.p(9, 6, '#000');
        return p.done();
      }
      case 'zhmur': {
        const col = ['#9aff9a', '#ffd070', '#9ad0ff', '#ff9ad0', '#d0a0ff'][Number(variant) || 0];
        const p = new PX(12, 14); const s = frame % 2;
        p.ell(6, 8 + s, 5, 5 - s, col); p.p(4, 7 + s, '#000'); p.p(7, 7 + s, '#000'); p.vl(6, 1 + s, 3 + s, '#3a8a3a'); p.p(7, 1 + s, '#5ac85a');
        p.outline('#1a2a1a'); return p.done();
      }
      case 'frog': {
        const p = new PX(16, 16); const s = frame % 2;
        p.ell(8, 11 - s, 6, 4, '#4a9a3a'); p.circ(5, 7 - s, 2, '#5aab3c'); p.circ(11, 7 - s, 2, '#5aab3c'); p.p(5, 7 - s, '#000'); p.p(11, 7 - s, '#000');
        p.poly([[6, 5 - s], [10, 5 - s], [10, 2 - s], [8, 4 - s], [6, 2 - s]], '#f2c430'); p.hl(6, 10, 12 - s, '#2a5a1a');
        p.outline('#0a1a08'); return p.done();
      }
    }
    return mkCanvas(16, 16);
  });
}
