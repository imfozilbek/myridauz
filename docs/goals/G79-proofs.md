# G79: доказательства по пунктам

> **Кратко:** у каждого пункта цели G79 (`G79-fewer-steps.md`) путь к коду, тест, который падает на старом коде (урок №224), и счёт нажатий до и после (`../170`). Вид экранов не меняется.

| Пункт | Код | Тест (падает на старом коде) | Нажатий |
|---|---|---|---|
| D1 ссылка поддержки в ботах | `apps/backend/src/bots/support-link.ts` (`supportUrl`) в `support-bot.ts`, `no-replies.ts` | `scripts/one-helper.test.mjs` «write the link of the support once in the bots» | не меняется |
| П1 «Safar topish» у открытой заявки | `home/dock/passenger-plan-cards.tsx` (`findTrip`: маршрут и день заявки) | `home/request-search.test.tsx` «opens the trips of its route on its day» | 3 … 5 → 1 |
| П2 «Назад» из «Safarlar» с маршрутом | `market/find-trip-flow.tsx` (`onBack` при известном маршруте) | `market/find-link.test.tsx` «opens the search at the day with the chosen route…» | 2 → 1 |
| П3 «Baho berish» блока | `home/dock/seat-actions.ts` (`rate`, `tripScreen: 'end'`), `market/my-requests-screen.tsx`, `bookings/passenger-booking.tsx` (`stars`) | `bookings/rate-at-once.test.tsx` (оба теста) | 2 → 1 |
| П5 пост канала через регистрацию | `find/kept-choice.ts`, `account/trip-preview.tsx` (`keepChoice`), `market/trip-link.tsx` (`takeChoice`) | `account/trip-preview.test.tsx` «…then books the seats chosen before» | 2+ → 0 |
| П10 вторая заявка на тот же день | `market/request-steps.tsx` (`openOn` по спискам главного), `market/existing-request.tsx` | `market/request-open-already.test.tsx` (оба теста) | 6 … 8 → 1 |
| П11 «Qayta yuborish» | `market/new-request-state.ts` (`RequestRepeat`), `market/my-requests-screen.tsx` (`repeat`) | `mine/passenger-mine.test.tsx` «sends an old request again with its people, price and car as they were» | до 4 → 0 |
| П14 отказ → «Soʻrov qoldirish» | `home/dock/passenger-seat-cards.tsx` (`day: similarDay`), `market/new-request-flow.tsx` (`day`) | `home/home-outcome.test.tsx` «leaves a request on the day of the refused trip» | 1 → 0 |
| П15 «Tuman tanlash» | `market/find-results.tsx` (район с `date`) | `find/find-district.test.tsx` «keeps the chosen day once a district is chosen» | 1 → 0 |
| П18 жёлтое «Rasm qoʻshing» | `home/home-side.tsx` (`openProfile('photo')`), `account/profile/avatar-picker.tsx` (`pick`) | `home/home-tiles.test.tsx` «…opens the choice of a photo in «Profil»» | 2 → 1 |
| П20, П21 концы блока | `home/dock-ends.ts` (`startFind`), `home/find-trip-button.tsx`, `find/find-start.tsx` и `places/route-screen.tsx` (`to`) | `home/block-ends-search.test.tsx` (4 теста) | 3 → 2 |
| «Javob berish» звонка из бота | `contracts/launch-links.ts` (`ANSWER_LINK`), `bookings/infrastructure/chat-ring-button.ts`, `chat/infrastructure/bot-signals.ts`, `ui/chat/chat-link.tsx` | `ui/chat/chat-link.test.tsx` «?answer=…», `backend/chat-ring-api.test.ts` (`answer=` у обеих ролей) | 2 → 1 |
| В4 «Qayerga» и ответы последней поездки | `home/dock/driver-launch.ts` (`useDriverLaunch`), `home/dock-ends.ts` (маршрут последней поездки, путь назад), `trip-end/return-plan.ts` (`tomorrowTrip`, один код с «Ertaga shu safar») | `home/driver-launch.test.tsx` (первые 2 теста) | ~9 → 2 |
| В6а «Kam» и «Siz haydovchisiz!» | `home/dock/driver-app-cards.tsx` (`launch`), `home/dock/driver-state-card.tsx` | `home/driver-launch.test.tsx` (тесты 3 и 4) | 6 → 1 … 2 |
| В7 доска: пустой день | `requests/requests-flow.tsx` (`BoardTrip`: маршрут доски, область спрашивается) | `requests/board-route-trip.test.tsx` (оба теста) | 6 → 1 |
| В8 экран маршрута | `places/route-screen.tsx` (`first`: первый пустой конец сразу) | `places/route-here.test.tsx` «opens «Qayerga» at once…» | +1 → 0 |
| В13 время прошлого предложения | `requests/offer-draft.ts` (`lastOfferTime`), `requests/time-chips.tsx` | `requests/offer-time-kept.test.tsx` | +1 → 0 |
| В15 правка без фото | `driver/application-flow.tsx` (сразу `send`), `driver/problem-note.tsx` (`photosReady`) | `driver/driver-problems.test.tsx` «…sends it at once when no photo is asked» | 2 → 1 |
| В16 одна фотография | `driver/driver-gate.tsx` (`'tap'`), `driver/steps/photos-step.tsx` (`shoot`) | `driver/fix-camera.test.tsx` | 2 → 1 |
| К3 «Diqqat» с 2+ людьми | `team/diqqat-section.tsx` (`whom`: один человек или список), `manage/people-screen.tsx` (`people`), `flow/start-action.ts` (`PersonName`) | `team/diqqat-people.test.tsx` (оба теста) | нет пути → 2 |
| К5 «Hamyonlar» | `wallet/team-wallets-screen.tsx` (поиск по имени и id), `wallet/driver-wallet.tsx`, `manage/person-view.tsx` (строка «Hamyon»), `wallet/adjust-form.tsx` (готовые причины, тексты одобрены владельцем) | `wallet/wallet-shortcuts.test.tsx` (3 теста) | ~8 → ~6 |
| К6 последнее дело «Navbat» | `navbat/navbat-screen.tsx` (`finished`: «Hammasi koʻrildi» 2 секунды, потом главный) | `navbat/navbat-finished.test.tsx` | 1 → 0 |
| К7 медиана цены | `pricing/direction-edit.tsx` (`MedianHint` с `onPick`) | `pricing/pricing.test.tsx` «takes the median…» | ввод → 1 |
| К8 имя пятака | `pitaks/pitak-edit.tsx` (пустое имя берёт имя места) | `pitaks/pitaks.test.tsx` «names a new pitak…» | ввод → 0 |
| К9 лимит степпером | `manage/limit-edit.tsx` (`Stepper`, кроме сумм) | `manage/manage-limits.test.tsx` (первый тест) | ввод → выбор |
| К10 «Назад» с галочек | `moderation/reasons-step.tsx` (без вопроса), `navbat/application-case.tsx` (галочки живут в деле) | `navbat/navbat-application.test.tsx` «…asks nothing and keeps them» | вопрос → 0 |

Пути `home/…`, `market/…` и подобные: в `packages/ui/src`. Каждый тест проверен на старом коде: код без теста вернули к коммиту до пункта, тест упал.

В15: экран фото пропускается только в исправлении по просьбе команды, когда фото не просили и все три есть. Водитель, который меняет машину, видит экран фото: снимки старой машины к новой не подходят, а сервер их сам не сбрасывает.
