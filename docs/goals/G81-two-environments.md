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
[x] CI: deploy-internal, потом deploy-production (Approve);
    «Map data» с выбором среды.
[x] Документы: 179, 46, 45, 32, 22, 10, 27, INDEX.

B. Шаги владельца (docs/179, «Шаги запуска прода» 1 … 6)
[ ] GitHub Environments internal и production с секретами.
[ ] R2 на новом аккаунте; переменные новой сессии Claude.
[ ] @myrida_poster_bot админ в двух внутренних каналах.

C. Новый аккаунт (Claude)
[ ] Номер канала «MyRida | Viloyatlar» в environments.ts.
[ ] Полный стенд один раз; PR; CI и CodeQL зелёные; слияние.
[ ] deploy-internal и deploy-production зелёные: стек на ridaone.uz.
[ ] Секреты Worker прода; новый секрет вебхука в обеих средах;
    setup-bots обеих сред.
[ ] «Map data» для прода; права бота каналов в 67 каналах.
[ ] Проверка: /health, 5 ботов каждой среды, Mini App, карта,
    сайт, пост во внутреннем канале; скриншоты владельцу.
[ ] Проверка владельца.
```
