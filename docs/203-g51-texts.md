# 203. G51: новые тексты фото попутчика на согласие владельца

> **Кратко:** два новых текста G51: фото попутчика по желанию (решение владельца 19.10.2026). Ключи в `packages/i18n/locales/uz-Latn/account.json`. Ждут согласия владельца и проверки носителем (`25`, OPS-07). Снимки: `screenshots/stand/g51/` (стенд, `e2e/stand/g51-photo.spec.ts`).

| Где | Текст | Ключ |
|---|---|---|
| Регистрация попутчика, подпись под кругом фото | Rasm (ixtiyoriy) | `account.avatar.optional` |
| Профиль попутчика без фото, ссылка | Rasm qoʻshish (ixtiyoriy) | `account.avatar.addOptional` |

## Что не меняется

- Водитель: «Rasm qoʻshish», «Rasmingizni qoʻshing», «Rasm tekshirilmoqda. Hozircha uni faqat siz koʻrasiz.» как раньше.
- Отказ: «Rasm tekshiruvdan oʻtmadi: {причина}. Yangi rasm qoʻying.» и сообщение бота с причиной (G58).
- «Rasm tekshirilmoqda…» у попутчика больше не показывается: его фото видно сразу.
