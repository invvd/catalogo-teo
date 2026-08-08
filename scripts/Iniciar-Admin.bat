@echo off
title Panel de administracion - Catalogo
cd /d "%~dp0"
echo Iniciando el panel de administracion...
start "Servidor - NO CERRAR" "node\node.exe" "admin\server.mjs"
timeout /t 2 /nobreak >nul
start "" "http://localhost:4322"
echo.
echo Listo. Se abrio en tu navegador.
echo No cierres la otra ventana negra "Servidor - NO CERRAR": ahi corre el programa.
echo Cuando termines de cargar productos, cerra esa ventana negra para apagarlo.
echo.
pause
