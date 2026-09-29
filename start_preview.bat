@echo off
chcp 65001 >nul
title 安迪音乐 - Web 预览 (React Native Web)
echo ============================================
echo   安迪音乐 真源码 Web 预览
echo   浏览器打开: http://127.0.0.1:5178
echo   (393x852 手机框，热更新：改 src 下代码即时生效)
echo   Ctrl+C 停止
echo ============================================
cd /d "%~dp0preview"
start "" http://127.0.0.1:5178
node node_modules\vite\bin\vite.js --config vite.config.js
pause
