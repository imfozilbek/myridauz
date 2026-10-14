# 182. G83: тексты списка ожидания на согласие владельца (v2, с болями)

> **Кратко:** тексты бота «MyRida» (`@myridauz_bot`), опросника, результата и блока команды по макетам v2 `goals/g83` (`181`). Знак «утв. 12.10» значит: текст из серии болей, которую владелец утвердил 12.10.2026 (`@rida1uz`, 114 … 121). «есть»: текст уже есть в продукте. Остальное новое: нужно «да» владельца и проверка носителем (`25`). `{brand}`: имя среды («MyRida» во внутренней, «Rida» в проде, `179`).

## Боли и решения

| Ключ | Боль и подпись | Решение | Статус |
|---|---|---|---|
| `wait` попутчик | Pitakda kutish · Mashina toʻlishini soatlab kutaman | Joyni oldindan band qilasiz. Haydovchi yoʻlga chiqish vaqtini oldindan yozadi. | утв. 12.10 (решение), подпись новая |
| `price` | Bayram oldidan narx · Narx birdan ikki baravar oshadi | Narx safar eʼlonida yoziladi. Band qilishdan oldin koʻrasiz. | утв. 12.10, подпись новая |
| `phone` попутчик | Raqamim begonalarda · Guruhga yozsam, notanishlar qoʻngʻiroq qiladi | Raqamingiz hech kimga koʻrinmaydi. Haydovchi bilan {brand} ichida yozishasiz. | утв. 12.10, короче |
| `woman` | Mashinada ayol bormi · Yolgʻiz ayol qaysi mashinaga oʻtirishni bilmaydi | «Mashinada ayol bor» belgili safarlarni tanlaysiz. | утв. 12.10 |
| `family` | Yaqinlarim xavotirda · Qaysi mashinada ketayotganimni bilishmaydi | Safarni yaqinlaringizga bir tugma bilan yuborasiz: mashina, raqami va «yetib keldi». | утв. 12.10, короче |
| `wait` водитель | Pitakda kutish · Soatlab yoʻlovchi kutaman, mashina yarim boʻsh | Safaringizni eʼlon qilasiz, yoʻlovchilar oʻzlari joy band qiladi. | утв. 12.10 |
| `chats` | Chatlarda qidirish · Yuzlab xabar ichidan yoʻlovchi qidiraman | Yoʻlovchilar soʻrovlari botga oʻzi keladi: qayerdan, qayerga, qachon. | утв. 12.10 |
| `empty` | Orqaga boʻsh qaytish · Qaytishda mashina boʻsh, yoqilgʻi menga qoladi | Qaytish safarini oldindan eʼlon qilasiz va yoʻlovchilar uni ham band qiladi. | утв. 12.10 |
| `phone` водитель | Raqamim begonalarda · Notanishlar qoʻngʻiroq qiladi, reklama yozadi | Raqamingiz hech kimga koʻrinmaydi. Yoʻlovchi bilan {brand} ichida gaplashasiz. | новое |

## Бот

| Где | Текст |
|---|---|
| Описание до Start | Pitakda soatlab kutasizmi? Bayram oldidan narx oshadimi? Raqamingiz begonalardami? {brand}: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. Tez orada ochiladi. Yoʻnalishingizni hozir yozib qoʻying: ochilganda birinchi boʻlib xabar beramiz. |
| Первое сообщение (видео 15 с) | Assalomu alaykum, {name}! 👋 · {brand}: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. · Tanish gaplarmi? · ⏳ Pitakda mashina toʻlishini soatlab kutish · 📈 Bayram oldidan narx ikki baravar · 🔒 Raqamingiz begonalarda · {brand} tez orada ochiladi va shularni hal qiladi. · цитата: 📝 Yoʻnalishingizni yozib qoʻying: 1 daqiqa, telefon raqami kerak emas |
| Кнопки | 🚀 Roʻyxatga yozilish · 📣 Kanal · меню «ilova» (есть); документы: команда `/documents` (есть) |
| Живая карточка | ⏳ Roʻyxatdasiz (водитель: · haydovchi) · {when} · tez orada ochiladi · 🟢 {from} · 🔴 {to} · 👥 {count} kishi kutmoqda · 🚗 {drivers} haydovchi · Siz tanlagan: {pains} · ✏️ {time} da yangilandi · har dushanba yangilanadi |
| Карточка, кнопки | 👥 Doʻstimni chaqiraman · ✏️ Oʻzgartirish · 📣 Kanal · водитель сверху: 🚗 Haydovchi boʻlish |
| Закреп | 📌 {from} → {to} · roʻyxatdasiz / haydovchi / ochildi |
| Карточка открыта | ✅ Yoʻnalish ochildi · Bugun {n} ta safar · ertaga {m} ta (водитель: {count} yoʻlovchi kutmoqda) · 🔎 Safar topish · 🚗 Safar eʼlon qilish · 📣 Yoʻnalish kanali |
| Звонок при открытии | цитата {from} → {to} · 🔔 Yoʻnalishingiz ochildi: endi pitakda kutmaysiz, joyni oldindan band qiling. · водитель: 🔔 Yoʻnalishingiz ochildi: {count} yoʻlovchi safaringizni kutmoqda. Endi orqaga boʻsh qaytmaysiz. |
| Другу | Men ham pitakda soatlab kutishdan charchadim. {brand} tez orada ochiladi: u yerda joyni oldindan band qilasiz. Men yozildim: {route}. Siz ham yoziling: qancha koʻp odam yozilsa, haydovchi shuncha tez topiladi. · Roʻyxatga yozilish |

