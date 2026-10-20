# 206. G89: карта цепочек: поездки, цены, брони

> **Кратко:** карта входов поездок, цен, пятаков, мест, каналов, брони, предложений и встречи: вход → use case → таблицы D1 → побочные действия. У каждой цепочки указаны тесты и их уровень. Карта сделана в G89 20.10.2026.

**Как читать:**

- `unit`: use case над памятью или тестовой D1; тест экрана в `packages/ui` тоже `unit`.
- `api`: весь Worker над тестовой D1.
- `stand`: стенд Playwright (`docs/75`).
- `e2e`: Playwright по `e2e/*.spec.ts`, API подменён.
- **Жирный** тест: G89 добавил в него случай этой цепочки. В скобках код находки (`213`, `214`).

## Поездка водителя

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| POST /driver/trips | `publishTrip` (`publish.ts`) | `trips` (UPSERT) | `changed('published')`: карточка водителя, доски дня, `endOffersOfNewTrip`, посты каналов через очередь, подписчики маршрута, фанаты водителя | `trips-api.test.ts`, `trips/use-cases.test.ts`, **`publish-rules.test.ts`** (T8), **`d1-progress.test.ts`** (T8), `my-trips-limit.test.ts`, `one-at-a-time-api.test.ts`; стенд `driver-market.spec.ts` | unit, api, stand |
| GET /driver/trips, GET /driver/schedule | `myTrips` (`read.ts`), `driverSchedule` (`schedule.ts`) | нет | нет | `trips/use-cases.test.ts`, `trips-api.test.ts`, `schedule.test.ts`, `one-at-a-time-api.test.ts` | unit, api |
| POST /driver/trips/:id/time | `retimeTrip` (`change.ts`) | `trips` (UPSERT, статус пишется заново) | `changed('retimed')`: карточка водителя, доски, правка постов, попутчики и их близкие, семья водителя | **`change.test.ts`** (T7), **`d1-progress.test.ts`** (T7), `trips/domain/trip-change.test.ts`, **`bookings/trip-change.test.ts`** (T13), **`channels.test.ts`** (T1); стенд `trip-changes.spec.ts` | unit, api, stand |
| POST /driver/trips/:id/price | `lowerTripPrice` (`change.ts`) | `trips` (UPSERT) | `changed('cheaper' или 'updated')`: правка постов, подписчики маршрута раз в день | **`change.test.ts`** (T7), **`subscriptions-api.test.ts`** (T10), **`hidden-news-api.test.ts`** (B15); стенд `trip-changes.spec.ts` | unit, api, stand |
| POST /driver/trips/:id/cancel | `tripCancelWatch` → `cancelTrip` (`read.ts`) | `trips` (условно), `bookings`, `wallet_operations` (возврат), `offers` (expired) | `changed('updated')`: карточка, доски, посты правятся и удаляются, семья водителя; по каждой брони: карточка попутчика, `tripChanged` | `trips-api.test.ts`, `bookings/use-cases.test.ts`, `bookings-api.test.ts`, `meeting-api.test.ts`, `departed.test.ts`, **`trip-ended.test.ts`** (T2), **`offers-ended.test.ts`** (T6); стенд `driver-market.spec.ts`, `g21.spec.ts` | unit, api, stand |
| POST /driver/trips/:id/depart | `departTrip` (`progress.ts`) | `trips.departed_at` (условно) | `changed('departed')`: заявки истекают, попутчикам сообщение, посты закрыты, сигналы ленты | `trip-progress-api.test.ts`, `progress.test.ts`, `d1-progress.test.ts`; стенд `g63.spec.ts` | unit, api, stand |
| POST /driver/trips/:id/arrive | `arriveTrip` (`progress.ts`) | `trips.arrived_at` (и `departed_at`) | `changed('arrived')`: карточки попутчиков, пост «Yetib bordi», сигналы ленты | как у depart | unit, api, stand |
| POST /driver/trips/:id/open | `openSalonTrip` → `openTrip` (`private-trip.ts`) | `trips` (`for_request` null) | `changed('published')` | `private-trip.test.ts`, `trip-offers.test.ts`, **`salon-refusals.test.ts`** (неизвестная поездка); стенд `g64-salon.spec.ts` | unit, stand |
| POST /driver/requests/:id/trip | `offerSalonTrip` (`salon-trip.ts`) → `publishPrivateTrip` | `trips` (личная), `offers`, `request_talks` | карточка предложения, без канала | `trip-offers.test.ts`, `offers.test.ts`, **`salon-refusals.test.ts`** (все отказы); стенд `g64-salon.spec.ts` | unit, stand |
| GET /trips | `searchTrips` (`read.ts`) + `zoneWatch` | `users` (приглашение зоны) | приглашение зоны один раз | `trips-api.test.ts`, `d1-search.test.ts`, `zone-invite-api.test.ts`; стенд `passenger-search.spec.ts` | api, stand |
| GET /trips/directions, /trips/days | `directionCards`, `tripDays` (`trip-counts.ts`) | нет | нет | **`trip-counts.test.ts`** (T11); стенд `passenger-directions.spec.ts` | unit, stand |
| GET /trips/:id | `tripDetail` (`read.ts`) | нет | нет | `private-trip.test.ts`, `trip-preview-api.test.ts` | unit, api |
| POST /trips/:id/view, GET /driver/trips/:id/publicity | `recordView`, `tripPublicity` (`publicity.ts`) | `trip_views` | нет | `publicity.test.ts`, `publicity-api.test.ts`, `d1-trip-views.test.ts` | unit, api |
| GET /admin/trips | `teamTrips` (`read.ts`) | нет | нет | `team-and-prices.test.ts` | unit |
| POST /admin/trips/:id/cancel | `cancelTripByTeam` (`team-cancel.ts`) | `trips`, `bookings`, `wallet_operations`, `offers`, журнал команды | водителю причина, попутчикам сообщение | `team-cancel-api.test.ts` (один случай), **`trip-ended.test.ts`** (T5); стенд `g45-screens.spec.ts` | unit, api, stand |
| GET /driver/trips/month | `driverMonth` (`month.ts`) | нет | нет | `month.test.ts` | unit |

