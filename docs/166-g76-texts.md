# 166. G76: новые тексты главного экрана

> **Кратко:** новые узбекские тексты финальных макетов G76 (`165`). Согласие владельца: **дано 10.10.2026**. Дальше: проверка носителем (`25`). Где в коде уже есть те же слова, цель берёт старый ключ, а не делает новый. `{…}`: подставляется кодом.

## Шапка и плитки

| Где | Текст |
|---|---|
| Шапка попутчика | «Bahom», «Yangi», «Rasm qoʻshing», «Tezroq tasdiq» |
| Шапка водителя | «Mashina», «Qoʻshing» |
| Подписи плиток | «Hali safar yoʻq», «{n} ta safar», «{n} ta soʻrov», «{n} ta taklif», «{n} ta joy», «{n} ta joy soʻraldi», «{n} yangi soʻrov», «{n} soʻrov kutmoqda» |
| | «Haydovchilar bilan», «Yoʻlovchilar bilan», «{n} ta yangi xabar» |
| | «{n} ta haydovchi», «Safardan keyin qoʻshasiz», «{ism} {qachon}» |
| | «Tasdiqdan keyin bonus», «Bonus {summa}», «{summa} soʻm yetmaydi» |

## Стрелка «Hozir» и таймеры

| Вид | Текст |
|---|---|
| Тёмная | «Bu yerdan boshlang», «Siz uchun safar», «Birinchi safar», «Hozir: bitta savol», «Bir daqiqa: baho» |
| Жёлтая | «Hozir: taklifni tanlang», «Hozir: javob bering», «Hozir: joyga boring», «Hozir: yoʻlga chiqing», «Hozir: belgilang» |
| Красная | «Haydovchi kutmoqda», «Yoʻlovchi kutmoqda», «Hozir: tuzating», «Hozir: hisobni toʻldiring» |
| Таймер | «{vaqt} gacha», «{s} soat {m} daq», «{m} daq», «{m} daq kutmoqda», «{n} kun» |

## Нижний блок попутчика

| Состояние | Текст |
|---|---|
| 3 | «Sevimli haydovchi», «bir joy {narx}», «Boshqa safar», «Koʻrish» |
| 4, 5 | «{qachon} · {n} kishi», «{n} haydovchi koʻrdi», «{vaqt1} va {vaqt2}», «Takliflarni koʻrish» |
| 6, 7 | «Javob kutilmoqda», «Bekor qilish», «Joy tasdiqlandi» |
| 8 | «Vaqt oʻzgardi», «Rozi boʻlmasangiz, joy bekor qilinadi», «Rozi emasman», «Roziman» |
| 9, 10 | «{ism} yoʻlda» (без минут, решение владельца 10.10.2026), «{moʻljal}» пятака, «{ism} joyida», «5 daqiqada», «10 daqiqada» (как в шторке встречи) |
| 11 | «Kelmadi deb belgilandi», «Xato boʻlsa, yordamga yozing» |
| 12, 13 | «Yoʻldasiz», «{ism} bilan · {n} yoʻlovchi», «Yetib keldim», «Yetib keldingizmi?», «{joy} · {vaqt} edi», «Javobingiz safarni yopadi», «Hali yoʻldaman», «Ha, yetib keldim» |
| 14, 15 | «Safar tugadi», «{ism}ni baholang», «Baho 7 kundan keyin koʻrinadi», «Baho berish», «Rad etildi», «Haydovchi joy bera olmadi», «Oʻxshash safarlar» |

## Нижний блок водителя

| Состояние | Текст |
|---|---|
| 1, 2, 3 | «Haydovchi boʻlish», «Arizani toʻldiring», «Mashina, raqam va 3 ta rasm · 3 daqiqa», «Arizani toʻldirish», «Tuzatish kerak», «Raqam rasmi aniq emas», «Bitta rasmni qayta oling» (два фото и больше: «{n} ta rasmni qayta oling»), «Tuzatish»; «Raqam rasmi aniq emas» заменил причину G62 «Rasmda davlat raqami oʻqilmaydi» везде (решение владельца 10.10.2026: макеты G76 главнее) |
| 4 | «Siz haydovchisiz!», «Bonus {summa} soʻm», «≈ {n} joyga yetadi» |
| 6, 7, 8 | «{n} kishi koʻrdi», «Hamyonda yetmaydi», «Tasdiqlash uchun {summa} soʻm yetmaydi», «Hisobni toʻldirish», «Soʻrovlar» |
| 9, 10 | «{ism} rozi boʻldi», «Hamyon», «Bonus {sana} tugaydi. Toʻldirsangiz, soʻrovlarni darhol tasdiqlaysiz» |
| 11, 12, 13 | «Yoʻl xaritasi», «Yoʻlga chiqdim», «Uchrashuv», «{ism} keldimi? Belgilang», «Kelmadi», «Keldi» |
| 14, 15, 16 | «Yoʻldasiz · {i} / {n}», «Keyingi: {joy}», «Navigator», «Yetib keldik», «Yoʻlga chiqdingizmi?», «2 soatdan keyin oʻzi yoʻlga chiqqan deb belgilanadi», «Kechikyapman» (то же слово уходит в чат попутчикам), «Yoʻlovchilarni baholang», «{n} yoʻlovchi · komissiya {summa}», «Qaytish safari» |

## Исправления G76 (`168`, ждёт согласия владельца)

- Готовый текст в поддержку, когда кошелёк просто мал и никто не ждёт: «Salom! Hamyonimni toʻldirmoqchiman.» (первая фраза утверждённого `wallet.short.message`).

## Админка

- «Moʻljal»: поле пятака, где именно стоять (G76, `72`).

## Для носителя

- «Bahom» (а не «Bahoyim»): baho → bahom, как ota → otam.
- «kutmoqda» везде, как в согласованной шторке встречи; «Kechikyapman» в разговорной форме, как кнопка.
