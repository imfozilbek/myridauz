# 182. G83: тексты списка ожидания на согласие владельца (v2, с болями)

> **Кратко:** тексты бота «MyRida» (`@myridauz_bot`), опросника, результата и блока команды по макетам v2 `goals/g83` (`181`). Знак «утв. 12.10» значит: текст из серии болей, которую владелец утвердил 12.10.2026 (`@rida1uz`, 114 … 121). «есть»: текст уже есть в продукте. Остальное новое: нужно «да» владельца и проверка носителем (`25`). Экраны с этими текстами утверждены 14.10.2026 (`goals/g83/approved`). `{brand}`: имя среды («MyRida» во внутренней, «Rida» в проде, `179`).

## Боли и решения

Тексты владельца 14.10.2026. На экране болей: название и подпись (попутчик: картинка владельца слово в слово, 6 болей; водитель: названия и «Izoh» владельца, 7 болей). Короткий вопрос: приветствие бота (первые 3). Длинный вопрос: описание бота (первые 3), посты, реклама. Название: результат, карточка бота, админка. Решения: серия 12.10 и `09`, `06`, `24`, `17`.

| № | Название · подпись (экран) | Короткий вопрос | Длинный вопрос | Решение |
|---|---|---|---|---|
| 1 поп. `chats` | Telegram guruhlaridagi tartibsizlik · Kerakli eʼlonni topish qiyin va maʼlumotlar chalkash | Guruhlardan kerakli eʼlonni topish qiyinmi? | Guruhlarda eʼlon koʻpligidan keraklisini topishga qiynalasizmi? | Hamma safarlar bir roʻyxatda: qayerdan, qayerga va qachon boʻyicha darhol topasiz. |
| 2 поп. `fixed` | Narxlarning mos kelmasligi · Yoʻl haqi men xohlagandek emas, kelishish imkoni yoʻq | Narxni kelisha olmaslik xalaqit beryaptimi? | Narxlar qatʼiy belgilangani va kelishib boʻlmasligi yoqmaydimi? | Narxni oʻzingiz taklif qilasiz. {brand} faqat tavsiya beradi. |
| 3 поп. `phone` | Shaxsiy raqam xavfsizligi · Aloqaga chiqish uchun raqamimni begonalarga berishga toʻgʻri keladi | Raqamingiz hammaning koʻz oʻngida turishi yoqmaydimi? | Telefon raqamingiz guruhlarda ochiq koʻrinishidan xavotirdamisiz? | Raqamingiz hech kimga koʻrinmaydi. Haydovchi bilan {brand} ichida yozishasiz. |
| 4 поп. `wait` | Vokzalda (pitakda) uzoq kutish · Mashina toʻlmaguncha soatlab kutishga toʻgʻri keladi | Pitakda soatlab kutish joningizga tegdimi? | Pitakda mashina toʻlishini soatlab kutishdan charchadingizmi? | Joyni oldindan band qilasiz. Haydovchi yoʻlga chiqish vaqtini oldindan yozadi. |
| 5 поп. `price` | Bayramlarda narxlar oshishi · Bayramoldi kunlarda yoʻl haqining asossiz qimmatlashishi | Bayramlarda narx oshib ketishi muammomi? | Bayram kunlari narxlar keskin oshib ketishidan norozimisiz? | Narx safar eʼlonida yoziladi. Band qilishdan oldin koʻrasiz. |
| 6 поп. `woman` | Ayollar uchun noqulaylik · Mashinada ayol kishi bor-yoʻqligini bilib boʻlmasligi | Mashinada ayollar borligini bilish muhimmi? | Mashinada ayollar bor-yoʻqligini oldindan bilish muhimmi? | «Mashinada ayol bor» belgili safarlarni tanlaysiz. |
| 1 вод. `chats` | Guruhlarda tartibsizlik · Yoʻlovchi yoki eʼlon yoʻqolib qoladi | Guruhda mijoz yoki eʼlon yoʻqolib qolyaptimi? | Guruhlarda xabarlar koʻpligidan mijozni yoʻqotib qoʻyyapsizmi? | Yoʻlovchilar soʻrovlari botga oʻzi keladi: qayerdan, qayerga, qachon. |
| 2 вод. `fixed` | Qatʼiy narxlar · Narxni oʻzim belgilay olmayman | Narxni oʻzingiz belgilay olmaslik muammomi? | Ilova qoʻygan narxni oʻzingiz oʻzgartira olmaslik noqulaymi? | Safar narxini oʻzingiz qoʻyasiz. {brand} faqat tavsiya beradi. |
| 3 вод. `phone` | Raqamim ochiqligi · Telefon raqamimni hamma koʻradi | Raqamingiz hamma uchun ochiq turishiga qarshimisiz? | Telefon raqamingiz guruhda hammaning koʻziga koʻrinishi yoqmaydimi? | Raqamingiz hech kimga koʻrinmaydi. Yoʻlovchi bilan {brand} ichida gaplashasiz. |
| 4 вод. `wait` | Pitakda kutish · Mijoz yigʻilishini soatlab kutaman | Mijoz kutib vaqt yoʻqotyapsizmi? | Pitakda mijoz yigʻilishini soatlab kutishdan charchadingizmi? | Safaringizni eʼlon qilasiz, yoʻlovchilar oʻzlari joy band qiladi. |
| 5 вод. `empty` | Pustoy (boʻsh) qaytish · Orqaga yoʻlovchisiz qaytaman | Orqaga boʻsh (pustoy) qaytyapsizmi? | Yoʻlning bir tomoniga boʻsh (pustoy) qaytishdan bezor boʻldingizmi? | Qaytish safarini oldindan eʼlon qilasiz va yoʻlovchilar uni ham band qiladi. |
| 6 вод. `woman` | Ayol yoʻlovchi tanlash · Avtomobilga ayol yoʻlovchi olish cheklovi | Ayol yoʻlovchilar borligini belgilash imkoni kerakmi? | Mashinangizda ayol yoʻlovchi bor-yoʻqligini koʻrsatish muhimmi? | Mashinada ayol boʻlsa, «Mashinada ayol bor» belgisini qoʻyasiz: ayol yoʻlovchilar sizni koʻradi. |
| 7 вод. `safety` | Xavfsizlik xavotiri · Yoʻlovchi va yoʻl xavfsizligi nomaʼlum | Yoʻlovchilar va yoʻl xavfsizligi xavotirga solyaptimi? | Yoʻldagi xavfsizlik va yoʻlovchilar ishonchliligi sizni tashvishlantiradimi? | Yoʻlovchining reytingi va sharhlarini oldindan koʻrasiz. Muammo boʻlsa, shikoyat qilasiz. |

