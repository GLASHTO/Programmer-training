import '../css/teams.css';
import api from '../api/client.js';

const grid = document.getElementById('teamsGrid');
const createLink = document.getElementById('createTeamLink');
const statusLabel = document.getElementById('userStatus');

// Функция присоединения
window.joinTeam = async (teamId) => {
    const userId = localStorage.getItem('user_id');
    if (!confirm('CONFIRM TRANSFER?')) return;
    
    try {
        await api.put('/api/v1/users/users/to_team', { user_id: userId, team_id: teamId });
        window.location.reload(); // Перезагружаем, чтобы обновить статус
    } catch (e) {
        alert('TRANSFER DENIED');
    }
};

async function init() {
    try {
        const userId = localStorage.getItem('user_id');
        
        // Параллельный запрос: все команды + инфо о текущем юзере
        const [teamsRes, userRes] = await Promise.all([
            api.get('/api/v1/teams/teams/'),
            api.get(`/api/v1/users/users/${userId}`)
        ]);

        const teams = teamsRes.data;
        const myTeamId = userRes.data.team_id; // null или ID

        // 1. Логика кнопки "Создать"
        if (!myTeamId) {
            createLink.classList.remove('hidden'); // Показываем, если нет команды
            statusLabel.textContent = "STATUS: FREE_AGENT";
            statusLabel.classList.add('text-green-500');
        } else {
            statusLabel.textContent = `STATUS: DEPLOYED (UNIT_${myTeamId})`;
            statusLabel.classList.add('text-green-700');
        }

        // 2. Рендер списка
        grid.innerHTML = '';
        if (teams.length === 0) {
            grid.innerHTML = '<div class="text-gray-600 border border-dashed border-gray-800 p-8">NO UNITS FOUND</div>';
            return;
        }

        teams.forEach(team => {
            const isMyTeam = team.id === myTeamId;
            const card = document.createElement('div');
            
            // Если это моя команда - добавляем спец класс
            card.className = `team-card ${isMyTeam ? 'my-unit' : ''}`;

            // Логика кнопки внутри карточки
            let actionBtn = '';
            
            if (isMyTeam) {
                actionBtn = `<div class="w-full py-2 text-xs font-bold bg-green-900/20 text-green-500 text-center border border-green-900">ACTIVE DUTY</div>`;
            } else if (myTeamId) {
                // Если я уже в другой команде -> кнопка заблокирована
                actionBtn = `<button disabled class="btn-disabled">RESTRICTED</button>`;
            } else {
                // Если я свободен -> можно вступить
                actionBtn = `<button onclick="joinTeam(${team.id})" class="cyber-btn w-full text-xs">REQUEST JOIN</button>`;
            }

            card.innerHTML = `
                <div>
                    <div class="text-[10px] text-gray-500 uppercase tracking-widest mb-1">ID: ${team.id}</div>
                    <div class="text-xl font-bold text-white mb-4">${team.team_name}</div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-800/50">
                    ${actionBtn}
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        grid.innerHTML = `<div class="text-red-500">:: CONNECTION ERROR ::</div>`;
    }
}

init();