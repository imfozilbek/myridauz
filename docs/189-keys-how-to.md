# 189. Все ключи обеих сред: где взять, какие права, куда положить

> **Кратко:** один список на все ключи Rida по порядку (решение владельца 17.10.2026: «чтобы больше не возвращаться»). Карта ключей и зачем каждый: `179`, источник правды: `dream-infra`, `docs/18-rida-keys.md`. Значения ключей в чат и в репозиторий никогда (`32`).

## Общие правила

- Токен Cloudflare: My Profile → API Tokens → Create Token → Create Custom Token → Get started.
- Account Resources: Include → аккаунт своей среды. Zone Resources: Include → Specific zone → зона своей среды.
- Client IP Address Filtering и TTL: пусто. С TTL ключ сам умрёт, и выкладка встанет.
- Значение токена Cloudflare показывают один раз: сразу вставить в место назначения.
- Account ID: Workers & Pages → справа «Account details» → Account ID → Copy.
- GitHub: Settings → Environments → среда → Environment secrets → Add. Не Variables, не секреты репозитория.
- Секрет Worker: Workers & Pages → `rida-backend` → Settings → Variables and Secrets → Add → Type: Secret → Deploy.
- Окружение Claude: меню среды в заголовке сессии → Edit → переменные окружения. Новые значения видит только новая сессия.
- Токен бота: BotFather → `/mybots` → бот → API Token → Revoke current token → новый токен. Revoke делать в момент, когда кладёте токен в Worker: старый перестаёт работать сразу.

## Наборы прав Cloudflare

Набор «Выкладка»:

```text
Account | Workers Scripts      | Edit
Account | D1                   | Edit
Account | Workers R2 Storage   | Edit
Account | Queues               | Edit
Account | Cloudflare Pages     | Edit
Account | Account Settings     | Read
Zone    | Workers Routes       | Edit
Zone    | DNS                  | Edit
Zone    | Zone                 | Read
```

Набор «Claude»: весь набор «Выкладка» и ещё:

```text
Account | Realtime (или Calls) | Edit
Account | Account Analytics    | Read
Account | Workers Tail         | Read
```

Только для `rida-prod-claude` ещё (настройки зоны делает infra):

```text
Zone    | Zone Settings        | Edit
Zone    | SSL and Certificates | Edit
```

Набор «Аналитика» (зоны нет):

```text
Account | Account Analytics    | Read
```

## Внутренняя среда: аккаунт Cloudflare 1, `myrida.uz`, Telegram аккаунт внутренней среды

| № | Что | Права | Куда, имя |
|---|---|---|---|
| 1 | Account ID аккаунта 1 | | GitHub `internal`: `CLOUDFLARE_ACCOUNT_ID`; окружение Claude: `CLOUDFLARE_ACCOUNT_ID` |
| 2 | Токен `rida-internal-deploy` | «Выкладка», зона `myrida.uz` | GitHub `internal`: `CLOUDFLARE_API_TOKEN` |
| 3 | Токен `rida-internal-claude` | «Claude», зона `myrida.uz` | окружение Claude: `CLOUDFLARE_API_TOKEN` |
| 4 | Токен `rida-internal-analytics` | «Аналитика» | Worker аккаунта 1: `ANALYTICS_API_TOKEN` |
| 5 | Бот `@myrida_bot` | | Worker аккаунта 1: `PASSENGER_BOT_TOKEN` |
| 6 | Бот `@myrida_haydovchi_bot` | | `DRIVER_BOT_TOKEN` |
| 7 | Бот `@myrida_admin_bot` | | `ADMIN_BOT_TOKEN` |
| 8 | Бот `@myrida_support_bot` | | `SUPPORT_BOT_TOKEN` |
| 9 | Бот `@myridauz_bot` | | `MAIN_BOT_TOKEN` |
| 10 | Бот `@myrida_poster_bot` | | `POSTER_BOT_TOKEN` |