## Цены, пятаки, места

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| GET /prices/recommendation, GET /public/price | `recommendDirection`, `recommendPrice` (`recommend.ts`) | нет | нет | `pricing-api.test.ts`, `pricing/use-cases.test.ts` | unit, api |
| /admin/pricing (GET, POST, preview, rollback), /admin/pricing/directions (GET, PUT) | `changeVariables`, `rollback`, `setDirection` (`admin.ts`) | `pricing_versions`, ручные цены направлений | сброс кэша этого Worker | `pricing-api.test.ts`, `pricing/use-cases.test.ts`, `median.test.ts`, **`manual-bounds.test.ts`** (T9) | unit, api |
| /pitaks/direction, /admin/pitaks\*, /admin/pitak-directions\* | `pitakOfDirection`, `savePitak`, `saveDirection`, `removeDirection` | `pitaks`, `pitak_directions`, история пятаков | нет; с G89 поездка хранит пятак публикации (T8) | `pitaks-api.test.ts`, `pitaks.test.ts`, `d1-pitaks.test.ts` | unit, api |
| /locations, /locations/distance (GET, PUT), /admin/locations/distance/history | справочник, `getDistance`, `updateDistance` | поправки расстояний и их история | нет (новые км только для новых поездок) | `locations-api.test.ts`, `locations/use-cases.test.ts`, `d1-distance.test.ts` | unit, api |
| /public/company, /admin/company | `publicCompany`, `saveCompany` | `company_versions` | нет | `company-api.test.ts` | api |

