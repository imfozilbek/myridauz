# 86. G27: новые тексты на согласие владельца

> **Кратко:** находки G27, которые нельзя было закрыть без нового текста или нового вида экрана. Владелец согласовал всё 01.10.2026 («всем вопросам, да»). T1 … T17 и V2 … V14 сделаны в коде с тестами; V1 ждёт реквизиты компании. Каждый текст ещё проверяет носитель (`docs/25`).

## Статус

| Что | Статус |
|---|---|
| T1 … T17 | Сделаны, тесты; ждут проверки носителем |
| V2 … V14 | Сделаны, тесты, в `main` (PR #75) |
| V1 | Ждёт реквизиты компании от владельца |

Новые тексты V на проверку носителем: «Tasdiqlangandan keyin», «Ariza tasdiqlandi», «Boshlash uchun {amount} bonus berdik. Bonus komissiyaga ishlatiladi.» (V7); «Har bir joy uchun {amount} komissiya», «Komissiya yoʻlovchi joyini tasdiqlaganingizda olinadi: avval bonusdan, keyin asosiy hisobdan.» (V8).

## Ошибки без текста (N04)

Сейчас человек видит общее «Birozdan keyin qayta urinib koʻring». Это неправда: повтор не поможет.

| № | Код | Когда бывает | Черновик |
|---|---|---|---|
| T1 | `bookings.wrong_mode` | Способ посадки не тот, что у поездки | Bu safarda bunday olib ketish yoʻq. Boshqa usulni tanlang. |
| T2 | `bookings.outside_area` | Точка посадки вне района поездки | Bu joy safar hududidan tashqarida. Yaqinroq joyni tanlang. |
| T3 | `favorites.too_many` | 50 сохранённых водителей | Saqlangan haydovchilar soni chegaraga yetdi. Keraksizini oʻchiring. |
| T4 | `shares.wrong_status` | Делиться поездкой уже нельзя | Bu safarni endi ulashib boʻlmaydi. |
| T5 | `users.avatar_too_large` | Фото профиля слишком большое | Rasm juda katta. Boshqa rasmni tanlang. |
| T6 | `drivers.photo_too_large` | Фото машины слишком большое | Rasm juda katta. Boshqa rasmni tanlang. |
| T7 | `drivers.incomplete` | Заявка водителя без нужных фото | Arizada hamma rasmlar boʻlishi kerak. Yetishmayotganini qoʻshing. |
| T8 | `trips.wrong_status` | Поездка уже изменилась | Bu safar allaqachon oʻzgargan. Roʻyxatni yangilang. |
| T9 | `calls.unavailable` | Звонки временно не работают | Qoʻngʻiroq hozir ishlamayapti. Chatda yozing. |

## Сообщение бота (N03)

| № | Когда | Черновик |
|---|---|---|
| T10 | Бронь истекла: водитель не ответил вовремя | Haydovchi oʻz vaqtida javob bermadi, soʻrovingiz bekor qilindi. Boshqa safarni tanlang. Кнопка «Ochish» (поиск этого маршрута) |

## Подсказки на экранах (U1, U2, U3, U5, U7)

| № | Экран | Черновик |
|---|---|---|
| T11 | Приветствие попутчика (U1), 3 строки | Haydovchilar tekshirilgan. · Yoʻl xarajatini birga boʻlamiz. · Telefon raqamingiz hech kimga koʻrinmaydi. |
| T12 | Приветствие водителя (U1), 3 строки | Yoʻl xarajatingiz qaytadi. · Boshlash uchun bonus beramiz. · Telefon raqamingiz hech kimga koʻrinmaydi. |
| T13 | Согласие (U2), одна строка | Raqamingiz hech kimga koʻrinmaydi. |
| T14 | Профиль, фото (U3) | Rasm bilan haydovchi tezroq tasdiqlaydi. |
| T15 | Заявка попутчика (U5) | Haydovchilar vaqt va narx taklif qiladi. |
| T16 | Запросы попутчиков у водителя (U5) | Yoʻlovchilar taklifingizni kutmoqda: vaqt va narx. |
| T17 | Админка открыта не командой (U7) | Bu ilova {brand} jamoasi uchun. Safar uchun yoʻlovchi yoki haydovchi botini oching. |

## Решения без текста

| № | Находка | Совет |
|---|---|---|
| R1 | N07: человек заблокировал бота, сообщения теряются | Отмечать «бот заблокирован» и не слать до `/start`. Делать после запуска. |
| R2 | N12: геолокация в боте без обработчика | Не делать: всё делается в Mini App. |
| R3 | N13: пополнения кошелька в приложении нет | Цель G17 (`docs/12`), до неё бонус добавляет владелец. |

## Вид экранов (по оценкам `docs/87`)

Сначала самое важное. Номер V: ответ «V1 да» и т. п.

| № | Экран | Что не так | Совет |
|---|---|---|---|
| V1 | p04, pa14 оферта | Видны шаблоны `{{company_legal_name}}` и др. | Реквизиты компании от владельца (OPS), до запуска |
| V2 | ta45 поправка кошелька | Забыл минус: деньги начислятся вместо списания | Выбор «Qoʻshish / Ayirish» и строка нового баланса перед «Saqlash» |
| V3 | da52 пополнение | Тупик: «напишите в поддержку», а кнопки нет | Главная кнопка «Qoʻllab-quvvatlashga yozish» |
| V4 | pb30 блокировка | Нет причины и нет действия | Причина и кнопка поддержки |
| V5 | pa22 мой запрос | Не видно, что предложение водителя открывается и принимается | Стрелка на строке и подсказка над списком |
| V6 | da31, da32 запросы | Нет времени на карточке, кнопка внутри страницы | Время на карточке, кнопка «Taklif yuborish» внизу |
| V7 | d27, d30 одобрение | Пока проверка: пункты выглядят рабочими; после: нет «Tasdiqlandi» | Серые пункты с подписью; одна карточка «Tasdiqlandi» с бонусом |
| V8 | da12, da43, da46 | Комиссия 10% нигде не объяснена | Строка комиссии на шагах цены и проверки |
| V9 | ta21 жалоба | Последствия решения не видны | Под каждым решением строка последствия |
| V10 | ta11 заявка | «Tasdiqlash» и «Rad etish» одинаковые серые строки | «Tasdiqlash» внизу главной кнопкой, «Rad etish» красным |
| V11 | da22 своя поездка | Водитель видит себя в блоке «Haydovchi» | Убрать блок, как на карточках (U6) |
| V12 | pa13, pa25 удаление | Опасная кнопка бирюзовая | Красная кнопка, как в Telegram |
| V13 | ta35 предпросмотр цен | «Edi → boʻladi» непонятно, нет итога | Заголовок и строка «N yoʻnalishda narx oʻzgaradi» |
| V14 | ta38 каналы | «Hozircha tuman kanallari yoʻq» над списком каналов | Убрать надпись, когда список не пуст |
