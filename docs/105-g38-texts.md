# 105. G38: новые тексты на согласие владельца

> **Кратко:** семь текстов цели G38 (`goals/G38-trip-time.md`, решения `103`) на узбекском, по `25`. Статус: в коде (ключи ниже), ждёт согласия владельца, потом проверка носителем (`25`).

## Тексты

| № | Ключ | Где | Было | Станет |
|---|---|---|---|---|
| W1 | `market.when.title` | Заголовок экрана «день и время» (пункт 1) | «Qaysi kuni?» и «Soat nechada joʻnaysiz?» на двух экранах | Qachon joʻnaysiz? |
| W2 | `market.when.day` | Подпись поля календаря «Boshqa kun» | нет | Kun |
| W3 | `market.when.time` | Подпись выбора часа | нет | Soat |
| W4 | `market.when.none` | В выбранный день свободного часа нет (пункт 6) | нет | Bu kunda boʻsh vaqt yoʻq. Boshqa kunni tanlang. |
| W5 | `market.when.dayHint` | Предложение на заявку: день заявки над часами | «Toshkent vaqti bilan» | {day} · Toshkent vaqti bilan |
| W6 | `errors.trips.too_soon` | Отъезд раньше чем через час (пункт 4) | нет | Bu vaqt juda yaqin. Keyinroq vaqtni tanlang. |
| W7 | `errors.trips.busy` | Время пересекается с другой поездкой (пункт 3) | нет | Bu vaqtda boshqa safaringiz bor. Boshqa vaqtni tanlang. |

В статистике админки шаги «Sana» и «Vaqt» воронки новой поездки стали одним шагом «Kun va soat» (`stats.step.when`).

## Что ушло

- Отдельные экраны «Qaysi kuni?» и «Soat nechada joʻnaysiz?» в мастере поездки и «Soat nechada joʻnaysiz?» в предложении водителя: теперь один экран.
- Ввод времени с клавиатуры часов: теперь список только разрешённых часов, шаг 30 минут.
