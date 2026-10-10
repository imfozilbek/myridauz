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

## Как читать

- `{driver}`, `{passenger}`: имена людей; `ID`: публичный номер, Telegram ID команда не видит (`65` A3).
- Звёздочка `*` на макетах `goals/g75/` значит то же: новый текст, ждёт согласия.
