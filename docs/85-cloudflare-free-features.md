# 85. Бесплатные возможности Cloudflare, которые Rida не использует

> **Кратко:** исследование 01.10.2026 по просьбе владельца. Больше всего пользы на единицу усилия: Smart Placement, `maxAge` для предзапросов CORS, карта из публичного R2 через кэш, лимит частоты по Telegram id, копии D1 в R2. Всё бесплатно и не нарушает правил проекта. Делается только после согласия владельца (`33`): публичный бакет и почтовый адрес считаются публичными.

## Что Rida использует сейчас

| Используется | Где |
|---|---|
| Workers (Hono), домен API, Cron каждые 15 минут | API, вебхуки 3 ботов, фоновые задачи |
| D1 (Западная Европа), Time Travel 7 дней | все данные, поиск мест FTS5 |
| R2 приватный | аватары, карта и шрифты отдаёт Worker |
| Cache API | только части карты |
| Durable Objects SQLite: `ChatRoom`, `UserFeed` | чат, сигналы звонка, живые экраны |
| Queues, Analytics Engine, Workers Logs | сообщения ботов, аналитика, логи |
| Realtime SFU и TURN | звонки |
| Pages, DNS, Web Analytics только на лендинге | Mini App и лендинг |

## Находка: предзапросы CORS

- Mini App и API на разных адресах. Подпись Telegram идёт в своём заголовке, поэтому браузер перед каждым новым адресом шлёт `OPTIONS`.
- В `cors()` (`apps/backend/src/app.ts`) нет `maxAge`: Chrome помнит ответ 5 секунд.
- Значит, оценка ~89 000 запросов в день (`61`) может быть занижена, до двух раз. Проверить по Workers Metrics (метод OPTIONS).
- Быстрое средство: `maxAge: 7200`. Полное: Mini App и API на одном адресе.

## Подходит Rida

| Возможность | Польза | Бесплатный лимит | Усилие | Риск |
|---|---|---|---|---|
| Smart Placement | Worker ближе к D1: каждый ответ API быстрее | бесплатно | S, одна строка | сравнить время ответа до и после |
| Карта из публичного R2 + Cache Rule | минус ~22% запросов Worker, карта быстрее | R2 10 млн чтений в месяц | M | отдельный бакет только с картой OSM; публичный ресурс |
| Binding Rate Limiting по Telegram id | защита брони, чата, жалоб, поиска от спама | бесплатно с 19.09.2025 | S/M | не по IP: у операторов много людей за одним IP; числа в `brands/` |
| Копии D1 в R2 по расписанию | данные людей хранятся дольше 7 дней | R2 10 ГБ | S/M | токен только в Environment `production` (`32`); бакет приватный |
| Web Analytics на Mini App | скорость открытия на реальных телефонах | бесплатно | S | упомянуть в политике (`30`) |
| Email Routing | `support@` для оферты и удаления данных | бесплатно | S | MX в DNS; публичный адрес |
| D1 read replication | чтение ближе к Узбекистану | без доплаты | M | после Smart Placement и замера |
| Queues `delaySeconds` | напоминание точно в срок, не в окне 15 минут | входит в Queues | S | тратит операции Queues |
| Workers AI | позже: лицо на фото водителя, скрытые контакты в чате | 10 000 нейронов в день | M | узбекский слабый; риск биометрии (`30`) |

## Бесплатно, но не нужно

| Возможность | Почему нет |
|---|---|
| KV | 1 000 записей в день; хватает кэша и D1 |
| Workflows | Cron и будильники DO уже решают задачу |
| Turnstile | подпись Telegram уже доказывает, что это человек |
| Zero Trust для админки | админка внутри Telegram; вход по почте в WebView неудобен |
| Bot Fight Mode | может блокировать вебхуки Telegram: не включать |
| Правило WAF Rate Limiting | только по IP; хуже binding |
| Images, Vectorize, AI Gateway, Browser Rendering | нет задачи |
| Email Workers, Zaraz, Page Shield, Hyperdrive | не наш случай |
| Tail Workers, Logpush, Containers, Pipelines | только платный тариф или бета |

## Порядок, если владелец согласен

1. Замер OPTIONS в Workers Metrics, затем `maxAge` в `cors()`.
2. Smart Placement и замер времени ответа.
3. Лимит частоты по Telegram id.
4. Копии D1 в R2.
5. Карта из публичного R2.

Источники: developers.cloudflare.com (Workers limits, Static Assets, R2 pricing и public buckets, Placement, Rate Limiting binding и changelog 2025-09-19, D1 read replication, Workflows, Workers AI, KV, Images, Workers Logs).