## Бот

| Где | Текст |
|---|---|
| Описание до Start | Guruhlarda eʼlon koʻpligidan keraklisini topishga qiynalasizmi? Narxlar qatʼiy belgilangani va kelishib boʻlmasligi yoqmaydimi? Telefon raqamingiz guruhlarda ochiq koʻrinishidan xavotirdamisiz? {brand}: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. Tez orada ochiladi. Yoʻnalishingizni hozir yozib qoʻying: ochilganda birinchi boʻlib xabar beramiz. |
| Первое сообщение (видео 15 с) | Assalomu alaykum, {name}! 👋 · {brand}: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. · 🔎 Guruhlardan kerakli eʼlonni topish qiyinmi? · 💸 Narxni kelisha olmaslik xalaqit beryaptimi? · 🔒 Raqamingiz hammaning koʻz oʻngida turishi yoqmaydimi? · {brand} tez orada ochiladi va shularni hal qiladi. · цитата: 📝 Yoʻnalishingizni yozib qoʻying: 1 daqiqa, telefon raqami kerak emas |
| Кнопки | 🚀 Roʻyxatga yozilish · 📣 Kanal · меню «ilova» (есть); документы: команда `/documents` (есть) |
| Живая карточка | ⏳ Roʻyxatdasiz (водитель: · haydovchi) · {when} · tez orada ochiladi · 🛣 Toshkent shahri ↔ {region} · 👥 {count} kishi kutmoqda · 🚗 {drivers} haydovchi · Siz tanlagan: {pains} · ✏️ {time} da yangilandi · har dushanba yangilanadi |
| Карточка, кнопки | 👥 Doʻstimni chaqiraman · ✏️ Oʻzgartirish · 📣 Kanal · водитель сверху: 🚗 Haydovchi boʻlish |
| Закреп | 📌 Toshkent shahri ↔ {region} · roʻyxatdasiz / haydovchi / ochildi |
| Карточка открыта | ✅ Yoʻnalish ochildi · Bugun {n} ta safar · ertaga {m} ta (водитель: {count} yoʻlovchi kutmoqda) · 🔎 Safar topish · 🚗 Safar eʼlon qilish · 📣 Yoʻnalish kanali |
| Звонок при открытии | цитата Toshkent shahri ↔ {region} · 🔔 Yoʻnalishingiz ochildi: endi guruhlardan qidirmaysiz, hamma safarlar bir joyda. · водитель: 🔔 Yoʻnalishingiz ochildi: {count} yoʻlovchi safaringizni kutmoqda. Endi guruhlarda yoʻlovchi qidirmaysiz. |
| Приветствие, список закрыт | Assalomu alaykum, {name}! 👋 · {brand} ochildi: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. · 🔎 Safar toping va joyni oldindan band qiling. · 🚗 Mashinangiz boʻlsa, safar eʼlon qiling. · 🔎 Safar topish · 🚗 Safar eʼlon qilish · 📣 Kanal |
| Другу | Men ham guruhlarda kerakli eʼlonni qidirib charchadim. {brand} tez orada ochiladi: u yerda hamma safarlar bir joyda. Men yozildim: {route}. Siz ham yoziling: qancha koʻp odam yozilsa, haydovchi shuncha tez topiladi. · Roʻyxatga yozilish |

