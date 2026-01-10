import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Game from './pages/Game';
import Menu from './pages/Menu';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import Teams from './pages/Teams';
import ManageTeam from './pages/ManageTeam';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/game" element={<Game />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/manage" element={<ManageTeam />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}