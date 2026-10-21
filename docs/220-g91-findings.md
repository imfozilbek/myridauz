# 220. G91: тупики и нелогичные связки интерфейса, находки P1 и P2

> **Кратко:** 20.10.2026 три агента прочитали код по частям (попутчик; водитель; команда, ссылки ботов и коды ошибок), робот обхода прошёл экраны на стенде (`../goals/G91-ui-dead-ends.md`). Найдено 43 находки, без повторов 38: P1 4, P2 19, P3 15. Находки P1 перепроверили два независимых агента: PAS-1, DRV-1, DRV-2, DRV-3 настоящие; PAS-2 оба понизили до P2; ERR-1 оба признали настоящей, но P2: «Назад» есть везде. P3, решения владельцу и итоги робота: `221`.

## Как искали

- **Типы:** T1 тупик; T2 кнопка видна, а сервер откажет; T3 сервер разрешает, а кнопки нет; T4 код ошибки без своего текста и шага; T5 ссылка бота открывает экран, который не понимает состояние; T6 одно и то же по-разному в двух местах; T7 надпись обещает одно, а делает другое.
- **Приоритеты:** P0 деньги, контакты, данные; P1 человек застрял или ему вредно; P2 человеку непонятно; P3 косметика.
- **Одинаковые находки** собраны в одну: BOT-3 = PAS-3; BOT-4 и DRV-8 = PAS-5; ERR-2 = DRV-9; BOT-5 = DRV-10.

## P1

| ID | Что не так (для человека) | Типы | Место |
|---|---|---|---|
| PAS-1 | Водитель отметил «Kelmadi», а страница места попутчика живая: «Joy tasdiqlandi», «Men keldim», «Yaqinlarimga», потом звёзды. Новая ссылка близким снова показывает «Kutmoqda» и «Yoʻlda», хотя человека нет в машине (обходит исправление C7) | T6, T2 | `shares/application/shares.ts`, `share.ts`, `bookings/passenger-booking.tsx`, `confirmed-booking.tsx`, `progress.ts` |
| DRV-1 | Одобренный водитель меняет фото лица: сразу перестаёт быть водителем, даже в живой поездке; главный экран прячет «Yoʻlga chiqdim», встречу, «Yetib keldik». Правило `50` говорит: выпущенные поездки живут дальше | T2, T3, T6 | `drivers/application/moderate.ts`, `home/dock/driver-state.ts`, `account/profile/avatar-picker.tsx` |
| DRV-2 | Такую повторную проверку команда видит как новую заявку и может нажать «Rad etish»: приложение водителя навсегда показывает только «Ariza rad etildi»; поездки, кошелёк и история пропадают | T1, T3 | `drivers/domain/application.ts`, `driver/driver-gate.tsx`, `navbat/application-case.tsx` |
| DRV-3 | Новое фото машины сразу снимает права водителя, даже если он вернулся «Назад» без «Yuborish»; вопроса перед уходом нет, команда заявку не получает | T2, T6 | `driver/use-car-shots.ts`, `driver/application-flow.tsx`, `drivers/application/apply.ts` |

## P2

