package cn.toside.music.mobile.utils;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

/**
 * 沉浸式系统栏（顶部状态栏 + 底部导航栏/手势条「小白条」）统一控制。
 *
 * <h3>为什么需要这个类</h3>
 * react-native-navigation 7.x 在应用页面 options 时会调用
 * {@code SystemUiUtils.showNavigationBar()} / {@code showStatusBar()}，它们的实现是
 * {@code WindowCompat.setDecorFitsSystemWindows(window, true)}
 * （见 RNN 源码 lib/android/app/src/main/java/com/reactnativenavigation/utils/SystemUiUtils.kt），
 * 即「窗口收缩到两条系统栏之间」。于是：
 * <ul>
 *   <li>应用内容无法绘制到状态栏 / 底部手势条下面；</li>
 *   <li>两条系统栏区域只能露出系统底色（深色模式下是深灰），
 *       与新粗野主义的浅色界面严重割裂，「状态栏沉浸」永远做不出来。</li>
 * </ul>
 * 而 RNN 的 navigationBar 选项只有 visible / backgroundColor 两个字段，
 * 没有 drawBehind，无法从 JS 打开 edge-to-edge。
 *
 * <h3>做法</h3>
 * 在 RNN 应用 options 之后（由 JS 侧 {@code core/systemBars.ts} 在每次页面出现时调用，
 * 以及 MainActivity 在 onCreate/onResume 兜底调用）重新执行本类：
 * <ol>
 *   <li>{@code setDecorFitsSystemWindows(window, false)} —— 重新打开 edge-to-edge；</li>
 *   <li>两条系统栏颜色设为全透明；</li>
 *   <li>关闭 Android 10+ 的对比度蒙层，否则透明导航栏上会被系统糊一层灰；</li>
 *   <li>图标颜色跟随主题（亮底 → 深色图标），并保持系统栏可见（只透明、不隐藏）。</li>
 * </ol>
 * 同时把两条系统栏的实际高度（dp）回传给 JS，供头部 / 底部菜单栏留白使用。
 */
public final class SystemBars {

  private SystemBars() {}

  /** 记住上一次设置的图标明暗，供 Activity 在 onResume 等时机兜底重放。 */
  private static volatile boolean lastDarkIcons = true;

  /** 用最近一次的图标明暗配置重新应用一遍（MainActivity 在 onCreate / onResume 兜底用）。 */
  public static void applyImmersive(Activity activity) {
    applyImmersive(activity, lastDarkIcons);
  }

  /**
   * 打开沉浸式：内容绘制到两条系统栏之下，系统栏透明。
   *
   * @param activity  当前 Activity，可为 null（为 null 时直接忽略）
   * @param darkIcons true = 系统栏图标用深色（适用于浅色界面，本项目默认场景）
   */
  public static void applyImmersive(Activity activity, boolean darkIcons) {
    lastDarkIcons = darkIcons;
    if (activity == null) return;
    Window window = activity.getWindow();
    if (window == null) return;
    View decor = window.getDecorView();
    if (decor == null) return;

    // 1. edge-to-edge：内容铺满整屏，绘制到状态栏与手势条之下
    WindowCompat.setDecorFitsSystemWindows(window, false);

    // 2. 两条系统栏全透明
    window.setStatusBarColor(Color.TRANSPARENT);
    window.setNavigationBarColor(Color.TRANSPARENT);

    // 3. Android 10+ 默认会给「透明系统栏」自动加一层对比度蒙层（灰色渐变），
    //    不关掉的话底部手势条会是灰的，看着仍然不沉浸
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.setStatusBarContrastEnforced(false);
      window.setNavigationBarContrastEnforced(false);
    }

    // 4. 图标颜色 + 保持系统栏可见
    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decor);
    if (controller != null) {
      controller.setAppearanceLightStatusBars(darkIcons);
      controller.setAppearanceLightNavigationBars(darkIcons);
      // 只做「透明化」，不隐藏：三键导航的按键 / 手势条都要留在屏幕上
      controller.show(WindowInsetsCompat.Type.statusBars());
      controller.show(WindowInsetsCompat.Type.navigationBars());
    }
  }

  /**
   * 读取状态栏 / 底部导航栏的实际高度，单位 dp（RN 的逻辑像素）。
   * 供 JS 侧给页面头部、底部菜单栏留出安全间距。
   */
  public static WritableMap getInsetsDp(Activity activity) {
    WritableMap map = Arguments.createMap();

    int statusBarPx = 0;
    int navigationBarPx = 0;
    float density = 1f;

    if (activity != null) {
      density = activity.getResources().getDisplayMetrics().density;
      if (density <= 0f) density = 1f;

      WindowInsetsCompat insets = null;
      try {
        View decor = activity.getWindow().getDecorView();
        if (decor != null) insets = ViewCompat.getRootWindowInsets(decor);
      } catch (Throwable ignored) {
        // 极少数 ROM 在窗口还没 attach 时会抛异常，走下面的资源兜底
      }

      if (insets != null) {
        Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
        statusBarPx = bars.top;
        navigationBarPx = bars.bottom;
      }

      if (statusBarPx <= 0) {
        int resId = activity.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resId > 0) statusBarPx = activity.getResources().getDimensionPixelSize(resId);
      }
    }

    map.putDouble("statusBarHeight", statusBarPx / (double) density);
    map.putDouble("navigationBarHeight", navigationBarPx / (double) density);
    return map;
  }
}
