$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot '..\\assets\\icon_green.jpg'
$src = (Resolve-Path $src).Path

$outDir = Join-Path $PSScriptRoot '..\\extension\\icons'
$outDir = (Resolve-Path $outDir).Path

$img = [System.Drawing.Image]::FromFile($src)
try {
  foreach ($s in @(16, 48, 128)) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.DrawImage($img, 0, 0, $s, $s)
      $out = Join-Path $outDir ("icon$s.png")
      $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $g.Dispose()
      $bmp.Dispose()
    }
  }
} finally {
  $img.Dispose()
}