| ID | Что не так | Типы | Место |
|---|---|---|---|
| PAS-2 | «Soʻrov qoldirish» и «Qayta yuborish» доступны, когда место или заявка уже есть; отказ только в конце, текстом для водителя «Faol eʼlonlar … Eskisini bekor qiling» | T2, T4 | `market/request-steps.tsx`, `find/learn-block.tsx`, `ride-requests/application/use-cases.ts` |
| PAS-3 | Ссылки с прошлым днём («Oʻxshash safarlar», «Boshqa safar topish», «Qaytish safari», «Hammasini koʻrish») открывают поиск на прошлый день: всегда пусто, «Soʻrov qoldirish» потом отказ | T5, T2 | `find/find-link.tsx` (нет сдвига на сегодня, как в `subscribe-link.tsx`) |
| PAS-4 | Сохранённого водителя нельзя убрать из «Sevimli»; подсказка зовёт на «Safar», где кнопки нет; при лимите текст «Keraksizini oʻchiring» | T3, T7 | `comfort/favorites-screen.tsx`, `comfort.json` |
| PAS-5 | Плитка «Baho · muddat tugadi» и старая ссылка «Izoh qoldirish» ведут на общую ошибку с вечным «Qayta urinish» | T4, T5 | `feedback/review-screen.tsx`, `trip-end/rate-link-screen.tsx` |
| PAS-6 | Ссылка на поездку удалённого водителя: общая ошибка по кругу; до регистрации кнопка «Qayta urinish» на деле начинает регистрацию | T5, T4, T7 | `market/trip-link.tsx`, `account/trip-preview.tsx` |
| PAS-7 | После «Yetib keldim» и «Yetib keldik» страница места до двух часов выглядит живой: нет звёзд, есть «Yaqinlarimga» | T3, T6 | `bookings/confirmed-booking.tsx` |
| DRV-4 | В чате с заявкой кнопка предложения не знает о живой поездке; отказ «Eskisini bekor qiling» | T2, T4 | `talk/talk-action.tsx` |
| DRV-5 | «Safaringizga mos» показывает заявки по области, сервер берёт по району: отказ текстом для попутчика | T2, T4 | `ride-requests/domain/board-fit.ts`, `offer-plan.ts` |
| DRV-6 | «Bekor qilish» места после выезда или «Keldi»: отказ и кнопка снова на месте | T2, T4 | `bookings/driver-booking.tsx` |
| DRV-7 | После «Yetib keldik» главный экран водителя до двух часов не показывает «Safar tugadi, Baho berish» | T6, T3 | `home/dock/driver-state.ts` |
| DRV-9 | MyRida: список закрыт, а «Haydovchi sifatida ham yozilish» доступно; на последнем шаге общая ошибка | T2, T4 | `waitlist/edit-sheet.tsx`, `waitlist-flow.tsx` |
| ADM-1 | Модератор видит «Yoʻnalishni ochish»; сервер отказывает, экран молчит | T2, T4 | `stats/direction-screen.tsx` |
| ADM-2 | Модератор открывает человека из поездки: общая ошибка по кругу | T2, T4 | `bots/support-card.ts`, `team/trip-screen.tsx` |
| ADM-3 | Жалоба на модератора лежит в его «Navbat»; решения ему всегда отказаны | T2 | `team-queue/domain/queue.ts`, `complaint-case.tsx` |
| ADM-4 | Отмена поездки командой после «Keldi» или «Kelmadi»: неверный текст, кнопка остаётся | T2, T4 | `team/team-cancel-trip.tsx` |
| ADM-5 | Неизвестный или удалённый человек в «Odamlar»: «попробуйте позже» | T4 | `people/people-screen.tsx` |
| BOT-1 | MyRida «/hujjatlar»: документ не открывается, открывается анкета | T5 | `app-gates.tsx`, `documents-reply.ts` |
| ERR-1 | Экраны загрузки показывают «Xatolik yuz berdi, birozdan keyin» на любой отказ сервера, и на окончательный: «Qayta urinish» не поможет никогда (старая ссылка оценки, удалённая поездка, нет прав). «Назад» есть везде. Корень PAS-5, PAS-6, ADM-2, ADM-5 | T4 | `market/use-list.ts`, `states/error-screen.tsx` |
| BOT-2 | «Chatni ochish» под новым сообщением открывает пустой главный экран, если сообщение уже прочитано | T7, T5 | `chat-ring-button.ts`, `action-sheet` |

## Статус (20.10.2026)

| Статус | Находки |
|---|---|
| Исправлено, тест сначала падал | все P1 и P2: PAS-1 … PAS-7, DRV-1 … DRV-7, DRV-9, ADM-1 … ADM-5, BOT-1, BOT-2, ERR-1 |
| По решениям владельца 20.10.2026 (`221`) | DRV-1 (решение 1), DRV-2 (решение 2), DRV-3 (решение 3, тексты 5, 6), PAS-2 (текст 4), PAS-4 (решение 4, тексты 7, 8), PAS-6 и ADM-5 (тексты 1, 2) |

- **ERR-1:** окончательный отказ сервера (не сеть, не 401, 408, 429, не 5xx) с известным кодом показывает свой текст и «Orqaga» вместо вечного «Qayta urinish» (`states/error-screen.tsx`, `market/error-text.ts` `finalKey`). Так закрыты PAS-5 и части PAS-6, ADM-2, ADM-5.
- **ADM-3:** жалоба на модератора не попадает ему: ни в «Navbat», ни в карточку бота, ни в срочный звонок, ни в напоминание. Стороны жалобы остаются на сервере.
