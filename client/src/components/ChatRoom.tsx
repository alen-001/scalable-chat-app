import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Message {
  type: string;
  content?: string;
  username: string;
  userId: string;
  timestamp?: string;
  memberCount?: number;
}

interface ChatRoomProps {
  socket: WebSocket;
  username: string;
  roomId: string;
  roomName?: string;
  onLeaveRoom: () => void;
}

export function ChatRoom({ socket, username, roomId, roomName, onLeaveRoom }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "message" || data.type === "userJoined" || data.type === "userLeft") {
          setMessages(prev => [...prev, data]);
          if (data.memberCount !== undefined) {
            setMemberCount(data.memberCount);
          }
        } else if (data.memberCount !== undefined) {
          setMemberCount(data.memberCount);
        }
      } catch (error) {
        // Handle non-JSON messages (like welcome message)
        if (typeof event.data === 'string') {
          setMessages(prev => [...prev, {
            type: "system",
            content: event.data,
            username: "System",
            userId: "system"
          }]);
        }
      }
    };

    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.send(JSON.stringify({
      type: "message",
      content: newMessage.trim()
    }));

    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleLeaveRoom = () => {
    socket.send(JSON.stringify({
      type: "leaveRoom"
    }));
    onLeaveRoom();
  };

  const getMessageColor = (username: string) => {
    const colors = [
      "text-blue-400",
      "text-green-400",
      "text-yellow-400",
      "text-purple-400",
      "text-pink-400",
      "text-indigo-400",
      "text-red-400",
      "text-teal-400"
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-blue-500/30",
      "bg-green-500/30",
      "bg-yellow-500/30",
      "bg-purple-500/30",
      "bg-pink-500/30",
      "bg-indigo-500/30",
      "bg-red-500/30",
      "bg-teal-500/30"
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "now";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-5/6 m-4 p-4 w-4/5 border-2 border-border/50 rounded-4xl flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-lg">#{roomName || roomId}</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground text-sm">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 text-white transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-medium",
                message.type === "system" ? "bg-gray-500/30" : getAvatarColor(message.username)
              )}>
                {message.username.charAt(0).toUpperCase()}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "font-medium text-sm",
                    message.type === "system" ? "text-muted-foreground" : getMessageColor(message.username)
                  )}>
                    {message.username}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                <div className="text-foreground/90 text-sm">
                  {message.type === "userJoined" && (
                    <span className="text-green-400 italic">joined the room</span>
                  )}
                  {message.type === "userLeft" && (
                    <span className="text-red-400 italic">left the room</span>
                  )}
                  {(message.type === "message" || message.type === "system") && message.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${roomName || roomId}`}
              className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}