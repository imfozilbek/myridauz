# 140. G63: новые тексты на согласие владельца

> **Кратко:** все новые узбекские тексты G63, 100 строк: сервер (выезд и приезд, встреча, возврат за неявку, просмотры), экран публикации, «Mening safarim» с карточкой канала, «Safar xaritasi», встреча, заметка попутчика и «после поездки». **Согласие владельца 08.10.2026: да, тексты как на макетах** (где текст есть на макете, он в коде точно как на макете). Проверка носителем (`25`) остаётся.

## Новые (согласие 08.10.2026)

| # | Где | Текст |
|---|---|---|
| 1 | Ошибка: «Yoʻlga chiqdim» раньше чем за час до выезда (`trips.too_early_to_depart`) | Hali erta. «Yoʻlga chiqdim» safar vaqtidan 1 soat oldin ishlaydi. |
| 2 | Ошибка: второе нажатие «Yoʻlga chiqdim» (`trips.already_departed`) | Yoʻlga chiqqaningiz allaqachon belgilangan. |
| 3 | Ошибка: «Yetib keldik» до выезда (`trips.not_departed`) | Avval «Yoʻlga chiqdim» tugmasini bosing. |
| 4 | Ошибка: второе нажатие «Yetib keldik» (`trips.already_arrived`) | Yetib kelganingiz allaqachon belgilangan. |
| 5 | Ошибка публикации: «Pitakdan» или «Ikkalasi», а у направления нет пятака (`trips.no_pitak`) | Bu yoʻnalishda pitak yoʻq. «Uydan» usulini tanlang. |
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
| 22 | «Mening safarim»: карточка канала, подпись: канал и сколько разных людей открыли поездку (`driverTrip.channel.views`); пока никто не открыл, только название канала | {channel} · {count} koʻrdi (решение владельца 08.10.2026, вариант 1) |
| 23 | «Mening safarim»: кнопка в карточке канала, ссылка поездки через «Поделиться» Telegram (`driverTrip.channel.share`) | Havolani yoʻlovchilarga yuborish |

## Экраны C3: встреча, конец поездки, прошлая поездка (согласие 08.10.2026)

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

## Экран публикации C1 (согласие 08.10.2026)

Ключи в `market.json` (`market.publish.*`) и `way.json` (`way.trip.*`).

| # | Где | Текст |
|---|---|---|
| 55 | «Safar eʼlon qilish»: подзаголовок: машина и номер (`publish.car`) | {model}, {color} · {plate} |
| 56 | «Safar eʼlon qilish»: заголовок карточки (`publish.head`) | Safar |
| 57 | «Safar eʼlon qilish»: строка дня и времени (`publish.day`) | {date}, {time} |
| 58 | «Safar eʼlon qilish»: подсказка под «boʻsh joylar» (`publish.carSeats`) | Mashinada {count} joy |
| 59 | «Safar eʼlon qilish»: подсказка под «mashinada ayol bor» (`publish.womanHint`) | Siz bilan ketayotgan odam ayolmi? |
| 60 | «Safar eʼlon qilish»: подсказка под «bir joy narxi» (`publish.price`) | Tavsiya: {price} · komissiya {commission} |
| 61 | «Safar eʼlon qilish»: подсказка под «qanday band qilinadi?» (`publish.rule`) | {rule} · {sum} |
| 62 | «Safar eʼlon qilish»: строка комментария, пока он пустой (`publish.comment`) | Izoh (ixtiyoriy) |
| 63 | «Safar eʼlon qilish»: главная кнопка (`publish.send`) | Eʼlon qilish |
| 64 | «Qayerdan olasiz?»: подсказка при «Uydan» (`way.trip.mode.doorHint`) | Yoʻlovchilar uyidan: oʻzlari xaritada belgilaydi. |
| 65 | «Qayerdan olasiz?»: карточка пятака (`way.trip.pitak`) | {direction} yoʻnalishi pitagi |
| 66 | «Qayerdan olasiz?»: карточка пятака, открывает карту (`way.trip.onMap`) | Xaritada |
| 67 | «Qayerdan olasiz?» (`way.trip.mode.title`, **изменён**; было «Yoʻlovchilarni qayerdan olasiz?») | Qayerdan olasiz? |
| 68 | «Qayerdan olasiz?» (`way.trip.mode.door`, **изменён**; было «Shahar boʻylab yigʻaman») | Uydan |
| 69 | «Qayerdan olasiz?» (`way.trip.mode.pitak`, **изменён**; было «Pitakdan olaman») | Pitakdan |
| 70 | «Qayerdan olasiz?» (`way.trip.mode.both`, **изменён**; было «Ikkalasi ham») | Ikkalasi |

