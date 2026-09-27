# 11. Архитектура кода

Главный принцип: **структурированность выше всего.**

## Жёсткие правила для всего кода

- **Максимум 150 строк на файл** (backend, frontend, тесты, конфиги).
  Больше: разбить файл на части по смыслу.
- **Общее: выносить.** Код, который нужен в 2+ местах, уходит в `shared/`
  (внутри приложения) или в `packages/` (между приложениями).
- Один файл = одна ответственность (один use case, один компонент, один роут).
- Имена файлов: `kebab-case`. Имена понятные, без сокращений.
- TypeScript `strict`. Без `any`.
- Проверка данных на границах (HTTP, бот, WebSocket): схемы `zod`.
- Правила проверяются автоматически: ESLint `max-lines: 150` (ошибка)
  и правила границ модулей. CI не пропускает нарушения.

## Монорепозиторий (pnpm workspaces)

Пакеты называются нейтрально: `@platform/*` (`22-multi-brand.md`).

```
apps/
  backend/            Cloudflare Worker: API, вебхуки 3 ботов, Durable Objects
  miniapp-passenger/  Mini App пассажира (React + Vite → Pages)
  miniapp-driver/     Mini App водителя
  miniapp-admin/      Mini App админа
  landing/            лендинг (в конце)
packages/
  contracts/          общие типы и zod-схемы API (backend ⇄ frontend)
  ui/                 обёртка над TelegramUI + Lucide (`19-design-system-and-ux.md`)
  api-client/         типизированный клиент API для Mini App
  i18n/               тексты на узбекском
  config/             общие tsconfig, eslint, prettier
brands/
  rida/               конфиг бренда (`22-multi-brand.md`)
```

## Backend: модульный монолит

Один Worker, внутри: независимые модули по бизнес-темам.

```
apps/backend/src/
  modules/
    users/  drivers/  moderation/  trips/  ride-requests/
    bookings/  chat/  calls/  pricing/  locations/  media/  notifications/
  bots/
    passenger/  driver/  admin/    тонкий слой: команды → use cases
  shared/
    db/  auth/  errors/  http/  telegram/
  index.ts                         точка входа Worker
```

### Слои внутри модуля

```
modules/trips/
  domain/          сущности и бизнес-правила, без внешних зависимостей
  application/     use cases (один файл = один сценарий)
  infrastructure/  репозитории D1, R2, внешние API
  http/            роуты Hono
  index.ts         публичный API модуля
```

- Зависимости только внутрь: `http`/`infrastructure` → `application` → `domain`.
- `domain` не знает о D1, Hono, Telegram.
- Модули общаются только через `index.ts` другого модуля.
  Глубокие импорты в чужой модуль запрещены.
- Боты не содержат бизнес-логики: только разбор команды и вызов use case.

## Frontend: Feature-Sliced Design (FSD)

Каждый Mini App устроен одинаково:

```
src/
  app/        запуск, провайдеры, роутер, тема Telegram
  pages/      экраны
  widgets/    крупные блоки экрана (список поездок, карточка брони)
  features/   действия пользователя (забронировать, отправить сообщение)
  entities/   бизнес-сущности (trip, user, booking) и их отображение
  shared/     утилиты и мелкие компоненты этого приложения
```

- Импорт только сверху вниз: `pages` → `widgets` → `features` → `entities` → `shared`.
- Общее для 2+ Mini App: в `packages/ui`, `packages/api-client`, `packages/i18n`.
- UI-библиотеки и иконки: только через `packages/ui`, прямой импорт запрещён.
- Компонент > 150 строк: делить на подкомпоненты и хуки.

## Тесты

- Vitest. Тест лежит рядом с кодом: `create-trip.ts` → `create-trip.test.ts`.
- В первую очередь: тесты `domain` и `application`.
