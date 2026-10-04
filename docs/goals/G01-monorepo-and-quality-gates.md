# G01. Монорепозиторий и барьеры качества

> **Кратко:** Каркас проекта, все барьеры качества и безопасный CI для PR. Без деплоя.

```text
ЦЕЛЬ G01: Монорепозиторий и барьеры качества
Ветка: goal/g01-monorepo. Сначала создать main от текущей ветки
с документами (разрешено владельцем, docs/34), затем ветку цели от main.

Контекст: CLAUDE.md, docs/11-code-architecture.md, docs/22-multi-brand.md,
docs/31-testing-and-quality-gates.md, docs/32-ci-security.md.

Сделать:
1. pnpm workspaces. Пакеты @platform/*: contracts, ui, api-client, i18n,
   config (общие tsconfig strict, eslint, prettier).
2. apps/backend: Cloudflare Worker на Hono, слои modules/<m>/{domain,
   application,infrastructure,http}, пример модуля health с тестами.
3. apps/miniapp-passenger, miniapp-driver, miniapp-admin: React + Vite,
   структура FSD (app, pages, widgets, features, entities, shared),
   один стартовый экран в каждом.
4. brands/rida/brand.config.ts (имя, домен, слоган «Manzil sari»,
   модель commission) и загрузчик конфига бренда.
5. ESLint: max-lines 150 (error), границы модулей и слоёв FSD,
   запрет any, HEX только в brands/<brand>/theme.ts, слово «Rida» только
   в brands/ и docs/,
   запрет прямого импорта UI-библиотек вне packages/ui.
6. tsc strict + noUnusedLocals + noUnusedParameters. knip. Prettier.
7. Vitest во всех пакетах, покрытие с порогами (domain/application 90%).
8. GitHub Actions: workflow для pull_request и push без секретов,
   permissions: contents: read, actions закреплены по SHA.
   Шаги: format, lint, typecheck, knip, test, coverage, gitleaks.
9. CodeQL, Dependabot. .gitignore и .env.example уже есть.
10. Проверка отсутствия длинных тире «—», «–» в коде и docs (скрипт в CI;
    исключение: строки, где сам запрет описан).
11. Playwright + Chromium с подменой окружения Telegram (mock):
    один smoke-тест стартового экрана и скрипт скриншотов (docs/33).

Не делать: деплой, Cloudflare ресурсы, реальные фичи, лендинг.

Проверка владельцем (docs/33; ждать ответа только по этим пунктам,
остальное делать дальше):
1. Сделать main веткой по умолчанию в настройках GitHub.
2. Включить в настройках GitHub: защиту ветки main (только PR, CI зелёный, без force push), secret scanning и push protection, одобрение первых запусков CI от новых участников. Claude даёт точные шаги.

Definition of Done:
[x] pnpm install и pnpm check (все барьеры) проходят локально.
[x] CI зелёный на ветке.
[x] Каждый барьер проверен: намеренное нарушение (файл 151 строка,
    any, HEX, «Rida» в коде, неиспользуемый экспорт, тире) роняет CI;
    после проверки нарушение удалено.
[x] Ни одного файла больше 150 строк, ни одной неиспользуемой строки.
[x] docs обновлены (что изменилось), docs/goals/INDEX.md: G01 выполнена.
[x] Коммиты запушены.
[x] Скриншоты результата показаны владельцу (docs/33).
[x] Ветка слита в main без конфликтов (squash), CI на main зелёный.
[x] Владелец подтвердил все пункты «Проверка владельцем».

Не останавливаться, пока все пункты DoD не выполнены.
```
