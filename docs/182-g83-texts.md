# 182. G83: тексты списка ожидания на согласие владельца (v2, с болями)

> **Кратко:** тексты бота «MyRida» (`@myridauz_bot`), опросника, результата и блока команды по макетам v2 `goals/g83` (`181`). Знак «утв. 12.10» значит: текст из серии болей, которую владелец утвердил 12.10.2026 (`@rida1uz`, 114 … 121). «есть»: текст уже есть в продукте. Остальное новое: нужно «да» владельца и проверка носителем (`25`). Экраны с этими текстами утверждены 14.10.2026 (`goals/g83/approved`). `{brand}`: имя среды («MyRida» во внутренней, «Rida» в проде, `179`).

## Боли и решения

| Ключ | Боль и подпись | Решение | Статус |
|---|---|---|---|
| `chats` попутчик | Guruhlarda tartibsizlik · Kerakli eʼlonni topib boʻlmaydi | Hamma safarlar bir roʻyxatda: qayerdan, qayerga va qachon boʻyicha darhol topasiz. | новое, приоритет 1 |
| `chats` водитель | Guruhlarda tartibsizlik · Kerakli xabarni topib boʻlmaydi, yoʻlovchi yoʻqoladi | Yoʻlovchilar soʻrovlari botga oʻzi keladi: qayerdan, qayerga, qachon. | решение утв. 12.10, подпись новая, приоритет 1 |
| `fixed` попутчик | Narx qatʼiy belgilangan · Narxni ilova qoʻyadi, kelishib boʻlmaydi | Narxni oʻzingiz taklif qilasiz. {brand} faqat tavsiya beradi. | новое, приоритет 2 |
| `fixed` водитель | Narx qatʼiy belgilangan · Narxni ilova qoʻyadi, oʻzim belgilay olmayman | Safar narxini oʻzingiz qoʻyasiz. {brand} faqat tavsiya beradi. | новое, приоритет 2 |
| `phone` попутчик | Raqamim hammaga ochiq · Guruhda eʼlon bersam, raqamimni hamma koʻradi | Raqamingiz hech kimga koʻrinmaydi. Haydovchi bilan {brand} ichida yozishasiz. | подпись новая, приоритет 3 |
| `phone` водитель | Raqamim hammaga ochiq · Guruhda eʼlon bersam, raqamimni hamma koʻradi | Raqamingiz hech kimga koʻrinmaydi. Yoʻlovchi bilan {brand} ichida gaplashasiz. | новое, приоритет 3 |
| `wait` попутчик | Pitakda kutish · Mashina toʻlishini soatlab kutaman | Joyni oldindan band qilasiz. Haydovchi yoʻlga chiqish vaqtini oldindan yozadi. | утв. 12.10 (решение), подпись новая |
| `wait` водитель | Pitakda kutish · Soatlab yoʻlovchi kutaman, mashina yarim boʻsh | Safaringizni eʼlon qilasiz, yoʻlovchilar oʻzlari joy band qiladi. | утв. 12.10 |
| `price` | Bayram oldidan narx · Narx birdan ikki baravar oshadi | Narx safar eʼlonida yoziladi. Band qilishdan oldin koʻrasiz. | утв. 12.10, подпись новая |
| `empty` | Orqaga boʻsh qaytish · Qaytishda mashina boʻsh, yoqilgʻi menga qoladi | Qaytish safarini oldindan eʼlon qilasiz va yoʻlovchilar uni ham band qiladi. | утв. 12.10 |
| `woman` | Mashinada ayol bormi · Yolgʻiz ayol qaysi mashinaga oʻtirishni bilmaydi | «Mashinada ayol bor» belgili safarlarni tanlaysiz. | утв. 12.10 |
| `family` | Yaqinlarim xavotirda · Qaysi mashinada ketayotganimni bilishmaydi | Safarni yaqinlaringizga bir tugma bilan yuborasiz: mashina, raqami va «yetib keldi». | утв. 12.10, короче |

Порядок в таблице: порядок на экране (приоритет владельца 14.10.2026, `181`).

## Бот

