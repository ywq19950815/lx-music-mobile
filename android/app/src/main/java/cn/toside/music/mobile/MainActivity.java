package cn.toside.music.mobile;

import android.os.Bundle;

import androidx.annotation.Nullable;

import com.reactnativenavigation.NavigationActivity;

import cn.toside.music.mobile.utils.SystemBars;

public class MainActivity extends NavigationActivity {

  /**
   * 沉浸式系统栏兜底。
   *
   * 真正的切换由 JS 侧 core/systemBars.ts 在每次页面出现（componentDidAppear）后触发，
   * 因为 RNN 应用页面 options 时会把窗口重新拉回非沉浸（setDecorFitsSystemWindows(true)），
   * 只有后置调用才抢得回来。这里在冷启动 / 回到前台时先铺好底，避免首帧出现深色缝隙。
   */
  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    SystemBars.applyImmersive(this, true);
  }

  @Override
  protected void onResume() {
    super.onResume();
    SystemBars.applyImmersive(this);
  }
}
