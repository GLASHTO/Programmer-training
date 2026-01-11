import apiClient from '../api/client.js';

const createBtn = document.getElementById('createBtn');
const nameInput = document.getElementById('teamName');
const msgBox = document.getElementById('msgBox');

createBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    
    // Сброс UI
    msgBox.textContent = 'Processing...';
    msgBox.style.color = '#fff';
    createBtn.disabled = true;

    if (!name) {
        msgBox.textContent = 'Name required';
        msgBox.style.color = '#ff0055';
        createBtn.disabled = false;
        return;
    }

    try {
        // POST /api/v1/teams/teams/
        // Body: { team_name: "..." }
        // Authorization: Добавляется автоматически в client.js (interceptors)
        await apiClient.post('/api/v1/teams/teams/', {
            team_name: name
        });

        msgBox.textContent = 'Unit Created.';
        msgBox.style.color = '#00ff9d';

        // Перенаправление на "Моя команда"
        setTimeout(() => {
            window.location.href = '/my-teams.html';
        }, 1000);

    } catch (error) {
        console.error(error);
        createBtn.disabled = false;
        msgBox.style.color = '#ff0055';

        if (error.response && error.response.data && error.response.data.detail) {
             msgBox.textContent = JSON.stringify(error.response.data.detail);
        } else {
             msgBox.textContent = 'Creation Failed';
        }
    }
});