import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: null,
  userId: null,
  isAuth: false,

  setAuth: (token, userId) => set({ 
    token, 
    userId, 
    isAuth: true 
  }),

  logout: () => set({ 
    token: null, 
    userId: null, 
    isAuth: false 
  }),
}));

export default useAuthStore;

