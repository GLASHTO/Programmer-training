import apiClient from '../api/client.js';

const form = document.getElementById('resetForm');
const msgBox = document.getElementById('msgBox');
const resetBtn = document.getElementById('resetBtn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    msgBox.textContent = 'Scanning database...';
    msgBox.className = 'msg-box';
    resetBtn.disabled = true;

    const username = document.getElementById('username').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
        // 1. Сначала ищем ID пользователя по логину
        // (Имитация уязвимости: перебор публичного списка пользователей)
        const usersResponse = await apiClient.get('/api/v1/users/users/');
        const users = usersResponse.data;
        const targetUser = users.find(u => u.username === username);

        if (!targetUser) {
            throw new Error('Identity not found in registry');
        }

        msgBox.textContent = 'Identity found. Overriding credentials...';

        // 2. Отправляем запрос на смену пароля
        // PUT /api/v1/users/users/new_password
        await apiClient.put('/api/v1/users/users/new_password', {
            id: targetUser.id,
            password: newPassword
        });

        msgBox.textContent = 'Access Code Reset Successful.';
        msgBox.classList.add('success');

        // Редирект на логин
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1500);

    } catch (error) {
        console.error(error);
        resetBtn.disabled = false;
        msgBox.classList.add('error');

        if (error.message === 'Identity not found in registry') {
            msgBox.textContent = 'Target Identity Not Found';
        } else {
            msgBox.textContent = 'Override Failed (Server Error)';
        }
    }
});