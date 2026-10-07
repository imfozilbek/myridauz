# 134. G60: новые тексты на согласие владельца

> **Кратко:** тексты брони, чата, звонка, экрана близких, отзыва и «после поездки» (G60, `118` путь 3, `126`, `129`, `124`). Тексты с макетов `goals/g60/` одобрены вместе с макетами 06.10.2026. Новые тексты ниже ждут согласия владельца; проверка носителем (`25`) остаётся.

## С макетов (одобрены 06.10.2026)

| Экран | Тексты |
|---|---|
| Страница брони (g60/1) | «Joy tasdiqlandi», «{день} · {время}», «{время} · olib ketish joyi», «≈ {время} · tushirish joyi», «{n} joy», «Yaqinlarimga» |
| Чат (g60/2) | «Yoʻldaman», «5 daqiqada chiqaman», «Qayerdasiz?», «Raqam va havolalar yashiriladi.», «Suhbat yopildi», «Safardan 24 soat oʻtdi. Xabarlar saqlanadi.» |
| Близкие (g60/3) | «{имя} yoʻlda», «{имя} mashinaga chiqdi», «{имя} yetib keldi», «{место}ga ≈ {время} da yetadi», «haydovchi» |
| Отзыв (g60/5) | «Safar qanday oʻtdi?», «+ Izoh yozish», «Sevimli haydovchi» |
| После поездки (g60/6, g60/7) | «Safar tugadi», «Rida orqali: yaqinlaringiz kuzatadi, shikoyat qilish mumkin, kelmasa pul qaytadi.», «ertaga {время} gacha», «{n} kun qoldi», «Shikoyat · {n} kun qoldi», «Shikoyat: Yordam orqali», «Yana {имя} bilan», «Xabarlar», «faqat oʻqish», «Baho», «muddat tugadi», «{дата} · {n} kun oldin» |
| «Mening safarlarim» (g60/6) | «Faol ({n})», «Oʻtgan», «Kecha», «Baho bering · {n} kun», «Xabar · bugun», «Baho berildi», «Aniq joylar oʻchirildi» |
| Сверка Pixel Perfect (g60/6, g60/7, 07.10) | «{дата} · safar tugadi», «Xabar · {срок}», «{имя}ning yangi safarlari», «Aniq joylar oʻchirildi: faqat tuman qoldi.», «{место} · {время}», «Kuzatish tugadi: havola yetib borgandan 24 soat keyin yopiladi.», «{день} {время} · {откуда} → {куда}», «{область} · {время}» |
| Шторки (g60/6, g60/7) | «Safar · {имя}», «Yetib keldingizmi?», «{место} · ≈ {время} edi», «Ha, yetib keldim», «Hali yoʻldaman», «Yaqinlaringiz ham bilib oladi», «Sevimli haydovchi», «{имя} yangi safar eʼlon qildi», «Siz bilan {n} marta borgan», «{n} ta boʻsh joy», «Band qilish», «Keyinroq» |

## Новые: ждут согласия

| # | Где | Текст |
|---|---|---|
| 1 | Карточка встречи (`126`) | Uchrashuv · soat {время} |
| 2 | Карточка встречи, кнопка | Men keldim |
| 3 | Карточка встречи, после кнопки | Haydovchiga aytildi |
| 4 | Бот водителя после «Men keldim» | {имя} uchrashuv joyiga keldi. {откуда} → {куда}, soat {время}. |
| 5 | Бронь: водитель отказал (`124` А) | Haydovchi joy bera olmadi. |
| 6 | Бронь: нет ответа вовремя | Haydovchi vaqtida javob bermadi. |
| 7 | Бронь: водитель отменил | Haydovchi safarni bekor qildi. |
| 8 | Бронь: отменил сам попутчик | Siz joyni bekor qildingiz. |
| 9 | Бронь после плохого конца, главная кнопка | Oʻxshash safarlar |
| 10 | Бронь и экран близких: время сдвинуто (`124` Б, И) | Vaqt oʻzgardi: {было} → {стало} |
| 11 | Бронь со сдвинутым временем, ссылка вместо отмены | Rozi emasman |
| 12 | Прошлая поездка, срок сегодня | bugun {время} gacha |
| 13 | «Oʻtgan», чат до завтра | Xabar · ertaga |
| 14 | Жалоба после 7 дней (ошибка) | Shikoyat muddati tugagan. Yordam orqali yozing. |
| 15 | Отзыв, слепая публикация (было 14) | Izohingiz ikkala tomon baholagach yoki 7 kundan keyin koʻrinadi. |

## Юридический текст (нужно отдельное согласие)

- Оферта `offer.9` ещё говорит «14 kun» про отзывы. Новый срок 7 дней (`129`). Меняю только после согласия владельца (`33`).

## Убрано

- Экран «Rahmat. Bahongiz saqlandi.» после отзыва: сразу назад (макет g60/5).
- Строки «Quloqchin taqsangiz…», «Telefon raqami va havolalarni yuborib boʻlmaydi…», «Har bir qadam haqida bot orqali xabar olasiz.», «Roʻyxatdan oʻting va oʻzingizga safar toping.»: их заменили строки макетов.
