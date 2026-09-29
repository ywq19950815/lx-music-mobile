// 预览专用：react-native-track-player 的真实音频实现（基于 HTMLAudioElement）
//
// 之前这里是「所有方法返回 resolved Promise」的空壳，导致预览里点了歌永远在
// 「歌曲链接获取中 / 播放中但没声音」。现在把队列、状态机、事件全部按 RNTP v2
// 的协议用 <audio> 实现一遍，让 App 的播放/暂停/切歌/进度/自动下一首逻辑能真跑。
//
// 与真机的差异：无通知栏、无缓存、无蓝牙歌词，其余行为保持一致。

export const State = {
  None: 0,
  Ready: 1,
  Playing: 2,
  Paused: 3,
  Stopped: 4,
  Buffering: 5,
  Connecting: 6,
}

export const Event = {
  PlaybackState: 'playback-state',
  PlaybackError: 'playback-error',
  PlaybackQueueEnded: 'playback-queue-ended',
  PlaybackTrackChanged: 'playback-track-changed',
  PlaybackMetadataReceived: 'playback-metadata-received',
  PlaybackProgressUpdated: 'playback-progress-updated',
  RemotePlay: 'remote-play',
  RemotePlayId: 'remote-play-id',
  RemotePlaySearch: 'remote-play-search',
  RemotePause: 'remote-pause',
  RemoteStop: 'remote-stop',
  RemoteSkip: 'remote-skip',
  RemoteNext: 'remote-next',
  RemotePrevious: 'remote-previous',
  RemoteJumpForward: 'remote-jump-forward',
  RemoteJumpBackward: 'remote-jump-backward',
  RemoteSeek: 'remote-seek',
  RemoteSetRating: 'remote-set-rating',
  RemoteDuck: 'remote-duck',
  RemoteLike: 'remote-like',
  RemoteDislike: 'remote-dislike',
  RemoteBookmark: 'remote-bookmark',
}

export const Capability = {
  Play: 1, Pause: 2, Stop: 4, SeekTo: 8, Skip: 16, SkipToNext: 32, SkipToPrevious: 64,
  JumpForward: 128, JumpBackward: 256, SetRating: 512, Like: 1024, Dislike: 2048, Bookmark: 4096,
}
export const RepeatMode = { Off: 0, Track: 1, Queue: 2 }
export const RatingType = { Heart: 'heart', ThumbsUpDown: 'thumbs-up-down', Percentage: 'percentage' }
export const TrackType = { Default: 'default', Dash: 'dash', Hls: 'hls', SmoothStreaming: 'smoothstreaming' }

// ── 内部状态 ──────────────────────────────────────────
const listeners = new Map() // event -> Set<handler>
let audio = null
let queue = []
let currentIndex = null
let playerState = State.None
let repeatMode = RepeatMode.Off
let volumeValue = 1
let rateValue = 1
let pendingPlay = false // 被浏览器自动播放策略拦下，等待用户手势后重试

const httpRxp = /^https?:\/\//i
const isPlayableUrl = (url) => typeof url === 'string' && httpRxp.test(url)

const emit = (event, payload) => {
  const set = listeners.get(event)
  if (!set) return
  for (const handler of [...set]) {
    try { handler(payload ?? {}) } catch (err) { console.warn('[track-player] listener error:', err) }
  }
}

const setState = (next) => {
  if (playerState === next) return
  playerState = next
  emit(Event.PlaybackState, { state: next })
}

