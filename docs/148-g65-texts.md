# 148. G65: новые тексты на согласие владельца

> **Кратко:** тексты пути 8 (`118`): «Hamyon», подробности комиссии, «Profil» обеих ролей, экран «Kanallar» (`119`). Тексты с макетов `goals/g65/` и `goals/g59/7-channels-*` одобрены вместе с макетами и идут в код точно как на макете. Новые тексты ниже (макета нет): **ждут согласия владельца** (`33`). Проверка носителем (`25`) остаётся.

## С макетов (одобрены вместе с макетами)

| Экран | Тексты |
|---|---|
| «Hamyon» (g65/1) | «Hisobingizda», «{сумма} soʻm», «≈ {n} joyga yetadi», «≈ {n} joyga yetadi · toʻldiring», «Bonus», «Asosiy», «{дата}gacha», «soʻm», «Har tasdiqlangan joy uchun komissiya: joy narxining 10%. Avval bonusdan olinadi.», «Hisobni toʻldirish», «Tarix», «Komissiya · {имя}, {n} joy», «{день} · bonusdan», «Boshlash bonusi» |
| Подробности комиссии (g65/2) | «Komissiya», «{дата}, {время}», «Safar», «{имя} · {n} joy», «Hisob», «Joy narxi», «Joylar», «Yoʻlovchi toʻlaydi», «Komissiya 10%», «Qaysi hisobdan», «Komissiya joyni tasdiqlaganingizda olinadi. Bron bekor boʻlsa, hamyoningizga qaytadi.», «Safarni ochish» |
| «Profil» (g65/3) | «{роль} · Rida bilan {n} oy», «Rasmni almashtirish», «Yoʻlovchilar meni qanday koʻradi ›», «Haydovchilar meni qanday koʻradi ›», «{n} baho», «safar», «vaqtida», «Mashinam», «{модель}, {цвет}», «Baholarim», «{n} izoh», «Safarlar tarixi», «Sozlamalar», «Bot xabarlari», «Doim yoqilgan: bron, chat, safar xabarlari», «Telefon», «{номер} · faqat siz koʻrasiz», «Yordam», «Hujjatlar», «Oferta, maxfiylik», «Maʼlumotlarimni oʻchirish» |
| Строка «Kanallar» (7-channels-2, 3) | «Kanallar», «{n} ta kanaldasiz» |
| Экран «Kanallar» (7-channels-2, 3) | «Har bir kanalda shu joydagi yangi safarlar», «Safarlaringiz shu kanallarda chiqadi», «Viloyat yoki shahar», «Siz uchun», «Barcha kanallar», «Rida \| {зона}», «Qoʻshilish», «✓ Aʼzosiz», «Koʻp borasiz», «Soʻrovingiz shu yerga», «Oxirgi qidiruv», «Koʻp yurasiz», «Soʻrovlar koʻp», «Oxirgi safaringiz» |

## Новые (ждут согласия, макета нет)

| # | Где | Текст |
|---|---|---|
| 1 | «Tarix»: комиссия снята с основного счёта (на макете только с бонуса) | {день} · asosiy hisobdan |
| 2 | «Tarix»: возврат за брон (в DoD: «возврат „Qaytarildi“ тоже открывается») | Qaytarildi · {имя}, {n} joy |
| 3 | Заголовок подробностей возврата | Qaytarildi |
| 4 | Строка подробностей возврата: куда вернулись деньги | Qaysi hisobga |
| 5 | Экран «meni qanday koʻradi» водителя (заголовок) | Yoʻlovchilar sizni shunday koʻradi |
| 6 | Экран «meni qanday koʻradi» попутчика (заголовок) | Haydovchilar sizni shunday koʻradi |
| 7 | «Kanallar»: поиск ничего не нашёл | Bunday kanal topilmadi |

## Убраны (экраны нарисованы заново)

| Ключ | Текст | Почему |
|---|---|---|
| `comfort.history.hint` | подпись старой ячейки «Safarlar tarixi» | на g65/3 строка без подписи |
| `account.avatar.rules` | правила фото под старым профилем | на g65/3 их нет; правила остаются при съёмке фото |
| `account.profile.rating`, `account.profile.phoneHint` | старые ячейки «Reyting» и «Telefon» | заменены тремя цифрами и строкой «… · faqat siz koʻrasiz» |

## Решения без вопроса (как на макете или по docs)

- «Hamyon» открывается плиткой на главном экране водителя (путь 8 и путь 9 `118`): на g65/3 строки «Hamyon» нет. Подпись плитки: «≈ N joyga yetadi», меньше 5 мест: «… · toʻldiring» и красная иконка.
- «Siz uchun»: не больше 3 каналов; причина первая подходящая; только каналы, которые уже созданы (`63`, OPS-02).
- Месяцы «bilan N oy»: от дня регистрации, не меньше 1.
