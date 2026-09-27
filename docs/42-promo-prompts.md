# 42. Промпты для рекламных видео Rida

> **Кратко:** Два промпта. Первый: задача владельца, собранная как промпт для Claude. По нему делаем любой новый ролик Rida. Второй: промпт для ИИ-генераторов видео (Veo, Sora, Kling, Runway). Он на английском, потому что эти сервисы лучше понимают английский. Текст на экране всегда узбекский.

## 1. Задача владельца как промпт (для Claude)

```text
Роль: креативный директор и моушн-дизайнер Rida.

Цель: одно рекламное видео. Человек смотрит и сразу понимает, что делает Rida,
чем помогает, почему это удобно. После просмотра он хочет попробовать.

Зрители: попутчик без машины; водитель, который часто ездит между регионами;
любой, кто едет в другой регион.

Продукт: Rida (myrida.uz). Совместные поездки между регионами Узбекистана
с делением расходов на дорогу. Не такси: водитель и так едет.
Всё внутри Telegram: бот, Mini App, 13 региональных каналов.

Шаги:
1. Подумай глубоко: для кого продукт, какую боль решает, насколько удобен,
   в чём прорыв на рынке (docs/40).
2. Изучи, как устроена реклама совместных поездок (docs/41).
3. Возьми материалы бренда (docs/38) и открытые источники с понятной лицензией.
4. Музыка: трек владельца. Длина видео равна длине трека. Монтаж по фразам трека.
5. Сделай сценарий: боль, решение, путь попутчика, путь водителя, доверие,
   вся страна, Telegram, логотип и призыв.
6. Собери видео генератором в репозитории. Покажи кадры владельцу.

Правила:
- Текст только на узбекском (латиница), oʻ и gʻ через U+02BB, глоссарий docs/25.
- Без длинных тире. Без слова «такси». Не обещать заработок.
- Не сравнивать с конкурентами. Цифры только из документов.
- Только светлые цвета бренда: белый, бирюзовый, янтарный.
- Обещать только то, что входит в запуск (docs/27).

Результат: MP4 9:16, 1080 × 1920, генератор в репозитории, все тексты в одном
файле для проверки носителем, скриншоты кадров владельцу.
Используй свои возможности на максимум.
```

## 2. Промпт для ИИ-генератора видео

- Сервисы делают клипы по 5…20 с. Поэтому промпт разбит на кадры:
  каждый кадр генерируем отдельно, потом монтируем под музыку.
- ИИ плохо пишет узбекский текст. Текст накладываем при монтаже из
  `brands/rida/brand-kit/promo/copy.json`, а не просим сервис его нарисовать.

```text
Brand film for "Rida", a carpooling service for trips between regions of
Uzbekistan that works inside Telegram. Not a taxi: drivers already travel
and share fuel costs with passengers. Vertical 9:16, 30 fps.

Style: clean, bright, optimistic. Light backgrounds only. Brand colors:
white #FFFFFF, turquoise #0D9488, deep turquoise #115E59, mint #CCFBF1,
amber #F59E0B. Flat rounded icons. Soft ease-out motion, gentle overshoot
when elements appear. A dashed road line with a turquoise start dot and an
amber finish dot is the brand motif. Leave empty space for captions in the
middle of the frame. No text inside the generated video.

Shots (one clip each, cut on the beat):
1. Early morning at an intercity car stand in Tashkent. People wait with bags,
   looking at their watches. Muted colors. (pain: waiting)
2. Close-up of a phone with a chaotic group chat full of phone numbers. (pain)
3. A clean white screen; a turquoise rounded square tile with a white letter R
   pops in the center. (brand)
4. A friendly driver in his own white sedan on a sunny highway between
   Tashkent and Samarkand, three empty seats next to him. (driver goes anyway)
5. Hands holding a phone with a light Telegram-style app: a list of trips
   with times, prices and star ratings. A thumb taps the first trip. (booking)
6. Two women passengers sit together in the back seat, relaxed and smiling;
   warm daylight. (safety, "Mashinada ayol bor")
7. A stylized map of Uzbekistan in mint; turquoise route lines draw from
   Tashkent to all regions. (the whole country)
8. The car arrives at a family house in a regional town; relatives meet the
   passenger at the gate. (emotion: loved ones waiting)
9. Turquoise background; the R tile, the word "Rida" and an amber line below. (end)

Avoid: taxi signs, checkered patterns, meters, dark theme, competitor logos,
real license plates, readable phone numbers, money or earnings imagery.
```

## Как пользоваться

1. Промпт 1: даём Claude для нового ролика или нарезки (`41`).
2. Промпт 2: для сервисов ИИ-видео. Готовые клипы монтируем под музыку,
   тексты берём из `copy.json`.
3. Любой ролик перед публикацией: проверка текстов и вида владельцем (`33`),
   лицензия на музыку (`41`).
