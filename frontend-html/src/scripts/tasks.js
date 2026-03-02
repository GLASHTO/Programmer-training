import apiClient from '../api/client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    const tasksGrid = document.getElementById('tasksGrid');

    try {
        // Запрашиваем все задачи
        const response = await apiClient.get('/api/v1/tasks/tasks/');
        const tasks = response.data;

        if (!tasks || tasks.length === 0) {
            tasksGrid.innerHTML = '<div class="error-msg">ЗАДАЧ НЕТ.</div>';
            return;
        }

        tasksGrid.innerHTML = ''; // Очищаем надпись загрузки

        // Рендерим карточку для каждой задачи
        tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.innerHTML = `
                <div class="task-card-header">
                    <h3 class="task-name">${task.title}</h3>
                    <span class="task-reward">${task.task_score} PTS</span>
                </div>
                <div class="task-card-body">
                    <p>${task.description.substring(0, 100)}...</p>
                </div>
                <div class="task-card-footer">
                    <span class="task-time">ТАЙМЕР: ${Math.floor(task.task_time / 60)} МИН</span>
                    <button class="btn-action start-btn" data-id="${task.id}">[ РЕШИТЬ ]</button>
                </div>
            `;
            tasksGrid.appendChild(card);
        });

        // Вешаем обработчики на кнопки начала игры
        document.querySelectorAll('.start-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-id');
                // Переходим в игру, передавая ID задачи в URL
                window.location.href = `/game.html?taskId=${taskId}`;
            });
        });

    } catch (error) {
        console.error("Error loading tasks:", error);
        tasksGrid.innerHTML = '<div class="error-msg">SYS_ERROR: UNABLE TO FETCH MISSIONS.</div>';
    }
});