Строки «Endi … » и первая строка сообщения другу: по одной на каждую боль: 6 у попутчика и 7 у водителя (как в таблице болей).

## Mini App

| Где | Текст |
|---|---|
| Первый экран | {brand} · Manzil sari (есть) · Tez orada ochiladi · Yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. |
| Роль | Kim boʻlib yoʻlga chiqasiz? · Yoʻlovchiman · Safarga joy kerak · Haydovchiman · Mashinam bor, boʻsh joy bor · Javobni keyin oʻzgartirsa boʻladi. |
| Боли | Safar davomida qanday muammolarga duch kelgansiz? · (Bir yoki bir nechtasini tanlash mumkin) · Davom etish (есть) |
| Маршрут (`5-regions`) | Qaysi viloyatdansiz? · Yoʻnalishingizni shunga qarab tuzamiz: viloyatingiz ↔ Toshkent shahri. · Qaysi viloyatga qatnaysiz? · Toshkent shahridan qaysi viloyatga yurasiz? · Yoʻnalish · имена областей из справочника (есть) · группы на карте: Toshkent · Vodiy · Markaz · Janub · Gʻarb |
| Каналы (последний шаг) | Yoʻnalishingiz kanallari · Yangi safarlar va yangiliklar shu yerda. Keraklisiga qoʻshiling. · Asosiy kanal · {region} · Qoʻshilish · ✓ Aʼzosiz (есть) · Yangiliklar, ochilish kunlari · Davom etish (есть) |
| Когда | Qachon yoʻlga chiqasiz? · Har hafta · Har oy · Bayramlarda · Bir marta · водитель: Bu yoʻnalishda qanchalik tez-tez yurasiz? · Har kuni · Baʼzan |
| Результат | Siz roʻyxatdasiz · Yoʻnalishingiz ochilganda birinchi boʻlib xabar beramiz. · {count} kishi kutmoqda · Bu yoʻnalishda. {share} % ini ham {pain} qiynaydi. · водитель: {count} yoʻlovchi kutmoqda · Bu yoʻnalishda. Ochilganda safaringizni koʻradi. · {brand} buni hal qiladi |
| Кнопки | Doʻstimni chaqiraman · Haydovchi boʻlish (есть) |
| Строка каналов на результате | Kanallar · {n} ta kanaldasiz · Hali kanalga qoʻshilmagansiz |
| Шторки | Oʻzgartirish · Muammolar · Yoʻnalish · Qachon · Haydovchi sifatida ham yozilish · Mashinangiz boʻlsa |

## Админка

