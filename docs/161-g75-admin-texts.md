# 161. G75: тексты админки на согласие владельца

> **Кратко:** новые тексты админки по макетам `goals/g67/1-chosen.png` (главный экран) и `goals/g67/2-variant-2.png` (дела). Ключи в `team.json` и `navbat.json`. Согласие владельца по правилу `33`, проверка носителем по `25`. Пока согласия нет, строка помечена «ждёт». Остальные тексты G75: `160`.

## Главный экран команды (`team.*`)

| Ключи | Где | Текст | Согласие |
|---|---|---|---|
| `section.diqqat`, `section.navbat` | заголовки частей | «Diqqat», «Navbat» | ждёт |
| `filter.*` | фильтр очереди | «Hammasi», «Arizalar», «Shikoyatlar», «Rasmlar», «Murojaatlar» | ждёт |
| `case.application`, `case.complaint`, `case.face`, `case.support` | строка дела | «Ariza: {name}», «Shikoyat: {name} → {against}», «Rasm: {name}», «Murojaat: {name}» | ждёт |
| `case.passenger`, `case.question`, `case.appeal`, `case.taken` | вторая строка дела | «Yoʻlovchi», «Savol», «Blok haqida», «{name} koʻrmoqda» | ждёт |
| `wait.minutes`, `wait.hours` | время справа | «{count} daq», «{count} soat» | ждёт |
| `empty` | очередь пуста | «Hammasi koʻrildi» | ждёт |
| `work.*` | цифры модератора | «bugun qildingiz», «kutmoqda», «daq oʻrtacha», «{limit} daqdan oshgan» (на макете «30 daq dan oshgan») | ждёт |
| `diqqat.errors`, `diqqat.errorsLink` | «Diqqat» | «{count} ta xato bugun», «Statistika → Xatolar» | ждёт |
| `diqqat.drop`, `diqqat.dropLink` | «Diqqat» | «{count} qadamda odam kamaydi», «Statistika → Voronka» | ждёт |
| `diqqat.money`, `diqqat.moneyHint` | «Diqqat» | «{count} haydovchida pul kam», «{seats} joydan kam qoldi» | ждёт |
| `diqqat.late`, `diqqat.contact`, `diqqat.rating`, `diqqat.pair`, `diqqat.peopleLink` | «Diqqat» | «{count} ta ish kechikdi», «{count} ta suhbatda raqam yozildi», «{count} kishida reyting past», «{count} juft gaplashdi, bron yoʻq», «Odamlar» | ждёт |

## Дела «Navbat» (`navbat.*`)

| Ключи | Где | Текст | Согласие |
|---|---|---|---|
| `progress` | под заголовком дела | «{n} / {m} · qarordan keyin keyingisi oʻzi ochiladi» | ждёт |
| `application.title`, `application.car`, `application.seats` | заявка | «{name} · ariza», «{car} · {color}», «{count} joy» | ждёт |
| `application.driver`, `application.who` | заявка | «Haydovchi», «{name}, {gender}» | ждёт |
| `application.was`, `application.wasCar` | другая машина, чем одобренная | «Oldingi mashina», «{model} · {color} · {plate}» | ждёт |
| `application.samePlate` | предупреждение | «Bu raqam yana {count} arizada bor. Tekshiring.» | ждёт |
| `complaint.title`, `complaint.who`, `complaint.whoValue`, `complaint.reason` | жалоба | «Shikoyat», «Kim», «{author} → {against} ({role})», «Sabab» | ждёт |
| `complaint.words`, `complaint.minutesAgo`, `complaint.hoursAgo`, `complaint.daysAgo` | слова автора | «{name}ning soʻzi», «{count} daqiqa oldin», «{count} soat oldin», «{count} kun oldin» | ждёт |
| `complaint.chat`, `complaint.none` | жалоба | «Suhbatni koʻrish», «Buzilish yoʻq» | ждёт |
| `face.title`, `face.who`, `face.minutes`, `face.hours` | фото попутчика | «Yoʻlovchi rasmi», «{name} · yoʻlovchi», «{count} daqiqa kutmoqda», «{count} soat kutmoqda» | ждёт |
| `face.check.*` | 3 пункта | «Yuz aniq koʻrinadi», «Bitta odam», «Haqiqiy rasm (multfilm emas)» | ждёт |
| `face.approve`, `face.reject`, `face.reasonTitle` | решения | «Rasm mos», «Mos emas: sababi», «Rasm nimasi bilan mos emas?» | ждёт |
| `support.title`, `support.about` | обращение (нет на макете) | «{name} · murojaat», «Mavzu» | ждёт |
| `support.voice`, `support.photo`, `support.placeholder`, `support.send` | обращение | «Ovozli xabar», «Rasm», «Javobingizni yozing», «Javob yuborish» | ждёт |
| `errors.support.not_sent` | ответ не дошёл | «Javob odamga yetib bormadi. Birozdan keyin qayta yuboring.» | ждёт |

## «Boshqaruv» и его экраны (`manage.*`, макета внутренних экранов нет: вид как у «Boshqaruv» g67/2 экран 6)

| Ключи | Где | Текст | Согласие |
|---|---|---|---|
| `ownerOnly`, `group.*` | «Boshqaruv» | «Faqat egasi koʻradi», «Odamlar va safarlar», «Pul», «Joylar»; четвёртая группа: имя бренда | ждёт |
| `people`, `peopleHint`, `tripsToday`, `walletsLow`, `pricingHint` | строки | «Odamlar», «Qidirish, bloklar, tarix», «Bugun {count} ta», «{count} tasida pul kam», «Yoʻnalish narxlari» | ждёт |
| `channelsHint`, `count`, `statisticsHint`, `team`, `teamHint`, `company` | строки | «{count} ta · {subscribers} obunachi», «{count} ta», «Kun, hafta, xatolar, manbalar», «Jamoa», «{count} moderator», «Hujjatlar va kompaniya» | ждёт |
| `limits`, `limitsHint`, `journal`, `journalHint` | строки, нет на макете | «Cheklovlar», «Odamlar uchun chegaralar», «Jurnal», «Jamoaning har bir qarori» | ждёт |
| `person.*` | «Odamlar» | «Qidirish», «ID raqami», «Ochish», «Roʻyxatdan oʻtgan», «Reyting», «Hali baho yoʻq», «{average} ({count} ta baho)», «Safarlar», «Haydovchi: {trips} · yoʻlovchi: {rides}», «Unga shikoyatlar», «Bloklangan» | ждёт |
| `teamAdd`, `teamAddButton`, `teamRemove`, `teamRemoveAsk` | «Jamoa» | «Moderator qoʻshish», «Qoʻshish», «Jamoadan olib tashlash», «{name} jamoadan olib tashlansinmi?» | ждёт |
| `limit.*` (36 ключей), `limitGroup.*`, `limitHistory`, `limitChange`, `limitRange`, `limitNew`, `limitSave`, `unit.*` | «Cheklovlar» | названия лимитов (`manage.json`), «Oʻzgarishlar», «{before} → {after} · {by} · {date}», «Yangi qiymat», «Saqlash», «{value} ta / daq / soat / kun / %» | ждёт |
| `journalEmpty`, `journalMore`, `entry.*` | «Jurnal» | «Hali qaror yoʻq», «Yana», «Ariza tasdiqlandi», «{days} kunga blok», «Komissiya qaytarildi», «Jamoaga qoʻshildi» и др. | ждёт |
| `channel.*` | «Kanallar» | «{count} obunachi», «oyda {count} kishi keldi», «Bot yoza olmaydi», «{count} post bormadi» | ждёт |
