# 189. Ключи и доступы обеих сред: по шагам

> **Кратко:** решение владельца 17.10.2026: ключи и настройки обеих сред делает программа `pnpm run keys` (`scripts/keys.mjs`); владелец делает только то, что требует его рук. Полная симметрия: те же наборы прав, имена и настройки в обеих средах. Страница с отметками шагов для владельца: https://claude.ai/artifact/EYnwD27jVRfTthViKV9tJJ (Claude читает отметки и поля через её базу, документ `progress/main`). Значения ключей в чат, на страницу и в репозиторий никогда (`32`).

## Как это устроено

- В каждом аккаунте владелец делает один ключ из шаблона Cloudflare «Create Additional Tokens». Этот ключ умеет только создавать другие ключи.
- Программа этим ключом создаёт ключи с точными правами, настраивает зону и секреты Worker. Значения она не печатает никогда.
- Для своей работы программа делает ключ на один час и удаляет его в конце запуска.
- Ключ выкладки владелец переносит в GitHub через «Roll»: новое значение видит только он.
- Запуск можно повторять: что уже на месте, программа не трогает. Ключ перестал работать: запустить снова (урок №297).
- Почему так: список из 30 шагов руками владелец пройти не смог (урок №301).

## Шаги владельца

| № | Когда | Что |
|---|---|---|
| 1 | сейчас | Каждый аккаунт: My Profile → API Tokens → Create Token → шаблон «Create Additional Tokens» → Use template → имя `rida-internal-setup` или `rida-prod-setup` (не `-deploy`: так программа назовёт ключ выкладки, урок №302) → Continue to summary → Create Token → Copy. Аккаунт с `myrida.uz` → окружение Claude `CLOUDFLARE_API_TOKEN`; аккаунт с `ridaone.uz` → `PROD_CLOUDFLARE_API_TOKEN` (заменить старые значения) |
| 2 | сразу | Слить PR с программой (Claude скажет, когда CI зелёный); новая сессия Claude с фразой со страницы |
| 3 | после программы | Каждый аккаунт: API Tokens → `rida-<среда>-deploy` → ⋯ → Roll → Copy → GitHub → Settings → Environments → `internal` или `production` → Environment secrets → `CLOUDFLARE_API_TOKEN`. Там же `CLOUDFLARE_ACCOUNT_ID`: Account ID этого аккаунта |
| 4 | после программы | Строки «owner:» отчёта программы: Claude даёт их по одной (например, включить R2 в проде) |
| 5 | после первой выкладки прода | Approve в GitHub Actions; 6 ключей ботов прода в Worker (ниже); BotFather: Configure Mini App у 4 ботов прода |
| 6 | в конце | Ничего: Claude запускает `--finish --yes`, программа удаляет старые ключи и оба ключа шаблона |

## Что делает программа

| Шаг | Что |
|---|---|
| Ключи | `rida-<среда>-deploy` (набор «Выкладка», своя зона), `rida-<среда>-analytics` (набор «Аналитика»), ключ на час для себя |
| Зона | SSL/TLS Full (strict), Always Use HTTPS On, Minimum TLS 1.2, Bot Fight Mode Off (`85`), Web Analytics с автоустановкой (`59`) |
| R2 | проверяет; выключен: строка владельцу (включается только в панели, может попросить карту, платить не нужно) |
| DNS | показывает старые записи адресов бренда (`@`, `www`, `api`, `map`, 4 Mini App); удаляет только с `--dns` |
| Worker (после первой выкладки) | `CF_ACCOUNT_ID`; `ADMIN_TELEGRAM_IDS` (`--admins=`); `ANALYTICS_API_TOKEN`; ключи звонков (`08`); `TELEGRAM_WEBHOOK_SECRET` и сразу setup-bots, только когда все 6 ключей ботов на месте |
| `--finish --yes` | новое значение `ANALYTICS_API_TOKEN`, потом удаляет старые ключи `rida-*` этого аккаунта и свой ключ шаблона. Новый ключ выкладки ещё не в GitHub: не удаляет ничего, просит сначала Roll. Без `--yes`: только список |

- Внутренняя: `pnpm run keys --brand=rida --env=internal --admins=<id>,<id>`.
- Прод: те же флаги с `--env=production`, переменные `PROD_CLOUDFLARE_*` подставляются в `CLOUDFLARE_*` перед запуском.
- Строка без доступа к праву (Cloudflare переименовал право): программа называет шаг руками и идёт дальше.
- Боты молчат после нового секрета вебхука (setup-bots не прошёл): Claude запускает ту же команду с `--webhook`.

## Наборы прав (код: `scripts/keys/rights.mjs`)

| Набор | Строки |
|---|---|
| «Выкладка» | Account: Workers Scripts, D1, Workers R2 Storage, Queues, Cloudflare Pages: Edit; Account Settings: Read. Zone: Workers Routes, DNS: Edit; Zone: Read |
| «Аналитика» | Account: Account Analytics: Read |
| Ключ на час | «Выкладка» и Zone Settings: Edit; если Cloudflare их знает: Realtime (Calls), Bot Management: Edit; Account Settings: Edit (для Web Analytics). Все зоны своего аккаунта, один час |

