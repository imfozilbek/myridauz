# 136. G61: новые тексты на согласие владельца

> **Кратко:** тексты заявки на одном экране, «Mening soʻrovim», правила «Butun salon» у водителя и сообщения бота «Yangi taklif» (G61, `118` путь 4). Тексты с макетов `goals/g61/` одобрены вместе с макетами 06.10.2026. Новые тексты ниже одобрены владельцем 07.10.2026 («Все супер»); проверка носителем (`25`) остаётся.

## С макетов (одобрены 06.10.2026)

| Экран | Тексты |
|---|---|
| Заявка (g61/1) | «Qayerdan, qayerga?», «Necha kishi», «Bir joy narxi», «Tavsiya: {цена}», «Men bilan ayol bor», «Safarda «Mashinada ayol bor» belgisi chiqadi», «{n} joy × {цена}», «Haydovchilar oʻz vaqti va narxini taklif qiladi.», «Soʻrov qoldirish» |
| Правило водителя (g61/2) | «Qanday band qilinadi?», «Faqat joylar», «Har kim oʻz joyini band qiladi», «Joylar yoki butun salon», «Bir kishi hamma {n} joyni ham olishi mumkin», «Faqat butun salon», «Faqat bitta guruh: {n} joy birga», «Butun salon narxi: {n} joy × {цена} = {сумма}.» |
| «Mening soʻrovim» (g61/3) | «{откуда} → {куда} · {день}», «{n} kishi · bir joy {цена} · Boʻsh salon kerak», «Takliflar ({n})», «Rad etish», «Qabul qilish», «Soʻrovni bekor qilish» |

## Новые: одобрены 07.10.2026

| # | Где | Текст |
|---|---|---|
| 1 | Заявка: строка под «Men bilan ayol bor» (на макете её нет) | Boʻsh salon kerak |
| 2 | Подпись строки 1 | Haydovchi boshqa yoʻlovchi olmaydi |
| 3 | «Mening soʻrovim»: блок канала (`119` место 3) | Kutayotganda |
| 4 | Проверка поездки у водителя: строка правила | Band qilish |
| 5 | Статистика: шаг воронки «Yangi safar» | Band qilish usuli |
| 6 | Бот попутчика: новое предложение (макет 4, экран 4) | Yangi taklif: {имя}, {машина}. {откуда} → {куда} {дата}, soat {время} Bir joy: {цена}. Koʻrish uchun ilovani oching. |

## Убраны (старые экраны заявки)

- «Soʻrovni tekshiring», «Haydovchilar narxingizni koʻradi…», «Soʻrov qoldirildi», «Haydovchilar uni koʻradi…»: проверка и экран «готово» заменены одним экраном и сразу «Mening soʻrovim».
- Шаг способа («Uyimdan», «Farqi yoʻq» и его заголовок): пятак выбирается плиткой на карте точки посадки.
- «Joyingiz tasdiqlandi», «Davlat raqami…», «Haydovchilardan takliflar», «Taklifni oching va qabul qiling»: принятие предложения открывает страницу брони G60.
