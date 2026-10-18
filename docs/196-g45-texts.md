# 196. G45: новые тексты инструментов команды на согласие владельца

> **Кратко:** все новые тексты G45 (`111`): что слышат люди и водитель, когда поездку отменила команда; копия поддержки; новые экраны админки («Sharhlar», «Odamlar», отмена поездки, жалоба, «Masofa», «Cheklovlar», «Statistika»). Ключи в `packages/i18n/locales/uz-Latn/`. Ждут согласия владельца и проверки носителем (`25`). Снимки: `screenshots/stand/g45/` (стенд, `e2e/stand/g45-screens.spec.ts`).

## Люди и водитель (боты)

| Кто | Когда | Текст |
|---|---|---|
| Попутчик | Команда отменила поездку | ❌ Safarni jamoa bekor qildi. Boshqa safar bor. |
| Водитель | Команда отменила его поездку | ❌ Jamoa safaringizni bekor qildi. Sabab: {причина} |

## Команда в ботах

| Где | Текст |
|---|---|
| «Diqqat» владельца: пара снова и снова отменяет | 🔁 {водитель} (ID {id}) va {попутчик} (ID {id}) bir oyda {N} marta joyni tasdiqlab, bekor qilishdi |
| Копия вопроса поддержки, строка под именем | ID {публичный номер} |
| Копия поддержки, кнопка (только у владельца) | 👤 Profilni ochish |

## Админка

| Экран | Тексты |
|---|---|
| «Boshqaruv», строка | Sharhlar · Barcha baholar va sharhlar, yangilari tepada |
| «Sharhlar» | строка «⭐ {звёзды} · {автор} → {о ком}»; под ней дата и текст или «Matnsiz», скрытый: «Yashirilgan»; пусто: «Hali sharh yoʻq» |
| Шторка отзыва | «Sharh profildan va reytingdan olinadi», кнопка «Yashirish» |
| «Odamlar», новые блоки | «Tasdiqdan keyin bekor qilgan»: «Haydovchi sifatida», «Yoʻlovchi sifatida»; «Soʻnggi safarlari»; «Soʻnggi bronlari»; «Unga soʻnggi shikoyatlar» |
| Статус жалобы | Yangi · Koʻrilmoqda · Hal qilindi |
| Поездка, строка и шторка | «Safarni bekor qilish»; «Sababni haydovchi oʻqiydi. Yoʻlovchilarga safarni jamoa bekor qilgani aytiladi, komissiya qaytadi.»; поле «Sabab»; кнопка «Bekor qilish» |
| Вопрос перед отменой | Safar bekor qilinsinmi? Buni qaytarib boʻlmaydi. |
| «Jurnal» | Safarni bekor qildi |
| «Diqqat» в админке | {N} juft tasdiqlab, bekor qildi |
| Жалоба, новые строки | «{N} safar · {N} shikoyat» у обеих сторон; «Avvalgi shikoyatlar: {имя}»; решения: Buzilish yoʻq · Ogohlantirildi · Bloklandi · Kutmoqda |
| «Yoʻnalish narxi», блок «Masofa» | «{N} km», нет: «Masofa yoʻq»; «Yoʻl boʻyicha. Oʻzgarsa, formula narxi ham oʻzgaradi.»; поле «Masofa, km»; история «{было} km → {стало} km» |
| «Cheklovlar», история в шторке | «{было} → {стало}», под ней дата и имя |
| «Statistika» под числами | «↑ {N}», «↓ {N}», «±0»; ниже «↑ ↓ oldingi 24 soatga nisbatan» или «↑ ↓ oldingi 7 kunga nisbatan» |

## «Cheklovlar»: что меняет каждая настройка и зачем

Текст стоит под названием в шторке настройки, над значением; ниже значения границы («1 soat … 72 soat»).

