from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Храним активные соединения в виде: { room_id: [WebSocket, WebSocket, ...] }
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: int):
        """Принимает соединение и добавляет его в нужную комнату"""
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: int):
        """Удаляет соединение при обрыве/выходе"""
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            # Если комната опустела, удаляем ключ для экономии памяти
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: dict, room_id: int):
        """Отправляет JSON сообщение всем участникам конкретной комнаты"""
        if room_id in self.active_connections:
            # Превращаем dict в JSON строку
            json_msg = json.dumps(message)
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(json_msg)
                except Exception as e:
                    # Если сокет "умер", но не успел удалиться
                    print(f"WS Error broadcasting: {e}")

# Создаем единственный экземпляр менеджера
manager = ConnectionManager()