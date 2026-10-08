# 140. G63: новые тексты на согласие владельца

> **Кратко:** тексты сервера G63: «Yoʻlga chiqdim» и «Yetib keldik» водителя, напоминание бота, проверка способа посадки (B1, `35`); встреча водителя и возврат комиссии за неявку (B2, `126`, `129`); источник «ссылка водителя» в статистике (B3, `119`). Все тексты новые (№11 изменён), ждут согласия владельца (`33`); проверка носителем (`25`) остаётся. Тексты экранов G63 (кнопки, карточки) будут в этом же документе на шаге G63 C: карточка канала (21 … 23) и встреча, «Safar tugadi», «Qaytish», прошлая поездка водителя (C3, 24 … 54) уже здесь.

## Новые: ждут согласия

| # | Где | Текст |
|---|---|---|
| 1 | Ошибка: «Yoʻlga chiqdim» раньше чем за час до выезда (`trips.too_early_to_depart`) | Hali erta. «Yoʻlga chiqdim» safar vaqtidan 1 soat oldin ishlaydi. |
| 2 | Ошибка: второе нажатие «Yoʻlga chiqdim» (`trips.already_departed`) | Yoʻlga chiqqaningiz allaqachon belgilangan. |
| 3 | Ошибка: «Yetib keldik» до выезда (`trips.not_departed`) | Avval «Yoʻlga chiqdim» tugmasini bosing. |
| 4 | Ошибка: второе нажатие «Yetib keldik» (`trips.already_arrived`) | Yetib kelganingiz allaqachon belgilangan. |
| 5 | Ошибка публикации: «Pitakdan olaman» или «Ikkalasi ham», а у направления нет пятака (`trips.no_pitak`) | Bu yoʻnalishda pitak yoʻq. «Shahar boʻylab yigʻaman» usulini tanlang. |
| 6 | Бот водителя: через 1 час после времени выезда нет «Yoʻlga chiqdim» (`bot.trip.departReminder`), кнопка «Ochish» открывает поездку | Yoʻlga chiqdingizmi? Safar boshlansa, «Yoʻlga chiqdim» tugmasini bosing. |
| 7 | Бот попутчика: водитель нажал «Men keldim» (`bot.booking.driverCame`), кнопка открывает бронь | Haydovchi uchrashuv joyiga keldi.<br>{from} → {to}, soat {time}. |
| 8 | Ошибка: метка встречи вне окна встречи (`bookings.not_meeting_time`) | Hozir uchrashuv vaqti emas. Belgini joʻnashdan biroz oldin va safar tugaguncha qoʻyish mumkin. |
| 9 | Ошибка: второе «Keldi» (`bookings.already_met`) | Yoʻlovchi kelgani allaqachon belgilangan. |
| 10 | Ошибка: второе «Kelmadi» (`bookings.already_no_show`) | Yoʻlovchi kelmagani allaqachon belgilangan. |
| 11 | Админка, решение по жалобе, подпись под «Haydovchiga komissiyani qaytarish» (`complaints.refundEffect`, **изменён**; было «…haydovchining asosiy hisobiga qaytadi.») | Yoʻlovchi kelmagan boʻlsa, qaytarish taklif qilinadi. Loyiha egasi tasdiqlagach, komissiya haydovchining hamyoniga qaytadi. |
| 12 | Админка, заголовок блока возврата (`complaints.refundTitle`) | Komissiyani qaytarish |
| 13 | Админка, метка жалобы в очереди (`complaints.refundTag`) | Qaytarish |
| 14 | Админка, сумма возврата (`complaints.refundAmount`) | Haydovchiga {amount} |
| 15 | Админка, кнопка владельца (`complaints.refundConfirm`) | Qaytarishni tasdiqlash |
| 16 | Админка, кнопка владельца (`complaints.refundReject`) | Qaytarmaslik |
| 17 | Админка, что видит модератор (`complaints.refundWaiting`) | Loyiha egasi tasdiqlashini kutmoqda. |
| 18 | Админка, после подтверждения (`complaints.refundConfirmed`) | Komissiya haydovchiga qaytarildi. |
| 19 | Админка, после отказа (`complaints.refundRejected`) | Loyiha egasi qaytarmaslikka qaror qildi. |
| 20 | Админка, «Statistika», «Qayerdan kelishdi»: люди, пришедшие по ссылке водителя (`stats.arrival.driver`) | Haydovchi havolasi |
| 21 | «Mening safarim»: карточка канала, заголовок (`driverTrip.channel.title`); решение владельца 08.10.2026, `119` строка 1 | Safaringiz kanalda chiqdi |
| 22 | «Mening safarim»: карточка канала, подпись: канал и сколько разных людей открыли поездку (`driverTrip.channel.views`); пока никто не открыл, только название канала | {channel} · {count} kishi koʻrdi |
| 23 | «Mening safarim»: кнопка в карточке канала, ссылка поездки через «Поделиться» Telegram (`driverTrip.channel.share`) | Havolani yoʻlovchilarga yuborish |

## Экраны C3: встреча, конец поездки, прошлая поездка (ждут согласия)

Все ключи в `packages/i18n/locales/uz-Latn/driver-after.json` (раздел `driverAfter`).

