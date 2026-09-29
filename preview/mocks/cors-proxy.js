// 预览专用：浏览器 CORS 兼容层
// 真机 RN 的 fetch 没有跨域概念，浏览器里所有音乐 API 请求都会被 CORS 拦截。
// 这里把跨域 fetch 改写为本地代理请求（配合 vite.config.js 的 preview-music-cors-proxy 中间件），
// 同时补齐 RN 特有的 resp.headers.map（musicSdk 依赖它读取 set-cookie 等）。
/* eslint-disable no-console */
;(function installPreviewFetchProxy() {
  const origFetch = globalThis.fetch
  if (typeof origFetch !== 'function' || globalThis.__previewFetchProxy) return
  globalThis.__previewFetchProxy = true

  globalThis.fetch = function (input, init = {}) {
    try {
      let url = ''
      let headers = init.headers
      if (typeof input === 'string' || input instanceof URL) {
        url = String(input)
      } else if (input && typeof input === 'object' && typeof input.url === 'string') {
        url = input.url
        if (init.headers == null && input.headers) headers = input.headers
      } else {
        return origFetch.call(this, input, init)
      }

      let abs = null
      try { abs = new URL(url, window.location.href) } catch { /* 非 http(s)，直通 */ }
      const isExternal = !!abs
        && (abs.protocol === 'http:' || abs.protocol === 'https:')
        && abs.origin !== window.location.origin

      let promise
      if (isExternal) {
        // 捕获原始请求头（含浏览器会丢弃的受限头如 User-Agent/Referer/Cookie，交给代理服务端注入）
        const headerObj = {}
        if (headers) {
          if (typeof headers.forEach === 'function') headers.forEach((v, k) => { headerObj[k] = v })
          else if (Array.isArray(headers)) headers.forEach(([k, v]) => { headerObj[k] = v })
          else Object.assign(headerObj, headers)
        }
        const method = String(init.method || (input && input.method) || 'GET').toUpperCase()
        const hasBody = init.body != null && method !== 'GET' && method !== 'HEAD'
        promise = origFetch('/__musicproxy', {
          method,
          headers: {
            'x-preview-proxy-url': abs.href,
            'x-preview-proxy-headers': encodeURIComponent(JSON.stringify(headerObj)),
            ...(hasBody ? { 'content-type': 'application/octet-stream' } : {}),
          },
          body: hasBody ? init.body : undefined,
          signal: init.signal,
        })
      } else {
        promise = origFetch.call(this, input, init)
      }

      return promise.then(resp => {
        // 补齐 RN 风格的 resp.headers.map（src/utils/request.js 消费它；kw 源读 set-cookie 提取 token）
        try {
          if (resp.headers && resp.headers.map === undefined) {
            const map = {}
            resp.headers.forEach((v, k) => { map[k.toLowerCase()] = v })
            if (typeof resp.headers.getSetCookie === 'function') {
              const sc = resp.headers.getSetCookie()
              if (sc && sc.length) map['set-cookie'] = sc.join('; ')
            }
            resp.headers.map = map
          }
        } catch (e) { /* 忽略补丁失败 */ }
        return resp
      })
    } catch (e) {
      return origFetch.call(this, input, init)
    }
  }
})()
