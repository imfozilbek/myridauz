# 192. G87: новые тексты «Голоса людей» на согласие владельца

> **Кратко:** все новые тексты G87 (`191`): шторка «Nega bekor qildingiz?» для людей и новые блоки «Statistika» и «Kanallar» для команды. Ключи в `packages/i18n/locales/uz-Latn/leave.json` (шторка), `stats.json` и `manage.json` (команда). Ждут согласия владельца и проверки носителем (`25`, `33`).

## Шторка после отмены (видят люди)

Появляется сразу после отмены. Одно нажатие на причину закрывает её. Свайп вниз или «Назад» закрывают без ответа.

| Когда | Заголовок |
|---|---|
| Попутчик отменил место | Nega joyni bekor qildingiz? |
| Водитель отменил поездку | Nega safarni bekor qildingiz? |
| Человек удалил данные | Nega maʼlumotlaringizni oʻchirdingiz? |

- Строка под заголовком (одна для всех): «Javob berish shart emas. Bu bizga yaxshiroq boʻlishga yordam beradi.»

| Место | Поездка | Данные |
|---|---|---|
| Rejam oʻzgardi | Rejam oʻzgardi | Endi kerak emas |
| Boshqa yoʻl topdim | Yoʻlovchi topilmadi | Kerakli safar topilmadi |
| Haydovchi bilan kelisha olmadik | Mashinada muammo | Ishlatish qiyin |
| Vaqt toʻgʻri kelmadi | Boshqa sabab | Maʼlumotlarim uchun xavotirdaman |
| Boshqa sabab | | Boshqa sabab |

## «Statistika» (видит команда)

| Блок | Строки |
|---|---|
| Botni bloklaganlar | имя бота (новое: «Yordam boti»), число; под ним «Qaytdi: {count}» |
| Baholar | «Oʻrtacha baho» и «{count} ta baho»; «1 yoki 2 yulduz» и «Baholarning {share}%»; без оценок: «Bu davrda baho yoʻq» |
| Nimasi yoqdi | теги оценок, как в отзыве («Vaqtida», «Xushmuomala» …) |
| Shikoyat sabablari | причины жалоб, как в жалобе |
| Nega bekor qilishdi | причина из шторки; под ней «Joy bekor qilindi», «Safar bekor qilindi» или «Maʼlumotlar oʻchirildi» |
| Ilova qanday ochildi | «Bot xabaridan», «Toʻgʻridan toʻgʻri», «Havola orqali» |

## «Kanallar» владельца

| Где | Текст |
|---|---|
| Строка канала, неделя | 7 kunda: {joined} kirdi, {gone} chiqdi |
| Строка канала, реакции | {reactions} reaksiya, eng koʻpi {top} |

- Тихая неделя ничего не пишет; части строки идут через « · », как раньше.

## Политика

- Новой строки нет: всё это числа без ID человека, «umumiy statistika» из `privacy.3.text` (`30`, пункт 12). Если нужна отдельная строка, это редакция 2.0.
