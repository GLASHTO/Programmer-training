
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Импорт страниц
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import MainMenu from './pages/MainMenu';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Teams from './pages/Teams';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Все маршруты теперь публичные */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Основные страницы */}
        <Route path="/" element={<MainMenu />} />
        <Route path="/game" element={<Game />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Ловушка для неизвестных маршрутов -> на главную */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;



// import React from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import useAuthStore from './store/auth';

// // Импорт страниц
// import Login from './pages/Login';
// import Register from './pages/Register';
// import ForgotPassword from './pages/ForgotPassword';
// import MainMenu from './pages/MainMenu';
// import Game from './pages/Game';
// import Profile from './pages/Profile';
// import Teams from './pages/Teams';
// import Dashboard from './pages/Dashboard';

// // Компонент для защиты приватных маршрутов
// const PrivateRoute = ({ children }) => {
//   const isAuth = useAuthStore((state) => state.isAuth);
  
//   if (!isAuth) {
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// };

// const App = () => {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Публичные маршруты */}
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/" element={ <MainMenu />} /> 

//         {/* Приватные маршруты (требуют авторизации) */}
//         <Route path="/" element={
//           <PrivateRoute>
//             <MainMenu />
//           </PrivateRoute>
//         } />
        
//         <Route path="/game" element={
//           <PrivateRoute>
//             <Game />
//           </PrivateRoute>
//         } />

//         <Route path="/profile" element={
//           <PrivateRoute>
//             <Profile />
//           </PrivateRoute>
//         } />

//         <Route path="/teams" element={
//           <PrivateRoute>
//             <Teams />
//           </PrivateRoute>
//         } />

//         <Route path="/dashboard" element={
//           <PrivateRoute>
//             <Dashboard />
//           </PrivateRoute>
//         } />

//         {/* Ловушка для всех остальных маршрутов -> на главную */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// };

// export default App;



// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
