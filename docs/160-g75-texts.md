# 160. G75: новые тексты на согласие владельца

> **Кратко:** все новые тексты цели G75 (редизайн до конца, `goals/G75-redesign-rest.md`) в одном месте. Текст попадает сюда в тот день, когда он появился в коде. Тексты экранов приходят после выбора макетов (`goals/g75/`). Тексты админки: `161`. Согласие владельца по правилу `33`; проверка носителем по `25`. Пока согласия нет, строка помечена «ждёт».

## Боты команды

| Ключ | Где | Текст | Согласие |
|---|---|---|---|
| `bot.navbat.counts` | карточка «Navbat»: в очереди и обращения поддержки (`158` К) | было «{n} ariza · {n} shikoyat · {n} rasm», стало то же и « · {n} murojaat», если обращения есть | ждёт |
| `bot.navbat.case.support` | самое старое дело в «Navbat» | «{name} murojaati» | ждёт |
| `bot.diqqat.pair` | строка «Diqqat» владельца: одна пара 3 раза говорила о заявках и не забронировала (`129` правило 5) | «🤝 {driver} (ID {driverId}) va {passenger} (ID {passengerId}) {count} marta gaplashdi, lekin bron qilmadi» | ждёт |

## Заявка водителя (`158` К, `120`)

| Ключ | Где | Текст | Согласие |
|---|---|---|---|
| `moderation.requestChanges` | кнопка решения в админке | было «Tuzatishni soʻrash», стало «Tuzatish» (`120`, G67) | ждёт |
| `bot.driver.rejected` | бот водителя: «Rad etish» теперь окончательный | было «…Ilovada belgilangan joylarni tuzatib, qayta yuborishingiz mumkin.», стало «Arizangiz rad etildi.\n{reasons}\nSavolingiz boʻlsa, yordam xizmatiga yozing.» | ждёт |
| `drivers.status.rejected.hint` | экран «Ariza rad etildi» водителя, кнопка «Qoʻllab-quvvatlashga yozish» вместо «Tuzatish» | «Savolingiz boʻlsa, yordam xizmatiga yozing.» | ждёт |

## Дыры `158` (поведение)

| Ключ | Где | Текст | Согласие |
|---|---|---|---|
| `bot.offer.expired` | бот водителя: попутчик выбрал другого водителя, отменил заявку или её день прошёл (`158` Й), кнопка «Ochish» | «Yoʻlovchi soʻrovi yopildi, taklifingiz endi amal qilmaydi.» | ждёт |
| `bot.share.retimed` | бот близким попутчика и водителя: водитель сдвинул время (`158` И) | «Vaqt oʻzgardi: {name} {date}, {time} da yoʻlga chiqadi.» | ждёт |
| `errors.drivers.live_trips` | водитель меняет машину, пока есть поездка (`158` Ё, `124` Ё) | «Mashinani faol safarlar tugagach almashtirasiz.» | ждёт |
| `bot.rating.low` | бот роли человека: средняя оценка ниже порога, один раз (`158` З) | «Reytingingiz pasaydi: ⭐ {average}. Safarlarni qoidalarga koʻra oʻtkazing, shunda sizni koʻproq tanlashadi.» | ждёт |
| `bot.complaint.hidden` | бот роли человека: жалобы от {count} разных людей скрыли его из поиска (`158` З) | «Sizga {count} kishi shikoyat qildi. Jamoa koʻrib chiqquncha sizni qidiruvda koʻrsatmaymiz.» | ждёт |
| `account.profile.navigator` | «Profil» водителя, группа «Sozlamalar»: новая строка (`158` Ё); вид экрана тоже на согласие | «Navigator», под ним выбранный («Yandex», «Google», «Apple») или «Tanlang» | ждёт |
| `home.request.titleMany`, `home.request.count` | плитка попутчика при 2 или 3 открытых заявках (`158` Е) | «Soʻrovlarim»; под ней ближайшая и «{count} ta soʻrov» | ждёт |
| `bot.ask.noMoneyLeft` | бот водителя: «Qabul qilish» без денег на комиссию (`158` Г), кнопка «💳 Hamyonni ochish» | «Komissiya uchun hamyonda {amount} yetmaydi: hamyonni toʻldiring, keyin soʻrovni qabul qiling.» | ждёт |
| `wallet.kind.bonusMonth` | «Tarix» в «Hamyon» и кошелёк для команды: второй и третий бонус акции (`158` Г) | «{month}-oy bonusi»; первый остаётся «Boshlash bonusi» | ждёт |
| `bookings.why.seatCancelled` | плашка брони: водитель отменил одно место, поездка идёт (`158` А) | «Haydovchi joyingizni bekor qildi.» | ждёт |
| `bot.support.topUp` | бот поддержки: «Hisobni toʻldirish» водителя отправляет команде готовое обращение (`158` Г) | «Hamyonimni toʻldirmoqchiman.» | ждёт |
| `market.limit.title`, `market.limit.hint` | экран лимита поездок водителя (макет g75/1 А, телефон 3) | «Faol safarlar {count} ta»; «Yangi safar eʼlon qilish uchun bittasini bekor qiling yoki yakunlang.» | ждёт |

## Как читать

- `{driver}`, `{passenger}`: имена людей; `ID`: публичный номер, Telegram ID команда не видит (`65` A3).
- Звёздочка `*` на макетах `goals/g75/` значит то же: новый текст, ждёт согласия.
