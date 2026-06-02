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
        const usersResponse = await apiClient.get('/api/v1/users/users/');
        const users = usersResponse.data;
        const targetUser = users.find(u => u.username === username);

        if (!targetUser) {
            throw new Error('User not found');
        }

        msgBox.textContent = 'Смена пароля...';

        // 2. Отправляем запрос на смену пароля
        await apiClient.put('/api/v1/users/users/new_password', {
            id: targetUser.id,
            password: newPassword
        });

        msgBox.textContent = 'Пароль изменен';
        msgBox.classList.add('success');

        // Редирект на логин
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1500);

    } catch (error) {
        console.error(error);
        resetBtn.disabled = false;
        msgBox.classList.add('error');
        if (error.response.data.detail == "New password cannot be the same as the old password"){
            msgBox.textContent = 'Новый пароль не может быть таким же, как и старый';
        }
        else if (error.message === 'User not found') {
            msgBox.textContent = 'Пользователь не найден';
        } else {
            msgBox.textContent = 'Server Error 505';
        }
    }
});