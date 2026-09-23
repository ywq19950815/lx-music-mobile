export default async(setting: LX.AppSetting) => {
  // 「使用动态背景」开关已移除（UI 改为固定的 Neo-Brutalism 风格），
  // 跟随歌曲封面换背景的逻辑一并下线，避免留下永远不会生效的监听。
  void setting
}
