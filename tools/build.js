// Сборка: склеивает src/*.js и src/style.css в один HTML-файл.
// node tools/build.js  →  index.html (полный документ) + dist/black-soils-artifact.html (тело страницы)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'src');

const js = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort()
  .map(f => `// ===== ${f} =====\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(src, 'style.css'), 'utf8');
const body = fs.readFileSync(path.join(src, 'body.html'), 'utf8');

const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Neucha&family=Pixelify+Sans:wght@400;600;700&family=Rubik+Wet+Paint&display=swap">';

const inner = `<title>Чёрные Почвы</title>\n${fonts}\n<style>\n${css}\n</style>\n${body}\n<script>\n${js}\n</script>\n`;

const full = `<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n` +
  `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n` +
  `<meta name="theme-color" content="#0e0b0d">\n<title>Чёрные Почвы</title>\n${fonts}\n<style>\n${css}\n</style>\n</head>\n<body>\n${body}\n<script>\n${js}\n</script>\n</body>\n</html>\n`;

fs.writeFileSync(path.join(root, 'index.html'), full);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'black-soils-artifact.html'), inner);
console.log('built index.html', (full.length / 1024).toFixed(1) + ' KB');
