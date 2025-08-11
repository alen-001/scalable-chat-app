# Scalable Chat App using Raw WebSockets with Redis Pub/Sub and Room Logic

A **horizontally scalable real-time chat backend** built using the native WebSocket API in Node.js and Redis Pub/Sub.
Designed to handle **multiple server instances** with synchronized room state, enabling users connected to different servers to seamlessly exchange messages in the same room.

## 📌 Features

* **Raw WebSocket API** – No abstraction libraries like Socket.IO, giving full control over connection lifecycle.
* **Redis Pub/Sub for horizontal scaling** – Allows multiple WebSocket servers to broadcast messages across nodes.
* **Room-based messaging** – Users can join/leave rooms and only receive messages for the rooms they’re in.
* **Local user state + shared room state** – Each server maintains connected users locally, while room membership is synced via Redis.
* **Minimal protocol** – Lightweight JSON message structure for joining rooms, sending messages, and leaving rooms.

---

## 🛠️ Architecture

**How Redis Pub/Sub Works for WebSocket Scaling**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Server 1  │    │   Server 2  │    │   Server 3  │
│             │    │             │    │             │
│ Users: A,B  │    │ Users: C,D  │    │ Users: E,F  │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
                    ┌────▼────┐
                    │  Redis  │
                    │ Pub/Sub │
                    └─────────┘
```

**Flow:**

1. All servers subscribe to `room:*` channels.
2. A user sends a message to a room.
3. The server handling that user publishes to Redis channel `room:{roomId}`.
4. Redis broadcasts the message to all subscribed servers.
5. Each server checks if it has local users in that room.
6. If yes, it broadcasts the message via WebSocket to those users.

---

## 📡 Message Protocol

### 1️⃣ Join Room

```json
{
  "type": "join",
  "roomId": "general-chat",
  "username": "John Doe",
  "roomName": "General Discussion" 
}
```

### 2️⃣ Send Message

```json
{
  "type": "message",
  "content": "Hello everyone! 👋"
}
```

### 3️⃣ Leave Room

```json
{
  "type": "leaveRoom"
}
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js >= 18
* Redis (running locally or remotely)

### Redis Config 

Using the given docker compose you can spin up a redis server and set your environment varibles as given in .env.example 

### Installation

```bash
git clone https://github.com/alen-001/scalable-chat-app.git
cd scalable-chat-app
pnpm install
```

### Running the Server

```bash
# Start WebSocket server on port 8080
PORT=8080 pnpm dev

# Start another instance on port 6969
PORT=6969 pnpm dev
```

### Connecting Clients

You can connect:

* Via the frontend client( Defaults to 
ws://localhost:8080/ ) can be changed by VITE_SOCKET_URL environment varible on the client.
* Or use a WebSocket testing tool like Postman or wscat


## 💡 Scaling

* Spin up multiple WebSocket server instances on different ports or machines.
* Redis Pub/Sub keeps all servers in sync so users in the same room see each other’s messages, regardless of which server they’re connected to.






