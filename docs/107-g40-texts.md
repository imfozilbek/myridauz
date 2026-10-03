# 107. G40: короче тексты на согласие владельца

> **Кратко:** 4 текста длиннее 100 знаков стали короче, смысл тот же (`106`, блок T). Новых ключей нет, меняется только текст. Владелец согласовал 03.10.2026, тексты в коде. Проверяет носитель (`25`, OPS-03).

| № | Ключ | Где | Сейчас | Предложение |
|---|---|---|---|---|
| T1 | `drivers.status.pending.explore` | Главный экран водителя, заявка на проверке | Hozircha ilovani koʻrib chiqing. Tasdiqlangach safar eʼlon qilasiz va yoʻlovchilar soʻrovlarini koʻrasiz. (105) | Tasdiqlangach safar eʼlon qilasiz. (35) |
| T2 | `wallet.topUp.hint` | «Hisobni toʻldirish» | Hozircha hisobni toʻldirish ishlamaydi. Bonus tugasa, qoʻllab-quvvatlash xizmatiga yozing: bonusni qoʻlda qoʻshamiz. (116) | Hozircha toʻldirib boʻlmaydi. Bonus tugasa, qoʻllab-quvvatlashga yozing. (71) |
| T3 | `drivers.sent.text` | «Ariza yuborildi» | Jamoamiz 1 soat ichida tekshiradi va natijani botga yozadi. Arizalarni har kuni soat {from} dan {to} gacha tekshiramiz. (119) | Javob 1 soat ichida botga keladi. Har kuni soat {from} dan {to} gacha tekshiramiz. (80) |
| T4 | `way.book.fixed` | Проверка брони попутчика | Bron qilingandan keyin joylarni oʻzgartirib boʻlmaydi. Kerak boʻlsa, bronni bekor qilib, qaytadan bron qiling. (110) | Bron qilingach joylar oʻzgarmaydi. Kerak boʻlsa, bekor qilib, qayta bron qiling. (79) |

## Почему так

- T1: подписи кнопок на главном уже говорят «после подтверждения»; строка остаётся одна.
- T2: «вручную добавим бонус» убрано: это скажет поддержка; главное: сейчас пополнить нельзя, куда писать.
- T3: смысл тот же: срок 1 час, ответ в боте, часы работы.
- T4: тот же запрет и тот же выход, короче.
