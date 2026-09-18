Add-Type -AssemblyName System.Drawing

$outDir = Join-Path (Get-Location) "image-examples"
if (!(Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

function New-Brush($hex) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function New-Pen($hex, $width = 2) {
  return New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($hex), $width)
}

function New-RoundedPath($x, $y, $width, $height, $radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2
  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Fill-RoundedRect($graphics, $brush, $x, $y, $width, $height, $radius) {
  $path = New-RoundedPath $x $y $width $height $radius
  $graphics.FillPath($brush, $path)
  $path.Dispose()
}

function Draw-RoundedRect($graphics, $pen, $x, $y, $width, $height, $radius) {
  $path = New-RoundedPath $x $y $width $height $radius
  $graphics.DrawPath($pen, $path)
  $path.Dispose()
}

function Draw-BaseCard($fileName, $title, $subtitle, $tag, $drawBody) {
  $width = 1200
  $height = 627
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $bg = New-Brush "#F6F8FB"
  $card = New-Brush "#FFFFFF"
  $navy = New-Brush "#102A43"
  $muted = New-Brush "#5F6F82"
  $teal = New-Brush "#0F766E"
  $softTeal = New-Brush "#DFF5F0"
  $border = New-Pen "#D6E0EA" 2
  $tealPen = New-Pen "#0F766E" 4

  $graphics.FillRectangle($bg, 0, 0, $width, $height)
  Fill-RoundedRect $graphics $card 48 42 1104 543 28
  Draw-RoundedRect $graphics $border 48 42 1104 543 28

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 44, [System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular)
  $tagFont = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)

  $graphics.DrawString($title.ToUpper(), $titleFont, $navy, 92, 86)
  $graphics.DrawString($subtitle, $subtitleFont, $muted, 96, 154)

  Fill-RoundedRect $graphics $softTeal 92 500 360 46 23
  $graphics.DrawString($tag, $tagFont, $teal, 118, 508)

  & $drawBody $graphics $navy $muted $teal $tealPen

  $path = Join-Path $outDir $fileName
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$bodyFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
$boldFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
$monoFont = New-Object System.Drawing.Font("Consolas", 21, [System.Drawing.FontStyle]::Regular)

Draw-BaseCard "sql-joins-card.png" "SQL Joins" "Connect tables. Find answers." "Beginner SQL | Learning in Public" {
  param($g, $navy, $muted, $teal, $tealPen)
  $linePen = New-Pen "#B6C7D8" 2
  $boxBrush = New-Brush "#EEF6FF"
  $keyBrush = New-Brush "#DFF5F0"
  Fill-RoundedRect $g $boxBrush 120 240 280 160 18
  Fill-RoundedRect $g $boxBrush 800 240 280 160 18
  $g.DrawString("students", $boldFont, $navy, 154, 260)
  $g.DrawString("id | name", $monoFont, $muted, 154, 316)
  $g.DrawString("marks", $boldFont, $navy, 842, 260)
  $g.DrawString("id | score", $monoFont, $muted, 842, 316)
  $g.DrawLine($tealPen, 400, 320, 800, 320)
  Fill-RoundedRect $g $keyBrush 510 292 180 56 20
  $g.DrawString("JOIN KEY", $boldFont, $teal, 548, 302)
}

Draw-BaseCard "python-pandas-card.png" "Python Pandas" "Clean messy data step by step." "Python | Data Cleaning" {
  param($g, $navy, $muted, $teal, $tealPen)
  $panel = New-Brush "#102A43"
  $codeBrush = New-Brush "#E8F3FF"
  $green = New-Brush "#DFF5F0"
  Fill-RoundedRect $g $panel 120 230 520 250 18
  $g.DrawString("import pandas as pd", $monoFont, $codeBrush, 158, 266)
  $g.DrawString("df.dropna()", $monoFont, $codeBrush, 158, 318)
  $g.DrawString("df.groupby('city').sum()", $monoFont, $codeBrush, 158, 370)
  Fill-RoundedRect $g $green 740 262 320 70 18
  Fill-RoundedRect $g $green 740 368 320 70 18
  $g.DrawString("Raw data", $boldFont, $navy, 838, 282)
  $g.DrawString("Clean insight", $boldFont, $teal, 812, 388)
  $g.DrawLine($tealPen, 900, 336, 900, 366)
}

Draw-BaseCard "power-bi-card.png" "Power BI Dashboard" "One question. Clear visuals." "Power BI | Analytics Portfolio" {
  param($g, $navy, $muted, $teal, $tealPen)
  $panel = New-Brush "#F0F5FA"
  $accent = New-Brush "#0F766E"
  Fill-RoundedRect $g $panel 120 220 960 250 20
  $g.DrawString("Revenue", $boldFont, $navy, 160, 250)
  $g.DrawString("Customers", $boldFont, $navy, 490, 250)
  $g.DrawString("Growth", $boldFont, $navy, 835, 250)
  foreach ($i in 0..5) {
    $x = 170 + ($i * 48)
    $h = 40 + (($i % 3) * 28)
    $g.FillRectangle($accent, $x, 405 - $h, 28, $h)
  }
  $g.DrawLine($tealPen, 500, 400, 720, 330)
  $g.DrawLine($tealPen, 720, 330, 865, 365)
  Fill-RoundedRect $g $accent 850 340 130 80 16
  $white = New-Brush "#FFFFFF"
  $g.DrawString("+18%", $titleFont, $white, 866, 348)
}

Draw-BaseCard "ml-train-test-card.png" "Train-Test Split" "Test on data the model has not seen." "Machine Learning | Beginner ML" {
  param($g, $navy, $muted, $teal, $tealPen)
  $track = New-Brush "#E8EEF5"
  $train = New-Brush "#0F766E"
  $test = New-Brush "#F59E0B"
  $g.DrawString("Dataset", $boldFont, $navy, 138, 246)
  Fill-RoundedRect $g $track 140 292 900 50 24
  Fill-RoundedRect $g $train 140 292 650 50 24
  Fill-RoundedRect $g $test 790 292 250 50 24
  $g.DrawString("TRAIN", $boldFont, $navy, 330, 382)
  $g.DrawString("TEST", $boldFont, $navy, 848, 382)
  $g.DrawString("Learn patterns", $bodyFont, $muted, 270, 430)
  $g.DrawString("Check performance", $bodyFont, $muted, 790, 430)
}

Draw-BaseCard "deep-learning-card.png" "Deep Learning Basics" "Layers learn patterns from examples." "AI | Neural Networks" {
  param($g, $navy, $muted, $teal, $tealPen)
  $nodeBrush = New-Brush "#DFF5F0"
  $nodePen = New-Pen "#0F766E" 4
  $xs = @(180, 420, 660, 900)
  $ys = @(260, 330, 400)
  foreach ($x in $xs) {
    foreach ($y in $ys) {
      if ($x -eq 900 -and $y -ne 330) { continue }
      $g.FillEllipse($nodeBrush, $x, $y, 54, 54)
      $g.DrawEllipse($nodePen, $x, $y, 54, 54)
    }
  }
  foreach ($y1 in $ys) {
    foreach ($y2 in $ys) {
      $g.DrawLine((New-Pen "#B6C7D8" 2), 234, $y1 + 27, 420, $y2 + 27)
      $g.DrawLine((New-Pen "#B6C7D8" 2), 474, $y1 + 27, 660, $y2 + 27)
    }
  }
  foreach ($y1 in $ys) { $g.DrawLine((New-Pen "#B6C7D8" 2), 714, $y1 + 27, 900, 357) }
  $g.DrawString("Input", $bodyFont, $muted, 180, 470)
  $g.DrawString("Hidden layers", $bodyFont, $muted, 475, 470)
  $g.DrawString("Output", $bodyFont, $muted, 886, 470)
}

Write-Host "Generated PNG examples in $outDir"
