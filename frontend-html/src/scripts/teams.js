import apiClient from '../api/client.js';

const teamsGrid = document.getElementById('teamsGrid');
const searchInput = document.getElementById('searchInput');
const statusMsg = document.getElementById('statusMsg');

let allTeams = [];

document.addEventListener('DOMContentLoaded', () => {
    loadTeams();
});

async function loadTeams() {
    try {
        const response = await apiClient.get('/api/v1/teams/teams/');
        allTeams = response.data; // Ожидаем массив объектов [{id, team_name}, ...]
        renderTeams(allTeams);
    } catch (error) {
        console.error(error);
        teamsGrid.innerHTML = '<div style="color: #ff0055;">ERROR: UNABLE TO FETCH DATA</div>';
    }
}

function renderTeams(teams) {
    teamsGrid.innerHTML = '';

    if (teams.length === 0) {
        teamsGrid.innerHTML = '<div style="color: #666;">NO UNITS DETECTED</div>';
        return;
    }

    teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        
        // Предполагаем структуру: { "id": 1, "team_name": "Alpha" }
        // Если поле имени отличается, нужно подправить (в спецификации TeamBase есть team_name)
        const teamName = team.team_name || team.name || 'Unnamed Unit';

        card.innerHTML = `
            <h3 class="team-name">${sanitize(teamName)}</h3>
            <span class="team-id">ID: ${team.id}</span>
            <div class="team-actions">
                <button class="btn-action" onclick="window.handleJoin(${team.id}, '${sanitize(teamName)}')">JOIN</button>
            </div>
        `;
        teamsGrid.appendChild(card);
    });
}

// Простая защита от XSS при рендеринге имен
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

// Глобальная функция для обработки клика (так как onclick в HTML не видит модуль)
window.handleJoin = async (teamId, teamName) => {
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        window.location.href = '/index.html';
        return;
    }

    if (!confirm(`Confirm attachment to unit "${teamName}"?`)) {
        return;
    }

    statusMsg.textContent = 'Processing request...';
    statusMsg.className = 'status-bar';

    try {
        // PUT /api/v1/users/users/to_team
        // Body: { user_id, team_id }
        // Headers: Authorization (handled by client.js)
        await apiClient.put('/api/v1/users/users/to_team', {
            user_id: parseInt(userId),
            team_id: teamId
        });

        statusMsg.textContent = `Successfully joined ${teamName}.`;
        statusMsg.className = 'status-bar success';

        // Обновляем локальные данные о команде, если нужно, или просто редиректим
        setTimeout(() => {
             window.location.href = '/my-teams.html';
        }, 1000);

    } catch (error) {
        console.error(error);
        statusMsg.className = 'status-bar error';
        
        if (error.response && error.response.status === 403) {
             statusMsg.textContent = 'Access Denied: You are already in a team or banned.';
        } else {
             statusMsg.textContent = 'Join Failed. ' + (error.response?.data?.detail || '');
        }
    }
};