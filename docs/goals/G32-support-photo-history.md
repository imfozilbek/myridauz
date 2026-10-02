# G32. Поддержка: рисунок и история обращений

> **Кратко:** цель владельца 02.10.2026. Ветка `goal/g32-support-photo-history`. Человек отправляет в поддержку фото. Кто бы ни ответил на второе обращение, он видит первое: кнопка «Tarix». Переписка хранится 90 дней. Устройство: `../93`.

## Решения владельца (02.10.2026)

| Вопрос | Решение |
|---|---|
| Как показать прошлые обращения | Вся история по кнопке «Tarix» |
| Сколько хранить переписку | 90 дней |

## Definition of Done

- Человек отправляет фото (с подписью и без), команда видит его в копии.
- Команда отвечает фото, человек получает его от бота поддержки с «Operator N».
- Под вторым и следующими обращениями есть «Tarix», под первым нет.
- «Tarix» показывает всю переписку за 90 дней; старше удаляет Cron.
- Удаление аккаунта стирает переписку.
- Тексты и политика конфиденциальности согласованы владельцем.
- Стенд зелёный 3 прогона подряд, без e2e рядом (урок 86). CI зелёный.
- PR, слияние владельцем, деплой, проверка владельцем.

## Тексты для носителя (согласованы владельцем 02.10.2026)

| Ключ | Текст |
|---|---|
| `bot.support.photo` | 🖼 Rasm |
| `bot.support.photoAnswer` | Operator {operator}: rasm |
| `bot.support.operator` | Operator {operator} |
| `bot.support.history` (кнопка) | Tarix |
| `bot.support.historyTitle` | {name} (ID {id}): murojaatlar tarixi |
| `bot.support.historyEmpty` | Oldingi yozishmalar yoʻq. |
| `bot.support.replyPrompt` | Javobingizni yozing: matn, rasm yoki ovozli xabar. |
| `bot.support.textOnly` | Hozircha faqat matn, rasm yoki ovozli xabar qabul qilinadi. |

## Политика конфиденциальности (согласована владельцем 02.10.2026)

- Раздел 2: «• Yordam xizmatiga yozgan xabarlaringiz.»
- Раздел 5: «Yordam xizmatiga yuborilgan rasm va ovozli xabarlarni biz saqlamaymiz, ular faqat Telegram orqali yuboriladi.»
- Раздел 6: «Yordam xizmati bilan yozishmalar 90 kun saqlanadi.» и «• yordam xizmati bilan yozishmalar oʻchiriladi;»
