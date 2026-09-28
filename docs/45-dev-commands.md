# 45. Команды разработки и барьеры в CI

> **Кратко:** Одна команда `pnpm check` запускает все барьеры локально. В CI те же барьеры идут отдельными задачами, без секретов. Здесь: команды, что проверяет каждый барьер и где он настроен. Сделано в G01 (28.09.2026).

## Команды

| Команда | Что делает |
|---|---|
| `pnpm install` | Ставит зависимости всех пакетов (pnpm workspaces) |
| `pnpm check` | Все барьеры подряд: формат, линтер, типы, knip, тесты с покрытием, тире, секреты |
| `pnpm format` | Исправляет формат (Prettier) |
| `pnpm test` | Тесты Vitest без покрытия |
| `pnpm e2e` | Smoke тест трёх Mini App в Chromium с подменой Telegram |
| `pnpm screenshots` | Скриншоты экранов в `screenshots/` (для владельца, `33`) |
| `pnpm --filter @platform/brand-kit-rida build` | Бренд-пакет в `brands/rida/brand-kit/kit/` (нужны `FFMPEG`, Chromium, `38`) |
| `pnpm --filter @platform/miniapp-passenger dev` | Mini App попутчика локально |

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
| E2E | Playwright | Mini App в Telegram не открылся, главная кнопка не бирюзовая, шапка и нижняя панель не белые, аналитика не дошла | `playwright.config.ts`, `e2e/` |
| Бренд-пакет | CI | Генератор `brands/rida/brand-kit` не собирается | `.github/workflows/ci.yml` |
| Безопасность | CodeQL | Уязвимости в коде и в workflow | `.github/workflows/codeql.yml` |
| Зависимости | Dependabot | Устаревшие и уязвимые пакеты и actions | `.github/dependabot.yml` |

- Имя бренда для проверок: имена папок в `brands/`. Новый бренд проверяется сам.
- Тире в кавычках-ёлочках разрешено: так записано само правило (`CLAUDE.md`).

## Как устроен CI

- `pull_request` и `push` в `main` и `goal/**`. Права: только `contents: read`.
- Секретов нет, `pull_request_target` нет, `persist-credentials: false` (`32`).
- Каждое action закреплено по SHA коммита, версия в комментарии.
- gitleaks скачивается файлом и проверяется по SHA-256, чужой код не запускается.
- Общая подготовка (Node 22, pnpm, `install --frozen-lockfile`):
  `.github/actions/setup`.
- Задачи CI: 6 барьеров параллельно, `e2e` (со скриншотами как артефакт),
  `brand-kit` (архив как артефакт), `secrets`. CodeQL: отдельный workflow и раз в неделю.

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
