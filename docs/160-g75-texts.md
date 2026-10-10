# 160. G75: новые тексты на согласие владельца

> **Кратко:** все новые тексты цели G75 (редизайн до конца, `goals/G75-redesign-rest.md`) в одном месте. Текст попадает сюда в тот день, когда он появился в коде. Тексты экранов приходят после выбора макетов (`goals/g75/`). Тексты админки: `161`. Согласие владельца по правилу `33`; проверка носителем по `25`. Пока согласия нет, строка помечена «ждёт». **10.10.2026 владелец согласился со всеми текстами, что были здесь на этот день.**

## Боты команды

| Ключ | Где | Текст | Согласие |
|---|---|---|---|
| `bot.navbat.counts` | карточка «Navbat»: в очереди и обращения поддержки (`158` К) | было «{n} ariza · {n} shikoyat · {n} rasm», стало то же и « · {n} murojaat», если обращения есть | да, 10.10.2026 |
| `bot.navbat.case.support` | самое старое дело в «Navbat» | «{name} murojaati» | да, 10.10.2026 |
| `bot.diqqat.pair` | строка «Diqqat» владельца: одна пара 3 раза говорила о заявках и не забронировала (`129` правило 5) | «🤝 {driver} (ID {driverId}) va {passenger} (ID {passengerId}) {count} marta gaplashdi, lekin bron qilmadi» | да, 10.10.2026 |

## Заявка водителя (`158` К, `120`)

| Ключ | Где | Текст | Согласие |
|---|---|---|---|
| `moderation.requestChanges` | кнопка решения в админке | было «Tuzatishni soʻrash», стало «Tuzatish» (`120`, G67) | да, 10.10.2026 |
| `bot.driver.rejected` | бот водителя: «Rad etish» теперь окончательный | было «…Ilovada belgilangan joylarni tuzatib, qayta yuborishingiz mumkin.», стало «Arizangiz rad etildi.\n{reasons}\nSavolingiz boʻlsa, yordam xizmatiga yozing.» | да, 10.10.2026 |
| `drivers.status.rejected.hint` | экран «Ariza rad etildi» водителя, кнопка «Qoʻllab-quvvatlashga yozish» вместо «Tuzatish» | «Savolingiz boʻlsa, yordam xizmatiga yozing.» | да, 10.10.2026 |

## Дыры `158` (поведение)

