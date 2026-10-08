# 140. G63: новые тексты на согласие владельца

> **Кратко:** тексты сервера для «Yoʻlga chiqdim» и «Yetib keldik» водителя, напоминания бота и проверки способа посадки при публикации (G63 B1, `35`). Все тексты новые, ждут согласия владельца (`33`); проверка носителем (`25`) остаётся. Тексты экранов G63 (кнопки, карточки) будут в этом же документе на шаге G63 C.

## Новые: ждут согласия

| # | Где | Текст |
|---|---|---|
| 1 | Ошибка: «Yoʻlga chiqdim» раньше чем за час до выезда (`trips.too_early_to_depart`) | Hali erta. «Yoʻlga chiqdim» safar vaqtidan 1 soat oldin ishlaydi. |
| 2 | Ошибка: второе нажатие «Yoʻlga chiqdim» (`trips.already_departed`) | Yoʻlga chiqqaningiz allaqachon belgilangan. |
| 3 | Ошибка: «Yetib keldik» до выезда (`trips.not_departed`) | Avval «Yoʻlga chiqdim» tugmasini bosing. |
| 4 | Ошибка: второе нажатие «Yetib keldik» (`trips.already_arrived`) | Yetib kelganingiz allaqachon belgilangan. |
| 5 | Ошибка публикации: «Pitakdan olaman» или «Ikkalasi ham», а у направления нет пятака (`trips.no_pitak`) | Bu yoʻnalishda pitak yoʻq. «Shahar boʻylab yigʻaman» usulini tanlang. |
| 6 | Бот водителя: через 1 час после времени выезда нет «Yoʻlga chiqdim» (`bot.trip.departReminder`), кнопка «Ochish» открывает поездку | Yoʻlga chiqdingizmi? Safar boshlansa, «Yoʻlga chiqdim» tugmasini bosing. |

## Как это работает (коротко)

- «Yoʻlga chiqdim» работает за 1 час до выезда и позже, один раз.
- После нажатия поездка «в пути»: её не видно в поиске, её нельзя отменить, бронь в ней нельзя отменить, пост канала сразу пишет «Safar boshlandi».
- Нет нажатия через 1 час: бот спрашивает один раз (текст 6). Через 2 часа Cron сам ставит выезд.
- После нажатия заявки без ответа сразу истекают: попутчик и водитель получают те же сообщения бота, что и при истечении срока ответа (тексты есть, новых нет). Подтвердить заявку в пути нельзя.
- «Yetib keldik» работает только в пути. Сроки после поездки (оценка, жалоба) не меняются. Близкие водителя сразу видят «Yetib keldi»; поделиться такой поездкой уже нельзя.
- «Qaytish safari» и «Oxirgi yoʻnalish» берут способ посадки прошлой поездки, только если у нового направления есть пятак; иначе тихо «Shahar boʻylab yigʻaman», без лишнего шага.
- Галочка «Mashinada ayol bor» сохраняется, только если водитель мужчина и мест в поездке меньше, чем в машине. Иначе она тихо не сохраняется, без ошибки (`06`, правило 3).
