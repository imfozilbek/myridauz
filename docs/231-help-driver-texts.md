# 231. «Yordam» водителя и бот «Yordam»: темы, вопросы и ответы (на согласие)

> **Кратко:** решение владельца 12.11.2026, продолжение `230`. Водителю 6 тем; вопросы с пометкой **[A]** видит только тот, чья заявка ещё не одобрена. Боту «Yordam» темы по роли человека и новая тема «Yordam xizmati». Числа в фигурных скобках из бренда и «Cheklovlar». Статус: **согласовано владельцем 12.11.2026**; ждёт проверки носителем (`docs/25`).

## 1. «Ariza va mashina»

| Вопрос | Ответ |
|---|---|
| Arizaga nima kerak? **[A]** | Yuzingiz rasmi, mashina maʼlumotlari (model, rang, davlat raqami, yoʻlovchi joylari) va mashinaning old tomondan, raqami koʻrinadigan bitta rasmi. Hujjat kerak emas. |
| Arizam qachon koʻrib chiqiladi? **[A]** | Jamoamiz arizalarni har kuni soat {from} dan {to} gacha, odatda 1 soat ichida tekshiradi. Kechasi yuborilgan ariza ertalab koʻriladi. Javob botga va bosh ekranga keladi. |
| Tekshiruv paytida nima qila olaman? **[A]** | Ilovani koʻrib chiqishingiz mumkin. Safar eʼlon qilish va «Yoʻlovchilar soʻrovlari» ariza tasdiqlangach ochiladi. |
| Arizam qaytarildi. Nima qilaman? **[A]** | Bosh ekranda «Tuzatish»ni bosing. Belgilangan joylarni tuzating va «Qayta yuborish»ni bosing. |
| Mashinamni qanday almashtiraman? | «Profil» → «Mashinam»: maʼlumot va rasmni yangilang, arizani yuboring. Faol safaringiz boʻlsa, avval uni tugating. Yangi mashina tasdiqlanguncha yangi safar eʼlon qilib boʻlmaydi. |

## 2. «Safar eʼlon qilish»

| Вопрос | Ответ |
|---|---|
| Safarni qanday eʼlon qilaman? | «Safar eʼlon qilish»ni bosing. Yoʻnalish, olib ketish joyi, kun va vaqt, boʻsh joylar va bir joy narxini tanlang, keyin «Eʼlon qilish». |
| Qachonga eʼlon qilsam boʻladi? | Kamida {leadMinutes} daqiqadan keyinga va {daysAhead} kungacha oldinga. Vaqtni oraliq bilan ham berish mumkin: {rangeMaxHours} soatgacha. |
| Nechta safar eʼlon qilsam boʻladi? | Bir vaqtda bitta. Keyingisini safar tugagach («Yetib keldik») eʼlon qilasiz. |
| Narxni qanday belgilayman? | Narx tavsiya boʻyicha qoʻyiladi. Uni yoʻnalish chegarasida oʻzgartirish mumkin. |
| Vaqt yoki narxni oʻzgartirsam boʻladimi? | «Vaqt yoki narx»ni bosing. Vaqtni faqat kechroqqa, jami {shiftMinutes} daqiqagacha surish mumkin. Narxni faqat pasaytirish mumkin. Yoʻlga chiqqach oʻzgartirib boʻlmaydi. |
| Safarni qanday bekor qilaman? | «Safarni bekor qilish»ni bosing: faqat yoʻlga chiqishdan oldin. Yoʻlovchilarga xabar boradi, komissiya hamyoningizga qaytadi. |

## 3. «Yoʻlovchilar va soʻrovlar»

| Вопрос | Ответ |
|---|---|
| Joy soʻrovi kelsa nima qilaman? | «Mening safarim» → «Joy soʻraganlar»: «Tasdiqlash» yoki «Rad etish». Botdagi tugmalar ham ishlaydi. Komissiya tasdiqlaganda olinadi. |
| Qancha vaqtda javob berishim kerak? | {hours} soat ichida, lekin safar vaqtidan kechiktirmay. Muddat kechaga toʻgʻri kelsa, ertalab soat {morning} gacha uzayadi. |
| «Yoʻlovchilar soʻrovlari» nima? | Yoʻnalishlaringiz boʻyicha yoʻlovchilar qoldirgan soʻrovlar. «Taklif yuborish»ni bosing. Yoʻlovchi qabul qilsa, joy darhol tasdiqlanadi va komissiya olinadi. |
| Yoʻlovchi bilan qanday bogʻlanaman? | Yozishma va qoʻngʻiroq {brand} ichida, raqamlar koʻrinmaydi. Joy tasdiqlanguncha bitta suhbatda {requestRings} martagacha qoʻngʻiroq qilish mumkin. |
| Hamyonda pul yetmasa-chi? | «Tasdiqlash» oʻrniga «Hisobni toʻldirish» chiqadi. Avval hamyonni toʻldiring. |

## 4. «Safar kuni va keyin»

