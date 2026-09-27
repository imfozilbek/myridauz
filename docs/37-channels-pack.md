# 37. Пакет для 14 каналов

> **Кратко:** Всё, чтобы создать 14 каналов и представить их людям: название, ссылка, аватар, описание, закреплённый пост, пост «скоро», картинки и настройки. Тексты на узбекском, владелец вычитывает.

Логика каналов: `15-channels.md`. Логотип: `36-logo.md`.
Страница с готовыми текстами и кнопками «Копировать»: https://claude.ai/artifact/B5UrJkyqPbJzQghfPsWEaT

## Что входит

| Что | Сколько |
|---|---|
| Название и ссылка канала | 14 |
| Аватар: «R» и код региона (`36`) | 14, у каждого канала свой |
| Описание канала (до 255 знаков) | 14 |
| Пост «Tez orada» (до запуска, по желанию) | 14 |
| Закреплённый пост «Tanishuv» (в день запуска) | 14 |
| Картинка к посту 1280 × 720 | 14 |

Все 28 файлов (14 аватаров и 14 картинок) отправлены владельцу архивом `rida-kanallar.zip`.
| Настройки канала | 1 чек-лист |

## Названия и ссылки

| # | Регион | Название | Ссылка | Код на аватаре |
|---|---|---|---|---|
| 1 | Toshkent shahri | Rida \| Toshkent | t.me/rida_toshkent | 01 |
| 2 | Toshkent viloyati | Rida \| Toshkent viloyati | t.me/rida_toshkentvil | 10 |
| 3 | Andijon viloyati | Rida \| Andijon | t.me/rida_andijon | 60 |
| 4 | Buxoro viloyati | Rida \| Buxoro | t.me/rida_buxoro | 80 |
| 5 | Fargʻona viloyati | Rida \| Fargʻona | t.me/rida_fargona | 40 |
| 6 | Jizzax viloyati | Rida \| Jizzax | t.me/rida_jizzax | 25 |
| 7 | Xorazm viloyati | Rida \| Xorazm | t.me/rida_xorazm | 90 |
| 8 | Namangan viloyati | Rida \| Namangan | t.me/rida_namangan | 50 |
| 9 | Navoiy viloyati | Rida \| Navoiy | t.me/rida_navoiy | 85 |
| 10 | Qashqadaryo viloyati | Rida \| Qashqadaryo | t.me/rida_qashqadaryo | 70 |
| 11 | Samarqand viloyati | Rida \| Samarqand | t.me/rida_samarqand | 30 |
| 12 | Sirdaryo viloyati | Rida \| Sirdaryo | t.me/rida_sirdaryo | 20 |
| 13 | Surxondaryo viloyati | Rida \| Surxondaryo | t.me/rida_surxondaryo | 75 |
| 14 | Qoraqalpogʻiston Respublikasi | Rida \| Qoraqalpogʻiston | t.me/rida_qoraqalpogiston | 95 |

- Код на аватаре: первый код региона на автомобильных номерах (`36`).

- Ссылка занята: добавить `_uz` в конце (например, `rida_buxoro_uz`).
- Ссылки только латиницей без апострофов: так их проще найти в поиске.

## Шаблоны текстов (узбекский, черновик)

`{from}`: «Samarqand viloyatidan va viloyatiga» (у Ташкента: «Toshkent
shahridan va shahriga», у Каракалпакстана: «Qoraqalpogʻiston
Respublikasidan va Respublikasiga»). `{passenger_bot}`, `{driver_bot}`: имена ботов (OPS-01).

**Описание канала:**

```text
{from} safarlar. Haydovchilar oʻz safariga yoʻlovchi oladi, yoʻl xarajati birga koʻtariladi. Bu taksi emas. Joy band qilish: @{passenger_bot}
```

**Пост «Tez orada» (до запуска):**

```text
Rida | {title}

Tez orada bu kanalda {from} safarlar chiqadi.

Haydovchi oʻz safariga yoʻlovchi oladi, yoʻl xarajati birga koʻtariladi.

Kanalga obuna boʻlib turing.

Manzil sari.
```

**Закреплённый пост «Tanishuv» (в день запуска, с картинкой):**

```text
Rida | {title}

Bu kanalda {from} yangi safarlar chiqadi.

Qanday ishlaydi:
1. Oʻzingizga mos safarni tanlang.
2. «Band qilish» tugmasini bosing.
3. Haydovchi bilan Rida chatida kelishib oling.

Xavfsizlik:
✅ Har bir haydovchi tekshiriladi: yuzi va mashinasi.
👩 Ayollar «Mashinada ayol bor» belgili safarlarni tanlashi mumkin.
🔒 Telefon raqamingiz boshqa foydalanuvchilarga koʻrinmaydi.

Safar topish: t.me/{passenger_bot}?startapp

Haydovchimisiz? Safaringizni joylang: t.me/{driver_bot}?startapp
Yangi haydovchilarga komissiya uchun 1 500 000 soʻmgacha bonus.

Manzil sari.
```

## Настройки канала (чек-лист)

1. Тип: публичный, ссылка из таблицы.
2. Аватар: свой файл для каждого канала (код региона, `36`).
3. Описание: из шаблона.
4. **Комментарии выключены** (без группы обсуждения): иначе люди
   обменяются номерами в обход Rida (`18`).
5. Подпись авторов: выключена.
6. Администраторы: владелец и бот попутчиков (право публиковать
   и редактировать сообщения).
7. Пост «Tanishuv» закрепить.

## Когда что делать (совет)

| Когда | Что |
|---|---|
| Сейчас | Создать 14 каналов, аватар, описание. Пост «Tez orada». Копить подписчиков |
| После OPS-01 | Подставить имена ботов в описание |
| День запуска | Пост «Tanishuv» с картинкой, закрепить. Бот начинает публиковать поездки (G10) |

## Проверка владельцем (`33`)

- Все тексты: вычитка владельцем как носителем языка (`25`).
- Упоминать бонус 1 500 000 soʻm в публичном посте: решение владельца.
- Аватар и картинки: финальные, шрифт Rubik (решено, `36`).
