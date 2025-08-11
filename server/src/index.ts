import { WebSocketServer, WebSocket } from "ws";
import { RedisService } from "./utils/redisService";
import { RoomManager } from "./utils/roomHelper";
import {
  JoinRoomMessage,
  ChatMessage,
  LeaveRoomMessage,
  GetRoomListMessage,
  ServerMessage,
} from "./types/messages";

const PORT = parseInt(process.env.PORT || "8080");
const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`WebSocket server listening on ${PORT}`);
});

const redisService = new RedisService();
const roomManager = new RoomManager(redisService);

function generateId() {
  return Math.random().toString(36).slice(2, 12);
}

wss.on("connection", (socket: WebSocket) => {
  const userId = generateId();

  const connected: ServerMessage = {
    type: "connected",
    message: "Connected",
    userId,
  };
  socket.send(JSON.stringify(connected));

  socket.on("message", async (raw) => {
    let parsed: any;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      socket.send(
        JSON.stringify({ type: "error", message: "Invalid JSON format" })
      );
      return;
    }

    switch (parsed.type as string) {
      case "join": {
        const { roomId, username, roomName } = parsed as JoinRoomMessage;
        if (!roomId || !username) {
          socket.send(
            JSON.stringify({ type: "error", message: "roomId & username required" })
          );
          return;
        }
        try {
          const memberCount = await roomManager.joinRoom(
            userId,
            roomId,
            username,
            socket,
            roomName
          );
          socket.send(
            JSON.stringify({
              type: "roomJoined",
              roomId,
              memberCount,
              message: `Joined room ${roomId}`,
            })
          );
          await roomManager.publishToRoom(roomId, {
            type: "userJoined",
            username,
            userId,
            memberCount,
          }, userId);
        } catch (e) {
          socket.send(
            JSON.stringify({ type: "error", message: "Join failed" })
          );
        }
        break;
      }

      case "message": {
        const { content } = parsed as ChatMessage;
        const user = roomManager.getLocalUser(userId);
        if (!user || !user.roomId) {
          socket.send(
            JSON.stringify({ type: "error", message: "Join a room first" })
          );
          return;
        }
        const outgoing = {
            type: "message",
            content,
            username: user.username,
            userId,
            timestamp: new Date().toISOString(),
        };
        // Echo to sender immediately
        socket.send(JSON.stringify(outgoing));
        await roomManager.publishToRoom(user.roomId, outgoing, userId);
        break;
      }

      case "leaveRoom": {
        const res = await roomManager.leaveRoom(userId);
        if (res) {
          await roomManager.publishToRoom(res.roomId, {
            type: "userLeft",
            username: res.username,
            userId,
            memberCount: res.memberCount,
          }, userId);
        }
        break;
      }

      case "getRoomList": {
        const rooms = await roomManager.getRoomList();
        socket.send(
          JSON.stringify({
            type: "roomList",
            rooms,
          })
        );
        break;
      }

      default:
        socket.send(
          JSON.stringify({ type: "error", message: "Unknown message type" })
        );
    }
  });

  socket.on("close", async () => {
    await roomManager.handleDisconnection(socket);
  });

  socket.on("error", () => {
  });
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  wss.close(() => process.exit(0));
});


