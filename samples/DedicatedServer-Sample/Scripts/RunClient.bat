@echo off
rem 클라이언트 접속. 사용 예: RunClient.bat            (로컬 서버)
rem                         RunClient.bat 192.168.0.10 (다른 PC의 서버)
call "%~dp0_Env.bat" || exit /b 1
set "HOST=%1"
if "%HOST%"=="" set "HOST=127.0.0.1"
"%UE_EDITOR%" "%PROJECT%" %HOST%:7777 -game -log -windowed -ResX=1280 -ResY=720 %2 %3 %4 %5
