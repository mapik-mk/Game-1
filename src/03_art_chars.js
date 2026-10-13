/* ============================================================
   Персонажи: спрайты 16x32, портреты 64x64, монстры
   ============================================================ */
const OUTLINE = '#1d1214';

// pose: { step: 0..3 (шаг), br: 0/1 (дыхание), bl: 0/1 (моргание), arm: ''|'up'|'fwd'|'hold' }
function drawChar(L, dir, pose = {}) {
  if (typeof pose === 'number') pose = { step: [0, 1, 0, 3][pose] || 0 };
  const step = pose.step | 0, br = pose.br | 0, bl = pose.bl | 0, arm = pose.arm || '';
  const key = `ch:${L.id || JSON.stringify(L)}:${dir}:${step}:${br}:${bl}:${arm}`;
  return spr(key, () => {
    const sk = L.skin || '#f2c6a0', skD = shade(sk, -.16), skDD = shade(sk, -.3), skL = shade(sk, .15);
    const hr = L.hair || '#3a2a1a', hrD = shade(hr, -.32), hrL = shade(hr, .3);
    const top = L.top || '#4a6a9a', topD = shade(top, -.28), topL = shade(top, .2);
    const bot = L.bottom || '#3a3a4a', botD = shade(bot, -.25), botL = shade(bot, .15), shoe = L.shoes || '#2a1a10';
    const fem = !!L.fem, st = L.hairStyle || 'short', ghost = !!L.ghost;
    const longHair = ['long', 'veil', 'twintail', 'wavy'].includes(st);
    const bs = L.bottomStyle || 'pants';
    const sl = L.sleeve === 'none' ? sk : top, slD = L.sleeve === 'none' ? skD : topD;
    const lo = new PX(16, 32), up = new PX(16, 32);
    const dy = (step === 1 || step === 3 ? -1 : 0) + (br ? 1 : 0);
    const lift = step === 1 ? 'l' : step === 3 ? 'r' : '';
    const armSw = arm ? 0 : (step === 1 ? 1 : step === 3 ? -1 : 0);
    if (dir === 'down' || dir === 'up') {
      const back = dir === 'up';
      /* --- ноги (нижний слой) --- */
      if (ghost) {
        for (let y = 24; y < 32; y++) { const a = 230 - (y - 24) * 30; for (let x = 3; x <= 12; x++) if (!(y > 27 && (x + y + step) % 3 === 0)) lo.p(x, y, bot, Math.max(30, a)); }
      } else if (bs === 'pants') {
        const ly = lift === 'l' ? 1 : 0, ry = lift === 'r' ? 1 : 0;
        for (let y = 24; y <= 30 - ly; y++) { lo.hl(5, 7, y, bot); lo.p(5, y, botL); }
        for (let y = 24; y <= 30 - ry; y++) { lo.hl(8, 10, y, botD); lo.p(10, y, shade(botD, -.15)); }
        lo.hl(5, 7, 31 - ly, shoe); lo.p(5, 31 - ly, shade(shoe, .35)); lo.hl(8, 10, 31 - ry, shoe); lo.p(8, 31 - ry, shade(shoe, .35));
      } else {
        const legs = L.legs || sk, ly = lift === 'l' ? 1 : 0, ry = lift === 'r' ? 1 : 0;
        for (let y = 25; y <= 30 - ly; y++) { lo.p(5, y, legs); lo.p(6, y, shade(legs, -.12)); }
        for (let y = 25; y <= 30 - ry; y++) { lo.p(9, y, legs); lo.p(10, y, shade(legs, -.12)); }
        lo.hl(5, 6, 31 - ly, shoe); lo.p(5, 31 - ly, shade(shoe, .35)); lo.hl(9, 10, 31 - ry, shoe); lo.p(9, 31 - ry, shade(shoe, .35));
      }
      /* --- верх (сдвигается при шаге и дыхании) --- */
      const p = up;
      if (longHair && !back) { for (let y = 9; y <= 22; y++) p.hl(3, 12, y, (y + (step >> 1)) % 3 ? hrD : shade(hrD, -.15)); }
      if (st === 'twintail') { const sw = Math.sin(step * 1.6) > 0 ? 1 : 0; for (let y = 8; y <= 21; y++) { p.p(1 - (y > 15 ? sw : 0), y, hr); p.p(2 - (y > 15 ? sw : 0), y, hrD); p.p(13 + (y > 15 ? sw : 0), y, hrD); p.p(14 + (y > 15 ? sw : 0), y, hr); } }
      // туловище
      for (let y = 17; y <= 24; y++) {
        let x0 = 4, x1 = 11; if (fem && (y === 21 || y === 22)) { x0 = 5; x1 = 10; } if (y === 17) { x0 = 5; x1 = 10; }
        p.hl(x0, x1, y, top); p.p(x0, y, topL); p.p(x1, y, topD);
      }
      p.hl(5, 10, 24, topD);
      if (!back) {
        if (L.neck === 'v') { p.hl(6, 9, 17, sk); p.hl(7, 8, 18, sk); if (fem) { p.p(7, 19, skD); p.p(6, 19, topD); p.p(9, 19, topD); } }
        else if (L.neck === 'corset') { p.hl(5, 10, 17, sk); p.hl(5, 10, 18, sk); p.p(5, 19, sk); p.p(10, 19, sk); p.p(7, 19, skDD); p.p(8, 19, skD); p.p(6, 18, skL); p.p(9, 18, skL); for (let y = 20; y <= 23; y++) p.p(7 + (y % 2), y, shade(top, .55)); }
        else if (L.neck === 'bunny') { p.hl(4, 11, 17, sk); p.hl(4, 11, 18, sk); p.p(7, 18, skDD); p.p(6, 18, skL); p.p(9, 18, skL); p.hl(4, 11, 19, shade(top, .1)); p.p(7, 16, '#fff'); p.p(8, 16, '#fff'); p.p(7, 17, '#d02030'); p.p(8, 17, '#d02030'); }
        else if (L.neck === 'collar') { p.hl(6, 9, 17, '#ffffff'); p.p(7, 18, '#ffffff'); }
        else if (L.neck === 'ruff') { p.hl(3, 12, 16, '#ffffff'); p.hl(4, 11, 17, '#e8e8e8'); p.p(5, 16, '#d8d8e0'); p.p(9, 16, '#d8d8e0'); }
        else { p.hl(6, 9, 17, shade(top, .3)); p.p(7, 18, skD); p.p(8, 18, skD); p.p(7, 20, topD); p.p(7, 22, topD); }
        if (L.apron) { p.r(5, 19, 6, 6, L.apron); p.vl(5, 19, 24, shade(L.apron, .2)); p.hl(5, 10, 19, shade(L.apron, -.2)); }
      }
      if (L.belt && bs === 'pants') { p.hl(4, 11, 23, L.belt); p.p(7, 23, '#d8b040'); }
      // юбка / платье
      if (!ghost && bs === 'skirt') { for (let y = 23; y <= 27; y++) { const x0 = y < 25 ? 4 : 3, x1 = y < 25 ? 11 : 12; p.hl(x0, x1, y, bot); p.p(x0, y, botL); p.p(x1, y, botD); } for (const x of [5, 8, 10]) p.vl(x, 25, 27, botD); p.hl(3, 12, 27, botD); }
      if (!ghost && bs === 'long') { for (let y = 23; y <= 30; y++) { const x0 = y < 26 ? 4 : 3, x1 = y < 26 ? 11 : 12; p.hl(x0, x1, y, bot); p.p(x0, y, botL); p.p(x1, y, botD); } for (const x of [5, 8, 10]) p.vl(x, 26, 30, botD); p.hl(3, 12, 30, botD); }
      if (ghost) { for (let y = 23; y <= 24; y++) p.hl(4, 11, y, bot); }
      // руки
      if (arm === 'up' || arm === 'hold') {
        const hy = arm === 'hold' ? 4 : 9;
        for (let y = hy + 1; y <= 19; y++) { p.p(3, y, sl); p.p(12, y, slD); }
        p.r(arm === 'hold' ? 4 : 3, hy, 2, 2, sk); p.r(arm === 'hold' ? 10 : 11, hy, 2, 2, sk);
      } else if (arm === 'fwd') {
        p.vl(3, 18, 21, sl); p.vl(12, 18, 21, slD); p.p(4, 22, sl); p.p(11, 22, slD);
        p.r(6, 22, 4, 2, sk); p.hl(6, 9, 23, skD);
      } else {
        p.vl(3, 18 + Math.max(0, armSw), 23 + armSw, sl); p.vl(12, 18 + Math.max(0, -armSw), 23 - armSw, slD);
        p.p(3, 24 + armSw, sk); p.p(12, 24 - armSw, skD);
        if (fem && L.sleeve !== 'none') { p.p(3, 18, sk); p.p(12, 18, skD); }
      }
      // голова
      p.hl(7, 8, 16, skD);
      const head = [[5, 5, 10], [6, 4, 11], [7, 3, 12], [8, 3, 12], [9, 3, 12], [10, 3, 12], [11, 3, 12], [12, 3, 12], [13, 3, 12], [14, 4, 11], [15, 5, 10]];
      for (const [y, a, b] of head) { p.hl(a, b, y, sk); p.p(b, y, skD); }
      p.hl(6, 9, 15, skD);
      if (!back) {
        const ec = L.eyes || '#3a2a5a', lash = '#1b1020';
        if (L.eyeStyle === 'void') { p.r(5, 10, 2, 2, '#000'); p.r(9, 10, 2, 2, '#000'); p.p(6, 11, '#f00'); p.p(9, 11, '#f00'); }
        else if (bl) { p.hl(5, 6, 11, lash); p.hl(9, 10, 11, lash); }
        else if (fem) { p.hl(5, 6, 10, lash); p.hl(9, 10, 10, lash); p.p(4, 10, lash); p.p(11, 10, lash); p.p(5, 11, ec); p.p(6, 11, '#ffffff'); p.p(9, 11, ec); p.p(10, 11, '#ffffff'); p.p(5, 12, shade(ec, .35)); p.p(9, 12, shade(ec, .35)); }
        else { p.vl(5, 10, 11, lash); p.vl(10, 10, 11, lash); p.p(5, 10, '#ffffff'); p.p(10, 10, '#ffffff'); p.p(5, 10, lash); }
        if (L.glasses) { p.hl(4, 7, 9, '#555'); p.hl(8, 11, 9, '#555'); p.p(4, 12, '#555'); p.p(7, 12, '#555'); p.p(8, 12, '#555'); p.p(11, 12, '#555'); }
        p.p(4, 12, fem ? '#f08a98' : skD); p.p(11, 12, fem ? '#f08a98' : skD);
        p.hl(7, 8, 13, L.lips || skDD);
        if (L.beard) { p.hl(4, 11, 14, L.beard); p.hl(5, 10, 15, L.beard); p.hl(6, 9, 16, L.beard); p.hl(6, 9, 13, L.beard); p.hl(7, 8, 13, shade(L.beard, -.3)); p.p(4, 14, shade(L.beard, .2)); }
        if (L.mustache) { p.hl(5, 10, 13, L.mustache); p.p(4, 14, L.mustache); p.p(11, 14, L.mustache); }
        if (L.clownface) { p.p(5, 12, '#000'); p.p(10, 12, '#000'); p.hl(6, 9, 14, '#d02030'); }
      }
      // волосы
      if (st !== 'bald') {
        p.hl(5, 10, 3, hr); p.hl(4, 11, 4, hr);
        for (let y = 5; y <= 7; y++) p.hl(3, 12, y, hr);
        p.hl(5, 9, 4, hrL); p.p(4, 5, hrL); p.hl(10, 12, 7, hrD);
        if (back) {
          for (let y = 8; y <= 15; y++) { p.hl(3, 12, y, hr); p.p(12, y, hrD); p.p(3, y, hrL); }
          for (let x = 5; x <= 10; x += 2) p.vl(x, 9, 14, hrD);
          if (longHair) for (let y = 16; y <= 22; y++) { p.hl(4, 11, y, y % 3 ? hr : hrD); p.p(11, y, hrD); }
          if (st === 'ponytail') { const sw = step === 1 ? 1 : step === 3 ? -1 : 0; p.r(7 + sw, 15, 2, 7, hr); p.p(8 + sw, 21, hrD); }
          if (st === 'bun') { p.circ(8, 3, 2, hrD); p.p(7, 2, hr); }
        } else {
          const bangs = st === 'messy' ? [3, 4, 6, 9, 11, 12] : st === 'veil' ? [3, 4, 5, 6, 7, 8, 12] : [3, 4, 6, 7, 9, 11, 12];
          for (const x of bangs) p.p(x, 8, hr);
          p.p(3, 9, hr); p.p(12, 9, hrD); p.p(5, 7, hrD); p.p(8, 7, hrD); p.p(10, 7, hrD);
          if (st === 'veil') { p.hl(3, 8, 9, hr); p.hl(3, 7, 10, hr); p.hl(3, 6, 11, hr); }
          const sideTo = longHair ? 21 : st === 'bob' ? 13 : 10;
          for (let y = 8; y <= sideTo; y++) { p.p(y > 15 ? 3 : 2, y, hr); p.p(y > 15 ? 12 : 13, y, hrD); if (longHair && y > 11) { p.p(y > 15 ? 4 : 3, y, hrD); p.p(y > 15 ? 11 : 12, y, hrD); } }
          if (st === 'spiky') { p.p(4, 2, hr); p.p(7, 1, hr); p.p(10, 2, hr); p.p(12, 3, hr); p.p(7, 2, hrL); }
          if (st === 'bun') { p.circ(8, 2, 2, hr); p.p(7, 1, hrL); }
          if (st === 'ponytail') { const sw = step === 1 ? 1 : step === 3 ? -1 : 0; p.vl(13 + Math.max(0, sw), 7, 15, hr); p.vl(14 + Math.max(0, sw), 9, 14, hrD); }
        }
      } else { p.hl(5, 10, 5, sk); p.p(6, 6, skL); p.p(7, 5, skL); if (L.beard || L.mustache) { p.p(3, 9, '#ddd'); p.p(12, 9, '#ddd'); p.p(3, 10, '#ccc'); p.p(12, 10, '#ccc'); } }
      drawHatSmall(p, L, back);
    } else {
      /* --- профиль (влево; вправо — зеркально) --- */
      const fwd = step === 1 ? 1 : step === 3 ? -1 : 0;
      if (ghost) { for (let y = 24; y < 32; y++) { const a = 230 - (y - 24) * 30; lo.hl(4, 11, y, bot, Math.max(30, a)); } }
      else if (bs === 'pants') {
        // дальняя нога
        for (let y = 24; y <= 30; y++) lo.hl(7 + (y > 26 ? fwd : 0), 9 + (y > 26 ? fwd : 0), y, botD);
        lo.hl(6 + fwd, 9 + fwd, 31, shade(shoe, -.2));
        // ближняя
        for (let y = 24; y <= 30; y++) { lo.hl(6 - (y > 26 ? fwd : 0), 8 - (y > 26 ? fwd : 0), y, bot); lo.p(6 - (y > 26 ? fwd : 0), y, botL); }
        lo.hl(5 - fwd, 8 - fwd, 31, shoe); lo.p(5 - fwd, 31, shade(shoe, .35));
      } else {
        const legs = L.legs || sk;
        lo.vl(8 + fwd, 25, 30, shade(legs, -.15)); lo.hl(7 + fwd, 8 + fwd, 31, shade(shoe, -.2));
        lo.vl(7 - fwd, 25, 30, legs); lo.hl(6 - fwd, 7 - fwd, 31, shoe);
      }
      const p = up;
      if (longHair) { for (let y = 8; y <= 22; y++) p.hl(8, 12, y, (y + (step >> 1)) % 3 ? hrD : shade(hrD, -.15)); }
      for (let y = 17; y <= 24; y++) { p.hl(5, 10, y, top); p.p(5, y, topL); p.p(10, y, topD); }
      if (fem) { p.p(4, 19, top); p.p(4, 20, topL); if (L.neck === 'v' || L.neck === 'corset' || L.neck === 'bunny') { p.p(4, 17, sk); p.p(5, 17, sk); p.p(5, 18, skD); } }
      if (L.apron) p.r(4, 19, 3, 6, L.apron);
      if (L.belt && bs === 'pants') p.hl(5, 10, 23, L.belt);
      if (!ghost && bs === 'skirt') { for (let y = 23; y <= 27; y++) { p.hl(y < 25 ? 4 : 3, y < 25 ? 11 : 12, y, bot); p.p(y < 25 ? 4 : 3, y, botL); } p.vl(7, 25, 27, botD); p.hl(3, 12, 27, botD); }
      if (!ghost && bs === 'long') { for (let y = 23; y <= 30; y++) { p.hl(y < 26 ? 4 : 3, 11, y, bot); p.p(y < 26 ? 4 : 3, y, botL); } p.vl(7, 26, 30, botD); }
      // рука
      if (arm === 'up' || arm === 'hold') { for (let y = (arm === 'hold' ? 5 : 9); y <= 19; y++) p.p(6, y, sl); p.r(5, arm === 'hold' ? 3 : 8, 2, 2, sk); }
      else if (arm === 'fwd') { p.hl(3, 8, 20, sl); p.hl(3, 8, 21, slD); p.r(1, 20, 2, 2, sk); }
      else { p.vl(7 - armSw, 18, 22, slD); p.vl(8 - armSw, 18, 22, sl); p.p(7 - armSw * 2, 23, sk); p.p(8 - armSw * 2, 23, skD); }
      // голова
      p.hl(7, 8, 16, skD);
      const head = [[5, 5, 10], [6, 4, 11], [7, 4, 11], [8, 4, 11], [9, 4, 11], [10, 4, 11], [11, 3, 11], [12, 4, 11], [13, 4, 11], [14, 5, 10], [15, 6, 9]];
      for (const [y, a, b] of head) { p.hl(a, b, y, sk); p.p(b, y, skD); }
      if (L.eyeStyle === 'void') { p.r(5, 10, 2, 2, '#000'); p.p(5, 11, '#f00'); }
      else if (bl) p.hl(4, 6, 11, '#1b1020');
      else if (fem) { p.hl(4, 6, 10, '#1b1020'); p.p(5, 11, L.eyes || '#3a2a5a'); p.p(6, 11, '#ffffff'); p.p(6, 12, '#f08a98'); }
      else { p.vl(5, 10, 11, '#1b1020'); p.p(5, 10, '#fff'); p.p(5, 10, '#1b1020'); }
      if (L.glasses) { p.hl(4, 7, 9, '#555'); p.p(4, 12, '#555'); p.p(7, 12, '#555'); }
      p.p(4, 13, L.lips || skDD); p.p(9, 11, skD);
      if (L.beard) { p.hl(4, 9, 14, L.beard); p.hl(5, 9, 15, L.beard); p.hl(4, 6, 13, L.beard); }
      if (L.mustache) p.hl(3, 6, 13, L.mustache);
      if (L.clownface) { p.p(5, 12, '#000'); p.p(3, 11, '#d02030'); }
      if (st !== 'bald') {
        p.hl(5, 11, 3, hr); p.hl(4, 12, 4, hr); for (let y = 5; y <= 7; y++) p.hl(4, 12, y, hr); p.hl(6, 10, 4, hrL); p.p(5, 5, hrL);
        p.p(4, 8, hr); p.p(5, 8, hr); p.p(4, 9, hr);
        const backTo = longHair ? 22 : st === 'bob' ? 13 : 11;
        for (let y = 8; y <= backTo; y++) { p.hl(y > 15 ? 9 : 8, 12, y, y % 4 ? hr : hrD); p.p(12, y, hrD); }
        if (st === 'veil') { p.hl(4, 7, 9, hr); p.hl(4, 6, 10, hr); }
        if (st === 'ponytail') { const sw = step === 1 ? 1 : step === 3 ? -1 : 0; p.vl(13, 7, 17 + sw, hr); p.vl(14, 9, 15 + sw, hrD); }
        if (st === 'twintail') { p.r(12, 7, 3, 13, hr); p.vl(14, 8, 19, hrD); }
        if (st === 'bun') { p.circ(10, 2, 2, hr); p.p(9, 1, hrL); }
        if (st === 'spiky') { p.p(6, 2, hr); p.p(9, 1, hr); p.p(12, 2, hr); }
      } else { p.p(6, 5, skL); p.hl(9, 11, 9, '#ddd'); }
      drawHatSmall(p, L, false, true);
    }
    // сборка: ноги + верх со сдвигом
    const out = new PX(16, 32);
    out.blit(lo, 0, 0); out.blit(up, 0, dy + 1);
    if (ghost) out.map((x, y, c) => [Math.min(255, c[0] * .8 + 50), Math.min(255, c[1] * .8 + 55), Math.min(255, c[2] * .8 + 65), Math.min(c[3], 210)]);
    out.selOutline(.62);
    return out.done();
  });
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

/* ---------- портреты 64x64 ---------- */
function portrait(id, emo = 'neutral', talk = false, blink = false) {
  return spr(`por:${id}:${emo}:${talk ? 1 : 0}:${blink ? 1 : 0}`, () => {
    const D = PORTRAITS[id] || PORTRAITS.player;
    const L = (typeof D === 'function') ? D() : D;
    if (L.special) return L.special(emo);
    return drawPortrait(L, emo, talk, blink);
  });
}
function drawPortrait(L, emo, talk = false, blink = false) {
  const p = new PX(64, 64);
  const sk = L.skin || '#f2c6a0', skD = shade(sk, -.15), skDD = shade(sk, -.3), skL = shade(sk, .15);
  const hr = L.hair || '#3a2a1a', hrD = shade(hr, -.3), hrL = shade(hr, .3);
  const fem = !!L.fem, st = L.hairStyle || 'short';
  const creepy = emo === 'creepy';
  // 1) базовая форма в 64px
  if (['long', 'veil', 'wavy'].includes(st)) { p.poly([[14, 22], [50, 22], [56, 64], [8, 64]], hrD); p.ell(32, 26, 20, 18, hrD); for (let x = 12; x < 54; x += 5) p.line(x, 34, x - 2, 63, shade(hrD, -.2)); }
  if (st === 'twintail') { p.ell(9, 40, 6, 18, hr); p.ell(55, 40, 6, 18, hr); p.line(8, 26, 6, 56, hrL); p.line(56, 26, 58, 56, hrD); }
  if (st === 'bob') { p.ell(32, 30, 19, 17, hrD); }
  if (st === 'ponytail') { p.ell(50, 38, 6, 16, hrD); p.line(49, 26, 51, 52, hr); }
  const top = L.top || '#4a6a9a', topD = shade(top, -.25), topL = shade(top, .15);
  p.poly([[4, 64], [60, 64], [56, 52], [44, 47], [20, 47], [8, 52]], top);
  p.poly([[44, 47], [56, 52], [60, 64], [48, 64]], topD);
  p.r(27, 38, 10, 12, skD); p.r(27, 38, 4, 12, sk); p.hl(27, 36, 44, skDD);
  drawOutfit(p, L, sk, skD, skDD, top, topD, topL);
  p.ell(32, 27, 14, 15, sk);
  p.poly([[19, 30], [45, 30], [40, 40], [32, 44], [24, 40]], sk);
  p.line(44, 31, 39, 40, skD); p.line(39, 40, 33, 43, skD); p.line(45, 28, 44, 33, skD);
  p.ell(18, 31, 2, 3, skD); p.ell(46, 31, 2, 3, skD);
  drawHairFront(p, L, st, hr, hrD, hrL);
  drawHatBig(p, L);
  if (L.beard) { p.poly([[20, 33], [44, 33], [42, 46], [32, 52], [22, 46]], L.beard); for (let x = 22; x < 43; x += 3) p.line(x, 36, x + 1, 46, shade(L.beard, -.15)); }
  if (L.mustache) { p.poly([[24, 37], [32, 35], [40, 37], [42, 40], [32, 38], [22, 40]], L.mustache); }
  if (L.clownface) { p.ell(32, 30, 12, 11, '#f8f4f0', 140); }
  if (L.scar) p.line(36, 22, 42, 34, skDD);
  // 2) сглаженный апскейл до 128
  const P = p.scale2x();
  // 3) лицо в высоком разрешении
  const isSkin = (x, y) => { const c = P.get(x, y); if (!c[3]) return false; const s2 = rgb(sk); return Math.abs(c[0] - s2[0]) + Math.abs(c[1] - s2[1]) + Math.abs(c[2] - s2[2]) < 70; };
  drawFaceHi(P, L, emo, talk, blink, sk, skD, skDD, isSkin);
  if (L.glasses) { for (const cx of [50, 78]) { P.ring(cx, 60, 10, '#3a3a3a'); P.ring(cx, 60, 9, '#5a5a5a'); P.line(cx - 6, 54, cx - 3, 52, '#ffffff'); } P.hl(60, 68, 58, '#3a3a3a'); }
  if (L.clownface) { P.poly([[49, 66], [53, 66], [51, 76]], '#111'); P.circ(64, 70, 4, '#d02030'); P.p(63, 68, '#ff8090'); }
  if (creepy) { P.vl(50, 66, 84, '#8a0010'); P.vl(51, 66, 80, '#8a0010'); P.vl(78, 66, 76, '#8a0010'); }
  // блики на волосах
  for (let k = 0; k < 3; k++) { const x0 = 40 + k * 16, y0 = 22 - Math.abs(1 - k) * 4; if (P.a(x0, y0)) { const c = P.get(x0, y0); if (!isSkin(x0, y0)) P.line(x0, y0, x0 + 6, y0 - 2, hex([Math.min(255, c[0] + 60), Math.min(255, c[1] + 60), Math.min(255, c[2] + 60)])); } }
  P.rim(.08, .12);
  P.selOutline(.66);
  if (L.ghost || creepy) P.map((x, y, c) => creepy && !L.ghost ? [c[0] * .9 + 20, c[1] * .75, c[2] * .75, c[3]] : [c[0] * .75 + 60, c[1] * .8 + 60, c[2] * .8 + 70, c[3]]);
  return P.done();
}
// лицо 128px: глаза, брови, нос, рот (говорит/моргает)
function drawFaceHi(P, L, emo, talk, blink, sk, skD, skDD, isSkin) {
  const fem = !!L.fem, ec = L.eyes || '#3a6a9a', ecD = shade(ec, -.45), ecM = shade(ec, -.15), ecL = shade(ec, .35);
  const lash = '#1a0e14', lip = L.lips || shade(sk, -.38);
  const closed = blink || emo === 'happy';
  const eye = (cx, side, wink) => {
    if (!isSkin(cx, 60) && !isSkin(cx - 3, 62)) return; // закрыт волосами
    if (closed || wink) {
      if (emo === 'happy' && !blink) { for (let i = -6; i <= 6; i++) { const y = 61 - Math.round(Math.sqrt(Math.max(0, 36 - i * i)) * .55); P.p(cx + i, y, lash); P.p(cx + i, y + 1, lash); } }
      else { for (let i = -6; i <= 6; i++) { const y = 60 + Math.round((i * i) / 18); P.p(cx + i, y, lash); P.p(cx + i, y + 1, shade(lash, .2)); } if (fem) { P.line(cx + side * 6, 61, cx + side * 8, 63, lash); P.p(cx - 2, 63, lash); P.p(cx + 1, 63, lash); } }
      return;
    }
    if (emo === 'creepy') {
      P.ell(cx, 59, 7, 5, '#060404'); P.circ(cx + 1, 59, 1, '#ff1020'); P.p(cx + 1, 58, '#ff8080');
      for (let i = -7; i <= 7; i++) P.p(cx + i, 53 + Math.round((i * i) / 20), lash);
      return;
    }
    const wide = emo === 'surprised';
    if (fem) {
      P.ell(cx, 59, 7, wide ? 7 : 6, '#ffffff');
      P.ell(cx, 59, 7, 1, '#e8e0ec'); // тень от века
      const ry = wide ? 5 : 6;
      P.ell(cx, 60, 4.5, ry, ecM);
      for (let y = 54; y <= 66; y++) for (let x = cx - 5; x <= cx + 5; x++) { const c = P.get(x, y); if (c[3] && rgb(ecM).every((v, i) => Math.abs(v - c[i]) < 3)) { P.p(x, y, y < 57 ? ecD : y > 62 ? ecL : ec); } }
      P.ell(cx, 60, wide ? 1.5 : 2, wide ? 2 : 3, '#140a18');
      P.r(cx - 4, 55, 3, 3, '#ffffff'); P.p(cx - 3, 58, '#ffffff'); P.p(cx + 2, 63, '#ffffff'); P.p(cx + 3, 62, '#e8f4ff');
      // ресницы: густая верхняя линия с «крылом»
      for (let i = -7; i <= 7; i++) { const y = 53 + Math.round((i * i) / 22); P.p(cx + i, y, lash); P.p(cx + i, y + 1, lash); }
      P.line(cx + side * 7, 53, cx + side * 10, 50, lash); P.line(cx + side * 7, 54, cx + side * 9, 52, lash);
      P.line(cx - side * 7, 55, cx - side * 8, 54, lash);
      for (let i = -4; i <= 4; i++) P.p(cx + i, 66, i === 4 * side ? lash : skDD);
      P.line(cx - 5, 50, cx + 4, 50, skD); // складка века
    } else {
      P.ell(cx, 60, 5, wide ? 5 : 3, '#ffffff');
      P.ell(cx, 60, 3, wide ? 4 : 3, ec); P.ell(cx, 60, 1.5, 2, '#140a18'); P.r(cx - 2, 58, 2, 2, '#ffffff');
      for (let i = -6; i <= 5; i++) { P.p(cx + i, 56 + Math.round((i * i) / 30), lash); P.p(cx + i, 57 + Math.round((i * i) / 30), shade(lash, .2)); }
    }
  };
  eye(50, -1, false);
  eye(78, 1, emo === 'wink');
  // брови
  const bc = shade(L.hair || '#3a2a1a', -.35);
  const brow = (cx, side) => {
    let a = 0; if (emo === 'angry') a = -1; else if (emo === 'sad') a = 1; else if (emo === 'surprised') a = .2;
    const y0 = emo === 'surprised' ? 43 : 46;
    for (let i = -7; i <= 7; i++) { const t = (i * side + 7) / 14; const y = y0 + Math.round(a * (t - .5) * 6 * -1) + (i * i > 30 ? 1 : 0); const w = fem ? (t > .2 && t < .8 ? 2 : 1) : 2; for (let k = 0; k < w; k++) P.p(cx + i, y + k, bc); }
  };
  if (emo !== 'creepy') { brow(50, -1); brow(78, 1); }
  // румянец
  if (emo === 'blush' || emo === 'wink' || (fem && emo === 'happy')) { for (const cx of [44, 84]) { P.ell(cx, 72, 6, 2.5, '#f2909e', 140); for (let k = -2; k <= 2; k++) P.line(cx + k * 3 - 1, 73, cx + k * 3 + 1, 70, '#e86a7e'); } }
  else if (fem) for (const cx of [44, 84]) P.ell(cx, 72, 5, 2, '#f4a8b0', 70);
  // нос
  P.line(66, 68, 66, 72, skD); P.p(65, 73, skDD); P.p(64, 73, skD); P.p(67, 67, shade(sk, .25));
  // рот
  if (!isSkin(64, 80) && !isSkin(64, 78)) return; // скрыт бородой
  const mouthOpen = talk && emo !== 'creepy';
  switch (emo) {
    case 'creepy': P.poly([[46, 76], [82, 76], [76, 88], [52, 88]], '#2a0006'); for (let x = 48; x < 81; x += 4) { P.r(x, 76, 2, 4, '#f0eadc'); P.r(x + 2, 84, 2, 4, '#f0eadc'); } break;
    case 'happy': P.poly([[55, 77], [73, 77], [70, 84], [64, 86], [58, 84]], '#6a1020'); P.hl(56, 72, 77, '#ffffff'); P.hl(57, 71, 78, '#ffffff'); P.ell(64, 84, 4, 1.5, '#e05a6a'); break;
    case 'sad': if (mouthOpen) P.ell(64, 81, 4, 3, '#5a1020'); else for (let i = -5; i <= 5; i++) P.p(64 + i, 80 - Math.round((25 - i * i) / 10), lip); break;
    case 'angry': P.r(56, 78, 17, 5, '#4a0a14'); P.hl(57, 71, 79, '#ffffff'); P.hl(57, 71, 81, '#ffffff'); for (let x = 59; x < 72; x += 3) P.vl(x, 79, 81, '#c8c0b8'); break;
    case 'surprised': P.ell(64, 81, 4, 5, '#5a1020'); P.ell(64, 83, 2.5, 2, '#d05a6a'); break;
    case 'wink': for (let i = -6; i <= 6; i++) P.p(64 + i, 79 + Math.round(i / 3) - (i > 3 ? 1 : 0), lip); P.p(70, 77, lip); break;
    default:
      if (mouthOpen) { P.ell(64, 80, 5, 3.5, '#6a1424'); P.hl(60, 68, 77, '#ffffff'); P.ell(64, 82, 3, 1.5, '#d05a6a'); }
      else { for (let i = -5; i <= 5; i++) P.p(64 + i, 79 + (i * i > 16 ? -1 : 0), lip); for (let i = -3; i <= 3; i++) P.p(64 + i, 80, shade(lip, .25)); }
  }
  if (mouthOpen && (emo === 'happy' || emo === 'blush' || emo === 'wink')) { P.ell(64, 81, 4, 3, '#6a1424'); P.ell(64, 83, 2.5, 1.2, '#d05a6a'); }
}
function drawOutfit(p, L, sk, skD, skDD, top, topD, topL) {
  switch (L.outfit) {
    case 'corset': // Лилит: открытые плечи, корсет
      p.poly([[8, 52], [20, 47], [44, 47], [56, 52], [56, 56], [8, 56]], sk);
      p.poly([[10, 64], [54, 64], [52, 56], [44, 54], [38, 57], [32, 59], [26, 57], [20, 54], [12, 56]], top);
      p.line(32, 51, 32, 58, skDD); p.line(31, 52, 31, 56, skD);
      p.line(20, 54, 26, 57, topL); p.line(44, 54, 38, 57, topL);
      for (let y = 60; y < 64; y += 2) { p.line(29, y, 35, y + 2, '#c9a0ff'); p.line(35, y, 29, y + 2, '#c9a0ff'); }
      p.circ(32, 49, 2, '#7a1a8a'); p.p(32, 49, '#ff60ff');
      p.hl(26, 38, 47, '#1a0a1a');
      break;
    case 'bunny': // Роза: костюм кролика
      p.poly([[8, 52], [20, 47], [44, 47], [56, 52], [58, 58], [6, 58]], sk);
      p.poly([[8, 64], [56, 64], [54, 58], [44, 55], [38, 58], [32, 60], [26, 58], [20, 55], [10, 58]], '#141014');
      p.line(32, 52, 32, 59, skDD); p.line(21, 55, 26, 58, '#3a3040'); p.line(43, 55, 38, 58, '#3a3040');
      p.r(27, 44, 10, 3, '#ffffff'); p.poly([[26, 45], [32, 47], [26, 49]], '#d02030'); p.poly([[38, 45], [32, 47], [38, 49]], '#d02030'); p.circ(32, 47, 1, '#a01020');
      break;
    case 'nurse':
      p.poly([[4, 64], [60, 64], [56, 52], [44, 47], [20, 47], [8, 52]], '#f4f4f6');
      p.poly([[26, 47], [38, 47], [32, 60]], sk); p.line(32, 53, 32, 59, skDD);
      p.line(26, 47, 32, 61, '#c8c8d0'); p.line(38, 47, 32, 61, '#c8c8d0');
      p.p(32, 62, '#c8c8d0'); p.r(44, 54, 6, 6, '#ffffff'); p.r(46, 55, 2, 4, '#d02030'); p.r(45, 56, 4, 2, '#d02030');
      p.r(14, 54, 4, 10, '#7aa0c0');
      break;
    case 'gown': // Офелия: саван, сползающий с плеча
      p.poly([[8, 52], [20, 47], [44, 47], [56, 52], [56, 58], [8, 58]], sk);
      p.poly([[4, 64], [60, 64], [56, 56], [40, 54], [32, 58], [24, 54], [12, 50], [6, 54]], '#e8eef0');
      p.line(32, 52, 32, 58, skDD); p.line(12, 50, 24, 54, '#c8d0d8'); for (let x = 8; x < 60; x += 6) p.line(x, 58, x + 2, 64, '#c8d0d8');
      break;
    case 'frog':
      p.poly([[4, 64], [60, 64], [56, 52], [44, 47], [20, 47], [8, 52]], '#4a9a3a');
      p.poly([[22, 47], [42, 47], [36, 56], [28, 56]], sk); p.line(32, 51, 32, 56, skDD);
      for (let x = 8; x < 58; x += 9) p.ell(x, 60, 3, 2, '#7aca5a');
      for (let k = 0; k < 7; k++) p.circ(24 + k * 3, 47 + Math.abs(3 - k) * -0 + (k % 2), 1, '#fff8f0');
      break;
    case 'lolita':
      p.poly([[4, 64], [60, 64], [56, 52], [44, 47], [20, 47], [8, 52]], '#18141a');
      p.r(24, 42, 16, 7, '#f0f0f0'); for (let x = 24; x < 40; x += 3) p.p(x, 49, '#f0f0f0');
      p.poly([[28, 49], [36, 49], [32, 56]], '#f0f0f0'); p.circ(32, 50, 2, '#b01020');
      for (let k = 0; k < 6; k++) p.circ(10 + k * 9, 58 + (k % 2) * 3, 2, '#000');
      break;
    case 'suit':
      p.poly([[26, 47], [38, 47], [32, 62]], '#f0f0f0'); p.poly([[30, 48], [34, 48], [33, 60], [31, 60]], '#8a2a4a');
      p.line(26, 47, 31, 62, topD); p.line(38, 47, 33, 62, topD);
      break;
    case 'ruff':
      p.poly([[4, 64], [60, 64], [56, 52], [44, 47], [20, 47], [8, 52]], '#f8f8f8');
      for (let x = 12; x < 54; x += 6) { p.ell(x, 47, 4, 3, '#ffffff'); p.ell(x, 48, 3, 1, '#d8d8e0'); }
      p.circ(32, 56, 3, '#111'); p.circ(32, 63, 3, '#111');
      break;
    case 'apron':
      p.poly([[8, 52], [20, 47], [44, 47], [56, 52], [60, 64], [4, 64]], sk);
      p.r(18, 50, 28, 14, '#5a3a20'); p.hl(18, 45, 50, '#3a2410'); p.line(20, 50, 24, 44, '#3a2410'); p.line(44, 50, 40, 44, '#3a2410');
      p.line(14, 56, 16, 62, skDD); p.line(50, 56, 48, 62, skDD);
      break;
    case 'shirt': default:
      p.poly([[26, 47], [38, 47], [32, 53]], sk); p.line(26, 47, 32, 53, topD); p.line(38, 47, 32, 53, topD);
      for (let y = 55; y < 64; y += 4) p.p(32, y, topL);
      break;
  }
}
function drawFace(p, L, emo, sk, skD, skDD) {
  const fem = !!L.fem, ec = L.eyes || '#3a6a9a', ecD = shade(ec, -.4), ecL = shade(ec, .35);
  const lash = '#1a0f14';
  const eye = (cx, closed, wide, wink) => {
    if (closed) { p.line(cx - 4, 31, cx - 2, 29, lash); p.hl(cx - 2, cx + 2, 28, lash); p.line(cx + 2, 29, cx + 4, 31, lash); return; }
    if (emo === 'creepy') { p.ell(cx, 30, 4, 3, '#050505'); p.p(cx, 30, '#ff1020'); p.p(cx + 1, 30, '#ff1020'); p.hl(cx - 4, cx + 4, 26, lash); return; }
    if (fem) {
      p.ell(cx, 30, 4, wide ? 4 : 3, '#ffffff');
      p.ell(cx, 30, 3, wide ? 3 : 3, ec); p.hl(cx - 2, cx + 2, 27, ecD); p.hl(cx - 3, cx + 3, 28, ecD); p.vl(cx, 29, 31, ecD); p.vl(cx + 1, 29, 31, ecD);
      p.p(cx - 1, 28, '#ffffff'); p.p(cx - 1, 29, '#ffffff'); p.p(cx + 1, 32, ecL);
      p.hl(cx - 4, cx + 4, 26, lash); p.hl(cx - 4, cx + 3, 27, lash);
      const outer = cx < 32 ? -1 : 1; p.p(cx + outer * 5, 26, lash); p.p(cx + outer * 5, 25, lash);
      p.hl(cx - 2, cx + 2, 33, skDD);
    } else {
      p.r(cx - 2, 29, 4, 3, '#ffffff'); p.r(cx - 1, 29, 2, 3, ec); p.p(cx - 1, 29, '#fff');
      p.hl(cx - 3, cx + 2, 28, lash);
    }
  };
  // брови
  const bc = shade(L.hair || '#3a2a1a', -.2);
  if (emo === 'angry') { p.line(21, 21, 28, 24, bc); p.line(43, 21, 36, 24, bc); }
  else if (emo === 'sad') { p.line(21, 24, 28, 21, bc); p.line(43, 24, 36, 21, bc); }
  else if (emo !== 'creepy') { p.hl(22, 27, 23, bc); p.hl(37, 42, 23, bc); }
  const closed = emo === 'happy';
  eye(25, closed, emo === 'surprised', false);
  eye(39, closed || emo === 'wink', emo === 'surprised', false);
  // румянец
  if (emo === 'blush' || emo === 'wink' || (fem && emo === 'happy')) { for (let k = 0; k < 3; k++) { p.line(20 + k * 2, 36, 21 + k * 2, 34, '#f07a8a'); p.line(38 + k * 2, 36, 39 + k * 2, 34, '#f07a8a'); } }
  // нос
  p.p(33, 34, skDD); p.p(32, 35, skD);
  // рот
  const lip = L.lips || shade(sk, -.4);
  switch (emo) {
    case 'happy': p.poly([[28, 38], [36, 38], [32, 42]], '#7a1a2a'); p.hl(29, 35, 38, '#ffffff'); p.p(32, 41, '#e05a6a'); break;
    case 'sad': p.line(29, 40, 32, 39, lip); p.line(32, 39, 35, 40, lip); if (L.fem) { p.vl(21, 33, 36, '#9ad0ff'); } break;
    case 'angry': p.hl(28, 36, 40, lip); p.hl(29, 35, 39, '#ffffff'); break;
    case 'blush': p.hl(30, 34, 40, lip); p.p(29, 39, lip); p.p(35, 39, lip); break;
    case 'surprised': p.ell(32, 40, 2, 2, '#5a1020'); break;
    case 'wink': p.line(28, 39, 32, 40, lip); p.line(32, 40, 36, 38, lip); break;
    case 'creepy': p.poly([[22, 37], [42, 37], [38, 43], [26, 43]], '#2a0006'); for (let x = 23; x < 42; x += 2) { p.vl(x, 37, 39, '#f0eadc'); p.vl(x + 1, 41, 43, '#f0eadc'); } break;
    default: p.hl(30, 34, 39, lip); if (L.lips) p.hl(31, 33, 40, shade(lip, .2));
  }
}
function drawHairFront(p, L, st, hr, hrD, hrL) {
  if (st === 'bald') { p.ell(32, 16, 12, 5, shade(L.skin || '#f2c6a0', .2)); p.ell(18, 26, 3, 6, '#d8d8d8'); p.ell(46, 26, 3, 6, '#d8d8d8'); return; }
  // шапка
  p.ell(32, 17, 16, 9, hr);
  p.poly([[16, 17], [48, 17], [47, 22], [17, 22]], hr);
  // чёлка
  const fr = st === 'veil' ? [[17, 16], [47, 16], [46, 23], [41, 20], [37, 26], [33, 22], [29, 38], [25, 43], [22, 30], [18, 33]] :
    st === 'messy' || st === 'spiky' ? [[17, 16], [47, 16], [46, 24], [42, 20], [38, 24], [34, 19], [30, 24], [26, 19], [22, 25], [18, 21]] :
      [[17, 16], [47, 16], [47, 25], [43, 21], [40, 25], [36, 20], [32, 24], [28, 20], [24, 25], [21, 21], [17, 26]];
  p.poly(fr, hr);
  // боковые пряди
  const long = ['long', 'veil', 'wavy', 'twintail'].includes(st);
  const sideTo = long ? 58 : st === 'bob' ? 44 : st === 'short' || st === 'spiky' || st === 'messy' ? 32 : 40;
  p.poly([[15, 20], [20, 20], [21, 36], [19, sideTo], [13, sideTo - 4]], hr);
  p.poly([[44, 20], [49, 20], [51, sideTo - 4], [45, sideTo], [43, 36]], hrD);
  if (st === 'wavy') for (let y = 36; y < 58; y += 6) { p.circ(14, y, 3, hr); p.circ(50, y + 3, 3, hrD); }
  // блики
  p.line(22, 11, 30, 9, hrL); p.line(34, 9, 40, 11, hrL); p.line(21, 13, 25, 12, hrL);
  for (let x = 21; x < 46; x += 5) p.line(x, 16, x + 1, 21, hrD);
  if (st === 'bun') { p.circ(32, 7, 6, hr); p.line(28, 5, 34, 3, hrL); p.line(26, 9, 38, 4, '#c9a24a'); }
  if (st === 'spiky') { p.poly([[18, 14], [14, 4], [24, 10]], hr); p.poly([[28, 9], [30, 0], [36, 9]], hr); p.poly([[40, 10], [50, 4], [46, 16]], hr); }
  if (st === 'twintail') { p.circ(16, 14, 3, '#d02030'); p.circ(48, 14, 3, '#d02030'); }
  if (st === 'ponytail') { p.circ(46, 16, 2, '#f2c430'); }
}
function drawHatBig(p, L) {
  switch (L.hat) {
    case 'witch':
      p.ell(32, 14, 30, 5, '#1e1228'); p.ell(32, 13, 28, 3, '#2e1a40');
      p.poly([[16, 13], [48, 13], [42, -2], [30, -6], [22, 2]], '#2e1a40'); p.poly([[30, -6], [42, -2], [52, 4], [50, 8]], '#2e1a40');
      p.hl(17, 47, 11, '#8a4ad0'); p.hl(17, 47, 10, '#6a2ab0'); p.circ(40, 10, 2, '#f2c430');
      break;
    case 'bunny':
      p.ell(23, 4, 4, 11, '#ffffff'); p.ell(41, 4, 4, 11, '#ffffff'); p.ell(23, 5, 2, 8, '#f5a0b0'); p.ell(41, 5, 2, 8, '#f5a0b0');
      p.hl(16, 48, 14, '#111'); p.hl(17, 47, 15, '#222');
      break;
    case 'nurse': p.poly([[20, 12], [44, 12], [42, 4], [22, 4]], '#ffffff'); p.r(30, 5, 4, 6, '#d02030'); p.r(28, 7, 8, 2, '#d02030'); break;
    case 'frog':
      p.ell(32, 16, 19, 10, '#4a9a3a'); p.poly([[13, 16], [51, 16], [52, 30], [48, 22], [16, 22], [12, 30]], '#4a9a3a');
      p.circ(20, 6, 6, '#5aab3c'); p.circ(44, 6, 6, '#5aab3c'); p.circ(20, 6, 3, '#ffffff'); p.circ(44, 6, 3, '#ffffff'); p.r(19, 5, 2, 3, '#000'); p.r(43, 5, 2, 3, '#000');
      p.poly([[26, 10], [38, 10], [36, 4], [32, 7], [28, 4]], '#f2c430'); p.p(32, 8, '#d02030');
      break;
    case 'clown': p.poly([[20, 12], [44, 12], [32, -6]], '#ffffff'); p.circ(32, -4, 3, '#d02030'); p.circ(28, 6, 2, '#111'); p.circ(35, 2, 2, '#111'); break;
    case 'top': p.r(20, -4, 24, 16, '#1a1a1a'); p.ell(32, 12, 20, 3, '#1a1a1a'); p.r(20, 6, 24, 3, '#a02040'); p.r(36, 2, 6, 6, '#f2f2f2'); break;
    case 'bandana': p.poly([[16, 18], [48, 18], [46, 10], [18, 10]], '#a02a2a'); p.poly([[46, 14], [56, 20], [52, 24]], '#802020'); p.speck(18, 10, 28, 8, ['#fff'], .08, 3); break;
    case 'ribbon': p.poly([[14, 8], [28, 12], [14, 18]], '#111'); p.poly([[50, 8], [36, 12], [50, 18]], '#111'); p.circ(32, 12, 3, '#f0f0f0'); p.line(52, 10, 58, -4, '#e8e0d0'); p.line(53, 10, 59, -4, '#888'); break;
    case 'crown': p.poly([[24, 10], [40, 10], [42, 0], [37, 5], [32, -2], [27, 5], [22, 0]], '#f2c430'); p.p(32, 3, '#d02030'); break;
    case 'straw': p.ell(32, 14, 28, 5, '#d8b060'); p.ell(32, 9, 14, 7, '#e8c070'); p.hl(18, 46, 13, '#a03030'); break;
  }
}

/* ---------- особые портреты ---------- */
function specialPortrait(kind, emo) {
  const p = new PX(64, 64);
  if (kind === 'cat') {
    const c = '#9a5ad0', c2 = '#e070c0';
    p.ell(32, 34, 22, 18, c); p.poly([[12, 26], [16, 4], [26, 20]], c); p.poly([[52, 26], [48, 4], [38, 20]], c);
    p.poly([[15, 22], [17, 9], [23, 19]], c2); p.poly([[49, 22], [47, 9], [41, 19]], c2);
    for (let k = 0; k < 5; k++) { p.line(14 + k * 9, 18, 18 + k * 9, 26, c2); }
    p.ell(23, 30, 5, 6, '#f2e040'); p.ell(41, 30, 5, 6, '#f2e040'); p.r(22, 26, 2, 9, '#000'); p.r(40, 26, 2, 9, '#000');
    p.poly([[12, 40], [52, 40], [44, 50], [20, 50]], '#fff'); for (let x = 14; x < 52; x += 3) p.vl(x, 40, 50, '#c8c0d0'); p.hl(12, 52, 40, '#2a0a2a'); p.hl(18, 46, 50, '#2a0a2a');
    p.poly([[30, 36], [34, 36], [32, 38]], '#e070c0');
    if (emo === 'creepy') { p.ell(23, 30, 5, 6, '#000'); p.ell(41, 30, 5, 6, '#000'); p.p(23, 30, '#f00'); p.p(41, 30, '#f00'); }
  } else if (kind === 'shadow') {
    p.ell(32, 30, 18, 20, '#140e18'); p.poly([[6, 64], [58, 64], [50, 44], [14, 44]], '#140e18');
    p.ell(24, 28, 4, 5, '#e8e0ff'); p.ell(40, 28, 4, 5, '#e8e0ff'); p.ell(24, 29, 2, 3, '#6a40c0'); p.ell(40, 29, 2, 3, '#6a40c0');
    if (emo === 'happy') { p.line(26, 40, 32, 43, '#e8e0ff'); p.line(32, 43, 38, 40, '#e8e0ff'); }
    p.speck(6, 4, 52, 60, ['#2a2030'], .08, 7);
  } else if (kind === 'zhmur') {
    p.ell(32, 34, 20, 18, '#9aff9a', 200); p.ell(32, 30, 16, 14, '#d8ffd8'); p.circ(25, 30, 3, '#000'); p.circ(39, 30, 3, '#000'); p.p(24, 29, '#fff'); p.p(38, 29, '#fff'); p.ell(32, 40, 3, 2, '#000');
    p.vl(32, 6, 16, '#3a8a3a'); p.ell(36, 6, 4, 2, '#5ac85a');
  } else if (kind === 'fairy') {
    p.ell(16, 30, 12, 18, '#c8ffd8', 120); p.ell(48, 30, 12, 18, '#c8ffd8', 120);
    p.ell(32, 30, 12, 13, '#f8e0c8'); p.ell(32, 20, 14, 9, '#5aca5a'); p.poly([[18, 22], [46, 22], [44, 30], [38, 26], [32, 30], [26, 26], [20, 30]], '#5aca5a');
    p.ell(27, 32, 2, 3, '#3a8a3a'); p.ell(37, 32, 2, 3, '#3a8a3a'); p.p(26, 31, '#fff'); p.p(36, 31, '#fff'); p.hl(30, 34, 38, '#d07070');
    p.poly([[10, 64], [54, 64], [44, 46], [20, 46]], '#7ad87a'); p.ell(32, 12, 6, 3, '#3a9a3a');
  }
  p.outline(OUTLINE);
  return p.done();
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
