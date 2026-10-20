# 207. G89: карта цепочек: деньги, чат, звонки, боты

> **Кратко:** карта входов кошелька, возвратов, регистрации, людей, чата, звонков, близких, ленты, ботов и вебхука каналов: вход → use case → таблицы D1 → побочные действия. У каждой цепочки указаны тесты и их уровень. Карта сделана в G89 20.10.2026.

**Как читать:**

- `unit`: use case над памятью или тестовой D1; тест экрана в `packages/ui` тоже `unit`.
- `api`: весь Worker над тестовой D1.
- `stand`: стенд Playwright (`docs/75`).
- `e2e`: Playwright по `e2e/*.spec.ts`, API подменён.
- **Жирный** тест: G89 добавил в него случай этой цепочки. В скобках код находки (`213`, `214`).

## Доступ и аккаунт

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| Подпись (каждый подписанный путь) | `telegramAuth`, `verifySignedParams` (24 ч, `telegram-auth.ts`) | нет | сессия: app, user, `isAdmin`, `teamRole` | `users-api.test.ts` (чужой бот, старая, поддельная), `team-only-api.test.ts`, `verify-signed-params.test.ts` | unit, api |
| `blockedGuard` (`/driver/*`, `/admin/*`, `/me/*` кроме GET /me, `/users/*`) | `access-guard.ts` | нет | 403 `users.blocked`, исключение для поездки в пути | `block-api.test.ts`, `block-riding-api.test.ts` | api |
| Лимит частоты | `rate-limit.ts` | нет | 429 | `rate-limit-api.test.ts` | api |
| GET /me | `getMe` | `telegram_names` | нет | `users-api.test.ts`, `block-api.test.ts`, `account-deletion-api.test.ts`, **`users/use-cases.test.ts`** (U13) | unit, api |
| POST /me/registration | `register` | `users` (UPSERT), `user_arrivals` | приглашение зоны (после регистрации) | `users-api.test.ts`, **`d1-faces.test.ts`** (M16); e2e `smoke.spec.ts` | unit, api, e2e |
| PUT /me/avatar | `setAvatar` + `avatarWatch` → `avatarChanged` | `users`, R2, `driver_applications` | карточка фото в боте админки, «Navbat», заявка водителя снова `pending` | `faces-api.test.ts`, `drivers-api.test.ts`, `application-final-api.test.ts`, **`d1-faces.test.ts`** (блок не снимается) | unit, api |
| POST /me/write-access | `setWriteAccess` | `users.write_access` | нет | `users-api.test.ts`, **`d1-faces.test.ts`** | unit, api |
| DELETE /me | `deleteAccount` + `account-deletion.ts` | `bookings`, `trips`, чаты DO, избранное, подписки, оценки, `wallet_operations` (`account_deleted`), `held_phones`, `users` (стирание) | сообщения ботов второй стороне живых броней | `account-deletion-api.test.ts`, `deletion-evidence-api.test.ts`, **`team-api.test.ts`** (M3), **`sql-messages.test.ts`**, **`chat-unread-api.test.ts`** (C11) | unit, api |
| GET /users/:id, /users/:id/avatar | `getPublicProfile`, `readAvatar` | нет | нет | `users-api.test.ts`, `faces-api.test.ts` | api |