## Каналы и Cron поездок

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| /admin/channels (GET, PUT, DELETE), /admin/channel-health | `allChannels`, `saveChannel`, `removeChannel`, `channelHealth` | `team_channels` | вызов `getChatMember` | `channels-api.test.ts`, `team-channels.test.ts`, `channel-health-api.test.ts` | unit, api |
| Очередь: пост канала отправлен | `rememberPost` (`channels.ts`) | `channel_posts` (здесь `depart_at`) | правка, если поездка изменилась | `channels.test.ts`, **`channel-post-once.test.ts`** (C9) | unit |
| Бронь подтверждена или отменена | `tripChanged` (`trips/index.ts`) | нет | карточка водителя, доски, посты | `channels.test.ts`, `bookings-api.test.ts` | unit, api |
| Cron `completeTrips` | `completeOverTrips` (`progress.ts`, новый в G89) → `completeOver` (`d1-trips.ts`) | `trips` completed (условно, RETURNING) | `changed('completed')` на каждую поездку; сбой одной не останавливает другие | `trips/use-cases.test.ts`, `index.test.ts`, **`complete.test.ts`**; стенд `system-cron.spec.ts` | unit, stand |
| Cron `watchLateDepartures` | `watchDepartures` (`departures.ts`) | ключи напоминаний; `trips.departed_at` через `departByCron` (без события) | бот водителя спрашивает один раз | **`departures.test.ts`** (C5), `driver-bot-api.test.ts` | unit, api |
| Cron `closeDepartedPosts` | `closeDeparted` (`channels.ts`) | `channel_posts.closed` | правка постов | **`channels.test.ts`** (T1), `post-life.test.ts` | unit |
| Cron `showChannelBoards` | `showBoards` (`board.ts`) | карточки ботов | правка досок | `channels/board.test.ts` | unit |
| Cron `sendChannelSummaries` | `sendSummaries` (`summaries.ts`) | карточки ботов (один раз) | карточки дня и недели | `summaries.test.ts` | unit |
| Cron `checkChannelHealth` | `checkChannels` (`health.ts`) | `channel_health`, `channel_days` | `getChatMemberCount`, `createChatInviteLink` | `channel-health.test.ts` | unit |
| Cron `keepTelegramLooks` | модуль looks | состояние looks | вызовы профиля Telegram | `cron-reads.test.ts` | unit |

## Бронь и встреча

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| POST /trips/:id/bookings | `requestBooking` (`request.ts`) | `bookings` (UPSERT), `ride_requests` (открытый запрос отменён) | строка чата `requested`, карточка попутчика, вопрос и звонок водителю; карточка запроса закрыта, его предложения закрыты | `bookings/use-cases.test.ts`, `races.test.ts`, `seat-choice.test.ts`, `bookings-api.test.ts`, `one-at-a-time-api.test.ts`, **`departed.test.ts`** (U2); e2e `bookings.spec.ts`; стенд `passenger-booking.spec.ts` | unit, api, e2e, stand |
| GET /passenger/bookings | `passengerBookings` (`request.ts`) | нет | счётчики непрочитанного | `bookings-api.test.ts` | api |
| POST /passenger/bookings/:id/cancel | `cancelByPassenger` (`request.ts`) | `bookings` (статус, точки стёрты), `wallet_operations` (возврат) | строка чата, близким `cancelled`, карточка, водителю «Komissiya qaytdi», посты (`tripChanged`), пара «Diqqat» | `bookings/use-cases.test.ts`, `races.test.ts`, **`pair-cancels.test.ts`** (B20), `departed.test.ts`, **`trip-ended.test.ts`** (M2), **`cancel-refusals.test.ts`** (отказы, гонка с водителем) | unit, api |
| GET /passenger/bookings/:id/riders | `coRiders` (`co-riders.ts`) | нет | нет | `co-riders-api.test.ts`, **`co-riders.test.ts`** (B7) | unit, api |
| POST /passenger/bookings/:id/came | `markProgress` came (`progress.ts`) | `bookings` (UPSERT) | звонок водителю `came` | `came.test.ts`, **`meeting.test.ts`** (B1), **`d1-seat-guards.test.ts`** (B9), **`progress-refusals.test.ts`** (отказы, гонка с отменой) | unit |
| POST /passenger/bookings/:id/arrived, бот `arrived:<id>:yes` | `markProgress` arrived, `answerArrived` (`arrived-answer.ts`) | `bookings` (UPSERT) | близким `arrived`, карточки, ссылка близких закрыта (бот), сигнал ленты | `arrived-ride.test.ts`, **`meeting-guards.test.ts`** (B1), **`d1-seat-guards.test.ts`** (B9), **`progress-refusals.test.ts`**, `arrived-ask-api.test.ts` | unit, api |
| GET /driver/bookings | `driverBookings` (`answer.ts`) | нет | нет | `bookings-api.test.ts` | api |
| GET /admin/trips/:id/bookings | `teamTripBookings` (`answer.ts`) | нет | нет | только вызов в `bookings-api.test.ts` (нет телефонов) | api |
| POST /driver/bookings/:id/confirm, бот `ask:<id>:yes` | `confirm` (`answer.ts`), `answerFromBot` (`bot-answer.ts`) | `bookings` (`CONFIRM_WITHIN`), `wallet_operations` (комиссия, следующий бонус) | строка чата, попутчику `confirmed`, карточка водителя, посты, «Hamyon» о малом остатке, бот `noMoneyLeft` | `bookings/use-cases.test.ts`, `races.test.ts`, `driver-bot-api.test.ts`, **`driver-money-api.test.ts`** (M1), **`d1-seat-guards.test.ts`** (T3, B4), **`trip-ended.test.ts`** (B3), **`burn-race.test.ts`** (M15) | unit, api |
| POST /driver/bookings/:id/decline, /cancel, бот `ask:<id>:no` | `answer` (`answer.ts`) | `bookings`, `wallet_operations` (возврат) | строка чата, звонок попутчику, близкие, пара «Diqqat», аналитика `declined` | `bookings/use-cases.test.ts`, `departed.test.ts`, `meeting-guards.test.ts` | unit, api |
| POST /driver/bookings/:id/came, /met, /no_show | `markMeeting` (`meeting.ts`) | `bookings` (`markOnce`), `complaints` (no_show) | звонок попутчику, близким `boarded`, сигнал ленты | `meeting.test.ts`, **`meeting-guards.test.ts`** (B16), `no-show-rides.test.ts`, `meeting-api.test.ts`; стенд `g63.spec.ts` | unit, api, stand |

