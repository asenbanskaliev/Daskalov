# Requires preinstalled official whisper.cpp whisper-server, a reviewed licensed model and ffmpeg.
# Example: powershell -NoProfile -File scripts/start-whisper-local.ps1 -ServerBin D:\whisper.cpp\build\bin\Release\whisper-server.exe -Model D:\whisper.cpp\models\ggml-base.bin
param(
 [Parameter(Mandatory=$true)][string]$ServerBin,
 [Parameter(Mandatory=$true)][string]$Model,
 [ValidateRange(1024,65535)][int]$Port=8080,
 [switch]$Convert
)
$ErrorActionPreference='Stop'
if (-not (Test-Path -LiteralPath $ServerBin -PathType Leaf)) { throw "whisper-server no encontrado." }
if (-not (Test-Path -LiteralPath $Model -PathType Leaf)) { throw "Modelo Whisper no encontrado. Revisa su licencia y origen." }
if (-not $Convert) { Write-Warning "El navegador suele enviar WebM/Ogg; habilita -Convert y ten ffmpeg disponible." }
$argsList=@('-m',(Resolve-Path -LiteralPath $Model).Path,'--host','127.0.0.1','--port',"$Port",'-l','es','--inference-path','/inference')
if ($Convert) { $argsList+='--convert' }
Write-Output "Whisper local: http://127.0.0.1:$Port/; fija DASKALOV_WHISPER_URL con esa URL en el backend."
& (Resolve-Path -LiteralPath $ServerBin).Path @argsList
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
