@echo off
REM Preview the portfolio (port 5500) together with the project demos (port 5510).
REM Double-click this file, or run:  serve.cmd --portfolio-port 5500 --projects-port 5510
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python tidak ditemukan di PATH. Install Python dulu, atau jalankan server dari VS Code
  echo dengan membuka folder "Agna Files" ^(induk^), bukan folder "Portofolio 2".
  pause
  exit /b 1
)
python "%~dp0serve.py" %*
pause
