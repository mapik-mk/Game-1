// Скачивает шрифты Google Fonts (кириллица + латиница) и сохраняет как src/fonts/fonts.css с data:URI.
// Запуск: node tools/fetch-fonts.js  (нужен интернет; результат коммитится в репозиторий)
const https = require('https'), fs = require('fs'), path = require('path');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const URL = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;800&family=Neucha&family=Rubik+Wet+Paint&display=swap';
const get = (u) => new Promise((res, rej) => https.get(u, { headers: { 'User-Agent': UA } }, r => { const b = []; r.on('data', d => b.push(d)); r.on('end', () => res(Buffer.concat(b))); r.on('error', rej); }).on('error', rej));
(async () => {
  const css = (await get(URL)).toString();
  const blocks = css.split('/* ').slice(1);
  let out = '/* Встроенные шрифты: Nunito, Neucha, Rubik Wet Paint (SIL Open Font License) */\n';
  const seen = new Set();
  for (const b of blocks) {
    const subset = b.slice(0, b.indexOf(' */'));
    if (!['cyrillic', 'latin'].includes(subset)) continue;
    const url = (b.match(/url\((https:[^)]+)\)/) || [])[1]; if (!url || seen.has(url)) continue; seen.add(url);
    const data = await get(url);
    let face = b.slice(b.indexOf('@font-face')).replace(/url\((https:[^)]+)\)/, `url(data:font/woff2;base64,${data.toString('base64')})`);
    if (face.includes('Nunito')) face = face.replace(/font-weight: \d+;/, 'font-weight: 200 1000;');
    out += `/* ${subset} */\n${face.trim()}\n`;
    console.log(subset, url.split('/').slice(-3).join('/'), data.length);
  }
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'fonts', 'fonts.css'), out);
  console.log('fonts.css', (out.length / 1024).toFixed(1), 'KB');
})();
