# G30. Отдельный бот поддержки

> **Кратко:** цель владельца 02.10.2026. Ветка `goal/g30-support-bot`. Человек пишет в понятный бот поддержки (`@myrida_support_bot`), а не в бот команды. Команда отвечает как раньше: в админ-боте, Reply на копию. Ответ приходит человеку от бота поддержки. Статус: сделано в ветке, тексты ждут согласия владельца.

## Этап 1: код

| Пункт | Что сделано |
|---|---|
| Конфиг бренда | `bots.support` в `brands/brand-config.ts`, имя только в `brands/rida` (`../22`) |
| Вебхук | `/telegram/support` с `secret_token`, как у трёх ботов. Без `SUPPORT_BOT_TOKEN` ответ 404 |
| Обращение и ответ | Копия всей команде в админ-бот. Reply модератора уходит человеку от того бота, куда он писал |
| Связь копии и человека | `support_links.bot` (миграция `0029`): `support` или `admin`. Старые связи `admin`: ответ на них идёт из админ-бота |
| Ссылки «Yordam» | Кнопка поддержки (блок, кошелёк), лендинг, оферта и политика: бот поддержки |
| Админ-бот | Людям не из команды не служба поддержки: отвечает текстом и кнопкой в бот поддержки |
| `setup-bots` | Вебхук, имя и описания бота поддержки. Меню и команд нет: у бота нет Mini App |
| Стенд | Заглушка Telegram знает четвёртый бот; сценарий «обращение и ответ» (`../75`) |

- Заблокированный человек тоже может писать в поддержку: блок спрашивают именно там.
- Тесты: `support-bot.test.ts`, `modules/support/support.test.ts`, `admin-bot.test.ts`, `setup-routes.test.ts`, `webhook-routes.test.ts`, `e2e/stand/bots-team.spec.ts`.

## Этап 2: тексты для носителя

| Ключ | Текст |
|---|---|
| `bot.profile.support.name` | {brand} Yordam |
| `bot.profile.support.short` | {brand} yordam xizmati. Savolingizni yozing, jamoamiz javob beradi. |
| `bot.profile.support.description` | {brand} yordam xizmati. Safar, bron, hamyon yoki hisob boʻyicha savolingizni shu yerga yozing. Jamoamiz shu bot orqali javob beradi. |
| `bot.admin.denied` | Bu bot faqat {brand} jamoasi uchun. Savolingiz boʻlsa, yordam xizmatiga yozing. |
| `bot.admin.toSupport` (кнопка) | Yordam xizmati |
| `landing.footer.contact`, `landing.faq.help.a`, `legal.offer.12.text`, `legal.privacy.7.text` | Те же тексты, вместо бота команды `@{supportBot}` |

- Без изменений: `/start` бота поддержки (`bot.support.welcome`) и ответ «qabul qilindi» (`bot.support.received`).
- `{brand}` подставляется из конфига бренда (урок 84).

## После приёмки (решение владельца 02.10.2026, тексты согласованы)

- Под обращением нет кнопки «Moderator qilish». Модератора добавляют командой `/team add <Telegram ID>`.
- Голосовые сообщения в обе стороны: человек ↔ команда.

| Ключ | Текст |
|---|---|
| `bot.support.voice` | 🎤 Ovozli xabar |
| `bot.support.voiceAnswer` | {brand} jamoasidan ovozli javob |
| `bot.support.textOnly` | Hozircha faqat matn yoki ovozli xabar qabul qilinadi. |
| `bot.team.addHint` | Moderator qoʻshish: /team add Telegram ID |