## Предложения, запросы, подписки

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| POST /driver/requests/:id/offers | `sendOffer` (`offers.ts`) | `offers`, `request_talks` | строка чата `offered`, звонок по карточке запроса | `offers.test.ts`, `trip-offers.test.ts`, `offer-limit.test.ts`, `offers-api.test.ts` | unit, api |
| GET /driver/offers, GET /passenger/offers | `driverOffers`, `passengerOffers` (`offers.ts`) | нет | нет | **`offers.test.ts`** (B6), **`offer-marks.test.ts`** (B6) | unit |
| POST /passenger/offers/:id/accept | `acceptOffer`, `acceptTaken`, `acceptOnTrip` (`accept.ts`) | `offers`, `trips` (публикация или освобождение), `bookings`, `wallet_operations`, `ride_requests` (matched) | звонок водителю, карточка попутчика, `published`: каналы, подписчики, фанаты; другие предложения закрыты | `offers.test.ts`, **`trip-offers.test.ts`** (B18), **`d1-seat-guards.test.ts`** (B18), **`offer-marks.test.ts`** (T12), `races.test.ts`, `offers-api.test.ts`, **`offer-last-hour-api.test.ts`** (B2) | unit, api |
| POST /passenger/offers/:id/decline | `declineOffer` (`accept.ts`) | `offers` (с G89 не пишет поверх принятого, U9) | сообщение боту водителя, строка чата | **`offers.test.ts`** (U9) | unit |
| POST /driver/requests/:id/talk | `openTalk` (`talks.ts`) | `request_talks` | пара «Diqqat» | **`talks.test.ts`** (U7), `pair-talks.test.ts`, `talks-api.test.ts` | unit, api |
| /passenger/requests (GET, POST), /:id/cancel, /:id/calls | `publishRequest`, `cancelRequest`, `setRequestCalls` (`use-cases.ts`, `calls.ts`) | `ride_requests` (с G89 запись только пока запрос открыт) | карточка запроса, подписанные водители, предложения закрыты | `ride-requests/use-cases.test.ts`, **`request-calls.test.ts`** (гонка с принятием), **`d1-requests.test.ts`**, `one-at-a-time-api.test.ts`, **`subscriptions.test.ts`** (B17); стенд `passenger-requests.spec.ts` | unit, api, stand |
| GET /driver/requests/board, GET /driver/requests | `requestBoard`, `searchRequests` | `request_views` (после ответа) | нет | `ride-requests/board.test.ts`, `request-views.test.ts`, `search-fit.test.ts` | unit |
| /passenger/subscriptions, /driver/subscriptions (GET, POST, DELETE, renew) | `manage.ts` | `route_subscriptions` | нет | **`subscriptions.test.ts`**, **`subscriptions-api.test.ts`** | unit, api |
| /passenger/favorites (GET, PUT, DELETE) | `favorites.ts` | `favorite_drivers` | фанаты слышат новые поездки | `comfort-api.test.ts` | api |
| GET /passenger/history, /driver/history, /passenger/standing, /driver/standing | `historyOf`, `standingOf` | нет | нет | `comfort-api.test.ts`, `standing.test.ts`, `standing-api.test.ts` | unit, api |

