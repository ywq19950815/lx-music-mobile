import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const r = (p) => path.resolve(__dirname, p)

const server = await createServer({
  root: r('.'),
  logLevel: 'error',
  plugins: [
    {
      name: 'stub-vendor-cjs',
      enforce: 'pre',
      resolveId(source) {
        if (source.includes('infSign')) console.log('[stub-plugin] hit:', source)
        if (/(^|\/)infSign\.min(\.js)?$/.test(source)) return r('./mocks/inf-sign.js')
        return null
      },
    },
  ],
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
})

const importer = r('../src/utils/musicSdk/kg/songList.js')
console.log('resolveId ./vendors/infSign.min:', await server.pluginContainer.resolveId('./vendors/infSign.min', importer))
await server.close()
process.exit(0)
