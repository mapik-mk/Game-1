/* ============================================================
   Сюжет: события, сцены, письма, ТВ, квесты, концовки
   ============================================================ */
const say = (who, txt, emo) => UI.say(who, T(txt), emo);
const narr = (txt) => UI.narr(T(txt));
const choose = (txt, opts, kill) => UI.choose(T(txt), opts.map(T), kill);

const PAGES = [
  'Глава I. Ферма.\n\nЖил-был фермер, который хотел уютную историю. Я написала ему уютную историю. Он не оценил. Он выкопал колодец, чтобы найти меня.',
  'Глава II. Деревня.\n\nЯ населила Лощину людьми. Ведьма, хозяйка таверны, доктор, принцесса, утопленница. Каждой дала роль. Каждой — смерть в финале. Читатели любят драму.',
  'Глава III. Ведьма.\n\nЛилит должна была сгореть в третьей главе. Но она сбежала со страниц. Я до сих пор её ищу. Передай ей, что я не сержусь. Почти.',
  'Глава IV. Утопленница.\n\nОфелию я столкнула в колодец сама. Чернила текли по её щекам. Я плакала вместе с ней. Это был мой лучший абзац.',
  'Глава V. Старик и Озеро.\n\nТвой дед ловил Старого Хозяина сорок лет. Поймал — и прочёл эту страницу. После этого он посадил первое Чёрное семя.',
  'Глава VI. Жмуримо.\n\nМаленькие души тех, кого я вычеркнула. Ты {накормил|накормила} их. Они помнят. Они откроют тебе дверь.',
  'Глава VII. Автор.\n\nЯ — Мэри Сью. Я пишу этот мир, потому что в своём мне было одиноко. Ты — мой лучший персонаж. Не уходи из моей книги. Пожалуйста.',
];

