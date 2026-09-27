# G03. Инфраструктура Cloudflare и деплой

> **Кратко:** Все ресурсы Cloudflare, деплой backend и трёх Mini App, вебхуки трёх ботов. После цели боты отвечают, Mini App открываются из Telegram.

```text
ЦЕЛЬ G03: Инфраструктура Cloudflare и деплой

Зависит от: G01, G02, OPS-01.
Контекст: docs/03-tech-stack.md, docs/22-multi-brand.md, docs/32-ci-security.md.

Сделать:
1. brands/rida/wrangler.toml: Worker backend, D1, R2 (приватный),
   Queues (уведомления, посты в каналы), Durable Objects (заготовка
   класса чата не создаётся, пока нет G09: без неиспользуемого кода),
   Analytics Engine, Cron Triggers (пока только нужные).
2. Создать ресурсы через API/wrangler в аккаунте Cloudflare.
3. Миграции D1 (инструмент миграций, первая пустая миграция схемы).
4. Секреты в Cloudflare (wrangler secret): токены 3 ботов,
   секрет вебхука. В GitHub только CLOUDFLARE_API_TOKEN и ACCOUNT_ID
   в Environment production (деплой только из main, подтверждение
   владельцем).
5. Деплой backend на api.myrida.uz, 3 Mini App на Pages
   (например, passenger/driver/admin поддомены myrida.uz).
6. Вебхуки 3 ботов на backend, проверка secret_token.
   Каждый бот отвечает на /start коротким узбекским текстом
   и кнопкой открытия своего Mini App (menu button).
7. Workflow деплоя: одна команда deploy --brand=rida,
   в CI job deploy только после зелёных барьеров на main.
8. Workers Logs включены. Экран загрузки Mini App в BotFather:
   иконка и цвета бренда (инструкция владельцу, если нужен ручной шаг).

Проверка владельцем (docs/33; ждать ответа только по этим пунктам,
остальное делать дальше):
1. Одобрить первый деплой в прод (Environment production).
2. Открыть 3 бота на своём телефоне: отвечают, Mini App открываются.
3. Ручные шаги в BotFather, если нужны (экран загрузки).

Definition of Done:
[ ] 3 бота отвечают на /start и открывают свой Mini App в Telegram.
[ ] Запрос к api.myrida.uz/health отвечает 200.
[ ] Ни одного секрета в репозитории и в логах CI (gitleaks зелёный).
[ ] Деплой из main проходит через Environment production.
[ ] PR из форка не получает секретов (проверено настройками workflow).
[ ] docs обновлены (домены, ресурсы), docs/goals/INDEX.md: G03 выполнена.
[ ] Скриншоты результата показаны владельцу (docs/33).
[ ] Владелец подтвердил все пункты «Проверка владельцем».

Не останавливаться, пока все пункты DoD не выполнены.
```
