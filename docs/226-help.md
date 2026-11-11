# 226. Помощь: ответы на частые вопросы в ботах и Mini App (G97)

> **Кратко:** просьба владельца 11.11.2026. В ботах попутчика, водителя, главном и «yordam», в Mini App попутчика и водителя и на сайте один и тот же список: 5 тем, 18 вопросов, ответы из одних ключей перевода. Человек сам находит ответ; если ответа нет, «Boshqa savolim bor» ведёт к команде, как сейчас. Тексты на согласие: `227`. Цель: G97.

## Что сейчас (код 11.11.2026)

| Где | Что есть |
|---|---|
| Бот «yordam» | На /start приветствие; любое сообщение уходит команде карточкой в админ-боте (`50`). Тем и готовых ответов нет |
| Mini App | Плитка «Yordam» и строка профиля «Yordam» сразу открывают бот «yordam» |
| Сайт | «Koʻp beriladigan savollar»: 7 вопросов (`landing.faq.*`, `60`); на странице направления ещё 3 |

## Темы и вопросы

✅: ответ уже есть на сайте, владелец его одобрил. ✏️: ответ сайта, дополненный для Mini App.

| Тема | Вопросы |
|---|---|
| 🔎 Safar topish | Safarni qanday topaman? · Mos safar boʻlmasa-chi? ✏️ · Narxni kim belgilaydi? ✅ · {brand} taksimi? ✅ |
| 🎫 Joy band qilish | Joyni qanday band qilaman? · Haydovchi qachon javob beradi? · Joyni qanday bekor qilaman? · Haydovchi bilan qanday bogʻlanaman? |
| 🚗 Haydovchi boʻlish | Haydovchi boʻlish uchun nima kerak? · Haydovchi qanday tekshiriladi? ✅ · Arizam qachon koʻrib chiqiladi? · Arizam qaytarildi. Nima qilaman? |
| 👛 Hamyon va komissiya | Haydovchi uchun qancha turadi? ✅ · Hamyonni qanday toʻldiraman? · Yoʻlovchi kelmasa, komissiya qaytadimi? |
| 🔒 Hisob va xavfsizlik | Telefon raqamim koʻrinadimi? ✅ · Ilova yuklab olish kerakmi? ✅ · Maʼlumotlarimni qanday oʻchiraman? |
| ✍️ Boshqa savolim bor | Вопрос команде, как сейчас |

Кнопка «Boshqa savolim bor»: слова владельца 11.11.2026.

## Где и как

| Место | Как |
|---|---|
| Бот «yordam» | /start: приветствие и 6 кнопок (5 тем и «Boshqa savolim bor»). Касание темы меняет то же сообщение на её вопросы, касание вопроса на ответ; под ответом «⬅️ Mavzular» и «✍️ Boshqa savolim bor». «Boshqa savolim bor» просит написать вопрос; дальше как сейчас |
| Боты попутчика, водителя, главный | Команда /yordam в меню (`setMyCommands`): те же темы в одном сообщении. «Boshqa savolim bor» открывает бот «yordam» ссылкой |
| Mini App попутчика и водителя | Плитка «Yordam» и строка профиля «Yordam» открывают экран «Yordam»: сверху «Boshqa savolim bor» (бот «yordam»), под ним темы; тема открывает вопросы, вопрос открывает ответ. Темы по роли: попутчику сначала «Safar topish» и «Joy band qilish», водителю «Haydovchi boʻlish» и «Hamyon va komissiya» |
| Сайт | Блок «Koʻp beriladigan savollar» берёт тексты из тех же ключей: один источник правды |

- Ответ на месте (T6): тихая ссылка «{тема} boʻyicha savollar» внизу экрана открывает «Yordam» сразу на теме: «Hamyon» → «Hamyon va komissiya»; экран машины в заявке водителя → «Haydovchi boʻlish» (открывается внутри заявки, «Назад» возвращает к машине); страница брони, ждущей и подтверждённой → «Joy band qilish». Где «Yordam» открыть нечем, ссылки нет.
- Цифры в ответах не пишутся в текст: процент и минимум комиссии, бонус, часы команды, срок ответа водителя и время встречи берутся из бренда и «Cheklovlar» (`127`). Владелец меняет число, ответ меняется сам.
- Бот не шлёт новых сообщений на каждое касание: одно сообщение меняется на месте (как живые карточки, `122`).

## Аналитика (T7)

- Событие `help_open`: экран или бот, тема, вопрос. Событие `help_more`: «Boshqa savolim bor» и последний открытый вопрос.
- «Statistika → Yordam»: самые частые вопросы и после каких всё равно пишут команде. Так видно, какой ответ надо улучшить.

## Pixel Perfect (T8)

Снимки кода против утверждённого макета `goals/g97/phones` (`scripts/pixel-diff.py`): все 7 экранов 0 % (11.11.2026).

- Экраны Mini App 1 … 5: `e2e/g97-pixel.spec.ts` (задача `screenshots` в CI).
- Чат бота 6 и 7: стенд `e2e/stand/g97.spec.ts`, из настоящих ответов бота на `/yordam` и касания. Чат рисуется с картинками бренд-кита, а их есть только у стенда (урок №388).

## Находки 11.11.2026: старые тексты спорят с кодом (T9)

| Текст | Что написано | Что в коде |
|---|---|---|
| `legal.offer.5.text` (оферта) | до 5 активных поездок у водителя, до 3 открытых заявок и до 3 запросов места у попутчика | одна активная поездка (`trips/application/schedule.ts`), одна открытая заявка (`ride-requests/application/use-cases.ts`), одно место (`bookings/application/request.ts`) |
| `home.dock.carFill` | «Mashina, raqam va 3 ta rasm» | одно фото машины спереди; фото лица из регистрации |
| `bookings.done.why` | «kelmasa pul qaytadi» (попутчику) | попутчик платит водителю сам в поездке; возврат есть только комиссии водителю (`52`) |

Новые тексты: `227`, «да» владельца 11.11.2026 (оферта тоже, `33`). Исправлены в G97.

## Решения владельца

| Дата | Решение |
|---|---|
| 11.11.2026 | Разделы с ответами в боте «yordam»; кнопка «Boshqa savolim bor» |
| 11.11.2026 | Покрыть эти разделы и в Mini App, и в ботах: цель G97 |
| 11.11.2026 | «Да» на темы, вопросы, тексты `227`, макет `goals/g97/1-help.png` и исправление трёх старых текстов |
