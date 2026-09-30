# 59. Лендинг myrida.uz (G15)

> **Кратко:** Одна простая страница на узбекском и три документа. Страницы собираются в чистый HTML при сборке, JavaScript в браузере нет. Имя, слоган, цвета, боты и домен берутся из `brands/<brand>/`. Сделано в G15 (30.09.2026).

## Что на странице

| Блок | Что там |
|---|---|
| Шапка | Логотип и имя бренда |
| Первый экран | Слоган, заголовок, 2 кнопки: «Safar topish» (бот попутчиков), «Haydovchi boʻlish» (бот водителей) |
| «{brand} nima» | Birga safar, xarajat boʻlinadi, taksi emas |
| «Qanday ishlaydi» | 3 шага для попутчика, 3 шага для водителя |
| «Xavfsizlik» | Проверка водителей, «Mashinada ayol bor», скрытый номер, жалобы и блокировка |
| Низ | Слоган и 2 кнопки ещё раз |
| Подвал | 3 документа, контакт: админ-бот, © год и бренд |

- Документы: `/offer/`, `/privacy/`, `/consent/`. Тот же текст и та же версия, что в Mini App (`58`).
- Тексты: `packages/i18n/locales/uz-Latn/landing.json`. Документы: `legal.json`.
- Иконки: Lucide (`lucide-static`), всегда рядом с подписью (`19`). Одно значение, одна иконка, как в Mini App.

## Как устроено

| Часть | Где |
|---|---|
| Код | `apps/landing/src/` (`home.ts`, `document.ts`, `page.ts`, `styles.ts`) |
| Сборка | `vite build` собирает `prerender.ts`, он пишет HTML в `apps/landing/dist` |
| Картинки бренда | `brands/<brand>/landing/`: favicon, иконка iPhone, превью ссылки 1200 × 630 (из бренд-пакета, `38`) |
| Общий код документов | `packages/i18n/src/legal.ts`: разделы, значения из бренда, версия |
| Деплой | `scripts/deploy.mjs`: Pages `<brand>-landing`, домены `<domain>` и `www.<domain>` |

- CSS внутри страницы: один запрос, главная страница около 12 КБ.
- Только светлая тема (`color-scheme: light`), телефон в первую очередь, на компьютере в 2 и 3 колонки.

## Аналитика

- Cloudflare Web Analytics включена для всей зоны `myrida.uz` с автоустановкой:
  Cloudflare сам добавляет свой скрипт на страницы. В коде ключа нет.
- Смотреть: Cloudflare → Analytics & Logs → Web Analytics → `myrida.uz`.
- Личных данных нет, cookie нет.

## Проверки

- `apps/landing/src/site.test.ts`: страницы, ссылки в ботов, бренд из конфига, без меток `{…}`.
- `e2e/landing.spec.ts`: кнопки ведут в ботов, документ открывается и ведёт назад.
- `e2e/landing-screenshots.spec.ts`: скриншоты телефона и компьютера для владельца (`33`).
