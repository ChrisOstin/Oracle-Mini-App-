/**
 * TASKS DATA — данные заданий
 * Версия: 1.0.0
 */

const MORI_TASKS_DATA = {
    // Основные задания (50 штук)
    mainTasks: [
        // БЛОК 1: ЗНАКОМСТВО (1-5)
        { id: 1, title: 'Первые шаги', description: 'Написать 5 сообщений', type: 'messages', target: 5, reward: 120, rewardType: 'settings', rewardName: 'Настройки', unlocked: true, progress: 0, completed: false },
        { id: 2, title: 'Любопытный', description: 'Зайти в настройки', type: 'settings', target: 1, reward: 120, rewardType: 'theme1', rewardName: 'Тема: MORI Classic', unlocked: true, progress: 0, completed: false },
        { id: 3, title: 'Стильный', description: 'Сменить тему', type: 'theme', target: 1, reward: 120, rewardType: 'theme2', rewardName: 'Тема: MORI Night', unlocked: true, progress: 0, completed: false },
        { id: 4, title: 'Коллекционер', description: 'Сменить тему 3 раза', type: 'theme', target: 3, reward: 120, rewardType: 'theme3', rewardName: 'Тема: MORI Gold', unlocked: true, progress: 0, completed: false },
        { id: 5, title: 'Исследователь', description: 'Написать 10 сообщений', type: 'messages', target: 10, reward: 120, rewardType: 'calculator', rewardName: 'Калькулятор', unlocked: true, progress: 0, completed: false },

        // БЛОК 2: КАЛЬКУЛЯТОР (6-10)
        { id: 6, title: 'Считалочка', description: 'Сделать 5 расчётов', type: 'calculations', target: 5, reward: 200, rewardType: 'precision4', rewardName: 'Точность 4 знака', unlocked: false, progress: 0, completed: false },
        { id: 7, title: 'Финансист', description: 'Сделать 15 расчётов', type: 'calculations', target: 15, reward: 200, rewardType: 'currencyRub', rewardName: 'Валюта RUB', unlocked: false, progress: 0, completed: false },
        { id: 8, title: 'Инвестор', description: 'Сделать 30 расчётов', type: 'calculations', target: 30, reward: 200, rewardType: 'calcChart', rewardName: 'График в калькуляторе', unlocked: false, progress: 0, completed: false },
        { id: 9, title: 'Аналитик', description: 'Сделать 50 расчётов', type: 'calculations', target: 50, reward: 200, rewardType: 'calcHistory', rewardName: 'История расчётов', unlocked: false, progress: 0, completed: false },
        { id: 10, title: 'Математик', description: 'Сделать 100 расчётов', type: 'calculations', target: 100, reward: 200, rewardType: 'calcExport', rewardName: 'Экспорт расчётов', unlocked: false, progress: 0, completed: false },

        // БЛОК 3: БИБЛИОТЕКА (11-17)
        { id: 11, title: 'Читатель', description: 'Написать 20 сообщений', type: 'messages', target: 20, reward: 320, rewardType: 'library', rewardName: 'Библиотека', unlocked: false, progress: 0, completed: false },
        { id: 12, title: 'Книжный червь', description: 'Прочитать 5 страниц', type: 'pages', target: 5, reward: 320, rewardType: 'book1', rewardName: 'Книга: Самый богатый человек в Вавилоне', unlocked: false, progress: 0, completed: false },
        { id: 13, title: 'Библиофил', description: 'Прочитать 10 страниц', type: 'pages', target: 10, reward: 320, rewardType: 'book2', rewardName: 'Книга: Богатый папа, бедный папа', unlocked: false, progress: 0, completed: false },
        { id: 14, title: 'Эрудит', description: 'Прочитать 15 страниц', type: 'pages', target: 15, reward: 320, rewardType: 'book3', rewardName: 'Книга: Квадрат денежного потока', unlocked: false, progress: 0, completed: false },
        { id: 15, title: 'Профессор', description: 'Прочитать 20 страниц', type: 'pages', target: 20, reward: 320, rewardType: 'book4', rewardName: 'Книга: Учебник логики', unlocked: false, progress: 0, completed: false },
        { id: 16, title: 'Мудрец', description: 'Прочитать 30 страниц', type: 'pages', target: 30, reward: 320, rewardType: 'book5', rewardName: 'Книга: Ледяной человек', unlocked: false, progress: 0, completed: false },
        { id: 17, title: 'Хранитель знаний', description: 'Прочитать 50 страниц', type: 'pages', target: 50, reward: 320, rewardType: 'allBooks', rewardName: 'Все остальные книги', unlocked: false, progress: 0, completed: false },

        // БЛОК 4: MORI AI (18-22)
        { id: 18, title: 'Любознательный', description: 'Написать 30 сообщений', type: 'messages', target: 30, reward: 320, rewardType: 'ai', rewardName: 'MORI AI', unlocked: false, progress: 0, completed: false },
        { id: 19, title: 'Почемучка', description: 'Задать 5 вопросов AI', type: 'ai', target: 5, reward: 320, rewardType: 'aiHistory', rewardName: 'История диалога', unlocked: false, progress: 0, completed: false },
        { id: 20, title: 'Исследователь', description: 'Задать 15 вопросов AI', type: 'ai', target: 15, reward: 320, rewardType: 'aiVoice', rewardName: 'Голосовой ввод', unlocked: false, progress: 0, completed: false },
        { id: 21, title: 'Философ', description: 'Задать 30 вопросов AI', type: 'ai', target: 30, reward: 320, rewardType: 'aiSave', rewardName: 'Сохранение диалогов', unlocked: false, progress: 0, completed: false },
        { id: 22, title: 'Мудрец', description: 'Задать 50 вопросов AI', type: 'ai', target: 50, reward: 320, rewardType: 'aiModel', rewardName: 'Выбор модели', unlocked: false, progress: 0, completed: false },

        // БЛОК 5: ТЕМЫ (23-32)
        { id: 23, title: 'Ценитель чёрного', description: 'Сделать 10 расчётов', type: 'calculations', target: 10, reward: 120, rewardType: 'theme4', rewardName: 'Тема: MORI Shadow', unlocked: false, progress: 0, completed: false },
        { id: 24, title: 'Ценитель золота', description: 'Прочитать 10 страниц', type: 'pages', target: 10, reward: 120, rewardType: 'theme5', rewardName: 'Тема: MORI Neon', unlocked: false, progress: 0, completed: false },
        { id: 25, title: 'Ценитель неона', description: 'Задать 5 вопросов AI', type: 'ai', target: 5, reward: 120, rewardType: 'theme6', rewardName: 'Тема: MORI Vintage', unlocked: false, progress: 0, completed: false },
        { id: 26, title: 'Ценитель винтажа', description: 'Написать 20 сообщений', type: 'messages', target: 20, reward: 120, rewardType: 'theme7', rewardName: 'Тема: MORI Royal', unlocked: false, progress: 0, completed: false },
        { id: 27, title: 'Ценитель роскоши', description: 'Сделать 20 расчётов', type: 'calculations', target: 20, reward: 120, rewardType: 'theme8', rewardName: 'Тема: MORI Stealth', unlocked: false, progress: 0, completed: false },
        { id: 28, title: 'Ценитель минимализма', description: 'Прочитать 15 страниц', type: 'pages', target: 15, reward: 120, rewardType: 'theme9', rewardName: 'Тема: MORI Cyber', unlocked: false, progress: 0, completed: false },
        { id: 29, title: 'Ценитель киберпанка', description: 'Задать 10 вопросов AI', type: 'ai', target: 10, reward: 120, rewardType: 'theme10', rewardName: 'Тема: MORI Warm', unlocked: false, progress: 0, completed: false },
        { id: 30, title: 'Ценитель тепла', description: 'Написать 30 сообщений', type: 'messages', target: 30, reward: 120, rewardType: 'theme11', rewardName: 'Тема: Красная', unlocked: false, progress: 0, completed: false },
        { id: 31, title: 'Ценитель страсти', description: 'Сделать 30 расчётов', type: 'calculations', target: 30, reward: 120, rewardType: 'theme12', rewardName: 'Тема: Синяя', unlocked: false, progress: 0, completed: false },
        { id: 32, title: 'Ценитель спокойствия', description: 'Прочитать 20 страниц', type: 'pages', target: 20, reward: 120, rewardType: 'theme13', rewardName: 'Тема: Зелёная', unlocked: false, progress: 0, completed: false },

        // БЛОК 6: МУЗЫКА (33-37)
        { id: 33, title: 'Меломан', description: 'Написать 40 сообщений', type: 'messages', target: 40, reward: 320, rewardType: 'music', rewardName: 'Музыка', unlocked: false, progress: 0, completed: false },
        { id: 34, title: 'Слушатель', description: 'Послушать 5 треков', type: 'songs', target: 5, reward: 320, rewardType: 'playlists', rewardName: 'Плейлисты', unlocked: false, progress: 0, completed: false },
        { id: 35, title: 'Критик', description: 'Поставить лайк 10 трекам', type: 'likes', target: 10, reward: 320, rewardType: 'favorites', rewardName: 'Избранное', unlocked: false, progress: 0, completed: false },
        { id: 36, title: 'Коллекционер', description: 'Сохранить 20 треков', type: 'saves', target: 20, reward: 320, rewardType: 'familyPlaylist', rewardName: 'Семейный плейлист', unlocked: false, progress: 0, completed: false },
        { id: 37, title: 'Музыкальный гений', description: 'Создать свой плейлист', type: 'playlist', target: 1, reward: 320, rewardType: 'playlistExport', rewardName: 'Экспорт плейлиста', unlocked: false, progress: 0, completed: false },

        // БЛОК 7: АКТИВНОСТЬ (38-42)
        { id: 38, title: 'Популярный', description: 'Получить 10 реакций на сообщения', type: 'reactions', target: 10, reward: 320, rewardType: 'reactions', rewardName: 'Реакции в чате', unlocked: false, progress: 0, completed: false },
        { id: 39, title: 'Коллекционер', description: 'Открыть 5 тем оформления', type: 'themes', target: 5, reward: 320, rewardType: 'themeCollector', rewardName: 'Коллекция тем', unlocked: false, progress: 0, completed: false },
        { id: 40, title: 'Ценитель', description: 'Поставить 10 оценок книгам', type: 'ratings', target: 10, reward: 320, rewardType: 'ratings', rewardName: 'Оценки книг', unlocked: false, progress: 0, completed: false },
        { id: 41, title: 'Эстет', description: 'Сменить тему 10 раз', type: 'themeChanges', target: 10, reward: 320, rewardType: 'themeMaster', rewardName: 'Мастер тем', unlocked: false, progress: 0, completed: false },
        { id: 42, title: 'Блогер', description: 'Написать 100 сообщений', type: 'messages', target: 100, reward: 320, rewardType: 'blogger', rewardName: 'Статус "Блогер"', unlocked: false, progress: 0, completed: false },

        // БЛОК 8: СЕРИИ (43-46)
        { id: 43, title: 'Энергичный', description: 'Выполнить 10 ежедневных заданий', type: 'dailyTotal', target: 10, reward: 300, rewardType: 'dailyMaster', rewardName: '+1 энергия', unlocked: false, progress: 0, completed: false },
        { id: 44, title: 'Целеустремлённый', description: 'Достичь серии 7 дней', type: 'streak', target: 7, reward: 300, rewardType: 'streak7', rewardName: 'Бонус +50 опыта ежедневно', unlocked: false, progress: 0, completed: false },
        { id: 45, title: 'Настойчивый', description: 'Достичь серии 30 дней', type: 'streak', target: 30, reward: 300, rewardType: 'streak30', rewardName: 'Особая рамка', unlocked: false, progress: 0, completed: false },
        { id: 46, title: 'Легендарный', description: 'Достичь серии 100 дней', type: 'streak', target: 100, reward: 300, rewardType: 'streak100', rewardName: 'Эксклюзивная тема', unlocked: false, progress: 0, completed: false },

        // БЛОК 9: ФИНАЛ (47-50)
        { id: 47, title: 'Ценитель', description: 'Открыть 20 функций', type: 'features', target: 20, reward: 550, rewardType: 'achievements', rewardName: 'Раздел "Достижения"', unlocked: false, progress: 0, completed: false },
        { id: 48, title: 'Коллекционер', description: 'Открыть 30 функций', type: 'features', target: 30, reward: 550, rewardType: 'collectorBadge', rewardName: 'Бейдж "Коллекционер"', unlocked: false, progress: 0, completed: false },
        { id: 49, title: 'Ветеран', description: 'Заходить 30 дней подряд', type: 'streak', target: 30, reward: 550, rewardType: 'veteranFrame', rewardName: 'Рамка "Ветеран"', unlocked: false, progress: 0, completed: false },
        { id: 50, title: 'Легенда', description: 'Выполнить все 50 заданий', type: 'complete', target: 50, reward: 550, rewardType: 'legendRole', rewardName: 'Роль "Легенда" в чате', unlocked: false, progress: 0, completed: false }
    ],

    // Ежедневные задания (5 штук)
    dailyTasks: [
        { id: 'd1', title: 'Болтун', description: 'Написать 3 сообщения', type: 'messages', target: 3, reward: 15, energyCost: 1, completed: false, progress: 0, icon: '💬' },
        { id: 'd2', title: 'Читатель', description: 'Прочитать 2 страницы', type: 'pages', target: 2, reward: 10, energyCost: 1, completed: false, progress: 0, icon: '📖' },
        { id: 'd3', title: 'Счётчик', description: 'Сделать 2 расчёта', type: 'calculations', target: 2, reward: 10, energyCost: 1, completed: false, progress: 0, icon: '🧮' },
        { id: 'd4', title: 'Любопытный', description: 'Задать 1 вопрос AI', type: 'ai', target: 1, reward: 10, energyCost: 1, completed: false, progress: 0, icon: '🧠' },
        { id: 'd5', title: 'Гость', description: 'Зайти в приложение', type: 'login', target: 1, reward: 5, energyCost: 1, completed: false, progress: 0, icon: '🔐' }
    ],

    // Бонусы за серию
    streakBonuses: {
        7: { exp: 50, description: '7 дней подряд', icon: '🌱' },
        30: { exp: 200, description: '30 дней подряд', icon: '🌿' },
        90: { exp: 500, description: '90 дней подряд', icon: '🌳' },
        180: { exp: 1000, description: '180 дней подряд', icon: '🏆' },
        365: { exp: 2000, description: '365 дней подряд', icon: '👑' }
    },

    // Редкие аватары за задания
    rareAvatars: [
        { id: 'student', icon: '🍎', name: 'Ученик', condition: 'Выполнено 5 заданий', required: 5, type: 'tasksCompleted' },
        { id: 'reader', icon: '📚', name: 'Читатель', condition: 'Выполнено 15 заданий', required: 15, type: 'tasksCompleted' },
        { id: 'warrior', icon: '⚔️', name: 'Воин', condition: 'Выполнено 30 заданий', required: 30, type: 'tasksCompleted' },
        { id: 'king', icon: '👑', name: 'Король', condition: 'Выполнено 50 заданий', required: 50, type: 'tasksCompleted' },
        { id: 'moon', icon: '🌙', name: 'Лунатик', condition: 'Серия 7 дней', required: 7, type: 'streak' },
        { id: 'star', icon: '⭐', name: 'Звёздный', condition: 'Серия 30 дней', required: 30, type: 'streak' },
        { id: 'immortal', icon: '🔱', name: 'Бессмертный', condition: 'Серия 100 дней', required: 100, type: 'streak' },
        { id: 'wise', icon: '🦉', name: 'Мудрец', condition: 'Прочитать 100 страниц', required: 100, type: 'pagesRead' },
        { id: 'dragon', icon: '🐉', name: 'Дракон', condition: 'Прочитать 500 страниц', required: 500, type: 'pagesRead' },
        { id: 'talker', icon: '🗣️', name: 'Говорун', condition: 'Написать 100 сообщений', required: 100, type: 'messages' },
        { id: 'starChat', icon: '🎙️', name: 'Звезда чата', condition: 'Написать 500 сообщений', required: 500, type: 'messages' },
        { id: 'cyborg', icon: '🤖', name: 'Киборг', condition: 'Задать 50 вопросов AI', required: 50, type: 'aiQuestions' },
        { id: 'fox', icon: '🦊', name: 'Лис', condition: 'Пригласить 3 друзей', required: 3, type: 'referrals' },
        { id: 'legend', icon: '🔥', name: 'Легенда', condition: 'Достичь 20 уровня', required: 20, type: 'level' },
        { id: 'absolute', icon: '🏆', name: 'Абсолют', condition: 'Выполнить все 50 заданий', required: 50, type: 'allTasks' }
    ],

    // Маршруты для кнопки перехода
    taskRoutes: {
        messages: 'chat',
        pages: 'library',
        calculations: 'calculator',
        ai: 'ai-chat',
        login: 'profile',
        theme: 'profile',
        settings: 'profile',
        songs: 'music',
        likes: 'music',
        playlist: 'music',
        reactions: 'chat',
        ratings: 'library',
        streak: 'tasks'
    }
};

// Экспорт
window.MORI_TASKS_DATA = MORI_TASKS_DATA;
