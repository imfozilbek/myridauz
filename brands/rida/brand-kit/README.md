# Бренд-пакет Rida: генератор

Собирает весь бренд-пакет из одного источника: логотипы, Telegram (боты,
экран загрузки, 13 каналов), сайт, соцсети, печать, моушн-видео, слои для
моушн-дизайнера. Правила и список файлов: `docs/38-brand-kit.md`.

## Как собрать

1. `npm install` в этой папке (opentype.js, playwright).
2. Нужны Chromium и ffmpeg с libx264.
3. Запуск:

```text
FFMPEG=/путь/к/ffmpeg CHROMIUM=/путь/к/chromium npm run build
```

Результат: папка `kit/` (в `.gitignore`). Архив: `cd kit && zip -r ../rida-brand-kit.zip .`

## Что где

| Файл | Что делает |
|---|---|
| `lib/text.mjs` | Текст в контуры (Rubik), буква «R» по центру |
| `lib/palette.mjs` | Цвета бренда и 6 сочетаний логотипа |
| `lib/brand.mjs` | Логотип, номер «код \| R», боты, экран загрузки, превью ссылки |
| `lib/channels.mjs` | Аватары и картинки 13 каналов |
| `lib/social.mjs` | Посты, сторис, наклейка, QR-плакат, анимация «Yangi safar» |
| `lib/motion.mjs` | Появление логотипа, смена кодов регионов, моушн-токены |
| `build.mjs` | Собирает всё в `kit/` |
| `data/regions.json` | 13 каналов: код региона, названия, ссылки |
| `data/qr.json` | Матрица QR для https://myrida.uz (python qrcode, уровень H) |
| `fonts/` | Rubik 500, 600, 800 и лицензия OFL |

## Важно

- В Rubik нет знака ʻ (U+02BB). `lib/text.mjs` рисует его знаком ‘ из Rubik.
- Цвета пока в `lib/palette.mjs`. В цели G02 они переедут в
  `brands/rida/theme.ts` (правило: HEX только там).
