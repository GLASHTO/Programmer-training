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
    const btnLogout = document.getElementById('logoutBtn');

    // Выход
    btnLogout.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/index.html';
    });

    // Загрузка данных
    try {
        const response = await apiClient.get(`/api/v1/users/users/${userId}`);
        const user = response.data;
        // Отображение данных
        elUsername.textContent = user.username || 'Неизвестно';
        
        // Если у пользователя score не больше 0, то отобразить 0
        elScore.textContent = user.score !== undefined ? user.score : '0';

        // Логика отображения команды, запрашиваем данные команды ТОЛЬКО если есть ID
        if (user.team_id !== null) {
            try {
                const teamResponse = await apiClient.get(`/api/v1/teams/teams/${user.team_id}`);
                
                // Если API возвращает объект с team_name, берем его. Иначе fallback на ID.
                const teamName = teamResponse.data.team_name || teamResponse.data.name;
                elTeam.textContent = teamName || `ID команды: ${user.team_id}`;
                
            } catch (teamError) {
                // Если не удалось загрузить название команды, оставляем ID
                console.warn('Не удалось загрузить название', teamError);
                elTeam.textContent = `ID: ${user.team_id}`;
            }
        } else {
            elTeam.textContent = 'Никуда не вступал'; 
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