| Вопрос | Ответ |
|---|---|
| «Yoʻlga chiqdim»ni qachon bosaman? | Safardan 1 soat oldin bosish mumkin. Bosmasangiz, {autoDepartHours} soatdan keyin oʻzi belgilanadi. |
| Yoʻlovchini qanday topaman? | Safardan {meetMinutes} daqiqa oldin uchrashuv kartasi chiqadi: yoʻlovchi nuqtasi va «Xaritada ochish». Kelganda «Men keldim»ni bosing, yoʻlovchiga xabar boradi. |
| Yoʻlovchi kelmasa-chi? | Avval «Men keldim»ni bosing. Keyin yoʻlovchi yonida «Kelmadi» chiqadi. Jamoa tekshirib tasdiqlasa, komissiya hamyoningizga qaytadi. |
| Yoʻlovchilarni qanday baholayman? | «Yetib keldik»dan keyin «Safar tugadi» ochiladi: yulduzlarni bosing. {ratingDays} kun ichida. |
| Shikoyat qilsam boʻladimi? | Ha, «Shikoyat qilish», {complaintDays} kun ichida. Yoʻlovchi kim shikoyat qilganini koʻrmaydi. |
| Nega safarim qidiruvda koʻrinmayapti? | {windowDays} kunda turli odamlardan {hideAfter} ta shikoyat kelsa, jamoa tekshirguncha safarlaringiz qidiruvda koʻrinmaydi. |

## 5. «Hamyon va komissiya»

| Вопрос | Ответ |
|---|---|
| Haydovchi uchun qancha turadi? | Bir joy narxining {percent} foizi, lekin kamida {minPerSeat}. Joy tasdiqlanganda yoki yoʻlovchi taklifingizni qabul qilganda olinadi. Yoʻlovchi pulni sizga safarda oʻzi beradi: naqd yoki pul oʻtkazish orqali. |
| Bonus qanday ishlaydi? | Ariza tasdiqlangach {bonus} bonus beriladi. Har bir bonus {bonusDays} kun amal qiladi. Ishlatib boʻlsangiz, keyingisi keladi: dastlabki {windowDays} kunda {bonusGrants} martagacha. |
| Hamyonni qanday toʻldiraman? | «Hamyon»da «Hisobni toʻldirish»ni bosing. Yordam boti tayyor xabar bilan ochiladi: uni yuboring, jamoamiz qanday toʻlashni yozadi. |
| Joy bekor boʻlsa, komissiya qaytadimi? | Ha, kim bekor qilganidan qatʼi nazar, oʻsha hisobga qaytadi. |
| Yoʻlovchi kelmasa, komissiya qaytadimi? | Ha, jamoa tekshirgandan keyin. Uchrashuvda «Men keldim», keyin «Kelmadi»ni bosing. |

## 6. «Hisob va xavfsizlik»

| Вопрос | Ответ |
|---|---|
| Telefon raqamim koʻrinadimi? | Yoʻq. Yozishma va qoʻngʻiroq {brand} ichida boʻladi. |
| Rasmimni almashtirsam boʻladimi? | Ha. Haydovchilik huquqingiz saqlanadi. Yangi rasm jamoa tekshirgach boshqalarga koʻrinadi. |
| Hisobim bloklandi. Nima qilaman? | Ekranda blok qachon tugashi yozilgan. Savolingiz boʻlsa, yordam botiga yozing. |
| Maʼlumotlarimni qanday oʻchiraman? | Profilni oching va eng pastdagi «Maʼlumotlarimni oʻchirish»ni bosing. Safar va joylar bekor boʻladi, hamyondagi pul ham yoʻqoladi. Buni qaytarib boʻlmaydi. |

## Бот «Yordam»: тема «Yordam xizmati»

| Вопрос | Ответ |
|---|---|
| Javob qachon keladi? | Jamoamiz har kuni soat {from} dan {to} gacha javob beradi. Kechasi yozsangiz, ertalab javob beramiz. |
| Ovozli xabar yoki rasm yuborsam boʻladimi? | Ha: matn, rasm va ovozli xabar. |
| Kim javob beradi? | {brand} jamoasidan bir kishi, «Operator» imzosi bilan. |
| Telefon raqamimni yozishim kerakmi? | Yoʻq. Jamoa ismingizni va safaringizni koʻradi. |

Темы бота: попутчику темы `230`, водителю темы выше; новому человеку обе роли на выбор. Боты попутчика и водителя на /yordam показывают только темы своей роли.

## Ошибки, которые чиним вместе с текстами

1. Экран водителя «Odatda 30 daqiqagacha», помощь и бот «1 soat ichida»: один срок везде.
2. «Kelmadi» появляется после «Men keldim», а не за {meetMinutes} минут (`no-show-line.tsx`).
3. Бонус: до {bonusGrants} раз по {bonusDays} дней, а не один.
4. Бот водителя показывает темы попутчика.
5. Голос, фото или стикер в боте попутчика или водителя: бот молчит. Нужен ответ «Yordam» и ссылка на бот «Yordam».
6. Бот «Yordam» ночью пишет «Tez orada javob beramiz»: ночью «ertalab javob beramiz».
7. Отклонённому водителю советуют «Boshqa savolim bor», а «Yordam» ему не виден: в ответе ссылка на бот «Yordam».
8. Числа в текстах («7 kun», «24 soat», «5 kishi», «30 kun»): берём из «Cheklovlar».
9. `docs/127` устарел: одна ждущая бронь, 7 дней на оценку, одно фото машины.