Набора «Claude» больше нет: Claude работает ключом шаблона через программу.

## Ключи среды (одинаково в обеих)

| Ключ | Кто делает | Где лежит |
|---|---|---|
| ключ шаблона «Create Additional Tokens» | владелец | окружение Claude: `CLOUDFLARE_API_TOKEN` (внутренняя), `PROD_CLOUDFLARE_API_TOKEN` (прод); до конца G84 |
| `rida-<среда>-deploy` | программа; значение: Roll владельца | GitHub Environment среды: `CLOUDFLARE_API_TOKEN` |
| `rida-<среда>-analytics` | программа | Worker среды: `ANALYTICS_API_TOKEN` |
| Account ID | уже есть | GitHub: `CLOUDFLARE_ACCOUNT_ID`; Claude: `CLOUDFLARE_ACCOUNT_ID`, `PROD_CLOUDFLARE_ACCOUNT_ID`; Worker: `CF_ACCOUNT_ID` |

## GitHub (руками: API GitHub из сессии Claude закрыт)

| Что | Как |
|---|---|
| Environment `internal` | ветки: только `main`; Required reviewers выключено (решение 13.10) |
| Environment `production` | Required reviewers: владелец; Prevent self-review выключено; ветки: только `main` |
| Секреты репозитория | `CLOUDFLARE_*` на уровне репозитория лишние: удалить, если есть |

## Telegram

Секреты Worker (6 ботов; во внутренней программа проверяет, что они на месте; в проде после первой выкладки):

| Роль | Внутренняя | Прод | Секрет |
|---|---|---|---|
| попутчик | `@myrida_bot` | `@rida1uz_bot` | `PASSENGER_BOT_TOKEN` |
| водитель | `@myrida_haydovchi_bot` | `@rida1uz_haydovchi_bot` | `DRIVER_BOT_TOKEN` |
| админ | `@myrida_admin_bot` | `@rida1uz_admin_bot` | `ADMIN_BOT_TOKEN` |
| поддержка | `@myrida_support_bot` | `@rida1uz_yordam_bot` | `SUPPORT_BOT_TOKEN` |
| главный | `@myridauz_bot` | `@ridauz_bot` | `MAIN_BOT_TOKEN` |
| каналы | `@myrida_poster_bot` | `@rida1uz_poster_bot` | `POSTER_BOT_TOKEN` |

- Ключ бота: BotFather → `/mybots` → бот → API Token → Copy. В Worker: Workers & Pages → `rida-backend` → Settings → Variables and Secrets → Add → Type: Secret → Deploy. Кладёт только владелец (`32`).

BotFather руками (в API Telegram этого нет):

| Бот | Configure Mini App: адрес | Сплэш: фон | Картинка описания |
|---|---|---|---|
| попутчик | `https://passenger.<домен>` | `#0D9488` | `bot-passenger-description.png` |
| водитель | `https://driver.<домен>` | `#D97706` | `bot-driver-description.png` |
| админ | `https://admin.<домен>` | `#334155` | `bot-admin-description.png` |
| главный | `https://main.<домен>` | `#0D9488` | нет |
| поддержка | нет | нет | `bot-support-description.png` |

- К запуску нужен Configure Mini App: без него ссылки `t.me/<бот>?startapp` (доска дня, `openApp`) открывают только чат. Сплэш и картинки описания можно после запуска (совет Claude, решает владелец).
- Сплэш: иконка `brands/rida/landing/bot/miniapp-splash.svg`, фон одинаковый для светлой и тёмной темы, иконка и текст `#FFFFFF` (`121`, OPS-05). Картинки: `brands/rida/brand-kit/kit/telegram/` (`38`), на странице владельца есть для скачивания.
- Бот каналов админ в главном канале и каналах направлений с 4 правами: изменение профиля канала, публикация, редактирование чужих публикаций, добавление подписчиков (`176`, `180`). Прод: стоят в 68 каналах (проверка infra 13.10). Внутренняя: `@myrida_uz` и «MyRida | Viloyatlar».
- Владелец даёт полями страницы (не ключи): Telegram ID обоих аккаунтов (web.telegram.org/k → «Избранное» → число после `#`), номер «MyRida | Viloyatlar» и ссылку-приглашение с заявками.

## Где симметрии нет

| Что | Почему |
|---|---|
| В окружении Claude `CLOUDFLARE_*` и `PROD_CLOUDFLARE_*` | обе пары в одном окружении |
| Approve только у прода | решение 13.10 |
| Каналов 2 и 68 | решение 13.10; права бота каналов одинаковые |
| Секреты Worker прода позже | Worker прода появится с первой выкладкой |

## Новый бренд или среда

Тот же список: ключ шаблона, `pnpm run keys`, Roll в GitHub. Имена `<бренд>-<среда>-<задача>` (`22`).