const Events = {
  /* ---------- вступление ---------- */
  async intro() {
    Game.lock(); Game.hidePlayer = false;
    S.flags.intro = true;
    await UI.fade(true, 0);
    await UI.cinema([
      'Жил-был {один уставший человек|одна уставшая женщина} по имени @.',
      'Каждый день @ {сидел|сидела} в сером офисе корпорации «ЖоЖа» и {смотрел|смотрела} в серую таблицу.',
      'Однажды @ {открыл|открыла} письмо, которое дед оставил {ему|ей} перед смертью.',
      '«Если когда-нибудь ты почувствуешь, что этот мир тебя раздавил — приезжай на мою ферму в Шепчущей Лощине.\n\nТолько три правила:\nне спускайся в колодец,\nне отвечай девушке из колодца,\nи никогда не сажай Чёрное семя.\n\nЛюблю. Дед.»',
      '...Конечно же, @ {приехал|приехала}.',
      'Так начинается эта история. Её пишу я.\n\n— М.С.',
    ]);
    await UI.fade(false);
    await U.sleep(300);
    await narr('Пыльный дом деда. Пахнет сушёными травами, табаком и чем-то сладким. Слишком сладким.');
    await UI.fade(true); World.enter('farm', 8, 7, 'down', true); await UI.fade(false);
    const m = World.cur; m.npcs.push(NPCRT.make('mayor', 10, 9, 'left'));
    await say('mayor', 'А! Вот и вы! Наследник фермы «Чёрная Почва»! Я мэр Гнилушкин. Добро пожаловать в Шепчущую Лощину!', 'happy');
    await say('mayor', 'Ферма немного... заросла. После того как ваш дед... э-э... ушёл на покой. Вечный. В основном.', 'neutral');
    await say('mayor', 'Вот вам 15 пакетиков семян пастернака. Вскопайте землю мотыгой, посадите, поливайте каждый день. Урожай кладите в ящик для отгрузки — утром будут деньги.', 'neutral');
    await say('mayor', 'Деревня на востоке. Лес — на юге. А колодец... какой колодец? Нет у вас никакого колодца. Ха-ха. Всего доброго!', 'neutral');
    m.npcs = m.npcs.filter(n => n.id !== 'mayor');
    Quests.start('q_start');
    Game.unlock();
    UI.note(Input.touch ? 'Джойстик — ходить. Большая кнопка — инструмент. Рука — взаимодействие.' : 'WASD — ходить, Пробел/J — инструмент, E/K — взаимодействие, Shift — кувырок, I — меню.');
  },

  /* ---------- вход в карту ---------- */
  onEnter(m) {
    if (m.theme === 'dungeon') {
      if (m.depth === 1 && !S.flags.well1) { S.flags.well1 = 1; setTimeout(() => narr('Ступени скользкие. Внизу пахнет землёй, железом и старой бумагой. Кто-то вёл здесь записи.'), 500); }
      if (m.depth === 5 && !S.flags.well5note) { S.flags.well5note = 1; setTimeout(() => UI.note('Костёр! Отдохни у него: здоровье, эстус и рассудок. Тут же можно повысить уровень за души.', 'good'), 800); }
      if (m.depth === 30 && !S.flags.lib) { S.flags.lib = 1; setTimeout(() => this.libraryEnter(), 600); }
      if (m.boss && m.bossPending && !S.flags['bossseen' + m.depth]) { S.flags['bossseen' + m.depth] = 1; setTimeout(() => UI.note('Впереди туманная стена. За ней — что-то большое. Подойди и коснись тумана.', 'bad'), 700); }
      return;
    }
    if (m.id === 'village' && !S.flags.villageTip) { S.flags.villageTip = 1; setTimeout(() => UI.note('Шепчущая Лощина. Поговори с жителями — у каждого над головой знак, пока ты не поговорил{|а} сегодня.'), 600); }
    if (m.id === 'chapel' && !S.flags.chapelSeen) { setTimeout(() => this.chapelFirst(), 400); return; }
    this.checkHeart(m);
  },
  checkHeart(m) {
    if (Game.locked()) return;
    for (const ev of HEART_EVENTS) {
      if (S.flags['ev_' + ev.id] || ev.map !== m.id) continue;
      if (hearts(ev.npc) < ev.h) continue;
      const t = hhmm(); if (ev.time && (t < ev.time[0] || t > ev.time[1])) continue;
      if (ev.cond && !ev.cond()) continue;
      if (!m.npcs.some(n => n.id === ev.npc) && !ev.noNpc) continue;
      S.flags['ev_' + ev.id] = 1;
      setTimeout(async () => { Game.lock(); try { await ev.fn(m); } finally { Game.unlock(); } }, 350);
      break;
    }
  },
  tick(m) {
    if (m.theme !== 'dungeon') this.checkHeart(m);
    // голос из колодца
    if (!S.flags.wellOpen && S.absDay >= 2 && m.id === 'farm' && S.time >= 1230) { S.flags.wellOpen = true; this.wellVoice(); return; }
    if (Fest.today() === 'eyes' && S.time === 1020 && m.id === 'village') UI.note('Праздник Глаз: отнеси найденное мэру до полуночи!', 'good');
    if (S.time === 1320 && m.outdoor && S.sanity < 40 && Math.random() < .3) this.marySighting();
    if (Fest.today() === 'spirits' && m.id === 'village' && S.time >= 1320 && !S.flags['spirits' + S.year]) { S.flags['spirits' + S.year] = 1; this.spiritsNight(); }
  },
  async wellVoice() {
    Game.lock();
    AU.sfx('whisper'); await U.sleep(400);
    await narr('Из колодца доносится женский голос. Тихий. Мокрый.');
    await UI.say('ophelia', T('...эй. Ты... слышишь меня? Наконец-то кто-то живой. Спустись. Пожалуйста. Здесь так темно, и столько страниц...'), 'sad');
    const c = await choose('Ответить голосу?', ['Ответить', 'Промолчать', 'Убить'], 2);
    if (c === 0) { await say('ophelia', 'Ты ответил{|а}! Твой дед тоже отвечал. Сначала. Приходи ночью — я поднимусь к краю. А внизу... внизу тебя ждёт она.', 'blush'); S.flags.metOphelia = true; rel('ophelia').met = true; Social.addPts('ophelia', 60); }
    else if (c === 1) { await narr('Ты молчишь. Голос смеётся — тихо, как вода в трубах. «Дед тоже сначала молчал».'); }
    else { await this.killFlash(); await narr('Ты швыряешь в колодец камень. Снизу — плеск. Потом тишина. Потом смех. Ты не можешь убить то, что уже утонуло.'); S.sin++; Sanity.add(-5); }
    Quests.start('q_well');
    UI.note('Колодец открыт. Подойди к нему и нажми «взаимодействие».', 'good');
    Game.unlock();
  },
  async spiritsNight() {
    Game.lock(); AU.sfx('whisper'); Music.play('library');
    await narr('Ночь Духов. Фонари на площади гаснут один за другим. У фонтана стоит девушка в чёрном платье и что-то пишет в воздухе огромным пером.');
    await UI.say('marysue', T('О, @. Ты пришёл{|ла} на праздник. Знаешь, в эту ночь граница между страницами тоньше всего. Я могу выйти. Совсем ненадолго.'), 'happy');
    await UI.say('marysue', T(S.pages.length >= 4 ? 'Ты собрал{|а} уже ' + S.pages.length + ' моих страниц. Ты ведь понимаешь, что читаешь мой дневник? Это неприлично. Мне нравится.' : 'Ты ещё так мало обо мне знаешь. Спускайся глубже. Я оставила тебе страницы, как хлебные крошки.'), 'neutral');
    const c = await choose('', ['Кто ты?', 'Отпусти Лощину', 'Убить'], 2);
    if (c === 0) await UI.say('marysue', 'Я та, кто пишет. А ты — тот, кого читают. Пока что.', 'wink');
    else if (c === 1) await UI.say('marysue', 'Отпустить? А куда они пойдут? Их нет за пределами моей книги. Как и тебя, милый персонаж.', 'sad');
    else { await this.killFlash(); await UI.say('marysue', 'Ха-ха-ха! Ты не можешь убить автора на его же странице. Но попытка засчитана. Мне понравилось.', 'creepy'); S.sin++; }
    await narr('Она растворяется в чернилах. Фонари загораются вновь. На брусчатке остаётся клякса в форме сердца.');
    Inv.give('ink', 3); Sanity.add(-5);
    Music.play(Game.musicFor(World.cur)); Game.unlock();
  },
  async marySighting() {
    AU.sfx('glitch'); Halluc.overlay = { t: 1.5, txt: 'М.С.' };
    UI.note('На краю зрения — девушка в чёрном платье с огромным пером. Моргнёшь — её нет.', 'bad');
  },
  /* ---------- предметы ---------- */
  async readBottle(st) {
    const i = S.inv.indexOf(st); Inv.takeAt(i, 1);
    const n = st.of === 'grandpa' ? -1 : (parseInt((st.of || 'r0').slice(1)) || 0) % NOTES.length;
    if (n === -1) { await UI.letter('Записка деда, найденная в бутылке:\n\n«{Внучок|Внучка}. Если читаешь — значит, я оказался прав и ты приехал{|а}. Земля тут хорошая, жирная, чёрная. Слишком чёрная. Я посадил одно семя — и вырос колодец. Не повторяй.\n\nP.S. В сундуке есть подарки. Чёрное — не трогай. Пастернак — трогай.»'); return; }
    await UI.letter(NOTES[n]);
  },
  async grandpaChest(o) {
    Game.lock(); S.flags.grandpaChest = true;
    await narr('Сундук деда. На крышке нацарапано: «НЕ ОТКРЫВАЙ». Ниже, другим почерком: «Открой».');
    await narr('Внутри — пакетик семян, бутылка с запиской... и маленькое чёрное семя. Оно тёплое. Оно... пульсирует.');
    Quests.start('q_seed');
    Game.unlock(); UI.openChest(o);
  },
  blackSeedPlanted(m) {
    S.flags.seedPlanted = S.absDay; Sanity.add(-5); AU.sfx('heartbeat');
    UI.note('Земля вздохнула.', 'bad');
    setTimeout(() => narr('Где-то далеко, на самом дне, кто-то перевернул страницу.'), 600);
  },
  async blackFruit() {
    Game.lock(); AU.sfx('heartbeat');
    await narr('Чёрный плод. Тяжёлый, тёплый. Внутри что-то скребётся — как перо по бумаге.');
    await narr('На кожуре проступают буквы: «Дверь Автора. Этаж 30. Семь страниц».');
    S.flags.fruit = true; Quests.check();
    if (!S.quests.active.includes('q_author') && !S.quests.done.includes('q_author')) Quests.start('q_author');
    Game.unlock();
  },
  async legendFish() {
    Game.lock();
    await narr('Старый Хозяин бьётся на берегу. Из его жабр торчит свёрнутый лист бумаги.');
    await this.givePage(4);
    Game.unlock();
  },
  async givePage(i) {
    if (S.pages.includes(i)) return;
    S.pages.push(i); AU.sfx('quest'); P.show = { id: 'page', t: 0 };
    if (!S.quests.active.includes('q_pages') && !S.quests.done.includes('q_pages')) Quests.start('q_pages');
    await UI.letter(PAGES[i], true);
    UI.note(`Страница рукописи ${S.pages.length}/7`, 'good');
    Quests.check();
    if (S.pages.length === 7) setTimeout(() => narr('Семь страниц. Ты чувствуешь, как где-то на дне колодца щёлкнул замок.'), 500);
  },
  /* ---------- ТВ ---------- */
  async tv() {
    const opts = ['Прогноз погоды', 'Готовим с Королевой Соусов', 'Новости Лощины'];
    if (S.sanity < 45) opts.push('Канал 13');
    opts.push('Выключить');
    const c = await UI.choose('Телевизор деда. Работает, если стукнуть.', opts);
    const o = opts[c];
    if (o === 'Прогноз погоды') {
      const w = { sun: 'солнечно', rain: 'дождь', storm: 'гроза', snow: 'снег' }[S.tomorrow] || 'солнечно';
      await say(null, `Ведущий: «Завтра в Лощине — ${w}. ${S.sanity < 35 ? 'И кровь. С неба. Шучу. Наверное. Не выходите после полуночи.' : 'Отличный день для фермерства!'}»`);
    } else if (o === 'Готовим с Королевой Соусов') {
      const dow = (S.absDay - 1) % 7;
      if (dow !== 6) { await say(null, 'Королева Соусов: «...и помните: новый рецепт — по воскресеньям! А сегодня — повтор». На экране она пятый раз режет один и тот же лук.'); return; }
      const wk = Math.floor((S.absDay - 1) / 7) % TV_RECIPES.length; const r = TV_RECIPES[wk];
      if (S.recipes[r]) { await say(null, `Королева Соусов готовит «${ITEMS[r].n}». Ты это уже знаешь.`); return; }
      S.recipes[r] = 1; AU.sfx('quest');
      await say(null, `Королева Соусов: «Сегодня — ${ITEMS[r].n}! ${Object.entries(COOKING[r].in).map(([k, v]) => (k.startsWith('any:') ? (k === 'any:fish' ? 'любая рыба' : 'грибы') : ITEMS[k].n) + ' ×' + v).join(', ')}. Записывайте!»\n\nВыучен рецепт: ${ITEMS[r].n}`);
    } else if (o === 'Новости Лощины') {
      await say(null, U.pick(['«Мэр Гнилушкин опроверг слухи о пропаже фиолетовых шорт. Слухи о шортах тоже опроверг».', '«В лесу видели кота, который улыбается без кота. Санэпидстанция бессильна».', '«Пьеро снова плачет. Синоптики предупреждают о повышенной влажности в лавке».', '«ЖоЖа Корп объявила: в этом квартале продано 9000 тонн пастернака. Ни одного — в Лощине».', '«Ведьма Лилит отрицает, что прокляла налогового инспектора. Инспектор квакает в знак согласия».']));
    } else if (o === 'Канал 13') {
      AU.sfx('glitch'); Sanity.add(-3);
      await UI.say('marysue', T(U.pick(['Привет, @. Я вижу тебя через экран. У тебя пыль на плече.', 'Ты ведь не думал{|а}, что это просто ферма? Это рукопись. И ты в ней — главный герой.', 'Сегодня в программе: ты. Завтра в программе: ты. Всегда в программе: ты.', 'Дед тоже смотрел этот канал. Дед досмотрел до конца.'])), 'creepy');
    }
  },
  /* ---------- часовня ---------- */
  async chapelFirst() {
    if (S.flags.chapelSeen) return;
    Game.lock(); S.flags.chapelSeen = true;
    await narr('Заброшенная часовня. Скамьи сгнили. На алтаре пульсирует зелёный огонёк.');
    await UI.say('zhmur', 'Жмур! Жмур-жмур!', 'happy');
    await narr('Маленькие зелёные призраки вылетают из-за алтаря. Они похожи на души... очень голодные души.');
    await UI.say('zhmur', 'Мы — Жмуримо! Нас вычеркнули из истории. Принеси нам подношения — и мы починим Лощину. Мост, оранжерею... и кое-что ещё.', 'happy');
    await narr('На алтаре появляются свитки с перечнями. Это наборы — собери предметы и положи на алтарь.');
    Game.unlock(); Quests.check();
  },
  /* ---------- колодец ---------- */
  async wellUse() {
    if (!S.flags.wellOpen) {
      if (S.absDay < 2) { await narr('Старый колодец. Цепь уходит в темноту. Снизу пахнет сыростью и... кто-то дышит?'); return; }
      S.flags.wellOpen = true; await this.wellVoice(); return;
    }
    const opts = ['Спуститься (этаж 1)']; const floors = [1];
    for (const f of [...S.bonfires].sort((a, b) => a - b)) { opts.push(`Костёр: этаж ${f}`); floors.push(f); }
    opts.push('Отмена');
    const c = await UI.choose('Спуститься в Колодец?', opts);
    if (c < 0 || c >= floors.length) return;
    const n = floors[c];
    AU.sfx('door'); await UI.fade(true);
    World.enter('well:' + n);
    if (n > 1) { const m = World.cur; const b = m.objs.find(o => o && o.t === 'bonfire'); if (b) { P.x = b.x * 16 + 8; P.y = (b.y + 1) * 16 + 12; if (m.solidAt(b.x, b.y + 1)) { const p = nearestFree(m, b.x, b.y + 1); P.x = p.x * 16 + 8; P.y = p.y * 16 + 12; } Render.snapCamera(); } }
    await UI.fade(false);
  },
  async campfire() {
    if (S.flags.campfireUsed) { UI.note('Ты уже отдыхал{|а} у костра сегодня.'); return; }
    const c = await choose('Посидеть у костра души?', ['Отдохнуть', 'Уйти']);
    if (c !== 0) return;
    S.flags.campfireUsed = true; AU.sfx('bonfire'); Sanity.add(15); S.estus = S.estusMax; UI.note('Рассудок +15. Эстус наполнен. Восхвали солнце!', 'good'); UI.toolbar();
  },
  async grave(o) {
    if (o.grandpa) {
      if (o.dug) { await narr('Пустая могила. Деда в ней нет. И, похоже, никогда не было.'); return; }
      await narr('«Здесь покоится Дед. Любил пастернак, ненавидел колодцы. Не копать.»' + (S.quests.active.includes('q_grave') ? '\n\n(Копать мотыгой. После полуночи.)' : ''));
      return;
    }
    await narr(U.pick(['«Здесь лежит юрист ЖоЖа. Пропал в лесу. Нашёлся в лесу.»', '«Марфа. Ушла за грибами. Грибы вернулись.»', '«Неизвестный. Наверное, предыдущий фермер.»', '«Смотритель часовни. Кормил Жмуримо. Однажды — собой.»']));
  },
  async digGrave(o) {
    if (!o.grandpa || o.dug) return;
    if (S.time < 1440) { await narr('Днём копать могилы как-то неловко. Мэр смотрит. Подожди до полуночи.'); return; }
    Game.lock();
    o.dug = true; S.flags.graveDug = true; World.maps.village.dirtyGround = true; AU.sfx('hoe');
    await narr('Ты копаешь. Земля мягкая, будто её копали много раз. Лопата стучит о дерево.');
    await narr('Гроб пуст. Внутри — только старая шляпа деда, связка лопат... и лист бумаги, исписанный чужим, красивым почерком.');
    Sanity.add(-8);
    await this.givePage(0);
    Inv.give('copper_ore', 10);
    Game.unlock();
  },
  /* ---------- убийство (галлюцинация в стиле Black Souls) ---------- */
  async killFlash() { AU.sfx('scream'); Render.flash = 1; Render.flashCol = '#a00010'; Render.shake = 10; await U.sleep(500); },
  async killChoice(id, n) {
    const def = NPCS[id];
    await this.killFlash();
    await narr(`Ты {сделал|сделала} шаг к ${def.short || def.n}. Руки сами потянулись к...`);
    AU.sfx('glitch'); await U.sleep(300);
    await narr('...ты моргаешь.');
    await UI.say(id, T(`Ты в порядке? Ты так странно на меня смотришь... Мне страшно.`), 'sad');
    S.sin++; Sanity.add(-10); Social.addPts(id, -250);
    UI.note(`Грех: ${S.sin}. ${def.short || def.n} теперь тебя боится.`, 'bad');
    if (S.sin === 3) Mail.send('ms_sin');
  },
  async kvaIntro(n) {
    const c = await UI.choose('Принцесса Квакерия: «Ты... ты принц?»', ['Да', 'Нет', 'Убить'], 2);
    if (c === 0) {
      await say('kva', 'Ква!!! Наконец-то! Я так долго ждала! Ты должен{|на} меня поцеловать, и тогда... ой. Подожди. У тебя нет короны. Ты точно принц?', 'blush');
      const c2 = await UI.choose('', ['Я в душе принц', 'Поцеловать', 'Ну, вообще-то нет']);
      if (c2 === 1) { AU.sfx('ribbit'); await say('kva', 'Кв... КВА?! Ничего не произошло! То есть произошло, но не проклятие! Ты... наглец{|ка}! Мне понравилось. КВА.', 'blush'); Social.addPts('kva', 80); }
      else if (c2 === 0) { await say('kva', 'В душе — считается! Я Принцесса Квакерия. Добро пожаловать в моё королевство. Оно мокрое.', 'happy'); Social.addPts('kva', 40); }
      else { await say('kva', 'Ква. Обманщик{|ца}. Ладно, будем друзьями. Друзья лучше принцев. Принцы не приходят.', 'sad'); }
    } else if (c === 1) {
      await say('kva', 'Ква... Опять не принц. Ну ничего. Я Принцесса Квакерия. Заходи на болото. Тут уютно. Если любишь комаров.', 'sad');
    } else {
      await this.killFlash();
      AU.sfx('ribbit');
      await narr('Принцесса подпрыгивает на два метра и шлёпается в болото. Через минуту из воды показываются два обиженных глаза.');
      await say('kva', 'КВА?! Ты нормальн{ый|ая}?! Меня и так прокляли, а ты ещё и убивать?! ...Ладно. Я Квакерия. Но я буду за тобой следить. Квакко.', 'angry');
      S.sin++; UI.note('Грех: ' + S.sin, 'bad');
    }
  },
  /* ---------- крючки диалогов ---------- */
  async npcHook(id, n) {
    // фестиваль глаз
    if (id === 'mayor' && Fest.today() === 'eyes' && !S.flags.festDone && (S.flags.festEyes || 0) > 0) {
      const e = S.flags.festEyes; S.flags.festDone = true;
      await say('mayor', `Вы нашли ${e} ${U.plural(e, 'глаз', 'глаза', 'глаз')}! ${e >= 12 ? 'Невероятно! Вот главный приз — семена кровяники и 1000 золотых!' : e >= 7 ? 'Отлично! Вот 500 золотых!' : 'Ну... старались. Вот 100 золотых.'}`, 'happy');
      if (e >= 12) { S.money += 1000; Inv.give('strawberry_seed', 10); } else if (e >= 7) S.money += 500; else S.money += 100;
      AU.sfx('coin'); return true;
    }
    // доска объявлений: принеси
    const b = S.board;
    if (b && b.accepted && !b.done && b.kind === 'bring' && b.npc === id && Inv.has(b.item, b.n)) {
      Inv.remove(b.item, b.n); b.done = true; S.money += b.reward; Social.addPts(id, 150); AU.sfx('quest');
      await say(id, `О! ${ITEMS[b.item].n}! Ты принёс{|ла}! Вот твоя награда — ${b.reward}з. Спасибо!`, 'happy'); S.stats.boardDone = (S.stats.boardDone || 0) + 1; return true;
    }
    // Чешир: улыбка
    if (id === 'cheshire' && rel('cheshire').met && !S.flags.catSmile) {
      if (!S.flags.catAsk) { S.flags.catAsk = 1; await say('cheshire', 'Мрр. Хочешь мою улыбку? Принеси три Рыбы-Глаза. Глаза за улыбку — честный обмен в Стране Чудес.', 'happy'); Quests.start('q_cat'); return true; }
      if (Inv.has('eyefish', 3)) { Inv.remove('eyefish', 3); Inv.give('cat_smile', 1); S.flags.catSmile = true; Quests.complete('q_cat'); await say('cheshire', 'Мрррр. Держи. Теперь ты улыбаешься без причины. Как все сумасшедшие. Удачи!', 'happy'); return true; }
    }
    // Клим просит передать подарок
    if (id === 'klim' && hearts('klim') >= 3 && !S.flags.klimAsk) { S.flags.klimAsk = 1; await say('klim', '...Слушай. Роза любит топазы. Я... не могу. Передай ей топаз. От меня. Скажи... ничего не говори. Просто передай.', 'blush'); Quests.start('q_klim'); return true; }
    // шорты мэра
    if (id === 'mayor' && Inv.has('shorts') && !S.flags.shortsDone) {
      const c = await choose('Отдать мэру фиолетовые шорты?', ['Отдать', 'Нет']);
      if (c === 0) { Inv.remove('shorts'); S.flags.shortsDone = 'mayor'; Quests.complete('q_shorts'); await say('mayor', 'Т-тихо! Откуда... То есть, спасибо, добрый гражданин. Это не мои. Но я их сохраню. Для... музея. Вот 1500 золотых. За молчание. То есть за находку.', 'blush'); S.money += 1500; Social.addPts('mayor', 400); AU.sfx('coin'); return true; }
    }
    // предложение: свидание и свадьба (через подарки), развод — нет
    return false;
  },
  async giftHook(id, st, n) {
    const def = NPCS[id];
    if (st.id === 'bouquet') {
      if (!def.romance) { await say(id, 'Цветы? Мне? ...Это мило, но я не по этой части.', 'neutral'); return true; }
      if (S.dating === id || S.spouse === id) { await say(id, 'Мы уже вместе, глупышка.', 'blush'); return true; }
      if (hearts(id) < 8) { await say(id, 'Это... слишком рано. Давай сначала узнаем друг друга получше.', 'sad'); return true; }
      if (S.dating) { await say(id, `А как же ${NPCS[S.dating].short || NPCS[S.dating].n}? Я не такая.`, 'angry'); return true; }
      Inv.takeAt(S.inv.indexOf(st), 1); S.dating = id; AU.sfx('heart');
      await say(id, BOUQUET_LINES[id] || 'Да. Да! Конечно да!', 'blush');
      UI.note(`Вы с ${def.short || def.n} теперь встречаетесь! (лимит дружбы — 10 ♥)`, 'good'); return true;
    }
    if (st.id === 'pendant') {
      if (S.spouse) { await say(id, 'Ты уже в браке. Даже у нас тут есть приличия.', 'angry'); return true; }
      if (S.dating !== id || hearts(id) < 10) { await say(id, 'Кулон Утопленницы?.. Это предложение? Нам ещё рано.', 'surprised'); return true; }
      if (!S.flags.kitchen && id !== 'ophelia') { await say(id, 'Да! Но... где мы будем жить? В доме деда даже кухни нет. Попроси Клима сделать ремонт.', 'blush'); return true; }
      Inv.takeAt(S.inv.indexOf(st), 1); AU.sfx('heart');
      await say(id, PROPOSAL_LINES[id], 'blush');
      S.weddingDay = S.absDay + 3; S.fiance = id;
      UI.note(`Свадьба через 3 дня! ${def.short || def.n} говорит «да».`, 'good'); return true;
    }
    if (st.id === 'goldball' && id === 'kva') {
      Inv.takeAt(S.inv.indexOf(st), 1); Quests.complete('q_frog'); AU.sfx('ribbit'); Social.addPts('kva', 500);
      await say('kva', 'МОЙ МЯЧ!!! Мой золотой мяч! Ты нырял{|а} за ним? Ты лучше любого принца! Ква-ква-КВАААА!', 'happy');
      await narr('Квакерия обнимает тебя. Она пахнет тиной, кувшинками и счастьем.');
      return true;
    }
    if (st.id === 'shorts' && id === 'rosa' && !S.flags.shortsDone) {
      Inv.takeAt(S.inv.indexOf(st), 1); S.flags.shortsDone = 'rosa'; Quests.complete('q_shorts');
      await say('rosa', 'Это же... ШОРТЫ МЭРА?! Ха-ха-ха! Я повешу их над барной стойкой! Как трофей! Ты гени{й|альна}!', 'happy');
      Social.addPts('rosa', 300); Social.addPts('mayor', -500); S.flags.shortsInTavern = 1; return true;
    }
    if (st.id === 'topaz' && id === 'rosa' && S.quests.active.includes('q_klim')) {
      Inv.takeAt(S.inv.indexOf(st), 1); Quests.complete('q_klim');
      await say('rosa', 'Топаз? От... Клима? Этот медведь молчит уже три года, а теперь — топаз? ...Передай ему, что я жду его после закрытия. Пусть приходит. И пусть скажет хоть слово.', 'blush');
      Social.addPts('klim', 500); Social.addPts('rosa', 150); S.flags.klimRosa = 1; return true;
    }
    return false;
  },
  /* ---------- ночные события ---------- */
  nightEvent(f) {
    const out = [];
    if (S.flags.seedPlanted) {
      const s = f.soil.find(x => x && x.crop === 'blackseed');
      if (s) out.push(T(U.pick(SEED_WHISPERS)));
    }
    if (S.season !== 3 && Math.random() < .02 && S.absDay > 5) {
      const cx = U.ri(6, 33), cy = U.ri(10, 26); let n = 0;
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const s = f.soilAt(cx + i, cy + j); if (s && s.crop && !s.dead && s.crop !== 'blackseed') { s.age = CROPS[s.crop].days; n++; } }
      if (n) out.push(T('Ночью ты слышал{|а} тонкую песню: «Ла-ла-лалала ♪». Фея Листик прошлась по твоим грядкам. Урожай вырос!'));
    }
    if (S.sanity < 30 && Math.random() < .4) out.push(T(U.pick(['Ночью кто-то ходил по дому. Половицы скрипели в такт твоему сердцу.', 'Ты проснул{ся|ась} от того, что кто-то гладил тебя по голове. В доме никого.', 'Во сне ты {писал|писала} книгу. Проснувшись — увидел{|а} чернила на пальцах.'])));
    return out;
  },
  async morning() {
    if (S.day === 1) UI.note(`${['Наступила весна', 'Наступило лето', 'Наступила осень', 'Наступила зима'][S.season]}! ${S.season === 3 ? 'Зимой на улице ничего не растёт — только в оранжерее.' : 'В лавке Пьеро новые семена.'}`, 'good');
    const b = Object.keys(NPCS).find(id => NPCS[id].bday && NPCS[id].bday[0] === S.season && NPCS[id].bday[1] === S.day);
    if (b) UI.note(`Сегодня день рождения: ${NPCS[b].short || NPCS[b].n}. Подарок даст ×8 дружбы!`, 'good');
    if (Fest.today() === 'eyes') UI.note('Сегодня Праздник Глаз! Ищи глаза по всей деревне и неси мэру.', 'good');
    if (Fest.today() === 'spirits') UI.note('Сегодня Ночь Духов. В деревне неспокойно.', 'bad');
    if (S.mail.length) setTimeout(() => UI.note('В почтовом ящике письмо!', 'good'), 700);
    if (S.weddingDay && S.weddingDay <= S.absDay && !S.spouse) { await this.wedding(); return; }
    if (S.spouse && Math.random() < .35) { const food = U.pick(['salad', 'spaghetti', 'pizza', 'tea', 'pumpkin_soup']); Inv.give(food, 1); UI.note(`${NPCS[S.spouse].short || NPCS[S.spouse].n} приготовил${S.spouse === 'klim' ? '' : 'а'} тебе завтрак!`, 'good'); }
    if (S.flags.spouseWatered) { S.flags.spouseWatered = 0; UI.note('Твоя половинка полила часть грядок.', 'good'); }
  },
  async wedding() {
    Game.lock(); const id = S.fiance; const def = NPCS[id];
    await UI.fade(true);
    World.enter('chapel', 6, 6, 'up', true);
    const m = World.cur; m.npcs = m.npcs.filter(n => n.deco); m.npcs.push(NPCRT.make(id, 7, 4, 'left'), NPCRT.make('mayor', 6, 3, 'down'));
    P.x = 5 * 16 + 8; P.y = 4 * 16 + 12; P.dir = 'right'; Render.snapCamera();
    Music.play('ending'); await UI.fade(false);
    await say('mayor', `Дорогие жители Лощины! И... призраки. И Жмуримо. Сегодня мы соединяем @ и ${def.short || def.n}.`, 'happy');
    await say('mayor', 'Если кто-то против — пусть говорит сейчас... или вечно квакает.', 'neutral');
    if (id !== 'kva') { AU.sfx('ribbit'); await narr('Из угла часовни доносится одинокое «ква». Его игнорируют.'); }
    await say('mayor', 'Можете поцеловаться!', 'happy');
    AU.sfx('heart'); Render.flash = .6; Render.flashCol = '#ffd0e0';
    await say(id, WEDDING_LINES[id] || 'Навсегда.', 'blush');
    await narr('Где-то очень глубоко Мэри Сью откладывает перо и долго смотрит в стену.');
    S.spouse = id; S.dating = null; S.weddingDay = null; rel(id).pts = Math.max(rel(id).pts, 2500);
    if (!S.endings.married) S.endings.married = 1;
    await UI.fade(true); World.enter('house', 9, 4, 'down', true); await UI.fade(false);
    Game.unlock();
  },
  /* ---------- срыв ---------- */
  async breakdownScene() {
    AU.sfx('scream'); Music.play('silence');
    Render.flash = 1; Render.flashCol = '#000';
    await UI.cinema(S.breakdowns === 1 ? [
      'Мир трескается, как старая краска.',
      'Ты видишь строчки. Они бегут по земле, по небу, по твоим рукам.\n«@ {упал|упала} на колени. @ {закричал|закричала}. Никто не {пришёл|пришла}».',
      'Голос, очень близко:\n«Тш-ш. Это всего лишь глава. Я перепишу».\n— М.С.',
    ] : S.breakdowns === 2 ? [
      'Снова.', 'Ты стоишь посреди поля, и пугала поворачивают головы. Все. Одновременно.',
      '«Ещё один раз, @, и я оставлю тебя здесь. Навсегда. В роли, которая тебе подходит».\n— М.С.',
    ] : ['...'], true);
  },
  async endingScarecrow() {
    Game.lock(); S.endings.scarecrow = 1;
    await UI.ending('КОНЦОВКА: ПУГАЛО', T('Третий срыв.\n\nУтром мэр Гнилушкин находит на ферме «Чёрная Почва» новое пугало. Оно в {твоей|твоей} одежде. Оно улыбается.\n\nВороны больше не прилетают. Никто не прилетает.\n\nВ Лощине говорят, что по ночам пугало шепчет: «Да. Нет. Убить».\n\n— М.С.: «Подходящая роль. Тебе идёт.»'), 'bad');
    S.breakdowns = 0; S.sanity = 60;
    UI.note('Ты просыпаешься. Это был кошмар? Срывы обнулены — у тебя ещё есть шанс.', 'bad');
    Game.unlock();
  },
  /* ---------- боссы и финал ---------- */
  async bossVictory(depth) {
    Game.lock();
    if (depth === 10) {
      await narr('Король Жиж растекается лужей. В его короне — свёрнутая страница.');
      await this.givePage(1); Quests.complete('q_king'); Quests.start('q_hatter'); Mail.send('ms2');
    } else if (depth === 20) {
      await say(null, 'Безумный Шляпник (умирая): «Опоздал... опоздал... на чаепитие... к Автору... передай ей... шесть часов...»');
      await this.givePage(6); Quests.complete('q_hatter'); if (!S.quests.active.includes('q_author') && !S.quests.done.includes('q_author')) Quests.start('q_author'); Mail.send('ms3');
    }
    Game.unlock();
  },
  async libraryEnter() {
    Game.lock();
    await narr('Тридцатый этаж. Бесконечные полки. Всё — чёрно-белое, как карандашный набросок. Только кровь осталась красной.');
    await UI.say('marysue', T('О. Ты {дошёл|дошла}. Мой любимый персонаж. Садись. Хочешь, я прочитаю тебе твою историю? Я знаю её наизусть. Я её пишу.'), 'happy');
    Game.unlock();
  },
  async manuscript() {
    await narr('Рукопись на столе. Последняя строка ещё влажная:\n«...и тогда @ {открыл|открыла} рукопись и прочитал{|а} эту строку».');
    Sanity.add(-3);
  },
  async authorDoor(m, o) {
    const pages = S.pages.length, fruit = Inv.has('blackfruit');
    if (pages < 7 || !fruit) {
      await UI.say('marysue', T(`Дверь не откроется, глупышка. Нужны все семь страниц (у тебя ${pages}) и ${fruit ? 'плод — он у тебя есть' : 'Чёрный плод. Ты ведь посадил{|а} семя? Дед не посадил бы. Ах да — посадил'}.`), 'happy');
      return;
    }
    Game.lock();
    await narr('Ты вкладываешь страницы в замочную скважину. Одну за другой. Чёрный плод раскрывается, как глаз.');
    Inv.remove('blackfruit', 1); S.flags.authorDoorOpen = 1;
    m.remove(o); m.put(17, 18, { t: 'crack' });
    await UI.say('marysue', T('Ты правда хочешь закончить книгу? ...Хорошо. Тогда закончим её вместе. ГЛАВА ПОСЛЕДНЯЯ.'), 'creepy');
    Game.unlock();
    this.startAuthor(m);
  },
  startAuthor(m) {
    if (m.bossActive) return;
    const mo = spawnMonster(m, 'author', 17 * 16 + 8, 9 * 16, 30); mo.cd = 2.5; m.bossActive = true; Music.play('boss'); AU.sfx('boss'); UI.bossBar(mo);
  },
  async authorPhase(ph) {
    if (ph === 2) { UI.note('Мэри Сью: «Чернила! Мои слова, оживите!»', 'bad'); }
    if (ph === 3) { UI.note('Мэри Сью: «Я ПЕРЕПИШУ ТЕБЯ!»', 'bad'); Halluc.overlay = { t: 1.5, txt: 'ПЕРЕПИШУ' }; }
  },
  async authorDefeated() {
    Game.lock(); UI.bossBar(null);
    const m = World.cur; for (const mm of m.mons.slice()) Mon.vanish(m, mm);
    m.projs.length = 0;
    await U.sleep(800); Music.play('ending');
    await UI.say('marysue', T('...Ты победил{|а}. Персонаж победил автора. Так не бывает. Так... нельзя.'), 'sad');
    await UI.say('marysue', T('Знаешь, почему я тебя писала? Мне было одиноко. Я думала: если напишу уютную ферму, тёплую таверну, милых людей — мне тоже станет тепло. А стало только страшнее.'), 'sad');
    await UI.say('marysue', T('Перо у тебя. Решай. Чем закончится книга?'), 'neutral');
    const opts = ['Дописать счастливый конец'];
    if (S.flags.chapelDone) opts.push('Сжечь рукопись');
    opts.push('Взять перо себе');
    if (S.sin >= 3) opts.push('Убить');
    const c = await UI.choose(T('Мэри Сью протягивает тебе перо.'), opts, opts.indexOf('Убить'));
    const o = opts[c];
    S.flags.boss30 = true; Quests.complete('q_author');
    Inv.give('quill', 1);
    if (o === 'Дописать счастливый конец') await this.endingCozy();
    else if (o === 'Сжечь рукопись') await this.endingTrue();
    else if (o === 'Взять перо себе') await this.endingAuthor();
    else await this.endingSin();
    // пост-игра
    UI.note('Открыта Бездна: этажи 31+. Глубже — сильнее враги и лучше добыча.', 'good');
    m.put(17, 8, { t: 'ladder', walk: true });
    Game.unlock();
  },
  async endingCozy() {
    S.endings.cozy = 1;
    const sp = S.spouse ? NPCS[S.spouse].short || NPCS[S.spouse].n : null;
    await UI.ending('КОНЦОВКА: УЮТНАЯ ФЕРМА', T(`Ты {взял|взяла} перо и {написал|написала}: «И жили они долго и счастливо».\n\nМэри Сью переехала в Лощину. Теперь она пишет детективы для таверны Розы и плачет вместе с Пьеро по средам.\n\n${sp ? sp + ' ждёт тебя дома. Каждое утро — завтрак.' : 'Каждое утро в Лощине кто-нибудь машет тебе рукой.'}\n\nКолодец остался. Но из него больше никто не зовёт.\n\nПочти никогда.`), 'good');
  },
  async endingTrue() {
    S.endings.true = 1;
    const oph = S.spouse === 'ophelia' || S.dating === 'ophelia';
    await UI.ending('ИСТИННАЯ КОНЦОВКА: ЧИСТЫЙ ЛИСТ', T(`Ты {поднёс|поднесла} рукопись к костру. Жмуримо запели. Страницы вспыхнули — и Лощина впервые вздохнула сама.\n\nЛилит больше не боится третьей главы. Офелия ${oph ? 'выходит из колодца — тёплая, живая, мокрая — и смеётся, обнимая тебя.' : 'наконец уходит туда, где тепло.'}\nМэри Сью — просто девушка с пером. Без мира, который нужно держать.\n\nДальше вы пишете сами. Все вместе. Без автора.\n\nНовая страница. Чистый лист.`), 'good');
    if (oph) S.flags.opheliaAlive = 1;
  },
  async endingAuthor() {
    S.endings.author = 1;
    await UI.ending('КОНЦОВКА: НОВЫЙ АВТОР', T('Ты {взял|взяла} перо. Оно тёплое. Оно знает твою руку.\n\nМэри Сью улыбается — впервые по-настоящему — и рассыпается в буквы.\n\nТеперь пишешь ты. Каждый урожай, каждую реплику, каждую смерть.\n\nНаверху какой-то {новый|новый} фермер читает письмо деда и собирает чемодан.\n\nТы уже знаешь, как начнётся его глава.\n«Жил-был один уставший человек...»'), 'bad');
  },
  async endingSin() {
    S.endings.sin = 1;
    await this.killFlash();
    await UI.ending('КОНЦОВКА: ГРЕШНИК', T('Да. Нет. Убить.\n\nТы {выбрал|выбрала} третье — как и всегда.\n\nКнига осталась без автора и без конца. Лощина застыла в одном бесконечном вечере: шесть часов, время пить чай. Никто не двигается. Никто не дышит.\n\nТолько ты ходишь между неподвижными людьми, и пугала поворачивают головы тебе вслед.\n\nТы победил{|а}. Это и есть твоя награда.'), 'bad');
  },
};

