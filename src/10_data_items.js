/* ============================================================
   Данные: предметы, культуры, рыба, рецепты, магазины, монстры
   ============================================================ */
const SEASONS = ['Весна', 'Лето', 'Осень', 'Зима'];
const SEASONS_GEN = ['весны', 'лета', 'осени', 'зимы'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAYS_IN_SEASON = 28;

const ITEMS = {
  // --- инструменты ---
  hoe: { n: 'Мотыга', type: 'tool', tool: 'hoe', d: 'Копает землю. Иногда земля копает в ответ.' },
  can: { n: 'Лейка', type: 'tool', tool: 'can', d: 'Полей грядки. Набери воды у пруда.' },
  axe: { n: 'Топор', type: 'tool', tool: 'axe', d: 'Рубит деревья. Деревья это запомнят.' },
  pick: { n: 'Кирка', type: 'tool', tool: 'pick', d: 'Для камней, руды и чужих секретов.' },
  rod: { n: 'Удочка', type: 'tool', tool: 'rod', d: 'Держи кнопку, чтобы закинуть. Рыба не хочет быть пойманной.' },
  estus: { n: 'Фляга Эстуса', type: 'estus', ic: ['estus', 1], d: 'Восстанавливает здоровье. Наполняется у костра и во сне. Не пей залпом. Хотя нет, пей.' },
  // --- оружие ---
  scythe: { n: 'Ржавая коса', type: 'weapon', ic: ['tool', 'scythe', 0], w: { min: 2, max: 5, spd: 1.15, crit: .03 }, cut: true, p: 0, d: 'Режет траву и всё, что шевелится. Досталась от деда.' },
  broken: { n: 'Сломанный прямой меч', type: 'weapon', ic: ['sword', '#a8b0b8', '#5a4a3a', 4], w: { min: 3, max: 7, spd: 1.3, crit: .3 }, p: 100, d: 'Легендарное оружие. Легендарно плохое. Зато критует как не в себя.' },
  copper_sword: { n: 'Медный меч', type: 'weapon', ic: ['sword', '#d88a4a', '#5a3a1a'], w: { min: 8, max: 13, spd: 1, crit: .05 }, p: 250, d: 'Надёжный. Зеленеет от сырости, как и ты.' },
  cleaver: { n: 'Тесак мясника', type: 'weapon', ic: ['sword', '#c8c8c8', '#3a2a1a', 1], w: { min: 12, max: 19, spd: .85, crit: .06 }, p: 600, d: 'Пахнет фаршем. Не спрашивай.' },
  iron_sword: { n: 'Железный меч', type: 'weapon', ic: ['sword', '#e0e6ee', '#2a2a5a'], w: { min: 16, max: 24, spd: 1, crit: .05 }, p: 1200, d: 'Клинок честного кузнеца.' },
  blood_scythe: { n: 'Кровавая коса', type: 'weapon', ic: ['tool', 'scythe', 4], w: { min: 20, max: 30, spd: 1.1, crit: .08, leech: .06 }, cut: true, p: 1800, d: 'Пьёт кровь врагов и делится с тобой. Щедрая.' },
  hatpin: { n: 'Шляпная булавка', type: 'weapon', ic: ['sword', '#f2c430', '#a02040', 2], w: { min: 24, max: 34, spd: 1.55, crit: .12 }, p: 2500, d: 'Оружие Безумного Шляпника. Очень быстрое. Очень острое. Очень безумное.' },
  moonsword: { n: 'Лунный меч', type: 'weapon', ic: ['sword', '#a8e0ff', '#3a3a8a', 3], w: { min: 32, max: 46, spd: 1, crit: .08, wave: true }, p: 5000, d: 'Испускает лунную волну. Восхвали луну! (Солнце занято.)' },
  quill: { n: 'Перо Автора', type: 'weapon', ic: ['sword', '#f0eadc', '#000', 5], w: { min: 50, max: 70, spd: 1.2, crit: .15, wave: true }, p: 0, d: 'Им писали твою жизнь. Теперь пиши сам{|а}.' },
  void_sword: { n: 'Меч Пустоты', type: 'weapon', ic: ['sword', '#6a2ad0', '#000', 1], w: { min: 60, max: 92, spd: 1.05, crit: .12, wave: true }, p: 9000, d: 'Найден на дне Бездны. Бездна хочет его обратно.' },

  // --- семена ---
  parsnip_seed: { n: 'Семена пастернака', type: 'seed', crop: 'parsnip', p: 10, ic: ['seed', '#e8d080'], d: 'Весна. 4 дня. С них всё начинается.' },
  garlic_seed: { n: 'Семена чеснока', type: 'seed', crop: 'garlic', p: 20, ic: ['seed', '#f4f0e6'], d: 'Весна. 4 дня. Отпугивает вампиров и сватов.' },
  potato_seed: { n: 'Семена картошки', type: 'seed', crop: 'potato', p: 25, ic: ['seed', '#a07a4a'], d: 'Весна. 6 дней. Иногда даёт лишнюю картофелину.' },
  cauli_seed: { n: 'Семена мозговой капусты', type: 'seed', crop: 'cauli', p: 40, ic: ['seed', '#f0a0b0'], d: 'Весна. 12 дней. Растёт медленно, думает быстро.' },
  strawberry_seed: { n: 'Семена кровяники', type: 'seed', crop: 'strawberry', p: 75, ic: ['seed', '#d02030'], d: 'Весна. 8 дней, потом каждые 4.' },
  tomato_seed: { n: 'Семена томата-сердца', type: 'seed', crop: 'tomato', p: 25, ic: ['seed', '#d82030'], d: 'Лето. 11 дней, потом каждые 4.' },
  eyeberry_seed: { n: 'Семена глазники', type: 'seed', crop: 'eyeberry', p: 40, ic: ['seed', '#3a5ad0'], d: 'Лето. 13 дней, потом каждые 4. По три ягоды.' },
  melon_seed: { n: 'Семена дыни-черепа', type: 'seed', crop: 'melon', p: 40, ic: ['seed', '#7ac85a'], d: 'Лето. 12 дней. Дорогая и улыбчивая.' },
  pepper_seed: { n: 'Семена адского перца', type: 'seed', crop: 'pepper', p: 20, ic: ['seed', '#e02020'], d: 'Лето. 5 дней, потом каждые 3.' },
  sunflower_seed: { n: 'Семена подсолнуха', type: 'seed', crop: 'sunflower', p: 100, ic: ['seed', '#f2c430'], d: 'Лето. 8 дней. Он будет за тобой следить.' },
  pumpkin_seed: { n: 'Семена тыквы-фонаря', type: 'seed', crop: 'pumpkin', p: 50, ic: ['seed', '#e07a20'], d: 'Осень. 13 дней. Сама вырезает себе лицо.' },
  eggplant_seed: { n: 'Семена баклажана', type: 'seed', crop: 'eggplant', p: 10, ic: ['seed', '#5a2a7a'], d: 'Осень. 5 дней, потом каждые 5.' },
  cranberry_seed: { n: 'Семена клюквы-крови', type: 'seed', crop: 'cranberry', p: 120, ic: ['seed', '#a01020'], d: 'Осень. 7 дней, потом каждые 5. По две ягоды.' },
  beet_seed: { n: 'Семена свёклы', type: 'seed', crop: 'beet', p: 10, ic: ['seed', '#8a1a3a'], d: 'Осень. 6 дней. Для борща.' },
  mandrake_seed: { n: 'Семена мандрагоры', type: 'seed', crop: 'mandrake', p: 150, ic: ['seed', '#c8a070', '#3a8a3a'], d: 'Весна-осень. 10 дней. Кричит при сборе (-рассудок).' },
  blackseed: { n: 'Чёрное семя', type: 'seed', crop: 'blackseed', p: 0, ic: ['blackseed'], key: true, d: '«НЕ САЖАЙ ЕГО». — Дед.\nРастёт в любой сезон, если поливать.' },

  // --- урожай ---
  parsnip: { n: 'Пастернак', type: 'crop', cat: 'veg', p: 35, e: 25, h: 10, ic: ['root', '#f2e0a0'], col: '#e8d080', d: 'Простой, честный корнеплод. Подозрительно честный.' },
  garlic: { n: 'Чеснок', type: 'crop', cat: 'veg', p: 60, e: 20, h: 8, s: 2, ic: ['garlic'], col: '#f4f0e6', d: 'Пахнет защитой от нечисти.' },
  potato: { n: 'Картошка-глазастик', type: 'crop', cat: 'veg', p: 80, e: 25, h: 11, ic: ['round', '#b08a50', '#6a4a2a', 1, null], col: '#b08a50', d: 'Её глазки моргают. Иногда.' },
  cauli: { n: 'Мозговая капуста', type: 'crop', cat: 'veg', p: 175, e: 75, h: 33, s: 3, ic: ['brain'], col: '#f0a0b0', d: 'Пахнет мыслями. Чужими.' },
  strawberry: { n: 'Кровяника', type: 'crop', cat: 'fruit', p: 120, e: 50, h: 22, s: 2, ic: ['heart', '#c81030'], col: '#c81030', d: 'Сладкая. Красная. Течёт.' },
  tomato: { n: 'Томат-сердце', type: 'crop', cat: 'veg', p: 60, e: 20, h: 9, ic: ['heart', '#e02a2a'], col: '#e02a2a', d: 'Если приложить к уху — тук-тук.' },
  eyeberry: { n: 'Глазника', type: 'crop', cat: 'fruit', p: 50, e: 25, h: 11, ic: ['eyeberry'], col: '#3a5ad0', d: 'Черника, которая смотрит в ответ.' },
  melon: { n: 'Дыня-череп', type: 'crop', cat: 'fruit', p: 250, e: 113, h: 50, ic: ['skull'], col: '#7ac85a', d: 'Сладкая мякоть, костяная улыбка.' },
  pepper: { n: 'Адский перец', type: 'crop', cat: 'veg', p: 40, e: 13, h: 5, ic: ['pepper'], col: '#e02020', d: 'Острый настолько, что видишь грешников.' },
  sunflower: { n: 'Подсолнух-наблюдатель', type: 'crop', cat: 'flower', p: 80, e: 45, h: 20, ic: ['sunflower'], col: '#f2c430', d: 'Всегда повёрнут к тебе. Даже ночью.' },
  pumpkin: { n: 'Тыква-фонарь', type: 'crop', cat: 'veg', p: 320, e: 0, ic: ['pumpkin', 1], col: '#e07a20', d: 'Вырастает уже с лицом. Улыбается.' },
  eggplant: { n: 'Баклажан', type: 'crop', cat: 'veg', p: 60, e: 20, h: 9, ic: ['eggplant'], col: '#5a2a7a', d: 'Просто баклажан. Наконец-то что-то нормальное.' },
  cranberry: { n: 'Клюква-кровь', type: 'crop', cat: 'fruit', p: 75, e: 38, h: 17, ic: ['cranberry'], col: '#a01020', d: 'Кислая, как разговор с мэром.' },
  beet: { n: 'Свёкла-печёнка', type: 'crop', cat: 'veg', p: 100, e: 30, h: 13, ic: ['beet'], col: '#8a1a3a', d: 'По форме напоминает печень. Не думай об этом.' },
  mandrake: { n: 'Мандрагора', type: 'crop', cat: 'veg', p: 650, e: 50, h: 20, s: -15, ic: ['mandrake'], col: '#c8a070', d: 'Кричит. Даже в рюкзаке. Тихонько.' },
  blackfruit: { n: 'Чёрный плод', type: 'key', key: true, ic: ['blackfruit'], d: 'Тяжёлый. Тёплый. Внутри что-то пишет.' },

  // --- собирательство ---
  horseradish: { n: 'Дикий хрен', type: 'forage', cat: 'forage', p: 50, e: 13, h: 5, ic: ['root', '#e8e0c8', '#5a8a3a'], d: 'Острый. Как совесть.' },
  daffodil: { n: 'Нарцисс', type: 'forage', cat: 'flower', p: 30, e: 0, ic: ['flower', '#f2e040', '#e07a20'], d: 'Любуется собой. Как некоторые.' },
  leek: { n: 'Лук-порей', type: 'forage', cat: 'forage', p: 60, e: 40, h: 16, ic: ['leek'], d: 'Им можно размахивать. Мемно.' },
  dandelion: { n: 'Одуванчик', type: 'forage', cat: 'flower', p: 40, e: 25, h: 11, ic: ['flower', '#f2e040', '#f2e040'], d: 'Подуй — и загадай, чтобы всё это кончилось.' },
  morel: { n: 'Сморчок', type: 'forage', cat: 'mushroom', p: 150, e: 20, h: 8, ic: ['mushroom', '#8a6a4a', '#5a4a2a'], d: 'Морщинистый, как мэр.' },
  spiceberry: { n: 'Пряная ягода', type: 'forage', cat: 'fruit', p: 80, e: 25, h: 11, ic: ['berry', '#d03020'], d: 'Острая ягода из глубин леса.' },
  grape: { n: 'Дикий виноград', type: 'forage', cat: 'fruit', p: 80, e: 38, h: 17, ic: ['grape'], col: '#6a2a9a', d: 'Отличное вино получится. Наверное.' },
  sweetpea: { n: 'Душистый горошек', type: 'forage', cat: 'flower', p: 50, e: 0, ic: ['flower', '#d080e0', '#ffffff'], d: 'Пахнет как первое свидание.' },
  chanterelle: { n: 'Лисичка', type: 'forage', cat: 'mushroom', p: 160, e: 75, h: 33, ic: ['mushroom', '#f0a030'], d: 'Не лиса. Но хитрая.' },
  blackberry: { n: 'Ежевика', type: 'forage', cat: 'fruit', p: 20, e: 25, h: 11, ic: ['berry', '#2a1a4a'], col: '#2a1a4a', d: 'Колется. Кусается. Вкусная.' },
  plum: { n: 'Дикая слива', type: 'forage', cat: 'fruit', p: 80, e: 25, h: 11, ic: ['round', '#7a2a8a', null, 0, '#5a3a1a'], col: '#7a2a8a', d: 'Сливовая наливка — национальное достояние Лощины.' },
  amanita: { n: 'Мухомор-шептун', type: 'forage', cat: 'mushroom', p: 200, e: 60, h: -10, s: -20, ic: ['mushroom', '#d02020', '#ffffff'], d: 'Если приложить к уху — шепчет. Если съесть — шепчешь ты.' },
  winterroot: { n: 'Зимний корень', type: 'forage', cat: 'forage', p: 70, e: 25, h: 11, ic: ['root', '#c8a080', '#8a6a4a'], d: 'Крахмальный корень из мёрзлой земли.' },
  crystalfruit: { n: 'Хрустальный фрукт', type: 'forage', cat: 'fruit', p: 150, e: 63, h: 28, ic: ['crystal', '#c8f0ff'], col: '#9ad0ff', d: 'Хрупкий, как твой рассудок.' },
  snowdrop: { n: 'Подснежник', type: 'forage', cat: 'flower', p: 50, e: 0, ic: ['flower', '#ffffff', '#c8e0a0'], d: 'Цветёт там, где кого-то закопали.' },
  holly: { n: 'Падуб', type: 'forage', cat: 'forage', p: 80, e: -10, h: -5, ic: ['holly'], d: 'Ядовитые ягоды. Красиво на открытке.' },
  seaweed: { n: 'Водоросли', type: 'trash', cat: 'forage', p: 20, e: 13, h: 5, ic: ['weed'], d: 'Скользкие и полезные.' },

  // --- ресурсы ---
  wood: { n: 'Дерево', type: 'res', p: 2, ic: ['log'], d: 'Основа всего. Особенно сундуков.' },
  hardwood: { n: 'Твёрдая древесина', type: 'res', p: 15, ic: ['log', '#5a3a20', '#a07a4a'], d: 'Из крупных пней. Нужен медный топор.' },
  stone: { n: 'Камень', type: 'res', p: 2, ic: ['stone'], d: 'Обычный камень. Не смотри на него так.' },
  fiber: { n: 'Волокно', type: 'res', p: 1, ic: ['fiber'], d: 'Из сорняков. Для верёвок, пугал и удобрений.' },
  coal: { n: 'Уголь', type: 'res', p: 15, ic: ['coal'], d: 'Топливо для печи.' },
  clay: { n: 'Глина', type: 'res', p: 20, ic: ['clay'], d: 'Из неё лепили людей. И ещё будут.' },
  copper_ore: { n: 'Медная руда', type: 'res', p: 5, ic: ['ore', '#e07a3a'], d: 'Переплавь в печи: 5 руды + 1 уголь.' },
  iron_ore: { n: 'Железная руда', type: 'res', p: 10, ic: ['ore', '#d8dee6'], d: 'Переплавь в печи: 5 руды + 1 уголь.' },
  gold_ore: { n: 'Золотая руда', type: 'res', p: 25, ic: ['ore', '#f2c430'], d: 'Переплавь в печи: 5 руды + 1 уголь.' },
  copper_bar: { n: 'Медный слиток', type: 'res', p: 60, ic: ['bar', '#d87a3a'], d: 'Для улучшений и крафта.' },
  iron_bar: { n: 'Железный слиток', type: 'res', p: 120, ic: ['bar', '#c8d0d8'], d: 'Для улучшений и крафта.' },
  gold_bar: { n: 'Золотой слиток', type: 'res', p: 250, ic: ['bar', '#f2c430'], d: 'Блестит. Как глаза ворона.' },
  quartz: { n: 'Кварц', type: 'mineral', cat: 'mineral', p: 25, ic: ['crystal', '#f0f0f8'], d: 'Прозрачный минерал.' },
  amethyst: { n: 'Аметист', type: 'gem', cat: 'gem', p: 100, ic: ['gem', '#a050e0'], d: 'Ведьмы такие любят.' },
  topaz: { n: 'Топаз', type: 'gem', cat: 'gem', p: 80, ic: ['gem', '#f0b030'], d: 'Тёплый, как таверна.' },
  ruby: { n: 'Кровавый рубин', type: 'gem', cat: 'gem', p: 250, ic: ['gem', '#d01030'], d: 'Внутри что-то пульсирует.' },
  emerald: { n: 'Изумруд', type: 'gem', cat: 'gem', p: 250, ic: ['gem', '#20c060'], d: 'Цвет лягушачьей мечты.' },
  diamond: { n: 'Алмаз', type: 'gem', cat: 'gem', p: 750, ic: ['gem', '#e0f8ff'], d: 'Навсегда. Как проклятие.' },
  soulgem: { n: 'Камень души', type: 'gem', cat: 'gem', p: 500, ic: ['essence', '#40e0c0'], d: 'Тёплый. Иногда шевелится.' },
  geode: { n: 'Жеода', type: 'res', p: 50, ic: ['geode'], d: 'Кузнец Клим вскроет её за 25з.' },
  // минералы из жеод
  obsidian: { n: 'Обсидиан', type: 'mineral', cat: 'mineral', p: 150, ic: ['crystal', '#2a1a3a'], d: 'Чёрное стекло вулканов. Или чего-то хуже.' },
  moonstone: { n: 'Лунный камень', type: 'mineral', cat: 'mineral', p: 160, ic: ['crystal', '#c8d8ff'], d: 'Светится в полнолуние.' },
  stoneeye: { n: 'Окаменелый глаз', type: 'mineral', cat: 'mineral', p: 120, ic: ['eyeball'], d: 'Окаменел. Но всё ещё следит.' },
  nightcrystal: { n: 'Кристалл кошмара', type: 'mineral', cat: 'mineral', p: 200, ic: ['crystal', '#a01060'], d: 'Если смотреть долго — видишь свой худший сон.' },
  mirrorshard: { n: 'Осколок зеркала', type: 'mineral', cat: 'mineral', p: 90, ic: ['crystal', '#d8e8f0'], d: 'Отражение в нём немного опаздывает.' },
  ghostquartz: { n: 'Призрачный кварц', type: 'mineral', cat: 'mineral', p: 140, ic: ['crystal', '#c8fff0'], d: 'Холодный на ощупь.' },
  // дроп монстров
  slime: { n: 'Слизь', type: 'res', cat: 'monster', p: 5, ic: ['slime'], d: 'Липкая. Тёплая. Фу.' },
  bone: { n: 'Кость', type: 'res', cat: 'monster', p: 15, ic: ['bone'], d: 'Чья-то. Уже ничья.' },
  ecto: { n: 'Эктоплазма', type: 'res', cat: 'monster', p: 40, ic: ['ecto'], d: 'Сопли призрака. Ценный ресурс.' },
  essence: { n: 'Тёмная эссенция', type: 'res', cat: 'monster', p: 60, ic: ['essence'], d: 'Сгусток чужого страха.' },
  batwing: { n: 'Крыло нетопыря', type: 'res', cat: 'monster', p: 15, ic: ['wing'], d: 'Перепончатое. Шуршит.' },
  eyeball: { n: 'Глазное яблоко', type: 'res', cat: 'monster', p: 50, ic: ['eyeball'], d: 'Не яблоко.' },
  ink: { n: 'Чернила Автора', type: 'res', cat: 'monster', p: 80, ic: ['essence', '#101010'], d: 'Ими пишут судьбы.' },
  // мусор и особое
  shoe: { n: 'Старый башмак', type: 'trash', p: 0, ic: ['shoe'], d: 'Чей-то. Нога, наверное, рядом.' },
  bottle: { n: 'Записка в бутылке', type: 'note', p: 0, ic: ['bottle', '#5a8a6a', '#f0e8d0'], d: 'Используй, чтобы прочитать.' },
  goldball: { n: 'Золотой мяч', type: 'key', key: true, ic: ['ball'], d: 'Из сказки про лягушку. Кому-то он очень нужен.' },
  shorts: { n: 'Фиолетовые шорты', type: 'key', key: true, ic: ['shorts'], d: 'Тёплые. Подозрительно знакомые. На бирке: «Гнилушкин».' },
  crown_slime: { n: 'Корона Короля Жиж', type: 'misc', p: 1000, ic: ['crown'], d: 'Липкая корона. Можно продать.' },
  tophat: { n: 'Цилиндр Шляпника', type: 'misc', p: 1500, ic: ['hat', '#3a2a5a'], d: 'Внутри — чай. Горячий.' },
  cat_smile: { n: 'Улыбка Чешира', type: 'key', key: true, ic: ['smile'], d: 'Улыбка без кота. Приносит удачу: больше добычи.' },
  pendant: { n: 'Кулон Утопленницы', type: 'misc', p: 0, ic: ['pendant'], d: 'Подари тому, с кем хочешь провести остаток вечности. 10 ♥ и свидания обязательны.' },
  bouquet: { n: 'Букет', type: 'misc', p: 100, ic: ['bouquet'], d: 'Подари при 8 ♥, чтобы начать встречаться.' },
  page: { n: 'Страница рукописи', type: 'key', key: true, ic: ['page'], p: 0, d: '' },
  heartfx: { n: '♥', type: 'misc', ic: ['heart', '#ff3a5a'], p: 0, key: true, d: '' },
  estus_shard: { n: 'Осколок эстуса', type: 'use', p: 0, ic: ['crystal', '#ff8a20'], d: 'Используй: +1 заряд Фляги Эстуса.' },

  // --- еда ---
  beer: { n: 'Мартовский эль', type: 'food', cat: 'cooking', p: 50, e: 50, h: 20, s: 5, ic: ['cup', '#e0a020'], drink: 1, d: 'Фирменный эль «Безумного чаепития». Слегка безумный.' },
  pizza: { n: 'Пицца «Четыре сыра и глаз»', type: 'food', cat: 'cooking', p: 150, e: 150, h: 60, ic: ['plate', '#f0c040', '#d02020'], d: 'Глаз — это оливка. Наверное.' },
  salad: { n: 'Салат', type: 'food', cat: 'cooking', p: 110, e: 113, h: 50, s: 5, ic: ['bowl', '#5ab83a', '#f0e060'], d: 'Свежий салат. Подозрительно свежий.' },
  tea: { n: 'Чай Шляпника', type: 'food', cat: 'cooking', p: 125, e: 40, s: 25, ic: ['cup', '#c87a3a'], drink: 1, d: 'Время всегда шесть часов. Время пить чай.' },
  spaghetti: { n: 'Спагетти', type: 'food', cat: 'cooking', p: 120, e: 75, h: 34, ic: ['plate', '#f0d070', '#d03020'], d: 'Похоже на мозги. Вкуснее, чем мозги.' },
  coffee: { n: 'Кофе «Бессонница»', type: 'food', cat: 'cooking', p: 75, e: 20, s: -3, buff: { spd: 1.25, min: 180 }, ic: ['cup', '#3a1a0a'], drink: 1, d: 'Ускоряет. Спать не даёт. Совсем.' },
  fried_mush: { n: 'Жареные грибы', type: 'food', cat: 'cooking', p: 200, e: 90, h: 40, ic: ['plate', '#a07040', '#d0a060'], d: 'Не мухоморы. Наверное.' },
  spring_salad: { n: 'Весенний салат', type: 'food', cat: 'cooking', p: 110, e: 113, h: 50, s: 8, ic: ['bowl', '#7ad050', '#f2e040'], d: 'Одуванчик, порей и хрен. Вкус весны.' },
  mash: { n: 'Пюре с глазками', type: 'food', cat: 'cooking', p: 180, e: 90, h: 40, s: 3, ic: ['plate', '#f0e0a0', '#3a2a1a'], d: 'Пюре смотрит, как ты его ешь.' },
  brain_soup: { n: 'Суп из мозговой капусты', type: 'food', cat: 'cooking', p: 300, e: 125, h: 56, s: 20, ic: ['bowl', '#f0b0c0', '#ffffff'], d: 'Ешь мозги — станешь умнее. Это наука.' },
  fish_pie: { n: 'Рыбный пирог', type: 'food', cat: 'cooking', p: 400, e: 140, h: 63, s: 5, ic: ['cake', '#d8a060'], d: 'Из пирога торчит хвост. Это декор.' },
  pumpkin_soup: { n: 'Тыквенный суп', type: 'food', cat: 'cooking', p: 600, e: 200, h: 90, s: 30, ic: ['bowl', '#e07a20', '#fff0c0'], d: 'Тёплый, как бабушкины объятия.' },
  berry_pie: { n: 'Кровяничный пирог', type: 'food', cat: 'cooking', p: 450, e: 150, h: 68, s: 10, ic: ['cake', '#c81030'], d: 'Начинка капает. Красиво.' },
  hell_soup: { n: 'Адская похлёбка', type: 'food', cat: 'cooking', p: 250, e: 120, h: 50, buff: { spd: 1.3, min: 300 }, ic: ['bowl', '#d02010', '#f0a020'], d: 'Скорость +30% на 5 часов. Рот горит вечно.' },
  mandrake_omelet: { n: 'Омлет из мандрагоры', type: 'food', cat: 'cooking', p: 900, e: 260, h: 120, s: -10, buff: { atk: 1.4, min: 360 }, ic: ['plate', '#f2e060', '#c8a070'], d: 'Урон +40% на 6 часов. Всё ещё кричит.' },
  eye_jelly: { n: 'Желе из глазники', type: 'food', cat: 'cooking', p: 200, e: 100, h: 40, s: 5, ic: ['jar', '#3a5ad0'], d: 'Дрожит. Подмигивает.' },
  grilled_fish: { n: 'Рыба на углях', type: 'food', cat: 'cooking', p: 100, e: 70, h: 30, ic: ['plate', '#c08a50', '#f0d0a0'], d: 'Простая еда рыбака.' },
  borscht: { n: 'Борщ', type: 'food', cat: 'cooking', p: 350, e: 180, h: 80, s: 15, ic: ['bowl', '#a01030', '#f4f4f4'], d: 'С чесночком. Цвет подозрительный, вкус — родной.' },
  // медицина и зелья
  medkit: { n: 'Аптечка', type: 'food', p: 100, h: 60, ic: ['potion', '#d02030'], drink: 1, d: '+60 HP. Пахнет спиртом и надеждой.' },
  pills: { n: 'Таблетки «Реальность»', type: 'food', p: 200, s: 40, ic: ['pill'], d: '+40 рассудка. Побочные эффекты: реальность.' },
  jojacola: { n: 'ЖоЖа-Кола', type: 'food', p: 50, e: 60, s: -5, ic: ['bottle', '#3a1a10', '#d02030'], drink: 1, d: 'Корпорация ЖоЖа одобряет. Твоя печень — нет.' },
  clarity: { n: 'Зелье ясности', type: 'food', p: 300, s: 80, e: 20, ic: ['potion', '#80c0ff'], drink: 1, d: '+80 рассудка. Мир на минуту становится понятным.' },
  drinkme: { n: 'Пузырёк «Выпей меня»', type: 'use', p: 0, ic: ['potion', '#f070c0'], d: 'Навсегда +20 к максимальной энергии.' },
  eatme: { n: 'Пирожок «Съешь меня»', type: 'use', p: 0, ic: ['cake', '#f0d0a0'], d: 'Навсегда +15 к максимальному здоровью.' },
  returnpot: { n: 'Зелье возврата', type: 'use', p: 50, ic: ['potion', '#40e0c0'], d: 'Мгновенно переносит домой. Укачивает.' },
  // удобрения
  fert: { n: 'Удобрение', type: 'fert', fert: 1, p: 2, ic: ['jar', '#6a4a2a'], d: 'Повышает шанс качественного урожая.' },
  qfert: { n: 'Ведьмино удобрение', type: 'fert', fert: 2, p: 10, ic: ['jar', '#6a2a8a'], d: 'Сильно повышает качество урожая.' },
  growpot: { n: 'Зелье роста', type: 'fert', fert: 3, p: 20, ic: ['potion', '#5af05a'], d: 'Ускоряет рост на 25%. Растения кричат от счастья.' },
  // бомба
  bomb: { n: 'Вишнёвая бомба', type: 'use', p: 50, ic: ['bomb'], d: 'Взрывается через 2 секунды. Ломает камни и монстров.' },
  // ремесленные товары
  wine: { n: 'Вино', type: 'artisan', artisan: true, cat: 'artisan', p: 0, ic: ['bottle'], d: 'Выдержанное в бочке.' },
  juice: { n: 'Сок', type: 'artisan', artisan: true, cat: 'artisan', p: 0, ic: ['bottle'], d: 'Свежевыжатый.' },
  jam: { n: 'Джем', type: 'artisan', artisan: true, cat: 'artisan', p: 0, ic: ['jar'], d: 'Домашний.' },
  pickles: { n: 'Соленья', type: 'artisan', artisan: true, cat: 'artisan', p: 0, ic: ['jar'], d: 'Хрустящие.' },
  // размещаемые
  chest: { n: 'Сундук', type: 'place', place: 'chest', p: 0, ic: ['object', 'chest'], d: 'Хранит 36 предметов. И секреты.' },
  fence: { n: 'Забор', type: 'place', place: 'fence', p: 1, ic: ['object', 'fence'], d: 'Отделяет тебя от того, что снаружи.' },
  torch: { n: 'Факел', type: 'place', place: 'torch', p: 1, ic: ['torch'], d: 'Свет отгоняет тени. Не все.' },
  scarecrow: { n: 'Пугало', type: 'place', place: 'scarecrow', p: 0, ic: ['object', 'scarecrow'], d: 'Защищает посевы от ворон (радиус 8). Не поворачивайся к нему спиной.' },
  sprinkler: { n: 'Разбрызгиватель', type: 'place', place: 'sprinkler', p: 0, ic: ['object', 'sprinkler'], d: 'Каждое утро поливает 4 соседние клетки.' },
  qsprinkler: { n: 'Качественный разбрызгиватель', type: 'place', place: 'qsprinkler', p: 0, ic: ['object', 'qsprinkler'], d: 'Каждое утро поливает 8 клеток вокруг.' },
  furnace: { n: 'Печь', type: 'place', place: 'furnace', p: 0, ic: ['object', 'furnace'], d: 'Плавит руду: 5 руды + 1 уголь = слиток.' },
  keg: { n: 'Бочка', type: 'place', place: 'keg', p: 0, ic: ['object', 'keg'], d: 'Фрукты → вино (×3 цены), овощи → сок (×2.25).' },
  pjar: { n: 'Банка для заготовок', type: 'place', place: 'pjar', p: 0, ic: ['object', 'jar'], d: 'Фрукты → джем, овощи → соленья (×2 + 50).' },
  cookpot: { n: 'Походный котелок', type: 'place', place: 'cookpot', p: 0, ic: ['object', 'pot'], d: 'Позволяет готовить еду по рецептам.' },
  campfire: { n: 'Костёр души', type: 'place', place: 'campfire', p: 0, ic: ['object', 'bonfire'], d: 'Отдых у костра восстанавливает рассудок раз в день. Восхвали солнце.' },
};

/* ---------- культуры ---------- */
const CROPS = {
  parsnip: { item: 'parsnip', seasons: [0], days: 4, regrow: 0, look: 'root', col: '#f2e0a0' },
  garlic: { item: 'garlic', seasons: [0], days: 4, regrow: 0, look: 'root', col: '#f4f0e6' },
  potato: { item: 'potato', seasons: [0], days: 6, regrow: 0, look: 'root', col: '#b08a50', extra: .25 },
  cauli: { item: 'cauli', seasons: [0], days: 12, regrow: 0, look: 'big', col: '#f0a0b0' },
  strawberry: { item: 'strawberry', seasons: [0], days: 8, regrow: 4, look: 'bush', col: '#c81030' },
  tomato: { item: 'tomato', seasons: [1], days: 11, regrow: 4, look: 'bush', col: '#e02a2a' },
  eyeberry: { item: 'eyeberry', seasons: [1], days: 13, regrow: 4, look: 'bush', col: '#3a5ad0', multi: 3 },
  melon: { item: 'melon', seasons: [1], days: 12, regrow: 0, look: 'big', col: '#7ac85a' },
  pepper: { item: 'pepper', seasons: [1], days: 5, regrow: 3, look: 'bush', col: '#e02020' },
  sunflower: { item: 'sunflower', seasons: [1, 2], days: 8, regrow: 0, look: 'tall', col: '#f2c430', seedBack: 1 },
  pumpkin: { item: 'pumpkin', seasons: [2], days: 13, regrow: 0, look: 'big', col: '#e07a20' },
  eggplant: { item: 'eggplant', seasons: [2], days: 5, regrow: 5, look: 'bush', col: '#5a2a7a' },
  cranberry: { item: 'cranberry', seasons: [2], days: 7, regrow: 5, look: 'bush', col: '#a01020', multi: 2 },
  beet: { item: 'beet', seasons: [2], days: 6, regrow: 0, look: 'root', col: '#8a1a3a' },
  mandrake: { item: 'mandrake', seasons: [0, 1, 2], days: 10, regrow: 0, look: 'root', col: '#c8a070', scream: true },
  blackseed: { item: 'blackfruit', seasons: [0, 1, 2, 3], days: 14, regrow: 0, look: 'black', col: '#0a0a0e' },
};
function cropStage(soil) { const c = CROPS[soil.crop]; if (!c) return 0; if (soil.age >= c.days) return 4; return Math.min(3, Math.floor(soil.age / c.days * 4)); }
function cropSprite(id, stage, creepy) {
  return spr(`crop:${id}:${stage}:${creepy ? 1 : 0}`, () => {
    const C = CROPS[id]; const p = new PX(16, 24); const g = '#4a9a3a', gd = '#2f6e22', gl = '#7ac458';
    const base = 23;
    if (stage === 0) { p.p(7, base - 1, gl); p.p(9, base - 1, gl); p.p(8, base, g); p.p(6, base - 2, g); p.p(10, base - 2, g); }
    else if (C.look === 'black') {
      const h = 4 + stage * 4;
      p.line(8, base, 8, base - h, '#1a1018'); p.line(8, base - h / 2, 4, base - h / 2 - 3, '#1a1018'); p.line(8, base - h / 3, 12, base - h / 3 - 4, '#1a1018');
      if (stage >= 2) { p.ell(5, base - h / 2 - 4, 2, 1, '#3a1a3a'); p.ell(12, base - h / 3 - 5, 2, 1, '#3a1a3a'); }
      if (stage === 4) { p.circ(8, base - h - 2, 4, '#0a0a0e'); p.ring(8, base - h - 2, 5, '#6a2a9a'); p.ell(8, base - h - 2, 2, 1, '#f0f0f0'); p.p(8, base - h - 2, '#d02030'); }
      else if (stage === 3) { p.circ(8, base - h - 1, 2, '#2a1a2a'); }
    } else if (C.look === 'root') {
      const n = stage + 1;
      for (let k = 0; k < n + 1; k++) { const x = 5 + k * (6 / Math.max(1, n)); p.line(8, base, x, base - 3 - stage * 2 - (k % 2), k % 2 ? g : gl); }
      if (stage >= 3) p.line(8, base, 8, base - 9, gd);
      if (stage === 4) { p.ell(8, base - 1, 3, 2, C.col); p.p(7, base - 2, shade(C.col, .4)); if (creepy) { p.p(7, base - 1, '#000'); p.p(9, base - 1, '#000'); } }
    } else if (C.look === 'bush') {
      const r = 2 + stage; p.vl(8, base - r * 2, base, gd);
      p.circ(8, base - r - 1, r, g); p.circ(6, base - r - 2, Math.max(1, r - 2), gl); p.circ(10, base - r, Math.max(1, r - 1), gd);
      if (stage === 4) { for (const [x, y] of [[5, -8], [10, -6], [7, -4], [11, -10], [6, -11]]) { p.circ(x, base + y, 1, C.col); p.p(x - 1, base + y - 1, shade(C.col, .5)); if (creepy && x === 7) { p.p(x, base + y, '#000'); } } }
      else if (stage === 3) { p.p(6, base - 8, '#fff'); p.p(10, base - 6, '#fff'); }
    } else if (C.look === 'big') {
      const r = 2 + stage;
      p.ell(5, base - 3, r, 2, g); p.ell(11, base - 3, r, 2, gd); p.line(8, base, 8, base - 3 - stage * 2, gd); p.ell(8, base - 5 - stage, 2, 1 + stage / 2, gl);
      if (stage === 4) {
        p.ell(8, base - 6, 6, 5, C.col); p.ell(6, base - 8, 2, 2, shade(C.col, .35)); p.ell(8, base - 6, 6, 5, null);
        if (id === 'cauli') { p.line(8, base - 11, 8, base - 2, shade(C.col, -.3)); p.line(4, base - 7, 7, base - 6, shade(C.col, -.3)); p.line(9, base - 8, 12, base - 6, shade(C.col, -.3)); }
        if (id === 'pumpkin' || creepy) { p.p(6, base - 7, '#2a0a00'); p.p(10, base - 7, '#2a0a00'); p.hl(6, 10, base - 4, '#2a0a00'); }
        if (id === 'melon') { p.r(5, base - 8, 2, 2, '#1a3a1a'); p.r(9, base - 8, 2, 2, '#1a3a1a'); p.hl(6, 10, base - 4, '#1a3a1a'); }
      }
    } else if (C.look === 'tall') {
      const h = 4 + stage * 4; p.line(8, base, 8, base - h, gd); p.ell(5, base - h / 2, 2, 1, g); p.ell(11, base - h / 2 - 2, 2, 1, g);
      if (stage === 4) { for (let a = 0; a < 8; a++) p.circ(8 + Math.round(Math.cos(a) * 3), base - h - 2 + Math.round(Math.sin(a) * 3), 1, C.col); p.circ(8, base - h - 2, 2, '#5a3a1a'); p.p(7, base - h - 3, '#fff'); p.p(9, base - h - 3, '#fff'); p.p(7, base - h - 2, '#000'); p.p(9, base - h - 2, '#000'); }
    }
    p.outline('#14200f');
    return p.done();
  });
}

/* ---------- рыба ---------- */
const FISH = {
  carp: { n: 'Карась-зомби', p: 30, loc: ['pond', 'river'], seasons: null, time: [6, 26], diff: 15, beh: 'smooth', ic: ['fish', '#8aa07a', '#5a7a4a'] },
  perch: { n: 'Окунь-глазастик', p: 55, loc: ['river', 'lake'], seasons: [0, 2], time: [6, 19], diff: 30, beh: 'mixed', ic: ['fish', '#c8a040', '#8a3a2a'] },
  pike: { n: 'Щука-кусака', p: 100, loc: ['river'], seasons: [1, 3], time: [6, 26], diff: 50, beh: 'dart', ic: ['fish', '#6a8a5a', '#c8c8a0', 1] },
  catfish: { n: 'Сом-утопленник', p: 200, loc: ['river', 'swamp'], seasons: [0, 2], time: [6, 26], weather: 'rain', diff: 70, beh: 'mixed', ic: ['fish', '#5a5a6a', '#8a8a9a'] },
  eel: { n: 'Угорь-шептун', p: 85, loc: ['lake'], seasons: [0, 2], time: [16, 26], diff: 70, beh: 'smooth', ic: ['fish', '#3a4a3a', '#6a7a5a', 1], s: -3 },
  trout: { n: 'Лунная форель', p: 75, loc: ['lake'], seasons: null, time: [18, 26], diff: 40, beh: 'smooth', ic: ['fish', '#a8c0e0', '#e0e8ff'] },
  mudfish: { n: 'Болотник', p: 60, loc: ['swamp'], seasons: null, time: [6, 26], diff: 35, beh: 'sinker', ic: ['fish', '#5a5a2a', '#8a8a4a', 2] },
  piranha: { n: 'Зубастик', p: 120, loc: ['swamp'], seasons: [1], time: [6, 26], diff: 60, beh: 'dart', ic: ['fish', '#a02020', '#3a3a3a', 2] },
  ghostfish: { n: 'Призрачная рыба', p: 150, loc: ['pond'], seasons: null, time: [20, 26], diff: 55, beh: 'floater', ic: ['fish', '#e0f0ff', '#a0c0e0'] },
  eyefish: { n: 'Рыба-Глаз', p: 90, loc: ['lake'], seasons: [2, 3], time: [6, 26], diff: 45, beh: 'mixed', ic: ['eyeball'] },
  bloodcarp: { n: 'Кровавый карп', p: 110, loc: ['swamp', 'pond'], seasons: [2], time: [6, 26], diff: 50, beh: 'mixed', ic: ['fish', '#c01020', '#f0a0a0'] },
  icefish: { n: 'Ледяной судак', p: 90, loc: ['river', 'lake'], seasons: [3], time: [6, 26], diff: 45, beh: 'smooth', ic: ['fish', '#c8e8ff', '#ffffff', 1] },
  wellfish: { n: 'Слепая пещерная рыба', p: 140, loc: ['well'], seasons: null, time: [6, 26], diff: 55, beh: 'sinker', ic: ['fish', '#f0e0e0', '#c0a0a0'] },
  legend: { n: 'Старый Хозяин', p: 1500, loc: ['lake'], seasons: null, time: [20, 26], diff: 95, beh: 'mixed', minLvl: 4, legend: true, ic: ['fish', '#1a1a2a', '#d02030', 2] },
};
for (const [id, f] of Object.entries(FISH)) ITEMS[id] = { n: f.n, type: 'fish', cat: 'fish', p: f.p, e: Math.round(f.p / 3), h: Math.round(f.p / 8), s: f.s || 0, ic: f.ic, d: f.legend ? 'Легендарная рыба. В её брюхе что-то шуршит.' : 'Рыба. Сложность: ' + f.diff + '.' };

/* ---------- собирательство по сезонам/локациям ---------- */
const FORAGE = {
  farm: [['horseradish', 'daffodil', 'leek', 'dandelion'], ['spiceberry', 'grape', 'sweetpea'], ['blackberry', 'plum', 'chanterelle'], ['winterroot', 'crystalfruit', 'snowdrop']],
  village: [['daffodil', 'dandelion', 'leek'], ['sweetpea', 'grape'], ['blackberry', 'plum'], ['crystalfruit', 'holly', 'snowdrop']],
  forest: [['morel', 'horseradish', 'leek', 'daffodil'], ['spiceberry', 'grape', 'chanterelle'], ['chanterelle', 'amanita', 'blackberry', 'plum'], ['winterroot', 'holly', 'crystalfruit']],
};

/* ---------- рецепты крафта ---------- */
const RECIPES = {
  chest: { in: { wood: 50 }, out: 1 },
  fence: { in: { wood: 2 }, out: 2 },
  torch: { in: { wood: 1, fiber: 2 }, out: 1 },
  fert: { in: { fiber: 5, stone: 3 }, out: 2 },
  scarecrow: { in: { wood: 50, coal: 1, fiber: 20 }, out: 1, need: ['farming', 1] },
  cookpot: { in: { stone: 25, copper_bar: 2 }, out: 1 },
  furnace: { in: { copper_ore: 20, stone: 25 }, out: 1, flag: 'furnaceRecipe' },
  bomb: { in: { copper_ore: 4, coal: 1 }, out: 1, need: ['mining', 1] },
  pjar: { in: { wood: 50, stone: 40, coal: 8 }, out: 1, need: ['farming', 3] },
  sprinkler: { in: { copper_bar: 1, iron_bar: 1 }, out: 1, need: ['farming', 2] },
  keg: { in: { wood: 30, copper_bar: 1, iron_bar: 1 }, out: 1, need: ['farming', 4] },
  campfire: { in: { wood: 10, stone: 10, essence: 1 }, out: 1, need: ['combat', 2] },
  returnpot: { in: { hardwood: 1, fiber: 10, ecto: 1 }, out: 1, need: ['foraging', 3] },
  qsprinkler: { in: { iron_bar: 1, gold_bar: 1, quartz: 1 }, out: 1, need: ['farming', 6] },
};
/* ---------- кулинария (ингредиент 'any:fish' — любая рыба) ---------- */
const COOKING = {
  grilled_fish: { in: { 'any:fish': 1 }, known: true },
  fried_mush: { in: { 'any:mushroom': 2 }, known: true },
  spring_salad: { in: { dandelion: 1, leek: 1, horseradish: 1 } },
  mash: { in: { potato: 2 } },
  brain_soup: { in: { cauli: 1, garlic: 1 } },
  fish_pie: { in: { 'any:fish': 2, potato: 1 } },
  pumpkin_soup: { in: { pumpkin: 1 } },
  berry_pie: { in: { strawberry: 3 } },
  hell_soup: { in: { pepper: 1, tomato: 1 } },
  mandrake_omelet: { in: { mandrake: 1 } },
  eye_jelly: { in: { eyeberry: 3 } },
  borscht: { in: { beet: 1, potato: 1, garlic: 1 } },
};
const TV_RECIPES = ['spring_salad', 'mash', 'brain_soup', 'hell_soup', 'eye_jelly', 'pumpkin_soup', 'borscht', 'berry_pie', 'fish_pie', 'mandrake_omelet'];

/* ---------- магазины ---------- */
const SEED_SHOP = {
  0: ['parsnip_seed', 'garlic_seed', 'potato_seed', 'cauli_seed', 'strawberry_seed'],
  1: ['tomato_seed', 'eyeberry_seed', 'melon_seed', 'pepper_seed', 'sunflower_seed'],
  2: ['pumpkin_seed', 'eggplant_seed', 'cranberry_seed', 'beet_seed', 'sunflower_seed'],
  3: [],
};
const BUY_PRICE = {
  parsnip_seed: 20, garlic_seed: 40, potato_seed: 50, cauli_seed: 80, strawberry_seed: 150, tomato_seed: 50, eyeberry_seed: 80, melon_seed: 80,
  pepper_seed: 40, sunflower_seed: 200, pumpkin_seed: 100, eggplant_seed: 20, cranberry_seed: 240, beet_seed: 20, mandrake_seed: 300,
  fert: 100, qfert: 150, growpot: 100, bouquet: 200, beer: 100, pizza: 300, salad: 220, tea: 250, spaghetti: 240, coffee: 150,
  medkit: 200, pills: 400, jojacola: 150, clarity: 600, returnpot: 300, drinkme: 2500, eatme: 2000,
  copper_ore: 75, iron_ore: 150, coal: 150, gold_ore: 400, cleaver: 1500, iron_sword: 4000, broken: 500,
  pendant: 5000, bomb: 300, estus_shard: 3000, essence: 200, cat_smile: 8000, quartz: 100, torch: 30, wood: 10, stone: 10,
};
const UPGRADE_COST = [null, { g: 2000, bar: 'copper_bar' }, { g: 5000, bar: 'iron_bar' }, { g: 10000, bar: 'gold_bar' }];
const TIER_NAMES = ['Обычн.', 'Медн.', 'Железн.', 'Золот.'];

/* ---------- монстры ---------- */
const MON = {
  slime_g: { n: 'Зелёная жижа', spr: 'slime', v: 'g', hp: 24, dmg: 6, spd: 28, xp: 3, souls: 5, ai: 'hop', drops: [['slime', .8], ['copper_ore', .1]] },
  slime_b: { n: 'Синяя жижа', spr: 'slime', v: 'b', hp: 60, dmg: 12, spd: 34, xp: 6, souls: 12, ai: 'hop', drops: [['slime', .9], ['iron_ore', .1]] },
  slime_r: { n: 'Красная жижа', spr: 'slime', v: 'r', hp: 140, dmg: 22, spd: 40, xp: 12, souls: 24, ai: 'hop', drops: [['slime', 1], ['gold_ore', .08], ['ruby', .02]] },
  slime_p: { n: 'Жижа Бездны', spr: 'slime', v: 'p', hp: 260, dmg: 32, spd: 44, xp: 18, souls: 40, ai: 'hop', drops: [['slime', 1], ['essence', .2]] },
  bat_a: { n: 'Нетопырь-глаз', spr: 'bat', v: 'a', hp: 18, dmg: 6, spd: 55, xp: 4, souls: 6, ai: 'fly', drops: [['batwing', .5]] },
  bat_b: { n: 'Мокрый нетопырь', spr: 'bat', v: 'b', hp: 50, dmg: 14, spd: 62, xp: 8, souls: 14, ai: 'fly', drops: [['batwing', .6], ['eyeball', .05]] },
  bat_c: { n: 'Кровавый нетопырь', spr: 'bat', v: 'c', hp: 110, dmg: 24, spd: 70, xp: 14, souls: 26, ai: 'fly', drops: [['batwing', .6], ['ruby', .02]] },
  skeleton: { n: 'Скелет-фермер', spr: 'skeleton', hp: 55, dmg: 10, spd: 32, xp: 8, souls: 14, ai: 'thrower', proj: 'bone', drops: [['bone', .7], ['coal', .1]], h: 24 },
  ghost: { n: 'Призрак', spr: 'ghost', hp: 70, dmg: 12, sdmg: 5, spd: 34, xp: 12, souls: 18, ai: 'ghost', drops: [['ecto', .6]], h: 20 },
  eye: { n: 'Плавающий глаз', spr: 'eye', hp: 60, dmg: 12, spd: 26, xp: 10, souls: 16, ai: 'shooter', proj: 'tear', drops: [['eyeball', .5]] },
  eye_r: { n: 'Кровавый глаз', spr: 'eye', v: 'r', hp: 130, dmg: 22, spd: 30, xp: 16, souls: 30, ai: 'shooter', proj: 'tear', drops: [['eyeball', .6], ['ruby', .03]] },
  doll: { n: 'Кукла', spr: 'doll', hp: 90, dmg: 20, sdmg: 4, spd: 95, xp: 15, souls: 24, ai: 'angel', drops: [['mirrorshard', .2], ['essence', .1]], h: 24 },
  mushroom: { n: 'Грибник', spr: 'mushroom', hp: 40, dmg: 6, sdmg: 3, spd: 20, xp: 6, souls: 8, ai: 'spore', drops: [['amanita', .25], ['morel', .1]] },
  shadow: { n: 'Тень', spr: 'shadow', hp: 190, dmg: 28, sdmg: 3, spd: 48, xp: 22, souls: 40, ai: 'chase', drops: [['essence', .6], ['soulgem', .03]], w: 24, h: 32 },
  ink: { n: 'Чернильная клякса', spr: 'ink', hp: 120, dmg: 22, spd: 40, xp: 15, souls: 30, ai: 'hop', drops: [['ink', .5]] },
  crow: { n: 'Ворон', spr: 'crow', hp: 8, dmg: 2, spd: 70, xp: 1, souls: 1, ai: 'fly', drops: [] },
  shade: { n: '???', spr: 'shade', hp: 1, dmg: 0, sdmg: 8, spd: 30, xp: 0, souls: 0, ai: 'shade', drops: [], h: 40, halluc: true },
  // боссы
  kingslime: { n: 'Король Жиж', spr: 'kingslime', hp: 650, dmg: 18, spd: 30, xp: 120, souls: 400, ai: 'kingslime', boss: true, w: 48, h: 44, drops: [['crown_slime', 1]] },
  hatter: { n: 'Безумный Шляпник', spr: 'hatter', hp: 1500, dmg: 26, spd: 50, xp: 300, souls: 1200, ai: 'hatter', boss: true, w: 32, h: 48, drops: [['tophat', 1], ['hatpin', 1]] },
  author: { n: 'Мэри Сью, Автор', spr: 'author', hp: 3200, dmg: 30, sdmg: 6, spd: 46, xp: 800, souls: 5000, ai: 'author', boss: true, w: 32, h: 52, drops: [] },
};
const DUNGEON_SPAWNS = {
  cellar: [[5, 'slime_g'], [3, 'bat_a'], [1, 'mushroom']],
  cellar2: [[4, 'slime_g'], [3, 'bat_a'], [3, 'skeleton'], [1, 'mushroom']],
  flooded: [[3, 'slime_b'], [3, 'bat_b'], [3, 'ghost'], [2, 'eye'], [1, 'doll']],
  flesh: [[3, 'slime_r'], [2, 'bat_c'], [2, 'eye_r'], [2, 'doll'], [2, 'shadow']],
  library: [[1, 'ink']],
  abyss: [[3, 'slime_p'], [2, 'bat_c'], [2, 'shadow'], [2, 'doll'], [2, 'eye_r'], [1, 'ink']],
};
const GEODE_LOOT = [[20, 'quartz'], [12, 'clay'], [10, 'stoneeye'], [10, 'mirrorshard'], [8, 'obsidian'], [8, 'moonstone'], [7, 'ghostquartz'], [5, 'nightcrystal'], [6, 'amethyst'], [6, 'topaz'], [3, 'emerald'], [2, 'ruby'], [1, 'diamond'], [6, 'coal'], [5, 'iron_ore'], [5, 'gold_ore']];

/* ---------- навыки ---------- */
const SKILLS = { farming: 'Фермерство', mining: 'Шахтёрство', combat: 'Бой', fishing: 'Рыбалка', foraging: 'Собирательство' };
const XP_TABLE = [0, 100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000];
const SKILL_PERKS = {
  farming: 'Меньше энергии на мотыгу и лейку; выше шанс качественного урожая.',
  mining: 'Меньше энергии на кирку; больше руды из камней.',
  combat: '+5 к макс. здоровью за уровень; урон +3% за уровень.',
  fishing: 'Шире полоса ловли; меньше энергии на заброс.',
  foraging: 'Меньше энергии на топор; шанс двойной находки.',
};
