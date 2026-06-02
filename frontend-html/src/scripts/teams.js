import apiClient from '../api/client.js';

const teamsGrid = document.getElementById('teamsGrid');
const searchInput = document.getElementById('searchInput');
const statusMsg = document.getElementById('statusMsg');

let allTeams = [];
let isUserInTeam = false; // Флаг: состоит ли пользователь в команде

document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

// Единая функция инициализации страницы
async function initPage() {
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        window.location.href = '/index.html';
        return;
    }

    try {
        // 1. Узнаем статус пользователя (чтобы скрыть кнопки)
        const userRes = await apiClient.get(`/api/v1/users/users/${userId}/profile`);
        if (userRes.data && userRes.data.team_name) {
            isUserInTeam = true;
        }

        // 2. Загружаем команды и их баллы параллельно для скорости
        const [teamsRes, leaderboardRes] = await Promise.all([
            apiClient.get('/api/v1/teams/teams/'),
            apiClient.get('/api/v1/leaderboard/leaderboard/teams')
        ]);

        const basicTeams = teamsRes.data; // [{id: 1, team_name: "Alpha"}]
        const leaderboard = leaderboardRes.data; // [{rank: 1, team_name: "Alpha", score: 150}]

        // 3. Объединяем данные (добавляем очки к базовым данным команд)
        allTeams = basicTeams.map(team => {
            const teamName = team.team_name || team.name;
            const leaderData = leaderboard.find(l => l.team_name === teamName);
            return {
                ...team,
                score: leaderData ? leaderData.score : 0 // Если команды нет в топе, ставим 0
            };
        });

        // 4. Сортируем по очкам (по убыванию), чтобы самые сильные были первыми
        allTeams.sort((a, b) => b.score - a.score);

        renderTeams(allTeams);

    } catch (error) {
        console.error(error);
        teamsGrid.innerHTML = '<div style="color: #ff0055; text-align: center; padding: 20px; border: 1px dashed #ff0055;">ERROR: UNABLE TO FETCH DATA STREAMS</div>';
    }
}

function renderTeams(teams) {
    teamsGrid.innerHTML = '';

    if (teams.length === 0) {
        teamsGrid.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">NO UNITS DETECTED</div>';
        return;
    }

    teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        
        const teamName = team.team_name || team.name || 'Unnamed Unit';

        // Формируем блок действий в зависимости от статуса игрока
        const actionHtml = isUserInTeam 
            ? `<span style="color: #666; font-size: 0.8rem;">[ Вы в команде ]</span>`
            : `<button class="btn-action" style="padding: 5px 15px;" onclick="window.handleJoin(${team.id}, '${sanitize(teamName)}')">[ JOIN ]</button>`;

        // Добавил стили прямо сюда, чтобы карточки сразу выглядели в стиле кибер-терминала
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #333; padding-bottom: 10px; margin-bottom: 15px;">
                <h3 class="team-name" style="margin: 0; color: #e0e0e0; font-size: 1.2rem;">${sanitize(teamName)}</h3>
                <span class="team-score" style="color: #00f3ff; font-weight: bold; text-shadow: 0 0 5px rgba(0,243,255,0.3);">
                    ${team.score} PTS
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <span class="team-id" style="color: #666; font-size: 0.8rem;">ID: ${team.id}</span>
                <div class="team-actions">
                    ${actionHtml}
                </div>
            </div>
        `;
        teamsGrid.appendChild(card);
    });
}

// Защита от XSS
function sanitize(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// Фильтрация поиска
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allTeams.filter(t => 
        (t.team_name && t.team_name.toLowerCase().includes(query)) ||
        (String(t.id).includes(query))
    );
    renderTeams(filtered);
});

// Обработка вступления
window.handleJoin = async (teamId, teamName) => {
    const userId = localStorage.getItem('user_id');
    
    if (!confirm(`CONFIRM ATTACHMENT TO UNIT: "${teamName}"?`)) {
        return;
    }

    statusMsg.textContent = 'PROCESSING DIRECTIVE...';
    statusMsg.className = 'status-bar';

    try {
        await apiClient.put('/api/v1/users/users/to_team', {
            user_id: parseInt(userId),
            team_id: teamId
        });

        statusMsg.textContent = `SUCCESS: ATTACHED TO ${teamName}.`;
        statusMsg.className = 'status-bar success';

        // Через секунду перекидываем на страницу "Моя команда"
        setTimeout(() => {
             window.location.href = '/my-teams.html';
        }, 1000);

    } catch (error) {
        console.error(error);
        statusMsg.className = 'status-bar error';
        
        if (error.response && error.response.status === 403) {
             statusMsg.textContent = 'ACCESS DENIED: ALREADY IN A TEAM OR BANNED.';
        } else {
             statusMsg.textContent = 'JOIN FAILED. ' + (error.response?.data?.detail || '');
        }
    }
};