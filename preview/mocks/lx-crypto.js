// 预览专用：lx 音源脚本沙箱的 crypto/utils 实现
// 对标 lx-music-desktop preload.js 的 lx.utils（crypto-js 提供 AES/DES，BigInt 实现 RSA NO_PADDING，
// 浏览器 CompressionStream/DecompressionStream 提供 zlib）。
import cryptoJs from 'crypto-js'
import { Buffer } from 'buffer'

// ── Buffer ⇄ WordArray ────────────────────────────────
export const wordArrayFromBuffer = (buf) => {
  const bytes = buf instanceof Uint8Array ? buf : Uint8Array.from(String(buf), c => c.charCodeAt(0) & 0xff)
  const words = []
  for (let i = 0; i < bytes.length; i += 4) {
    words.push(
      (((bytes[i] ?? 0) << 24) | ((bytes[i + 1] ?? 0) << 16) | ((bytes[i + 2] ?? 0) << 8) | (bytes[i + 3] ?? 0)) | 0,
    )
  }
  return cryptoJs.lib.WordArray.create(words, bytes.length)
}

export const bufferFromWordArray = (wa) => {
  const sigBytes = wa.sigBytes
  const out = Buffer.alloc(sigBytes)
  for (let i = 0; i < sigBytes; i++) {
    out[i] = (wa.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
  }
  return out
}

const toBuffer = (input) => {
  if (Buffer.isBuffer(input)) return input
  if (input instanceof Uint8Array) return Buffer.from(input)
  if (typeof input === 'string') return Buffer.from(input, 'utf8')
  if (input && input.words) return bufferFromWordArray(input)
  return Buffer.from(String(input ?? ''), 'utf8')
}

// ── AES / DES（对标 createCipheriv：默认 PKCS7 填充）────
const CIPHER_MAP = {
  aes: cryptoJs.AES,
  des: cryptoJs.DES,
  tripledes: cryptoJs.TripleDES,
}
const MODE_MAP = {
  ecb: cryptoJs.mode.ECB,
  cbc: cryptoJs.mode.CBC,
  cfb: cryptoJs.mode.CFB,
  ofb: cryptoJs.mode.OFB,
  ctr: cryptoJs.mode.CTR,
}

export const aesEncrypt = (buffer, mode, key, iv) => {
  const m = /^(aes|des|tripledes)(?:-(\d+))?-(ecb|cbc|cfb|ofb|ctr)$/i.exec(String(mode))
  if (!m) throw new Error(`aesEncrypt: unsupported mode "${mode}"`)
  const algo = CIPHER_MAP[m[1].toLowerCase()]
  const jsMode = MODE_MAP[m[3].toLowerCase()]
  const keyWA = wordArrayFromBuffer(toBuffer(key))
  const opts = { mode: jsMode, padding: cryptoJs.pad.Pkcs7 }
  if (m[3].toLowerCase() !== 'ecb' && iv != null) opts.iv = wordArrayFromBuffer(toBuffer(iv))
  const encrypted = algo.encrypt(wordArrayFromBuffer(toBuffer(buffer)), keyWA, opts)
  return bufferFromWordArray(encrypted.ciphertext)
}

// ── RSA（RSA_NO_PADDING：左零填充到模长后直接幂运算）────
const b64ToBuf = (b64) => Buffer.from(b64.replace(/-+BEGIN[^-]+-+|-+END[^-]+-+|\s+/g, ''), 'base64')
const hexToBuf = (hex) => Buffer.from(hex.replace(/[^0-9a-fA-F]/g, ''), 'hex')

// 最小 ASN.1 DER 解析：返回 { tag, content } 节点树
const derParse = (buf) => {
  const readNode = (pos) => {
    const tag = buf[pos]
    let len = buf[pos + 1]
    let contentStart = pos + 2
    if (len & 0x80) {
      const n = len & 0x7f
      len = 0
      for (let i = 0; i < n; i++) len = len * 256 + buf[pos + 2 + i]
      contentStart = pos + 2 + n
    }
    return {
      tag,
      content: buf.subarray(contentStart, contentStart + len),
      next: contentStart + len,
    }
  }
  const walk = (pos, end, out) => {
    while (pos < end) {
      const node = readNode(pos)
      out.push(node)
      walk(node.content[0] === undefined ? end : node.next, node.next, out) // 防御：仅一层
      pos = node.next
      break // 只取第一个孩子（顶层 SEQUENCE）
    }
  }
  const nodes = []
  let pos = 0
  while (pos < buf.length) {
    const node = readNode(pos)
    nodes.push(node)
    pos = node.next
  }
  // 递归展开容器
  const expand = (node, depth = 0) => {
    if (depth > 6 || node.tag === 0x03 || node.tag === 0x04 || (node.tag & 0x20) === 0) return [node]
    const children = []
    let pos = 0
    while (pos < node.content.length) {
      const child = readNode2(node.content, pos)
      children.push(...expand(child, depth + 1))
      pos = child.next
    }
    return children
  }
  const readNode2 = (b, pos) => {
    const tag = b[pos]
    let len = b[pos + 1]
    let contentStart = pos + 2
    if (len & 0x80) {
      const n = len & 0x7f
      len = 0
      for (let i = 0; i < n; i++) len = len * 256 + b[pos + 2 + i]
      contentStart = pos + 2 + n
    }
    return { tag, content: b.subarray(contentStart, contentStart + len), next: contentStart + len }
  }
  return nodes.flatMap(n => expand(n))
}

// 递归展平 DER：容器节点（tag&0x20）继续下钻，BIT STRING 跳过首字节后下钻
const derFlatten = (buf, out = []) => {
  let pos = 0
  while (pos + 1 < buf.length) {
    const tag = buf[pos]
    let len = buf[pos + 1]
    let cs = pos + 2
    if (len & 0x80) {
      const n = len & 0x7f
      len = 0
      for (let i = 0; i < n; i++) len = len * 256 + buf[pos + 2 + i]
      cs = pos + 2 + n
    }
    if (cs + len > buf.length) break
    const content = buf.subarray(cs, cs + len)
    if (tag & 0x20) {
      derFlatten(content, out)
    } else if (tag === 0x03 && content.length > 0) {
      derFlatten(content.subarray(1), out) // BIT STRING：首字节是 unused bits
    } else {
      out.push({ tag, content })
    }
    pos = cs + len
  }
  return out
}

const parseRsaPublicKey = (key) => {
  let der
  if (typeof key === 'string') {
    der = key.includes('-----') || /^[A-Za-z0-9+/=\s]+$/.test(key.slice(0, 64)) ? b64ToBuf(key) : hexToBuf(key)
  } else {
    der = toBuffer(key)
  }
  const nodes = derFlatten(der)
  // 取最后两个 INTEGER：模数 n 在前、公开指数 e 在后
  const ints = nodes.filter(n => n.tag === 0x02 && n.content.length >= 3)
  if (ints.length < 2) throw new Error('rsaEncrypt: cannot parse public key')
  const n = Buffer.from(ints[ints.length - 2].content)
  const e = Buffer.from(ints[ints.length - 1].content)
  return { n: BigInt('0x' + n.toString('hex')), e: BigInt('0x' + e.toString('hex')) }
}

const bigIntToBuf = (v, len) => {
  let hex = v.toString(16)
  if (hex.length % 2) hex = '0' + hex
  const raw = Buffer.from(hex, 'hex')
  const out = Buffer.alloc(len)
  raw.copy(out, len - raw.length)
  return out
}

export const rsaEncrypt = (buffer, key) => {
  const { n, e } = parseRsaPublicKey(key)
  const blockLen = (n.toString(2).length + 7) >> 3
  if (blockLen < 8) throw new Error('rsaEncrypt: invalid key')
  const data = toBuffer(buffer)
  if (data.length > blockLen) throw new Error('rsaEncrypt: data too long')
  const block = Buffer.alloc(blockLen)
  data.copy(block, blockLen - data.length)
  const m = BigInt('0x' + block.toString('hex'))
  let result = 1n
  let base = m % n
  let exp = e
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % n
    base = (base * base) % n
    exp >>= 1n
  }
  return bigIntToBuf(result, blockLen)
}

