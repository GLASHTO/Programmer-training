import apiClient from '../api/client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('token');

    // Проверка авторизации
    if (!token || !userId) {
        window.location.href = '/index.html';
        return;
    }

    // Элементы
    const elUsername = document.getElementById('username');
    const elScore = document.getElementById('score');
    const elTeam = document.getElementById('teamName');
    const elTasks = document.getElementById('solvedTasks');
    const btnLogout = document.getElementById('logoutBtn');

    // Выход
    btnLogout.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/index.html';
    });

    // Загрузка данных с нового эндпоинта
    try {
        const response = await apiClient.get(`/api/v1/users/users/${userId}/profile`);
        const user = response.data;
        
        // Отображение данных
        elUsername.textContent = user.username || 'UNKNOWN_ENTITY';
        elScore.textContent = user.score || 0;
        elTeam.textContent = user.team_name || 'NO_UNIT_ASSIGNED';
        elTasks.textContent = user.solved_tasks || 0;

    } catch (error) {
        console.error('Data fetch error:', error);
        elUsername.textContent = 'SYS_ERROR';
        elScore.textContent = 'ERR';
        elTeam.textContent = 'ERR';
        elTasks.textContent = 'ERR';
        
        // Если 401 - токен протух
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/index.html';
        }
    }
    
        // === ЛОГИКА УМНОГО СТАРТА ИГРЫ ===
        const btnStart = document.getElementById('btnStartGame');
        const modalNoTasks = document.getElementById('noTasksModal');
        const btnRepeat = document.getElementById('btnRepeatLast');

        btnStart.addEventListener('click', async () => {
            // Меняем текст кнопки, чтобы показать процесс загрузки
            const originalText = btnStart.textContent;
            btnStart.textContent = '[ SCANNING_TASKS... ]';

            // Берем токен из памяти
            const token = localStorage.getItem('token');
            try {
                                                
                // Добавляем слеш на конце "/" и явно передаем headers
                const response2 = await apiClient.get('/api/v1/tasks/tasks/next/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = response2.data;

                if (data.status === 'found') {
                    // Идеально: нашли следующую задачу
                    window.location.href = `/game.html?taskId=${data.task_id}`;
                } else {
                    // Задач больше нет
                    btnStart.textContent = originalText;
                    modalNoTasks.style.display = 'flex'; // Показываем модалку
                    // Сохраняем ID последней задачи внутри кнопки повтора
                    btnRepeat.dataset.taskId = data.last_task_id;
                }
            } catch (error) {
                console.error('Ошибка при поиске задачи', error);
                // Если эндпоинт отвалился, просто кидаем в общий список выбора
                // window.location.href = '/tasks.html';
                
                // Выводим текст ошибки из бэкенда, чтобы понимать причину
                if (error.response) {
                    console.error("Backend response:", error.response.data);
                }
            }

        });

        // Обработчики кнопок внутри модального окна
        btnRepeat.addEventListener('click', (e) => {
            const lastId = e.target.dataset.taskId;
            if (lastId && lastId !== "0") {
                window.location.href = `/game.html?taskId=${lastId}`;
            } else {
                // Если пользователь вообще ни одной задачи еще не решил, но задач в БД 0
                window.location.href = '/tasks.html';
            }
        });

        document.getElementById('btnGoToTasks').addEventListener('click', () => {
            window.location.href = '/tasks.html';
        });

        document.getElementById('btnCloseModal').addEventListener('click', () => {
            modalNoTasks.style.display = 'none';
        });

});