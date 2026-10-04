# 45. Команды разработки и барьеры в CI

> **Кратко:** Одна команда `pnpm check` запускает все барьеры локально. В CI те же барьеры идут отдельными задачами, без секретов. Здесь: команды, что проверяет каждый барьер и где он настроен. Сделано в G01 (28.09.2026).

## Команды

| Команда | Что делает |
|---|---|
| `pnpm install` | Ставит зависимости всех пакетов (pnpm workspaces) |
| `pnpm check` | Все барьеры подряд: формат, линтер, типы, knip, тесты с покрытием, тире, секреты |
| `pnpm format` | Исправляет формат (Prettier) |
| `pnpm test` | Тесты Vitest без покрытия |
| `pnpm vitest run -u apps/backend/src/modules/locations/seed.test.ts` | Пересобрать SQL справочника мест из seed (`48`) |
| `pnpm e2e` | Smoke тест трёх Mini App в Chromium с подменой Telegram |
| `pnpm screenshots` | Скриншоты экранов в `screenshots/` (для владельца, `33`) |
| `pnpm stand` | Вся Rida локально: backend, база, карта, три Mini App (`75`) |
| `pnpm stand:check` | Сценарии целей на чистом стенде, скриншоты в `screenshots/stand/` (`75`) |
| `pnpm --filter @platform/brand-kit-rida build` | Бренд-пакет в `brands/rida/brand-kit/kit/` (нужны `FFMPEG`, Chromium, `38`) |
| `pnpm --filter @platform/miniapp-passenger dev` | Mini App попутчика локально |
| `pnpm --filter @platform/landing build` | Лендинг в `apps/landing/dist` (`59`) |
| `pnpm run deploy --brand=rida` | Деплой бренда: сборка Mini App, миграции D1, Worker, 3 проекта Pages с доменами и лендинг. В CI: job `deploy` |
| `pnpm run setup-bots --brand=rida` | Вебхуки и кнопки меню 3 ботов. Один раз после первого деплоя и при смене настроек ботов. Нужен `TELEGRAM_WEBHOOK_SECRET` |

