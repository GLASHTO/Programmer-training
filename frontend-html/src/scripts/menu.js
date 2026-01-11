import apiClient from '../api/client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('token');

    // Проверка авторизации
    if (!token || !userId) {
        window.location.href = '/index.html';
        return;
    }

    // Элементы UI
    const elUsername = document.getElementById('username');
    const elScore = document.getElementById('score');
    const elTeam = document.getElementById('teamName');
    const btnLogout = document.getElementById('logoutBtn');

    // Логаут
    btnLogout.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/index.html';
    });

    // Загрузка данных
    try {
        const response = await apiClient.get(`/api/v1/users/users/${userId}`);
        const user = response.data;
        
        // Отображение данных
        // Предполагаем структуру объекта user (т.к. schema пустая в spec, опираемся на стандартные поля)
        elUsername.textContent = user.username || 'UNKNOWN';
        
        // Если у пользователя есть поле score или rating
        elScore.textContent = user.score !== undefined ? user.score : '0';

        // Если есть ID команды, пробуем узнать её имя или просто пишем ID
        if (user.team_id) {
             // Можно сделать доп запрос на получение имени команды, 
             // но для простоты пока выведем ID или заглушку, если API не возвращает имя сразу
             elTeam.textContent = `ID: ${user.team_id}`; 
             // Опционально: fetchTeamName(user.team_id);
        } else {
            elTeam.textContent = 'NO AFFILIATION';
        }

    } catch (error) {
        console.error('Data fetch error:', error);
        elUsername.textContent = 'CONN_ERR';
        elScore.textContent = 'ERR';
        
        // Если 401 - токен протух
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            window.location.href = '/index.html';
        }
    }
});