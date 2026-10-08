# 138. G62: новые тексты на согласие владельца

> **Кратко:** тексты заявки водителя в 2 экрана, главного экрана водителя и сообщения бота при одобрении (G62, `118` путь 5). Тексты с макетов `goals/g62/` одобрены вместе с макетами 06.10.2026. Новые тексты ниже одобрены владельцем 08.10.2026 («Согласен»); проверка носителем (`25`) остаётся.

## С макетов (одобрены 06.10.2026)

| Экран | Тексты |
|---|---|
| Главный (g62/1, экраны 1, 4, 6) | «Haydovchi boʻlish», «2 qadam: mashina va uning rasmlari», «Arizangiz tekshirilmoqda», «Siz haydovchisiz!», «Hamyoningizda {сумма} bonus.», «Safar eʼlon qilish», «Yoʻlovchilar sizni oʻzi topadi» |
| «Mashinangiz» (экран 2) | «Mashinangiz», «1 / 2», «Model», «Boshqa ›», «Rang · {цвет}», «Davlat raqami», «Yoʻlovchi joylari» |
| «Mashina rasmlari» (экран 3) | «Mashina rasmlari», «2 / 2 · kunduzi, raqam aniq koʻrinsin», «{модель}, {цвет} · {n} joy», «Oʻzgartirish», «Old tomondan», «Raqam bilan», «Yon tomondan», «Mashina toʻliq», «Salon», «Oldingi oʻrindiqlar», «Arizani yuborish» |
| Исправление (экран 5) | «Bitta rasmni almashtiring», «Yaxshi», «Qayta yuborish» |

## Новые: одобрены 08.10.2026

| # | Где | Текст |
|---|---|---|
| 1 | «Mashinangiz»: подпись цвета, пока цвет не выбран | Rang |
| 2 | Окно «Boshqa ›»: заголовок | Boshqa mashina |
| 3 | Окно «Boshqa ›»: поле поиска | Marka yoki model |
| 4 | Окно «Boshqa ›»: строка своей машины | «{марка модель}» qoʻshish |
| 5 | Окно «Boshqa ›»: одно слово без модели | Marka va modelni yozing, masalan: Isuzu Grafter |
| 6 | Исправление: две плохие фотографии и больше | {n} ta rasmni almashtiring |
| 7 | Бот при одобрении: канал области машины (`119` водитель 4) | «{зона}» kanalida safarlaringiz chiqadi, yoʻlovchilar u yerdan topadi: t.me/{канал} |
| 8 | Бот при одобрении: кнопки | Kanalga oʻtish; Safar eʼlon qilish |

## Убраны (старые экраны заявки)

- Экраны по одному вопросу: «Mashina markasi», «Ommabop modellar», «Barcha markalar», «Mashina modeli», «Yoʻlovchilar uchun nechta joy bor?».
- Фото лица в заявке: «Rasmlar», «Yuzingizni old kamerada…»: лицо берётся при регистрации (G58). Лицо возвращается в исправление, только если команда попросила новое.
- Экран проверки «Arizani tekshiring», «Yuborish» и экран «Ariza yuborildi»: отправка с экрана фото, главный экран сам говорит «Arizangiz tekshirilmoqda».
- Карточка «Arizani toʻldiring» и «3 qadam: mashina, rasmlar, yuborish.»: заменена плиткой «Haydovchi boʻlish».
- «Ariza tasdiqlandi» и длинный текст бонуса: заменены «Siz haydovchisiz!» и «Hamyoningizda {сумма} bonus.».
- Подпись плитки «Hamyon» с бонусом: плитки «Hamyon» на главном больше нет (макет, экран 6), «Hamyon» в профиле.
