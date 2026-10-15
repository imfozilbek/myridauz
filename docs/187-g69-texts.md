# 187. G69: новые тексты петель роста на согласие владельца

> **Кратко:** все новые тексты G69 (`123`): экран праздника «Men Rida bilan», 3 фразы своим голосом, карточка для чата и истории, петли 2, 3, 4, «Sizning taʼsiringiz», QR водителя, «Rost» и 2 строки политики. Ключи в `packages/i18n/locales/uz-Latn/growth.json` (кроме отмеченных). `{brand}`: имя среды («MyRida» внутри команды, «Rida» в проде, `179`). Решения владельца 15.10.2026: без «tekshirilgan»; эмодзи только в заголовках экрана, в истории нет. Согласие владельца 15.10.2026 (тексты, вид экранов, политика 1.7); ждёт проверки носителем (`25`). Решение владельца 15.10.2026: праздника после поездки нет, тексты поездок и попутчиков водителя убраны.

## Экран праздника

| Момент | Заголовок | Строка под ним |
|---|---|---|
| Регистрация | Siz {brand} jamoasidasiz! 🎉 | Doʻstlaringizga ayting: ular ham viloyatga birga borsin. |
| Водитель одобрен | Siz endi {brand} haydovchisisiz! ✅ | Doimiy yoʻlovchilaringizga ayting: endi sizni {brand} da topadi. |

| Блок «выгода» | Жирно | Дальше |
|---|---|---|
| Регистрация | Doʻstlaringiz ham shunday borsin. | Havolangiz orqali ular ham {brand} ga qoʻshiladi va viloyatga birga boradi. |
| Водитель | Joy toʻlsa, yoʻl xarajati koʻproq boʻlinadi. | Doimiy yoʻlovchilaringiz va guruhingiz safarlaringizni bir bosishda topadi. |

- Подписи: «Qaysi soʻz sizniki?», «Doʻstlaringiz shuni koʻradi».
- Кнопки: «Hikoyamga joylash»; кнопка с адресатом: «Doʻstlarimga yuborish» (регистрация), «Yoʻlovchilarimga yuborish» (водитель); «Keyinroq».

## Три фразы своим голосом

| Момент | 1 | 2 | 3 |
|---|---|---|---|
| Регистрация | Men endi {brand} jamoasidaman! | Viloyatga endi birga boraman | Men ham {brand} bilan yoʻlga chiqaman |
| Водитель одобрен | Men {brand} haydovchisiman | Endi meni {brand} da toping | Viloyatga men bilan yuring |

## Карточка, чат и история

| Где | Текст |
|---|---|
| Факт на карточке | Birga borish, xarajatni boʻlish · {brand} haydovchisi |
| Кто | {name} |
| Слова ссылки | Men ham qoʻshilaman · {name} bilan yoʻlga chiqish |
| Фраза в кавычках | «{phrase}» |
| Сообщение в чат | «{phrase}» · {name} · факт · Siz ham {name} bilan yoʻlga chiqing: |
| Заголовок в окне Telegram | Men {brand} bilan |
| Подпись истории | «{phrase}» {link} |

## Петли 2, 3, 4

| Где | Текст |
|---|---|
| Заявка без предложений | Tumaningiz guruhiga yuboring · Haydovchilar soʻrovingizni guruhda koʻrsa, taklif yuborishadi. · кнопка: Guruhimga yuborish · Raqamingiz koʻrinmaydi. |
| Сообщение в группу | {from} → {to}, {date} · {seats} kishi yoʻlga chiqmoqchi. Haydovchilar, taklif yuboring: · кнопка: Taklif yuborish · заголовок: Yoʻlga chiqmoqchiman |
| Свободные места в брони | Bu safarda yana {seats} ta joy bor · Doʻstingiz ham shu safarga joy band qilsa, birga borasiz. · кнопка: Doʻstingni chaqir |
| Сообщение другу | {from} → {to}, {date} soat {time} · Men shu safarda boraman, yana {seats} ta joy bor. Birga boramizmi? · кнопка: Joy band qilish (есть) · заголовок: Birga boramizmi? |
| Карточка «Yaqinlarimga» (`bot.json`) | последняя строка: Siz ham {brand} bilan yoʻlga chiqing. · вторая кнопка: Men ham yoʻlga chiqaman (есть) |

## «Sizning taʼsiringiz» и QR

| Где | Текст |
|---|---|
| Заголовок | Sizning taʼsiringiz · Siz tufayli {brand} ga qoʻshilganlar |
| Число | {count} kishi · havolangiz orqali qoʻshildi · {rode} tasi safarga chiqdi |
| Знаки | Yoʻl hamrohi (1) · {brand} elchisi (5) · Yoʻnalish qahramoni (25) |
| Строки знаков | {count} kishini olib keldingiz · {count} kishi · yana {left} ta · {count} kishi |
| Кнопка | Yana ulashish |
| QR водителя | Oynaga QR · Yoʻlovchi telefon kamerasi bilan skanerlaydi va {brand} ga qoʻshiladi. · Rasmni chop eting va mashina oynasiga yopishtiring. · на картинке: Skanerlang: {brand} bilan yoʻlga chiqing · кнопка: Rasmni yuklab olish |

## Админка

| Где | Текст |
|---|---|
| «Rost» | Rost · Halqalar va yoʻnalishlar: kim keldi va safarga chiqdi · 7 kun · 30 kun · Halqalar · Yoʻnalishlar |
| Петли | Oynadagi QR · Soʻrov tuman guruhida · Doʻstingni chaqir · Yaqinlarimga · Roʻyxatdan keyin · Haydovchi tasdiqlandi |
| Строки | {came} keldi · {registered} roʻyxatdan oʻtdi · {rode} safarga chiqdi · {found} / {searches} qidiruvda safar topildi · Bu davrda qidiruv yoʻq |
| Без аналитики | Kelganlar soni analitika ulanganda chiqadi. · Analitika javob bermadi: kelganlar soni keyinroq chiqadi. |
| «Statistika» (`stats.json`) | Odamlar havolasi (приход по петле) |

## Политика (`legal.json`, редакция 1.7)

- `privacy.2.text`, новая строка: «Siz ulashgan havolalar orqali nechta odam kelgani va ulardan nechtasi safarga chiqqani. Havolada Telegram ID emas, qisqa kodingiz boʻladi. Kim kelganini koʻrmaysiz, faqat sonini.»
- `privacy.6.text`, новая строка удаления: «havolalaringizning qisqa kodi oʻchiriladi;»

