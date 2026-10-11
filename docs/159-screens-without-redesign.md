# 159. Экраны без редизайна

> **Кратко:** сверка 10.10.2026 всех экранов трёх Mini App с редизайном G58 … G68, G72 (`118`, макеты `goals/g58` … `g68`). Около 120 экранов: прошли редизайн 45, частично 8, без редизайна 67. Вся админка (30) без редизайна: G67 была перенесена. Экраны без редизайна собраны в цель G75. Дыры `124` по коду: `158`.
>
> **Поправка 10.10.2026 (урок №224):** колонка «После G75» и пометки «все в G75» ниже были планом, а не проверкой кода. Повторная проверка по коду (`168`) нашла около 30 экранов без макета или без сверки, в том числе почти всю админку. Источник правды по оставшемуся: `168`, цель G78.

## Как сверял

| Что | Как |
|---|---|
| Список экранов | от входа каждой Mini App (`apps/miniapp-*/src/pages/start`) по переходам в `packages/ui/src` |
| Редизайн | экран построен по выбранному макету цели G58 … G68 (png в `goals/gNN`, сверка Pixel Perfect) |
| Не считается | только общий фон, полоска загрузки и сплэш G72, правила размера `121` |
| Проверка | главные находки проверены по коду (урок №81) |

## Итог

| Роль | Всего | До G75 | План G75 (не проверено, см. `168`) |
|---|---|---|---|
| Общие | 6 | 1 | 6 |
| Попутчик | 45 | 24 | 45 (кроме убранного «Safarlar tarixi») |
| Водитель (свои экраны) | 39 | 20 | 39 |
| Админка | 30 | 0 | 30 |

Водитель видит общие с попутчиком экраны в янтарном цвете: документ, блок, фото, жалоба, профиль; их оценка та же.

## Общие (план G75)

| Экран | Компонент | Итог |
|---|---|---|
| «Telegramda oching» | `states/telegram-only.tsx` | **G75 лист 1А** |
| «Ilovani qayta oching» (сессия старше 24 ч) | `network/connection-gate.tsx` | **G75 лист 1А** |
| Плашка «нет сети» | `network/offline-banner.tsx` | **G75**: белая плашка с красной плиткой, вид листа 1А |
| Ошибка «Qayta urinish» | `states/error-screen.tsx` | **G75 лист 1А** |
| Скелет загрузки | `states/screen-skeleton.tsx` | **G75**: серые карточки списков листа 2А |

## Попутчик (план G75)

| Экран | Компонент | Итог |
|---|---|---|
| Документ (оферта, политика) | `legal/legal-screen.tsx` | **G75 лист 5А** |
| Блок «Hisobingiz toʻxtatilgan» | `account/blocked-screen.tsx` | **G75 лист 1А** |
| «Rasm qoʻshing» (фото не ушло) | `account/avatar-required-screen.tsx` | **G75 лист 1А**: шаг с кругом фото |
| Список мест: районы, поиск | `places/place-picker.tsx` | **G75 лист 6А** |
| «Tuman tanlash» | `places/district-list.tsx` | **G75 лист 6А**: «Butun viloyat» отдельно, у каждого места «N ta safar» за неделю |
| «Safar» закрыта или уехала | `market/closed-trip.tsx` | **G75**: общая плашка исхода |
| «Barcha izohlar» | `find/reviews-screen.tsx` | **G75**: карточки листа 2А |
| «Izoh» к брони | `market/trip-steps.tsx` | **G75 лист 3А**: шторка |
| Жалоба и «yuborildi» | `feedback/complaint-screen.tsx` | **G75 лист 5А**: галочки в одной карточке (`sheet/tick-rows.tsx`) |
| Маршрут заявки (форма) | `places/route-screen.tsx` | **G75**: строки листа 6А |
| День заявки | `market/date-step.tsx` | **G75**: плитки дня листа 3А |
| **Одно предложение** | `bookings/passenger-offer-sheet.tsx` | **G75 лист 4Б**: шторка поверх «Mening soʻrovim»; `offer-list.tsx` удалён |
| «Mening safarlarim»: «Faol», пусто | `mine/mine-card.tsx` | **G75 лист 2А** |
| «Obunalar» | `subscriptions/subscriptions-screen.tsx` | **G75 лист 2А** |
| «Xabar bering» с канала | `subscriptions/notify-me.tsx` | **G75 лист 3А**: шторка |
| «Sevimli haydovchilar» | `comfort/favorites-screen.tsx` | **G75 лист 2А** |
| «Meni qanday koʻradi» | `account/profile/look-screen.tsx` | **G75 лист 5А**: карточка с тремя числами, «Baholarim» |
| «Baholarim» | `find/reviews-screen.tsx` | **G75**: карточки листа 2А |
| «Safarlar tarixi» | `comfort/history-screen.tsx` | ~~нет~~ **убран в G75** (решение владельца 10.10.2026): прошлые поездки во вкладке «Oʻtgan» |
| «Hujjatlar» и документ | `legal/legal-screen.tsx` | **G75 лист 5А**: документ одной открытой карточкой |
| Удаление и «Oʻchirildi» | `account/profile/delete-account.tsx` | **G75 лист 5А**: три строки, кошелёк водителя |

