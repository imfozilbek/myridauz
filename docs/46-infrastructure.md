# 46. Инфраструктура: ресурсы, домены, секреты

> **Кратко:** Rida работает в одном аккаунте Cloudflare: Worker `api.myrida.uz`, база D1, приватный R2, Analytics Engine, 3 Mini App на Pages. Секреты только в Cloudflare и в Environment `production`. Сделано в G03 (28.09.2026).

## Адреса

| Адрес | Что там | Где |
|---|---|---|
| `api.myrida.uz` | Backend: API, вебхуки ботов, `/health` | Worker `rida-backend` |
| `passenger.myrida.uz` | Mini App попутчика | Pages `rida-passenger` |
| `driver.myrida.uz` | Mini App водителя | Pages `rida-driver` |
| `admin.myrida.uz` | Mini App админа | Pages `rida-admin` |

- Адреса строятся из домена бренда: `brands/hosts.ts` (`22`).
- `myrida.uz` зарегистрирован в Eskiz, DNS в Cloudflare (OPS-01).

## Ресурсы Cloudflare

| Ресурс | Имя | Привязка в Worker |
|---|---|---|
| D1 | `rida-db` (Западная Европа) | `DB` |
| R2 | `rida-media`, приватный | `MEDIA` |
| Analytics Engine | `rida_analytics` | `ANALYTICS` |
| Workers Logs | включены | `observability` |

- Настройки: `brands/rida/wrangler.toml`. Миграции: `apps/backend/migrations`
  (таблицы `users`, `blocked_phones` с G04, `47`).
- Фото людей в R2: `avatars/<id>/<uuid>`, отдаёт только API (`47`).
- Queues, Durable Objects, Cron появятся в целях, где они нужны (`03`).
- Резервные копии D1: Time Travel 7 дней на бесплатном тарифе (`03`).

## Боты

| Бот | Вебхук | Кнопка меню |
|---|---|---|
| `@myrida_bot` | `api.myrida.uz/telegram/passenger` | «Ochish» → `passenger.myrida.uz` |
| `@myrida_haydovchi_bot` | `api.myrida.uz/telegram/driver` | «Ochish» → `driver.myrida.uz` |
| `@myrida_admin_bot` | `api.myrida.uz/telegram/admin` | нет: кнопка только в ответе команде |

- Вебхук принимает только запросы с `secret_token` (заголовок Telegram).
- Админ-бот открывает Mini App только людям из `ADMIN_TELEGRAM_IDS`.

## Где лежат секреты

| Секрет | Где | Кто видит |
|---|---|---|
| Токены 3 ботов, `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_TELEGRAM_IDS` | Секреты Worker (`wrangler secret`) | Только Worker |
| `CLOUDFLARE_API_TOKEN` (деплой), `CLOUDFLARE_ACCOUNT_ID` | GitHub Environment `production` | Только job `deploy` на `main` |
| Токен Claude и ключи для настройки | Переменные окружения сессии Claude | Только Claude |

- В репозитории и в CI для PR секретов нет (`32`).

## Деплой

- `pnpm run deploy --brand=rida`: одна команда на бренд (`45`).
- CI: job `deploy` только на `main`, после всех барьеров, с подтверждением владельца.
- Одобрить с телефона: приложение GitHub Mobile → вкладка **Inbox** (уведомления) →
  запрос на проверку деплоя → **Approve**. На странице самого запуска кнопки нет,
  только **Cancel workflow**. Пуш о запросе: в настройках приложения включить
  уведомления о проверке деплоев (Deployment reviews).
- После смены настроек ботов: `pnpm run setup-bots --brand=rida`.
