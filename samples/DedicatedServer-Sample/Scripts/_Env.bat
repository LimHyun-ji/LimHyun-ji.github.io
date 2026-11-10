@echo off
rem UE_ROOT 환경변수에 엔진 루트(예: C:\UnrealEngine 또는 C:\Program Files\Epic Games\UE_5.5)를 지정한다.
if "%UE_ROOT%"=="" (
  echo [NetSample] Set UE_ROOT to your engine root folder first.
  exit /b 1
)
set "UE_EDITOR=%UE_ROOT%\Engine\Binaries\Win64\UnrealEditor.exe"
set "PROJECT=%~dp0..\NetSample.uproject"
set "MAP=/Game/Maps/NetSample"