| Ключ | Где | Текст | Согласие |
|---|---|---|---|
| `bot.offer.expired` | бот водителя: попутчик выбрал другого водителя, отменил заявку или её день прошёл (`158` Й), кнопка «Ochish» | «Yoʻlovchi soʻrovi yopildi, taklifingiz endi amal qilmaydi.» | да, 10.10.2026 |
| `bot.share.retimed` | бот близким попутчика и водителя: водитель сдвинул время (`158` И) | «Vaqt oʻzgardi: {name} {date}, {time} da yoʻlga chiqadi.» | да, 10.10.2026 |
| `errors.drivers.live_trips` | водитель меняет машину, пока есть поездка (`158` Ё, `124` Ё) | «Mashinani faol safarlar tugagach almashtirasiz.» | да, 10.10.2026 |
| `bot.rating.low` | бот роли человека: средняя оценка ниже порога, один раз (`158` З) | «Reytingingiz pasaydi: ⭐ {average}. Safarlarni qoidalarga koʻra oʻtkazing, shunda sizni koʻproq tanlashadi.» | да, 10.10.2026 |
| `bot.complaint.hidden` | бот роли человека: жалобы от {count} разных людей скрыли его из поиска (`158` З) | «Sizga {count} kishi shikoyat qildi. Jamoa koʻrib chiqquncha sizni qidiruvda koʻrsatmaymiz.» | да, 10.10.2026 |
| `account.profile.navigator` | «Profil» водителя, группа «Sozlamalar»: новая строка (`158` Ё); вид экрана тоже на согласие | «Navigator», под ним выбранный («Yandex», «Google», «Apple») или «Tanlang» | да, 10.10.2026 |
| `home.request.titleMany`, `home.request.count` | плитка попутчика при 2 или 3 открытых заявках (`158` Е) | «Soʻrovlarim»; под ней ближайшая и «{count} ta soʻrov» | да, 10.10.2026 |
| `bot.ask.noMoneyLeft` | бот водителя: «Qabul qilish» без денег на комиссию (`158` Г), кнопка «💳 Hamyonni ochish» | «Komissiya uchun hamyonda {amount} yetmaydi: hamyonni toʻldiring, keyin soʻrovni qabul qiling.» | да, 10.10.2026 |
| `wallet.kind.bonusMonth` | «Tarix» в «Hamyon» и кошелёк для команды: второй и третий бонус акции (`158` Г) | «{month}-oy bonusi»; первый остаётся «Boshlash bonusi» | да, 10.10.2026 |
| `bookings.why.seatCancelled` | плашка брони: водитель отменил одно место, поездка идёт (`158` А) | «Haydovchi joyingizni bekor qildi.» | да, 10.10.2026 |
| `bot.support.topUp` | бот поддержки: «Hisobni toʻldirish» водителя отправляет команде готовое обращение (`158` Г) | «Hamyonimni toʻldirmoqchiman.» | да, 10.10.2026 |
| `market.limit.title`, `market.limit.hint` | экран лимита поездок водителя (макет g75/1 А, телефон 3) | «Faol safarlar {count} ta»; «Yangi safar eʼlon qilish uchun bittasini bekor qiling yoki yakunlang.» | да, 10.10.2026 |
| `market.mine.when`, `market.mine.car`, `market.mine.requestDay` | карточки «Mening safarlarim» попутчика (макет g75/2 А) | «{day} · {time}»; « · {model}, {color}»; «{day} · Soʻrov» | да, 10.10.2026 |
| `market.mine.expired`, `market.mine.again` | заявка с прошедшим днём в «Faol» (`158` Е) | «Muddati oʻtdi»; «Qayta yuborish» | да, 10.10.2026 |
| `market.mine.noLive`, `bookings.tab.liveNone` | пустая вкладка «Faol» попутчика, кнопка «Safar topish» | «Faol safar yoʻq»; вкладка «Faol» без числа | да, 10.10.2026 |
| `subscriptions.hint`, `subscriptions.withWoman` | «Obunalar»: строка под заголовком и пометка подписки | «Yangi safar chiqsa, botda xabar beramiz.»; « · ayol bilan» | да, 10.10.2026 |
| `market.mine.noPast` | пустая вкладка «Oʻtgan» попутчика, над «Obunalar» и «Sevimli haydovchilar» (`158` Е) | «Oʻtgan safar yoʻq» | ждёт |
| `legal.offer.9.text` | оферта, раздел 9: срок, после которого видна оценка (`158` З) | «… yoki 14 kundan keyin koʻrinadi» стало «… yoki {rateDays} kundan keyin koʻrinadi» (7 из конфига бренда), редакция 1.4 | да, 10.10.2026 (решение владельца) |
| `account.blocked.riding` | плашка над Mini App: человека заблокировали в пути, поездка идёт до конца (`158` Ж, `17`) | «Hisobingiz bloklangan. Joriy safarni yakunlang.» | ждёт |
| `market.when.done` | кнопка шторки «Qachon joʻnaysiz?» (макет g75/3 А, телефон 1) | «Tayyor» | ждёт |
| `market.day.other`, `market.day.otherHint` | третья плитка дня в шторке времени | «Boshqa»; под ней «kun» | ждёт |
| `subscriptions.when.dayHint`, `subscriptions.when.hint` | шторка «Xabar bering»: строка под «Faqat {day}» и подсказка с маршрутом | «Shu kungi safarlar»; «{way}. {question}» | ждёт |
| `common.counter` | счётчик знаков под «Izoh» | «{count} / {max}» | ждёт |
| `wallet.short.for`, `wallet.short.commission`, `wallet.short.missing`, `wallet.short.note` | шторка «Hamyonda mablagʻ yetarli emas» (макет g75/4 Б, `158` Г) | «{name}ning joyini tasdiqlash uchun»; «Komissiya · {count} joy»; «Yetmaydi»; «Yordamga tayyor xabar boradi: faqat yuboring.» | ждёт |
| `wallet.short.message` | готовый текст в чат поддержки по «Hisobni toʻldirish» | «Salom! Hamyonimni toʻldirmoqchiman. {name}ning joyini tasdiqlash uchun {amount} yetmayapti.» | ждёт |
| `driverTrip.request.until`, `driverTrip.request.when`, `driverTrip.request.pickup`, `driverTrip.request.dropoff` | шторка «Yangi soʻrov» поверх «Mening safarim» (макет g75/4 Б, телефон 1) | «Javob berish muddati · {when}»; «{seats} joy · {day}, {time}»; «{time} · olib ketish joyi»; «tushirish joyi» | ждёт |
| `bookings.offer.sent`, `bookings.offer.when` | шторка предложения водителя поверх «Mening soʻrovim» (макет g75/4 Б, телефон 2) | «{name} taklif yubordi»; «Joʻnash vaqti» | ждёт |
| `account.delete.hint`, `account.delete.what.profile`, `account.delete.what.data`, `account.delete.what.trips`, `account.delete.cancel` | «Maʼlumotlaringiz oʻchirilsinmi?» (макет g75/5 А): строка под заголовком и три строки «что удалится» | «Buni qaytarib boʻlmaydi.»; «Ism, telefon va rasm»; «Chatlar va mashina maʼlumotlari»; «Faol safarlar va band qilingan joylar bekor boʻladi»; «Bekor qilish» | ждёт |
| `account.delete.bonus`, `account.delete.money` | там же: деньги водителя уходят вместе с аккаунтом (`158` Ж, `58`) | «Hamyonda {sum} bonus bor. U ham oʻchadi va qaytmaydi.»; если есть и свои деньги: «Hamyonda {sum} bor. U ham oʻchadi va qaytmaydi.» | ждёт |
| `complaints.reasonTitle` | «Shikoyat»: строка под заголовком (макет g75/5 А) | «Nima boʻldi?» стало «Nima boʻldi? Bir nechtasini tanlash mumkin.»; «Batafsil» убран | ждёт |
| `account.profile.lookPhone`, `account.profile.stats.rated` | «Meni qanday koʻradi» (макет g75/5 А) | «Telefon raqamingiz hech kimga koʻrinmaydi.»; под числом оценок «baho» | ждёт |
| `places.which`, `places.trips` | «Samarqandning qaysi joyi?» (макет g75/6 А): заголовок списка мест области и строка под местом | «{region}ning qaysi joyi?»; «{count} ta safar» | ждёт |
| `way.trip.pitakSeen`, `way.trip.pitakNone`, `way.trip.pitakThis` | шторка пятака над картой при публикации (макет g75/6 А) | «Yoʻlovchilar shu pitakni koʻradi.»; «Pitaksiz: faqat uyidan»; «Shu pitakdan» | ждёт |
| `way.map.navigatorKept` | шторка «Qaysi navigatorda ochamiz?» (макет g75/6 А) | «Tanlov eslab qolinadi. «Sozlamalar»da oʻzgartirasiz.» | ждёт |
| `market.request.why.expired`, `market.request.why.cancelled` | общая плашка исхода на «Mening soʻrovim» (`158` А) | «Shu kunga haydovchi topilmadi.»; «Siz soʻrovni bekor qildingiz.» | ждёт |
| `requests.salon.commission` | шторка «Butun salon»: комиссия до отправки (`158` Г) | «Komissiya · {sum}» в строке «Hamyon» | ждёт |
| `account.avatar.rejectedTitle` | плашка на главном: фото не прошло проверку (`158` Ж) | «Rasmingiz qabul qilinmadi»; под ним прежний текст с причиной | ждёт |
| `account.notes.warned`, `account.notes.warnedHint`, `account.notes.hidden`, `account.notes.low` | плашки в «Profil» (`158` З) | «Ogohlantirish · {date}» «Jamoa shikoyat boʻyicha ogohlantirdi. Yana takrorlansa, hisob bloklanadi.»; «Hozir qidiruvda koʻrinmaysiz: shikoyatlar tekshirilmoqda.»; «Reytingingiz {average}: {line} dan past. Vaqtida keling va xushmuomala boʻling.» | ждёт |

## Как читать

- `{driver}`, `{passenger}`: имена людей; `ID`: публичный номер, Telegram ID команда не видит (`65` A3).
- Звёздочка `*` на макетах `goals/g75/` значит то же: новый текст, ждёт согласия.