После пунктов 5 … 10 владелец пишет «боты внутренней среды готовы»: Claude ставит новый секрет вебхука и запускает setup-bots.

## Прод: аккаунт Cloudflare 2, `ridaone.uz`, Telegram аккаунт прода

| № | Что | Права | Куда, имя | Когда |
|---|---|---|---|---|
| 11 | Account ID аккаунта 2 | | GitHub `production`: `CLOUDFLARE_ACCOUNT_ID` (заменить: там аккаунт 1); окружение Claude: `PROD_CLOUDFLARE_ACCOUNT_ID` | сейчас |
| 12 | Токен `rida-prod-deploy` | «Выкладка», зона `ridaone.uz` | GitHub `production`: `CLOUDFLARE_API_TOKEN` (заменить) | сейчас |
| 13 | Токен `rida-prod-claude` | «Claude» и строки прода, зона `ridaone.uz` | окружение Claude: `PROD_CLOUDFLARE_API_TOKEN` | сейчас |
| 14 | Токен `rida-prod-analytics` | «Аналитика» | Worker аккаунта 2: `ANALYTICS_API_TOKEN` | после первой выкладки прода |
| 15 | Бот `@rida1uz_bot` | | Worker аккаунта 2: `PASSENGER_BOT_TOKEN` | после первой выкладки прода |
| 16 | Бот `@rida1uz_haydovchi_bot` | | `DRIVER_BOT_TOKEN` | так же |
| 17 | Бот `@rida1uz_admin_bot` | | `ADMIN_BOT_TOKEN` | так же |
| 18 | Бот `@rida1uz_yordam_bot` | | `SUPPORT_BOT_TOKEN` | так же |
| 19 | Бот `@ridauz_bot` | | `MAIN_BOT_TOKEN` | так же |
| 20 | Бот `@rida1uz_poster_bot` | | `POSTER_BOT_TOKEN` | так же |

Worker прода появляется только после первой выкладки: до неё секреты положить некуда. Потом владелец пишет «боты прода готовы».

## Не ключ, но тоже нужно

| № | Что | Где взять | Кому |
|---|---|---|---|
| 21 | Telegram ID обоих аккаунтов владельца | web.telegram.org/k → «Saved Messages» → число после `#` в адресе | Claude в чат (это не ключ); Claude кладёт `ADMIN_TELEGRAM_IDS` в обе среды через запятую |
| 22 | R2 на аккаунте 2 | R2 → включить (может попросить карту, платить не нужно) | сейчас, до первой выкладки прода |
| 23 | Web Analytics для `ridaone.uz` | Analytics & Logs → Web Analytics → Add site, автоустановка (`59`) | сейчас |

## Делает Claude, владельцу ничего

- `TELEGRAM_WEBHOOK_SECRET`: свой в каждой среде; сразу setup-bots, иначе боты замолчат.
- `CF_ACCOUNT_ID` в Worker своей среды.
- Звонки: `REALTIME_APP_ID`, `REALTIME_APP_SECRET`, `TURN_KEY_ID`, `TURN_KEY_TOKEN`, свои у каждого аккаунта (`08`). Claude проверяет внутреннюю среду и создаёт ключи прода токеном «Claude».

## Удалить

- GitHub: Settings → Secrets and variables → Actions → Repository secrets: `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`, если есть. Все задания CI берут ключи из Environment.
- Cloudflare, **последним шагом**, в обоих аккаунтах: `rida-deploy`, `rida-claude` и все токены, которых нет в этом списке. Раньше нельзя: старый ключ может стоять в Worker как `ANALYTICS_API_TOKEN` (`179`).

## Если что-то меняется

- Токен бота сменили: новый в Worker, Claude запускает setup-bots (`46`).
- Ключ Cloudflare перестал работать: создать заново с тем же набором прав и положить в то же место. Значение секрета GitHub прочитать нельзя (урок №297).
- Новый бренд или среда (`22`): тот же список с именами `<бренд>-<среда>-<задача>`.