## Водитель, фото, команда

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| /driver/application (GET, POST), фото (PUT, GET) | `myApplication`, `submitApplication`, `uploadCarPhoto` | `driver_applications`, R2, `users` (`setDriver`) | карточка команде, «Navbat» | `drivers-api.test.ts`, `car-change-api.test.ts`, `application-final-api.test.ts` | api |
| GET /admin/applications (/:id, /photos) | `queue`, `applicationFor`, `applicantPhoto` | нет | нет | `drivers-api.test.ts`, **`drivers/missing.test.ts`** (нет заявки или человека) | unit, api |
| POST /admin/applications/:id/decision | `decideApplication` | `driver_applications` (с G89 условно, M5), `driver_decisions`, `users`, `wallet_operations` (`bonus_grant` один раз: `grant_no`, миграция 0083), `team_actions` | бот водителя с бонусом, «Navbat» | `drivers-api.test.ts`, `application-final-api.test.ts`, **`d1-decide.test.ts`**, **`decision-race.test.ts`** (M5), **`promo.test.ts`** (M4), **`grant-once.test.ts`**, **`drivers/missing.test.ts`**, **`navbat-application.test.tsx`** (M5) | unit, api |
| GET /admin/faces, фото, POST decision | `pendingFaces`, `facePhoto`, `decideFace` | `users`, `face_log`, `team_actions` | отказ человеку | `faces-api.test.ts`, **`face-guard.test.ts`**, **`d1-faces.test.ts`** (A8, M8), **`telegram-faces.test.ts`** (M7) | unit, api |
| Кнопки фото в боте админки | `onFaceButton` → `decideFaceOf` | `users`, `face_log`, `team_actions` («Jurnal», как из приложения, M14) | правка подписи | **`face-bot.test.ts`** (M10, M14), `admin-bot.test.ts` | unit |
| GET /admin/people/:id (/activity, /telegram) | `personRoutes`, `telegramRoutes` | нет | нет | `people-api.test.ts`, `telegram-names-api.test.ts` | api |
| POST /admin/users/:id/block, /unblock, GET /blocks | `blockPerson`, `unblock`, `blockJournal` | `users`, `blocked_phones`, `block_log`, `bookings`, `trips`, `offers`, запросы, `wallet_operations` (возвраты), `team_actions` | сообщения ботов | **`block-api.test.ts`** (A6), `block-riding-api.test.ts`, **`d1-faces.test.ts`** (правка не снимает блок) | unit, api |
| GET /admin/me, /admin/me/work, /admin/journal | `admin-routes`, `work-routes`, `journalRoutes` | нет | нет | `drivers-api.test.ts`, `journal-api.test.ts` | api |
| /admin/team (GET, POST, DELETE) | `teamRoutes`, `changeModerator` | `team_members`, `team_actions` | нет | **`team-api.test.ts`** (M3, M10) | api |
| GET /admin/limits, PUT /admin/limits/:key, GET /public/limits | `limitRoutes` | `owner_limits` (история) | кэш изолята `keepLimits` | `limits-api.test.ts`, `d1-limits.test.ts` | unit, api |

