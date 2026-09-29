import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const r = (p) => path.resolve(__dirname, p)

// 原生模块 → 统一 stub
const nativeStubs = {
  'react-native-track-player': r('./mocks/track-player.js'),
  'react-native-background-timer': r('./mocks/background-timer.js'),
  '@react-native-async-storage/async-storage': r('./mocks/async-storage.js'),
  'react-native-vector-icons': r('./mocks/icons.jsx'),
  'react-native-fast-image': r('./mocks/fast-image.jsx'),
  '@react-native-community/slider': r('./mocks/slider.jsx'),
  'react-native-pager-view': r('./mocks/pager-view.jsx'),
  'react-native-fs': r('./mocks/generic-stub.js'),
  'react-native-file-system': r('./mocks/file-system.js'),
  'react-native-local-media-metadata': r('./mocks/generic-stub.js'),
  'react-native-quick-base64': r('./mocks/quick-base64.js'),
  'react-native-quick-md5': r('./mocks/quick-md5.js'),
  'react-native-inset-shadow': r('./mocks/inset-shadow.jsx'),
  'react-native-extra-dimensions-android': r('./mocks/extra-dimensions.js'),
  'react-native-exception-handler': r('./mocks/exception-handler.js'),
  '@react-native-clipboard/clipboard': r('./mocks/clipboard.js'),
}

const sourceStubs = [
  // CJS/UMD vendor 源文件在浏览器无法运行，指向 stub（注意必须全匹配替换，
  // 否则相对前缀 './vendors/' 会被保留拼出无效路径）
  { find: /^\.\/vendors\/infSign\.min(\.js)?$/, replacement: r('./mocks/inf-sign.js') },
  { find: /^infSign\.min(\.js)?$/, replacement: r('./mocks/inf-sign.js') },
]

// ── 预览专用：本地代理转发跨域音乐 API（配合 mocks/cors-proxy.js）──────────
// 真机 RN fetch 无跨域概念，浏览器里音乐 API 全被 CORS 拦截 → 客户端把跨域 fetch
// 改写为 /__musicproxy（原 URL 与原始请求头放自定义头），这里服务端代为转发。
const PROXY_UA_FALLBACK = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
const HOP_HEADERS = new Set(['host', 'connection', 'content-length', 'accept-encoding', 'origin', 'referer', 'user-agent'])

const musicCorsProxy = () => ({
  name: 'preview-music-cors-proxy',
  configureServer(server) {
    server.middlewares.use('/__musicproxy', async (req, res) => {
      const fail = (code, msg) => {
        res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' })
        res.end(JSON.stringify({ err: msg }))
      }
      const target = req.headers['x-preview-proxy-url']
      if (!target || !/^https?:\/\//i.test(target)) return fail(400, 'missing/invalid x-preview-proxy-url')
      try {
        // 还原客户端捕获的原始请求头（可能含浏览器无法直发的受限头）
        let headers = {}
        try { headers = JSON.parse(decodeURIComponent(req.headers['x-preview-proxy-headers'] || '{}')) } catch { /* 容错 */ }
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = chunks.length ? Buffer.concat(chunks) : undefined
        const method = (req.method || 'GET').toUpperCase()

        const fwd = {}
        for (const [k, v] of Object.entries(headers)) {
          const key = String(k).toLowerCase()
          if (HOP_HEADERS.has(key)) continue
          fwd[key] = v
        }
        if (!fwd['user-agent']) fwd['user-agent'] = PROXY_UA_FALLBACK
        if (!fwd.referer) {
          try { fwd.referer = new URL(target).origin + '/' } catch { /* 忽略 */ }
        }

        const upstream = await fetch(target, {
          method,
          headers: fwd,
          body: body && method !== 'GET' && method !== 'HEAD' ? body : undefined,
          redirect: 'follow',
        })
        const buf = Buffer.from(await upstream.arrayBuffer())
        const out = {}
        upstream.headers.forEach((v, k) => {
          if (['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie'].includes(k.toLowerCase())) return
          out[k] = v
        })
        // set-cookie 多值原样透传（浏览器端 getSetCookie 可读，kw 源提 token 依赖）
        if (typeof upstream.headers.getSetCookie === 'function') {
          const sc = upstream.headers.getSetCookie()
          if (sc.length) out['set-cookie'] = sc
        }
        out['access-control-allow-origin'] = '*'
        res.writeHead(upstream.status, out)
        res.end(buf)
      } catch (err) {
        fail(502, String((err && err.message) || err))
      }
    })
  },
})

export default defineConfig({
  plugins: [
    {
      name: 'stub-vendor-cjs',
      enforce: 'pre',
      resolveId(source) {
        if (source.includes('infSign')) console.log('[stub-plugin] hit:', source)
        if (/(^|\/)infSign\.min(\.js)?$/.test(source)) return r('./mocks/inf-sign.js')
        return null
      },
      // 源码里的个别 CJS require → ESM import
      transform(code, id) {
        if (id.includes('musicSdk/kw/decodeLyric.js') && code.includes("require('pako')")) {
          return code.replace("const { inflate } = require('pako')", "import { inflate } from 'pako'")
        }
        // 运行时资源 require（图片等）→ 提升为 ESM import
        if (!id.replace(/\\/g, '/').includes('/src/') || !code.includes('require(')) return null
        const assetRe = /require\('([^']+?\.(?:png|jpe?g|gif|webp))'\)/g
        if (!assetRe.test(code)) return null
        const found = []
        const replaced = code.replace(assetRe, (_m, p1) => {
          const key = '__vite_asset_' + found.length
          found.push([key, p1])
          return key
        })
        const imports = found.map(([key, p1]) => `import ${key} from '${p1}'`).join('\n')
        return imports + '\n' + replaced
      },
    },
    react(),
    musicCorsProxy(),
  ],
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: r('./mocks/rn.js') },
      { find: 'react-native-navigation', replacement: r('./mocks/rnn.jsx') },
      ...Object.entries(nativeStubs).map(([find, replacement]) => ({ find: new RegExp(`^${find.replace(/[/.]/g, '\\$&')}$`), replacement })),
      ...sourceStubs,
      // RN 原生侧资源目录（预览环境不存在）→ 占位图
      { find: /^assets\//, replacement: r('./mocks/img-placeholder.js') },
      { find: /^@renderer\//, replacement: r('../src/renderer') + '/' },
      { find: /^@common\//, replacement: r('../src/common') + '/' },
      { find: /^@\//, replacement: r('../src') + '/' },
    ],
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  server: {
    host: '127.0.0.1',
    port: 5178,
    strictPort: true,
    fs: {
      allow: [r('..')],
    },
  },
})

console.log('[vite-config] loaded, aliases:', 3 + Object.keys(nativeStubs).length)
