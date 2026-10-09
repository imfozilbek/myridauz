# 152. G68: тексты сообщений ботов на согласие владельца

> **Кратко:** почти все тексты живых карточек и звонков есть на макетах `goals/g68/1-passenger-system.png` и `3-driver-proposal.png` и одобрены вместе с ними (`122`). Здесь: тексты с макетов, как они легли в бот, новые тексты без макета и убранные старые сообщения. Тексты 6 … 9 добавлены после согласия, по тому же правилу понятности; показаны владельцу в отчёте части A. **Согласие владельца 09.10.2026: «Я согласуешь с текстами только хотелось чтобы ты думал о том чтобы пользователи это читав точно понимали о чем речь сразу»** (`33`). По этому пожеланию тексты стали понятнее, правки ниже. Проверка носителем (`25`) остаётся.

## Карточка поездки попутчика (макет g68/1, g68/2)

| Где | Текст |
|---|---|
| Статус | «⏳ Javob kutilmoqda», «✅ Joy tasdiqlandi», «🚗 Yoʻldasiz», «🏁 Yetib keldingiz» |
| Не получилось | «❌ Joy tasdiqlanmadi», «❌ Haydovchi javob bermadi», «❌ Haydovchi bekor qildi», «Bekor qilindi» |
| Когда | «{день}, {дата} · {время}», «{время} edi» (время сдвинули), «Bugun {время} · ≈ {время} yetib borasiz» |
| Машина | «🚗 {имя} ⭐ {рейтинг} · {модель}, {цвет}», без оценок: «🚗 {имя} · yangi haydovchi · {модель}, {цвет}» |
| Места | «💺 {n} joy · {сумма}», «✏️ {время} da yangilandi» («💬 {n} ta yangi xabar» придёт вместе с чатом, часть B) |
| Кнопки | «💬 Chat», «📞 Qoʻngʻiroq», «👨‍👩‍👧 Yaqinlarimga yuborish», «🏁 Yetib keldim», «Ochish», «Boshqa safar topish» |

## Звонки попутчику (короткий ответ на карточку)

| Когда | Текст |
|---|---|
| Водитель подтвердил | «✅ {имя} tasdiqladi» |
| Не подтвердил, срок вышел, отменил | «❌ {имя} joyni tasdiqlamadi. Boshqa safar bor.», «❌ Haydovchi vaqtida javob bermadi. Boshqa safar bor.», «❌ {имя} joyni bekor qildi. Boshqa safar bor.» |
| Время сдвинули | «⏰ Vaqt oʻzgardi: endi {время}» |
| За 2 часа | «🚏 2 soat qoldi: {время} da pitakda boʻling», «🏠 2 soat qoldi: haydovchi {время} da sizni olib ketadi» |
| Выехал, на месте | «🚗 {имя} yoʻlga chiqdi», «📍 {имя} keldi» |

## Карточка поездки водителя (макет g68/3)

| Где | Текст |
|---|---|
| Статус | «📣 Eʼlon qilindi · {занято} / {мест} joy band», «🚗 Yoʻldasiz · {сделано} / {шагов}», «🏁 Yetib keldingiz», «❌ Safar bekor qilindi» |
| Попутчики | «👥 Yoʻlovchilar», «{n}. {имя}, {мест} joy · ✅», «… · ⏳ javob kerak» |
| День поездки | «👥 Yoʻl tartibi», «{n}. 🚏 {имя}, {мест} joy · {место}», «· ✅ chiqdi», «{n}. 🏁 {имя} tushadi · {место}» |
| Цена, дорога | «💰 Bir joy {сумма}», «🔕 Yoʻlda: shoshilinch boʻlmagan xabarlar ovozsiz» |
| Кнопки | «📋 Safarni ochish», «🔗 Havolani yuborish», «🏁 Yetib keldik» |

## Заявка в боте водителя (макет g68/3)

| Где | Текст |
|---|---|
| Кто и куда | «🙋 {имя} ⭐ {рейтинг} · {мест} joy», «{откуда} → {куда}», «{время} gacha javob bering» |
| Кнопки | «✅ Qabul qilish», «❌ Rad etish», «💬 Chat», «📞 Qoʻngʻiroq» |
| Звонки | «🙋 {имя} joyini bekor qildi. Komissiya hamyoningizga qaytdi.», «🚏 2 soat qoldi: {n} yoʻlovchi, birinchisi {время} da · {место}» |