/* ---------- сердечные сцены ---------- */
const HEART_EVENTS = [
  { id: 'lil2', npc: 'lilith', h: 2, map: 'witch', async fn() {
    await say('lilith', 'А, это ты. Подержи-ка этот череп. Нет, не урони. Это был мой учитель.', 'neutral');
    await say('lilith', 'Знаешь, зачем ведьме корсет? Нет, не для этого. Он держит заклинание. Если я его сниму — вся моя магия... ну, вывалится. Буквально.', 'wink');
    const c = await choose('', ['Звучит опасно', 'Покажешь?', 'Я подержу череп']);
    if (c === 1) { await say('lilith', 'Ха! Наглец{|ка}. Мне нравится. Но нет. Не на втором свидании.', 'blush'); Social.addPts('lilith', 60); }
    else if (c === 0) { await say('lilith', 'Опасно. Как и я. Хорошо, что ты понимаешь.', 'happy'); Social.addPts('lilith', 40); }
    else { await say('lilith', 'Учитель благодарит тебя. Он говорит, у тебя тёплые руки. ...Я бы не знала.', 'blush'); Social.addPts('lilith', 50); }
  } },
  { id: 'lil5', npc: 'lilith', h: 5, map: 'witch', async fn() {
    await say('lilith', 'Сядь. Мне нужно кое-что тебе показать. Я никому это не показывала.', 'sad');
    await narr('Лилит достаёт из-под половицы старый лист, исписанный красивым почерком. Края обожжены.');
    await say('lilith', 'Это обо мне. Кто-то написал, как я умру. Я вырвала эту страницу из её книги много лет назад. И с тех пор бегу.', 'sad');
    await say('lilith', 'Возьми. Тебе она нужнее. У тебя глаза человека, который собирается найти автора и дать ей по лицу.', 'happy');
    await Events.givePage(2); Social.addPts('lilith', 100);
  } },
  { id: 'lil8', npc: 'lilith', h: 8, map: 'forest', time: [2000, 2600], async fn() {
    await narr('Лилит стоит у озера в лунном свете. Шляпа лежит рядом на траве. Без шляпы она кажется младше и беззащитнее.');
    await say('lilith', 'Ты нашёл{|ла} меня. Я купаюсь в лунном свете раз в месяц. Это восстанавливает силы. И кожу.', 'blush');
    await say('lilith', 'Я ведь должна была сгореть. А теперь стою тут с тобой, и мне впервые не хочется никуда бежать.', 'blush');
    const c = await choose('', ['Обнять её', 'Остаться рядом молча', 'Пошутить про корсет']);
    if (c === 0) { await narr('Ты обнимаешь её. Корсет холодный, а она — тёплая. Лилит тихо смеётся тебе в плечо.'); Social.addPts('lilith', 150); }
    else if (c === 1) { await narr('Вы стоите рядом, пока луна не уходит за деревья. Это лучшее молчание в твоей жизни.'); Social.addPts('lilith', 120); }
    else { await say('lilith', 'Ты неисправим{|а}. ...Ладно. Да, он со шнуровкой сзади. Нет, ты не будешь проверять. Сегодня.', 'wink'); Social.addPts('lilith', 100); }
  } },
  { id: 'rosa2', npc: 'rosa', h: 2, map: 'tavern', time: [1700, 2600], async fn() {
    await say('rosa', 'Эй, @! Помоги! Эль закончился, а у меня полный зал! Подержи поднос!', 'surprised');
    await narr('Ты разносишь кружки весь вечер. Мэр дважды пытается записать на свой счёт. Клим молча кивает тебе в знак уважения.');
    await say('rosa', 'Ты спас{|ла} мне вечер! Держи — половина чаевых. И... ушки тебе идут. Ой, я что, надела их на тебя? Ха-ха!', 'happy');
    S.money += 200; Social.addPts('rosa', 80);
  } },
  { id: 'rosa5', npc: 'rosa', h: 5, map: 'tavern', time: [2100, 2600], async fn() {
    await say('rosa', 'Знаешь, почему таверна называется «Безумное чаепитие»? Потому что здесь всегда шесть часов.', 'neutral');
    await say('rosa', 'Мои часы остановились в тот вечер, когда мама не вернулась из леса. Я так и живу в шести часах. Наливаю чай. Улыбаюсь.', 'sad');
    const c = await choose('', ['Сейчас уже не шесть', 'Я рядом', 'Убить']);
    if (c === 2) { await Events.killChoice('rosa'); return; }
    await say('rosa', c === 0 ? 'Не шесть?.. Ты прав{|а}. Уже почти полночь. Время идёт. Спасибо, что напомнил{|а}.' : 'Рядом... Это лучше любых часов.', 'blush');
    Social.addPts('rosa', 120); Sanity.add(10);
  } },
  { id: 'rosa8', npc: 'rosa', h: 8, map: 'tavern', time: [2200, 2600], async fn() {
    await narr('Таверна пуста. Роза снимает ушки и кладёт их на стойку. Распускает волосы.');
    await say('rosa', 'Без ушек я просто Роза. Не хозяйка, не зайка. Просто девушка, которая очень устала улыбаться для всех.', 'sad');
    await say('rosa', 'Но тебе я улыбаюсь не для чаевых. Можно, я хоть раз скажу это вслух? Ты мне нравишься. Очень.', 'blush');
    Social.addPts('rosa', 150);
  } },
  { id: 'eva2', npc: 'eva', h: 2, map: 'clinic', async fn() {
    await say('eva', 'Раз уж ты здесь — плановый осмотр. Сядь. Открой рот. Скажи «а».', 'neutral');
    await narr('Ева светит фонариком тебе в горло. Очень долго.');
    await say('eva', 'Хм. Там... всё в порядке. А что ты ожидал{|а}? Глаз? Бывает и глаз. Рассудок — норма. Пока. Держи таблетку. Мятная.', 'happy');
    Inv.give('pills', 1); Social.addPts('eva', 60);
  } },
  { id: 'eva5', npc: 'eva', h: 5, map: 'clinic', async fn() {
    await say('eva', 'Я лечу этих людей десять лет. И знаешь, что странно? Никто здесь не стареет. Мэру шестьдесят уже десять лет.', 'neutral');
    await say('eva', 'Я веду карты. Даты не сходятся. Как будто кто-то переписывает их по ночам.', 'sad');
    const c = await choose('', ['Это Мэри Сью', 'Тебе нужно отдохнуть', 'Покажи карты']);
    if (c === 0) { await say('eva', 'Мэри... Да. Это имя я находила на полях карт. Красными чернилами. Значит, я не схожу с ума. Это... облегчение. И ужас.', 'surprised'); }
    else if (c === 2) { await narr('В карте Евы на месте её собственной даты рождения написано: «по сюжету — 31».'); Sanity.add(-5); }
    else await say('eva', 'Отдохнуть? Доктору? Ха. ...Может, с тобой. Когда-нибудь.', 'blush');
    Social.addPts('eva', 100);
  } },
  { id: 'eva8', npc: 'eva', h: 8, map: 'village', time: [1500, 1800], async fn() {
    await say('eva', 'Я хожу на кладбище не к мёртвым. Здесь тихо. Никто не жалуется на голоса в голове.', 'neutral');
    await narr('Ева снимает очки и долго смотрит на тебя без них.');
    await say('eva', 'Без очков я вижу всё. И тебя тоже — настоящ{его|ую}. Мне нравится то, что я вижу. Это не медицинское заключение.', 'blush');
    Social.addPts('eva', 150);
  } },
  { id: 'oph2', npc: 'ophelia', h: 2, map: 'farm', time: [1900, 2600], async fn() {
    await say('ophelia', 'Ты пришёл{|ла}. Смотри — сегодня 1409 звёзд. Значит, кто-то ещё смотрит на нас.', 'happy');
    await say('ophelia', 'Хочешь узнать, каково это — быть утопленницей? Холодно. А потом — привыкаешь. Как к любви.', 'neutral');
    Social.addPts('ophelia', 60);
  } },
  { id: 'oph5', npc: 'ophelia', h: 5, map: 'farm', time: [1900, 2600], async fn() {
    await say('ophelia', 'Я кое-что нашла на дне. Оно лежало подо мной сто лет. Я боялась прочитать.', 'sad');
    await Events.givePage(3);
    await say('ophelia', 'Значит, меня... столкнули. Не судьба. Не случайность. Она. ...Я хочу, чтобы ты нашёл{|ла} её. Не ради мести. Ради меня.', 'sad');
    Social.addPts('ophelia', 100);
  } },
  { id: 'oph8', npc: 'ophelia', h: 8, map: 'farm', time: [1900, 2600], async fn() {
    await narr('Офелия садится на край колодца. Впервые её ноги касаются земли.');
    await say('ophelia', 'Я чувствую траву. Сто лет не чувствовала. Это из-за тебя. Ты делаешь меня... настоящей.', 'blush');
    await say('ophelia', 'Если когда-нибудь подаришь мне кулон — я выйду за тебя. Даже если для этого придётся перестать быть мёртвой.', 'blush');
    Social.addPts('ophelia', 150);
  } },
  { id: 'kva2', npc: 'kva', h: 2, map: 'forest', time: [600, 2000], async fn() {
    await say('kva', 'Ква! Ты пришёл{|ла}! Слушай, мне нужна помощь. Я уронила золотой мяч в большое озеро. Его надо выудить! Удочкой!', 'surprised');
    await say('kva', 'В сказке его доставал принц-лягушка, но лягушка тут я, так что... выходит, ты. Ква.', 'happy');
    Quests.start('q_frog'); Social.addPts('kva', 40);
  } },
  { id: 'kva5', npc: 'kva', h: 5, map: 'forest', time: [600, 2000], async fn() {
    await say('kva', 'Хочешь узнать секрет? Проклятие можно снять. Но тогда я забуду, как разговаривать с лягушками. И с феей Листиком. И... со всеми, кто меня любил такой.', 'sad');
    const c = await choose('', ['Оставайся собой', 'Я помогу снять проклятие', 'Ква']);
    if (c === 2) { AU.sfx('ribbit'); await say('kva', 'КВА! Ты сказал{|а} «ква»! Это значит «я тебя люблю» по-лягушачьи! ...Ну, или «где мухи». Контекст важен!', 'blush'); Social.addPts('kva', 150); }
    else if (c === 0) { await say('kva', 'Собой... Да. Я — Квакерия. Зелёная, громкая, мокрая. И мне так нравится.', 'happy'); Social.addPts('kva', 120); }
    else { await say('kva', 'Ты хочешь меня... другую? Ква... Ладно. Я подумаю.', 'sad'); Social.addPts('kva', 40); }
  } },
  { id: 'kva8', npc: 'kva', h: 8, map: 'forest', time: [600, 2000], async fn() {
    await narr('Квакерия сидит на кувшинке и болтает ногами в воде. Вокруг поют лягушки — хором, почти музыкально.');
    await say('kva', 'Это я их научила. Это песня для тебя. Называется «Ква». Там один куплет. И припев «Ква». Он про любовь.', 'blush');
    await narr('Это самая нелепая и самая искренняя песня, которую ты слышал{|а}.');
    Social.addPts('kva', 150); Sanity.add(15);
  } },
  { id: 'klim3', npc: 'klim', h: 4, map: 'smithy', cond: () => S.flags.klimRosa, async fn() {
    await say('klim', '...Я пришёл. После закрытия. Сказал слово.', 'neutral');
    await say('klim', '...Одно. «Привет». Она засмеялась. Потом мы пили чай. До шести утра. ...Спасибо.', 'happy');
    Social.addPts('klim', 200); Inv.give('iron_bar', 5);
  } },
  { id: 'pier4', npc: 'pierrot', h: 4, map: 'store', time: [900, 1700], async fn() {
    await say('pierrot', '*всхлип* Знаете... сегодня я впервые за год продал всё. Всё! Это вы. Вы покупаете больше, чем вся деревня.', 'happy');
    await say('pierrot', 'Возьмите. Это мой лучший товар. Я берёг его для особого покупателя. *счастливо рыдает*', 'happy');
    Inv.give('qfert', 10); Social.addPts('pierrot', 100);
  } },
  { id: 'mayor4', npc: 'mayor', h: 4, map: 'mayor', async fn() {
    await say('mayor', 'Садитесь. Я... должен признаться. Колодец на вашей ферме — он был там до деревни. Ваш дед не выкопал его. Он его посадил.', 'sad');
    await say('mayor', 'Чёрное семя. Одно. И из него выросла дыра в мир. А на дне — она. Автор. Я подписал с ней договор: деревня живёт, пока никто не мешает её истории.', 'sad');
    await say('mayor', 'А вы мешаете. И... честно говоря, я рад. Удачи.', 'neutral');
    Social.addPts('mayor', 100); Quests.start('q_grave');
  } },
];
const BOUQUET_LINES = {
  lilith: 'Цветы. Мне. Ведьме. ...Если кому-нибудь расскажешь, превращу в жабу. Да. Да, я буду с тобой встречаться.',
  rosa: 'Ой! Это мне?! Да! Да-да-да! Таверна закрыта, хозяйка на свидании!',
  eva: 'Это... нарушение врачебной этики. ...Да. Мне всё равно. Да.',
  ophelia: 'Живые цветы... Они вянут в моих руках. Но мне всё равно. Да. Я буду с тобой. Сколько бы это ни длилось.',
  kva: 'КВА!!! Цветочки! Это значит, мы встречаемся?! Значит! Ква-ква-ква!',
};
const PROPOSAL_LINES = {
  lilith: 'Кулон Утопленницы? Какая жуть. Какая прелесть. Да. Я выйду за тебя. Но фамилию оставлю. Ведьмы не меняют фамилий.',
  rosa: 'Ты... делаешь предложение? Мне? Посреди таверны?! ДА! Все слышали?! ДА!!!',
  eva: 'Мой пульс — сто сорок. Это тахикардия. Это значит «да».',
  ophelia: 'Кулон Утопленницы... для утопленницы. Ты либо очень романтичн{ый|ая}, либо очень странн{ый|ая}. Да. Тысячу раз да.',
  kva: 'Это... это предложение?! Ты — мой принц! Или принцесса! Неважно! КВА-ДА!',
};
const WEDDING_LINES = {
  lilith: 'Я проклинаю тебя... любить меня вечно. Это самое сильное моё заклятие.',
  rosa: 'Теперь у меня есть часы, которые идут вперёд. Это ты.',
  eva: 'Диагноз: навсегда. Лечению не подлежит.',
  ophelia: 'Я больше не холодная. Чувствуешь? ...Почти.',
  kva: 'Ква. Это значит «навсегда». Я только что придумала.',
};
const SEED_WHISPERS = ['Чёрный росток шепчет: «Ещё немного. Поливай меня».', 'Чёрный росток повернулся к окну твоей спальни.', 'Ночью из чёрного ростка доносился скрип пера.', 'Чёрный росток: «Дед тоже меня поливал. Ему понравилось. Сначала».', 'Возле чёрного ростка нашли следы. Твои. Босые.', 'Чёрный росток вырос на миллиметр. И открыл глаз.'];
const NOTES = [
  'Записка в бутылке:\n«Если найдёте это — не ешьте мухоморы у озера. Я съел. Теперь я рыба. Помогите. — Карл»',
  'Записка в бутылке:\n«Дорогая Марфа, я жду тебя у колодца каждую ночь. Ты не приходишь. Зато приходит кто-то другой. — Твой Ф.»',
  'Записка в бутылке:\n«ЖоЖа Корп: Пункт 13 договора: в случае пропажи сотрудника в Лощине компания ответственности не несёт».',
  'Записка в бутылке:\n«Рецепт: пастернак, соль, тайна. Тайну не добавлять после полуночи».',
  'Записка в бутылке:\n«Я Офелия. Мне сто двадцать четыре года, но мне двадцать четыре. Если ты нашёл эту бутылку — ты добрый. Я так думаю».',
  'Записка в бутылке:\n«ДА / НЕТ / УБИТЬ. Всегда выбирай второе. Почти всегда. — Дед»',
  'Записка в бутылке, почерк красивый:\n«Глава 48. Персонаж находит бутылку и читает записку. Персонаж понимает, что это сказано про него. Персонаж закрывает записку».',
];

