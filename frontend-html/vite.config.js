import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu.html'),
        game: resolve(__dirname, 'game.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        teams: resolve(__dirname, 'teams.html'),          // Список команд
        createTeam: resolve(__dirname, 'create-team.html') // Новая страница
      },
    },
  },
})