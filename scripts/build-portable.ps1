$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$OutputRoot = Join-Path $Root "output"
$PortableDir = Join-Path $OutputRoot "preanes-hosgedopol-portable"
$ZipPath = Join-Path $OutputRoot "preanes-hosgedopol-portable.zip"

if (Test-Path $PortableDir) {
  Remove-Item -LiteralPath $PortableDir -Recurse -Force
}

if (Test-Path $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}

New-Item -ItemType Directory -Force -Path $PortableDir | Out-Null
Copy-Item -Path (Join-Path $Root "dist\*") -Destination $PortableDir -Recurse
Copy-Item -Path (Join-Path $PSScriptRoot "portable-launcher.ps1") -Destination (Join-Path $PortableDir "Abrir-HOSGEDOPOL.ps1")
Copy-Item -Path (Join-Path $Root "GOOGLE_SHEETS_SETUP.md") -Destination (Join-Path $PortableDir "GOOGLE_SHEETS_SETUP.md")

@"
Hoja Preanestesica HOSGEDOPOL - Version portable

Como abrir:
1. Clic derecho sobre Abrir-HOSGEDOPOL.ps1.
2. Seleccionar "Run with PowerShell" / "Ejecutar con PowerShell".
3. Se abrira el navegador en http://127.0.0.1:8765/
4. Cierra la ventana de PowerShell para detener la app.

Notas:
- Los datos se guardan localmente en el navegador del equipo.
- Para guardar online en Google Drive, configura Google Sheets dentro de la app con la URL de Apps Script y el token privado.
- No compartas el token privado por correo ni lo pegues en archivos publicos.
"@ | Set-Content -Path (Join-Path $PortableDir "LEEME.txt") -Encoding UTF8

Compress-Archive -Path (Join-Path $PortableDir "*") -DestinationPath $ZipPath

Write-Host "Portable creado en: $ZipPath"
