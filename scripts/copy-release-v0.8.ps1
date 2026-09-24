$srcApk = 'apps\mobile\android\app\build\outputs\apk\release\app-release.apk'
$srcAab = 'apps\mobile\android\app\build\outputs\bundle\release\app-release.aab'
$dstDir = 'release-v0.8'

if (-not (Test-Path $dstDir)) {
    New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
}

Copy-Item $srcApk -Destination (Join-Path $dstDir 'app-release.apk') -Force
Copy-Item $srcAab -Destination (Join-Path $dstDir 'app-release.aab') -Force

$apkHash = (Get-FileHash (Join-Path $dstDir 'app-release.apk') -Algorithm SHA256).Hash
$aabHash = (Get-FileHash (Join-Path $dstDir 'app-release.aab') -Algorithm SHA256).Hash
$apkSize = (Get-Item (Join-Path $dstDir 'app-release.apk')).Length
$aabSize = (Get-Item (Join-Path $dstDir 'app-release.aab')).Length

Write-Host "APK_HASH: $apkHash"
Write-Host "APK_SIZE: $apkSize bytes"
Write-Host "AAB_HASH: $aabHash"
Write-Host "AAB_SIZE: $aabSize bytes"
