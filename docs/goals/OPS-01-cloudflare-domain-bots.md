# OPS-01. Cloudflare, домен, боты (делает владелец)

> **Кратко:** Операционная цель для владельца. Без неё Claude не может деплоить. Нужна к концу недели 1.

```text
OPS-01 (владелец): Cloudflare, домен, боты

1. Создать аккаунт Cloudflare, бесплатный тариф, без карты.
2. Добавить сайт myrida.uz в Cloudflare (Free plan).
   Cloudflare покажет 2 NS-сервера.
3. В панели Eskiz у домена myrida.uz заменить NS на серверы Cloudflare.
   Домен остаётся зарегистрирован в Eskiz.
4. В BotFather создать 3 бота: пассажиров, водителей, админ.
5. Создать токен API Cloudflare (My Profile → API Tokens → Custom):
   на аккаунт: Workers Scripts, Workers KV, Workers R2, D1, Pages,
   Queues, Realtime, чтение аналитики и настроек;
   на зону myrida.uz: DNS, Workers Routes, чтение зоны.
6. Передать Claude: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID,
   PASSENGER_BOT_TOKEN, DRIVER_BOT_TOKEN, ADMIN_BOT_TOKEN,
   а также username трёх ботов и свой Telegram ID (админ).
   Лучше через переменные окружения сессии; можно в чате
   (решение владельца, docs/32).

Definition of Done:
[ ] Cloudflare показывает зону myrida.uz как Active.
[ ] Claude подтвердил, что токен работает (запрос к API успешен).
[ ] Все 3 бота отвечают на запрос getMe от Claude.
```

## Результат (28.09.2026)

| Что | Итог |
|---|---|
| Зона `myrida.uz` | Active в Cloudflare, NS `jill` и `razvan.ns.cloudflare.com`, DNSSEC выключен |
| Токен API | `rida-claude`, действует до 31.01.2027, права по списку выше |
| Бот попутчиков | `@myrida_bot` (Rida) |
| Бот водителей | `@myrida_haydovchi_bot` (Rida Haydovchi) |
| Админ-бот | `@myrida_admin_bot` (Rida Admin) |
| Первый админ | Telegram ID владельца |

- Все 3 бота ответили на `getMe`, токен прошёл проверку API.
- Ключи только в `.env` сессии Claude и в секретах Cloudflare (G03), не в репозитории (`32`).
- В аккаунте есть чужой для Rida Worker `ilkish`: его не трогаем.