const ensureAudio = () => {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'auto'
  // 部分音源 CDN 会校验 Referer，隐藏来源可显著提高可播率
  try { audio.referrerPolicy = 'no-referrer' } catch { /* 忽略 */ }
  audio.volume = volumeValue
  audio.playbackRate = rateValue

  audio.addEventListener('playing', () => { pendingPlay = false; setState(State.Playing) })
  audio.addEventListener('play', () => { pendingPlay = false })
  audio.addEventListener('pause', () => {
    // 只有真正处于播放/缓冲中才向暂停态回落，避免切歌过程中的抖动
    if (playerState == State.Playing || playerState == State.Buffering) setState(State.Paused)
  })
  audio.addEventListener('waiting', () => setState(State.Buffering))
  audio.addEventListener('loadstart', () => setState(State.Connecting))
  audio.addEventListener('canplay', () => {
    if (playerState == State.Connecting || playerState == State.Buffering) setState(State.Ready)
  })
  audio.addEventListener('error', () => {
    const code = audio?.error?.code
    // 切歌瞬间的中断不算错误（MEDIA_ELEMENT_ERROR: Format error / Aborted = 4）
    if (code === 4) return
    console.warn('[track-player] audio error', audio?.error)
    setState(State.Stopped)
    emit(Event.PlaybackError, { error: audio?.error?.message ?? 'playback error', code })
  })
  audio.addEventListener('ended', () => {
    if (repeatMode == RepeatMode.Track) {
      audio.currentTime = 0
      void audio.play().catch(() => {})
      return
    }
    const nextIndex = currentIndex == null ? null : currentIndex + 1
    if (nextIndex != null && nextIndex < queue.length) {
      const prevId = queue[currentIndex]?.id ?? null
      currentIndex = nextIndex
      void loadCurrent()
      emit(Event.PlaybackTrackChanged, {
        track: queue[nextIndex]?.id ?? null,
        nextTrack: null,
        prevTrack: prevId,
        position: 0,
      })
      return
    }
    setState(State.Stopped)
    emit(Event.PlaybackQueueEnded, { track: queue[currentIndex]?.id ?? null, position: 0 })
  })

  // 浏览器自动播放策略兜底：被拦下后，等用户下一次交互自动补播
  const unlock = () => {
    if (!pendingPlay) return
    pendingPlay = false
    void audio.play().catch(() => {})
  }
  document.addEventListener('pointerdown', unlock, true)
  document.addEventListener('keydown', unlock, true)

  return audio
}

// 载入当前曲目（不自动播放；是否播放由 App 显式调用 play() 决定）
const loadCurrent = async() => {
  const el = ensureAudio()
  const track = currentIndex == null ? null : queue[currentIndex]
  if (!track) {
    currentIndex = null
    setState(State.None)
    return
  }
  if (!isPlayableUrl(track.url)) {
    // 占位轨（defaultUrl / 本地占位）：不加载、不出声，交给 App 触发「播放结束→下一首」
    el.pause()
    try { el.removeAttribute('src'); el.load() } catch { /* 忽略 */ }
    setState(State.Stopped)
    return
  }
  if (el.src !== track.url) {
    el.src = track.url
    try { el.load() } catch { /* 忽略 */ }
  }
  setState(el.readyState >= 3 ? State.Ready : State.Connecting)
}

