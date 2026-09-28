# Ограничения текущего backend LUWO

Frontend использует только существующие endpoints. Следующие функции нельзя завершить без изменений backend.

## Student learning path

Read-only доступ к Grade, Stage, Skill, Topic и Lesson добавлен для авторизованных учеников. Изменение этих сущностей по-прежнему ограничено Teacher/Admin permissions.

List serializers дополнены родительскими ID, поэтому frontend может строить последовательную цепочку Grade → Stage → Skill → Topic → Lesson без фиктивных связей.

## Progress and results

Service 2 теперь сохраняет LessonProgress, StudentProgress, AssignmentResult, GameResult, UserAchievement и LearningActivity. Результаты переживают refresh, logout и повторный login.

## Chats

Чаты добавлены в Service 2: разговоры, участники, сообщения, unread/read state сохраняются в SQLite. Доступ к истории проверяется по участникам разговора, а Student и Teacher могут создавать разговоры только внутри доступных им групп. Текущая версия обновляет открытый разговор коротким REST polling; WebSocket и вложения пока отсутствуют и поэтому соответствующие fake-кнопки не показываются.

Service 3 по-прежнему отвечает только за содержимое и проверку отдельных ответов. Связь Assignment с конкретным Lesson/Topic в его схеме отсутствует, поэтому frontend не создаёт искусственную связь.

## Отсутствующие модули

Backend не содержит моделей и endpoints для личных сообщений, загрузки avatar и отдельной сущности Schedule/Deadline для Assignment. Расписание поэтому честно строится только по реальным deadline учебных целей; фиктивные даты заданий не создаются.

Goals, Projects, Notes, Bookmarks, Notifications, Preferences, Leaderboard и student group view добавлены в Education Service и сохраняются в SQLite.

## Безопасность

Публичная регистрация всегда создаёт роль `student`, даже если клиент передаст другое значение. Список, создание, изменение и удаление пользователей в `/user/` защищены ролью `admin`; просмотр отдельного профиля требует авторизации.

## Assignment management

Service 3 поддерживает создание Assignment, Question и Answers A/B/C/D, но не содержит endpoints изменения и удаления этих документов. Поэтому Teacher UI показывает только реально доступные операции создания и не выводит неработающие Edit/Delete controls.
