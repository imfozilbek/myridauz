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

Пути `home/…`, `market/…` и подобные: в `packages/ui/src`. Каждый тест проверен на старом коде: код без теста вернули к коммиту до пункта, тест упал.
