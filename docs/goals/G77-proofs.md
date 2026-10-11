# G77: доказательства по пунктам

> **Кратко:** у каждого пункта цели G77 (`G77-transitions-and-one-code.md`) путь к коду и тест (урок №224). Тест исправления падает на старом коде; у чистки кода без смены поведения доказательство: кода нет, старые тесты зелёные, `knip` в CI.

| Пункт | Код | Тест (падает на старом коде) |
|---|---|---|
| О1 | `packages/ui/src/home/dock/driver-state.ts` (`pointStates` и после выезда), `home/dock/driver-road-card.tsx` (следующая точка посадки, «Men keldim»), `home/dock/trip-actions.ts` (`cameAll`), `bookings/driver-trip-map.tsx` (точки посадки в пути) | `home/dock/driver-state.test.ts` «leads the points on the way too»; `home/driver-dock-links.test.tsx` «on the way the next point to pick up comes first»; `bookings/driver-trip-map.test.tsx` «on the way keeps the points to pick up» |
| О2 | `packages/ui/src/market/my-requests-screen.tsx` («Qayta yuborish» через концы, без дня) | `mine/passenger-mine.test.tsx` «counts the seat and both requests» (день, «Назад» к дню) |
| О3 | `packages/ui/src/bookings/passenger-open.tsx` (`cancelRequest` с вопросом), ключ `market.request.cancelAsk` | `bookings/my-request.test.tsx` «while waiting: … the cancel at the bottom»; `market/my-lists.test.tsx` |
| A1 «Назад» по ссылке | `market/my-requests-screen.tsx`, `market/my-trips-screen.tsx` (метка `home`), `market/bookings-link.tsx` | `market/bookings-link.test.tsx`: `?booking=`, `?mytrip=`, `?request=` назад одним нажатием; стенд `all-driver` «da20» |
| A2 шторки | `sheet/sheet-back.tsx` в `ActionSheet`, `BoardSheet`, `OtherCarSheet`, `FormSheet`; `requests/offer-draft.ts` | `sheet/sheet-back.test.tsx`; `requests/board-sheets.test.tsx` «Назад closes the sheet on the board» |
| A3 «Bosh sahifa» | `bookings/pending-booking.tsx` (`useGoHome`) | `flow/home-context.test.tsx` «Bosh sahifa of a sent seat» |
| A4 «Profil» → «Mashina» | `driver/driver-gate.tsx` и общий `telegram/kept-behind.tsx` | `driver/car-back.test.tsx` |
| A5 «Hamyon» | `wallet/wallet-flow.tsx` (`KeptBehind`) | `wallet/wallet-back.test.tsx` |
| B1 `?open=` | `flow/start-flow.tsx` (`useLinkOpened`) | `flow/start-flow.test.tsx` «opens a section at once by the link» |
| B2 звонок бота | `contracts` `CALL_LINK`, `passenger-card.ts`, `ask-card.ts`, `chat/chat-link.tsx` | `chat/chat-link.test.tsx` «📞 Qoʻngʻiroq of a bot rings at once» |
| B3 первое предложение | `action-sheet/kinds/offer-items.tsx` (первое пришедшее), `action-sheet/action-sheet.tsx` (не закрывается до списков) | `action-sheet/passenger-offer-sheet.test.tsx` «the ring of the first offer»; `action-sheet/action-sheet.test.tsx` «a bot link opens the sheet» |
| B4 ссылки без отправителя | `market/bookings-link.tsx`: у попутчика нет `?offer=`, у водителя нет `?booking=` | `market/bookings-link.test.tsx`; стенд: `?mytrip=` (`all-driver`, `g63`), `?request=` (`all-passenger`, `g64`), `?sheet=` (`all-driver` «da51») |
| B5 админка | `team/team-home.tsx`, `team/navbat-section.tsx`, `team/diqqat-section.tsx` (`WALLETS_SECTION`), `apps/miniapp-admin` `start-page.tsx`, `stats/stats-screen.tsx` | `apps/miniapp-admin/.../start-page.test.tsx` (ошибка, «Hamyonlar», `?stats=`); `team/team-home.test.tsx` (фильтр) |
| C1 принять предложение | `bookings/use-answer-offer.ts` (событие, обновляет общие списки) в `action-sheet/kinds/offer-items.tsx`, `bookings/passenger-open.tsx`, `talk/talk-offer.tsx`, `talk/call-talk.tsx`; в чате место открывается через `market/app-link.ts`; в звонке разговор идёт дальше, место в строке поездки чата | `action-sheet/passenger-offer-sheet.test.tsx` «Qabul qilish … opens the seat»; `talk/chat-talk.test.tsx` «lets them take the offer right here» (событие и место) |
| C2 предложить поездку | `requests/use-trip-offer.ts` в `requests/board-screen.tsx` и `talk/talk-action.tsx`; салон из чата открывает «Mening safarim», как с доски | `talk/chat-talk.test.tsx` «counts the offer of the chat…», «opens the trip from a whole car request in the chat» |
| C3 ответ водителя в шторке | `action-sheet/kinds/request-items.tsx` через `bookings/use-answer-booking.ts` | чистка: `action-sheet/driver-request-sheet.test.tsx` (4 теста) зелёные |
| C4 «Oʻxshash safarlar» | `bookings/similar-trips.ts` (`similarDay`) для блока и страницы брони | `home/home-outcome.test.tsx` «shows the refused seat and finds other trips of its way» (день поездки) |
| C5 «Hisobni toʻldirish» | `wallet/wallet-screen.tsx`, `wallet/top-up-link.ts`; `TopUpScreen` и `start=topup` бота удалены | `wallet/wallet.test.tsx` «shows the sum…»: поддержка с готовым текстом, без экрана между |
| C6 чат из блока | `chat/open-chat.ts`, `chat/chat-link.tsx` (`onTrip`), `home/dock/seat-actions.ts`; `TRIP_TALK` удалён | `chat/chat-link.test.tsx` «the line of the trip opens what the opener names»; `home/home.test.tsx` «calls the driver from the card» |
| C7 «Men keldim» | `meeting/use-came.ts` в `bookings/meeting-card.tsx` и `home/dock/seat-actions.ts` | чистка: `bookings/meeting-card.test.tsx`, `home/home.test.tsx` зелёные |
| D1 мёртвый код | удалены: старая ветка главного (`flow/home-screen.tsx`, `flow/home-tile.tsx`, `home/home-items.ts`), `account/face-notice.tsx`, `home/home-note.tsx`, `comfort/favorite-cell.tsx`, `useList`, `bookings/use-trip-steps.ts` | поиск по именам пуст; `knip` в CI |
| D2 повторы | `market/error-text.ts` (`isStale`), `telegram/support-link.ts` (`useOpenSupport`), `wallet/signed.ts`, `bookings/use-seat-steps.ts`; `HOUR_MS`, `DAY_MS`, `MINUTE_MS` из `@platform/contracts` | чистка: тесты зелёные, `knip` |
| D3 CSS | `.time-cell` в `market/when-sheet.css`, `.trip-card-who` в `market/market.css`, `.seats-stepper` один раз | снимки до и после: отличия только там, где вид шёл от чужого CSS; после совпадает с макетами g75/3 и g61; владелец согласовал вид 11.10.2026 |
| D4 одна загрузка | `market/my-trips-lists.ts`, `home/passenger-data.tsx`, `home/driver-data.tsx` (`useShared…`), `market/asked-seat.ts`; `home/fresh-lists.ts`: экран тихо обновляет те же списки при открытии, ссылка ждёт свежих (урок №230) | `market/shared-lists.test.tsx` (5 тестов: списки главного видны сразу; новая поездка и новая заявка видны) |
| E1 «сейчас» при отправке | `market/trip-on-route.tsx` (`useNow`, `sending`), `market/trip-form.tsx`; `requests/time-chips.tsx` (`sending`) для `offer-sheet.tsx` и `salon-sheet.tsx` | `market/new-trip.test.tsx` «takes now at the tap of Eʼlon qilish»; `requests/board-sheets.test.tsx` «takes now at the tap» |
| E2 стенд в любой час | `e2e/test-clock.ts` (`standClock`: у стенда браузер на часах стенда), `e2e/shift-date.ts`, `scripts/stand/stand-hour.mjs`, `shift-clock.mjs`, `shifted-worker.mjs`, `workerd-real.sh`, `check.mjs --at` (уроки №231, №232) | `scripts/stand/stand-hour.test.mjs`, `areas.test.mjs`; кусок стенда «по времени» (16 файлов) зелёный в 23:25, до исправления 8 … 10 падений; полный стенд `--at 23:30` 151 из 151 за 216 с (11.10.2026). Первый полный прогон нашёл будильник Durable Object (урок №237) |

