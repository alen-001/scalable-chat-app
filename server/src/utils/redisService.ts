import Redis from "ioredis";
import { EventEmitter } from "node:events";
import { ServerMessage } from "../types/messages";
import 'dotenv/config';
type PublishedEnvelope = Partial<ServerMessage> & {
  excludeUserId?: string;
};

export class RedisService extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;

  private readonly ROOM_CHANNEL_PREFIX = "room:";
  private readonly ROOM_MEMBERS_PREFIX = "room_members:";
  private readonly USER_DATA_PREFIX = "user_data:";
  private readonly ROOM_INFO_PREFIX = "room_info:";

  constructor() {
    super();
    const redisConfig = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
    };
    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.publisher.on("error", (err) => {
      console.error("Redis publisher error", err);
    });
    this.subscriber.on("error", (err) => {
      console.error("Redis subscriber error", err);
    });

    // Pattern subscribe to all room channels
    this.subscriber.psubscribe(`${this.ROOM_CHANNEL_PREFIX}*`, (err) => {
      if (err) console.error("Pattern subscribe failed", err);
    });

    this.subscriber.on("pmessage", (_pattern, channel, raw) => {
      try {
        const roomId = channel.replace(this.ROOM_CHANNEL_PREFIX, "");
        const payload: PublishedEnvelope = JSON.parse(raw);
        this.emit("roomMessage", { roomId, payload });
      } catch (e) {
        console.error("Failed to parse pub/sub message", e);
      }
    });
  }

  private getRoomMembersKey(roomId: string): string {
    return `${this.ROOM_MEMBERS_PREFIX}${roomId}`;
  }
  private getUserDataKey(roomId: string, userId: string): string {
    return `${this.USER_DATA_PREFIX}${roomId}:${userId}`;
  }
  private getRoomInfoKey(roomId: string): string {
    return `${this.ROOM_INFO_PREFIX}${roomId}`;
  }
  private getRoomChannelKey(roomId: string): string {
    return `${this.ROOM_CHANNEL_PREFIX}${roomId}`;
  }

  async createRoom(roomId: string, roomName: string): Promise<void> {
    const exists = await this.publisher.exists(this.getRoomInfoKey(roomId));
    if (!exists) {
      await this.publisher.hset(this.getRoomInfoKey(roomId), {
        id: roomId,
        name: roomName,
        createdAt: new Date().toISOString(),
      });
    }
  }

  async addUserToRoom(roomId: string, userId: string, username: string): Promise<number> {
    await this.publisher.sadd(this.getRoomMembersKey(roomId), userId);
    await this.publisher.hset(this.getUserDataKey(roomId, userId), {
      username,
      joinedAt: new Date().toISOString(),
    });
    return this.publisher.scard(this.getRoomMembersKey(roomId));
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<number> {
    await this.publisher.srem(this.getRoomMembersKey(roomId), userId);
    await this.publisher.del(this.getUserDataKey(roomId, userId));
    const memberCount = await this.publisher.scard(this.getRoomMembersKey(roomId));
    if (memberCount === 0) {
      // Clean up empty room data
      await this.publisher.del(this.getRoomMembersKey(roomId));
      await this.publisher.del(this.getRoomInfoKey(roomId));
    }
    return memberCount;
  }

  async publishToRoom(roomId: string, message: PublishedEnvelope): Promise<void> {
    await this.publisher.publish(this.getRoomChannelKey(roomId), JSON.stringify(message));
  }

  async getRoomList(): Promise<
    Array<{ roomId: string; name: string; memberCount: number; createdAt: string }>
  > {
    const keys = await this.publisher.keys(`${this.ROOM_INFO_PREFIX}*`);
    if (!keys.length) return [];
    const rooms: Array<{ roomId: string; name: string; memberCount: number; createdAt: string }> = [];
    for (const key of keys) {
      const roomId = key.replace(this.ROOM_INFO_PREFIX, "");
      const info = await this.publisher.hgetall(key);
      if (info && info.id) {
        const memberCount = await this.publisher.scard(this.getRoomMembersKey(roomId));
        rooms.push({
          roomId,
            name: info.name,
            memberCount,
            createdAt: info.createdAt,
        });
      }
    }
    rooms.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return rooms;
  }
}