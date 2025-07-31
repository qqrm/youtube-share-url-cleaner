# YouTube Share URL Cleaner

Расширение для Chrome и Firefox, которое автоматически удаляет параметр `si` из ссылки при нажатии кнопки "Поделиться" на YouTube.

## Установка

1. https://chromewebstore.google.com/detail/youtube-share-url-cleaner/gifcjmpeahfoijlbjbeocggnhplkdjcc
2. https://addons.mozilla.org/firefox/addon/youtube-share-url-cleaner/

или

1. Склонируйте репозиторий.
2. Откройте `chrome://extensions/`.
3. Включите режим разработчика.
4. Нажмите "Загрузить распакованное расширение" и выберите папку проекта.

## Пример

До:

[https://youtu.be/dQw4w9WgXcQ?si=S0meSh1t](https://youtu.be/dQw4w9WgXcQ?si=S0meSh1t)

После:

[https://youtu.be/dQw4w9WgXcQ](https://youtu.be/dQw4w9WgXcQ)

## CI

Проверки GitHub Actions выполняются только для pull request-ов от пользователя
`QQRM`. Для запросов от других аккаунтов workflow сразу завершается без
выполнения задач и помечается как неуспешный.