## Кошелёк

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| GET /driver/wallet, /driver/wallet/:operationId | `walletView`, `walletDetail` | нет | нет | `hamyon-api.test.ts`, **`driver-money-api.test.ts`** (M1), `hamyon.test.ts`, **`wallet-shown.test.ts`** (M11) | unit, api |
| GET /admin/wallets (/:driverId), POST adjust | `adminWallets`, `walletView`, `adjust` | `wallet_operations` (`admin_adjustment`) | сигнал ленты водителю | `owner-only-api.test.ts`, `wallet/use-cases.test.ts`, `adjust-form.test.tsx`, **`wallet-shown.test.ts`** (M12) | unit, api |
| Подтверждение (Mini App, бот `ask:yes`) | `confirm` → `wallet.charge` | `bookings` (`CONFIRM_WITHIN`), `wallet_operations` (комиссия, может `bonus_grant`) | попутчику «Joy tasdiqlandi», новость о малом остатке | `races.test.ts`, `bookings-api.test.ts`, **`wallet/use-cases.test.ts`** (M1), **`burn-race.test.ts`** (M15: после отказа записи списание читает снова), **`d1-seat-guards.test.ts`** (T3), **`free-seat.test.ts`** (комиссия 0: строки нет) | unit, api |
| Отмена (попутчик, водитель, поездка, команда, блок, удаление) | `answer` / `cancelByPassenger` → `wallet.refund` | `bookings`, `wallet_operations` (возврат) | сообщения ботов | `bookings-api.test.ts`, `team-cancel-api.test.ts`, `block-api.test.ts`, `bookings/use-cases.test.ts`, **`trip-ended.test.ts`** (M2, M6), **`free-seat.test.ts`** (комиссия 0) | unit, api |
| Владелец подтверждает возврат за неявку | `answerRefund` → `refundNoShow` | `complaints` (`refund_state`), `wallet_operations` (`admin_adjustment` + бронь) | сигнал ленты | `no-show-refund.test.ts`, `hamyon.test.ts`, **`refund.test.ts`** (A1) | unit |
| Cron `burnBonuses` (раз в час) | `burnExpired` (один INSERT … SELECT, 7 дней назад) | `wallet_operations` (`bonus_expired`) | нет | `wallet/use-cases.test.ts`, `burn-load.test.ts`, **`burn-race.test.ts`** (M15) | unit |
| Cron `warnBonusEnd` (раз в день, 00 UTC) | `warnBonusEnds` | `bot_cards` | карточка в боте водителя «бонус кончается» | `wallet-news.test.ts`, `cron-reads.test.ts` | unit |
| Cron `grantMissedBonuses` (раз в день) | `grantMissedWelcome` | `wallet_operations` (`bonus_grant` один раз: `grant_no`) | нет | `wallet/use-cases.test.ts`, **`promo.test.ts`** (M4), **`grant-once.test.ts`** (одобрение и Cron сразу) | unit |
| Cron `sendApplicationReminders` (каждый тик) | `remindWaiting` | `application_reminders` | звонок «Navbat» исполнителю, «Diqqat» владельцам | `application-reminders-api.test.ts`, **`assignments/reminders.test.ts`** | unit, api |

## Чат и звонки

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| POST /chats/:key/ticket | `chatMember` (`chat-member.ts`) → `signTicket` | нет | нет | `chat-api.test.ts`, **`block-riding-api.test.ts`** (C3), `room.test.ts`, **`offer-chat.test.ts`** (чат предложения до G64, ключ `o…`) | unit, api |
| GET /chats/:key/socket | `verifyTicket` → `chatMember` → `ChatRoom.fetch` → `joined` | `chat_unread` (DELETE) | история, вид звонка, звонок `read`; с G89 права на каждом событии, без прав закрытие 4403 (C1, C2) | `chat-api.test.ts`, `room.test.ts`, **`room-rights.test.ts`** (C1, C2); стенд `chat.spec.ts` | unit, api, stand |
| WS `send`, POST /chats/:key/messages | `received` → `sendText` → `maskContacts` → `store.add` → `tellOther` | DO `messages`, `notified`; `chat_unread` | рассылка, предупреждение, `contactAttempts` → `tellOwners`, сигнал ленты, звонок бота; POST в чат, куда писать нельзя: 403 (U10) | **`room.test.ts`** (C4), **`room-rights.test.ts`** (C1, C2), **`mask.test.ts`** (C6), `chat-flood.test.ts`, **`chat-ring-api.test.ts`** (C5, C11), **`chat-unread-api.test.ts`**, **`sheet-routes.test.ts`**, **`chat-closed-api.test.ts`** (U10); стенд `chat.spec.ts` | unit, api, stand |
| WS `call` / `track` | `callAction`, `callTrack` (`call-room.ts`) | DO `call_state`, `rings` | событие ленты `call`, бот: входящий и пропущенный, строка `missed_call`, будильник DO | `call.test.ts`, `talk-call.test.ts`, **`call-ends.test.ts`**, **`chat-ring-api.test.ts`** (C5); стенд `g54.spec.ts` | unit, api, stand |
| Будильник DO, `webSocketClose` | `callTimeout`, `callLeft` | DO `call_state` | приглашение, пропущенный, сбой | `call.test.ts`, **`call-ends.test.ts`** (сбой, конец до голоса, уход и таймаут в разговоре) | unit |
| GET /chats/unread | `lastUnread` | нет | нет | **`chat-unread-api.test.ts`** (C11), **`sheet-routes.test.ts`** (U10: без чатов, куда писать нельзя) | unit, api |
| GET /chats/:key/about | `chatAbout` | нет | нет | `chat-api.test.ts` | api |
| DO `/system`, `/history`, `/forget` | `systemEvent`, чтение для жалобы, `deleteAll` при удалении аккаунта | хранилище DO | рассылка | `room.test.ts`, `account-deletion-api.test.ts`, **`sql-messages.test.ts`** | unit, api |
| POST /calls/:key/ice, connect, pull, renegotiate | `canCall` → Realtime API | нет | сессии Realtime, TURN | `calls.test.ts`, `calls-ready.test.ts`, `chat-api.test.ts` | unit, api |

