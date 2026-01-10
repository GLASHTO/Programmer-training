import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  userId: localStorage.getItem('userId') || null,
  isAuth: !!localStorage.getItem('token'),
  
  setAuth: (token, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    set({ token, userId, isAuth: true });
  },
  
  logout: () => {
    localStorage.clear();
    set({ token: null, userId: null, isAuth: false });
  }
}));