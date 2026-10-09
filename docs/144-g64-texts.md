# 144. G64: новые тексты на согласие владельца

> **Кратко:** тексты пути 7 (`118`): «Yoʻlovchilar soʻrovlari», окно предложения, поездка из заявки «Boʻsh salon kerak», предложение в чате и звонке, «Mening safarlarim». Тексты с макетов `goals/g64/` одобрены вместе с макетами 06.10.2026 и идут в код точно как на макете. Новые тексты ниже (макета нет): **согласие владельца 09.10.2026: «Тексты да»**. Проверка носителем (`25`) остаётся.

## С макетов (одобрены 06.10.2026)

| Экран | Тексты |
|---|---|
| Заявки (g64/1, 3) | «Bugun / Ertaga / {день}» с «{n} ta», «Safaringiz: {когда}, {куда}», «{n} boʻsh joy · {цена}», «Safaringizga mos ({n})», «Boshqa soʻrovlar ({n})», «+{n} km», «Pitakdan», «Uyidan», «Boʻsh salon kerak», «Men bilan ayol bor», «{n} kishi», «Taklif yuborish», «Safarimga taklif qilish», «Safar ochib taklif qilish» |
| Окно предложения (g64/1) | «{имя}ga taklif», «{откуда} → {куда} · {день} · {n} kishi», «Qachon joʻnaysiz?», «Boshqa», «Bir joy narxi», «{имя} taklifi: {цена}» |
| Одно окно салона (g64/3) | «{имя} uchun safar», «Soʻrovdan toʻldirildi. Faqat vaqtni tanlang.», «Yoʻnalish», «Kun», «Qayerdan olasiz?», «Qanday band qilinadi?», «Faqat butun salon», «{n} joy × {цена} = {сумма}», «{имя} rozi boʻlsa, safar unga band boʻladi.» |
| «Mening safarim» после окна (g64/3) | «{имя}ga taklif yuborildi», «Javobini kutyapsiz. Safar boshqalarga koʻrinmaydi.», «Faqat butun salon · {n} joy», «Safarni bekor qilish» |
| Чат водителя (g64/5) | «Yoʻlovchi», «Soʻrov: {откуда} → {куда}, {день}», «Siz taklif yubordingiz», «{когда} · {n} joy», «{пятак} · {цена} × {n} = {сумма}», «{имя} javobini kutyapsiz» |
| Чат попутчика (g64/4) | «Soʻrovingiz: {откуда} → {куда}, {день}», «{имя} taklif yubordi», «{когда} · butun salon», «{n} joy × {цена}», «{сумма} soʻm», «Rad etish», «Qabul qilish» |
| Звонок (g64/2, 4) | «{имя}ning soʻrovi», «{имя}ning taklifi», «hozir keldi», «Taklifni qabul qilish», «Ovozni oʻchirish», «Tugatish» |
| «Mening safarlarim» (g64/6) | «Faol ({n})», «Oʻtgan», «Bu», «Pa», «Ju», «Sh», «Ya», «Du», «Se», «Ertaga shu safar», «{день} · {время}», «Qaytish safari», «{n} ta yangi soʻrov», «{n} boʻsh joy», «Hamma joy band», «Bu oy», «{n} safar», «Yoʻl xarajati qaytdi» |

## Новые (согласие 09.10.2026, макета нет)

| # | Где | Текст |
|---|---|---|
| 1 | «Mening safarlarim»: среда в строке недели (на макете недели нет среды) | Ch |
| 2 | «Mening soʻrovim»: переключатель звонков по заявке (`127`: «звонки можно выключить») | Haydovchilar qoʻngʻiroq qilishi mumkin |
| 3 | Подпись под переключателем 2 | Oʻchirsangiz, haydovchilar faqat yozadi. |
| 4 | Ошибка: водитель звонит, а попутчик выключил звонки (`calls.off`) | Yoʻlovchi qoʻngʻiroqlarni oʻchirgan. Chatda yozing. |
| 5 | Ошибка: водитель исчерпал звонки по заявке (`calls.limit`) | Bu soʻrov boʻyicha qoʻngʻiroqlar soni tugadi. Chatda yozing. |
| 6 | «Mening safarim»: попутчик отказался от поездки из заявки (заголовок) | {имя} taklifni rad etdi |
| 7 | То же: попутчик не ответил или закрыл заявку (заголовок) | Taklif muddati tugadi |
| 8 | Подпись под 6 и 7 | Safarni hammaga ochish yoki bekor qilish mumkin. |
| 9 | Кнопка под 8 | Safarni hammaga ochish |
| 10 | Ошибка: в поездке уже нет мест для заявки (`bookings.no_seats` есть, нужен второй случай: салон уже не пустой) | Safaringizda band joylar bor. Butun salonni taklif qilib boʻlmaydi. |

## Решения без вопроса (как на макете или по docs)

- Карточка заявки: кнопки чата и звонка рядом с главной кнопкой (как `g64/2`, `g64/3`, путь 7 экран 7 и Definition of Done). На путь 7 экран 2 их нет: это более ранний вид той же карточки.
- Если у водителя есть поездка: сверху поездка, «Safaringizga mos», ниже «Boshqa soʻrovlar»; кнопок дней нет (как `g64/1` телефон 2).
- Третья кнопка дня: ближайший следующий день, где есть заявки (на макете «8-okt»).
- Окно предложения: время кнопками, через 2 часа, от ближайшего возможного часа; «Boshqa» открывает выбор времени.
- Список открывается сразу, без выбора маршрута (как путь 7, экраны 1 и 2): заявки на направлениях водителя (его поездки за 60 дней в обе стороны и его подписки, по областям). Нет ни поездок, ни подписок: сначала выбор маршрута, как сейчас.
- Звонков водителя по одной заявке до брони: не больше 3 (настройка бренда `calls.requestRings`, меняет владелец, `128`).
- Цель G74 (предложение в чате и звонке) входит в G64 целиком: те же экраны у попутчика.