## «Mening safarim» C2 (согласие 08.10.2026)

Ключи в `driver-trip.json` (`driverTrip.*`); карточка канала выше, № 21 … 23.

| # | Где | Текст |
|---|---|---|
| 71 | «Mening safarim»: плашка после публикации (`published.title`) | Safar eʼlon qilindi |
| 72 | «Mening safarim»: плашка после публикации, вторая строка (`published.sub`) | Yoʻlovchilar qidiruvda koʻrmoqda |
| 73 | «Mening safarim»: плашка за 30 минут (`soon.title`) | Joʻnashga {minutes} daqiqa |
| 74 | «Mening safarim»: плашка за 30 минут, вторая строка (`soon.sub`) | {passengers} yoʻlovchi tasdiqlangan · {seats} boʻsh joy |
| 75 | «Mening safarim»: плашка в пути (`onWay.title`) | Yoʻldasiz |
| 76 | «Mening safarim»: плашка в пути, вторая строка (окончание по последней букве места) (`onWay.sub`) | {place}{last, select, q {qa} k {ka} other {ga}} ≈ {time} da |
| 77 | «Mening safarim»: заголовок заявок (`asked`) | Joy soʻraganlar ({count}) |
| 78 | «Mening safarim»: заголовок попутчиков (`passengers`) | Yoʻlovchilar ({count}) |
| 79 | «Mening safarim»: заголовок карточки (`trip`) | Safar |
| 80 | «Mening safarim»: день и время в карточке (`when`) | {day}, {time} |
| 81 | «Mening safarim»: места и цена в карточке (`free`) | {count} boʻsh joy · {price} |
| 82 | «Mening safarim»: все места заняты (`full`) | Hamma joy band · {price} |
| 83 | «Mening safarim»: правило салона в карточке (`rule.seatsOrCar`) | Joylar yoki salon |
| 84 | «Mening safarim»: комиссия в карточке заявки (`commission`) | komissiya {amount} |
| 85 | «Mening safarim»: плитка (`tile.story`) | Hikoyaga |
| 86 | «Mening safarim»: плитка (`tile.change`) | Vaqt yoki narx |
| 87 | «Mening safarim»: плитка (`tile.map`) | Yoʻl xaritasi |
| 88 | «Mening safarim»: главная кнопка (`main.departed`) | Yoʻlga chiqdim |
| 89 | «Mening safarim»: главная кнопка (`main.arrived`) | Yetib keldik |
| 90 | «Mening safarim»: причина у плитки «Hikoyaga»: старый Telegram (`story.noApp`) | Hikoyaga joylash uchun Telegramni yangilang. |
| 91 | «Mening safarim»: причина у плитки «Hikoyaga»: нет мест (`story.closed`) | Hikoyaga faqat boʻsh joyi bor safar joylanadi. |
| 92 | «Mening safarim»: причина у плитки «Hikoyaga»: в пути (`story.left`) | Yoʻlga chiqqan safarni hikoyaga joylab boʻlmaydi. |
| 93 | «Mening safarim»: причина у плитки «Vaqt yoki narx»: в пути (`change.closed`) | Yoʻlga chiqqan safarning vaqti va narxi oʻzgarmaydi. |

## Как это работает (коротко)

