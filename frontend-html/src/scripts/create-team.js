import '../css/teams.css';
import api from '../api/client.js';

// Элементы DOM
const loader = document.getElementById('loader');
const createSection = document.getElementById('createSection');
const deleteSection = document.getElementById('deleteSection');
const currentTeamNameEl = document.getElementById('currentTeamName');
const errorBox = document.getElementById('errorMsg');

let myTeamId = null;

// Инициализация
async function init() {
    try {
        const userId = localStorage.getItem('user_id');
        if (!userId) window.location.href = '/index.html';

        // 1. Получаем данные пользователя
        const userRes = await api.get(`/api/v1/users/users/${userId}`);
        myTeamId = userRes.data.team_id;

        loader.classList.add('hidden');

        if (myTeamId) {
            // -- РЕЖИМ УДАЛЕНИЯ (Команда есть) --
            // Загружаем имя команды для красоты
            try {
                const teamRes = await api.get(`/api/v1/teams/teams/${myTeamId}`);
                currentTeamNameEl.textContent = teamRes.data.team_name;
            } catch {
                currentTeamNameEl.textContent = "UNKNOWN_UNIT";
            }
            deleteSection.classList.remove('hidden');
        } else {
            // -- РЕЖИМ СОЗДАНИЯ (Команды нет) --
            createSection.classList.remove('hidden');
        }

    } catch (e) {
        console.error(e);
        showError('CONNECTION_FAILED');
    }
}

// Обработчик СОЗДАНИЯ
document.getElementById('createTeamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const team_name = document.getElementById('teamName').value;
    errorBox.classList.add('hidden');

    try {
        await api.post('/api/v1/teams/teams/', { team_name });
        // После создания переходим в список, там уже можно увидеть свою команду
        window.location.href = '/teams.html'; 
    } catch (err) {
        showError(err.response?.data?.detail || 'CREATION_FAILED');
    }
});

// Обработчик УДАЛЕНИЯ
document.getElementById('deleteBtn').addEventListener('click', async () => {
    if (!myTeamId) return;
    
    const confirmDelete = confirm('CRITICAL WARNING: Confirm unit disbandment? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
        await api.delete(`/api/v1/teams/teams/${myTeamId}`);
        // После удаления обновляем страницу (скрипт init снова запустится и покажет форму создания)
        window.location.reload(); 
    } catch (err) {
        showError(err.response?.data?.detail || 'DELETION_FAILED_OR_ACCESS_DENIED');
    }
});

function showError(msg) {
    errorBox.textContent = `:: ERROR :: ${msg}`;
    errorBox.classList.remove('hidden');
}

init();