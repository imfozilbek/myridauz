# 232. G70a: подсказки по шагу в ботах (без видео)

> **Кратко:** решение владельца 12.11.2026: из G70 сначала только подсказки в ботах, видео потом (G70b). Бот мягко подсказывает человеку, который остановился на шаге, и даёт кнопку на нужный экран. 8 подсказок из 12 (`123` §3): у остальных четырёх нет данных на сервере. Тексты ниже: на согласие владельца, потом носитель. Статус: **ждёт согласия**.

## Что берём и что нет

| Шаг (`123`) | Берём? | Почему |
|---|---|---|
| P2 зарегистрировался, ничего не искал 24 ч | да | `users.created_at` и нет просмотров, запросов, броней |
| P3 открыл поездку, не забронировал 3 ч | да | `trip_views` |
| P10 первая поездка была, второй нет 14 дней | да | `bookings` и `trips_ends` |
| Запрос без предложений 6 ч | да | `ride_requests` и `offers` |
| D1 начал заявку, не отправил 24 ч | да | `driver_applications.status = draft`, без смены машины одобренным |
| D2 одобрен, не публиковал 48 ч | да | `application_log` и нет `trips` |
| D7 опубликовал, нет брони за 12 ч до выезда | да | `trips` и нет `bookings`; без поездок для одной заявки |
| D4 нет поездок 21 день | да | `trips_ends` и нет новых `trips` |
| P1 открыл бот, не зарегистрировался | нет | /start ничего не пишет в базу; таблица имён для другой цели (`30`) |
| P7, P9 искал, поездок нет | нет | результат поиска есть только в аналитике без человека |
| 30 дней без активности | нет | нет «последнего визита» |
| D3 запрос истёк без ответа | нет | уже есть звонок на половине срока и карточка «Javob muddati tugadi» |

## Правила (`123` §3)

- Не больше 1 подсказки в неделю на человека и не больше 2 на один шаг. Сделал шаг: подсказки этого шага прекращаются.
- Только с 10:00 до 20:00 Ташкента, без звука. Никогда, пока человек в поездке.
- Не пишем: удалённым, заблокированным, тем, кто остановил бот.
- Кнопка «Kerak emas» выключает только подсказки, служебные сообщения остаются.
- Кнопка ведёт на экран с меткой `bot-tip-<шаг>`. В «Rost» новый блок: сколько подсказок ушло и сколько людей сделали шаг за 72 ч (по базе, не по аналитике).
- Журнал `tips(user_id, step, sent_at)`, маленький (бюджет `117`). Удаление данных стирает его (`30`).
- Задача Cron раз в час, чтение только по индексам (`117`).

## Тексты (uz-Latn, на согласие)

| Шаг | Текст | Кнопка |
|---|---|---|
| P2 | Qayerga borasiz? Yoʻnalishni tanlang: bugungi va ertangi safarlar shu yerda. | Safar topish |
| P3 | Siz koʻrgan safarda hali boʻsh joy bor. Joyni band qilib qoʻyasizmi? | Safarni ochish |
| P10 | Yana yoʻlga chiqasizmi? Yoʻnalishingizda yangi safarlar bor. | Safar topish |
| Запрос | Soʻrovingizga hali taklif kelmadi. Uni tanishlaringizga yoki guruhga ulashing: haydovchi tezroq topiladi. | Soʻrovni ochish |
| D1 | Arizangiz deyarli tayyor. Qolgan qadamni tugating, keyin safar eʼlon qila olasiz. | Arizani davom ettirish |
| D2 | Birinchi safaringizni eʼlon qiling: yoʻlovchilar kutyapti. Hamyoningizda {bonus} bonus bor. | Safar eʼlon qilish |
| D7 | Safaringizda hali yoʻlovchi yoʻq. Havolani tanishlaringizga va guruhlarga yuboring. | Safarni ochish |
| D4 | Yana yoʻlga chiqasizmi? Yangi safarni bir necha bosishda eʼlon qilasiz. | Safar eʼlon qilish |
| Все | | 🔕 Kerak emas |
| После «Kerak emas» | Maslahatlar oʻchirildi. Muhim xabarlar kelaveradi. | |

## План работ (около 3 или 4 ч)

1. Таблица `tips` и флаг «Kerak emas» (миграция), удаление данных.
2. 8 правил: поиск кандидатов по индексам, тесты на каждое (сначала падают).
3. Отправка: окно 10:00 … 20:00, без звука, «в поездке», лимиты, кнопка с меткой.
4. «Kerak emas» в ботах попутчика и водителя.
5. «Rost»: блок подсказок.
6. Тесты Cron (`cron-reads`, `cron-jobs`), стенд кусками, docs `123`, `29`, `117`.
