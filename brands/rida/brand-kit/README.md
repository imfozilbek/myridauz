# Бренд-пакет Rida: генератор

Собирает весь бренд-пакет из одного источника: логотипы, Telegram (боты,
экран загрузки, 13 каналов), сайт, соцсети, печать, моушн-видео, слои для
моушн-дизайнера. Правила и список файлов: `docs/38-brand-kit.md`.
Отдельно собирает рекламный ролик 9:16 под музыку (`docs/41-promo-video.md`).

## Как собрать

1. `npm install` в этой папке (opentype.js, playwright, lucide-static).
2. Нужны Chromium и ffmpeg с libx264.
3. Запуск:

```text
FFMPEG=/путь/к/ffmpeg CHROMIUM=/путь/к/chromium npm run build
```

Результат: папка `kit/` (131 файл, в `.gitignore`), без ручных шагов. Архив: `cd kit && zip -r ../rida-brand-kit.zip .`

Рекламный ролик (музыка по лицензии, в репозиторий не кладём):

```text
FFMPEG=… CHROMIUM=… MUSIC=/путь/к/треку.mp3 npm run promo
FFMPEG=… CHROMIUM=… npm run promo -- --preview 1.5,30,100
```

Результат: `kit/promo/rida-promo-1080x1920.mp4`. Режим `--preview` сохраняет кадры PNG.

## Что где

| Файл | Что делает |
|---|---|
| `lib/text.mjs` | Текст в контуры (Rubik, Roboto), буква «R» по центру |
| `lib/palette.mjs` | Цвета бренда и 6 сочетаний логотипа |
| `lib/brand.mjs` | Логотип, номер «код \| R», боты, экран загрузки, превью ссылки |
| `lib/channels.mjs` | Аватары и картинки 13 каналов |
| `lib/social.mjs` | Посты, сторис, наклейка, QR-плакат, анимация «Yangi safar» |
| `lib/motion.mjs` | Появление логотипа, смена кодов регионов, моушн-токены |
| `lib/ease.mjs` | Плавность анимации: общие функции для видео и сторис |
| `lib/extras.mjs` | CSS токенов и favicon.ico (без рендера) |
| `build.mjs` | Собирает всё в `kit/` |
| `data/regions.json` | 13 каналов: код региона, названия, ссылки |
| `data/qr.json` | Матрица QR для https://myrida.uz (python qrcode, уровень H) |
| `data/tokens.json` | Цвета и моушн-токены: копия таблицы из `docs/20` |
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
- Цвета берутся из `data/tokens.json` (копия таблицы `docs/20`, меняем вместе).
  В цели G02 они переедут в `brands/rida/theme.ts` (правило: HEX только там).
- Цифры в картинках берём из документов: цены `docs/16`, бонус `docs/12`.
