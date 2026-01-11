// Импорт стилей, чтобы Vite их увидел и обработал
import '../css/base.css';
import '../css/login.css';
import api from '../api/client.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorBox = document.getElementById('errorMsg');

    try {
        const res = await api.post('/api/v1/auth/login', { username, password });
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('user_id', res.data.user_id);
        window.location.href = '/menu.html';
    } catch (err) {
        errorBox.textContent = ":: ACCESS DENIED :: INVALID CREDENTIALS";
        errorBox.classList.remove('hidden');
    }
});