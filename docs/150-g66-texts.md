# 150. G66: тексты главных экранов на согласие владельца

> **Кратко:** почти все тексты главных экранов есть на макетах `goals/g66/1-passenger-home.png` и `2-driver-home.png` и одобрены вместе с ними (`118`). Новый текст без макета один: подпись кнопки ⇅ для чтения с экрана. Ещё шесть мест: старые тексты в новых состояниях, которых нет на макете. **Ждёт ответа владельца** (`33`, урок №183). Проверка носителем (`25`) остаётся.

## С макетов (одобрены вместе с макетами)

| Экран | Тексты |
|---|---|
| Попутчик (g66/1) | «Yoʻlovchi», «Soʻrov qoldirish», «Haydovchilar sizni topadi», «Soʻrovim», «{куда}, {день} · {n} ta taklif», «Mening safarlarim», «Joylar va suhbatlar», «Oxirgi yoʻnalish», «Qaytish», «{откуда} → {куда}», «Profil», «Rasm va sozlamalar», «Haydovchi boʻling», «Mashinangiz bormi? Xarajatni boʻling» |
| Карточка поездки (g66/1, телефон 3) | «{день} {время} · Joy tasdiqlandi», «{водитель} · {куда}», «{модель}, {цвет} · {номер}» |
| Блок внизу (g66/1, g66/2) | «Qayerdan», «Qayerga», «Joylashuvingiz boʻyicha aniqlandi», «Qayerga borasiz?», «Qayerga ketyapsiz?», «Bugun {n}, ertaga {n} ta safar», «Safar topish», «Safar eʼlon qilish», «Tekshiruvdan keyin ochiladi» |
| Водитель (g66/2) | «Haydovchi · {модель}, {цвет} · {номер}», «Arizangiz tekshirilmoqda», «Odatda 30 daqiqagacha. Javob botga keladi.», «Yoʻlovchilar soʻrovlari», «Yoʻnalishingizda {n} ta», «Tekshiruvdan keyin», «Bu hafta {n} ta safar», «Hamyon», «Bonus {сумма}», «≈ {n} joyga yetadi», «≈ {n} joyga · toʻldiring», «Mashina va sozlamalar» |
| Карточки водителя (g66/2, телефоны 3, 4) | «{день} {время} · {занято} / {мест} joy band», «Toshkent → Samarqand», «{пятак}dan · {цена}», «{n} yangi soʻrov», «Bugun {время}», «{n} daqiqadan keyin · {маршрут} · {старт}», «{n} yoʻlovchi · hammasi tasdiqlangan», «Yoʻlga chiqdim» |
| Водитель до заявки (g62/1, `139` №8, 10) | «Haydovchi», «Eʼlonlar» (было «Eʼlonlar va yoʻlovchilar»), «Savol boʻlsa» (было «Savolingiz boʻlsa yozing») |

## Новый текст (макета нет)

| # | Где | Текст |
|---|---|---|
| 1 | Подпись кнопки ⇅ для чтения с экрана (на экране не видна) | Joylarni almashtirish |

## Старые тексты в новых состояниях (макета нет)

| # | Состояние | Что видно |
|---|---|---|
| 2 | Место ещё не подтверждено | «{день} {время} · Javob kutilmoqda», только «Xabar yozish», без «Qoʻngʻiroq» (`07`) |
| 3 | Непрочитанные сообщения водителя | число на кнопке «Xabar yozish», для чтения с экрана «{n} xabar» (плашка G53) |
| 4 | Заявка без предложений | «Soʻrovim», «{куда}, {день}» без «· {n} ta taklif» |
| 5 | В день поездки есть неподтверждённые заявки | «{n} yoʻlovchi · {n} yangi soʻrov» вместо «hammasi tasdiqlangan» |
| 6 | За 30 минут до отъезда | карточка встречи вместо карточки поездки (`126`), её тексты из G60 |
| 7 | Шаги поездки попутчика | «Mashinaga chiqdim», потом «Yetib keldim» (тексты G09) |

## Убраны (экран нарисован заново)

| Ключ | Текст | Почему |
|---|---|---|
| `home.driverCar` | «{имя}, {модель}» | строки броней на главном больше нет: одна карточка поездки |
| `market.trip.when`, `whenToday`, `whenTomorrow` | «… , soat {время}» | так писали строки старого главного экрана; карточка пишет «{день} {время}» |