## Водитель (план G75)

| Экран | Компонент | Итог |
|---|---|---|
| «Bosh ekranga qoʻshish» | `home/home-screen-offer.tsx` | ~~нет~~ **в G75 строка «Sozlamalar»** у обеих ролей, пока Telegram может добавить значок (решение владельца 10.10.2026) |
| Камера с рамкой | `media/camera-screen.tsx` | **G75 лист 6А**: контур машины в рамке, «Telefon kamerasini ochish» всегда |
| Заявка отклонена | `driver/status-screen.tsx` | **G75 лист 1А** |
| Списки мест | `places/place-picker.tsx` | **G75 лист 6А**: тот же вид, что «Tuman tanlash» |
| Маршрут новой поездки (форма) | `places/route-screen.tsx` | **G75**: строки листа 6А |
| День и время | `market/when-sheet.tsx` | **G75 лист 3А**: шторка, плитки дня и сетка времени |
| «Izoh» поездки | `market/trip-steps.tsx` | **G75 лист 3А**: шторка |
| Пятак на карте | `market/pitak-screen.tsx` | **G75 лист 6А**: шторка «Shu pitakdan» и «Pitaksiz: faqat uyidan» |
| Лимит поездок | `market/trip-limit.tsx` | **G75 лист 1А** |
| **Одна бронь** | `own-trip/request-sheet.tsx` | **G75 лист 4Б**: шторка над «Mening safarim» |
| «Hamyonda … yetmaydi» | `wallet/shortfall-sheet.tsx` | **G75 лист 4Б** |
| «Hisobni toʻldirish» | `wallet/top-up-link.ts` | **G75 лист 4Б**: готовый текст в поддержку |
| «Vaqt yoki narx», новое время или цена | `market/trip-change.tsx` | **G75 лист 3А**: одна шторка |
| Выбор навигатора | `bookings/navigator-sheet.tsx` | **G75 лист 6А**: шторка и в Telegram, плитки, «Tanlov eslab qolinadi» |
| «Qaysi yoʻlovchi?» | `trip-end/rider-pick.tsx` | **G75**: шторка листа 3А |
| «Soʻrovlar tekshiruvdan keyin» | `market/pending-lock.tsx` | **G75**: экран состояния листа 1А |
| «Mening safarlarim»: «Oʻtgan», пусто | `mine/` | **G75 лист 2А** |
| Отправленные предложения | `bookings/sent-offers.tsx` | **G75 лист 2А** |

## Админка (G75 часть 1, `120`, `162`)

Были в старом виде (G45, G53); план G75 переделать по макету g67/1 (по коду сделаны только главный экран и дела «Navbat», остальное в `168`, цель G78): «Ruxsat yoʻq», главный, «Arizalar», заявка, фото, номер, причины, срок блока, «Shikoyatlar», жалоба, «Statistika», «Safarlar», поездка, «Boshqaruv», «Narxlar» (4 экрана), «Hamyonlar» (2), «Kanallar» (2), «Pitaklar» (4), «Hujjatlar va kompaniya», «Ovozlar». Макет выбран (`120`, `goals/g67/1-chosen.png`).

~~Ошибка: в админке ⋮ «Sozlamalar» пустой~~: исправлено в G75 шаг 1 (у команды нет своего профиля, кнопки нет; стенд и тест).

## Похоже на мёртвый код (разобрано в G75, 10.10.2026)

| Что | Итог |
|---|---|
| Ветки брони попутчика в `market/trip-screen.tsx` | удалены: экран только команды; проверки «своя», «уже есть запрос», «уехала», «закрыта» перенесены на «Safar» (`find/safar-states.test.tsx`) |
| `booking-screen.tsx` с `side="passenger"` | удалено: экран брони только водителя |
| Ветка `changes_requested` в `driver/status-screen.tsx` | уже удалена в G75 («Rad etish» окончательный) |
| Пропы `calendar` (`date-step.tsx`), `fixedDate` (`when-step.tsx`) | уже удалены раньше; `calendar` теперь только состояние экрана |
| `feedback/driver-reviews.tsx` | нужен: отзывы о водителе в экране поездки команды |
| Тест `market/trip-departed.test.tsx` | удалён вместе с `own-trip-book.test.tsx`: их проверки теперь у «Safar» |
