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
        const response = await apiClient.get(`/api/v1/users/users/${userId}`);
        const user = response.data;

        document.getElementById('username').textContent = user.username;
        document.getElementById('score').textContent = user.score !== undefined ? user.score : 0;
        document.getElementById('userId').textContent = user.id;

    } catch (error) {
        console.error(error);
        msgBox.textContent = 'Failed to load profile data.';
        msgBox.className = 'msg-box error';
    }

    // Обработка смены пароля
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const p1 = document.getElementById('newPass').value;
        const p2 = document.getElementById('confirmPass').value;

        msgBox.textContent = '';
        msgBox.className = 'msg-box';

        if (!p1 || !p2) {
            msgBox.textContent = 'Fields cannot be empty';
            msgBox.classList.add('error');
            return;
        }

        if (p1 !== p2) {
            msgBox.textContent = 'Passwords do not match';
            msgBox.classList.add('error');
            return;
        }

        try {
            // PUT /api/v1/users/users/new_password
            // Payload: { id: int, password: str }
            await apiClient.put('/api/v1/users/users/new_password', {
                id: parseInt(userId),
                password: p1
            });

            msgBox.textContent = 'Credentials Updated Successfully';
            msgBox.classList.add('success');
            
            // Очистка полей
            document.getElementById('newPass').value = '';
            document.getElementById('confirmPass').value = '';

        } catch (error) {
            console.error(error);
            const errDetail = error.response?.data?.detail;
            msgBox.textContent = errDetail ? JSON.stringify(errDetail) : 'Update Failed';
            msgBox.classList.add('error');
        }
    });
});