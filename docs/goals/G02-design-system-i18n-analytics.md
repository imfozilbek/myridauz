# G02. Дизайн-система, i18n, аналитика

> **Кратко:** Фундамент интерфейса: обёртка TelegramUI и Lucide с цветами Rida, родные элементы Telegram, ключи перевода на узбекском, сбор событий аналитики.

```text
ЦЕЛЬ G02: Дизайн-система, i18n, сбор аналитики
Ветка: goal/g02-design-i18n от свежего main (docs/34).

Зависит от: G01.
Контекст: docs/19-design-system-and-ux.md, docs/20-brand.md,
docs/21-native-feel.md, docs/13-i18n.md, docs/25-uzbek-language-guide.md,
docs/29-product-analytics.md.

Сделать:
1. packages/ui: обёртки над @telegram-apps/telegram-ui (Button, List,
   Section, Cell, Input, Modal и др.) и lucide-react (Icon по смыслу:
   icon('trip'), icon('chat') ...). Проверить, что библиотеки живые;
   если нет, запасной вариант из docs/19.
2. Тема бренда: HEX только в brands/rida/theme.ts (белый, бирюзовый, янтарный),
   переопределение CSS-переменных TelegramUI, AppRoot appearance="light".
   Радиусы и отступы TelegramUI не трогать.
3. Telegram SDK (@telegram-apps/sdk-react): обёртки MainButton,
   SecondaryButton, BackButton, showConfirm, HapticFeedback,
   setHeaderColor/setBackgroundColor/setBottomBarColor в белый,
   closing confirmation, safe area, отключение zoom и выделения текста.
4. Скелетоны загрузки, пустое состояние, экран ошибки (общие компоненты).
5. packages/i18n: t() с ICU MessageFormat, namespaces uz-Latn
   (common, errors и др.), генерация типов ключей из эталона,
   форматтеры суммы (150 000 soʻm), даты (27-sentabr), времени (14:30),
   config enabled_locales, скрытый переключатель языка.
   Символы oʻ gʻ через U+02BB, тутук через U+02BC.
6. Аналитика: схема событий в packages/contracts, клиент в
   packages/api-client (пакетная отправка), приём в backend
   (запись в Analytics Engine через интерфейс; локально фейк).
7. Все три Mini App используют ui, i18n и аналитику на стартовом экране.
8. Логотип по docs/36: монограмма «R» в шрифте, который выбрал
   владелец (вопрос 41). SVG-мастер (контур), скрипт генерирует только
   файлы из таблицы docs/36 в brands/rida/assets.

Проверка владельцем (docs/33; ждать ответа только по этим пунктам,
остальное делать дальше):
1. Скриншоты стартовых экранов 3 Mini App: цвета бренда, светлая тема, ощущение «как Telegram».
2. Узбекские тексты стартовых экранов.
3. Логотип во всех формах и сочетаниях (docs/36).

Definition of Done:
[ ] Ни одного текста в коде, только ключи перевода (проверка в CI).
[ ] Ни одного HEX и прямого импорта UI-библиотек вне packages/ui.
[ ] Тесты: форматтеры, t() с plural, клиент аналитики, тема.
[ ] Стартовые экраны 3 Mini App открываются локально в светлой теме,
    с бирюзовой главной кнопкой Telegram (скриншоты приложены).
[ ] Узбекские тексты стартовых экранов проверены по docs/25.
[ ] Все барьеры G01 зелёные, docs и docs/goals/INDEX.md обновлены.
[ ] Скриншоты результата показаны владельцу (docs/33).
[ ] Ветка слита в main без конфликтов (squash), CI на main зелёный.
[ ] Владелец подтвердил все пункты «Проверка владельцем».

Не останавливаться, пока все пункты DoD не выполнены.
```