## Cron и события брони

| Вход | Цепочка | База | Побочные действия | Тесты | Уровень |
|---|---|---|---|---|---|
| Cron `expireBookings` | `expireRequests` (`expire.ts`) | `bookings` (EXPIRE RETURNING) | попутчику `expired`, карточка вопроса водителя | `bookings/use-cases.test.ts`, `expire-retry.test.ts`, `server-steps.test.ts` | unit |
| Cron `expireRequests` | `ride-requests/index.ts` | `ride_requests` | карточка запроса, предложения закрыты | `request-card-api.test.ts` | api |
| Cron `endSubscriptions` | `endOverdue` (`notify.ts`) | `route_subscriptions` (с G89 только если срок не менялся) | сообщение о продлении | **`subscriptions.test.ts`** (продление сохраняется), **`d1-expire.test.ts`** | unit |
| Cron `erasePastPoints` | `erase.ts` | `bookings` (точки null) | нет | `erase.test.ts` | unit |
| Cron `settleSeats` (новый в G89, раз в час) | `settleBookings` (`settle.ts`): чинит отмену, сломанную на середине | `bookings`, `wallet_operations` (возврат один раз) | сообщение попутчику | **`trip-ended.test.ts`** (T2, M6), **`d1-seat-guards.test.ts`** (M6), **`d1-progress.test.ts`** (T2) | unit |
| Событие `departed` | `expireTripRequests` (`expire.ts`) | `bookings` | звонки попутчикам | `departed.test.ts` | unit |
| Событие `published` | `endNewTripOffers` (`offers-ended.ts`) | `offers` | бот водителя «предложение истекло» | **`offers-ended.test.ts`** (T6, B21) | unit |
| Событие `retimed` | `tellTripRetimed` (`trip-change.ts`) | с G89 сроки ожидающих броней и предложений (T13) | звонок попутчику, близкие | **`bookings/trip-change.test.ts`** (T13, B14) | unit |
| Блок, удаление аккаунта | `cancelEverything` (`cancel-all.ts`) | `trips`, `bookings`, `wallet_operations`, `ride_requests`, `offers` | обычные звонки | `cancel-all.test.ts`, `block-api.test.ts`, `account-deletion-api.test.ts`, **`trip-ended.test.ts`** (T4), **`pair-cancels.test.ts`** (B20) | unit, api |
| `seat-events.ts` | `heldSeatOf` для новых запросов | нет | нет | `one-at-a-time-api.test.ts` | api |

## Где тестов мало

- `teamTripBookings`: аудит не нашёл теста. Есть только вызов в `bookings-api.test.ts` с проверкой, что нет телефонов.
- Отмена командой: в `api` один случай (подтверждённое место). G89 добавил `unit` с ожидающей заявкой и начатой встречей (`trip-ended.test.ts`, T4, T5).
- Подтверждение без денег: не было теста отката в D1. G89 закрыл: `d1-seat-guards.test.ts` (B4).
- Не было нужного случая: снижение цены без `api`, `coRiders` без случая после поездки. G89 добавил `subscriptions-api.test.ts` (T10), `hidden-news-api.test.ts` (B15), `co-riders.test.ts` (B7).
- Cron `completeTrips`: сбой одной поездки отнимал события у остальных, теста не было. G89 закрыл: `complete.test.ts`.
- Один уровень: только `unit` у Cron каналов, `declineOffer`, `endSubscriptions`, `erasePastPoints`, `settleSeats`; только `api` у Cron `expireRequests` и избранного. К `endSubscriptions` G89 добавил гонку с продлением в D1: `d1-expire.test.ts`.
