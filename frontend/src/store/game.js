import { create } from 'zustand';

const useGameStore = create((set) => ({
  task: null,
  code: '',
  status: 'idle', // варианты: 'idle', 'playing', 'finished'

  setTask: (task) => set({ task }),
  setCode: (code) => set({ code }),
  setStatus: (status) => set({ status }),
  
  resetGame: () => set({ 
    task: null, 
    code: '', 
    status: 'idle' 
  }),
}));

export default useGameStore;