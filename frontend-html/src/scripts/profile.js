import apiClient from '../api/client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');
    const msgBox = document.getElementById('msgBox');

    if (!userId) {
        window.location.href = '/index.html';
        return;
    }

    // Загрузка данных
    try {
        const response = await apiClient.get(`/api/v1/users/users/${userId}/profile`);
        const user = response.data;

        document.getElementById('username').textContent = user.username;
        document.getElementById('userId').textContent = user.id;
        document.getElementById('score').textContent = user.score;
        document.getElementById('team').textContent = user.team_name || 'Solo (Нет команды)';
        
        // ВЫВОДИМ КОЛИЧЕСТВО РЕШЕННЫХ ЗАДАЧ
        document.getElementById('solvedTasks').textContent = user.solved_tasks;

    } catch (error) {
        console.error(error);
        msgBox.textContent = 'SYS_ERROR: Не удалось загрузить данные профиля';
        msgBox.className = 'msg-box error';
    }

    // Обработка смены пароля
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const p1 = document.getElementById('newPass').value;
        const p2 = document.getElementById('confirmPass').value;

        msgBox.textContent = '';
        msgBox.className = 'msg-box';

        if (!p1 || !p2) {
            msgBox.textContent = 'ПОЛЯ НЕ МОГУТ БЫТЬ ПУСТЫМИ';
            msgBox.classList.add('error');
            return;
        }

        if (p1 !== p2) {
            msgBox.textContent = 'ОШИБКА: ПАРОЛИ НЕ СОВПАДАЮТ';
            msgBox.classList.add('error');
            return;
        }

        try {
            await apiClient.put('/api/v1/users/users/new_password', {
                id: parseInt(userId),
                password: p1
            });

            msgBox.textContent = 'ДОСТУП ОБНОВЛЕН (SUCCESS)';
            msgBox.classList.add('success');
            
            // Очистка полей
            document.getElementById('newPass').value = '';
            document.getElementById('confirmPass').value = '';

        } catch (error) {
            console.error(error);
            const errDetail = error.response?.data?.detail;
            if (error.response.data.detail == "New password cannot be the same as the old password"){
                msgBox.textContent = 'Новый пароль не может быть таким же, как и старый';
                msgBox.classList.add('error');
            } else {
            msgBox.textContent = errDetail ? JSON.stringify(errDetail) : 'ОШИБКА ОБНОВЛЕНИЯ';
            msgBox.classList.add('error');
        }
        }
    });
});