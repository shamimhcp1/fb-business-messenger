import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  // Use Redis adapter so events from workers can reach connected clients
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379/0";
  const pubClient = new Redis(redisUrl);
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log("a user connected: " + socket.id);

    // join rooms
    socket.on("join", (rooms: string[]) => {
      rooms.forEach((room) => {
        socket.join(room);
        console.log(`socket ${socket.id} joined room ${room}`);
      });
    });

    // message:new
    socket.on("message:new", (data) => {
      const { conversationId, message, conversation } = data;
      io.to(`tenant:${conversation.tenantId}`)
        .to(`page:${conversation.pageId}`)
        .emit("message:new", { conversationId, message, conversation });
    });
    
  });

  io.on("disconnect", (socket) => {
    console.log("a user disconnected: " + socket.id);
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
