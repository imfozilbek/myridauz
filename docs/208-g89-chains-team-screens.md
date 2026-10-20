# 208. G89: карта цепочек: команда и экраны

> **Кратко:** карта входов команды (жалобы, отзывы, модерация, поддержка, дела, список ожидания, статистика, Cron команды) и действий на экранах Mini App: вход → use case → таблицы D1 → побочные действия. У каждой цепочки указаны тесты и их уровень. Карта сделана в G89 20.10.2026.

**Как читать:**

- `unit`: use case над памятью или тестовой D1; тест экрана в `packages/ui` тоже `unit`.
- `api`: весь Worker над тестовой D1.
- `stand`: стенд Playwright (`docs/75`).
- `e2e`: Playwright по `e2e/*.spec.ts`, API подменён.
- **Жирный** тест: G89 добавил в него случай этой цепочки. В скобках код находки (`213`, `214`).

## Жалобы и отзывы

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| POST /complaints | `fileComplaint` (`file.ts`) | `complaints` (INSERT OR REPLACE) | новость «Navbat» или срочный звонок всей команде; человеку «hidden» в бот | `ratings-complaints-api.test.ts`, `co-riders-api.test.ts`, `deletion-evidence-api.test.ts`, `complaints.test.ts`, **`complaint-races.test.ts`** (двойное нажатие) | unit, api |
| GET /complaints/mine | `myNotes` | нет | нет | `complaint-notes-api.test.ts` | api |
| GET /admin/complaints, GET /admin/complaints/:id | `complaintQueue`, `openComplaint` (new → `in_review`) | `complaints` (вся строка) | нет | `complaints.test.ts`, `complaint-case.test.ts`, **`complaint-races.test.ts`** (открытие не отменяет решение), **`complaints/missing.test.ts`** (неизвестная жалоба) | unit |
| POST /admin/complaints/:id/chat | `complaintChat` | `complaint_chat_reads` | нет | `ratings-complaints-api.test.ts`, **`complaints/missing.test.ts`** (удалённая сторона без id) | unit, api |
| POST /admin/complaints/:id/decision | `decide` | `complaints` (условно), `users`, `blocked_phones`, `block_log`, `held_phones`, `bookings`, `trips`, `ride_requests`, `offers`, кошелёк, `team_actions` | предупреждение или блок, автору «koʻrib chiqildi», «Navbat», чат забыт | `ratings-complaints-api.test.ts`, `deletion-evidence-api.test.ts`, `meeting-api.test.ts`, **`complaints.test.ts`** (сторона поездки), **`complaint-evidence.test.ts`** (A2), **`complaints/missing.test.ts`** (блок члена команды только владельцем), **`navbat-complaint.test.tsx`** (A1, A11) | unit, api |
| POST /admin/complaints/:id/refund/:answer | `answerRefund` | `complaints` (условно), `wallet_operations` | сигнал ленты водителю | **`refund.test.ts`** (A1), `d1-refunds.test.ts`, `meeting-client.test.ts`, **`navbat-cases.test.tsx`** (A11) | unit |
| POST /admin/users/:id/block, GET blocks, POST unblock | `blockPerson`, `blockJournal`, `unblock` | `users`, `blocked_phones`, `block_log`, `bookings`, `trips`, запросы, `offers`, `team_actions` | сообщение о блоке (с G89 в бот, который есть у человека, A6), другим сторонам | **`block-api.test.ts`** (A6), `block-riding-api.test.ts`, `navbat-api.test.ts` | api |
| GET /reviews/:bookingId, GET /users/:id/reviews | `reviewTarget`, `reviewsOf` | нет | нет | `ratings-complaints-api.test.ts`, **`review-target.test.ts`** (чужая поездка, удалённая сторона) | unit, api |
| POST /reviews | `rate` | `reviews` (UNIQUE бронь + автор), `rating_flags` | знак «Diqqat» `rating`, человеку `bot.rating.low` | `ratings-complaints-api.test.ts`, `comfort-api.test.ts`, `standing-api.test.ts`, **`ratings.test.ts`** (A9, A10), **`d1-ratings.test.ts`** | unit, api |
| GET /admin/reviews, POST /admin/reviews/:id/hide | `teamReviews`, `store.hide` | `reviews.hidden` | нет | `review-routes.test.ts`, `team-reviews.test.tsx` | unit, api |
| Кнопка бота `rate:<booking>:<n>` | `rateFromBot` | `reviews`, `rating_flags` | правка сообщения, кнопка жалобы ниже 3 звёзд | `ratings-complaints-api.test.ts`, `bot-events.test.ts`, **`d1-ratings.test.ts`** (звезда бота и отзыв приложения сразу) | unit, api |
| Cron `askForRatings` (раз в час) | `askRatings` | `rating_asks` | вопросы и одно напоминание (массовая полоса) | `ratings.test.ts`, `d1-ratings.test.ts`, `ratings-complaints-api.test.ts` | unit, api |

