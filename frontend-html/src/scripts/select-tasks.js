import apiClient from '../api/client.js';

const taskListContainer = document.getElementById('taskList');
let selectedTaskIds = [];

// 1. Загружаем доступные задачи из бэкенда
async function loadAvailableTasks() {
    try {
        const res = await apiClient.get('/api/v1/tasks/tasks/');
        const tasks = res.data;
        taskListContainer.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            taskListContainer.innerText = 'В базе данных нет доступных задач.';
            return;
        }

        tasks.forEach(task => {
            const row = document.createElement('div');
            row.className = 'task-row';
            row.innerHTML = `
                <input type="checkbox" value="${task.id}" id="task_${task.id}">
                <label for="task_${task.id}">
                    <span style="color: #00f3ff; font-weight: bold; margin-right: 10px;">[${task.task_score} PTS]</span> 
                    ${task.title}
                </label>
            `;

            row.querySelector('input').addEventListener('change', (e) => {
                const id = parseInt(e.target.value);
                if (e.target.checked) {
                    selectedTaskIds.push(id);
                } else {
                    selectedTaskIds = selectedTaskIds.filter(tid => tid !== id);
                }
            });

            taskListContainer.appendChild(row);
        });
    } catch (error) {
        console.error(error);
        taskListContainer.innerText = 'Не удалось загрузить задачи.';
    }
}

// 2. Обработка нажатия кнопки запуска
document.getElementById('btnFinalCreate').addEventListener('click', async () => {
    if (selectedTaskIds.length === 0) {
        alert('Пожалуйста, выберите хотя бы одну задачу для проведения соревнования!');
        return;
    }

    try {
        const payload = {
            task_ids: selectedTaskIds,
            time_limit_seconds: 3600 // Ставим лимит 1 час
        };

        const res = await apiClient.post('/api/v1/rooms/', payload);
        const createdRoom = res.data;

        alert(`Соревнование успешно создано!\nКод комнаты: ${createdRoom.code}`);
        
        // ВАЖНО: Перенаправляем Учителя на страницу НАБЛЮДЕНИЯ, а не игры
        window.location.href = `/room-observe.html?roomId=${createdRoom.id}`;
        
    } catch (error) {
        console.error(error);
        alert('Ошибка при создании комнаты: ' + (error.response?.data?.detail || 'Сервер недоступен'));
    }
});

// Запуск инициализации страницы
loadAvailableTasks();