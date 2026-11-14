# 236. G96: новые тексты на согласие владельца

> **Кратко:** один новый текст отказа для водителя и попутчика: место маршрута не найдено (`locations.not_found`, G96). Раньше человек видел общий «Birozdan keyin qayta urinib koʻring», а в «Statistika» был виден голый код. Пишем латиницей (`uz-Latn`), люди видят кириллицу (`228`). Ключ: `errors.json`. Проверяет носитель (`25`).

| Ключ | Текст | Где виден |
|---|---|---|
| `errors.locations.not_found` | Bu yoʻnalish topilmadi. Tuman yoki shaharni qaytadan tanlang. | Отказ при публикации поездки и при цене маршрута; строка в «Statistika → Rad etilgan amallar» |

## Статус

- Ждёт «да» владельца (`33`).