## Находки независимого агента (F2, 11.10.2026) и что сделано

| № | Находка | Код | Тест (падает на старом коде) |
|---|---|---|---|
| 1 | «Hamyon» → строка попутчика открывала список, не бронь | `market/my-trips-screen.tsx` (`BOOKING_LINK`) | `wallet/wallet-back.test.tsx` «the row of the passenger opens that booking» |
| 2, 4 | После своего шага главный экран, «Suhbatlar» показывали старые списки | `home/passenger-home.tsx`, `home/driver-home.tsx`, `chats/role-chats.tsx` (`useFreshLists`); обновление до выхода домой в `my-requests-screen.tsx`, `my-trips-screen.tsx` | `home/home-fresh.test.tsx` |
| 3 | Принятие в чате не открывало место | `market/app-link.ts`, `launch-links.tsx`, `chat/chat-link.tsx`, `chat/chat-screen.tsx` | `talk/chat-talk.test.tsx` |
| 5 | Время при нажатии молча подменялось | `own-trip/use-now.ts` (`useClock`), `market/trip-form.tsx`, `requests/time-chips.tsx` (`TOO_SOON`) | `market/new-trip.test.tsx`, `requests/board-sheets.test.tsx` «… is chosen again» |
| 6 | «Bosh sahifa» из брони по ссылке вела назад, не домой | `market/bookings-link.tsx` (`HomeProvider`) | проверено чтением кода |
| 7 | Обработчики без отправителя: `?trip=` попутчика, `?application=` админки | `market/trip-link.tsx`, `navbat/linked-case.ts`; e2e и стенд открывают настоящим путём (`e2e/apps.ts` `openApplication`) | `market/link-once.test.tsx`, `apps/miniapp-admin/.../start-page.test.tsx` |
| 8 | Остатки CSS и копии `MINUTE_MS` | `home/home-note.css`, `navbat/complaint-words.tsx`, `bots/support-bot.ts` | `knip`, тесты зелёные |
| 9 | Отмена только что отправленного места другая; чат водителя без строки поездки | `bookings/use-cancel-seat.ts`; строка поездки по умолчанию ведёт к брони | `bookings/sent-seat.test.tsx` |
| 10 | «Yoʻl xaritasi», «Baho berish» из блока: «Назад» в два нажатия | `own-trip/own-trip-live.tsx`, `own-trip/own-trip-flow.tsx` | `own-trip/start-back.test.tsx` |
| 11 | «Внимание» блока под формой заявки | `home/dock/use-attention.ts` (`useBehind`) | `home/dock/use-attention.test.tsx` «waits while a screen stands over the block» |
| 9 | «Javob berish» бота открывает чат, звонок отвечается вторым нажатием | оставлено: ответ по ссылке требует новой ссылки, шаг в G79 | |
| 12 | Экраны водителя по ссылке бота без `DriverContext` (старое): «Qaytish» по ссылке публиковал машину на 1 место, отклонённый водитель видел поездки | по решению владельца 11.10.2026 исправлено в G77: `DriverGate` стоит выше ссылок бота (`mount-app.tsx`, `driver/driver-gate.tsx` с `enabled`) | `mount-app.test.tsx` «a bot link of a driver opens behind the gate of the driver» |