## Лента, близкие, истории

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| POST /feed/ticket, GET /feed/socket | `signTicket`, `UserFeed` | нет | нет | `feed-api.test.ts`; e2e `realtime.spec.ts` | api, e2e |
| `sendSignals`, `sendEvent` | `UserFeed /signal` | нет | WS `changed`, `call` | `feed-signals.test.ts`, `feed-api.test.ts` | unit, api |
| POST /passenger/bookings/:id/share, /driver/trips/:id/share | `createShare`, `createDriverShare` → `issueLink` | `trip_shares`, `driver_trip_shares` | `savePreparedInlineMessage` | `shares-api.test.ts`, `driver-share-api.test.ts`, `share.test.ts`, **`progress-refusals.test.ts`** (нет брони) | unit, api |
| POST …/share/stop | `stopSharing`, `stopDriverSharing` → `revoke` | ссылки, подписчики | нет | `shares-api.test.ts` | api |
| GET /shared/:token | `openShare` | нет | нет | `shares-api.test.ts`; стенд `after-ride.spec.ts` | api, stand |
| POST /shared/:token/follow | `follow` | `share_followers` | нет | `shares-api.test.ts`, **`d1-shares.test.ts`** (лимит близких); стенд `family.spec.ts` | unit, api, stand |
| `closeOnes` брони, события поездки | `tellFollowers`, `tellTripCancelled`, `tellTripRetimed` | отзыв ссылки при отмене | `notifyMass` близким | `shares-api.test.ts`; стенд `family.spec.ts` | api, stand |
| PUT /driver/trips/:id/story, GET /stories/:id | `saveStory`, `readStory` | R2 | нет | `stories-api.test.ts` | api |

## Боты и вебхуки

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| POST /telegram/:role (сообщение) | `noteBotMember`, `movedReply`, start, профиль, документы, без ответа, сообщения админки | `bot_blocks` | ответ вебхука | `webhook-routes.test.ts`, `webhook-errors.test.ts`, `main-bot.test.ts`, `profile-bot.test.ts`, **`notifications.test.ts`** (C8); стенд `bots.spec.ts` | unit, api, stand |
| Кнопка `arrived:<b>:yes/no` | `answerArrived` → `markProgress`, `closeBookingShare` | `bookings`, ссылки, подписчики | правка сообщения, лента | `arrived-ask-api.test.ts`; стенд `g46-trust.spec.ts` | api, stand |
| Кнопка `ask:<b>:yes/no` | `answerFromBot` → confirm / decline | `bookings`, кошелёк | карточки, лента | `driver-bot-api.test.ts`, `driver-bot.test.ts`; стенд `g68-bots.spec.ts` | unit, api, stand |
| Кнопка `news_off:<id>` | `stopFromBot` | подписки | правка кнопок | `subscriptions-api.test.ts`, `bot-teller.test.ts` | unit, api |
| Кнопка `rate:<b>:<n>` | `rateFromBot` → `rate` | `reviews` | правка сообщения | `ratings-complaints-api.test.ts`, **`d1-ratings.test.ts`**, **`ratings.test.ts`**; стенд `bots-team.spec.ts` | unit, api, stand |
| Кнопки бота админки | роль команды → ответ, история, фото | ссылки поддержки, фото | сообщения админки | `admin-bot.test.ts`, **`face-bot.test.ts`** (M10, M14), `support-buttons.test.ts` | unit |
| Сообщение в бот поддержки | `toSupport` → `recordSupport` → `forwardToTeam` | `support_messages`, ссылки поддержки | копии команде, «qabul qilindi» | `support-bot.test.ts`, `support-flood.test.ts`, `support-talk.test.ts`, **`d1-support.test.ts`** (A3) | unit |
| POST /telegram/setup, Cron `setupBots` | `configureBots`, `setupBotsWhenChanged` | `bot_setup` | `setWebhook` (с G89 ожидающие нажатия не сбрасываются), тексты, меню | `setup-routes.test.ts`, **`bot-setup-job.test.ts`** | unit, api |
| POST /telegram/poster | `heard`, `changed`, life | участники каналов, дни, реакции | счёт рекламы списка ожидания | `my-channels-api.test.ts`, `channel-week-api.test.ts` | api |

