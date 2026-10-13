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
/* ---------- детальные 32x32 инструменты и оружие ---------- */
const METAL = [
  { b: '#9aa3ae', l: '#e2e8ef', d: '#59616c', e: '#ffffff' },   // обычный
  { b: '#cf7a3c', l: '#f6b07a', d: '#874118', e: '#ffe0c0', pat: '#5fb39a' }, // медь
  { b: '#b9cadb', l: '#f2f8ff', d: '#62748a', e: '#ffffff' },   // железо
  { b: '#f2c22e', l: '#fff3a6', d: '#a3730c', e: '#ffffff' },   // золото
  { b: '#a01c44', l: '#ff6a8a', d: '#4e0618', e: '#ffd0da' },   // кровь
];
const WOOD = { b: '#93602f', l: '#c08a52', d: '#5a3518', g: '#7a4c24' };
function thick(p, x0, y0, x1, y1, w, col) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 || 1; for (let i = 0; i <= n; i++) { const t = i / n; const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; p.r(Math.round(x - w / 2), Math.round(y - w / 2), w, w, col); } }
function handle(p, x0, y0, x1, y1, w = 3, wrap = false) {
  thick(p, x0, y0, x1, y1, w, WOOD.b);
  const nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny); const ox = nx / L, oy = ny / L;
  p.line(x0 + ox * (w / 2 - .5), y0 + oy * (w / 2 - .5), x1 + ox * (w / 2 - .5), y1 + oy * (w / 2 - .5), WOOD.d);
  p.line(x0 - ox * (w / 2 - .5), y0 - oy * (w / 2 - .5), x1 - ox * (w / 2 - .5), y1 - oy * (w / 2 - .5), WOOD.l);
  for (let k = .15; k < .9; k += .22) p.p(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, WOOD.g);
  if (wrap) for (let k = 0; k < 4; k++) { const t = .72 + k * .07; const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; thick(p, x, y, x + .01, y, w + 1, k % 2 ? '#4a2c1c' : '#6a4230'); }
}
const TOOL32 = {
  hoe(p, M) {
    handle(p, 6, 29, 21, 9, 3, true);
    p.poly([[18, 5], [29, 4], [29, 8], [26, 16], [22, 16], [20, 9]], M.b);
    p.poly([[18, 5], [29, 4], [29, 6], [20, 7]], M.l);
    p.line(22, 16, 26, 16, M.e); p.line(26, 16, 28, 9, M.d);
    p.r(19, 7, 3, 4, M.d); p.p(20, 8, M.l);
    if (M.pat) { p.p(24, 10, M.pat); p.p(27, 7, M.pat); }
  },
  can(p, M) {
    for (let a = 0; a < 6.3; a += .12) { p.p(8 + Math.cos(a) * 4, 17 + Math.sin(a) * 6, M.d); p.p(8 + Math.cos(a) * 3.4, 17 + Math.sin(a) * 5.4, M.b); }
    p.r(9, 11, 13, 15, M.b); p.ell(15, 11, 6, 2, M.b); p.ell(15, 26, 6, 2, M.d);
    p.r(10, 12, 2, 13, M.l); p.r(19, 12, 2, 13, M.d);
    p.hl(9, 21, 15, M.d); p.hl(9, 21, 21, M.d); p.hl(9, 21, 16, M.l);
    p.ell(15, 11, 5, 1, '#2a2f38'); if (S && S.water > 0) p.ell(15, 11, 4, 1, '#5aa8ff');
    thick(p, 21, 21, 28, 11, 2, M.b); p.line(21, 20, 28, 10, M.l);
    p.ell(29, 9, 2, 3, M.d); p.p(29, 8, M.e); p.p(30, 10, '#2a2f38'); p.p(29, 10, '#2a2f38');
    for (let k = 0; k < 4; k++) p.p(5 + k, 12 - (k % 2), M.d);
    if (M.pat) { p.p(13, 23, M.pat); p.p(17, 13, M.pat); }
  },
  axe(p, M) {
    handle(p, 8, 30, 19, 7, 3, true);
    p.poly([[15, 5], [21, 3], [27, 1], [31, 8], [29, 16], [23, 13], [18, 10]], M.b);
    p.poly([[27, 1], [31, 8], [29, 16], [28, 15], [29, 8], [26, 3]], M.e);
    p.poly([[15, 5], [21, 3], [22, 6], [17, 8]], M.l);
    p.line(18, 10, 23, 13, M.d); p.r(14, 4, 4, 5, M.d); p.p(15, 5, M.l);
    if (M.pat) { p.p(22, 9, M.pat); p.p(25, 6, M.pat); }
  },
  pick(p, M) {
    handle(p, 9, 30, 18, 10, 3, true);
    const arc = []; for (let k = 0; k <= 20; k++) { const t = k / 20; arc.push([3 + t * 26, 10 - Math.sin(t * Math.PI) * 6]); }
    for (const [x, y] of arc) thick(p, x, y, x, y, 3, M.b);
    for (const [x, y] of arc) p.p(x, y - 1, M.l);
    p.poly([[1, 13], [4, 9], [5, 12]], M.d); p.poly([[31, 12], [28, 8], [27, 11]], M.d);
    p.p(2, 12, M.e); p.p(30, 11, M.e);
    p.r(15, 3, 5, 6, M.d); p.r(16, 4, 2, 2, M.l);
    if (M.pat) { p.p(8, 7, M.pat); p.p(24, 6, M.pat); }
  },
  scythe(p, M) {
    handle(p, 10, 31, 16, 3, 3, false);
    thick(p, 9, 22, 13, 22, 2, WOOD.d);
    const pts = []; for (let k = 0; k <= 22; k++) { const t = k / 22; pts.push([16 - t * 15, 3 + Math.sin(t * Math.PI * .9) * 6 - t * 1]); }
    for (let k = 0; k < pts.length; k++) { const [x, y] = pts[k]; const w = Math.max(1, Math.round(3 - k / 10)); thick(p, x, y, x, y, w, M.b); p.p(x, y + w / 2, M.e); p.p(x, y - w / 2, M.d); }
    p.r(14, 2, 4, 4, M.d);
    if (M.pat) { p.p(8, 8, M.pat); p.p(5, 7, '#8a4a20'); p.p(11, 7, '#8a4a20'); }
  },
  rod(p, M) {
    thick(p, 5, 30, 27, 4, 2, '#6a4a2a'); p.line(5, 29, 27, 3, '#a87a4a');
    thick(p, 5, 30, 10, 24, 4, '#c8a070'); for (let k = 0; k < 4; k++) p.p(6 + k, 28 - k, '#8a6a40');
    p.circ(11, 24, 3, M.d); p.circ(11, 24, 2, M.b); p.p(10, 23, M.l); p.line(11, 24, 14, 26, '#333');
    for (const t of [.45, .65, .85]) { const x = 5 + 22 * t, y = 30 - 26 * t; p.ring(x, y - 1, 1, M.l); }
    p.line(27, 4, 28, 18, '#e8e8e8');
    p.circ(28, 20, 2, '#e02030'); p.hl(26, 30, 20, '#ffffff'); p.p(28, 18, '#fff');
  },
};
function swordIcon(p, [blade = '#c8d0d8', hilt = '#7a4a24', style = 0]) {
  const B = { b: blade, l: shade(blade, .45), d: shade(blade, -.35), e: '#ffffff' };
  const grip = (x0, y0, x1, y1) => { thick(p, x0, y0, x1, y1, 3, hilt); for (let k = 0; k < 4; k++) { const t = k / 3; p.p(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, shade(hilt, .3)); } };
  if (style === 5) { // перо Автора
    const pts = []; for (let k = 0; k <= 20; k++) { const t = k / 20; pts.push([6 + t * 22, 26 - t * 23 + Math.sin(t * 3) * 2]); }
    for (let k = 4; k < pts.length; k++) { const [x, y] = pts[k], w = Math.sin(k / 20 * Math.PI) * 7; p.line(x, y, x - w * .7, y - w * .2, k % 2 ? '#f0eadc' : '#d8d0c0'); p.line(x, y, x + w * .2, y + w * .7, k % 2 ? '#e0d8c8' : '#c8c0b0'); }
    p.line(4, 29, 28, 3, '#2a2a2a'); p.line(3, 30, 6, 27, '#111'); p.p(3, 30, '#c00');
    return;
  }
  if (style === 1) { // тесак
    p.poly([[9, 21], [24, 3], [30, 6], [16, 25]], B.b); p.line(24, 3, 30, 6, B.e); p.line(16, 25, 30, 6, B.e);
    p.line(9, 21, 24, 3, B.d); p.circ(25, 7, 1, '#3a3a3a');
    grip(4, 27, 9, 22); p.r(7, 20, 5, 5, '#5a4a3a');
    return;
  }
  const tip = style === 4 ? [17, 14] : [28, 3];
  // клинок
  if (style === 3) {
    const pts = []; for (let k = 0; k <= 18; k++) { const t = k / 18; pts.push([10 + t * 18 + Math.sin(t * Math.PI) * 2, 21 - t * 18 - Math.sin(t * Math.PI) * 2]); }
    for (let k = 0; k < pts.length; k++) { const [x, y] = pts[k]; const w = k < 15 ? 4 : 2; thick(p, x, y, x, y, w, B.b); p.p(x + 1, y + 1, B.e); p.p(x - 1, y - 1, B.d); if (k % 4 === 2) p.p(x, y, '#7ad8ff'); }
  } else {
    const w = style === 2 ? 2 : 3;
    thick(p, 10, 21, tip[0], tip[1], w, B.b);
    p.line(10, 21, tip[0], tip[1], B.d);
    p.line(11, 22, tip[0] + 1, tip[1] + 1, B.e);
    if (style !== 2) p.line(10, 20, tip[0] - 1, tip[1], B.l);
    if (style === 4) { p.p(tip[0] + 1, tip[1] - 1, B.b); p.p(tip[0] + 2, tip[1] + 1, B.d); p.p(tip[0], tip[1] - 2, B.l); }
    else p.p(tip[0] + 1, tip[1] - 1, B.e);
  }
  // гарда
  if (style === 2) { p.ring(10, 22, 3, '#d8a030'); p.ring(10, 22, 2, '#a07018'); }
  else { thick(p, 6, 17, 14, 25, 2, '#8a6a3a'); p.line(6, 17, 14, 25, '#d0a860'); p.p(6, 17, '#f2d080'); p.p(14, 25, '#f2d080'); }
  grip(4, 27, 9, 22);
  p.circ(3, 28, 2, style === 3 ? '#4a8aff' : '#c02040'); p.p(2, 27, '#fff');
}
// иконка 32x32: инструменты и оружие — детальные; остальное — сглаженный апскейл 16→32 + объём + цветной контур
function itemIconCanvas(id, of) {
  const it0 = ITEMS[id];
  if (it0 && it0.type === 'tool' && (of === undefined || of === null)) of = (S && S.tools && S.tools[it0.tool]) || 0;
  if (it0 && it0.type === 'estus' && (of === undefined || of === null)) of = (S && S.estus > 0) ? 1 : 0;
  const wet = id === 'can' && S && S.water > 0 ? 'w' : '';
  return spr(`icon:${id}:${of === undefined || of === null ? '' : of}${wet}`, () => {
    const it = ITEMS[id];
    if (!it) { const p = new PX(32, 32); p.r(8, 8, 16, 16, '#f0f'); return p.done(); }
    let ic = it.ic || ['stone'];
    if (it.type === 'tool') ic = ['tool', it.tool, of | 0];
    if (it.type === 'estus') ic = ['estus', of | 0];
    if (it.artisan && of && ITEMS[of]) ic = [ic[0], ITEMS[of].col || '#a03050'];
    if (ic[0] === 'tool' && TOOL32[ic[1]]) {
      const p = new PX(32, 32); TOOL32[ic[1]](p, METAL[ic[2] || 0]); p.selOutline(.7, false); return p.done();
    }
    if (ic[0] === 'sword') { const p = new PX(32, 32); swordIcon(p, ic.slice(1)); p.selOutline(.7, false); return p.done(); }
    const p = new PX(16, 16);
    const fn = ICON[ic[0]]; if (fn) fn(p, ic.slice(1));
    if (p._img) { const big = mkCanvas(32, 32), g = big.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(p.c, 0, 0, 32, 32); return big; }
    const q = p.scale2x(); q.rim(.2, .22); q.selOutline(.68, false);
    return q.done();
  });
}
function iconURL(id, of) {
  const it0 = ITEMS[id];
  if (it0 && it0.type === 'tool' && (of === undefined || of === null)) of = (S && S.tools && S.tools[it0.tool]) || 0;
  if (it0 && it0.type === 'estus' && (of === undefined || of === null)) of = (S && S.estus > 0) ? 1 : 0;
  const wet = id === 'can' && S && S.water > 0 ? 'w' : '';
  return dataURL(`i:${id}:${of === undefined || of === null ? '' : of}${wet}`, () => itemIconCanvas(id, of));
}
function uiIconURL(kind) {
  return dataURL('ui:' + kind, () => {
    const p = new PX(16, 16);
    switch (kind) {
      case 'hand': p.r(5, 7, 7, 7, '#f2c6a0'); for (let k = 0; k < 4; k++) p.r(5 + k * 2, 2 + (k % 2 ? 0 : 1), 2, 6, '#f2c6a0'); p.r(2, 8, 3, 2, '#f2c6a0'); p.r(3, 9, 3, 3, '#f2c6a0'); p.r(6, 13, 5, 2, '#e0a880'); break;
      case 'heart': ICON.heart(p, ['#e02a3a']); p.clear(7, 2); p.clear(8, 2); p.clear(8, 1); p.clear(7, 1); break;
      case 'bolt': p.poly([[9, 0], [3, 9], [7, 9], [5, 16], [13, 6], [9, 6], [11, 0]], '#f2e040'); break;
      case 'eye': p.ell(8, 8, 7, 4, '#f4ecf8'); p.circ(8, 8, 3, '#8a4ad0'); p.circ(8, 8, 1, '#1a0a20'); p.p(7, 7, '#fff'); break;
      case 'coin': p.circ(8, 8, 6, '#f2c430'); p.circ(8, 8, 4, '#d8a020'); p.vl(8, 5, 11, '#fff2a0'); break;
      case 'soul': p.ell(8, 9, 5, 6, '#9adfff'); p.poly([[4, 8], [8, 0], [12, 8]], '#9adfff'); p.ell(8, 10, 3, 3, '#e8fbff'); break;
      case 'estus': ICON.estus(p, [1]); break;
      case 'roll': p.ring(8, 8, 6, '#f7ecd4'); p.ring(8, 8, 5, '#f7ecd4'); p.poly([[11, 0], [15, 4], [10, 6]], '#f7ecd4'); p.clear(13, 8); p.clear(14, 8); break;
    }
    const q = p.scale2x(); q.rim(.18, .2); q.selOutline(.7);
    return q.done();
  });
}
