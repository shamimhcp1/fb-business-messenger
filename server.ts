import next from 'next'
import http from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { redis } from '@/lib/redis'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

async function main() {
  await app.prepare()
  const server = http.createServer((req, res) => handle(req, res))

  const io = new Server(server, { cors: { origin: '*' } })
  // Create a second Redis connection for pub/sub if needed; here we reuse and duplicate
  const pubClient: any = redis.duplicate()
  const subClient: any = redis.duplicate()
  await pubClient.connect?.()
  await subClient.connect?.()
  io.adapter(createAdapter(pubClient, subClient))

  io.on('connection', socket => {
    socket.on('join', (rooms: string[]) => {
      rooms.forEach(r => socket.join(r))
    })
  })

  const port = process.env.PORT ? Number(process.env.PORT) : 3000
  server.listen(port, () => {
    console.log(`Server ready on http://localhost:${port}`)
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