const TrackPlayer = {
  // ── 生命周期 ────────────────────────────────────────
  setupPlayer() {
    ensureAudio()
    return Promise.resolve()
  },
  updateOptions() { return Promise.resolve() },
  registerPlaybackService(factory) {
    try {
      const register = typeof factory === 'function' ? factory() : factory
      if (typeof register === 'function') void Promise.resolve(register())
    } catch (err) {
      console.warn('[track-player] registerPlaybackService error:', err)
    }
    return Promise.resolve()
  },
  destroy() {
    try { audio?.pause() } catch { /* 忽略 */ }
    queue = []
    currentIndex = null
    setState(State.None)
    return Promise.resolve()
  },

  // ── 队列 ────────────────────────────────────────────
  add(tracks, insertBeforeIndex) {
    const list = Array.isArray(tracks) ? tracks : [tracks]
    if (typeof insertBeforeIndex === 'number' && insertBeforeIndex >= 0 && insertBeforeIndex <= queue.length) {
      queue.splice(insertBeforeIndex, 0, ...list)
    } else {
      queue.push(...list)
    }
    return Promise.resolve()
  },
  remove(indices) {
    const list = (Array.isArray(indices) ? indices : [indices])
      .filter(i => typeof i === 'number')
      .sort((a, b) => b - a)
    for (const index of list) {
      if (index < 0 || index >= queue.length) continue
      queue.splice(index, 1)
      if (currentIndex == null) continue
      if (index < currentIndex) currentIndex -= 1
      else if (index === currentIndex) currentIndex = queue.length ? Math.min(currentIndex, queue.length - 1) : null
    }
    return Promise.resolve()
  },
  skip(index) {
    if (typeof index !== 'number' || index < 0 || index >= queue.length) return Promise.resolve()
    currentIndex = index
    return loadCurrent()
  },
  skipToNext() {
    if (currentIndex == null) return Promise.resolve()
    return TrackPlayer.skip(Math.min(currentIndex + 1, queue.length - 1))
  },
  skipToPrevious() {
    if (currentIndex == null) return Promise.resolve()
    return TrackPlayer.skip(Math.max(currentIndex - 1, 0))
  },
  reset() {
    try { audio?.pause() } catch { /* 忽略 */ }
    queue = []
    currentIndex = null
    setState(State.None)
    return Promise.resolve()
  },
  getQueue() { return Promise.resolve([...queue]) },
  getTrack(index) { return Promise.resolve(index != null ? (queue[index] ?? null) : null) },
  getCurrentTrack() { return Promise.resolve(currentIndex) },
  updateMetadataForTrack(index, metadata) {
    if (index != null && queue[index]) Object.assign(queue[index], metadata)
    return Promise.resolve()
  },
  updateNowPlayingMetadata() { return Promise.resolve() },
  updateNowPlayingTitles() { return Promise.resolve() },

  // ── 播放控制 ────────────────────────────────────────
  async play() {
    const el = ensureAudio()
    if (currentIndex == null) return
    const track = queue[currentIndex]
    if (!track || !isPlayableUrl(track.url)) return
    try {
      if (el.src !== track.url) { el.src = track.url; el.load() }
      await el.play()
      pendingPlay = false
      setState(State.Playing)
    } catch (err) {
      // 自动播放被拦截：记住意图，用户下一次点击页面时自动补播
      if (err?.name === 'NotAllowedError') {
        pendingPlay = true
        setState(State.Paused)
        console.warn('[track-player] 浏览器拦截了自动播放，点击页面任意处即可开始播放')
        return
      }
      setState(State.Stopped)
      emit(Event.PlaybackError, { error: err?.message ?? 'play error' })
    }
  },
  pause() {
    try { audio?.pause() } catch { /* 忽略 */ }
    pendingPlay = false
    if (currentIndex != null) setState(State.Paused)
    return Promise.resolve()
  },
  stop() {
    try { if (audio) { audio.pause(); audio.currentTime = 0 } } catch { /* 忽略 */ }
    setState(State.Stopped)
    return Promise.resolve()
  },
  seekTo(seconds) {
    const el = ensureAudio()
    const time = Number(seconds) || 0
    try { el.currentTime = time } catch { /* 忽略 */ }
    return Promise.resolve()
  },
  setRate(rate) {
    rateValue = Number(rate) || 1
    try { ensureAudio().playbackRate = rateValue } catch { /* 忽略 */ }
    return Promise.resolve()
  },
  setVolume(vol) {
    volumeValue = Math.max(0, Math.min(1, Number(vol) ?? 1))
    try { ensureAudio().volume = volumeValue } catch { /* 忽略 */ }
    return Promise.resolve()
  },
  setRepeatMode(mode) {
    repeatMode = mode ?? RepeatMode.Off
    return Promise.resolve()
  },
  getRepeatMode() { return Promise.resolve(repeatMode) },
  getVolume() { return Promise.resolve(volumeValue) },
  getRate() { return Promise.resolve(rateValue) },

  // ── 查询 ────────────────────────────────────────────
  getState() { return Promise.resolve(playerState) },
  getPosition() { return Promise.resolve(audio ? audio.currentTime || 0 : 0) },
  getDuration() {
    const trackDuration = currentIndex == null ? 0 : Number(queue[currentIndex]?.duration) || 0
    const real = audio && Number.isFinite(audio.duration) ? audio.duration : 0
    return Promise.resolve(real || trackDuration || 0)
  },
  getBufferedPosition() {
    const el = audio
    if (!el || !el.buffered || !el.buffered.length) return Promise.resolve(0)
    return Promise.resolve(el.buffered.end(el.buffered.length - 1) || 0)
  },

  // ── 缓存（预览无缓存能力，返回安全值）─────────────────
  isCached() { return Promise.resolve(false) },
  getCacheSize() { return Promise.resolve(0) },
  clearCache() { return Promise.resolve() },

  // ── 事件 ────────────────────────────────────────────
  addEventListener(event, handler) {
    if (typeof handler !== 'function') return { remove() {} }
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(handler)
    return { remove() { listeners.get(event)?.delete(handler) } }
  },
}

// 旧版常量别名（个别遗留代码用 TrackPlayer.STATE_* 形式访问）
TrackPlayer.STATE = State
TrackPlayer.STATE_NONE = State.None
TrackPlayer.STATE_READY = State.Ready
TrackPlayer.STATE_PLAYING = State.Playing
TrackPlayer.STATE_PAUSED = State.Paused
TrackPlayer.STATE_STOPPED = State.Stopped
TrackPlayer.STATE_BUFFERING = State.Buffering
TrackPlayer.STATE_CONNECTING = State.Connecting

export default TrackPlayer
