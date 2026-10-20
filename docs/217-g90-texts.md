# 217. G90: новые тексты промежутка на согласие владельца

> **Кратко:** тексты цели G90 (промежуток отъезда «Oraliqda», `216`). Четыре текста шторки и формы согласованы на макете 20.10.2026. Остальные ждут согласия владельца. Все ждут проверки носителем (`25`, OPS-07).

## Согласованы на макете (20.10.2026)

| Где | Текст | Ключ |
|---|---|---|
| Переключатель шторки | Oraliqda | `market.when.range` |
| Подсказка шага 1 | Qaysi soatdan? Toshkent vaqti bilan | `market.when.rangeFrom` |
| Подсказка шага 2 | {from} dan qaysi soatgacha? Eng koʻpi {hours} soat | `market.when.rangeTo` |
| Строка формы водителя | {date}, {from} dan {to} gacha | `market.publish.dayRange` |

## Новые, ждут согласия

| Где | Текст | Ключ |
|---|---|---|
| Mini App: время промежутка везде | {from} … {to} | `market.trip.range` |
| Боты: время промежутка везде | {from} dan {to} gacha | `bot.time.range` |
| Попутчику за 2 часа, пятак | 🚏 Safarga 2 soat qoldi: {time} pitakda boʻling | `bot.ring.soonPitakRange` |
| Попутчику за 2 часа, у дома | 🏠 Safarga 2 soat qoldi: haydovchi {time} sizni olib ketadi | `bot.ring.soonDoorRange` |
| Водителю за 2 часа | 🚏 Safarga 2 soat qoldi: {count} yoʻlovchi. Birinchisi {time} dan kutadi: {place} | `bot.dring.soonRange` |
| Близким: время сдвинули | Vaqt oʻzgardi: {name} {date}, {time} yoʻlga chiqadi. | `bot.share.retimedRange` |
| Ошибка: промежуток не по правилам | Vaqt oraligʻini qaytadan tanlang. | `errors.trips.bad_range` |

- `{time}` в текстах ботов: «08:00 dan 10:00 gacha».
- `{from} … {to}`: как одобренный `waitlistTeam.hour` в статистике команды.
- Новые ключи нужны там, где старый текст ставит «da» после часа: «08:00 da» нельзя сказать о промежутке.

## Старые тексты с новым значением времени

Текст не меняется, меняется только `{time}`. Примеры для промежутка 08:00 … 10:00.

| Где | Пример |
|---|---|
| Карточка брони в боте | Ertaga, 21-oktabr · 08:00 dan 10:00 gacha |
| Время сдвинули, строка ниже | Avval 08:00 dan 10:00 gacha edi |
| В пути | Bugun 08:00 dan 10:00 gacha · ≈ 15:00 yetib borasiz |
| Звонок «время сдвинули» | ⏰ Safar vaqti oʻzgardi: endi 09:00 dan 11:00 gacha |
| Предложение на заявку | 📨 Soʻrovingizga taklif keldi: Jasur, 08:00 dan 10:00 gacha, 90 000 soʻm |
| Новости маршрута | Jasur · Ertaga 08:00 dan 10:00 gacha · 3 joy · 90 000 soʻm |
| Пост канала, доска дня | Ertaga, 21-oktabr · 08:00 … 10:00 |
| «Поделиться» поездкой | 🗓 21-oktabr soat 08:00 dan 10:00 gacha |
| Карточка близким | … yoʻlga chiqadi: Toshkent → Samarqand, 21-oktabr 08:00 dan 10:00 gacha. |
| «Vaqtni surish» | soat 09:00 … 11:00 |

- Пост канала промежутка без прибытия «→ ≈ 13:30»: прибытие неизвестно до отъезда.

## Что не меняется

- Точный час: все тексты как раньше.
- Предложение водителя на заявку попутчика: только точный час (`216`).
