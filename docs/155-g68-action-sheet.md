# 155. G68 часть D: шторка действия в Mini App

> **Кратко:** как сделана шторка по `122` и макетам `g68/7`, `g68/8`. Бот зовёт, Mini App отвечает: поверх экрана снизу поднимается одна шторка, в ней фото, кто, что, короткая карточка поездки и ответ в одно касание. Шесть видов, один компонент для обеих ролей. Тексты по согласию владельца 09.10.2026 и его правилу понятности. Отступления от макетов: внизу.

## Что видит человек

| Вид | Кому | Что в шторке | Кнопки |
|---|---|---|---|
| Новая заявка | водителю | «Yangi soʻrov», «Madina · 2 joy», «★ 4,8 · 12 safar», поездка, «Olib ketish», «2 joy × 100 000», «Komissiya», «Javob berish uchun 29 daqiqa» | «Rad etish», «Tasdiqlash», «Keyinroq» |
| Новое предложение | попутчику | «Yangi taklif», «Jasur · ★ 4,9», машина и номер, поездка, как забирает, сумма; одна шторка на заявку, остальные предложения за «Barcha takliflar (2)» | «Rad etish», «Qabul qilish», «Barcha takliflar (2) · Keyinroq» |
| Новое сообщение | обоим | «Yangi xabar», кто и о какой поездке, сами слова | «Yaxshi», «Kutaman», «Qayerdasiz?», «Javob yozish», «Keyinroq» |
| Звонок (Mini App открыт) | обоим | «Qoʻngʻiroq · {бренд} orqali», кто, машина, поездка; телефон звонит | «Rad etish» (красная), «Javob berish» (зелёная), «Raqamlar yashirin» |

## Правила

- G76 (`164`, `167`): шторки встречи и ответа другой стороны убраны, это состояния нижнего блока. Сама встаёт только шторка звонка; остальные открываются касанием по нижнему блоку или ссылкой бота. Блок остаётся под шторкой, его кнопки Telegram уходят, пока она стоит. Вид шторки G68 не менялся.
- Одна шторка за раз. Порядок: звонок, заявка, предложение, сообщение. Несколько дел: «1 / 3», после ответа сразу следующее.
- После ответа шторка закрывается, сверху плашка: «Madina tasdiqlandi · 20 000 komissiya», «Javob yuborildi», «Haydovchiga aytildi».
- «Keyinroq» или касание мимо шторки: дело уходит до конца сессии и остаётся в нижнем блоке (G76).
- Шторка живёт только на главном экране (кроме звонка): на экране самого дела её нет. Звонок приходит поверх любого экрана.
- Звонок в закрытом Mini App, как раньше: бот открывает чат, звонок на весь экран (`118`).
- Быстрый ответ («Kutaman», «5 daqiqada») уходит в чат без его открытия; другой человек видит обычное сообщение.
- Живое обновление (`64`): нижний блок меняется сам; шторка сама не встаёт (кроме звонка, G76).

## Ссылки ботов

| Кнопка | Куда |
|---|---|
| «📲 Ilovada ochish» под новой заявкой водителю | главный экран и шторка этой заявки (`?sheet=<бронь>`) |
| «Ochish» под первым предложением попутчику | главный экран и шторка предложения (`?sheet=<предложение>`) |
| «💬 Yangi xabar» | главный экран и шторка сообщения (`?sheet=<чат>`) |
| «Javob berish» звонка | чат, как раньше |
| «💬 Chat» и «📞 Qoʻngʻiroq» под карточкой поездки | чат (`?chat=<чат>`); звонок сразу (`?call=<чат>`, G77) |

Шторка по ссылке ждёт списки главного экрана и открывается, когда её вещь пришла; у предложения шторка показывает первое пришедшее, то, о котором звонил бот (G77, урок №227). Telegram «Назад» при открытой шторке закрывает шторку, как «Keyinroq», а не Mini App (`sheet/sheet-back.tsx`, G77).

## Новые тексты (`sheet.json`, `bot-driver.json`)

| Где | Ключи |
|---|---|
| Общие | `sheet.later`, `sheet.counter`, `sheet.trip`, `sheet.who`, `sheet.car`, `sheet.seats`, `sheet.salon`, `sheet.rating`, `sheet.newcomer` |
| Заявка | `sheet.request.*`: «Yangi soʻrov», «Olib ketish», «{n} joy × {цена}», «Javob berish uchun {n} daqiqa / soat», «{имя} tasdiqlandi · {сумма} komissiya», «{имя}ning soʻrovi rad etildi» |
| Предложение | `sheet.offer.*`: «Yangi taklif», «Bir joy {цена}», «Barcha takliflar ({n})», «Taklif qabul qilindi. Joyingiz band.», «Taklif rad etildi» |
| Сообщение | `sheet.message.*`: «Yangi xabar», «{когда} · {куда}ga», «Yaxshi», «Kutaman», «Qayerdasiz?», «Javob yozish», «Javob yuborildi» |
| Звонок | `sheet.call.*`: «Qoʻngʻiroq · {бренд} orqali», «Javob berish», «Rad etish», «Raqamlar yashirin» |
| Встреча | `sheet.meet.*`: «Uchrashuv», «{имя} keldi», «{место} kutmoqda», «5 daqiqada chiqaman», «10 daqiqada yetib boraman» и другие |
| Ответ | `sheet.answer.*`: «Taklif qabul qilindi», «Taklifingizga rozi boʻldi», «Joyingiz tasdiqlandi», «Safarni ochish», «Yaxshi» |
| Бот водителя | `bot.ask.open`: «📲 Ilovada ochish» |

## Как сделано

| Что | Где в коде |
|---|---|
| Один компонент, очередь, «1 / 3», плашка | `packages/ui/src/action-sheet/` (`action-sheet.tsx`, `action-card.tsx`, `action-queue.ts`) |
| Виды | `action-sheet/kinds/`: `request-items`, `offer-items`, `message-items`, `meeting-items`, `answer-items`, `call-source` |
| Где живёт | `chat/chat-link.tsx` (над всеми экранами); источники на главных экранах (`driver-actions.tsx`, `passenger-actions.tsx`) |
| Последнее непрочитанное и быстрый ответ | `GET /chats/unread`, `POST /chats/:key/messages`; таблица `chat_unread` (миграция 0054) |
| Ссылка бота | `?sheet=<id>` (`SHEET_LINK`), кнопки в `ask-card.ts`, `request-card.ts`, `chat-ring-button.ts` |
| Сверка с макетами | `e2e/g68-pixel.spec.ts`, итог в `156` |

## Отступления и толкования макетов

| # | На макете | В коде | Почему |
|---|---|---|---|
| 1 | «Komissiya» | как на макете: «Komissiya» (общий текст брони) | строку «Safar boʻlmasa, qaytariladi» не добавляем (решение владельца 09.10.2026) |
| 2 | У встречи нет «Keyinroq» | как на макете; закрыть можно касанием мимо | |
| 3 | Звонок: бот зовёт, Mini App открывает чат сразу | в открытом Mini App сначала шторка | `122`: «Звонок (Mini App открыт): шторка» |
| 4 | Быстрые ответы встречи «5 daqiqada» | в чат уходит полная фраза: «5 daqiqada chiqaman» у попутчика, «5 daqiqada yetib boraman» у водителя | другой человек сразу понимает, кто и что сделает |
