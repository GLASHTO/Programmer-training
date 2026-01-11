import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://10.25.2.4:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor для добавления токена только в нужные запросы
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            return config;
        }

        const method = config.method.toLowerCase();
        const url = config.url;

        // 1. /submit (POST)
        // 2. /to_team (PUT)
        // 3. /teams (POST)
        // 4. /teams (DELETE по id)
        // 5. /leave (POST)

        const isSubmit = url.includes('/submit');
        const isToTeam = url.includes('/to_team');
        const isLeave = url.includes('/leave');
        
        // Проверка для /teams (POST создание или DELETE удаление)
        // URL в openapi выглядит как /api/v1/teams/teams/ или /api/v1/teams/teams/{id}
        const isTeamsRoute = url.includes('/teams/teams');
        const isPostTeam = method === 'post' && isTeamsRoute;
        const isDeleteTeam = method === 'delete' && isTeamsRoute;

        if (isSubmit || isToTeam || isLeave || isPostTeam || isDeleteTeam) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;