# 96. G34: новые тексты на согласие владельца

> **Кратко:** тексты цели G34 (`goals/G34-driver-first-contact.md`) на узбекском, по `25`. В скобках `{…}` значения из конфига бренда или базы: бонус, бот поддержки, часы работы. Статус: ждут согласия владельца (`33`), потом проверка носителем.

## Бот водителя

| № | Где | Текст |
|---|---|---|
| T1 | Start, подпись к картинке | Assalomu alaykum! {brand}: yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi. Bu taksi emas.\n\nHaydovchi sifatida siz:\n🚗 Safarni bir daqiqada eʼlon qilasiz.\n👥 Yoʻlovchilar sizni oʻzi topadi, pitakda kutish shart emas.\n💰 Yoʻl xarajatingiz qaytadi.\n🎁 Boshlash uchun {bonus} bonus.\n\nRoʻyxatdan oʻtish uchun «Ochish» tugmasini bosing. |
| T2 | Start из бота попутчика, первая строка вместо «Assalomu alaykum!…» | Assalomu alaykum! Endi {brand} bilan haydovchi sifatida ham safar qiling. |
| T3 | Любой другой текст | Bu bot xabarlarga javob bermaydi. Savolingiz boʻlsa, @{supportBot} ga yozing. Ilovani ochish uchun «Ochish» tugmasini bosing. |
| T4 | Кнопка рядом с «Ochish» | Yordam |
| T5 | Заявка отправлена, днём | Arizangiz qabul qilindi. Jamoamiz uni 1 soat ichida tekshiradi va natijani shu yerga yozadi. |
| T6 | Заявка отправлена, ночью | Arizangiz qabul qilindi. Arizalarni har kuni soat {from} dan {to} gacha tekshiramiz, shuning uchun ertalab javob beramiz. |

## Mini App: регистрация (попутчик и водитель)

| № | Где | Текст |
|---|---|---|
| T7 | Приветствие водителя, польза 2 | Boshlash uchun {bonus} bonus. |
| T8 | Приветствие водителя, польза 3 | Yoʻlovchilar sizni oʻzi topadi. |
| T9 | Приветствие, строка согласия | «Davom etish» tugmasini bosib, siz ommaviy oferta, maxfiylik siyosati va shaxsga doir maʼlumotlarni qayta ishlash shartlariga rozilik bildirasiz. |
| T10 | Второй экран, заголовок | Siz haqingizda |
| T11 | Второй экран, подсказка | Ismingizni safar sheriklaringiz koʻradi. Jins «Mashinada ayol bor» belgisi uchun kerak. |
| T12 | Второй экран, под кнопкой | Raqamingiz hech kimga koʻrinmaydi. |

Подписи «Erkak», «Ayol», «Raqamni yuborish» остаются прежними, у пола появляются иконки.

## Mini App: заявка водителя

| № | Где | Текст |
|---|---|---|
| T13 | Карточка на главном | Arizani toʻldiring |
| T14 | Под карточкой | 3 qadam: mashina, rasmlar, yuborish. |
| T15 | Экран фото, заголовок | Rasmlar |
| T16 | Экран фото, подсказка | Yuzingizni old kamerada, mashinani kunduzi toʻliq koʻrinadigan qilib oling. |
| T17 | Ячейка фото лица | Yuzingiz |
| T18 | Экран после отправки, заголовок | Ariza yuborildi |
| T19 | Экран после отправки, текст | Jamoamiz 1 soat ichida tekshiradi va natijani botga yozadi. Arizalarni har kuni soat {from} dan {to} gacha tekshiramiz. |

## Админ-бот: ответ за 1 час

| № | Кому | Текст |
|---|---|---|
| T20 | Модератору заявки, 30 минут | ⏰ Ariza 30 daqiqadan beri kutmoqda: {name}. |
| T21 | Владельцу, 50 минут | ⚠️ Ariza 50 daqiqadan beri tekshirilmadi: {name}. Moderator: {moderator}. |

## Админка: реквизиты (только владелец)

| № | Где | Текст |
|---|---|---|
| T22 | Пункт меню | Kompaniya rekvizitlari |
| T23 | Поля | Kompaniya nomi · Shakli (masalan, MChJ) · STIR · Manzil · Elektron pochta |
| T24 | Ошибка STIR | STIR 9 ta raqamdan iborat. |
| T25 | Предпросмотр | Ofertada shunday koʻrinadi |
| T26 | После сохранения | Saqlandi. Hujjatlar {version} tahririga oʻtdi. |
| T27 | История | Oʻzgarishlar tarixi |