## Новые тексты (макета нет)

| # | Где | Текст |
|---|---|---|
| 1 | Заявка без оценок попутчика | «🙋 {имя} · yangi yoʻlovchi · {мест} joy» |
| 2 | Заявка после ответа (кнопок больше нет) | «✅ Qabul qilindi», «❌ Rad etildi», «⌛ Javob muddati tugadi», «❌ Yoʻlovchi bekor qildi» |
| 3 | Нажатие не прошло (короткая плашка Telegram) | «Hamyonda komissiya uchun pul yetmaydi. Hisobni toʻldiring.», «Safarda boʻsh joy qolmadi.», «Bu soʻrov allaqachon oʻzgargan.» |
| 4 | Звонок водителю: предложение приняли | «✅ {имя} taklifingizni qabul qildi» |
| 5 | Звонок водителю: попутчик на месте встречи | «📍 {имя} uchrashuv joyiga keldi» |
| 6 | Звонок водителю на половине срока ответа (ответ на саму заявку) | «⏳ {имя} hali javobingizni kutyapti: {время} gacha javob bering» |
| 7 | Кнопка в карточке попутчика после приезда | «🔁 Qaytish safari» |
| 8 | Карточка попутчика: водитель отметил неявку | «❌ Haydovchi sizni uchrashuv joyida topmadi» |
| 9 | Звонок попутчику о неявке (ответ на карточку) | «❌ {имя} sizni uchrashuv joyida topmadi. Boshqa safar bor.» |

## Часть B: новые тексты (по тому же согласию и правилу понятности)

| Где | Текст |
|---|---|
| Чат и звонок под карточкой поездки | «💬 {имя} sizga xabar yozdi», «📞 {имя} sizga qoʻngʻiroq qilyapti», «📞 {имя} qoʻngʻiroq qildi, lekin gaplasha olmadingiz»; в карточке «💬 {n} ta yangi xabar» |
| Карточка заявки попутчика | «⏳ Soʻrovingizni haydovchilar koʻrmoqda», «📨 Soʻrovingizga {n} ta taklif keldi», «✅ Taklifni qabul qildingiz», «⌛ Soʻrov muddati tugadi», «🚘 Boʻsh salon kerak», кнопка «📨 Takliflarni koʻrish» |
| Звонок о первом предложении | «📨 Soʻrovingizga taklif keldi: {имя}, {время}, {цена}» |
| Карточка заявки водителя (макет g68/3) | «🪪 Haydovchi arizangiz», «✅ Yuborildi · ⏳ Tekshirilmoqda · Javob», «✅ Yuborildi · ✅ Tekshirildi · {ответ}», ответ «✅ Tasdiqlandi», «❌ Rad etildi», «✏️ Tuzatish kerak» |
| Звонок о решении | «✅ Haydovchi arizangiz tasdiqlandi», «❌ Haydovchi arizangiz rad etildi», «✏️ Haydovchi arizangizda tuzatish kerak» |
| Карточка кошелька | «💳 Hamyoningiz», «🎁 Bonus: {сумма} · {дата}gacha», «💰 Asosiy hisob: {сумма}», «🪑 Bu pul ≈ {n} ta joyga yetadi», кнопка «💳 Hamyonni ochish» |
| Звонки кошелька (один раз) | «💳 Hamyoningizdagi pul faqat {n} ta joyga yetadi», «💳 Hamyoningizda komissiya uchun pul qolmadi», «🎁 Bonusingiz {дата} kuni tugaydi: {сумма} qoldi» |
| Карточка новостей направления (макеты g68/1, g68/3) | «🔔 Bugungi yangi safarlar», «🙋 Yoʻnalishingizda soʻrovlar», «Kuniga bitta xabar · yangi safar (soʻrov) chiqsa, shu xabar yangilanadi», «… va yana {n} ta» |
| Строки новостей | «{имя} · {день} {время} · {n} joy · {цена}», «♥ …» (любимый водитель), «… ↓ arzonlashdi», «{имя} · {n} kishi · {день} · {откуда} → {куда} · {цена}», «🚐 {имя} · butun salon · …» |
| Кнопки новостей | «Hammasini koʻrish», «🔕 Bu yoʻnalish kerak emas», «Taklif qilish», «🔕 Kerak emas»; после нажатия плашка «Bu yoʻnalish boʻyicha xabar endi kelmaydi» |
| Подписка кончилась | «⌛ Obunangiz muddati tugadi», «Xabar olishni davom ettirish uchun obunani uzaytiring», кнопка «🔔 Obunani uzaytirish» |

