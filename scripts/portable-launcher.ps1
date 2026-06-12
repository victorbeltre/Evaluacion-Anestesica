$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 8765
$Prefix = "http://127.0.0.1:$Port/"

Add-Type -AssemblyName System.Web

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($Prefix)
$listener.Start()

Start-Process $Prefix
Write-Host "Hoja Preanestesica HOSGEDOPOL portable"
Write-Host "Abierto en $Prefix"
Write-Host "Cierra esta ventana para detener el servidor local."

function Get-MimeType($Path) {
  switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".js" { "text/javascript; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".png" { "image/png"; break }
    ".jpg" { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".svg" { "image/svg+xml"; break }
    default { "application/octet-stream" }
  }
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = [System.Web.HttpUtility]::UrlDecode($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }

    $filePath = Join-Path $Root $path
    $resolvedRoot = (Resolve-Path $Root).Path
    $resolvedFile = if (Test-Path $filePath -PathType Leaf) { (Resolve-Path $filePath).Path } else { "" }

    if ($resolvedFile -and $resolvedFile.StartsWith($resolvedRoot)) {
      $bytes = [IO.File]::ReadAllBytes($resolvedFile)
      $context.Response.ContentType = Get-MimeType $resolvedFile
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $context.Response.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes("No encontrado")
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }

    $context.Response.OutputStream.Close()
  }
} finally {
  $listener.Stop()
}
