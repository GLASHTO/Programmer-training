import apiClient from '../api/client.js';

const form = document.getElementById('loginForm');
const msgBox = document.getElementById('msgBox');
const loginBtn = document.getElementById('loginBtn');

// Очищаем старые данные при входе на страницу логина
localStorage.clear();

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    msgBox.textContent = 'Authenticating...';
    msgBox.className = 'msg-box';
    loginBtn.disabled = true;

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    try {
        // Попытка входа
        const loginResponse = await apiClient.post('/api/v1/auth/login', {
            username: usernameInput,
            password: passwordInput
        });

        // Токен приходит в поле access_token
        const token = loginResponse.data.access_token
        
        if (!token) {
            throw new Error('Токен не получен');
        }

        localStorage.setItem('token', token);

        // Получение ID пользователя
        let userId = loginResponse.data.user_id;
        if (!userId) {
            msgBox.textContent = 'Пользователь не найден';
        }

        localStorage.setItem('user_id', userId);
        localStorage.setItem('username', usernameInput); // Сохраним для удобства

        msgBox.textContent = 'Успешно';
        msgBox.classList.add('success');
        
        // Редирект
        setTimeout(() => {
            window.location.href = '/menu.html';
        }, 600);

    } catch (error) {
        console.error(error);
        loginBtn.disabled = false;
        msgBox.classList.add('error');
        console.log(error.response);
        msgBox.textContent = error.response.data.detail;
        
        // Если ошибка авторизации - чистим мусор
        localStorage.clear();
    }
});