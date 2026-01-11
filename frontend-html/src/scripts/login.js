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
        // 1. Попытка входа
        const loginResponse = await apiClient.post('/api/v1/auth/login', {
            username: usernameInput,
            password: passwordInput
        });

        // Предполагаем, что токен приходит в поле access_token или просто в теле, 
        // если API нестандартный, сохраним весь ответ или определенное поле.
        // Обычно: { "access_token": "...", "token_type": "bearer" }
        const token = loginResponse.data.access_token || loginResponse.data.token;
        
        if (!token) {
            throw new Error('Token missing in response');
        }

        localStorage.setItem('token', token);

        // 2. Получение ID пользователя
        // Если API логина не возвращает ID, ищем пользователя в списке по username.
        let userId = loginResponse.data.user_id || loginResponse.data.id;

        if (!userId) {
            msgBox.textContent = 'Verifying identity...';
            // Временное решение: получаем всех пользователей и ищем себя
            // (Так как нет эндпоинта /users/me)
            const usersResponse = await apiClient.get('/api/v1/users/users/');
            const users = usersResponse.data;
            const currentUser = users.find(u => u.username === usernameInput);
            
            if (currentUser) {
                userId = currentUser.id;
            } else {
                throw new Error('User identity not found');
            }
        }

        localStorage.setItem('user_id', userId);
        localStorage.setItem('username', usernameInput); // Сохраним для удобства

        msgBox.textContent = 'Access Granted.';
        msgBox.classList.add('success');
        
        // Редирект
        setTimeout(() => {
            window.location.href = '/menu.html';
        }, 800);

    } catch (error) {
        console.error(error);
        loginBtn.disabled = false;
        msgBox.classList.add('error');
        console.log(error.response);
        // msgBox.textContent = error.response.data.detail;

        if (error.response && error.response.status === 422) {
             msgBox.textContent = 'Invalid Credentials';
        } else if (error.message === 'User identity not found') {
             msgBox.textContent = 'User ID retrieval failed';
        } else {
             msgBox.textContent = 'Connection Error';
        }
        
        // Если ошибка авторизации - чистим мусор
        localStorage.clear();
    }
});