import React from 'react';
import ReactDOM from 'react-dom/client';
import '../css/base.css'; // База
import '../css/game.css'; // Стили игры

const GameApp = () => {
  return (
    <div className="min-h-screen p-4 flex flex-col">
       <div className="border border-green-500 p-4">
          <h1 className="text-green-500">REACT_MODULE_LOADED</h1>
          {/* Тут будет вся логика игры, редактор кода и т.д. */}
       </div>
       <a href="/menu.html" className="mt-4 text-gray-500 hover:text-white">BACK TO MENU</a>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<GameApp />);