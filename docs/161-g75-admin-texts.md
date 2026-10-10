# 161. G75: тексты админки на согласие владельца

> **Кратко:** новые тексты админки по макетам `goals/g67/1-chosen.png` (главный экран) и `goals/g67/2-variant-2.png` (дела). Ключи в `team.json` и `navbat.json`. Согласие владельца по правилу `33`, проверка носителем по `25`. Пока согласия нет, строка помечена «ждёт». **10.10.2026 владелец согласился со всеми текстами.** Остальные тексты G75: `160`.

## Главный экран команды (`team.*`)

| Ключи | Где | Текст | Согласие |
|---|---|---|---|
| `section.diqqat`, `section.navbat` | заголовки частей | «Diqqat», «Navbat» | да, 10.10.2026 |
| `filter.*` | фильтр очереди | «Hammasi», «Arizalar», «Shikoyatlar», «Rasmlar», «Murojaatlar» | да, 10.10.2026 |
| `case.application`, `case.complaint`, `case.face`, `case.support` | строка дела | «Ariza: {name}», «Shikoyat: {name} → {against}», «Rasm: {name}», «Murojaat: {name}» | да, 10.10.2026 |
| `case.passenger`, `case.question`, `case.appeal`, `case.taken` | вторая строка дела | «Yoʻlovchi», «Savol», «Blok haqida», «{name} koʻrmoqda» | да, 10.10.2026 |
| `wait.minutes`, `wait.hours` | время справа | «{count} daq», «{count} soat» | да, 10.10.2026 |
| `empty` | очередь пуста | «Hammasi koʻrildi» | да, 10.10.2026 |
| `work.*` | цифры модератора | «bugun qildingiz», «kutmoqda», «daq oʻrtacha», «{limit} daqdan oshgan» (на макете «30 daq dan oshgan») | да, 10.10.2026 |
| `diqqat.errors`, `diqqat.errorsLink` | «Diqqat» | «{count} ta xato bugun», «Statistika → Xatolar» | да, 10.10.2026 |
| `diqqat.drop`, `diqqat.dropLink` | «Diqqat» | «{count} qadamda odam kamaydi», «Statistika → Voronka» | да, 10.10.2026 |
| `diqqat.money`, `diqqat.moneyHint` | «Diqqat» | «{count} haydovchida pul kam», «{seats} joydan kam qoldi» | да, 10.10.2026 |
| `diqqat.late`, `diqqat.contact`, `diqqat.rating`, `diqqat.pair`, `diqqat.peopleLink` | «Diqqat» | «{count} ta ish kechikdi», «{count} ta suhbatda raqam yozildi», «{count} kishida reyting past», «{count} juft gaplashdi, bron yoʻq», «Odamlar» | да, 10.10.2026 |

## Дела «Navbat» (`navbat.*`)

| Ключи | Где | Текст | Согласие |
|---|---|---|---|
| `progress` | под заголовком дела | «{n} / {m} · qarordan keyin keyingisi oʻzi ochiladi» | да, 10.10.2026 |
| `application.title`, `application.car`, `application.seats` | заявка | «{name} · ariza», «{car} · {color}», «{count} joy» | да, 10.10.2026 |
| `application.driver`, `application.who` | заявка | «Haydovchi», «{name}, {gender}» | да, 10.10.2026 |
| `application.was`, `application.wasCar` | другая машина, чем одобренная | «Oldingi mashina», «{model} · {color} · {plate}» | да, 10.10.2026 |
| `application.samePlate` | предупреждение | «Bu raqam yana {count} arizada bor. Tekshiring.» | да, 10.10.2026 |
| `complaint.title`, `complaint.who`, `complaint.whoValue`, `complaint.reason` | жалоба | «Shikoyat», «Kim», «{author} → {against} ({role})», «Sabab» | да, 10.10.2026 |
| `complaint.words`, `complaint.minutesAgo`, `complaint.hoursAgo`, `complaint.daysAgo` | слова автора | «{name}ning soʻzi», «{count} daqiqa oldin», «{count} soat oldin», «{count} kun oldin» | да, 10.10.2026 |
| `complaint.chat`, `complaint.none` | жалоба | «Suhbatni koʻrish», «Buzilish yoʻq» | да, 10.10.2026 |
| `face.title`, `face.who`, `face.minutes`, `face.hours` | фото попутчика | «Yoʻlovchi rasmi», «{name} · yoʻlovchi», «{count} daqiqa kutmoqda», «{count} soat kutmoqda» | да, 10.10.2026 |
| `face.check.*` | 3 пункта | «Yuz aniq koʻrinadi», «Bitta odam», «Haqiqiy rasm (multfilm emas)» | да, 10.10.2026 |
| `face.approve`, `face.reject`, `face.reasonTitle` | решения | «Rasm mos», «Mos emas: sababi», «Rasm nimasi bilan mos emas?» | да, 10.10.2026 |
| `support.title`, `support.about` | обращение (нет на макете) | «{name} · murojaat», «Mavzu» | да, 10.10.2026 |
| `support.voice`, `support.photo`, `support.placeholder`, `support.send` | обращение | «Ovozli xabar», «Rasm», «Javobingizni yozing», «Javob yuborish» | да, 10.10.2026 |
| `errors.support.not_sent` | ответ не дошёл | «Javob odamga yetib bormadi. Birozdan keyin qayta yuboring.» | да, 10.10.2026 |