| Где | Текст |
|---|---|
| Блок | Kutayotganlar · {p} yoʻlovchi · {d} haydovchi · {n} yoʻnalish, eng koʻpi tepada · Eng koʻp ogʻriq: {pain} · Yoʻlovchilarning {share} % i tanlagan · Hammasi ({n}) |
| Направление | Roʻyxat {date}dan beri · Yoʻlovchilar · Yoʻlovchilarni nima qiynaydi · Haydovchilar · Ariza tasdiqlangan |
| Открытие | Yoʻnalishni ochish · Yoʻnalishni ochasizmi? · {p} yoʻlovchi va {d} haydovchiga bot xabar yuboradi. Xabar bir marta ketadi. · Ochish · Ochildi · {date} · Xabar ketdi: {n} kishiga |
| Воронки (`183`) | Roʻyxatga yozilish · Botni ochdi · Ilovani ochdi (есть) · Rolni tanladi · Roʻyxatda · Roʻyxat: yoʻlovchi · Roʻyxat: haydovchi · Rol · Muammolar · Yoʻnalish · Qachon · {drop}% ketdi (есть) |
| Рубильник (`181`) | Kutish roʻyxati · Roʻyxatga yozish · Ochiq: yangi odamlar roʻyxatga yoziladi · Yopiq · {time} dan: botda safar tugmalari · {n} ta havola · Roʻyxatni yopasizmi? · Yangi odamlar endi roʻyxatga yozilmaydi: botda «Safar topish» va «Safar eʼlon qilish» tugmalari chiqadi. · Kutayotgan {n} kishiga hozir xabar ketmaydi: har yoʻnalish ochilganda yozamiz. · Yopish · Roʻyxatni ochasizmi? · Yangi odamlar yana roʻyxatga yoziladi. · Ochish (есть) · Bekor qilish (есть) |
| Ссылки для рекламы (`184`) | Reklama havolalari · Har reklama uchun alohida havola: qaysi reklama nechta odam olib kelganini koʻrasiz. · Yangi havola · Havolalar · {n} bosdi · {n} yozildi · Oʻngda: bitta yozilgan odam qanchaga tushdi. Narx kiritilmagan boʻlsa, boʻsh. · Qayerga olib boradi · Bot · Kanal · Qayerda reklama · Telegram · Instagram · Bloger · Boshqa · Nomi · Statistikada shu nom koʻrinadi. · Narxi (shart emas) · Necha kun turadi · {n} kun · Doimiy · Tepada: boshqa post chiqmaydi · Yoʻq · {n} soat · Qadalgan (pin) · tepada {n} soat · qadalgan {n} soat · Havola yaratish · Qaysi kanalga? · Havola shu kanalga qoʻshilish havolasi boʻladi. · Asosiy kanal (есть) · Viloyat kanallari · botga · kanalga · Havola botga olib boradi. · Havola «{channel}» kanaliga olib boradi. Kim shu havola orqali qoʻshilganini koʻramiz. · Havola tayyor · Havolani reklama sotuvchisiga yuboring: u postdagi tugmaga yoki matnga qoʻysin. Rasm, video, matn: istalgan kontent boʻlishi mumkin. · Havolani nusxalash · Nima berdi · Bosdi · {p} yoʻlovchi · {d} haydovchi · {n} qoʻshildi · Kanalga qoʻshildi · Kanalda qoldi · {n}% chiqib ketdi · Roʻyxatga yozildi · Bitta obunachi · Shartlar va pul · Narxi · Bitta yozilgan odam · Keyin · Doʻst orqali yana yozildi · Shu reklamadan kelganlar chaqirdi |
| Блоки статистики (`183`) | Roʻyxatdan keyin · Kanalga qoʻshildi · Kanallar qadamida · Doʻstini chaqirdi · Havolani yubordi · Doʻst orqali yozildi · Bitta odam oʻrtacha {n} kishini olib keldi · Qayerdan kelishdi (есть) · {n} ochdi · {share} % yozildi · Doʻst havolasi · Haydovchi yetishmaydi · Qachon yozilishdi · Qurilmalar (есть) · Qanchalik tez-tez · Ham yoʻlovchi, ham haydovchi |

## Новые в коде (сверх таблиц выше)

| Где | Текст |
|---|---|
| Шторка «Oʻzgartirish» у водителя | Yoʻlovchi sifatida ham yozilish · Safarga joy kerak boʻlsa |
| Подписи карты | короткие имена областей: Toshkent, Fargʻona, Andijon, Namangan, Samarqand, Jizzax, Sirdaryo, Navoiy, Buxoro, Qashqadaryo, Surxondaryo, Xorazm, Qoraqalpogʻiston; Toshkent shahri |
| Журнал «Boshqaruv» | Roʻyxatga yozish ochildi · Roʻyxatga yozish yopildi · Yoʻnalish ochildi · Reklama havolasi yaratildi |

