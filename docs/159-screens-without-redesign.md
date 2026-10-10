# 159. Экраны без редизайна

> **Кратко:** сверка 10.10.2026 всех экранов трёх Mini App с редизайном G58 … G68, G72 (`118`, макеты `goals/g58` … `g68`). Около 120 экранов: прошли редизайн 45, частично 8, без редизайна 67. Вся админка (30) без редизайна: G67 была перенесена. Все экраны без редизайна собраны в цель G75. Дыры `124` по коду: `158`.

## Как сверял

| Что | Как |
|---|---|
| Список экранов | от входа каждой Mini App (`apps/miniapp-*/src/pages/start`) по переходам в `packages/ui/src` |
| Редизайн | экран построен по выбранному макету цели G58 … G68 (png в `goals/gNN`, сверка Pixel Perfect) |
| Не считается | только общий фон, полоска загрузки и сплэш G72, правила размера `121` |
| Проверка | главные находки проверены по коду (урок №81) |

## Итог

| Роль | Всего | Да | Частично | Нет |
|---|---|---|---|---|
| Общие | 6 | 1 | 0 | 5 |
| Попутчик | 45 | 24 | 5 | 16 |
| Водитель (свои экраны) | 39 | 20 | 3 | 16 |
| Админка | 30 | 0 | 0 | 30 |

Водитель видит общие с попутчиком экраны в янтарном цвете: документ, блок, фото, жалоба, профиль; их оценка та же.

## Общие (5 нет)

| Экран | Компонент |
|---|---|
| «Telegramda oching» | `states/telegram-only.tsx` |
| «Ilovani qayta oching» (сессия старше 24 ч) | `network/connection-gate.tsx` |
| Плашка «нет сети» | `network/offline-banner.tsx` |
| Ошибка «Qayta urinish» | `states/error-screen.tsx` |
| Скелет загрузки | `states/screen-skeleton.tsx` |

## Попутчик (16 нет, 5 частично)

| Экран | Компонент | Итог |
|---|---|---|
| Документ (оферта, политика) | `legal/legal-screen.tsx` | нет |
| Блок «Hisobingiz toʻxtatilgan» | `account/blocked-screen.tsx` | нет (содержание есть, вид старый) |
| «Rasm qoʻshing» (фото не ушло) | `account/avatar-required-screen.tsx` | нет |
| Список мест: районы, поиск | `places/place-picker.tsx` | частично (новые только рисунки областей) |
| «Tuman tanlash» | `place-picker.tsx` в `market/find-results.tsx` | нет |
| «Safar» закрыта или уехала | `market/closed-trip.tsx` | частично |
| «Barcha izohlar» | `find/reviews-screen.tsx` | нет |
| «Izoh» к брони | `market/trip-steps.tsx` | нет |
| Жалоба и «yuborildi» | `feedback/complaint-screen.tsx` | нет |
| Маршрут заявки (форма) | `places/route-screen.tsx` | нет |
| День заявки | `market/date-step.tsx` | нет |
| **Одно предложение** | `bookings/offer-list.tsx` (OfferScreen) | нет: прячется за новой карточкой |
| «Mening safarlarim»: «Faol», пусто | `market/my-requests-list.tsx` | частично |
| «Obunalar» | `subscriptions/subscriptions-screen.tsx` | нет |
| «Xabar bering» с канала | `subscriptions/subscribe-link.tsx` | нет |
| «Sevimli haydovchilar» | `comfort/favorites-screen.tsx` | нет |
| «Meni qanday koʻradi» | `account/profile/look-screen.tsx` | частично (без макета) |
| «Baholarim» | `find/reviews-screen.tsx` | нет |
| «Safarlar tarixi» | `comfort/history-screen.tsx` | нет (повторяет «Oʻtgan») |
| «Hujjatlar» | `account/profile/documents-screen.tsx` | частично (без макета) |
| Удаление и «Oʻchirildi» | `account/profile/delete-account.tsx` | нет |

## Водитель (16 нет, 3 частично)

| Экран | Компонент | Итог |
|---|---|---|
| «Bosh ekranga qoʻshish» | `home/home-screen-offer.tsx` | нет: старый блок на новом главном |
| Камера с рамкой | `media/camera-screen.tsx` | нет |
| Заявка отклонена | `driver/status-screen.tsx` | нет |
| Списки мест | `places/place-picker.tsx` | частично |
| Маршрут новой поездки (форма) | `places/route-screen.tsx` | нет |
| День и время | `market/when-step.tsx` | нет |
| «Izoh» поездки | `market/trip-steps.tsx` | нет |
| Пятак на карте | `market/pitak-screen.tsx` | частично |
| Лимит поездок | `market/trip-limit.tsx` | нет |
| **Одна бронь** | `bookings/driver-booking.tsx`, `booking-screen.tsx` | нет: открывается из «Mening safarlarim» |
| «Hamyonda … yetmaydi» | `bookings/wallet-steps.tsx` (NotEnoughScreen) | нет |
| «Hisobni toʻldirish» | `bookings/wallet-steps.tsx` (TopUpScreen) | нет |
| «Vaqt yoki narx», новое время или цена | `own-trip/change-choice.tsx`, `market/trip-change.tsx` | нет |
| Выбор навигатора | `bookings/navigator-sheet.tsx` | нет |
| «Qaysi yoʻlovchi?» | `trip-end/rider-pick.tsx` | нет |
| «Soʻrovlar tekshiruvdan keyin» | `market/pending-lock.tsx` | нет |
| «Mening safarlarim»: «Oʻtgan», пусто | `market/my-trips-list.tsx`, `market/trip-card.tsx` | частично |
| Отправленные предложения | `bookings/sent-offers.tsx` | нет |

## Админка (30 нет)

Все экраны в старом виде (G45, G53): «Ruxsat yoʻq», главный, «Arizalar», заявка, фото, номер, причины, срок блока, «Shikoyatlar», жалоба, «Statistika», «Safarlar», поездка, «Boshqaruv», «Narxlar» (4 экрана), «Hamyonlar» (2), «Kanallar» (2), «Pitaklar» (4), «Hujjatlar va kompaniya», «Ovozlar». Макет выбран (`120`, `goals/g67/1-chosen.png`).

**Похоже на ошибку:** в админке ⋮ «Sozlamalar» открывает `ProfileScreen`, а он без аккаунта пустой (`account/profile/profile-screen.tsx:32`; у админки `TeamGate`, не `AccountGate`). Проверить на стенде.

## Похоже на мёртвый код (разобрано в G75, 10.10.2026)

| Что | Итог |
|---|---|
| Ветки брони попутчика в `market/trip-screen.tsx` | удалены: экран только команды; проверки «своя», «уже есть запрос», «уехала», «закрыта» перенесены на «Safar» (`find/safar-states.test.tsx`) |
| `booking-screen.tsx` с `side="passenger"` | удалено: экран брони только водителя |
| Ветка `changes_requested` в `driver/status-screen.tsx` | уже удалена в G75 («Rad etish» окончательный) |
| Пропы `calendar` (`date-step.tsx`), `fixedDate` (`when-step.tsx`) | уже удалены раньше; `calendar` теперь только состояние экрана |
| `feedback/driver-reviews.tsx` | нужен: отзывы о водителе в экране поездки команды |
| Тест `market/trip-departed.test.tsx` | удалён вместе с `own-trip-book.test.tsx`: их проверки теперь у «Safar» |
