# 217. G90: находки P3, решения и тексты на согласие владельца

> **Кратко:** мелкие находки P3 цели G90 (P1 и P2: `216`), четыре решения владельцу и новые тексты на согласие (`33`). Исправления без новых текстов и без нового вида делаются сразу; остальные после «да» владельца.

## P3

| ID | Что не так | Типы | Место |
|---|---|---|---|
| PAS-8 | Попутчик с блоком в пути: «Yaqinlarimga» и её закрытие дают общую ошибку; ссылка близких остаётся открытой | T2 | `users/http/access-guard.ts`, `use-seat-steps.ts` |
| PAS-9 | «Bu safarda joyingiz bor.» без кнопки открыть это место | T3 | `find/safar-screen.tsx`, `market/asked-seat.ts` |
| PAS-10 | Место, которое ждёт водителя, названо «держит»: текст «Yangi joy shu safar tugagach» неверен | T6 | `market/asked-seat.ts` |
| PAS-11 | Страница близких предлагает «Xabar olish» у отменённой поездки | T2 | `follow/follow-screen.tsx` |
| PAS-12 | Кнопка «Qoʻngʻiroq» на главном экране не знает, что звонки выключены | T7 | `home/dock/passenger-seat-cards.tsx` |
| DRV-10 | «Ochish» под отказанным или истёкшим предложением открывает список без него | T5 | `market/my-trips-screen.tsx` |
| DRV-11 | Прошлая поездка без попутчиков: строки «Xabarlar» и «Shikoyat qilish» ничего не делают | T1, T7 | `trip-end/after-rows.tsx` |
| DRV-12 | Бот пишет «Yoʻldasiz» и «Yetib keldik» до «Yoʻlga chiqdim» | T6, T7 | `bookings/infrastructure/driver-card.ts` |
| DRV-13 | «Haydovchi boʻling» в профиле приложения водителя | T7 | `account/profile/profile-rows.tsx` |
| ADM-6 | Блок и снятие блока в «Odamlar» обновляют только половину карточки | T6 | `people/person-view.tsx` |
| ADM-7 | Срочная жалоба, уже решённая другим, открывается без пометки | T5 | `navbat/complaint-case.tsx` |
| ADM-8 | Дело, решённое другим: «Roʻyxatni yangilang», а списка нет, следующее дело не открывается | T1, T4 | `navbat/navbat-screen.tsx` |
| ADM-9 | Число дел владельца в приложении и в карточке бота разное | T6 | `navbat-routes.ts`, `team-queue/index.ts` |
| ADM-10 | Тихие сбои: вечный скелет, пустой список без ошибки (реклама, «Kutayotganlar», звуки, «Yana») | T1 | 8 экранов команды |
| ADM-11 | «Blokdan chiqarish» видно модератору, сервер ему отказывает | T2 | `people/block-journal.tsx` |

**Статус P3 (20.10.2026):** все 15 исправлены, тест сначала падал. ADM-9 и ADM-11 вместе с ADM-3 и ADM-1 (`216`). Вид, который поменялся старыми текстами и элементами (на согласие владельца):
- PAS-9: на «Safar» своей поездки кнопка «Joyimni ochish»;
- PAS-10: место, которое ждёт водителя, говорит текстом B19 «Sizda boshqa safarda joy bor. Yangi joy soʻrash uchun avval uni bekor qiling.»;
- DRV-11: прошлая поездка без попутчиков: в «Safardan keyin» только строка комиссии;
- ADM-7: решённая жалоба: строка «Holati: Hal qilindi» и «Davom etish»;
- ADM-8: дело, решённое другим: причина остаётся, кнопки решения уходят, «Davom etish» открывает следующее;
- ADM-10: сбой загрузки на экранах команды: «Qayta urinish»; сбой нажатия: причина под ним.

## Находки робота

| ID | Что не так | Исправление |
|---|---|---|
| WALK-1 | «Soʻrov qoldirish» без точки посадки или высадки молчал | Кнопка открывает недостающую точку (`market/request-points.tsx`) |
| WALK-2 | Вкладки «Faol», «Oʻtgan» без `aria-selected`: выбранная вкладка выглядела как мёртвое нажатие | Обёртка `SegmentedControl` в `packages/ui` ставит `aria-selected` |

**Согласие владельца 20.10.2026 («да»):** решения 1 … 4, тексты 1 … 9 и вид P3 выше (PAS-9, PAS-10, DRV-11, ADM-7, ADM-8, ADM-10).

## Решения владельцу (`33`)

| № | Находка | Совет |
|---|---|---|
| 1 | DRV-1 | Новое фото лица одобренного водителя не снимает права водителя. Фото идёт в проверку фото («Rasm mos» или «Mos emas»), как у попутчика; другие видят новое лицо после «Rasm mos». Правило `50` меняется |
| 2 | DRV-2 | «Rad etish» только для новой заявки. Повторная проверка машины одобренного водителя: «Tuzatish» или блок, без окончательного отказа |
| 3 | DRV-3 | Перед первым новым фото машины предупреждение; после фото уйти без «Yuborish» нельзя без вопроса |
| 4 | PAS-4 | В «Sevimli haydovchilar» нажатие на водителя открывает шторку с «Sevimlilardan olib tashlash» |

## Новые тексты (проверяет носитель, `25`)

| № | Где | Текст |
|---|---|---|
| 1 | Поездки больше нет (ссылка) | Bu safar endi yoʻq. |
| 2 | Команда: человек не найден | Odam topilmadi. |
| 3 | Нельзя оценить (не поехал) | Bu safarni baholab boʻlmaydi. |
| 4 | Заявка, когда уже есть открытая заявка | Sizda ochiq soʻrov bor. Yangisini qoldirish uchun avval uni bekor qiling. |
| 5 | Предупреждение перед новым фото машины | Yangi rasm mashinani qayta tekshiruvga yuboradi. Tekshiruv tugaguncha yangi safar eʼlon qila olmaysiz. |
| 6 | Уход без «Yuborish» после нового фото | Arizani yuboring, aks holda tekshiruv boshlanmaydi. |
| 7 | Шторка водителя в «Sevimli» | Sevimlilardan olib tashlash |
| 8 | Подсказка пустого «Sevimli» (вместо старой) | Safar tugagach, baho berishda haydovchini sevimlilarga qoʻshing. |
| 9 | Команда: заявки больше нет (человек удалил аккаунт) | Bu ariza endi yoʻq. |

Заявка, когда уже есть место: старый текст B19 `bookings.has_seat` (согласован в G89).
