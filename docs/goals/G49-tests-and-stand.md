# G49. Тесты и стенд: сценарии без проверки

> **Кратко:** Каталог `../77` … `../81` отмечает сценарии «нет проверки»; модули с тонкими тестами (`../111`). Предложение Claude по аудиту 04.10.2026. Оценка: 1,5 дня; запуск не отдаляет.

```text
G49. Тесты и стенд: сценарии без проверки (docs/111)

Ветка goal/g49-tests-and-stand от main. Код продукта не меняется,
кроме найденных ошибок.

Definition of Done

[x] Стенд: P07, P08, P17, P18, D02, D04, D28, D29, D48, D73,
    S07, S43, S51, S52, S75, A07, V11 проверены.
[x] Стенд Cron: сводка команде, напоминания о заявках, чистка
    поддержки.
[x] Тест подключения scheduled в src/index.ts.
[x] Тесты модулей: team, ratings, shares, notifications;
    UI: wallet adjust-form, channels, pitaks, company,
    subscriptions.
[x] Каждая найденная ошибка: исправлена или вынесена в цель.
[x] Каталог 77 … 81 обновлён: «есть проверка».
[x] Каталог 76 … 83 дополнен путями G60 … G68 (docs/158 Н):
    «Butun salon», «Uchrashuv», «Oʻtgan», шторка, «Rasm mos», «Diqqat».
[ ] Полный стенд 3 прогона; уроки в docs/190.
[ ] PR, слияние, CI зелёный.

Цель выполнена, когда всё вместе:
1. Все пункты выше отмечены [x].
2. Ветка слита в main без конфликтов, CI зелёный, деплой прошёл.
3. Владелец написал «проверил», где нужна проверка на телефоне.
4. goals/INDEX: G49 ✅; лишние ветки удалены.
```

## Как сделано (18.10.2026)

| Пункт | Где |
|---|---|
| 17 сценариев на стенде | `e2e/stand/g49-people`, `g49-search`, `g49-driver`, `g49-system`; S43 в `g54`, D73 в `all-driver` |
| Cron команды | `e2e/stand/system-cron-team.spec.ts` (S76 … S78), сводка проверена и в `--at 21:30` |
| scheduled | `apps/backend/src/index.test.ts` |
| Модули и UI | `team.test`, `review-routes.test`, `d1-ratings.test`, `d1-shares.test`, `driver-share-api.test`, `blocked-bot-api.test`; `adjust-form.test`, `company`, `pitaks`, `my-past`, `my-channels`, `photos-chain` |
| Находки | `../83` N26 (в G45), N27 (исправлена, урок №325) |
| Стенд: заглушка Telegram | отказ 403 тем, кто заблокировал бота (`POST /__blocked`), запуск «с компьютера» (`tdesktop`) |

