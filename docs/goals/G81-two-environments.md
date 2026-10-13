# G81. Две среды: внутренняя команды и прод на новом аккаунте

> **Кратко:** решение владельца 13.10.2026: первый аккаунт Cloudflare и `myrida.uz` становятся внутренней средой команды, новый аккаунт и `ridaone.uz` становятся продом с 67 каналами и `@rida1uz`. Подробно: `../179`. Оценка около 11 часов.

```text
G81. Две среды: внутренняя и прод
(docs/179; решение владельца 13.10.2026)

Ветка goal/g81-two-environments.

Definition of Done

A. Код и CI
[x] brands/rida/environments.ts: адрес, indexed, боты, каналы,
    главный канал каждой среды; loadBrand(id, среда), прод без
    среды; тесты.
[x] Worker ENVIRONMENT, Mini App и сайт VITE_ENVIRONMENT.
[x] Сайт внутренней среды закрыт для поисковиков; тест.
[x] deploy, setup-bots, map-data: --env обязателен; деплой пишет
    wrangler.<среда>.toml и сам создаёт D1, очередь, R2; тесты.
[x] CI: deploy-internal; «Map data» для internal. Прод в CI
    вернётся с новым аккаунтом (решение владельца 13.10, вечер).
[x] Документы: 179, 46, 45, 32, 22, 10, 27, INDEX.

B. Внутренняя среда (docs/179, «Шаги: сначала внутренняя среда»)
[ ] Владелец: GitHub Environment internal с секретами первого
    аккаунта; @myrida_poster_bot админ в «MyRida | Viloyatlar»;
    INTERNAL_POSTER_BOT_TOKEN в окружении Claude.
[ ] Claude: номер и ссылка канала в environments.ts.
[ ] Полный стенд один раз; PR; CI и CodeQL зелёные; слияние.
[ ] deploy-internal зелёный; POSTER_BOT_TOKEN и новый секрет
    вебхука в Worker; setup-bots --env=internal (боты «MyRida | …»).
[ ] Проверка: /health, 5 ботов, Mini App, сайт, пост во внутреннем
    канале; скриншоты владельцу.

C. Прод на новом аккаунте (docs/179, «Шаги прода»)
[ ] Владелец: R2, Environment production с новым аккаунтом,
    переменные PROD_*, Telegram ID команды.
[ ] Claude: вернуть deploy-production и прод в «Map data»; PR;
    слияние; деплой прода с Approve: стек на ridaone.uz.
[ ] Секреты Worker прода; новый секрет вебхука; setup-bots прода;
    «Map data» прода; права бота каналов в 67 каналах.
[ ] Проверка: /health, 5 ботов, Mini App, карта, сайт; скриншоты.
[ ] Проверка владельца.
```