## Убраны (их заменили карточки)

| Ключ | Почему |
|---|---|
| `bot.booking.confirmed`, `declined`, `expired`, `cancelledByDriver`, `retimed`, `driverCame` | карточка поездки попутчика и звонки под ней |
| `bot.reminder.passengerDay`, `passengerSoon`, `driverDay`, `driverSoon` | за день: карточка без звука; за 2 часа: звонок под карточкой |
| `bot.trip.published` | карточка поездки водителя |
| `bot.booking.requested`, `expiredDriver`, `cancelledByPassenger`, `came` | заявка в боте водителя и звонки под карточкой |
| `bot.offer.accepted` | звонок «taklifingizni qabul qildi» под карточкой |
| `bot.offer.new` | карточка заявки попутчика и звонок о первом предложении |
| `bot.subscription.*`, `bot.favorite.trip` | карточка новостей направления: 1 в день, дальше правка без звука |

## Правки ради понятности (пожелание владельца 09.10.2026)

Звонок виден на экране блокировки без карточки: его текст сам говорит, о чём речь.

| Было | Стало | Почему |
|---|---|---|
| «⏳ Javob kutilmoqda» | «⏳ Haydovchi javobi kutilmoqda» | чей ответ ждём |
| «{время} edi» | «Avval {время} edi» | что время сдвинули |
| «✅ {имя} tasdiqladi» | «✅ {имя} joyingizni tasdiqladi» | что именно подтвердил |
| «⏰ Vaqt oʻzgardi: endi {время}» | «⏰ Safar vaqti oʻzgardi: endi {время}» | время чего |
| «🚏 2 soat qoldi: …» (оба бота) | «🚏 Safarga 2 soat qoldi: …» | до чего 2 часа |
| «📍 {имя} keldi» (оба бота) | «📍 {имя} uchrashuv joyiga keldi» | куда пришёл |
| «🚗 Yoʻldasiz · 3 / 5» | «🚗 Yoʻldasiz · yana {n} ta manzil» | «3 / 5» непонятно; «ещё N адресов» понятно |
| «🙋 {имя} ⭐ 4,8 · 1 joy» | «🙋 Yangi soʻrov: {имя} ⭐ 4,8 · 1 joy» | что это заявка |
| «… · yangi yoʻlovchi · …» | «… · hali bahosi yoʻq · …» | «yangi» путалось с новой заявкой |
| «🚏 2 soat qoldi: {n} yoʻlovchi, birinchisi {время} da · {место}» | «🚏 Safarga 2 soat qoldi: {n} yoʻlovchi. Birinchisi {время} da kutadi: {место}» | кто и где ждёт |

## Спорные места (макет против бота)

| # | Что | Как в коде | Вопрос владельцу |
|---|---|---|---|
| 1 | В звонке заявки на макете нет суммы комиссии | как на макете | добавить строку «Komissiya {сумма} · safar boʻlmasa, qaytariladi» (`122`: комиссия видна до «Tasdiqlash»)? |
| 2 | Полоска шагов «Yoʻldasiz · 3 / 5» | «yana {n} ta manzil» (правка выше), полоски нет: Telegram не рисует полоски | решено пожеланием владельца |
| 3 | «Yoʻlni navigatorda ochish» под «2 soat qoldi» | кнопки нет: бот не знает навигатор, выбранный в Mini App | «Safarni ochish» вместо неё? |
| 4 | «kanalda chiqdi» в карточке водителя | пока нет: каналы выключены (`CHANNEL_POSTS = "off"`) | добавим вместе с каналами |
