import apiClient from '../api/client.js';

// Обработчик для Студента: Вход в комнату по коду
document.getElementById('btnJoinRoom').addEventListener('click', async () => {
    const code = document.getElementById('roomCodeInput').value.trim();
    if (!code) return alert('Введите код комнаты!');

    try {
        const res = await apiClient.post('/api/v1/rooms/join', { code: code });
        if (res.data.status === 'ok') {
            // Перенаправляем студента на игровую арену
            window.location.href = `/room-game.html?roomId=${res.data.room_id}`;
        }
    } catch (error) {
        alert('Ошибка: ' + (error.response?.data?.detail || 'Комната не найдена'));
    }
});

// Обработчик для Учителя: Переход на страницу выбора задач
document.getElementById('btnCreateRoom').addEventListener('click', () => {
    // Больше никаких хардкод-запросов здесь! 
    // Просто уводим пользователя выбирать задачи галочками
    window.location.href = '/select-tasks.html';
});