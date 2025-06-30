import { useState } from "react";
import { cn } from "@/lib/utils";

interface JoinRoomProps {
  onJoinRoom: (roomId: string, username: string, roomName?: string) => void;
  isConnected: boolean;
}

export function JoinRoom({ onJoinRoom, isConnected }: JoinRoomProps) {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) return;
    
    onJoinRoom(roomId.trim(), username.trim(), isCreating ? roomName.trim() : undefined);
  };

  return (
    <div className=" flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-75" />
          
          <div className="relative bg-card border rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {isCreating ? "Create Room" : "Join Room"}
              </h1>
              <p className="text-muted-foreground">
                {isCreating 
                  ? "Start a new conversation" 
                  : "Enter a room to start chatting"
                }
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? "Connected" : "Connecting..."}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-foreground mb-2">
                  Room ID
                </label>
                <input
                  id="roomId"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                />
              </div>



                <button
                type="submit"
                disabled={!isConnected || !roomId.trim() || !username.trim()}
                className="w-full px-4 py-3 bg-black text-primary-foreground rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Join or Create Room
                </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}