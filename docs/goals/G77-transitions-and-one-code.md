# G77. Переходы и «одно действие: один код»

> **Кратко:** по глобальной проверке 10.10.2026 (`../168`, часть B) и проверке лишних шагов 11.10.2026 (`../170`, три ошибки): ошибки переходов, ссылок ботов и копий кода, которые ведут себя по-разному. Вид экранов не меняется (кроме места по уже утверждённому макету, отмечено). Решения владельца 11.10.2026: «Назад» с поездки, открытой из блока или бота, сразу на главный; ошибки `170` первыми. Оценка около 10 часов.

```text
G77. Переходы и «одно действие: один код»
(docs/168 часть B, docs/170 ошибки; решения владельца 11.10.2026)

Ветка goal/g77-transitions; PR частями: 0 (сразу в прод), A+B, C,
D+E+F.
Каждый пункт [x] только с доказательством: путь к коду и тест,
который падает на старом коде (урок №224). Тест кнопки и
перехода проверяет конечный экран и Telegram «Назад» (урок №225).

Definition of Done

0. Ошибки из docs/170 (первый PR, выкладка сразу)
[x] О1. Водитель после «Yoʻlga chiqdim» ведёт посадку по точкам,
    как на макете g76/3 состояние 12: «Men keldim», «Keldi»,
    «Kelmadi» в нижнем блоке и на карте, пока есть точка
    посадки; потом дорога и высадка. Попутчик видит «yoʻlda» до
    «Men keldim» водителя, как сейчас.
[x] О2. «Qayta yuborish» заявки: день можно выбрать, не всегда
    сегодня; «Назад» с точек ведёт к дню.
[x] О3. Отмена открытой заявки спрашивает, как отмена места
    (docs/65 B4); текст вопроса на согласие владельца.

A. «Назад» (люди)
[x] Поездка, бронь или заявка, открытая из нижнего блока или
    кнопкой бота: «Назад» сразу на главный (решение владельца
    11.10.2026). Открытая из списка: назад в список, как сейчас.
[x] Telegram «Назад» при открытой шторке закрывает шторку, а не
    Mini App: шторка действия, шторки доски заявок, «Boshqa ›»
    машины. На доске «Назад» не теряет набранное предложение.
[x] «Bosh sahifa» после отправленной брони ведёт на главный и из
    «Safar topish» пустого списка, «Oʻxshash safarlar», «Sevimli».
[x] «Profil» → «Mashina» → «Назад»: снова «Profil».
[x] «Hamyon» → подробно → поездка → «Назад»: снова подробно.

B. Ссылки ботов и админка
[x] ?open= забывается после открытия: чат или заявка водителя не
    открывают «Hamyon» и публикацию снова.
[x] «📞 Qoʻngʻiroq» бота сразу начинает звонок, «💬 Chat» только чат.
[x] Звонок о первом предложении открывает шторку и при двух
    предложениях на заявку.
[x] Обработчик ссылки без отправителя (бот, канал, лендинг)
    удалён; e2e проверяет ссылки, которые боты шлют на самом
    деле: ?mytrip=, ?request=, ?sheet=.
[x] Админка: ошибка загрузки команды: экран ошибки с «Qayta
    urinish», не пустой экран; фильтр «Navbat» не сбрасывается
    после дела; «Diqqat» деньги открывает «Hamyonlar»; ?stats=day
    назад в одно нажатие.

C. Одно действие: один код
[ ] Принять предложение: один хук для шторки, «Mening soʻrovim»,
    шторки предложения, чата и звонка; событие аналитики везде;
    после принятия везде открывается место.
[ ] Предложить поездку на заявку: один хук для доски и чата; в
    чате тоже шторка нехватки денег и событие offer_sent.
[ ] Ответ водителя в шторке заявки через useAnswerBooking.
[ ] «Oʻxshash safarlar»: один помощник, блок и страница брони
    дают один список.
[ ] «Hisobni toʻldirish» один путь: «Hamyon» тоже открывает
    поддержку с готовым текстом, как в макете g75/4 Б; старый
    экран TopUpScreen удалён (снимок владельцу).
[ ] Чат из блока попутчика через общий чат поверх приложения;
    раздел TRIP_TALK удалён; строка поездки в чате ведёт к месту.
[ ] «Men keldim» одним хуком для блока и карточки встречи.

D. Чистота кода (вид не меняется)
[ ] Мёртвый код: старая ветка главного экрана (ActionTile,
    covered, notice, useLive, opens, waitsApproval,
    paleUntilApproval), face-notice и home-note, favorite-cell,
    useList, nextTrips, lastTrip, againOf, waits; их тесты тоже.
[ ] Повторы: один isStale, один помощник ссылки поддержки, HOUR_MS
    и signed из общего места, два useTripSteps с разными именами.
[ ] Классы CSS .time-chip, .trip-card-name, .seats-stepper: одно
    имя в одном файле; снимки экранов до и после совпадают.
[ ] «Mening safarlarim» берут списки главного экрана, без второй
    загрузки; «Safar» не грузит брони заново.

E. Время
[ ] Публикация проверяет «сейчас» в момент отправки, не с
    открытия экрана: нет ложного «juda yaqin».
[ ] Сценарии стенда не зависят от часа: полный стенд зелёный и в
    23:30 по Ташкенту (урок №223).

F. Проверка
[ ] Тесты на каждый пункт; e2e и сценарии e2e/stand обновлены
    (урок №221); стенд кусками; полный стенд один раз в конце,
    не с 23:00 до 00:30.
[ ] Независимый агент заново проходит все переходы (как `168`
    часть B) и не находит ни одной старой ошибки.
[ ] Docs 168 (статус части B), 75, 122, 155, 29 обновлены;
    уроки записаны; PR, слияние (согласие владельца), деплой;
    владелец проверил на телефоне.

Цель выполнена, когда всё вместе:
1. Все пункты выше отмечены [x].
2. Ветка слита в main без конфликтов, CI зелёный, деплой прошёл.
3. Владелец написал «проверил».
4. goals/INDEX: G77 ✅; ветка удалена.
```

## Доказательства (урок №224)

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

## Порядок и оценка

| Шаг | Что | Часы |
|---|---|---|
| 0 | Ошибки О1, О2, О3 (`../170`), отдельный PR | 1,5 |
| 1 | A + B: «Назад», ссылки ботов, админка | 2,5 |
| 2 | C: одно действие, один код | 2,5 |
| 3 | D + E: мёртвый код, повторы, CSS, время | 2 |
| 4 | F: агент-проверка, полный стенд, docs, PR | 1,5 |

## Согласие владельца

- «Назад» сразу на главный: дано 11.10.2026.
- «Hamyon» → поддержка с готовым текстом вместо экрана TopUpScreen: по макету g75/4 Б; снимок владельцу перед слиянием.
- Новый текст: вопрос перед отменой заявки (О3), согласие до кода; другие новые тексты тоже сначала на согласие (`../33`).
- Слияние и деплой: согласие перед слиянием.

## Уроки, которые здесь легко повторить

- №224: «сделано» только с путём к коду и тестом.
- №225: тест кнопки проверяет конечный экран, не «что-то открылось».
- №221: меняю переход, ищу его тексты во всём `e2e/`, включая `e2e/stand`.
- №222: проверки и коммит одной цепочкой `&&`.
- №223: полный стенд не с 23:00 до 00:30 по Ташкенту.
