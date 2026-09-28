@echo off
chcp 65001 >nul
echo ====================================================
echo        安迪音乐 Andy Music v0.2.0 一键安装脚本
echo ====================================================
echo.
set ADB="C:\Users\Administrator\Android\Sdk\platform-tools\adb.exe"
set APK="release\andy-music-mobile-v0.2.0-arm64-v8a.apk"

if not exist %APK% (
    echo [错误] 未找到安装包: %APK%
    pause
    exit /b 1
)

echo [1/3] 正在检测已连接的安卓设备...
%ADB% devices
echo.

echo [2/3] 自动解除 ColorOS/安卓 未知来源应用安装限制...
%ADB% shell settings put global install_non_market_apps 1 >nul 2>nul
%ADB% shell settings put secure install_non_market_apps 1 >nul 2>nul

echo [3/3] 正在推送并安装 v0.2.0 主力包到手机...
%ADB% install -r %APK%

if %ERRORLEVEL% equ 0 (
    echo.
    echo ====================================================
    echo [成功] 安迪音乐 v0.2.0 已成功安装到手机！
    echo ====================================================
) else (
    echo.
    echo ====================================================
    echo [提示] 如果安装失败，请确认手机已连接且开启「USB调试」，
    echo 并在手机屏幕上点击「允许通过 USB 安装应用」。
    echo ====================================================
)

echo.
pause