| Где | Текст |
|---|---|
| Описание до Start | Guruhlarda kerakli eʼlonni topa olmayapsizmi? Narxni ilova qatʼiy qoʻyadimi? Raqamingiz hammaga ochiqmi? {brand}: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. Tez orada ochiladi. Yoʻnalishingizni hozir yozib qoʻying: ochilganda birinchi boʻlib xabar beramiz. |
| Первое сообщение (видео 15 с) | Assalomu alaykum, {name}! 👋 · {brand}: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. · Tanish gaplarmi? · 🔎 Guruhlarda kerakli eʼlonni topib boʻlmaydi · 💸 Narxni ilova qatʼiy qoʻyadi · 🔒 Raqamingiz hammaga ochiq · {brand} tez orada ochiladi va shularni hal qiladi. · цитата: 📝 Yoʻnalishingizni yozib qoʻying: 1 daqiqa, telefon raqami kerak emas |
| Кнопки | 🚀 Roʻyxatga yozilish · 📣 Kanal · меню «ilova» (есть); документы: команда `/documents` (есть) |
| Живая карточка | ⏳ Roʻyxatdasiz (водитель: · haydovchi) · {when} · tez orada ochiladi · 🟢 {from} · 🔴 {to} · 👥 {count} kishi kutmoqda · 🚗 {drivers} haydovchi · Siz tanlagan: {pains} · ✏️ {time} da yangilandi · har dushanba yangilanadi |
| Карточка, кнопки | 👥 Doʻstimni chaqiraman · ✏️ Oʻzgartirish · 📣 Kanal · водитель сверху: 🚗 Haydovchi boʻlish |
| Закреп | 📌 {from} → {to} · roʻyxatdasiz / haydovchi / ochildi |
| Карточка открыта | ✅ Yoʻnalish ochildi · Bugun {n} ta safar · ertaga {m} ta (водитель: {count} yoʻlovchi kutmoqda) · 🔎 Safar topish · 🚗 Safar eʼlon qilish · 📣 Yoʻnalish kanali |
| Звонок при открытии | цитата {from} → {to} · 🔔 Yoʻnalishingiz ochildi: endi guruhlardan qidirmaysiz, hamma safarlar bir joyda. · водитель: 🔔 Yoʻnalishingiz ochildi: {count} yoʻlovchi safaringizni kutmoqda. Endi guruhlarda yoʻlovchi qidirmaysiz. |
| Приветствие, список закрыт | Assalomu alaykum, {name}! 👋 · {brand} ochildi: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. · 🔎 Safar toping va joyni oldindan band qiling. · 🚗 Mashinangiz boʻlsa, safar eʼlon qiling. · 🔎 Safar topish · 🚗 Safar eʼlon qilish · 📣 Kanal |
| Другу | Men ham guruhlarda kerakli eʼlonni qidirib charchadim. {brand} tez orada ochiladi: u yerda hamma safarlar bir joyda. Men yozildim: {route}. Siz ham yoziling: qancha koʻp odam yozilsa, haydovchi shuncha tez topiladi. · Roʻyxatga yozilish |

Строки «Endi … » и первая строка сообщения другу: по одной на каждую боль: 7 у попутчика и 5 у водителя (как в таблице болей).

## Mini App

| Где | Текст |
|---|---|
| Первый экран | {brand} · Manzil sari (есть) · Tez orada ochiladi · Yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. |
| Роль | Kim boʻlib yoʻlga chiqasiz? · Yoʻlovchiman · Safarga joy kerak · Haydovchiman · Mashinam bor, boʻsh joy bor · Javobni keyin oʻzgartirsa boʻladi. |
| Боли | Yoʻlda sizni nima qiynaydi? · Bir nechtasini tanlang. · Davom etish (есть) |
| Откуда, куда (`5-regions`) | Qayerdan yoʻlga chiqasiz? · Qayerga borasiz? (есть) · имена областей из справочника (есть) · группы на карте: Toshkent · Vodiy · Markaz · Janub · Gʻarb · подпись на кнопке: Qayerdan |
| Каналы (последний шаг) | Yoʻnalishingiz kanallari · Yangi safarlar va yangiliklar shu yerda. Keraklisiga qoʻshiling. · Asosiy kanal · {region} · Qoʻshilish · ✓ Aʼzosiz (есть) · Yangiliklar, ochilish kunlari · Davom etish (есть) |
| Когда | Qachon yoʻlga chiqasiz? · Har hafta · Har oy · Bayramlarda · Bir marta · водитель: Bu yoʻnalishda qanchalik tez-tez yurasiz? · Har kuni · Baʼzan |
| Результат | Siz roʻyxatdasiz · Yoʻnalishingiz ochilganda birinchi boʻlib xabar beramiz. · {count} kishi kutmoqda · Bu yoʻnalishda. {share} % ini ham {pain} qiynaydi. · водитель: {count} yoʻlovchi kutmoqda · Bu yoʻnalishda. Ochilganda safaringizni koʻradi. · {brand} buni hal qiladi |
| Кнопки | Doʻstimni chaqiraman · Haydovchi boʻlish (есть) |
| Строка каналов на результате | Kanallar · {n} ta kanaldasiz · Hali kanalga qoʻshilmagansiz |
| Шторки | Oʻzgartirish · Muammolar · Yoʻnalish · Qayerdan va qayerga · Qachon · Haydovchi sifatida ham yozilish · Mashinangiz boʻlsa |

## Админка

