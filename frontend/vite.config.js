import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Позволяет доступ по локальному IP (например, 192.168.x.x)
    port: 3000, // (Опционально) Меняет порт с 5173 на 3000
  }
})