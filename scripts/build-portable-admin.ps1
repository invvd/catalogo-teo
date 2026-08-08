# Genera catalogo-admin-portable-win.zip: el panel de admin + Node.js
# embebido (sin instalador), listo para mandarle a alguien que no tiene
# Node instalado. Correr desde la raiz del proyecto:
#   powershell -ExecutionPolicy Bypass -File scripts\build-portable-admin.ps1
$ErrorActionPreference = "Stop"

$NodeVersion = "v24.16.0"
$Root = (Resolve-Path "$PSScriptRoot\..").Path
$Build = Join-Path $Root ".build"
$Stage = Join-Path $Build "catalogo-admin-portable"
$ZipPath = Join-Path $Root "catalogo-admin-portable-win.zip"

if (Test-Path $Build) { Remove-Item $Build -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Stage | Out-Null

Write-Host "Descargando Node.js $NodeVersion portátil..."
$nodeZip = Join-Path $Build "node-portable.zip"
Invoke-WebRequest -Uri "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-win-x64.zip" -OutFile $nodeZip
Expand-Archive -Path $nodeZip -DestinationPath $Build -Force
Move-Item (Join-Path $Build "node-$NodeVersion-win-x64") (Join-Path $Stage "node") -Force

Write-Host "Copiando archivos del admin..."
New-Item -ItemType Directory -Force -Path (Join-Path $Stage "admin") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Stage "src\lib") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Stage "public\products") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Stage "data") | Out-Null
Copy-Item (Join-Path $Root "admin\server.mjs") (Join-Path $Stage "admin\server.mjs") -Force
Copy-Item (Join-Path $Root "src\lib\db.mjs") (Join-Path $Stage "src\lib\db.mjs") -Force
Copy-Item (Join-Path $Root "scripts\Iniciar-Admin.bat") (Join-Path $Stage "Iniciar-Admin.bat") -Force
Copy-Item (Join-Path $Root "scripts\LEEME-admin-portable.txt") (Join-Path $Stage "LEEME.txt") -Force

Write-Host "Instalando dependencias (express, multer)..."
Push-Location $Root
npm install --omit=dev --no-audit --no-fund --prefix $Stage express multer | Out-Null
Pop-Location

Write-Host "Comprimiendo..."
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path (Join-Path $Stage "*") -DestinationPath $ZipPath -CompressionLevel Optimal

Remove-Item $Build -Recurse -Force
Write-Host "Listo: $ZipPath"