| Где | Текст |
|---|---|
| Блок | Kutayotganlar · {p} yoʻlovchi · {d} haydovchi · {n} yoʻnalish, eng koʻpi tepada · Eng koʻp ogʻriq: {pain} · Yoʻlovchilarning {share} % i tanlagan · Hammasi ({n}) |
| Направление | Roʻyxat {date}dan beri · Yoʻlovchilar · Yoʻlovchilarni nima qiynaydi · Haydovchilar · Ariza tasdiqlangan |
| Открытие | Yoʻnalishni ochish · Yoʻnalishni ochasizmi? · {p} yoʻlovchi va {d} haydovchiga bot xabar yuboradi. Xabar bir marta ketadi. · Ochish · Ochildi · {date} · Xabar ketdi: {n} kishiga |
| Воронки (`183`) | Roʻyxatga yozilish · Botni ochdi · Ilovani ochdi (есть) · Rolni tanladi · Roʻyxatda · Roʻyxat: yoʻlovchi · Roʻyxat: haydovchi · Rol · Muammolar · Qayerdan · Qayerga · Qachon · {drop}% ketdi (есть) |
| Рубильник (`181`) | Kutish roʻyxati · Roʻyxatga yozish · Ochiq: yangi odamlar roʻyxatga yoziladi · Yopiq · {time} dan: botda safar tugmalari · {n} ta havola · Roʻyxatni yopasizmi? · Yangi odamlar endi roʻyxatga yozilmaydi: botda «Safar topish» va «Safar eʼlon qilish» tugmalari chiqadi. · Kutayotgan {n} kishiga hozir xabar ketmaydi: har yoʻnalish ochilganda yozamiz. · Yopish · Roʻyxatni ochasizmi? · Yangi odamlar yana roʻyxatga yoziladi. · Ochish (есть) · Bekor qilish (есть) |
| Ссылки для рекламы (`184`) | Reklama havolalari · Har reklama uchun alohida havola: qaysi reklama nechta odam olib kelganini koʻrasiz. · Yangi havola · Havolalar · {n} bosdi · {n} yozildi · Oʻngda: bitta yozilgan odam qanchaga tushdi. Narx kiritilmagan boʻlsa, boʻsh. · Qayerga olib boradi · Bot · Kanal · Qayerda reklama · Telegram · Instagram · Bloger · Boshqa · Nomi · Statistikada shu nom koʻrinadi. · Narxi (shart emas) · Necha kun turadi · {n} kun · Doimiy · Tepada: boshqa post chiqmaydi · Yoʻq · {n} soat · Qadalgan (pin) · tepada {n} soat · qadalgan {n} soat · Havola yaratish · Qaysi kanalga? · Havola shu kanalga qoʻshilish havolasi boʻladi. · Asosiy kanal (есть) · Viloyat kanallari · botga · kanalga · Havola botga olib boradi. · Havola «{channel}» kanaliga olib boradi. Kim shu havola orqali qoʻshilganini koʻramiz. · Havola tayyor · Havolani reklama sotuvchisiga yuboring: u postdagi tugmaga yoki matnga qoʻysin. Rasm, video, matn: istalgan kontent boʻlishi mumkin. · Havolani nusxalash · Nima berdi · Bosdi · {p} yoʻlovchi · {d} haydovchi · {n} qoʻshildi · Kanalga qoʻshildi · Kanalda qoldi · {n}% chiqib ketdi · Roʻyxatga yozildi · Bitta obunachi · Shartlar va pul · Narxi · Bitta yozilgan odam · Keyin · Doʻst orqali yana yozildi · Shu reklamadan kelganlar chaqirdi |
| Блоки статистики (`183`) | Roʻyxatdan keyin · Kanalga qoʻshildi · Kanallar qadamida · Doʻstini chaqirdi · Havolani yubordi · Doʻst orqali yozildi · Bitta odam oʻrtacha {n} kishini olib keldi · Qayerdan kelishdi (есть) · {n} ochdi · {share} % yozildi · Doʻst havolasi · Haydovchi yetishmaydi · Qachon yozilishdi · Qurilmalar (есть) · Qanchalik tez-tez · Ham yoʻlovchi, ham haydovchi |

## Убрано

- По правилам рекламы: «Bu taksi emas», «Haydovchilar tekshirilgan», «Tekshiruvdan oʻtish» (документы водителя не проверяются), цены и бонусы.
- «Roʻyxatdan chiqish» и его шторка: решение владельца 14.10.2026.
- Шаг «{region}ning qaysi joyi?» и «Sizning joyingiz»: район в опроснике не спрашиваем (решение владельца 14.10.2026).
- Шторка «Qaysi kuni?» и «Kunini tanlaysiz»: точную дату в опроснике не спрашиваем (решение владельца 14.10.2026).
- По системе G68 (`122`): отдельные сообщения «Siz roʻyxatdasiz» и пост канала: их заменила живая карточка.

## Вопросы носителю

- «Yoʻlda sizni nima qiynaydi?»: звучит естественно?
- «Narx qatʼiy belgilangan» и «Narxni ilova qoʻyadi»: понятно, о чём речь?
- «Tanish gaplarmi?» в приветствии: так говорят?
- Группы «Vodiy», «Markaz», «Janub», «Gʻarb»: так люди называют части страны?
- «Tepada: boshqa post chiqmaydi» и «Qadalgan (pin)»: так говорят продавцы рекламы в каналах?