## Повторная проверка агентом (F2, 11.10.2026) и что сделано

Старых ошибок `168` часть B агент не нашёл. Новые находки:

| № | Находка | Код | Тест (падает на старом коде) |
|---|---|---|---|
| A | Ответ в чате или звонке поверх приложения оставлял главный экран старым | `home/fresh-lists.ts`: списки обновляются, когда экран над ними закрывается | `home/fresh-lists.test.tsx` |
| B | Чаты внутри экранов падали на общий путь «поверх приложения»: мёртвое нажатие, «Назад» домой | общий путь только у чата поверх приложения (`market/app-link.ts`); свои пути: `bookings/passenger-open.tsx`, `requests/requests-flow.tsx`; у водителя строка поездки ведёт назад (`own-trip-live.tsx`, `driver-booking.tsx`, `past-trip-flow.tsx`); `market/bookings-link.tsx`: новая ссылка открывает свой экран, «Назад» забывает все | `bookings/offer-chat.test.tsx`, `requests/board-chat.test.tsx`, `market/bookings-link.test.tsx`, `trip-end/past-trip.test.tsx` |
| C | Неудачная первая загрузка списков не повторялась | `home/fresh-lists.ts` | `home/fresh-lists.test.tsx` |
| D | Карта блока → встреча → чат: «Назад» вёл на страницу поездки, не на карту | `own-trip/own-trip-live.tsx` | `own-trip/start-back.test.tsx` |
