# Призма текстов 17.11.2026: показатели и решения владельца

> **Кратко:** все 2 839 текстов прошли через призму аналитика (`native_check.py`, база около 50 млн слов живых каналов) и 10 наших проверок. Явных ошибок нет. Нашлись: окончание «-ga» после мест на «k», «q» (исправлено, урок №405) и споры терминов. Владелец выбрал слова 17.11.2026: «band qilish», «sharh», «{brand}da» слитно, «kutyapti».

## Показатели

| Показатель | Итог | Как считали |
|---|---|---|
| Живость | 86 % (без наших терминов 72 %) | Пары слов против базы живых каналов; наши термины и переменные не в счёт |
| Грубость | 0 % | «sen», обидные слова из `USLUB.md` аналитика |
| Понятность | 94 % без замечаний | Казённые и редкие слова (меньше 20 раз в базе) |
| Компактность | 99 % | Сообщение 1 или 2 предложения, предложение до 12 слов (`25`) |
| Звучание | 99,6 % | `uz_lint.py` и кальки аналитика |
| Единство терминов | 4 спора | Решены владельцем, ниже |
| Не такси | 0 | «taksi» только в «Bu taksi emas» |
| Влезает в экран | 3 под риском | Прикидка по длине, без замера на экране |
| Окончания после значения | 2 ошибки | «Muborakga» вместо «Muborakka»: исправлено (PR #370) |
| Кириллица | 0 ошибок | Сверка с конвертером аналитика: прав наш код |

## Решения владельца 17.11.2026

| Спор | Решение | Текстов |
|---|---|---|
| «bron» / «band qilish» | band qilish | 14 |
| «fikr» / «sharh» | sharh | 2 |
| «{brand} da» / «{brand}da» | слитно | 4 |
| «kutmoqda» / «kutyapti» | kutyapti | 21 |

Глоссарий `25` обновлён. Тест `packages/i18n/src/catalog-rules.test.ts` не пускает старые слова.

## Новые тексты на согласие владельца

| Ключ | Было | Стало |
|---|---|---|
| `account.profile.botHint` | Doim yoqilgan: bron, chat, safar xabarlari | Doim yoqilgan: band qilish, chat, safar xabarlari |
| `bot.diqqat.pair` | …gaplashdi, lekin bron qilmadi | …gaplashdi, lekin joy band qilmadi |
| `bot.summary.numbers` | {bookings} bron | {bookings} band qilingan joy |
| `bot.supportCard.booking` | 📌 Faol bron: | 📌 Band qilingan joy: |
| `bot.supportCard.openBooking` | 📋 Bronni ochish | 📋 Band qilingan joyni ochish |
| `bot.profile.support.description` | Safar, bron, hamyon… | Safar, joy band qilish, hamyon… |
| `legal.privacy.6.text` | bron bekor qilinganda | band qilingan joy bekor qilinganda |
| `legal.privacy.2.text` | baholar, fikrlar | baholar, sharhlar |
| `manage-limits.limitWhy.bookings.answerHours` | Haydovchi bronga… bron yopiladi | Haydovchi band qilingan joyga… band qilish yopiladi |
| `manage-limits.limitWhy.calls.requestRings` | Bron boʻlguncha | Joy band qilinguncha |
| `manage.person.lastRides` | Soʻnggi bronlari | Soʻnggi band qilgan joylari |
| `manage.limit.bookings.answerHours` | Bronga javob berish muddati | Band qilishga javob berish muddati |
| `manage.limitGroup.trips` | Safar, bron va soʻrov | Safar, band qilish va soʻrov |
| `team.diqqat.pair` | bron yoʻq | joy band qilinmadi |
| `wallet.detail.note` | Bron bekor boʻlsa | Band qilingan joy bekor boʻlsa |
| `landing.pains.stranger.after` | Reyting va fikrlarni | Reyting va sharhlarni |
| `growth.*` (4 текста) | {brand} da, {brand} ga | {brand}da, {brand}ga |
| 21 текст с «kutmoqda» | kutmoqda | kutyapti |

Два текста документа конфиденциальности (`legal`) меняют только слово, смысл тот же.

## Ждёт носителя

- «-moqda» в статусах: «tekshirilmoqda», «kutilmoqda» (11 текстов).
- «chegaraga yetdi» в 3 ошибках лимита.
- «@{supportBot} ga» раздельно после имени бота.

## Следующий шаг в ошибках и «sharh» вместо «izoh» (согласие владельца 21.11.2026)

Из 264 текстов ошибок, отказов и пустых экранов следующий шаг почти везде даёт экран (кнопка, шторка). Без него оставались 7 мест: чаще уведомление бота, где на экране блокировки видна одна строка.

| Ключ | Стало |
|---|---|
| `bot.dwallet.empty` | 💳 Hamyoningizda komissiya uchun pul qolmadi. Toʻldiring, shunda joylarni tasdiqlaysiz. |
| `bot.dwallet.fewSeats` | 💳 Hamyoningizdagi pul faqat {count} ta joyga yetadi. Oldindan toʻldiring. |
| `bot.ring.missed` | 📞 {name} qoʻngʻiroq qildi, lekin gaplasha olmadingiz. Chatda yozing yoki qayta qoʻngʻiroq qiling. |
| `bot.dapp.ringChanges` | ✏️ Haydovchi arizangizda tuzatish kerak. Ilovani oching va tuzating. |
| `errors.trips.not_driver` | … tasdiqlangan boʻlishi kerak. Ariza holati «Profil»da. |
| `errors.trips.price_out_of_bounds` | … chegarada boʻlsin. «Kamaytirish» yoki «Oshirish» bilan tanlang. |
| `errors.trips.not_found` | Bu safar endi yoʻq. Boshqa safarlarni koʻring. |

Отзыв: «izoh» → «sharh» в 7 текстах (`reviews.list`, `reviews.empty`, `reviews.addText`, `reviews.blind`, `find.allReviews`, `account.profile.reviewsCount`, `bot.rating.review`). «Izoh» остаётся комментарием к поездке и брони (урок №407).
