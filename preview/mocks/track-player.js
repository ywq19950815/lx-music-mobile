// react-native-track-player 通用 stub：所有方法返回 resolved Promise，状态常量齐全
const TrackPlayer = new Proxy({}, {
  get(_t, prop) {
    if (prop === 'addEventListener') return () => ({ remove: () => {} })
    return (...args) => Promise.resolve()
  },
})

export const State = {
  None: 0, Ready: 2, Playing: 3, Paused: 2, Stopped: 1, Buffering: 6, Loading: 1, Connecting: 8, End: 0, Error: 10,
}
export const Event = {
  PlaybackProgressUpdated: 'playback-progress-updated',
  PlaybackState: 'playback-state',
  PlaybackError: 'playback-error',
  PlaybackQueueEnded: 'playback-queue-ended',
  PlaybackTrackChanged: 'playback-track-changed',
  RemotePlay: 'remote-play', RemotePause: 'remote-pause', RemoteNext: 'remote-next', RemotePrevious: 'remote-previous', RemoteDuck: 'remote-duck',
}
export const Capability = {
  Play: 1, Pause: 2, Stop: 4, SeekTo: 8, Skip: 16, SkipToNext: 32, SkipToPrevious: 64, JumpForward: 128, JumpBackward: 256,
}
export const RepeatMode = { Off: 0, Track: 1, Queue: 2 }

export default TrackPlayer