## Очередь и Cron доставки

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| Очередь: потребитель | `consumeNotifications` → `deliverNow` | `bot_cards`, `bot_pauses`, `bot_blocks`, `dead_notifications`, посты каналов | Telegram | **`notifications.test.ts`** (C8), `lanes.test.ts`, `dead-letter.test.ts`, `pace.test.ts`, `cards.test.ts`, **`channel-post-once.test.ts`** (C9) | unit |
| Очередь: задача `reminder` | `runReminderTask` → `tellReminder` | нет | карточка, звонок | `reminders/reminders.test.ts`, `reminders-api.test.ts` | unit, api |
| Cron `sendReminders` | `requestsPastHalf`, `remindTrips` | `trip_reminders` | задачи очереди, звонок `askAgain` | **`reminders/reminders.test.ts`** (C10), **`reminders-refused.test.ts`**, `reminders-api.test.ts`, `request-reminder-api.test.ts` | unit, api |
| Cron `watchLateDepartures` | `watchDepartures` | `trip_reminders`, `trips` | вопрос бота водителю | **`departures.test.ts`** (C5) | unit |
| Cron `askArrived` | `first` + звонок `arrivedAsk` | `trip_reminders` | звонок с кнопками | `arrived-ask-api.test.ts`; стенд `g46-trust.spec.ts` | api, stand |
| Cron `askForRatings` (часть бота) | `botAsker` | вопросы оценки | звонок под карточкой | `bot-asker.test.ts` | unit |
| Cron `forgetOldCards`, `purgeSupport` | DELETE | `bot_cards`, `bot_news`, `support_messages` | нет | `cards.test.ts`, `cron-reads.test.ts` | unit |
| Cron `postChannelWelcomes` | `take` → `sendPhoto` | `channel_welcomes` | посты каналов | `channel-welcome.test.ts` | unit |

## Где тестов мало

- Заявка водителя: решение и очередь были только `api`, без двух решений сразу. G89 добавил `unit` и D1: `d1-decide.test.ts`, `decision-race.test.ts` (M5), `grant-once.test.ts`, `drivers/missing.test.ts`.
- Возврат за неявку (`answerRefund`): только `unit`. G89 добавил случай попутчика: `refund.test.ts` (A1).
- Cron кошелька (`burnBonuses`, `warnBonusEnd`, `grantMissedBonuses`): только `unit`. G89 добавил гонки: списание и сгорание (`burn-race.test.ts`, M15), одобрение и бонус Cron (`grant-once.test.ts`).
- Будильник звонка DO и `webSocketClose`: был один файл `call.test.ts`. G89 добавил все концы звонка: `call-ends.test.ts`.
- Вебхук `POST /telegram/poster`: только `api`. Лента (`/feed/*`): `api` и один e2e `realtime.spec.ts`.
- Cron доставки (`watchLateDepartures`, `postChannelWelcomes`, `forgetOldCards`): только `unit`. G89 добавил тихую ночь: `departures.test.ts` (C5).
