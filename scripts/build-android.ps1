param(
    [ValidateSet("bundleRelease", "assembleRelease", "allRelease", "assembleDebug")]
    [string]$Target = "allRelease"
)

# WildPrice Hunter Android Build Automation Script
$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
Write-Host "[WildPrice Hunter] Starting Android build (Target: $Target)..." -ForegroundColor Cyan

# Set JDK path
$jdkPath = "C:\Users\Arslan\.gradle\jdks\eclipse_adoptium-17-amd64-windows\jdk-17.0.20.1+1"
if (Test-Path $jdkPath) {
    $env:JAVA_HOME = $jdkPath
}
$env:ANDROID_HOME = "C:\Users\Arslan\AppData\Local\Android\Sdk"

# Setup virtual drive W: if needed to circumvent Windows MAX_PATH (260 char limit for CMake/Ninja)
$hasW = Get-PSDrive -Name "W" -ErrorAction SilentlyContinue
if (-not $hasW) {
    subst W: "$workspaceRoot"
}

# Pre-bundle JavaScript & Assets
Write-Host "[WildPrice Hunter] Generating React Native production JavaScript bundle and assets..." -ForegroundColor Cyan
Push-Location "$workspaceRoot\apps\mobile"
try {
    $assetsDir = "$workspaceRoot\apps\mobile\android\app\src\main\assets"
    if (-not (Test-Path $assetsDir)) {
        New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
    }
    node "$workspaceRoot\node_modules\react-native\cli.js" bundle `
        --platform android `
        --dev false `
        --entry-file index.js `
        --bundle-output "$assetsDir\index.android.bundle" `
        --assets-dest "$workspaceRoot\apps\mobile\android\app\src\main\res"
    Write-Host "[WildPrice Hunter] React Native bundle generated successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

# Execute Gradle Build on W:
Push-Location "W:\apps\mobile\android"
try {
    if ($Target -eq "allRelease") {
        Write-Host "[WildPrice Hunter] Building Play Store App Bundle (.aab)..." -ForegroundColor Cyan
        .\gradlew.bat bundleRelease
        Write-Host "[WildPrice Hunter] Building Release APK (.apk)..." -ForegroundColor Cyan
        .\gradlew.bat assembleRelease
    } elseif ($Target -eq "bundleRelease") {
        .\gradlew.bat bundleRelease
    } elseif ($Target -eq "assembleRelease") {
        .\gradlew.bat assembleRelease
    } else {
        .\gradlew.bat assembleDebug
    }

    Write-Host "[WildPrice Hunter] Android build completed successfully!" -ForegroundColor Green
    if (Test-Path "W:\apps\mobile\android\app\build\outputs\bundle\release\app-release.aab") {
        Write-Host "Play Store AAB: W:\apps\mobile\android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Yellow
    }
    if (Test-Path "W:\apps\mobile\android\app\build\outputs\apk\release\app-release.apk") {
        Write-Host "Release APK:    W:\apps\mobile\android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}
