// server.ts
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

async function main() {
  await app.prepare();

  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    socket.on("join", (rooms: string[]) => {
      rooms.forEach((r) => socket.join(r));
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Server Ready on http://${hostname}:${port}`);
    });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


