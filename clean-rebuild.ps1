# Clean and rebuild script for fixing Worklets version mismatch (PowerShell)

Write-Host "Cleaning all caches and rebuilding..." -ForegroundColor Green

# Clear Metro bundler cache
Write-Host "Clearing Metro cache..." -ForegroundColor Yellow
# Note: Run expo start --clear separately

# Remove node_modules and reinstall
Write-Host "Removing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}

# Clear Expo cache
Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force .expo
}
if (Test-Path ".expo-shared") {
    Remove-Item -Recurse -Force .expo-shared
}

# Clear Android build cache
if (Test-Path "android") {
    Write-Host "Cleaning Android build..." -ForegroundColor Yellow
    Set-Location android
    if (Test-Path "gradlew.bat") {
        .\gradlew.bat clean
    }
    if (Test-Path ".gradle") {
        Remove-Item -Recurse -Force .gradle
    }
    if (Test-Path "app\build") {
        Remove-Item -Recurse -Force app\build
    }
    Set-Location ..
}

# Clear iOS build cache (if on macOS)
if (Test-Path "ios") {
    Write-Host "Cleaning iOS build..." -ForegroundColor Yellow
    Set-Location ios
    if (Test-Path "Pods") {
        Remove-Item -Recurse -Force Pods
    }
    if (Test-Path "Podfile.lock") {
        Remove-Item -Force Podfile.lock
    }
    if (Test-Path "build") {
        Remove-Item -Recurse -Force build
    }
    Set-Location ..
}

# Reinstall dependencies
Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps

# Rebuild native modules
Write-Host "Rebuilding native modules..." -ForegroundColor Yellow
npx expo prebuild --clean

Write-Host "Clean and rebuild complete!" -ForegroundColor Green
Write-Host "Now run: npx expo run:android or npx expo run:ios" -ForegroundColor Cyan

