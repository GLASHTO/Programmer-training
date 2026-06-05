import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        game: resolve(__dirname, 'game.html'),
        profile: resolve(__dirname, 'profile.html'),
        menu: resolve(__dirname, 'menu.html'),
        tasks: resolve(__dirname, 'tasks.html'),
        teams: resolve(__dirname, 'teams.html'),
        createTeam: resolve(__dirname, 'create-team.html'),
        myTeams: resolve(__dirname, 'my-teams.html'),
        register: resolve(__dirname, 'register.html'),
        forgotPassw: resolve(__dirname, 'forgot-passw.html'),
        // Новые страницы:
        rooms: resolve(__dirname, 'rooms.html'),
        roomGame: resolve(__dirname, 'room-game.html'),
        roomObserve: resolve(__dirname, 'room-observe.html'),
        selectTasks: resolve(__dirname, 'select-tasks.html'),
      }
    }
  },
})