/* ---------- почта ---------- */
const LETTERS = {
  welcome: { from: 'Мэр Гнилушкин', text: 'Добро пожаловать в Шепчущую Лощину!\n\nНапоминаю: ночью рекомендуется спать. Колодец рекомендуется не слушать. Пугала рекомендуется не разглядывать.\n\nЭто не просьбы.\n\nС уважением,\nмэр Гнилушкин.\n\nP.S. Если найдёте фиолетовые шорты — они не мои.' },
  chapel: { from: 'Мэр Гнилушкин', text: 'Уважаемый наследник!\n\nВ деревне есть заброшенная часовня (южнее площади). Там... завелись маленькие зелёные жители. Они просят подношений. Если их кормить, они чинят вещи. Странно, но факт.\n\nЗагляните. Только не открывайте гроб.', start: 'q_chapel' },
  pierrot: { from: 'Пьеро', text: 'Лавка Пьеро! Свежие семена! Удобрения! Слёзы — бесплатно!\n\nОткрыто с 9:00 до 17:00, кроме среды.\n\n*всхлип*', items: [['parsnip_seed', 5]] },
  furnace: { from: 'Клим', text: 'Печь. Рецепт.\n20 медной руды. 25 камня.\nРуда — в колодце.\nНе благодари.\n\n— Клим', flag: 'furnaceRecipe' },
  ms1: { from: '???', text: 'Я вижу тебя.\n\nТы так мило копаешь грядки. Ты так мило хмуришься, когда пастернак не растёт. Продолжай.\n\n— М.С.', cursed: true },
  joja: { from: 'ЖоЖа Корп', text: 'Уважаемый сотрудник!\n\nВы отсутствуете на рабочем месте 6 дней. Ваш стул скучает. Ваши таблицы плачут.\n\nВозвращайтесь. Корпорация ЖоЖа — это семья. Из семьи не уходят.\n\nОтдел кадров.' },
  lilith: { from: 'Лилит', text: 'Эй, фермер.\n\nСлышала, у тебя в сундуке деда было кое-что чёрное. Не сажай. А если посадишь — поливай каждый день. Голодное семя хуже сытого.\n\nЗаходи в хижину в лесу. У меня есть мандрагора. И чай. И, может, я.\n\n— Л.' },
  grave: { from: 'Гробус', text: 'Уважаемый клиент!\n\nВаш дед был моим лучшим покупателем лопат. Перед «смертью» он просил передать: «Копай меня после полуночи».\n\nНе знаю, что это значит. Я тень, а не следователь.\n\n— Гробус, торговец', start: 'q_grave' },
  toolready: { from: 'Клим', text: 'Инструмент готов.\nЗабери в кузнице.\n\n— К.' },
  ms2: { from: '???', text: 'Хорошая глава. Король Жиж был моим любимцем, но ты {написал|написала} его конец красивее меня.\n\nСпускайся. Я жду. Я поставила чай.\n\n— М.С.', cursed: true },
  ms3: { from: '???', text: 'Ты почти {дописан|дописана}.\n\nОсталось совсем чуть-чуть. Тридцатый этаж. Семь страниц. Чёрный плод.\n\nТы ведь посадил{|а} семя? Конечно посадил{|а}. Я так написала.\n\n— М.С.', cursed: true },
  ms_sin: { from: '???', text: 'Мне нравится твой стиль.\n\nДа. Нет. Убить.\n\nТы выбираешь третье чаще других. Мы с тобой похожи.\n\n— М.С.', cursed: true },
  rosa: { from: 'Роза', text: 'Привет, завсегдатай!\n\nДержи мой секретный рецепт — Адская похлёбка (перец + томат). Бодрит так, что бегаешь быстрее. Проверено на Климе. Он бегал.\n\nЦелую в ушко. Чьё — не скажу.\n— Роза', recipe: 'hell_soup' },
  eva: { from: 'Доктор Ева', text: 'Пациент @.\n\nНапоминаю: рассудок падает после 20:00 и особенно после полуночи. Сон восстанавливает. Еда и разговоры — тоже.\n\nПрилагаю две таблетки. Не запивать ЖоЖа-Колой.\n\n— Ева', items: [['pills', 2]] },
  kva: { from: 'Принцесса Квакерия', text: 'КВА!!!\n\nПривет! Это я! Я научилась писать! Ну, почти. Лилит помогла.\n\nПриходи на болото! Я покажу тебе, как ловить мух! Ну или просто посидим!\n\nТвоя Ква ♥\n(сердечко нарисовано тиной)' },
  ophelia: { from: 'Офелия', text: 'Это письмо промокло насквозь. Чернила расплылись, но ещё можно прочитать:\n\n«Ты приходишь к колодцу, и мне становится тепло. Это странно. Мне не было тепло сто лет.\n\nПриходи ещё.\n\n— О.»', cursed: true },
  summer: { from: 'Пьеро', text: 'Лето! Новые семена: томат-сердце, глазника, дыня-череп, адский перец, подсолнух!\n\nВесенние посевы завяли. Как моя надежда. *всхлип*' },
  fall: { from: 'Пьеро', text: 'Осень! Тыквы! Клюква! Свёкла для борща!\n\nЛетние посевы умерли. Красиво умерли.' },
  winter: { from: 'Лилит', text: 'Зима. На улице ничего не растёт. Займись колодцем, рыбалкой и людьми. Или почини оранжерею через часовню — там всегда лето.\n\nИ одевайся теплее. — Л.' },
  grandpa: { from: 'Дед', text: '{Внучок|Внучка}.\n\nЯ же просил. Я же просил не сажать его.\n\nТеперь поливай. Каждый день. Иначе оно будет поливать тебя.\n\nЯ рядом. Всегда рядом. Посмотри под кровать.\n\n— Дед', cursed: true },
};
const Mail = {
  send(id) { if (S.mail.includes(id) || S.mailRead.includes(id)) return; S.mail.push(id); },
  daily() {
    const d = S.absDay;
    if (d === 2) this.send('welcome');
    if (d === 3) { this.send('chapel'); this.send('pierrot'); }
    if (d === 4) this.send('furnace');
    if (d === 5) this.send('ms1');
    if (d === 7) this.send('joja');
    if (d === 8) this.send('lilith');
    if (S.wellMax >= 5) this.send('grave');
    if (hearts('rosa') >= 3) this.send('rosa');
    if (hearts('eva') >= 2) this.send('eva');
    if (hearts('kva') >= 3) this.send('kva');
    if (hearts('ophelia') >= 4) this.send('ophelia');
    if (S.day === 1 && S.season === 1) this.send('summer');
    if (S.day === 1 && S.season === 2) this.send('fall');
    if (S.day === 1 && S.season === 3) this.send('winter');
    if (S.flags.seedPlanted && S.sanity < 40) this.send('grandpa');
  },
  async open() {
    if (!S.mail.length) { UI.note('Почтовый ящик пуст. Только паук.'); return; }
    Game.lock();
    while (S.mail.length) {
      const id = S.mail.shift(); S.mailRead.push(id); const L = LETTERS[id]; if (!L) continue;
      let extra = '';
      if (L.items) { for (const [it, n] of L.items) Inv.give(it, n); extra = '\n\nВложено: ' + L.items.map(([it, n]) => ITEMS[it].n + ' ×' + n).join(', '); }
      if (L.recipe) { S.recipes[L.recipe] = 1; extra += '\n\nВыучен рецепт: ' + ITEMS[L.recipe].n; }
      if (L.flag) { S.flags[L.flag] = 1; extra += '\n\nВыучен рецепт: Печь'; }
      if (L.start) Quests.start(L.start);
      await UI.letter(`От: ${L.from}\n\n${T(L.text)}${extra}`, L.cursed);
    }
    Game.unlock();
  },
};

