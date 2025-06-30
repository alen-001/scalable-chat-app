import { useEffect, useRef, useState } from 'react'
import { useSocket } from './context/SocketProvider';
import { JoinRoom } from './components/JoinRoom';
import { ChatRoom } from './components/ChatRoom';

interface RoomData {
  roomId: string;
  username: string;
  roomName?: string;
}

function App() {
  const { socket, sendMessage, isConnected } = useSocket();
  const [messages, setMessages] = useState<string[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null)

  function send() {
    const value = inputRef.current?.value;
    if (!isConnected) return;
    if(!value)return;
    sendMessage(value);
  }

  useEffect(() => {
    if (!socket) return;
    socket.onmessage = (e) => {
      setMessages((prev) => [...prev, e.data]);
    }
    return () => {
      socket.onmessage = null;
    }
  }, [socket])

  const handleJoinRoom = (roomId: string, username: string, roomName?: string) => {
    if (!socket || !isConnected) return;

    // Send join message to server
    socket.send(JSON.stringify({
      type: "join",
      roomId,
      username,
      roomName
    }));

    setCurrentRoom({ roomId, username, roomName });
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
  };

  if (!currentRoom) {
    return (
      <div className='w-full absolute h-screen flex flex-col items-center justify-center bg-background '>
      <JoinRoom
        onJoinRoom={handleJoinRoom}
        isConnected={isConnected}
      />
      </div>
    );
  }

  return (
    <div className='w-full absolute h-screen flex flex-col items-center justify-center bg-background'>
    <ChatRoom
      socket={socket!}
      username={currentRoom.username}
      roomId={currentRoom.roomId}
      roomName={currentRoom.roomName}
      onLeaveRoom={handleLeaveRoom}
    />
    </div>
  );
}

export default App
