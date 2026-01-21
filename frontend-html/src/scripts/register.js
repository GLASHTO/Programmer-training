import apiClient from '../api/client.js';

const form = document.getElementById('registerForm');
const msgBox = document.getElementById('msgBox');
const registerBtn = document.getElementById('submitBtn');


form.addEventListener('submit', async (e) => {
    e.preventDefault();

    msgBox.textContent = 'Регистрация...';
    msgBox.className = 'msg-box';
    registerBtn.disabled = true;

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    try {
        // Попытка входа
        const loginResponse = await apiClient.post('/api/v1/users/users', {
            username: usernameInput,
            password: passwordInput
        });
        msgBox.textContent = 'Успешно';
        msgBox.classList.add('success');
        
        // Редирект
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 600);
    }
    catch (error) {
        console.error(error);
        registerBtn.disabled = false;
        msgBox.classList.add('error');
        console.log(error.response);
        msgBox.textContent = error.response.data.detail;
        
        // Если ошибка авторизации - чистим мусор
        localStorage.clear();
    }
});