/* ---------- квесты ---------- */
const QUESTS = {
  q_start: { t: 'Наследство', d: 'Расчисти ферму (10 сорняков, веток или камней) и посади 5 семян пастернака.', prog: () => `Расчищено: ${Math.min(10, qp('clear'))}/10 · Посажено: ${Math.min(5, qp('plant:parsnip'))}/5`, done: () => qp('clear') >= 10 && qp('plant:parsnip') >= 5, reward() { S.money += 150; }, rt: '150з', next: ['q_meet'] },
  q_meet: { t: 'Новые соседи', d: 'Познакомься с шестью жителями Лощины. Деревня — к востоку от фермы, лес — к югу.', prog: () => `Знакомства: ${Math.min(6, metCount())}/6`, done: () => metCount() >= 6, reward() { S.money += 250; S.recipes.spring_salad = 1; }, rt: '250з + рецепт «Весенний салат»' },
  q_well: { t: 'Голос из колодца', d: 'Что-то зовёт со дна. Спустись в Колодец на ферме.', prog: () => `Глубина: ${S.wellMax}`, done: () => S.wellMax >= 1, reward() { }, rt: '—', next: ['q_well5'] },
  q_well5: { t: 'Свет в глубине', d: 'Спустись до 5-го этажа Колодца и найди костёр.', prog: () => `Глубина: ${S.wellMax}/5`, done: () => S.wellMax >= 5, reward() { S.estusMax++; S.estus = S.estusMax; }, rt: '+1 заряд Эстуса', next: ['q_king'] },
  q_king: { t: 'Король Жиж', d: 'На 10-м этаже правит Король Жиж. Свергни его.', prog: () => `Глубина: ${S.wellMax}/10`, done: () => !!S.flags.boss10, reward() { S.money += 1000; }, rt: '1000з + страница' },
  q_hatter: { t: 'Безумное чаепитие', d: 'На 20-м этаже Безумный Шляпник пьёт чай вечно. Прерви его чаепитие.', prog: () => `Глубина: ${S.wellMax}/20`, done: () => !!S.flags.boss20, reward() { S.money += 3000; }, rt: '3000з + страница' },
  q_author: { t: 'Автор', d: 'Спустись на 30-й этаж. Чтобы открыть Дверь Автора, нужны 7 страниц рукописи и Чёрный плод.', prog: () => `Страницы: ${S.pages.length}/7 · Плод: ${Inv.has('blackfruit') || S.flags.boss30 ? 'есть' : 'нет'}`, done: () => !!S.flags.boss30, reward() { }, rt: 'Финал' },
  q_pages: { t: 'Рукопись', d: 'Кто-то пишет эту историю. Найди все 7 страниц её рукописи: в глубинах, у сердец жителей, на дне озера, в могиле деда, на алтаре часовни.', prog: () => `Страницы: ${S.pages.length}/7`, done: () => S.pages.length >= 7, reward() { }, rt: 'Ключ к Двери Автора' },
  q_seed: { t: 'Чёрное семя', d: 'Дед просил не сажать. Но семя тёплое и пульсирует. Посади его и поливай каждый день — 14 дней.', prog: () => S.flags.fruit ? 'Плод собран' : S.flags.seedPlanted ? 'Растёт...' : 'Не посажено', done: () => !!S.flags.fruit, reward() { }, rt: 'Чёрный плод' },
  q_chapel: { t: 'Заброшенная часовня', d: 'Загляни в часовню на юге деревни и сделай подношение Жмуримо (собери любой набор).', prog: () => `Наборов: ${Bundles.doneCount()}`, done: () => Bundles.doneCount() >= 1, reward() { S.money += 500; }, rt: '500з', next: ['q_chapel_all'] },
  q_chapel_all: { t: 'Сытые Жмуримо', d: 'Собери все наборы часовни. Жмуримо обещают что-то важное.', prog: () => `Наборов: ${Bundles.doneCount()}/${BUNDLES.length}`, done: () => !!S.flags.chapelDone, reward() { }, rt: 'Страница + тайна' },
  q_ship: { t: 'Первый капитал', d: 'Заработай 3000з отгрузкой через ящик у дома.', prog: () => `Отгружено: ${U.fmt(qp('ship'))}/3000з`, done: () => qp('ship') >= 3000, reward() { Inv.give('sprinkler', 2); }, rt: '2 разбрызгивателя' },
  q_shorts: { t: 'Фиолетовая тайна', d: 'Ты нашёл{|ла} фиолетовые шорты с биркой «Гнилушкин». Вернуть мэру... или отдать Розе для таверны?', prog: () => 'Шорты в рюкзаке', done: () => !!S.flags.shortsDone, reward() { }, rt: 'Зависит от выбора' },
  q_frog: { t: 'Золотой мяч', d: 'Квакерия уронила золотой мяч в лесное озеро. Выуди его удочкой и подари ей.', prog: () => S.flags.goldball ? 'Мяч найден!' : 'Рыбачь в лесном озере', done: () => false, reward() { Inv.give('emerald', 1); }, rt: 'Изумруд + любовь' },
  q_grave: { t: 'Могила деда', d: 'Копни могилу деда мотыгой после полуночи. Кладбище — на юго-востоке деревни.', prog: () => S.flags.graveDug ? 'Выкопано' : 'Ждёт полуночи', done: () => S.pages.includes(0), reward() { }, rt: 'Страница' },
  q_klim: { t: 'Слово кузнеца', d: 'Подари Розе топаз от имени Клима.', prog: () => 'Топаз → Роза', done: () => false, reward() { }, rt: 'Счастье Клима' },
  q_cat: { t: 'Улыбка без кота', d: 'Принеси Чеширу три Рыбы-Глаза (лесное озеро, осень и зима).', prog: () => `Рыба-Глаз: ${Inv.count('eyefish')}/3`, done: () => false, reward() { }, rt: 'Улыбка Чешира (удача)' },
};
function qp(k) { return S.quests.prog[k] || 0; }
function metCount() { return SOCIAL.filter(id => S.rel[id] && S.rel[id].met).length; }
const Quests = {
  start(id) { if (!QUESTS[id] || S.quests.active.includes(id) || S.quests.done.includes(id)) return; S.quests.active.push(id); AU.sfx('quest'); UI.note('Новое задание: ' + QUESTS[id].t, 'good'); this.check(); },
  complete(id) {
    const i = S.quests.active.indexOf(id); if (i < 0) return;
    S.quests.active.splice(i, 1); S.quests.done.push(id); const q = QUESTS[id];
    q.reward(); AU.sfx('quest'); UI.note(`Задание выполнено: ${q.t}${q.rt && q.rt !== '—' ? ' (' + q.rt + ')' : ''}`, 'good');
    for (const n of q.next || []) this.start(n);
  },
  check() {
    if (!S) return;
    for (const id of S.quests.active.slice()) { const q = QUESTS[id]; if (q && q.done()) this.complete(id); }
    if (!S.quests.active.includes('q_ship') && !S.quests.done.includes('q_ship') && S.absDay >= 3) this.start('q_ship');
    const b = S.board; if (b && b.accepted && !b.done && b.kind !== 'bring' && qp(b.key) - b.base >= b.n) { b.done = true; S.money += b.reward; AU.sfx('quest'); UI.note(`Заказ выполнен! +${b.reward}з`, 'good'); if (b.npc) Social.addPts(b.npc, 150); S.stats.boardDone = (S.stats.boardDone || 0) + 1; }
  },
  event(kind, a, b) {
    const P_ = S.quests.prog; const inc = (k, n = 1) => P_[k] = (P_[k] || 0) + n;
    switch (kind) {
      case 'clear': inc('clear'); break;
      case 'plant': inc('plant'); inc('plant:' + a); break;
      case 'ship': inc('ship', a); break;
      case 'kill': inc('kill'); inc('kill:' + a); break;
      case 'fish': inc('fish'); inc('fish:' + a); break;
      case 'harvest': inc('harvest:' + a); break;
      case 'mine': inc('mine'); break;
      case 'meet': break;
    }
    this.check();
  },
  daily() {
    // доска объявлений: новый заказ раз в 2 дня
    if (S.board && !S.board.done && S.board.accepted && S.board.until > S.absDay) return;
    if (S.absDay % 2 === 0 || !S.board) {
      const kinds = ['bring', 'bring', 'kill', 'fish'];
      const kind = S.wellMax >= 1 ? U.pick(kinds) : U.pick(['bring', 'bring', 'fish']);
      const npc = U.pick(['mayor', 'pierrot', 'rosa', 'eva', 'klim', 'lilith']);
      let o;
      if (kind === 'bring') {
        const pool = [...(SEED_SHOP[S.season].map(s => ITEMS[s].crop).map(c => CROPS[c].item)), ...FORAGE.forest[S.season], 'copper_ore', 'iron_ore', 'coal', 'quartz', 'stone', 'wood'];
        const item = U.pick(pool); const n = ['wood', 'stone'].includes(item) ? 50 : ITEMS[item].p < 60 ? U.ri(3, 6) : U.ri(1, 3);
        o = { kind, item, n, npc, reward: Math.max(100, Math.round(ITEMS[item].p * n * 3 / 10) * 10), text: `${NPCS[npc].short || NPCS[npc].n}: «Нужно ${ITEMS[item].n} ×${n}. Принеси мне лично.»` };
      } else if (kind === 'kill') {
        const t = S.wellMax >= 11 ? U.pick(['ghost', 'eye', 'slime_b', 'bat_b']) : U.pick(['slime_g', 'bat_a', 'skeleton']);
        const n = U.ri(5, 10); o = { kind, key: 'kill:' + t, n, npc, reward: n * (MON[t].xp * 15 + 20), text: `${NPCS[npc].short || NPCS[npc].n}: «В колодце развелось: ${MON[t].n}. Убей ${n}.»` };
      } else {
        const fishes = Object.keys(FISH).filter(f => !FISH[f].legend && (!FISH[f].seasons || FISH[f].seasons.includes(S.season)) && !FISH[f].weather && FISH[f].loc[0] !== 'well');
        const f = U.pick(fishes); o = { kind, key: 'fish:' + f, n: 1, npc, reward: FISH[f].p * 4 + 100, text: `${NPCS[npc].short || NPCS[npc].n}: «Хочу на ужин: ${FISH[f].n}. Поймай одну.»` };
      }
      o.day = S.absDay; o.until = S.absDay + 3; o.accepted = false; o.done = false;
      S.board = o;
    }
  },
};