## Команда, «Navbat», поддержка

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| GET /admin/navbat, POST /admin/navbat/:kind/:id/take | маршруты «Navbat» | `case_takes` | нет | `navbat-api.test.ts`, `meeting-api.test.ts`, `support-case-api.test.ts`, **`team-api.test.ts`** (M10) | api |
| GET /admin/attention | `signs.ofDay` | нет | нет | `attention-api.test.ts` | api |
| GET /admin/me/work, GET /admin/journal | `workOf`, маршруты журнала | нет | нет | `journal-api.test.ts`, `team-cancel-api.test.ts`, `limits-api.test.ts` | api |
| /admin/team (GET, POST, DELETE) | `changeModerator` | `team_members`, `team_actions` | нет | **`team-api.test.ts`** (M3, M10), `owner-only-api.test.ts` | api |
| GET /admin/support/:id, POST answer | `supportCase`, `answerCase` | `support_messages`, `assignments.answered_at` | ответ из бота поддержки, тихое «javob berdi» другим копиям | `support-case-api.test.ts` | api |
| Сообщение в бот поддержки | `toSupport` (`support-bot.ts`) | `support_messages`, `assignments`, `support_links` | карточка одному исполнителю, «qabul qilindi» | `support-bot.test.ts`, `support-flood.test.ts`, `support-talk.test.ts`, `assignments.test.ts`, **`d1-support.test.ts`** (A3) | unit, api |
| Ответ в боте админки на копию | `admin-messages.ts` | `support_messages`, `assignments.answered_at` | ответ человеку, «javob berdi» | `support-bot.test.ts`, `webhook-routes.test.ts` | api |
| Кнопки фото в боте админки | `face-callbacks.ts` → `decideFace` | `users` (с G89 условно, A8), `face_log`, `team_actions` («Jurnal», M14) | «Mos emas» в боте, «Navbat» | **`face-bot.test.ts`** (M10, M14), `faces.test.ts`, **`face-guard.test.ts`**, **`d1-faces.test.ts`** (A8) | unit, api |
| Cron `showTeamQueue` (каждый тик) | `showQueue` | карточки ботов | карточки «Navbat» | `navbat-api.test.ts` (косвенно) | api |
| Cron `sendApplicationReminders` | `remindWaiting` | `application_reminders`, `attention_signs` | звонок об опоздании, «Diqqat» `late` | `application-reminders-api.test.ts`, **`assignments/reminders.test.ts`** (модератор ушёл) | unit, api |
| Cron `sendDaySummary` (раз в час с 21:00) | `sendDigest` | `team_digests` | итог дня владельцам | **`assignments.test.ts`** (A13) | unit |
| Cron `purgeSupport` (раз в день) | `purge` | `support_messages` | нет | `cron-reads.test.ts` | unit |

