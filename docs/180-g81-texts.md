# 180. G81: тексты списка ожидания на согласие владельца

> **Кратко:** все тексты нового бота «MyRida» (`@myridauz_bot`), опросника, экрана результата и блока команды по макетам `goals/g81` (`179`). Знак «есть» значит: текст уже есть в продукте, берём тот же ключ. Остальное новое: нужно «да» владельца и проверка носителем (`25`). Имя бренда в текстах из конфига бренда (`{brand}`), не в коде.

## Бот

| Где | Текст | Смысл |
|---|---|---|
| Описание до Start | Rida: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. Bu taksi emas. Rida tez orada ochiladi. Yoʻnalishingizni hozir yozib qoʻying: ochilganda birinchi boʻlib sizga xabar beramiz. | Что это и что делать сейчас |
| Приветствие | Assalomu alaykum, {name} 👋 Rida tez orada ochiladi. Yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. Bu taksi emas. Yoʻnalishingizni yozib qoʻying: ochilganda birinchi boʻlib sizga xabar beramiz. | Приветствие и просьба |
| Приветствие, строка | ⏱ 1 daqiqa · telefon raqami kerak emas | Быстро, без телефона |
| Кнопки | Roʻyxatga yozilish · Kanalimiz | Записаться · Наш канал |
| Меню | ilova (есть) | Открыть приложение |
| Итог | ✅ Siz roʻyxatdasiz · {route} · Yoʻlovchi · har hafta · Yoʻnalishingiz ochilganda birinchi boʻlib xabar beramiz. | Вы в списке |
| Итог водителя | Hozir tekshiruvdan oʻting: yoʻnalish ochilganda birinchilardan boʻlib safar eʼlon qilasiz. | Пройдите проверку сейчас |
| Кнопки итога | Tekshiruvdan oʻtish · Doʻstimni chaqiraman · Oʻzgartirish (есть) | Проверка · Позвать друга · Изменить |
| Пост канала | 📣 Kutayotganda kanalimizni kuzating · MyRida Oʻzbekistan: yangiliklar va qaysi yoʻnalish qachon ochilishi. | Наш канал, пока ждёте |
| Кнопка поста | Kanalga oʻtish | Перейти в канал |
| Открытие, попутчик | 🔔 Yoʻnalishingiz ochildi · {route}: haydovchilar safar eʼlon qilmoqda. · Birinchilardan boʻlib joy band qiling. | Направление открыто |
| Открытие, водитель | 🔔 Yoʻnalishingiz ochildi · {route}: {count} yoʻlovchi kutmoqda. · Safaringizni eʼlon qiling. | Вас ждут попутчики |
| Кнопки открытия | Safar topish (есть) · Safar eʼlon qilish (есть) | |
| Другу | Men Ridaga yozildim: {route}. Yoʻli bir odamlar birga boradi va yoʻl xarajatini boʻlishadi. Siz ham yoziling: qancha koʻp odam yozilsa, haydovchi shuncha tez topiladi. | От первого лица (`123`) |

## Mini App: опросник

| Где | Текст | Смысл |
|---|---|---|
| Первый экран | Manzil sari (есть) · Tez orada ochiladi · Yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. Bu taksi emas. | Слоган, скоро, что это |
| Вопрос | Kim boʻlib yoʻlga chiqasiz? | Кем вы поедете? |
| Плитки | Yoʻlovchiman · Safarga joy kerak · Haydovchiman · Mashinam bor, boʻsh joy bor | Роль и пояснение |
| Под плитками | Javobni keyin oʻzgartirsa boʻladi. | Можно изменить потом |
| Откуда | Qayerdan yoʻlga chiqasiz? (есть) · Viloyat, tuman yoki shahar (есть) | |
| Куда | Qayerga borasiz? (есть) · метка Qayerdan (есть) | |
| Место | {region}ning qaysi joyi? (есть) | |
| Когда, попутчик | Qachon yoʻlga chiqasiz? · Har hafta · Har oy · Bayramlarda · Bir marta · Kunini tanlaysiz | Как часто едете |
| Когда, водитель | Bu yoʻnalishda qanchalik tez-tez yurasiz? · Har kuni · Har hafta · Har oy · Baʼzan | Как часто ездите |
| День | Qaysi kuni? (есть) · Oktabr. Kun oʻtib ketsa, bot yana soʻraydi. | Если день прошёл, бот спросит снова |

## Mini App: результат

| Где | Текст | Смысл |
|---|---|---|
| Верх | Siz roʻyxatdasiz · Yoʻnalishingiz ochilganda birinchi boʻlib xabar beramiz. | Вы в списке |
| «Bir marta» | Bir marta: {date}, {weekday} | Один раз: день |
| Счётчик, попутчик | Bu yoʻnalishda {count} kishi kutmoqda · Qancha koʻp odam yozilsa, haydovchi shuncha tez topiladi. | Только при N от 10 |
| Счётчик, водитель | Bu yoʻnalishda {count} yoʻlovchi kutmoqda · Yoʻnalish ochilganda ular safaringizni koʻradi. | |
| Ценность, попутчик | Nima uchun Rida (есть) · три строки регистрации (есть) | |
| Ценность, водитель | Yoʻlovchilar sizni oʻzi topadi: pitakda kutmaysiz. · Qaytish safariga ham yoʻlovchi topasiz. · Raqamingiz hech kimga koʻrinmaydi. (есть) | |
| Кнопки | Doʻstimni chaqiraman · Kanalga qoʻshilish · Tekshiruvdan oʻtish | |
| Шторка | Oʻzgartirish · Yoʻnalish · Qayerdan va qayerga · Qachon · Haydovchi sifatida ham yozilish · Mashinangiz boʻlsa · Roʻyxatdan chiqish | |
| Выход | Roʻyxatdan chiqasizmi? · Yoʻnalishingiz va javoblaringiz oʻchiriladi. Yoʻnalish ochilganda xabar kelmaydi. · Roʻyxatdan chiqish · Bekor qilish (есть) | |

## Админка

| Где | Текст |
|---|---|
| Блок | Kutayotganlar · {p} yoʻlovchi · {d} haydovchi · {n} yoʻnalish, eng koʻpi tepada · Hammasi ({n}) |
| Направление | Roʻyxat {date}dan beri · Yoʻlovchilar · Haydovchilar · Tekshiruvdan oʻtgan · Qayerdan kelishdi · Kanal · Doʻst taklifi · Guruh va reklama |
| Открытие | Yoʻnalishni ochish · Yoʻnalishni ochasizmi? · {p} yoʻlovchi va {d} haydovchiga bot xabar yuboradi. Xabar bir marta ketadi. · Ochish · Ochildi · {date} · Xabar ketdi: {n} kishiga |

## Вопросы носителю

- «Roʻyxatga yozilish» или короче «Yozilish»?
- «Kim boʻlib yoʻlga chiqasiz?»: звучит естественно?
- «Qachon yoʻlga chiqasiz?» для частоты или лучше «Qanchalik tez-tez yoʻlga chiqasiz?» как у водителя?
