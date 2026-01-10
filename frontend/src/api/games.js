import { create } from 'zustand';

export const useGameStore = create((set) => ({
  task: null,
  code: '',
  status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
  
  setTask: (task) => set({ task, code: task.template || '', status: 'idle' }),
  setCode: (code) => set({ code }),
  setStatus: (status) => set({ status })
}));