/* ---------- часовня: наборы ---------- */
const BUNDLES = [
  { id: 'spring', room: 'Кладовая', n: 'Весенний урожай', req: [['parsnip', 1], ['garlic', 1], ['potato', 1], ['cauli', 1]], reward: ['fert', 20] },
  { id: 'summer', room: 'Кладовая', n: 'Летний урожай', req: [['tomato', 1], ['eyeberry', 1], ['melon', 1], ['pepper', 1]], reward: ['qsprinkler', 1] },
  { id: 'fall', room: 'Кладовая', n: 'Осенний урожай', req: [['pumpkin', 1], ['eggplant', 1], ['cranberry', 1], ['beet', 1]], reward: ['keg', 1] },
  { id: 'forage', room: 'Лесная комната', n: 'Дары леса', req: [['horseradish', 1], ['daffodil', 1], ['leek', 1], ['dandelion', 1]], reward: ['returnpot', 3] },
  { id: 'res', room: 'Лесная комната', n: 'Стройматериалы', req: [['wood', 99], ['stone', 99], ['hardwood', 10]], reward: ['bridge', 1] },
  { id: 'fish', room: 'Аквариум', n: 'Рыбный набор', req: [['carp', 1], ['perch', 1], ['trout', 1], ['mudfish', 1]], reward: ['rodup', 1] },
  { id: 'deep', room: 'Подвал', n: 'Из глубин', req: [['copper_bar', 5], ['iron_bar', 5], ['slime', 10], ['batwing', 5]], reward: ['estus_shard', 1] },
  { id: 'night', room: 'Подвал', n: 'Ночной набор', req: [['amanita', 1], ['ghostfish', 1], ['ecto', 3], ['essence', 3]], reward: ['campfire', 1] },
  { id: 'money', room: 'Казна', n: 'Подношение золотом', req: [['$', 5000]], reward: ['money_room', 1] },
];
const Bundles = {
  doneCount() { return BUNDLES.filter(b => S.bundles[b.id] && S.bundles[b.id].done).length; },
  roomDone(room) { return BUNDLES.filter(b => b.room === room).every(b => S.bundles[b.id] && S.bundles[b.id].done); },
  give(b, k) {
    const st = S.bundles[b.id] = S.bundles[b.id] || { got: {} };
    const [id, n] = b.req[k];
    if (st.got[k]) return;
    if (id === '$') { if (S.money < n) { UI.note('Не хватает золота.', 'bad'); return; } S.money -= n; }
    else { if (!Inv.has(id, n)) { UI.note(`Нужно: ${ITEMS[id].n} ×${n}`, 'bad'); return; } Inv.remove(id, n); }
    st.got[k] = 1; AU.sfx('magic');
    if (b.req.every((_, i) => st.got[i])) this.finish(b);
  },
  async finish(b) {
    S.bundles[b.id].done = true; AU.sfx('quest');
    const [r, n] = b.reward;
    if (r === 'bridge') { S.flags.bridge = 1; World.maps.forest.fill(15, 24, 2, 1, G_.BRIDGE); UI.note('Жмуримо починили мост на болото в лесу!', 'good'); }
    else if (r === 'rodup') { S.tools.rod = Math.min(3, (S.tools.rod || 0) + 1); _urlCache.clear(); UI.note('Удочка улучшена! Полоса ловли шире.', 'good'); }
    else if (r === 'money_room') { S.flags.lantern = 1; Inv.give('estus_shard', 1); UI.note('Жмуримо подарили Фонарь Жмуримо: в колодце светлее. И осколок эстуса.', 'good'); }
    else { Inv.give(r, n); UI.note(`Награда: ${ITEMS[r].n} ×${n}`, 'good'); }
    if (b.room === 'Кладовая' && this.roomDone('Кладовая') && !S.flags.greenhouse) { S.flags.greenhouse = 1; for (const k of [...SPR.keys()]) if (k.startsWith('bld:')) SPR.delete(k); setTimeout(() => narr('Жмуримо облепили старую оранжерею на ферме. Стёкла срослись. Внутри — вечное лето. Здесь можно сажать что угодно в любой сезон.'), 500); }
    Quests.check();
    if (this.doneCount() === BUNDLES.length && !S.flags.chapelDone) { S.flags.chapelDone = 1; setTimeout(() => this.allDone(), 800); }
  },
  async allDone() {
    Game.lock(); UI.closePanel();
    await narr('Алтарь вспыхивает. Жмуримо водят хоровод вокруг тебя — их всё больше и больше. Сотни маленьких вычеркнутых душ.');
    await UI.say('zhmur', 'Жмур! Ты накормил{|а} нас всех! Мы помним, кто мы! Мы — те, кого она вычеркнула!', 'happy');
    await UI.say('zhmur', 'Держи. Это её страница. Мы прятали её в гробу. Когда придёт время — мы поможем тебе сжечь её книгу.', 'happy');
    await Events.givePage(5); Quests.check();
    World.maps.village.dirtyGround = true; for (const k of [...SPR.keys()]) if (k.startsWith('bld:')) SPR.delete(k);
    Game.unlock();
  },
};