Строки «Endi … » и первая строка сообщения другу: по одной на каждую боль, всего 9 пар (как в таблице болей).

## Mini App

| Где | Текст |
|---|---|
| Первый экран | {brand} · Manzil sari (есть) · Tez orada ochiladi · Yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. |
| Роль | Kim boʻlib yoʻlga chiqasiz? · Yoʻlovchiman · Safarga joy kerak · Haydovchiman · Mashinam bor, boʻsh joy bor · Javobni keyin oʻzgartirsa boʻladi. |
| Боли | Yoʻlda sizni nima qiynaydi? · Bir nechtasini tanlang. · Davom etish (есть) |
| Откуда, куда, место | есть (G26, G75) |
| Когда | Qachon yoʻlga chiqasiz? · Har hafta · Har oy · Bayramlarda · Bir marta · Kunini tanlaysiz · водитель: Bu yoʻnalishda qanchalik tez-tez yurasiz? · Har kuni · Baʼzan · Qaysi kuni? (есть) · Oktabr. Kun oʻtib ketsa, bot yana soʻraydi. |
| Результат | Siz roʻyxatdasiz · Yoʻnalishingiz ochilganda birinchi boʻlib xabar beramiz. · {count} kishi kutmoqda · Bu yoʻnalishda. {share} % ini ham {pain} qiynaydi. · водитель: {count} yoʻlovchi kutmoqda · Bu yoʻnalishda. Ochilganda safaringizni koʻradi. · {brand} buni hal qiladi |
| Кнопки | Doʻstimni chaqiraman · Haydovchi boʻlish (есть) |
| Карточка канала | {channel} (имя из Telegram) · Qoʻshilish · ✓ Aʼzosiz (есть, `119`) |
| Шторки | Oʻzgartirish · Muammolar · Yoʻnalish · Qayerdan va qayerga · Qachon · Haydovchi sifatida ham yozilish · Mashinangiz boʻlsa · Roʻyxatdan chiqish · Roʻyxatdan chiqasizmi? · Yoʻnalishingiz va javoblaringiz oʻchiriladi. Yoʻnalish ochilganda xabar kelmaydi. · Bekor qilish (есть) |

## Админка

| Где | Текст |
|---|---|
| Блок | Kutayotganlar · {p} yoʻlovchi · {d} haydovchi · {n} yoʻnalish, eng koʻpi tepada · Eng koʻp ogʻriq: {pain} · Yoʻlovchilarning {share} % i tanlagan · Hammasi ({n}) |
| Направление | Roʻyxat {date}dan beri · Yoʻlovchilar · Yoʻlovchilarni nima qiynaydi · Haydovchilar · Ariza tasdiqlangan |
| Открытие | Yoʻnalishni ochish · Yoʻnalishni ochasizmi? · {p} yoʻlovchi va {d} haydovchiga bot xabar yuboradi. Xabar bir marta ketadi. · Ochish · Ochildi · {date} · Xabar ketdi: {n} kishiga |

## Убрано

- По правилам рекламы: «Bu taksi emas», «Haydovchilar tekshirilgan», «Tekshiruvdan oʻtish» (документы водителя не проверяются), цены и бонусы.
- По системе G68 (`122`): отдельные сообщения «Siz roʻyxatdasiz» и пост канала: их заменила живая карточка.

## Вопросы носителю

- «Yoʻlda sizni nima qiynaydi?»: звучит естественно?
- «Raqamim begonalarda»: понятно без пояснения?
- «Tanish gaplarmi?» в приветствии: так говорят?
