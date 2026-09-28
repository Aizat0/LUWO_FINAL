# LUWO Frontend

Адаптивный frontend учебного кабинета, использующий API трёх микросервисов проекта.

## Запуск всего проекта

В корне проекта дважды нажмите `START_LUWO.bat`. Он запустит три backend-сервиса и frontend.

## Development content

Для повторного идемпотентного заполнения баз запустите `SEED_LUWO.bat`. Он создаёт связанный каталог обучения и задания, но не дублирует существующие seed-записи.

## Запуск

Из папки `frontend` запустите локальный сервер:

```powershell
python server.py
```

Затем откройте `http://127.0.0.1:5173`.

Сервер отдаёт frontend и проксирует запросы к backend:

- auth: `http://127.0.0.1:8001`
- education: `http://127.0.0.1:8002`
- assignments: `http://127.0.0.1:8003`

Без запущенного backend интерфейс покажет состояние ошибки. После успешного входа он загружает реальные профиль, учебную программу, прогресс, задания, вопросы, игровые результаты и достижения из API.

Development seed содержит программу по информатике: 11 этапов, 33 темы, 44 урока, 20 seed-заданий, 100 seed-вопросов и 16 достижений. Ручные данные пользователей при повторном seed не удаляются.

Маршруты frontend:

- `#login`, `#register` — авторизация и регистрация;
- `#home` — dashboard на основе прогресса и материалов;
- `#learning` — каталог Grade → Stage → Skill → Topic → Lesson;
- `#assignments` — задания Service 3;
- `#games` — шесть рабочих IT mini-games;
- `#game/{id}` — рабочий quiz с проверкой ответа через backend;
- `#progress`, `#achievements` — постоянный прогресс и награды;
- `#goals`, `#activity`, `#leaderboard` — цели, история и рейтинг;
- `#schedule`, `#projects`, `#notes`, `#saved`, `#my-group` — личное учебное пространство;
- `#notifications`, `#settings` — центр уведомлений и сохраняемые предпочтения;
- `#profile` — текущий пользователь service1.

Навигация автоматически меняется по реальной роли `student`, `teacher` или `admin`. Ограничения текущего API описаны в `BACKEND_LIMITATIONS.md`.

Service 2 хранит новые пользовательские сущности `StudentGoal`, `StudentProject`, `StudentNote`, `Bookmark`, `Notification` и `UserPreference`. Эти данные не исчезают после F5 или повторного входа.

Service 2 также хранит `ChatConversation`, `ChatParticipant` и `ChatMessage`. Чаты доступны ученикам и учителям через общий защищённый REST API.

Благодаря встроенному прокси изменять CORS в backend не требуется.