## «Boshqaruv» и его экраны (`manage.*`, макета внутренних экранов нет: вид как у «Boshqaruv» g67/2 экран 6)

| Ключи | Где | Текст | Согласие |
|---|---|---|---|
| `ownerOnly`, `group.*` | «Boshqaruv» | «Faqat egasi koʻradi», «Odamlar va safarlar», «Pul», «Joylar»; четвёртая группа: имя бренда | да, 10.10.2026 |
| `people`, `peopleHint`, `tripsToday`, `walletsLow`, `pricingHint` | строки | «Odamlar», «Qidirish, bloklar, tarix», «Bugun {count} ta», «{count} tasida pul kam», «Yoʻnalish narxlari» | да, 10.10.2026 |
| `channelsHint`, `count`, `statisticsHint`, `team`, `teamHint`, `company` | строки | «{count} ta · {subscribers} obunachi», «{count} ta», «Kun, hafta, xatolar, manbalar», «Jamoa», «{count} moderator», «Hujjatlar va kompaniya» | да, 10.10.2026 |
| `limits`, `limitsHint`, `journal`, `journalHint` | строки, нет на макете | «Cheklovlar», «Odamlar uchun chegaralar», «Jurnal», «Jamoaning har bir qarori» | да, 10.10.2026 |
| `person.*` | «Odamlar» | «Qidirish», «ID raqami», «Ochish», «Roʻyxatdan oʻtgan», «Reyting», «Hali baho yoʻq», «{average} ({count} ta baho)», «Safarlar», «Haydovchi: {trips} · yoʻlovchi: {rides}», «Unga shikoyatlar», «Bloklangan» | да, 10.10.2026 |
| `teamAdd`, `teamAddButton`, `teamRemove`, `teamRemoveAsk` | «Jamoa» | «Moderator qoʻshish», «Qoʻshish», «Jamoadan olib tashlash», «{name} jamoadan olib tashlansinmi?» | да, 10.10.2026 |
| `limit.*` (36 ключей), `limitGroup.*`, `limitHistory`, `limitChange`, `limitRange`, `limitNew`, `limitSave`, `unit.*` | «Cheklovlar» | названия лимитов (`manage.json`), «Oʻzgarishlar», «{before} → {after} · {by} · {date}», «Yangi qiymat», «Saqlash», «{value} ta / daq / soat / kun / %» | да, 10.10.2026 |
| `journalEmpty`, `journalMore`, `entry.*` | «Jurnal» | «Hali qaror yoʻq», «Yana», «Ariza tasdiqlandi», «{days} kunga blok», «Komissiya qaytarildi», «Jamoaga qoʻshildi» и др. | да, 10.10.2026 |
| `channel.*` | «Kanallar» | «{count} obunachi», «oyda {count} kishi keldi», «Bot yoza olmaydi», «{count} post bormadi» | да, 10.10.2026 |
