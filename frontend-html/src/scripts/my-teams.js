import apiClient from '../api/client.js';

const container = document.getElementById('myTeamContainer');
const statusMsg = document.getElementById('statusMsg');

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');

    if (!userId) {
        window.location.href = '/index.html';
        return;
    }

    try {
        // 1. Получаем данные пользователя, чтобы узнать team_id
        const userRes = await apiClient.get(`/api/v1/users/users/${userId}`);
        const user = userRes.data;

        if (!user.team_id) {
            renderNoTeam();
        } else {
            // 2. Если есть команда, получаем информацию о ней
            try {
                const teamRes = await apiClient.get(`/api/v1/teams/teams/${user.team_id}`);
                const team = teamRes.data;
                renderTeamInfo(team);
            } catch (teamError) {
                console.error(teamError);
                renderError('Ошибка загрузки данных о команде');
            }
        }

    } catch (error) {
        console.error(error);
        renderError('Ошибка загрузки');
    }
});

function renderNoTeam() {
    container.innerHTML = `
        <div class="info-block">
            <span style="display:block; margin-bottom:20px;">YOU ARE NOT AFFILIATED WITH ANY UNIT.</span>
            <div style="display: flex; gap: 20px; justify-content: center;">
                <a href="/create-team.html" class="btn-create">INITIALIZE NEW UNIT</a>
                <a href="/teams.html" class="btn-nav">JOIN EXISTING</a>
            </div>
        </div>
    `;
}

function renderTeamInfo(team) {
    const teamName = team.team_name || team.name || 'Unknown';
    
    container.innerHTML = `
        <div class="team-card" style="height: auto; cursor: default; transform: none;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span class="team-id">ID команды: ${team.id}</span>
                <span class="highlight">${sanitize(teamName)}</span>
                <span style="color: #666; font-size: 0.8rem;">STATUS: ACTIVE</span>
            </div>
            
            <div style="border-top: 1px dashed #333; padding-top: 20px; display: flex; justify-content: space-between;">
                <button id="leaveBtn" class="btn-action">Выйти с команды</button>
                <button id="deleteBtn" class="btn-action delete">Удалить команду</button>
            </div>
        </div>
    `;

    // Навешиваем обработчики событий динамически
    document.getElementById('leaveBtn').addEventListener('click', handleLeave);
    document.getElementById('deleteBtn').addEventListener('click', () => handleDelete(team.id));
}

function renderError(msg) {
    container.innerHTML = `<div class="info-block" style="color: #ff0055;">${msg}</div>`;
}

async function handleLeave() {
    if (!confirm('Выйти с команды?')) return;
    
    setStatus('Загрузка...', '');

    try {
        // POST /api/v1/teams/teams/leave
        await apiClient.post('/api/v1/teams/teams/leave');
        setStatus('Вы вышли с команды.', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error(error);
        setStatus('Failed to leave unit.', 'error');
    }
}

async function handleDelete(teamId) {
    if (!confirm('Предупреждение: Удалить команду?')) return;

    setStatus('Удаление...', '');

    try {
        // DELETE /api/v1/teams/teams/{team_id}
        await apiClient.delete(`/api/v1/teams/teams/${teamId}`);
        setStatus('Unit terminated successfully.', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error(error);
        setStatus('Удаление команды, ошибка, вы не являетесь владельцем', 'error');
    }
}

function setStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = `status-bar ${type}`;
}

function sanitize(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}