// ── 其它 utils ────────────────────────────────────────
export const randomBytes = (size) => {
  const arr = new Uint8Array(size)
  globalThis.crypto.getRandomValues(arr)
  return Buffer.from(arr)
}

export const md5 = (str) => {
  if (typeof str === 'string') return cryptoJs.MD5(str).toString()
  return cryptoJs.MD5(wordArrayFromBuffer(toBuffer(str))).toString()
}

export const bufToString = (buf, format) => {
  const b = toBuffer(buf)
  if (format === 'hex') return b.toString('hex')
  if (format === 'base64') return b.toString('base64')
  return b.toString('utf8')
}

export const inflate = async(buf) => {
  const ds = new DecompressionStream('deflate')
  const resp = new Response(new Blob([toBuffer(buf)]).stream().pipeThrough(ds))
  return Buffer.from(await resp.arrayBuffer())
}

export const deflate = async(data) => {
  const cs = new CompressionStream('deflate')
  const resp = new Response(new Blob([toBuffer(data)]).stream().pipeThrough(cs))
  return Buffer.from(await resp.arrayBuffer())
}

export const ungzip = async(buf) => {
  const ds = new DecompressionStream('gzip')
  const resp = new Response(new Blob([toBuffer(buf)]).stream().pipeThrough(ds))
  return Buffer.from(await resp.arrayBuffer())
}