- «Yoʻlga chiqdim» работает за 1 час до выезда и позже, один раз.
- После нажатия поездка «в пути»: её не видно в поиске, её нельзя отменить, бронь в ней нельзя отменить, пост канала сразу пишет «Safar boshlandi».
- Нет нажатия через 1 час: бот спрашивает один раз (текст 6). Через 2 часа Cron сам ставит выезд.
- После нажатия заявки без ответа сразу истекают: попутчик и водитель получают те же сообщения бота, что и при истечении срока ответа (тексты есть, новых нет). Подтвердить заявку в пути нельзя.
- «Yetib keldik» работает только в пути. Сроки после поездки (оценка, жалоба) не меняются. Близкие водителя сразу видят «Yetib keldi»; поделиться такой поездкой уже нельзя.
- «Qaytish safari» и «Oxirgi yoʻnalish» берут способ посадки прошлой поездки, только если у нового направления есть пятак; иначе тихо «Uydan», без лишнего шага.
- Галочка «Mashinada ayol bor» сохраняется, только если водитель мужчина и мест в поездке меньше, чем в машине. Иначе она тихо не сохраняется, без ошибки (`06`, правило 3).
- Встреча (`126`): с 30 минут до выезда и до закрытия поездки водитель ставит у каждого попутчика «Men keldim», потом «Keldi» или «Kelmadi». «Keldi» и «Kelmadi» ставятся один раз. «Kelmadi» нельзя после «Mashinaga chiqdim» попутчика. После «Keldi» или «Kelmadi» поездку и бронь уже нельзя отменить.
- «Kelmadi» сам подаёт жалобу команде. Модератор только предлагает возврат комиссии; деньги идут в «Hamyon» после «Qaytarishni tasdiqlash» владельца (тексты 11 … 19). Неявка не считается поездкой: нет оценки, нет в истории.

## Добавлены 08.10.2026, переделка по макетам (согласие 08.10.2026)

| # | Где | Текст |
|---|---|---|
| 94 | «Safar xaritasi», заголовок (`way.map.title`), макет g63/4 экран 12 | {day} {time} · {count} yoʻlovchi |
| 95 | «Qayerdan, qayerga?» попутчика, третья строка (`bookings.points.note`) | Izoh (ixtiyoriy) |
| 96 | Экран заметки попутчика, подсказка (`bookings.note.hint`) | Haydovchi sizni tanishi uchun. Masalan: qizil kurtka, sumka bilan. |
| 97 | Карточка канала: имя канала в Telegram (`driverTrip.channel.name`), макет g59/7 | {brand} \| {title} |
| 98 | «Qanday band qilinadi?» (`market.rule.price`, **изменён**: «soʻm» переносится, как на макете g63/4 экран 4; было «… = {sum}.») | Butun salon narxi: {count} joy × {price} = {sum} soʻm. |
| 99 | Политика конфиденциальности, «Qanday maʼlumotlar» (`privacy.2.text`, новые строки, редакция 1.3) | Joy band qilganda haydovchiga yozgan izohingiz: u sizni uchrashuvda taniydi. Unda telefon raqami va havolalar yashiriladi.<br>Qaysi safarlarni ochganingiz. Haydovchi faqat nechta odam koʻrganini koʻradi, kimligini koʻrmaydi. |
| 100 | Политика конфиденциальности, «Maʼlumotlarni oʻchirish» (`privacy.6.text`, **изменён**: было «Olib ketish va tushirish nuqtalari bundan qisqa saqlanadi … nuqtalar qaror chiqqandan keyin …») | Olib ketish va tushirish nuqtalari va haydovchiga yozilgan izoh bundan qisqa saqlanadi … ular qaror chiqqandan keyin oʻchiriladi. |

Убраны вместе с вкладками «Safar xaritasi» (их нет на макете экрана 12): `way.map.pickups`, `way.map.dropoffs`, `way.map.up`, `way.map.down`, `way.map.navigatorChange`.