| Настройка | Текст |
|---|---|
| Komissiya | Haydovchi har bir tasdiqlangan joy uchun toʻlaydigan ulush. Rida shu pul bilan ishlaydi. |
| Bir joy uchun eng kam komissiya | Arzon safarda ham bir joy komissiyasi shu summadan kam boʻlmaydi. |
| Aksiya summasi | Yangi haydovchiga beriladigan bonus. Birinchi safarlarda komissiyani toʻlaydi. |
| Aksiya necha marta beriladi | Bonus bitta haydovchiga necha marta beriladi. |
| Aksiya necha kun amal qiladi | Har bir bonus necha kun amal qiladi. Keyin qolgani tugaydi. |
| Aksiya davri | Haydovchi tasdiqlangandan keyin necha kun ichida bonus oladi. |
| Safar boshlanishiga eng kam vaqt | Safar eʼlon qilingandan yoʻlga chiqishgacha eng kam vaqt. Odamlar joy band qilishga ulgursin. |
| Vaqtni surish chegarasi | Haydovchi safar vaqtini shuncha daqiqagacha keyinga sura oladi. |
| Uchrashuv qachon boshlanadi | Yoʻlga chiqishdan shuncha daqiqa oldin uchrashuv kartasi chiqadi. |
| Oʻzi yoʻlga chiqqan deb belgilash | Haydovchi «Yoʻlga chiqdim»ni bosmasa, shuncha soatdan keyin safar oʻzi yoʻlga chiqqan boʻladi. |
| Bronga javob berish muddati | Haydovchi bronga shu vaqt ichida javob beradi. Javob boʻlmasa, bron yopiladi va yoʻlovchi boshqa safar topadi. |
| Bir soʻrovdagi joylar | Yoʻlovchi bitta soʻrovda nechta joy soʻray oladi. |
| Pul kam: necha joydan kam | Hamyondagi pul shuncha joy komissiyasidan kam boʻlsa, haydovchiga «Pul kam» deyiladi. |
| Safardan keyin chat | Safar tugagach chat va qoʻngʻiroq shuncha soat ochiq. Keyin chatni faqat oʻqish mumkin. |
| Obunalar soni | Bitta odam nechta yoʻnalishga obuna boʻla oladi. |
| Istalgan kunga obuna muddati | «Istalgan kun» obunasi necha kun amal qiladi. |
| Safarni kuzatadigan yaqinlar | Bitta safarni nechta yaqin kishi kuzata oladi. |
| Sevimli haydovchilar | Yoʻlovchi nechta haydovchini sevimlilarga qoʻsha oladi. |
| Baholash muddati | Safardan keyin necha kun ichida baho qoʻyish mumkin. |
| Yashirin baho muddati | Sharh ikkala tomon baholaganda yoki shuncha kundan keyin chiqadi. Shunda hech kim javoban yomon baho qoʻymaydi. |
| Baholash eslatmasi | Baho qoʻymagan odamga shuncha soatdan keyin bir marta eslatiladi. |
| Reyting koʻrinishi uchun baholar | Baholar shundan kam boʻlsa, reyting oʻrniga «Yangi» yoziladi. |
| Past reyting chegarasi | Oʻrtacha baho shundan past boʻlsa, jamoaga xabar boradi. |
| Past reyting uchun baholar | Past reyting haqida xabar shuncha bahodan keyin boradi. Bir ikki baho bilan hukm qilinmaydi. |
| Shikoyat qilish muddati | Safardan keyin necha kun ichida shikoyat qilish mumkin. Keyin faqat «Yordam» orqali. |
| Qidiruvdan yashirish uchun shikoyatlar | Shuncha turli odam shikoyat qilsa, safarlari qarorgacha qidiruvdan yashiriladi. |
| Shikoyatlar hisoblanadigan davr | Qidiruvdan yashirish uchun shikoyatlar shuncha kun ichida sanaladi. |
| Soʻrovga qoʻngʻiroqlar | Bron boʻlguncha soʻrov boʻyicha nechta qoʻngʻiroq qilish mumkin. Odamlar bezovta boʻlmasin. |
| Jamoa ishining boshlanishi | Jamoa shu soatdan ishlaydi. Undan oldin xabarlar ovozsiz keladi. |
| Jamoa ishining tugashi | Jamoa shu soatgacha ishlaydi. Keyin xabarlar ovozsiz keladi. |
| Moderatorga eslatma | Ish shuncha daqiqa kutsa, moderatorga eslatma boradi. |
| Egaga xabar | Ish shuncha daqiqa kutsa, egaga xabar boradi va «Navbat»da qizil boʻladi. |
