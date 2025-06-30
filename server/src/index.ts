import { WebSocketServer,WebSocket } from "ws";
const wss=new WebSocketServer({port: 8080},()=>{
    console.log(`Websocket server started on port ${8080} `)
});
const rooms=new Map<string,{
    name:string,
    users:Map<string,{socket:WebSocket,username:string}>,
    createdAt:Date
}>();
function generateUserId(){
    return Math.random().toString(36).substring(2,15);
}
wss.on("connection",(socket:WebSocket)=>{
    let userId:string| undefined;
    let currentRoomId:string|null=null;
    console.log("user connected - waiting to join room...");
    socket.send("Hey! Please join or create a room");
    socket.on("message",(e)=>{
        try{
            const message=JSON.parse(e.toString());
            switch(message.type){
                case "join":
                    const {roomId,username}=message;
                    userId=message.userId || generateUserId() || '';
                    if(!rooms.has(roomId)){
                        rooms.set(roomId,{
                            name:roomId,
                            users:new Map(),
                            createdAt:new Date()
                        })
                        console.log(`Room with id: ${roomId} created`);
                    }
                    const room=rooms.get(roomId);
                    if(userId && room) {
                        room.users.set(userId,{socket,username});
                        currentRoomId=roomId;
                        console.log(`User ${username} joined room ${roomId}`);
                    }
                    socket.send(JSON.stringify({
                        message:`Hey! ${username}! Welcome to room - ${roomId}`,
                        memberCount:room?.users.size
                    }));
                    broadcastToRoom(roomId,{
                        type:"userJoined",
                        username,
                        userId,
                        memberCount:room?.users.size
                    },userId);
                    break;
                case "message":
                    if(currentRoomId && userId){
                        const room=rooms.get(currentRoomId);
                        const user=room?.users.get(userId);
                        if(room && user){
                            broadcastToRoom(currentRoomId,{
                                type:"message",
                                content:message.content,
                                username:user.username,
                                userId,
                                timestamp:new Date().toISOString()
                            });
                        }
                    }else{
                        socket.send(JSON.stringify({
                            type:"error",
                            message:"You must join a room first"
                        }));
                    }
                    break;
                case "leaveRoom":
                    if(currentRoomId && roomId && userId){
                        leaveRoom(userId,currentRoomId)
                        currentRoomId=null;
                        userId=undefined;
                    }
                    break;
            }
        }catch(err){
            console.log("Invalid message format or some other error",err);
        }
        socket.on("close",()=>{
            if(currentRoomId && userId){
                leaveRoom(userId,currentRoomId);
            }
        })
    });
})
function broadcastToRoom(roomId:string,message:any,excludeUserId?:string){
    const room=rooms.get(roomId);
    if(room){
        room.users.forEach((user,userId)=>{
            if(userId !=excludeUserId && user.socket.readyState==WebSocket.OPEN){
                user.socket.send(JSON.stringify(message));
            }
        })
    }
}
function leaveRoom(userId:string,currentRoomId:string){
    const room=rooms.get(currentRoomId);
    if(room && room.users.has(userId)){
        var user=room.users.get(userId)!;
        room.users.delete(userId);
        console.log(`User ${user.username} left the room ${currentRoomId}`)
        
        if(room.users.size==0){
            rooms.delete(currentRoomId);
        }else{
            broadcastToRoom(currentRoomId,{
                type:"userLeft",
                username:user.username,
                userId,
                memeberCount:room.users.size
            })
        }
    }
}