## Статистика, рост, список ожидания

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| GET /admin/stats, GET /admin/rost | `readStats`, `readRost` | `stats_cache` | нет | `stats-api.test.ts`, `owner-only-api.test.ts` | api |
| POST /analytics (без подписи) | `recordEvents` | Analytics Engine | воронки, тревога ошибок | `analytics-routes.test.ts`, `rate-limit-api.test.ts` | api |
| Cron `checkStatsAlerts` (раз в час) | `checkAlerts` | `stats_cache` | знак «Diqqat», звонок при ошибках | `stats.test.ts` | unit |
| /waitlist (GET, PUT), POST /waitlist/invite, GET /public/waitlist | `openApp`, `saveAnswers`, `invite` | `waitlist`, `waitlist_visits` | живая карточка в главном боте | `waitlist-api.test.ts`, `waitlist-channels-api.test.ts`, **`person.test.ts`** (своя ссылка друга) | unit, api |
| GET /admin/waitlist\*, POST /admin/waitlist/:region/open | `overview`, `direction`, `openDirection` | `waitlist_openings`, `waitlist.notified_at`, `team_actions` | зелёные карточки и один звонок | `waitlist-api.test.ts`, **`waitlist/team.test.ts`** (A12) | unit, api |
| /admin/waitlist-switch (GET, PUT), /admin/ad-links\* | `readSwitch`, `setSwitch`, `createAd` | `switches`, `ad_links`, `team_actions` | ссылка приглашения в канал | `waitlist-api.test.ts`, `ads.test.ts` | unit, api |
| Cron `tellOpenedDirections`, `refreshWaitlistCards` | `tellOpened`, `refreshCards` | `waitlist.notified_at`, `card_at` | звонки, правка карточек | **`waitlist/team.test.ts`** (A12) | unit |
| GET /me/moment, POST /me/moment/offered, /card, PUT /me/moment/story, PUT /me/qr | маршруты роста | `share_moments`, `user_codes`, истории в R2 | готовое сообщение | `growth-api.test.ts`, `moments.test.ts`, `moment-screen.test.tsx` | unit, api |
| /admin/sounds (GET, POST), GET /public/sounds | звуки | выбор звуков | нет | `sounds-api.test.ts`, `owner-only-api.test.ts` | api |
| /admin/company (GET, POST), GET /public/company | компания | версии компании | нет | `company-api.test.ts`, `owner-only-api.test.ts` | api |

## Как экраны говорят с API

| Часть | Файл | Факт |
|---|---|---|
| Запрос | `network.ts` | 15 с; GET два раза, POST, PUT, DELETE один раз: потерянный ответ изменения не повторяется |
| Ошибка | `signed-request.ts` | тело читает `apiErrorSchema` (`z.enum(API_ERRORS)`); код вне списка теряется. G89 внёс все коды сервера (`rate.limited`, `support.*`, `analytics.invalid_batch`): **`api-error-codes.test.ts`**, **`signed-request.test.ts`** (U11) |
| Текст | `error-text.ts` | список `EXPLAINED` и `SAME_AS`; другой код даёт `errors.generic.description`. G89 добавил `complaints.too_late`, `users.face_decided` |
| Двойное нажатие | `one-at-a-time.ts` | защита работает, только если `onClick` отдаёт Promise |
| Живые данные | `feed/*`, `use-list.ts` | сигнал только в Mini App того бота, который написал; `useLoad` держит загрузчик первого рендера |
| Ворота | `app-gates.tsx` | Follow → Legal → Account → Driver → Moment → LaunchLinks → страница; админка: `TeamGate`. Блок при открытом приложении: **`account-again.test.tsx`** (U12) |

