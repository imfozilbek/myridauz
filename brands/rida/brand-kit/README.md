# Бренд-пакет Rida: генератор

Собирает весь бренд-пакет из одного источника: логотипы, Telegram (боты,
экран загрузки, 13 каналов), сайт, соцсети, печать, моушн-видео, слои для
моушн-дизайнера. Правила и список файлов: `docs/38-brand-kit.md`.
Отдельно собирает рекламный ролик 9:16 под музыку (`docs/41-promo-video.md`).

## Как собрать

1. `pnpm install` в корне репозитория (пакет входит в монорепо).
2. Нужны Chromium и ffmpeg с libx264.
3. Запуск:

```text
FFMPEG=/путь/к/ffmpeg CHROMIUM=/путь/к/chromium pnpm build
```

Результат: папка `kit/` (131 файл, в `.gitignore`), без ручных шагов. Архив: `cd kit && zip -r ../rida-brand-kit.zip .`

Рекламный ролик (музыка по лицензии, в репозиторий не кладём):

```text
FFMPEG=… CHROMIUM=… MUSIC=/путь/к/треку.mp3 pnpm promo
FFMPEG=… CHROMIUM=… pnpm promo --preview 1.5,30,100
```

Результат: `kit/promo/rida-promo-1080x1920.mp4`. Режим `--preview` сохраняет кадры PNG.

Флаеры направлений 99 × 210 мм: `CHROMIUM=… pnpm flyer`. Пишет в `kit/print/` PDF
из двух страниц для типографии (вылеты 3 мм), PNG 300 dpi каждой стороны и листы для
резки: один флаер ровно 99 × 210 мм, A4 с 3 флаерами в ряд, A3 с 6 (3 × 2); страница 1
попутчик, страница 2 водитель. Размер страниц точный: Chromium округляет его, `pdf-lib` ставит обратно. Направления
и ссылки QR: `data/flyers.json`. Экраны шагов снимает стенд:
`pnpm stand:check e2e/stand/flyer-shots.spec.ts --shots` пишет их в `data/flyer-screens/<направление>/`.

Картинки для Telegram Ads 16:9: `CHROMIUM=… pnpm ads`. Пишет в `kit/ads/` 6 PNG 1920 × 1080
(3 для бота попутчика, 3 для бота водителя) на экранах и маршруте первого флаера.

Картинки ботов (G34): `CHROMIUM=… pnpm bot`. Пишет в `brands/rida/landing/bot/`
картинку приветствия бота водителя и 4 аватара ботов (JPG 640). Файлы
в репозитории; сайт отдаёт их по адресу `https://<домен>/bot/…`, оттуда
их берут бот (`sendPhoto`) и настройка ботов (`setMyProfilePhoto`).

## Что где

| Файл | Что делает |
|---|---|
| `lib/text.mjs` | Текст в контуры (Rubik, Roboto), буква «R» по центру |
| `lib/palette.mjs` | Цвета из `brands/rida/theme.ts` и 6 сочетаний логотипа |
| `lib/brand.mjs` | Логотип, номер «код \| R», боты, экран загрузки, превью ссылки |
| `lib/channels.mjs` | Аватары и картинки 13 каналов |
| `lib/social.mjs` | Посты, сторис, наклейка, QR-плакат, анимация «Yangi safar» |
| `lib/motion.mjs` | Появление логотипа, смена кодов регионов, моушн-токены |
| `lib/ease.mjs` | Плавность анимации: общие функции для видео и сторис |
| `lib/extras.mjs` | CSS токенов и favicon.ico (без рендера) |
| `build.mjs` | Собирает всё в `kit/` |
| `data/regions.json` | 13 каналов: код региона, названия, ссылки |
| `lib/flyer.mjs`, `flyer.mjs` | Флаер направления: сторона попутчика и сторона водителя, PDF и PNG |
| `data/flyers.json` | Флаеры: направление и ссылки QR (ссылки для рекламы, `docs/184`) |
| `lib/ads.mjs`, `ads.mjs` | Картинки для Telegram Ads 16:9 |
| `lib/phone.mjs`, `lib/route-card.mjs` | Экран Mini App в телефоне и карточка маршрута: общие для флаера и рекламы |
| `data/flyer-screens/` | Экраны шагов флаера с локальной Rida (стенд, `docs/75`) |
| `data/qr.json` | Матрица QR для https://myrida.uz (python qrcode, уровень H) |
| `data/tokens.json` | Для чего каждый цвет и моушн-токены. Значения цветов: только `brands/rida/theme.ts` |
| `data/kit-readme.txt` | README.txt внутри архива |
| `fonts/rubik/` | Rubik 500, 600, 800 и лицензия OFL (идёт в архив) |
| `fonts/roboto/` | Roboto 400, 500, 700 и лицензия OFL (экраны Telegram в ролике) |
| `data/uzbekistan.json` | Карта: 14 регионов и их центры (Natural Earth, общественное достояние) |
| `tools/map-data.mjs` | Делает `data/uzbekistan.json` из файла Natural Earth |
| `promo/build.mjs` | Кадры ролика в Chromium, видео и музыка через ffmpeg |
| `promo/timeline.mjs` | Карта музыки и порядок сцен |
| `promo/copy.json` | Все узбекские тексты ролика (проверяет носитель) |
| `promo/kit.mjs`, `promo/icons.mjs` | Общие части ролика: время, заголовки, иконки Lucide |
| `promo/phone.mjs`, `promo/ui.mjs` | Телефон с Telegram и элементы экранов |
| `promo/world.mjs`, `promo/car.mjs` | Небо, горы, дороги, свет; машина с людьми |
| `promo/type.mjs`, `promo/fx.mjs` | Слова по одному; вспышки, кольца, блики, лучи |
| `promo/people.mjs` | Толпа людей, которая складывается в букву R |
| `promo/screens/` | Экраны: поиск, поездки, бронь, чат, публикация, заявки, список чатов |
| `promo/scenes/` | Сцены ролика по порядку музыки |

## Важно

- В Rubik и Roboto нет знака ʻ (U+02BB) и стрелки «→». `lib/text.mjs` рисует ʻ знаком ‘,
  а стрелку своим контуром.
- Все цвета, и бренда, и вспомогательные для иллюстраций, берутся из `brands/rida/theme.ts`.
  HEX живут только там (ESLint проверяет и этот пакет).
- CI собирает пакет на каждый PR и в `main`: архив лежит в артефакте `brand-kit` (`docs/45`).
- Цифры в картинках берём из документов: цены `docs/16`, бонус `docs/12`.
