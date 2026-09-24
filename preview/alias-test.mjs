import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const r = (p) => path.resolve(__dirname, p)

const server = await createServer({
  root: r('./preview'),
  logLevel: 'error',
  resolve: {
    alias: [
      { find: /^@\//, replacement: r('../src/') },
    ],
  },
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
  plugins: [],
})

const result1 = await server.pluginContainer.resolveId('@/utils/log', r('../src/app.ts'))
console.log('resolveId @/utils/log:', result1)
const result2 = await server.pluginContainer.resolveId('@/utils/errorHandle', r('../src/app.ts'))
console.log('resolveId @/utils/errorHandle:', result2)
await server.close()
process.exit(0)
