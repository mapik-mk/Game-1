/* ============================================================
   Иконки предметов 16x16
   ============================================================ */
const TIER_COL = ['#8a8a8a', '#c87a3a', '#d8dee6', '#f2c430', '#a0204a'];
const ICON = {
  tool(p, [kind, tier = 0]) {
    const m = TIER_COL[tier], h = '#7a4a24';
    switch (kind) {
      case 'hoe': p.line(3, 14, 11, 4, h); p.line(4, 14, 12, 4, shade(h, .2)); p.r(9, 2, 5, 3, m); p.r(12, 2, 2, 6, m); break;
      case 'can': p.r(3, 6, 8, 7, m); p.r(3, 6, 8, 2, shade(m, .3)); p.line(11, 8, 14, 5, m); p.p(15, 4, m); p.ring(6, 5, 2, shade(m, -.3)); p.p(5, 10, '#4aa0ff'); break;
      case 'axe': p.line(4, 14, 10, 3, h); p.line(5, 14, 11, 3, shade(h, .2)); p.poly([[8, 2], [14, 3], [13, 9], [9, 7]], m); p.line(13, 3, 13, 8, shade(m, .4)); break;
      case 'pick': p.line(4, 14, 10, 4, h); p.line(5, 14, 11, 4, shade(h, .2)); p.line(3, 5, 8, 2, m); p.line(8, 2, 14, 5, m); p.line(3, 6, 8, 3, shade(m, -.2)); p.line(8, 3, 14, 6, shade(m, -.2)); break;
      case 'scythe': p.line(4, 15, 9, 3, h); p.poly([[8, 2], [15, 3], [13, 6], [10, 4]], m); p.line(9, 2, 15, 3, shade(m, .5)); break;
      case 'rod': p.line(2, 15, 13, 2, h); p.line(3, 15, 14, 2, shade(h, .3)); p.line(14, 2, 14, 10, '#ddd'); p.p(14, 11, '#d02030'); p.r(3, 11, 3, 3, '#3a3a3a'); break;
    }
  },
  sword(p, [blade = '#c8d0d8', hilt = '#7a4a24', style = 0]) {
    if (style === 1) { p.poly([[3, 13], [12, 2], [14, 4], [5, 14]], blade); } // широкий
    else if (style === 2) { p.line(3, 13, 13, 3, blade); p.line(4, 13, 14, 3, shade(blade, .4)); p.line(13, 3, 14, 1, blade); } // рапира
    else if (style === 3) { p.poly([[3, 12], [10, 5], [14, 1], [13, 6], [5, 14]], blade); p.line(6, 11, 13, 3, shade(blade, .5)); } // лунный
    else if (style === 4) { p.line(3, 13, 9, 7, blade); p.line(4, 13, 10, 7, shade(blade, .4)); p.p(10, 6, blade); } // сломанный
    else if (style === 5) { p.line(3, 13, 12, 4, '#2a2a2a'); p.poly([[10, 6], [15, 0], [13, 5]], '#f0eadc'); } // перо
    else { p.line(3, 12, 13, 2, blade); p.line(4, 12, 14, 2, shade(blade, .4)); p.line(4, 13, 14, 3, shade(blade, -.2)); }
    p.line(2, 10, 6, 14, '#5a4a3a'); p.line(1, 15, 4, 12, hilt); p.p(1, 15, shade(hilt, -.3));
  },
  seed(p, [c1, c2 = '#6a4a2a']) {
    p.r(3, 2, 10, 12, '#e8dcc0'); p.r(3, 2, 10, 3, c1); p.r(4, 6, 8, 6, shade(c1, .5));
    p.ell(8, 9, 2, 2, c1); p.p(7, 8, shade(c1, .5)); p.hl(5, 10, 13, '#c8b898');
    for (let k = 0; k < 3; k++) p.p(5 + k * 3, 3, c2);
  },
  root(p, [c = '#f2e0a0', leaf = '#4a9a3a']) { p.poly([[5, 6], [11, 6], [9, 15], [7, 15]], c); p.line(6, 8, 9, 9, shade(c, -.2)); p.line(7, 11, 9, 12, shade(c, -.2)); p.line(8, 6, 5, 1, leaf); p.line(8, 6, 8, 0, leaf); p.line(8, 6, 11, 1, leaf); },
  round(p, [c, c2, eyes = 0, stem = '#4a7a2a']) { p.circ(8, 9, 5, c); p.circ(6, 7, 2, shade(c, .25)); if (c2) p.speck(4, 5, 9, 9, [c2], .1, 3); if (eyes) { p.r(5, 8, 2, 2, '#fff'); p.r(9, 8, 2, 2, '#fff'); p.p(6, 9, '#000'); p.p(10, 9, '#000'); } if (stem) p.vl(8, 2, 4, stem); },
  brain(p) { p.circ(8, 8, 6, '#f0a0b0'); p.line(8, 3, 8, 13, '#c06070'); for (const [a, b, c, d] of [[3, 6, 6, 8], [10, 7, 13, 5], [4, 11, 7, 10], [9, 11, 12, 12], [5, 4, 7, 6]]) p.line(a, b, c, d, '#c06070'); p.r(5, 13, 6, 2, '#4a9a3a'); },
  garlic(p) { p.ell(8, 10, 5, 4, '#f4f0e6'); p.vl(8, 7, 13, '#d8d0c0'); p.vl(5, 8, 12, '#d8d0c0'); p.vl(11, 8, 12, '#d8d0c0'); p.line(8, 6, 8, 1, '#7aaa5a'); },
  heart(p, [c = '#d82030']) { p.circ(5, 7, 3, c); p.circ(11, 7, 3, c); p.poly([[2, 8], [14, 8], [8, 15]], c); p.p(4, 5, '#ff9aa0'); p.hl(6, 10, 3, '#3a7a2a'); p.vl(8, 1, 3, '#3a7a2a'); },
  eyeberry(p) { for (const [x, y] of [[5, 6], [10, 7], [7, 11]]) { p.circ(x, y, 3, '#3a5ad0'); p.circ(x, y, 1, '#fff'); p.p(x, y, '#000'); } },
  skull(p) { p.ell(8, 8, 6, 6, '#7ac85a'); p.r(5, 7, 2, 2, '#1a3a1a'); p.r(9, 7, 2, 2, '#1a3a1a'); p.hl(6, 10, 11, '#1a3a1a'); p.p(7, 12, '#1a3a1a'); p.p(9, 12, '#1a3a1a'); p.line(3, 4, 5, 6, '#4a8a3a'); },
  pepper(p) { p.poly([[6, 4], [10, 4], [12, 9], [9, 15], [5, 9]], '#e02020'); p.line(7, 5, 6, 10, '#ff8080'); p.line(8, 4, 9, 1, '#3a7a2a'); },
  sunflower(p) { for (let a = 0; a < 8; a++) p.circ(8 + Math.round(Math.cos(a) * 4), 7 + Math.round(Math.sin(a) * 4), 2, '#f2c430'); p.circ(8, 7, 3, '#5a3a1a'); p.p(7, 6, '#fff'); p.p(9, 6, '#fff'); p.p(7, 7, '#000'); p.p(9, 7, '#000'); p.vl(8, 11, 15, '#3a7a2a'); },
  pumpkin(p, [face = 1]) { p.ell(8, 9, 7, 5, '#e07a20'); p.vl(5, 5, 13, '#b05a10'); p.vl(11, 5, 13, '#b05a10'); p.vl(8, 1, 4, '#4a6a2a'); if (face) { p.poly([[4, 7], [6, 7], [5, 9]], '#3a1a00'); p.poly([[10, 7], [12, 7], [11, 9]], '#3a1a00'); p.hl(5, 11, 11, '#3a1a00'); } },
  eggplant(p) { p.ell(9, 10, 4, 5, '#5a2a7a'); p.ell(8, 9, 2, 3, '#7a4a9a'); p.poly([[6, 4], [11, 4], [9, 6]], '#4a7a2a'); },
  cranberry(p) { for (const [x, y] of [[5, 6], [10, 6], [7, 10], [11, 11], [4, 11]]) { p.circ(x, y, 2, '#a01020'); p.p(x - 1, y - 1, '#ff6070'); } },
  beet(p) { p.circ(8, 10, 5, '#8a1a3a'); p.p(6, 8, '#c04060'); p.vl(8, 14, 15, '#8a1a3a'); p.line(8, 5, 5, 0, '#3a8a3a'); p.line(8, 5, 11, 0, '#a03050'); },
  mandrake(p) { p.poly([[5, 5], [11, 5], [12, 11], [9, 15], [7, 15], [4, 11]], '#c8a070'); p.p(6, 8, '#000'); p.p(9, 8, '#000'); p.ell(8, 11, 1, 1, '#3a1a0a'); p.line(4, 10, 1, 12, '#c8a070'); p.line(12, 10, 15, 12, '#c8a070'); p.line(8, 5, 5, 0, '#3a8a3a'); p.line(8, 5, 11, 0, '#3a8a3a'); },
  blackfruit(p) { p.circ(8, 9, 5, '#0a0a0e'); p.circ(6, 7, 1, '#4a2a6a'); p.vl(8, 1, 4, '#2a1a2a'); p.p(9, 9, '#d02030'); p.ring(8, 9, 6, '#6a2a9a'); },
  blackseed(p) { p.ell(8, 9, 3, 4, '#0a0a0e'); p.p(7, 7, '#5a3a8a'); p.ring(8, 9, 5, '#6a2a9a'); p.p(8, 9, '#d02030'); },
  flower(p, [c = '#f2e040', ctr = '#c87a20']) { for (let a = 0; a < 5; a++) p.circ(8 + Math.round(Math.cos(a * 1.26) * 3), 6 + Math.round(Math.sin(a * 1.26) * 3), 2, c); p.circ(8, 6, 1, ctr); p.line(8, 9, 8, 15, '#3a8a2a'); p.line(8, 12, 11, 10, '#3a8a2a'); },
  leek(p) { p.r(6, 8, 4, 7, '#f4f0e6'); p.poly([[6, 8], [10, 8], [13, 0], [10, 2], [8, 0], [5, 1]], '#4aaa3a'); },
  mushroom(p, [cap = '#c8a060', spots = null, stem = '#f0e8d8']) { p.r(6, 9, 4, 6, stem); p.ell(8, 7, 6, 4, cap); p.ell(6, 6, 2, 1, shade(cap, .3)); if (spots) { p.p(5, 6, spots); p.p(10, 5, spots); p.p(8, 8, spots); } },
  berry(p, [c = '#2a1a4a', leaf = '#3a8a2a']) { for (const [x, y] of [[6, 7], [10, 7], [8, 10], [6, 12], [10, 12]]) { p.circ(x, y, 2, c); p.p(x - 1, y - 1, shade(c, .5)); } p.line(8, 5, 10, 1, leaf); },
  grape(p) { for (const [x, y] of [[6, 5], [10, 5], [8, 8], [5, 9], [11, 9], [8, 12]]) { p.circ(x, y, 2, '#6a2a9a'); p.p(x - 1, y - 1, '#b080e0'); } p.vl(8, 1, 3, '#5a3a1a'); },
  crystal(p, [c = '#9ad0ff']) { p.poly([[8, 1], [13, 6], [8, 15], [3, 6]], c); p.line(8, 1, 8, 15, shade(c, .4)); p.line(3, 6, 13, 6, shade(c, -.2)); },
  holly(p) { p.poly([[2, 8], [7, 4], [8, 9]], '#2a7a2a'); p.poly([[14, 8], [9, 4], [8, 9]], '#2a7a2a'); p.circ(7, 11, 2, '#d02020'); p.circ(10, 11, 2, '#d02020'); },
  log(p, [c = '#8a5a30', end = '#c49a62']) { p.r(2, 6, 11, 7, c); p.hl(2, 12, 8, shade(c, -.2)); p.hl(2, 12, 11, shade(c, -.2)); p.ell(13, 9, 2, 3, end); p.p(13, 9, shade(end, -.3)); },
  stone(p, [c = '#8a8580']) { p.ell(8, 9, 6, 5, c); p.ell(7, 8, 4, 3, shade(c, .2)); p.p(5, 7, shade(c, .5)); p.line(9, 10, 12, 11, shade(c, -.3)); },
  fiber(p) { for (let k = 0; k < 5; k++) p.line(4 + k * 2, 15, 6 + k, 2 + (k % 2) * 2, k % 2 ? '#7aaa3a' : '#5a8a2a'); },
  ore(p, [c]) { p.ell(8, 9, 6, 5, '#6d6a70'); p.ell(7, 8, 4, 3, '#8d8a90'); for (const [x, y] of [[5, 7], [9, 9], [7, 11], [11, 7]]) { p.r(x, y, 2, 2, c); p.p(x, y, shade(c, .5)); } },
  bar(p, [c]) { p.poly([[2, 11], [5, 6], [14, 6], [11, 11]], c); p.poly([[2, 11], [11, 11], [11, 13], [2, 13]], shade(c, -.3)); p.poly([[11, 11], [14, 6], [14, 8], [11, 13]], shade(c, -.45)); p.line(5, 7, 12, 7, shade(c, .5)); },
  gem(p, [c]) { p.poly([[4, 6], [7, 3], [9, 3], [12, 6], [8, 14]], c); p.poly([[4, 6], [12, 6], [8, 14]], shade(c, -.2)); p.line(6, 4, 7, 6, shade(c, .6)); p.p(6, 5, '#fff'); },
  geode(p, [c = '#a0784a', inner = null]) { p.circ(8, 8, 6, c); p.speck(3, 3, 11, 11, [shade(c, -.3)], .2, 2); if (inner) { p.circ(8, 8, 3, inner); p.p(7, 7, '#fff'); } else p.line(5, 6, 10, 11, shade(c, -.5)); },
  slime(p) { p.ell(8, 10, 6, 4, '#5ac84a'); p.ell(6, 8, 2, 1, '#c8f8b8'); p.p(11, 13, '#5ac84a'); p.p(4, 14, '#5ac84a'); },
  bone(p) { p.line(4, 12, 12, 4, '#efe8dc'); p.line(5, 12, 12, 5, '#efe8dc'); p.circ(3, 12, 1, '#efe8dc'); p.circ(5, 14, 1, '#efe8dc'); p.circ(11, 3, 1, '#efe8dc'); p.circ(13, 5, 1, '#efe8dc'); },
  ecto(p) { p.ell(8, 8, 5, 6, '#c8f0ff', 200); p.p(6, 7, '#000'); p.p(10, 7, '#000'); for (let x = 3; x < 14; x += 3) p.p(x, 14, '#c8f0ff'); },
  essence(p, [c = '#6a3ad0']) { p.circ(8, 8, 5, shade(c, -.4)); p.circ(8, 8, 3, c); p.circ(7, 7, 1, '#fff'); p.ring(8, 8, 6, shade(c, .3)); },
  wing(p) { p.poly([[2, 4], [14, 8], [10, 14], [7, 10], [4, 12]], '#4a3a5a'); p.line(2, 4, 10, 12, '#7a6a8a'); },
  eyeball(p) { p.circ(8, 8, 5, '#f4ece4'); p.circ(9, 8, 2, '#3a8a5a'); p.p(9, 8, '#000'); p.line(3, 9, 5, 8, '#d03040'); p.line(9, 3, 8, 5, '#d03040'); },
  fish(p, [c = '#8a9aa0', c2 = '#c8d4dc', shape = 0]) {
    if (shape === 1) { p.ell(8, 8, 6, 2, c); p.poly([[1, 6], [3, 8], [1, 10]], c2); } // угорь/щука
    else if (shape === 2) { p.ell(8, 8, 5, 5, c); p.poly([[1, 5], [4, 8], [1, 11]], c2); p.poly([[6, 2], [10, 3], [8, 5]], c2); } // круглая
    else { p.ell(8, 8, 6, 4, c); p.poly([[0, 4], [3, 8], [0, 12]], c2); p.poly([[6, 3], [11, 3], [9, 5]], c2); }
    p.circ(12, 7, 1, '#fff'); p.p(12, 7, '#000'); p.line(5, 9, 10, 9, shade(c, .3)); p.p(14, 9, shade(c, -.4));
  },
  plate(p, [c = '#c87a3a', c2 = '#e0c060']) { p.ell(8, 11, 7, 3, '#f4f4f4'); p.ell(8, 11, 5, 2, '#d8d8d8'); p.ell(8, 8, 4, 3, c); p.ell(7, 7, 2, 1, c2); p.p(10, 8, shade(c, -.3)); },
  bowl(p, [c = '#c84a2a', c2 = '#f0d060']) { p.poly([[2, 8], [14, 8], [11, 14], [5, 14]], '#e8e8f0'); p.ell(8, 8, 6, 2, c); p.p(6, 8, c2); p.p(10, 7, c2); p.line(10, 2, 12, 5, '#ccc'); p.line(6, 3, 5, 6, '#ccc', 120); },
  cup(p, [c = '#7a3a1a']) { p.r(4, 6, 7, 8, '#f4f4f4'); p.r(5, 7, 5, 2, c); p.ring(12, 9, 2, '#f4f4f4'); p.ell(7, 14, 5, 1, '#d8d8d8'); p.line(6, 4, 7, 1, '#ccc', 140); p.line(9, 4, 8, 1, '#ccc', 140); },
  bottle(p, [c = '#7a1a3a', label = '#f0e0c0']) { p.r(6, 1, 4, 4, shade(c, -.3)); p.r(4, 5, 8, 10, c); p.r(5, 8, 6, 4, label); p.vl(5, 5, 14, shade(c, .4)); },
  jar(p, [c = '#d8a040']) { p.r(4, 4, 8, 11, '#cde4f0'); p.r(5, 7, 6, 7, c); p.r(4, 2, 8, 2, '#8a8a8a'); p.vl(5, 5, 13, '#fff'); },
  potion(p, [c = '#4af04a']) { p.r(7, 1, 2, 3, '#8a6a4a'); p.r(6, 4, 4, 2, '#cde4f0'); p.circ(8, 10, 4, '#cde4f0'); p.circ(8, 11, 3, c); p.p(6, 9, '#fff'); },
  pill(p) { p.poly([[3, 10], [9, 4], [12, 7], [6, 13]], '#f4f4f4'); p.poly([[9, 4], [12, 7], [10, 9], [7, 6]], '#d02030'); },
  page(p, [n = 0]) { p.poly([[3, 1], [12, 1], [14, 3], [14, 15], [3, 15]], '#f2efe6'); p.poly([[12, 1], [14, 3], [12, 3]], '#c8c4b8'); for (let y = 4; y < 14; y += 2) p.hl(5, 12, y, '#555'); p.p(10, 13, '#c00'); p.p(11, 14, '#c00'); },
  letter(p) { p.r(2, 4, 12, 9, '#f4ecd8'); p.line(2, 4, 8, 9, '#a08a60'); p.line(14, 4, 8, 9, '#a08a60'); p.circ(8, 9, 1, '#c02030'); },
  pendant(p) { p.ring(8, 6, 5, '#c9a24a'); p.circ(8, 12, 3, '#3ac8e0'); p.p(7, 11, '#fff'); },
  bouquet(p) { p.poly([[5, 9], [11, 9], [9, 15], [7, 15]], '#5a8a3a'); for (const [x, y, c] of [[5, 5, '#f28cc0'], [9, 3, '#f2e040'], [11, 6, '#f28cc0'], [7, 7, '#ffffff']]) p.circ(x, y, 2, c); p.hl(6, 10, 10, '#d02030'); },
  shorts(p) { p.poly([[3, 3], [13, 3], [14, 13], [9, 13], [8, 8], [7, 13], [2, 13]], '#7a3ac0'); p.hl(3, 13, 4, '#5a2a9a'); p.p(8, 5, '#f2c430'); },
  estus(p, [full = 1]) { p.r(7, 1, 2, 3, '#8a6a4a'); p.circ(8, 10, 5, '#d8c8a0'); p.circ(8, 10, 4, full ? '#ff8a20' : '#5a4a3a'); if (full) { p.circ(7, 9, 1, '#ffe080'); } p.ring(8, 10, 5, '#8a6a3a'); },
  bomb(p) { p.circ(8, 10, 5, '#2a2a2a'); p.p(6, 8, '#6a6a6a'); p.line(8, 5, 11, 2, '#8a6a3a'); p.p(12, 1, '#ff8020'); p.p(11, 1, '#ffe060'); },
  ring(p, [c = '#c9a24a', g = '#d02030']) { p.ring(8, 9, 4, c); p.ring(8, 9, 3, shade(c, -.2)); p.circ(8, 4, 2, g); },
  hat(p, [c = '#2a1a3a']) { p.ell(8, 12, 7, 2, c); p.r(4, 3, 8, 9, c); p.hl(4, 11, 9, '#d02030'); },
  crown(p) { p.poly([[2, 13], [14, 13], [14, 4], [11, 8], [8, 2], [5, 8], [2, 4]], '#f2c430'); p.p(8, 9, '#d02030'); },
  ball(p) { p.circ(8, 8, 6, '#f2c430'); p.circ(6, 6, 2, '#fff8c0'); p.ring(8, 8, 6, '#a07a10'); },
  shoe(p) { p.poly([[2, 8], [7, 8], [8, 11], [14, 12], [14, 14], [2, 14]], '#5a3a2a'); p.hl(2, 14, 14, '#2a1a10'); },
  weed(p) { p.line(4, 14, 3, 4, '#2a6a4a'); p.line(8, 14, 9, 2, '#3a8a5a'); p.line(12, 14, 13, 5, '#2a6a4a'); },
  coal(p) { p.ell(8, 9, 5, 4, '#1a1a1a'); p.p(6, 7, '#5a5a5a'); p.p(10, 9, '#3a3a3a'); },
  clay(p) { p.ell(8, 10, 6, 4, '#b8704a'); p.ell(7, 9, 3, 2, '#d0906a'); },
  object(p, [kind]) { const c = objSprite({ t: kind === 'qsprinkler' ? 'sprinkler' : kind, tier: kind === 'qsprinkler' ? 2 : 1 }, 0); if (c) p.g.drawImage(c, 0, 0, c.width, c.height, (16 - Math.min(16, c.width * 16 / c.height)) / 2, 0, Math.min(16, c.width * 16 / c.height), 16); p._img = true; },
  tear(p) { p.poly([[8, 1], [12, 9], [8, 15], [4, 9]], '#9ad0ff'); p.p(6, 8, '#fff'); },
  cake(p, [c = '#f0d0a0']) { p.r(3, 7, 10, 7, c); p.r(3, 6, 10, 2, '#fff'); p.circ(8, 4, 1, '#d02030'); p.hl(3, 12, 10, '#d07070'); },
  smile(p) { p.poly([[1, 6], [15, 6], [12, 12], [4, 12]], '#ffffff'); for (let x = 2; x < 15; x += 2) p.vl(x, 6, 12, '#c8c0d0'); p.hl(1, 15, 6, '#7a2a7a'); p.hl(4, 12, 12, '#7a2a7a'); },
  feather(p) { p.line(3, 14, 13, 2, '#f0eadc'); p.poly([[6, 10], [13, 2], [10, 9]], '#f0eadc'); p.line(3, 14, 6, 11, '#2a2a2a'); },
  torch(p) { p.vl(8, 6, 15, '#6a4a2a'); p.circ(8, 4, 2, '#ff8020'); p.p(8, 3, '#ffe060'); },
  key(p) { p.ring(5, 5, 3, '#c9a24a'); p.line(7, 7, 14, 14, '#c9a24a'); p.line(11, 13, 13, 11, '#c9a24a'); },
};
function itemIconCanvas(id, of) {
  const it0 = ITEMS[id];
  if (it0 && it0.type === 'tool' && (of === undefined || of === null)) of = (S && S.tools && S.tools[it0.tool]) || 0;
  if (it0 && it0.type === 'estus' && (of === undefined || of === null)) of = (S && S.estus > 0) ? 1 : 0;
  return spr(`icon:${id}:${of === undefined || of === null ? '' : of}`, () => {
    const it = ITEMS[id]; const p = new PX(16, 16);
    if (!it) { p.r(4, 4, 8, 8, '#f0f'); return p.done(); }
    let ic = it.ic || ['stone'];
    if (it.type === 'tool') ic = ['tool', it.tool, of | 0];
    if (it.type === 'estus') ic = ['estus', of | 0];
    if (it.artisan && of && ITEMS[of]) { // вино/джем — цвет исходника
      const col = ITEMS[of].col || '#a03050';
      ic = [ic[0], col];
    }
    const fn = ICON[ic[0]]; if (fn) fn(p, ic.slice(1));
    if (p._img) return p.c;
    p.outline(it.type === 'tool' || it.type === 'weapon' ? '#1a1010' : '#2a1a10');
    return p.done();
  });
}
function iconURL(id, of) {
  const it0 = ITEMS[id];
  if (it0 && it0.type === 'tool' && (of === undefined || of === null)) of = (S && S.tools && S.tools[it0.tool]) || 0;
  if (it0 && it0.type === 'estus' && (of === undefined || of === null)) of = (S && S.estus > 0) ? 1 : 0;
  return dataURL(`i:${id}:${of === undefined || of === null ? '' : of}`, () => { const c = itemIconCanvas(id, of); const o = mkCanvas(32, 32); const g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, 32, 32); return o; }); }
function uiIconURL(kind) {
  return dataURL('ui:' + kind, () => {
    const p = new PX(16, 16);
    if (kind === 'hand') { p.r(5, 6, 7, 8, '#f2c6a0'); for (let k = 0; k < 4; k++) p.r(5 + k * 2, 2 + (k % 2), 1, 5, '#f2c6a0'); p.r(3, 8, 2, 4, '#f2c6a0'); p.outline('#3a1a0a'); }
    if (kind === 'heart') { ICON.heart(p, ['#d02030']); p.outline('#3a0a0a'); }
    return p.done().toDataURL();
  });
}