## Действия на экранах

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| Регистрация «Raqamni yuborish» (`registration-flow.tsx`) | POST /me/registration → `register` | `users`, `user_arrivals` | затем PUT avatar, POST write access | `account-gate.test.tsx`, **`about-step.test.tsx`** (U4); стенд `screens-passenger.spec.ts` | unit, stand |
| Фото (`use-face-shot.ts`) | PUT /me/avatar → `setAvatar` | `users`, `face_log` | дело фото команде | `profile.test.tsx`, **`about-step.test.tsx`** (U13); стенд `g51-photo.spec.ts` | unit, stand |
| «Maʼlumotlarimni oʻchirish» (`delete-account.tsx`) | DELETE /me → `deleteAccount` | `users`, `bookings`, чаты, ссылки … | боты другим сторонам | **`delete-account.test.tsx`** (U5); стенд `system-people.spec.ts` | unit, stand |
| Бронь «Soʻrov yuborish» (`book-points.tsx`) | POST /trips/:id/bookings → `requestBooking` | `bookings`, `ride_requests` | карточка в боте водителя, лента | **`book-flow.test.tsx`** (U2), **`sent-seat.test.tsx`** (U3), **`safar-states.test.tsx`** (U14); стенд `passenger-booking.spec.ts`, `g26.spec.ts` | unit, stand |
| Отмена места (`use-cancel-seat.ts`, `seat-actions.ts`) | POST /passenger/bookings/:id/cancel | `bookings`, `wallet_operations` | бот водителя, возврат | `live-screens.test.tsx`, `dock-cancel.test.tsx`, **`cancel-refusals.test.ts`**; стенд `passenger-booking.spec.ts` | unit, stand |
| «Men keldim», «Yetib keldim» (`use-came.ts`, `use-seat-steps.ts`) | POST /passenger/bookings/:id/came, arrived → `markProgress` | `bookings` | бот водителя, близкие | `meeting-card.test.tsx`, `booking-told.test.tsx`, **`progress-refusals.test.ts`**; стенд `family.spec.ts`, `g63.spec.ts` | unit, stand |
| Водитель: подтвердить, отказать, отменить (`use-answer-booking.ts`) | POST /driver/bookings/:id/:action | `bookings`, `wallet_operations` | бот попутчика, лента | `own-trip-answers.test.tsx`, `driver-stale.test.tsx`; стенд `g21.spec.ts`, `driver-market.spec.ts` | unit, stand |
| Отметки встречи (`use-meet-mark.ts`) | POST /driver/bookings/:id/came, met, no_show | `bookings`, `complaints` (no_show) | бот попутчика, команда | `own-trip-meeting.test.tsx`; стенд `g63.spec.ts` | unit, stand |
| «Yoʻlga chiqdim», «Yetib keldik» (`use-trip-steps.ts`) | POST /driver/trips/:id/depart, arrive | `trips`, `bookings` (expire) | пост канала, боты | **`own-trip-steps.test.tsx`** (U14), `own-trip-arrived.test.tsx`; стенд `g63.spec.ts` | unit, stand |
| Публикация поездки (`trip-form.tsx`) | POST /driver/trips → `publish` | `trips` | посты каналов, подписки | `new-trip*.test.tsx`; стенд `g26.spec.ts`, `driver-market.spec.ts` | unit, stand |
| Отмена поездки (`use-own-trip-actions.ts`) | POST /driver/trips/:id/cancel | `trips`, `bookings`, `wallet_operations` | боты, пост удалён | `live-screens.test.tsx`; стенд `driver-market.spec.ts` | unit, stand |
| Перенос, снижение цены (`trip-change.tsx`) | POST /driver/trips/:id/time, price | `trips` | боты попутчиков | `trip-change.test.tsx`, **`passenger-state.test.ts`** (U14); стенд `trip-changes.spec.ts` | unit, stand |
| Публикация запроса (`request-points.tsx`) | POST /passenger/requests | `ride_requests` | подписки водителей | `new-request*.test.tsx`; стенд `passenger-requests.spec.ts` | unit, stand |
| Отмена запроса (`passenger-open.tsx`) | POST /passenger/requests/:id/cancel | `ride_requests`, `offers` | водители с предложением | `my-request.test.tsx`, **`d1-requests.test.ts`**; стенд `passenger-requests.spec.ts` | unit, stand |
| Переключатель звонков (`calls-switch.tsx`) | POST /passenger/requests/:id/calls | `ride_requests` (только пока запрос открыт) | нет | `call-talk.test.tsx`, **`request-calls.test.ts`**, **`d1-requests.test.ts`** | unit |
| Предложение (`offer-sheet.tsx`, `use-trip-offer.ts`) | POST /driver/requests/:id/offers → `sendOffer` | `offers`, `request_talks` | бот попутчика | `board*.test.tsx`, **`offer-bounds.test.tsx`** (U15); стенд `passenger-requests.spec.ts`, `driver-market.spec.ts` | unit, stand |
| Открыть разговор (`board-screen.tsx`) | POST /driver/requests/:id/talk | `request_talks` | нет | **`board-chat.test.tsx`** (U7); стенд `g64.spec.ts` | unit, stand |
| Поездка для салона (`salon-sheet.tsx`) | POST /driver/requests/:id/trip | `trips`, `offers` | бот попутчика | `board-sheets.test.tsx`, **`salon-refusals.test.ts`**; стенд `g64-salon.spec.ts` | unit, stand |
| Принять, отклонить предложение (`use-answer-offer.ts`, `offer-item.tsx`) | POST /passenger/offers/:id/:action → `acceptOffer`, `declineOffer` | `offers`, `bookings`, `trips`, `wallet_operations`, `ride_requests` | боты водителя и попутчика | **`passenger-offer-sheet.test.tsx`** (U9); стенд `passenger-requests.spec.ts` | unit, stand |
| Сообщение чата (сокет, `use-chat.ts`) | DO `ChatRoom` `sendText` | хранилище DO, `chat_unread` | бот «Yangi xabar», лента | `chat.test.tsx`, **`room-rights.test.ts`** (C1, C2); стенд `chat.spec.ts` | unit, stand |
| Готовый ответ в шторке (`message-items.tsx`, `seat-actions.ts`, `trip-actions.ts`) | GET /chats/unread, POST /chats/:key/messages → DO `/send` | хранилище DO, `chat_unread` | бот, лента; в закрытый чат 403 (U10) | `message-sheet.test.tsx`, **`sheet-routes.test.ts`**, **`chat-closed-api.test.ts`** (U10) | unit, api |
| Звонок (`use-call.ts`) | сокет чата + `/calls/*` | `call_state`, `rings` | звонок бота | `call*.test.tsx`, **`call-ends.test.ts`**; стенд `g54.spec.ts` | unit, stand |
| Отзыв (`review-form.tsx`, `use-rate-riders.ts`) | GET, POST reviews | `reviews`, `rating_flags` | нет | `review-form.test.tsx`, `rate-link.test.tsx`, **`review-target.test.ts`**; стенд `system-cron.spec.ts` | unit, stand |
| Жалоба (`complaint-screen.tsx`) | POST complaints → `fileComplaint` | `complaints` | бот команды, бот «hidden» | `complaint-screen.test.tsx`, **`complain-deadline.test.tsx`** (U1); стенд `system-cron.spec.ts`, `g46-trust.spec.ts` | unit, stand |
| Избранное (`use-favorite.ts`) | POST, DELETE favorites | `favorite_drivers` | нет | `comfort.test.tsx`, `comfort-client.test.ts`; стенд `system-channels.spec.ts` | unit, stand |
| Подписка: создать, убрать, продлить (`notify-me.tsx`, `subscription-card.tsx`) | подписки маршрута | `route_subscriptions` | бот позже | `subscriptions.test.tsx`, `subscriptions-failure.test.tsx`; стенд `system-people.spec.ts` | unit, stand |
| Поделиться местом или поездкой, стоп (`use-share-trip.ts`, `use-close-share.ts`) | маршруты ссылок | таблицы ссылок (`d1-shares.ts`) | бот близких | `own-trip-tiles.test.tsx`, `own-trip-double-tap.test.tsx`; стенд `family.spec.ts` | unit, stand |
| «Xabar olish» (`follow-screen.tsx`) | POST /shared/:token/follow | подписчики ссылки | бот близкого | **`follow.test.tsx`** (U6); стенд `family.spec.ts` | unit, stand |
| Заявка водителя, фото машины (`application-flow.tsx`, `use-car-shots.ts`) | маршруты drivers | `driver_applications`, `application_log` | бот команды | `driver*.test.tsx`; стенд `driver-screens.spec.ts` | unit, stand |
| Список ожидания (`use-waitlist.ts`) | маршруты waitlist | `waitlist` | карточка бота | `waitlist-flow.test.tsx`; стенд `g83.spec.ts` | unit, stand |
| Карточка момента (`moment-screen.tsx`) | маршруты роста | `share_moments` | нет | `moment-screen.test.tsx`; стенд `g69.spec.ts` | unit, stand |
| Команда: фото (`face-case.tsx`), поддержка (`support-case.tsx`), дела «Navbat» | маршруты админки | `face_log`, `support_messages` | боты | **`navbat-cases.test.tsx`** (M8, A11), `navbat-finished.test.tsx`, **`navbat-complaint.test.tsx`** (A1), **`navbat-application.test.tsx`** (M5); стенд `g45-screens.spec.ts` | unit, stand |
| Сокет ленты (`feed-provider.tsx`) | POST /feed/ticket, GET /feed/socket | нет | экраны обновляются | `feed.test.tsx`; e2e `realtime.spec.ts` | unit, e2e |

## Где тестов мало

- `openComplaint` и `answerRefund`: только `unit`. G89 добавил гонку открытия и решения (`complaint-races.test.ts`) и неизвестную жалобу (`complaints/missing.test.ts`).
- Cron `showTeamQueue`: проверен только косвенно, через `navbat-api.test.ts`.
- Cron команды (`sendDaySummary`, `checkStatsAlerts`, `purgeSupport`, `tellOpenedDirections`): только `unit`. G89 добавил сбой итога дня (`assignments.test.ts`, A13) и двойной звонок (`waitlist/team.test.ts`, A12).
- Ответ поддержки (`answerCase`): один файл `support-case-api.test.ts`. G89 добавил очередь вопросов в D1: `d1-support.test.ts` (A3).
- Экраны без стенда: переключатель звонков и готовый ответ в шторке. G89 добавил `api` готовому ответу (`chat-closed-api.test.ts`, U10) и гонку переключателю (`request-calls.test.ts`).
- Коды ошибок экранов не проверялись. G89 добавил барьер: `api-error-codes.test.ts` (U11).