| # | Где | Текст |
|---|---|---|
| 24 | «Uchrashuv»: тёмная плашка, попутчик пришёл (`meet.came`) | {name} keldi: uchrashuv joyida |
| 25 | «Uchrashuv»: номер точки и время (`meet.point`) | {number}-nuqta · {time} |
| 26 | «Uchrashuv»: кнопка (`meet.met`) | Keldi |
| 27 | «Uchrashuv»: кнопка чата (`meet.write`) | Yozish |
| 28 | Окно Telegram перед «Kelmadi» (`noShow.ask`) | {name} kelmadimi? Komissiyani qaytarish soʻrovi jamoaga yuboriladi. |
| 29 | «Mening safarim»: строка попутчика после «Men keldim» (`noShow.until`) | Kelmadi · safar tugaguncha belgilash mumkin |
| 30 | Строка попутчика: возврат ждёт владельца (`noShow.waiting`) | Kelmadi · qaytarish {amount} kutilmoqda |
| 31 | Строка попутчика: возврат сделан (`noShow.refunded`) | Kelmadi · {amount} qaytarildi |
| 32 | «Mening safarim»: плашка неявки, заголовок (`noShow.title`) | {name} kelmadi |
| 33 | Плашка неявки, вторая строка (`noShow.sent`) | Komissiya {amount}: qaytarish soʻrovi jamoaga yuborildi |
| 34 | «Safar tugadi»: итог (`done.sum`) | {passengers} yoʻlovchi · {sum} yoʻl xarajati |
| 35 | «Safar tugadi»: кошелёк (`done.charged`) | Hamyon: {amount} yechildi |
| 36 | «Safar tugadi»: остаток кошелька (`done.left`) | Qoldi ≈ {seats} joyga yetadi |
| 37 | «Safar tugadi»: заголовок звёзд (`done.rate`) | Yoʻlovchilarni baholang |
| 38 | «Qaytish»: заголовок (`back.title`) | Qaytishga yoʻlovchi olasizmi? |
| 39 | «Qaytish»: заявки на обратный путь (`back.requests`) | {from} → {to}: {count} ta soʻrov bor |
| 40 | «Qaytish»: подсказка (`back.ready`) | Hammasi tayyor: faqat vaqtni tasdiqlang. |
| 41 | «Qaytish» и прошлая поездка: главная кнопка (`back.publish`) | Qaytishni eʼlon qilish |
| 42 | Прошлая поездка: звёзды попутчику (`past.rated`) | Baho: {stars} qoʻydingiz |
| 43 | Прошлая поездка: заголовок блока (`past.after`) | Safardan keyin |
| 44 | Прошлая поездка: строка (`past.rate`) | Yoʻlovchilarni baholash |
| 45 | Прошлая поездка: строка (`past.talk`) | Suhbatlar |
| 46 | Прошлая поездка: срок чата (`past.talkUntil`) | Yozish mumkin: {until} |
| 47 | Прошлая поездка: комиссия (`past.charged`) | {charged} yechildi |
| 48 | Прошлая поездка: комиссия, возврат возможен (`past.refundable`) | {charged} yechildi · {refund} qaytishi mumkin |
| 49 | Прошлая поездка: комиссия, возврат сделан (`past.refunded`) | {charged} yechildi · {refund} qaytarildi |
| 50 | Окно Telegram: выбор попутчика (`past.pick`) | Qaysi yoʻlovchi? |
| 51 | «Oʻtgan»: метка (`tag.refund`) | Qaytarish kutilmoqda |
| 52 | «Oʻtgan» и строка звёзд: метка (`tag.rated`) | Hammasi baholandi |
| 53 | «Hamyon»: строка возврата (`wallet.refund`) | Qaytarildi · {name} kelmadi |
| 54 | «Hamyon»: дата возврата (`wallet.confirmed`) | {day} · egasi tasdiqladi |

## Как это работает (коротко)

- «Yoʻlga chiqdim» работает за 1 час до выезда и позже, один раз.
- После нажатия поездка «в пути»: её не видно в поиске, её нельзя отменить, бронь в ней нельзя отменить, пост канала сразу пишет «Safar boshlandi».
- Нет нажатия через 1 час: бот спрашивает один раз (текст 6). Через 2 часа Cron сам ставит выезд.
- После нажатия заявки без ответа сразу истекают: попутчик и водитель получают те же сообщения бота, что и при истечении срока ответа (тексты есть, новых нет). Подтвердить заявку в пути нельзя.
- «Yetib keldik» работает только в пути. Сроки после поездки (оценка, жалоба) не меняются. Близкие водителя сразу видят «Yetib keldi»; поделиться такой поездкой уже нельзя.
- «Qaytish safari» и «Oxirgi yoʻnalish» берут способ посадки прошлой поездки, только если у нового направления есть пятак; иначе тихо «Shahar boʻylab yigʻaman», без лишнего шага.
- Галочка «Mashinada ayol bor» сохраняется, только если водитель мужчина и мест в поездке меньше, чем в машине. Иначе она тихо не сохраняется, без ошибки (`06`, правило 3).
- Встреча (`126`): с 30 минут до выезда и до закрытия поездки водитель ставит у каждого попутчика «Men keldim», потом «Keldi» или «Kelmadi». «Keldi» и «Kelmadi» ставятся один раз. «Kelmadi» нельзя после «Mashinaga chiqdim» попутчика. После «Keldi» или «Kelmadi» поездку и бронь уже нельзя отменить.
- «Kelmadi» сам подаёт жалобу команде. Модератор только предлагает возврат комиссии; деньги идут в «Hamyon» после «Qaytarishni tasdiqlash» владельца (тексты 11 … 19). Неявка не считается поездкой: нет оценки, нет в истории.
