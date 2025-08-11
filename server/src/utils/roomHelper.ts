import { WebSocket } from "ws";
import { User } from "../types/messages";
import { RedisService } from "./redisService";

export class RoomManager {
  private localUsers = new Map<string, User>();
  private redisService: RedisService;

  constructor(redisService: RedisService) {
    this.redisService = redisService;

    // Listen to pub/sub messages and forward to local sockets
    this.redisService.on("roomMessage", ({ roomId, payload }: any) => {
      const { excludeUserId, ...outgoing } = payload;
      this.broadcastToLocalUsers(roomId, outgoing, excludeUserId);
    });
  }

  async joinRoom(
    userId: string,
    roomId: string,
    username: string,
    socket: WebSocket,
    roomName?: string
  ): Promise<number> {
    await this.redisService.createRoom(roomId, roomName || roomId);
    const memberCount = await this.redisService.addUserToRoom(roomId, userId, username);
    this.localUsers.set(userId, {
      socket,
      username,
      roomId,
      joinedAt: new Date(),
    });
    console.log(`User ${username} joined room ${roomId}`);
    return memberCount;
  }

  async leaveRoom(
    userId: string
  ): Promise<{ roomId: string; username: string; memberCount: number } | null> {
    const user = this.localUsers.get(userId);
    if (!user || !user.roomId) return null;

    const { roomId, username } = user;
    const memberCount = await this.redisService.removeUserFromRoom(roomId, userId);
    this.localUsers.delete(userId);
  console.log(`User ${username} left room ${roomId}`);
    return { roomId, username, memberCount };
  }

  getLocalUser(userId: string): User | undefined {
    return this.localUsers.get(userId);
  }

  getLocalUsersInRoom(roomId: string): Array<{ userId: string; user: User }> {
    const arr: Array<{ userId: string; user: User }> = [];
    for (const [id, user] of this.localUsers.entries()) {
      if (user.roomId === roomId) arr.push({ userId: id, user });
    }
    return arr;
  }

  async getRoomList() {
    return this.redisService.getRoomList();
  }

  async publishToRoom(roomId: string, message: any, excludeUserId?: string) {
    await this.redisService.publishToRoom(roomId, { ...message, excludeUserId });
  }

  broadcastToLocalUsers(roomId: string, message: any, excludeUserId?: string) {
    const usersInRoom = this.getLocalUsersInRoom(roomId);
    for (const { userId, user } of usersInRoom) {
      if (excludeUserId && userId === excludeUserId) continue;
      if (user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(JSON.stringify(message));
      }
    }
  }

  private getUserIdBySocket(socket: WebSocket): string | undefined {
    for (const [userId, user] of this.localUsers) {
      if (user.socket === socket) return userId;
    }
    return undefined;
  }

  async handleDisconnection(socket: WebSocket): Promise<void> {
    const userId = this.getUserIdBySocket(socket);
    if (userId) {
      const result = await this.leaveRoom(userId);
      if (result) {
        // Publish userLeft so other instances broadcast
        await this.publishToRoom(result.roomId, {
          type: "userLeft",
          username: result.username,
          userId,
          memberCount: result.memberCount,
        });
      }
    }
  }
}