- Для `check:secrets` локально нужен файл `gitleaks` (v8.30.1) в `PATH`.
- В облачной сессии Claude: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`.

## Барьеры

| Барьер | Инструмент | Что ловит | Где настроен |
|---|---|---|---|
| Формат | Prettier | Разный стиль кода | `packages/config/prettier.config.js` |
| Линтер | ESLint | Файл больше 150 строк, `any`, HEX вне `brands/<brand>/theme.ts`, имя бренда в коде, импорт вверх по слоям FSD и backend, глубокий импорт в чужой модуль, TelegramUI и Lucide вне `packages/ui`, слова для людей в коде Mini App и `ui` (только `t(key)`) | `packages/config/eslint.config.js` |
| Типы | `tsc` | Ошибки типов, неиспользуемые переменные и параметры | `packages/config/tsconfig.base.json` |
| Мёртвый код | knip | Неиспользуемые файлы, экспорты, зависимости | `knip.json` |
| Тесты | Vitest | Логика; покрытие: `domain` и `application` 90%, остальное 70% | `vitest.config.ts` |
| Текст | `scripts/check-text.mjs` | Длинные тире везде; имя бренда в html, json и css внутри `apps/` и `packages/` | `scripts/text-rules.mjs` |
| Секреты | gitleaks | Ключи во всей истории git | `.github/workflows/ci.yml` |
| Уязвимости | `pnpm audit` | Зависимость с известной уязвимостью (уровень moderate и выше) | `package.json` |
| E2E | Playwright | Mini App в Telegram не открылся, главная кнопка не бирюзовая, шапка и нижняя панель не белые, аналитика не дошла | `playwright.config.ts`, `e2e/` |
| Бренд-пакет | CI | Генератор `brands/rida/brand-kit` не собирается | `.github/workflows/ci.yml` |
| Безопасность | CodeQL | Уязвимости в коде и в workflow | `.github/workflows/codeql.yml` |
| Зависимости | Dependabot | Устаревшие и уязвимые пакеты и actions | `.github/dependabot.yml` |

- Имя бренда для проверок: имена папок в `brands/`, кроме скрытых (`.tsc`). Новый бренд проверяется сам.
- Тире в кавычках-ёлочках разрешено: так записано само правило (`CLAUDE.md`).

## Как устроен CI (цель владельца 03.10.2026: не дольше минуты)

- `pull_request` и `push` в `main`: один прогон на изменение. Права: только `contents: read`.
- Секретов нет, `pull_request_target` нет, `persist-credentials: false` (`32`).
- Каждое action закреплено по SHA коммита, версия в комментарии.
- gitleaks скачивается файлом и проверяется по SHA-256, чужой код не запускается.
- Подготовка `.github/actions/setup`: Node 22, pnpm, `node_modules` из кэша по `pnpm-lock.yaml`.
  Chromium для e2e из кэша: `.github/actions/browser`.
- GitHub даёт 20 задач одновременно на аккаунт; прогон занимает 19, вместе с CodeQL 20.

| Задача | Что делает |
|---|---|
| `test (1/10)` … `(10/10)` | Юнит-тесты частями, каждый файл изолирован, отчёт и покрытие blob |
| `CI ok` | Единственная обязательная проверка `main` (`34`). Стартует вместе с частями, проверяет покрытие `31` по всем тестам, потом ждёт зелёными остальные барьеры |
| `e2e (map 1/2)`, `(map 2/2)`, `(rest 1/2)`, `(rest 2/2)` | e2e карты в 2 задачах, остальные файлы в 2; 4 телефона в каждой |
| `typecheck` | `tsc --incremental`, результат прошлого прогона из кэша (`.tsc/`) |
| `checks` | `format:check`, `lint`, `knip`, `check:text`, `audit` одновременно на одном раннере |
| `secrets`, `brand-kit` | gitleaks; бренд-пакет собирается, только если менялись `brands/` или lock |
| `screenshots (1/2)`, `(2/2)` | После барьеров, артефакт для людей; не барьер |

- `deploy` ждёт `CI ok`. Запускается, только если поменялся прод (`changes`, `46`).
- Новая задача-барьер: добавить её имя в шаг «Wait for the other gates» задачи `CI ok` (`GATES`), иначе она не держит слияние.

## Надёжность сервера (G42)

- Ошибка любого маршрута отвечает `{error}` с кодом (`shared/http/errors.ts`), ошибка пишется в лог и на дашборд.
- Лимиты запросов: `shared/http/rate-limit.ts`, привязки `ACTIONS_LIMIT`, `SEARCH_LIMIT`, `ANALYTICS_LIMIT` в `wrangler.toml` бренда; без привязки (тесты) лимита нет.
- Cron: `cron-jobs.ts`, каждая задача пишет `cron_job` или `cron_failed` в лог Worker (Observability).
- Загрузки читаются не больше лимита: `shared/upload/read-capped.ts`.

## Каркас (что создано в G01)

| Где | Что |
|---|---|
| `packages/config` | Общие tsconfig, ESLint, Prettier, Vite |
| `packages/contracts` | Схема `health` на zod |
| `packages/api-client` | Клиент API, ошибки с кодом (`ApiError`) |
| `packages/i18n` | `t()` и `uz-Latn/common.json` |
| `packages/ui` | `AppShell` (TelegramUI, светлая тема), `StartScreen`, `mountApp`, иконки Lucide |
| `brands` | `@platform/brands`: `loadBrand()`, `rida/brand.config.ts`, `rida/theme.ts` |
| `apps/backend` | Hono Worker, модуль `health` во всех 4 слоях, контрактный тест |
| `apps/miniapp-*` | 3 Mini App в FSD, стартовый экран в каждом |
| `e2e` | Подмена Telegram, smoke тест, скриншоты |

- Бренд выбирается при сборке: `VITE_BRAND=<id>`; без него основной бренд (`22`).

## Подмена Telegram в e2e (G02)

- `e2e/telegram-mock.ts`: маленький клиент Telegram. Даёт параметры запуска в URL,
  отвечает на запросы SDK, рисует главную кнопку и запоминает события (цвет шапки,
  нижней панели). Так тесты и скриншоты видят то, что видит человек в Telegram.
  Платформа по умолчанию iOS; главный экран снимается дважды: Android 360 px и iOS (урок №52).

## Проверка барьеров (G01, 28.09.2026)

Коммит с намеренными нарушениями уронил CI (запуск 2), затем откат вернул зелёный.

| Нарушение | Кто поймал |
|---|---|
| Файл 151 строка | ESLint `max-lines`, knip (лишний файл), покрытие ниже порога |
| `any` | ESLint, `tsc` |
| HEX в `packages/ui` | ESLint |
| Имя бренда в `packages/i18n` | ESLint |
| Неиспользуемый экспорт | knip |
| Длинное тире в комментарии | `check:text` |
| Импорт Lucide в Mini App, импорт вверх по FSD, `hono` в `domain` | ESLint |
