# G46. Доверие: «Yetib keldingizmi?», рейтинг попутчика, отзывы

> **Кратко:** Обещанное в `../05`, `../07`, `../24`, `../43`, `../53`, но не сделанное (`../111`). Предложение Claude по аудиту 04.10.2026. Оценка: 2,5 дня; запуск не отдаляет.

```text
G46. Доверие: «Yetib keldingizmi?», рейтинг попутчика, отзывы (docs/111)

Ветка goal/g46-trust от main.

Definition of Done

Решения владельца 04.10.2026: Q4, Q7 (docs/111). Согласие:
тексты по docs/25, вид экранов.

[x] Бот спрашивает попутчика «Yetib keldingizmi?» через час
    после прибытия; ответ закрывает ссылку близких (`../43`).
[x] Близкие видят фото и рейтинг водителя; экран близких
    обновляется сам.
[x] Водитель видит рейтинг попутчика в брони и в заявке.
[x] Все отзывы человека: экран, новые сверху; свои отзывы в
    профиле.
[x] Попутчики одной поездки видят фото друг друга (`../05`).
[x] Q4: жалоба попутчика на попутчика той же поездки.
[x] Q7: водитель подписывается на заявки попутчиков в
    «Mening safarlarim» → «Obunalar».
[x] Заявка попутчика истекла: бот говорит и предлагает найти.
[x] Бот заблокирован человеком (403): пометка, не слать до /start.
[x] Навигатор выбирается и в профиле (`../70`).
[x] Тест на каждый пункт, сначала падает; ≤150 строк; knip чист.
[x] Стенд: P03, P05, P30, P41, D21, S22; полный 3 прогона.
[x] docs 05, 07, 17, 24, 43, 53, 70; уроки.
[x] PR, слияние, деплой, владелец проверил двумя аккаунтами.

Цель выполнена, когда всё вместе:
1. Все пункты выше отмечены [x].
2. Ветка слита в main без конфликтов, CI зелёный, деплой прошёл.
3. Владелец написал «проверил», где нужна проверка на телефоне.
4. goals/INDEX: G46 ✅; лишние ветки удалены.
```

## Как сделано (18.10.2026)

| Пункт | Где в коде | Проверка |
|---|---|---|
| «Yetib keldingizmi?» в боте | Cron `askArrived` (`modules/reminders`), кнопки `bots/arrived-callbacks.ts`, ответ `bookings/arrived-answer.ts`; «Ha» закрывает ссылку и в шторке главного экрана (`use-seat-steps.ts`) | `arrived-ask-api.test.ts`, `use-seat-steps.test.tsx`, стенд P77 |
| Близкие: фото, звёзды, обновление | `sharedTripSchema.driver` (id, фото, рейтинг), `follow-driver.tsx`, опрос раз в минуту `follow-screen.tsx`; фото без аккаунта: клиент `users` | `shares-api`, `driver-share-api`, `follow.test.tsx`, стенд S76 |
| Рейтинг попутчика у водителя | уже было в G64: `own-trip/rider-line.tsx`, `requests/request-row.tsx` | тесты G64 |
| Все отзывы человека | `reviewsOf` по 20 и `?before=`, `find/reviews-screen.tsx` (день, «Yana koʻrsatish»), «Baholarim» в «Profil» | `ratings.test.ts`, `reviews-screen.test.tsx`, стенд P80 |
| Фото попутчиков друг другу | `GET /passenger/bookings/:id/riders`, `bookings/co-riders.tsx` | `co-riders-api.test.ts`, `co-riders.test.tsx`, стенд P78 |
| Q4 | `complaintInputSchema.about`, `complaints/application/file.ts`, `feedback/complaint-about.tsx` | `co-riders-api.test.ts`, `complaint-screen.test.tsx`, стенд P79 |
| Q7 | уже было в G64: «Obunalar» в «Mening safarlarim» и «Profil» | `driver-subscriptions.test.tsx`, стенд D66 |
| Заявка истекла | `expiredRing` в `bookings/infrastructure/request-card.ts` | `request-card-api.test.ts`, стенд P64 |
| Бот заблокирован | таблица `bot_blocks` (миграция `0078`), `notifications/infrastructure/bot-blocks.ts`, `bots/bot-member.ts` | `blocked-bot-api.test.ts`, `bot-blocks.test.ts`, стенд S07 |
| Навигатор в профиле | уже было в G75: `account/profile/navigator-row.tsx` (водитель) | тесты G75, стенд D47 |

## Номера сценариев стенда

Номера в тексте цели (04.10.2026) из старой нумерации: темы G46 получили новые номера. Все прогнаны отдельно и в полном стенде:

| Номер | Что это | Тест | Итог 18.10.2026 |
|---|---|---|---|
| P03 | Отказ дать номер | `ui/account/account-gate.test.tsx` «says a phone is required…» | ✅ |
| P05 | Заблокированный номер | `account-gate.test.tsx` «turns a blocked phone…», `backend users/use-cases.test.ts` | ✅ |
| D21 | Направление без пятака | `backend trips/publish-rules.test.ts` (`trips.no_pitak`) | ✅ |
| P30 | Водитель молчит, бронь истекла | стенд `findings` N03 | ✅ |
| S22 | Неотвеченные брони истекают | стенд `edges` V02, V03; `backend bookings/expire-retry.test.ts` | ✅ |
| P41 | Позвонить водителю | стенд `g54` (2 сценария), `after-ride` S46 | ✅ |
| P64, P77 … P80, S07, S76 | Темы G46 (`77`, `80`) | стенд `g46-trust`, `g46-screens` | ✅ |

Тексты на согласие: `../202-g46-texts.md`. Снимки: `screenshots/stand/g46/`.

## Статус: ✅ выполнена (19.10.2026)

- Слита в `main`: PR #301 (`1ef22f7`), #302 (`65648c7`), #303 (`cf5e2aa`). CI зелёный.
- Выложена в обе среды: внутренняя после CI, прод после Approve владельца (запуск `39165755441`, миграция `0078_bot_blocks`).
- Первый запуск прода не дошёл: CI на `main` после #302 упал, тест ходил в настоящий Telegram (урок №344). Исправлено в #303: тесты больше не ходят в сеть.
- Полный стенд с `--at 12:00`: три зелёных прогона по 199 сценариев (уроки №342, №343).
- Согласие владельца на тексты и экраны: 18.10.2026, `../202-g46-texts.md`.
- Владелец проверил на телефоне двумя аккаунтами 19.10.2026 («Проверил, всё работает»).
- Осталось владельцу: проверка текстов носителем (OPS-07).
