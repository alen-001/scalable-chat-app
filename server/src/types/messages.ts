import type WebSocket from "ws";
export interface User{
  socket:WebSocket;
  username:string;
  roomId?:string;
  joinedAt?:Date;
}
export interface Room{
  id:string;
  name:string;
  members:Map<string,User>;
  createdAt?:Date
}
export interface JoinRoomMessage{
  type: "join";
  roomId: string;
  username: string;
  roomName?: string;
  userId?: string;
}
export interface ChatMessage{
  type:"message";
  content:string;
}
export interface LeaveRoomMessage{
    type:"leaveRoom";
}
export interface GetRoomListMessage{
  type:"getRoomList"
}
//server-->client
export interface ConnectedMessage{
  type:"connected";
  message:string;
  userId:string;
}
export interface RoomJoinedMessage{
  type:"roomJoined";
  roomId:string;
  memberCount: number;
  message: string;
}
export interface UserJoinedMessage  {
  type: "userJoined";
  username: string;
  userId: string;
  memberCount: number;
}

export interface UserLeftMessage  {
  type: "userLeft";
  username: string;
  userId: string;
  memberCount: number;
}

export interface IncomingChatMessage {
  type: "message";
  content: string;
  username: string;
  userId: string;
  timestamp: string;
}

export interface ErrorMessage  {
  type: "error";
  message: string;
}

export interface RoomListMessage  {
  type: "roomList";
  rooms: Array<{
    roomId: string;
    name: string;
    memberCount: number;
    createdAt: string;
  }>;
}
export type ServerMessage=
  | ConnectedMessage
  | RoomJoinedMessage
  | UserJoinedMessage
  | IncomingChatMessage
  | ErrorMessage
  | RoomListMessage;


