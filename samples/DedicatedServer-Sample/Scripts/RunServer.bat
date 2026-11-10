@echo off
rem 에디터 바이너리로 데디케이티드 서버 실행 (런처 엔진에서도 동작).
rem 사용 예: RunServer.bat -Nodes=3000 -Bots=100 -NetOpt=0
call "%~dp0_Env.bat" || exit /b 1
"%UE_EDITOR%" "%PROJECT%" %MAP% -server -log -port=7777 %*
