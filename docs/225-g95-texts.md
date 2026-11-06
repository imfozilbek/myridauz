# 225. G95: новые тексты исправлений команды

> **Кратко:** тексты цели G95 (команда исправляет свои решения по заявкам водителей, `224`). Десять текстов были на листе макета `goals/g95/1-team-fixes.png`: «да» владельца 06.11.2026 («Да по макету»). Три текста не были на листе: «да» владельца 06.11.2026. Все ждут проверки носителем (`25`, OPS-07).

## Согласованы на макете (06.11.2026)

| Где | Текст | Ключ |
|---|---|---|
| Строка и экран | Mening qarorlarim | `moderation.mine.title` |
| Строка и экран, под заголовком | Oxirgi {days} kun | `moderation.mine.hint` |
| Кнопка в деле | Tuzatishga qaytarish | `moderation.sendBack` |
| Главная кнопка дела, заголовок | Mashinani tuzatish | `moderation.fixCar` |
| Подсказка под заголовком | Rasmdagi mashinaga qarab tuzating | `moderation.fixCar.hint` |
| Главная кнопка после правки | Saqlash | `moderation.fixCar.save` |
| Главная кнопка отказа (владелец) | Rad etishni bekor qilish | `moderation.reopen` |
| Вопрос Telegram | Rad etishni bekor qilasizmi? Ariza yana navbatga tushadi. | `moderation.reopenAsk` |
| Бот водителю | Mashina maʼlumotlari rasm boʻyicha tuzatildi: {car} | `bot.driver.carFixed` |
| Бот водителю | Arizangiz yana koʻrib chiqiladi. Javobni shu yerga yozamiz. | `bot.driver.reopened` |

- `{car}` в боте: «Chevrolet Cobalt, oq, 01 A 777 BC».

## Новые, согласованы владельцем (06.11.2026)

| Где | Текст | Ключ |
|---|---|---|
| «Mening qarorlarim» пустой | Oxirgi {days} kunda qaror yoʻq | `moderation.mine.empty` |
| «Jurnal»: правка машины | Mashina tuzatildi | `manage.entry.carFixed` |
| «Jurnal»: отмена отказа | Rad etish bekor qilindi | `manage.entry.reopened` |

- В «Jurnal» после «Mashina tuzatildi» номер «было → стало»: «Mashina tuzatildi · 01 A 123 BC → 01 A 777 BC». Если номер тот же (исправили модель или цвет), только «Mashina tuzatildi».

## Старые тексты в новом месте

| Где | Текст |
|---|---|
| «Tuzatishga qaytarish»: причины | те же, что у «Tuzatish» (`drivers.reason.*`) |
| «Tuzatishga qaytarish»: бот водителю | «Arizangizda tuzatish kerak: …» (`bot.driver.changesRequested`) |
| Причина отказа в «Oldingi qarorlar» | `drivers.reason.*` под строкой «Rad etilgan» |
