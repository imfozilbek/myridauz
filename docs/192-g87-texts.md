# 192. G87: новые тексты на согласие владельца

> **Кратко:** все новые тексты G87 «Голос людей» (`191`, `goals/G87-voice-of-people.md`): шторка «Nima uchun?» после отмены и удаления, разделы «Statistika» и «Kanallar» владельца, 3 строки политики (редакция 1.10). Ждёт согласия владельца (`33`) и проверки носителем (`25`).

## Шторка «Nima uchun?» (V3)

Показывается после отмены места, отмены поездки водителем и удаления аккаунта. Одно нажатие или пропуск. Ключи: `packages/i18n/locales/uz-Latn/cancel-reason.json`.

| Что | Текст |
|---|---|
| Заголовок | Nima uchun? |
| Подсказка | Bir marta bosing. Javob bermasangiz ham boʻladi. |
| Кнопка | Oʻtkazib yuborish |

| Попутчик отменил место | Водитель отменил поездку | Человек удалил аккаунт |
|---|---|---|
| Rejam oʻzgardi | Rejam oʻzgardi | Endi kerak emas |
| Boshqa mashina topdim | Yoʻlovchi topilmadi | Boshqa ilovadan foydalanaman |
| Haydovchi uzoq javob bermadi | Mashinada muammo | Maʼlumotlarim uchun xavotirdaman |
| Narx toʻgʻri kelmadi | Boshqa sabab | Ilova tushunarsiz |
| Boshqa sabab | | Boshqa sabab |

## «Statistika» (V1 … V4)

Ключи: `stats.json`.

| Раздел | Строки |
|---|---|
| «Botlar xabarlari» (V1) | Botni bloklaganlar · qaytdi: {returned} · Yordam boti |
| «Baholar va shikoyatlar» (V2) | Oʻrtacha baho · {count} ta baho · Hali yoʻq · 1 va 2 yulduz · Koʻp tanlangan belgi · Shikoyat sababi |
| «Bekor qilish sabablari» (V3) | Joy bekor qilindi · Safar bekor qilindi · Hisob oʻchirildi |
| «Ilovaga kirishlar» (V4) | Bot xabaridan · Toʻgʻridan toʻgʻri · Havola orqali |

## «Kanallar» владельца (V5, V6)

Ключи: `manage.json`.

| Раздел | Строка под каналом |
|---|---|
| 7 kunda kelgan va ketganlar | {joined} keldi · {left} ketdi |
| 7 kunda koʻp reaksiya olgan postlar | {count} ta reaksiya |

## Политика, редакция 1.10

В `privacy.2.text` (`legal.json`), дата 18.10.2026:

| Было | Стало |
|---|---|
| Ilovadan foydalanish statistikasi: qaysi ekran ochildi, qaysi qadam bosildi. Unda ism, raqam va xabarlar boʻlmaydi. | Ilovadan foydalanish statistikasi: qaysi ekran ochildi, qaysi qadam bosildi, ilovaga nima orqali kirildi (bot xabari, menyu yoki havola). Unda ism, raqam va xabarlar boʻlmaydi. |
| (нет) | Joy yoki safarni bekor qilganda, hisobni oʻchirganda tanlagan sababingiz, agar tanlasangiz. U ismsiz, faqat umumiy son sifatida hisoblanadi. |
| (нет) | Botni bloklash va qayta ochish, kanalga kirish va chiqish, kanal postlaridagi reaksiyalar: faqat umumiy son. Kim ekani saqlanmaydi. |

## Решение владельца

| Дата | Что |
|---|---|
| | ждёт ответа |
