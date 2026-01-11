import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// export default defineConfig({
//   plugins: [react()],
//   server: { host: true, port: 3000 },
//   build: {
//     rollupOptions: {
//       input: {
//         main: resolve(__dirname, 'index.html'),
//         menu: resolve(__dirname, 'menu.html'),
//         game: resolve(__dirname, 'game.html'),
//         dashboard: resolve(__dirname, 'dashboard.html'),
//         teams: resolve(__dirname, 'teams.html'),          // Список команд
//         createTeam: resolve(__dirname, 'create-team.html') // Новая страница
//       },
//     },
//   },
// })

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Порт для фронтенда
    host: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        register: resolve(__dirname, 'register.html'),
        forgot_passw: resolve(__dirname, 'forgot-passw.html'),
        menu: resolve(__dirname, 'menu.html'),
        profile: resolve(__dirname, 'profile.html'),
        teams: resolve(__dirname, 'teams.html'),
        my_teams: resolve(__dirname, 'my-teams.html'),
        create_team: resolve(__dirname, 'create-team.html'),
        game: resolve(__dirname, 'game.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
    },
  },
});