## Анонсы в каналах (первые 4)

Два раза в неделю, с 18.10.2026 (`181`). Только реальные новости; цифры берём в «Statistika» в день поста. Кнопка каждого поста: бот со знаком канала `?start=ch-<канал>` (`116`), например `t.me/myridauz_bot?start=ch-rida1uz`. Без «taksi», без «tekshirilgan haydovchi», без цен, бонусов и сравнения с другими.

| № · день | Текст | Кнопка |
|---|---|---|
| 1 · вс 18.10 | 📝 {brand} roʻyxati ochildi · {brand}: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. Tez orada ochiladi. · Yoʻnalishingizni hozir yozib qoʻying: ochilganda birinchi boʻlib xabar beramiz. 1 daqiqa, telefon raqami kerak emas. | 🚀 Roʻyxatga yozilish |
| 2 · ср 21.10 | 🔎 Guruhlarda eʼlon koʻpligidan keraklisini topishga qiynalasizmi? · 💸 Narxlar qatʼiy belgilangani va kelishib boʻlmasligi yoqmaydimi? · 🔒 Telefon raqamingiz guruhlarda ochiq koʻrinishidan xavotirdamisiz? · {brand} shularni hal qiladi: · Hamma safarlar bir roʻyxatda: qayerdan, qayerga va qachon boʻyicha darhol topasiz. · Narxni oʻzingiz taklif qilasiz. {brand} faqat tavsiya beradi. · Raqamingiz hech kimga koʻrinmaydi. Haydovchi bilan {brand} ichida yozishasiz. | 🚀 Roʻyxatga yozilish |
| 3 · вс 25.10 | 📊 Roʻyxatning birinchi haftasi · {p} yoʻlovchi va {d} haydovchi yoʻnalishini yozdi. · Eng koʻp kutilgan yoʻnalishlar: · 1. Toshkent shahri ↔ {region}: {n} kishi (три строки) · Yoʻnalish haydovchilar yetarli boʻlganda ochiladi. Doʻstingizni ham chaqiring: qancha koʻp odam yozilsa, haydovchi shuncha tez topiladi. | 🚀 Roʻyxatga yozilish |
| 4 · ср 28.10 | 🚗 Haydovchilar uchun · 🔁 Yoʻlning bir tomoniga boʻsh (pustoy) qaytishdan bezor boʻldingizmi? · ⏳ Pitakda mijoz yigʻilishini soatlab kutishdan charchadingizmi? · Safaringizni eʼlon qilasiz, yoʻlovchilar oʻzlari joy band qiladi. Qaytish safarini ham oldindan eʼlon qilasiz. · {region} yoʻnalishida {p} yoʻlovchi kutmoqda. Mashinangiz boʻlsa, yoziling: yoʻnalish ochilganda yoʻlovchilar safaringizni koʻradi. | 🚗 Haydovchi sifatida yozilish |

Пост 3 выходит, только если в списке уже есть люди: пустые цифры не публикуем. В посте 4 направление с самым большим числом попутчиков.

## Убрано

- По правилам рекламы: «Bu taksi emas», «Haydovchilar tekshirilgan», «Tekshiruvdan oʻtish» (документы водителя не проверяются), цены и бонусы.
- «Roʻyxatdan chiqish» и его шторка: решение владельца 14.10.2026.
- Шаг «{region}ning qaysi joyi?» и «Sizning joyingiz»: район в опроснике не спрашиваем (решение владельца 14.10.2026).
- Шторка «Qaysi kuni?» и «Kunini tanlaysiz»: точную дату в опроснике не спрашиваем (решение владельца 14.10.2026).
- По системе G68 (`122`): отдельные сообщения «Siz roʻyxatdasiz» и пост канала: их заменила живая карточка.

## Вопросы носителю

- «Yoʻlda sizni nima qiynaydi?»: звучит естественно?
- «pustoy» (русское слово) в болях водителя: оставить рядом с «boʻsh»?
- «Pitakda soatlab kutish joningizga tegdimi?»: у владельца было «jonizga», я исправил на «joningizga». Верно?
- «Tanish gaplarmi?» в приветствии: так говорят?
- Группы «Vodiy», «Markaz», «Janub», «Gʻarb»: так люди называют части страны?
- «Tepada: boshqa post chiqmaydi» и «Qadalgan (pin)»: так говорят продавцы рекламы в каналах?
