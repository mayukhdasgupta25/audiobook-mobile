#!/bin/bash
# Clean and rebuild script for fixing Worklets version mismatch

echo "Cleaning all caches and rebuilding..."

# Clear Metro bundler cache
echo "Clearing Metro cache..."
npx expo start --clear

# Remove node_modules and reinstall
echo "Removing node_modules..."
rm -rf node_modules
rm -rf package-lock.json

# Clear Expo cache
echo "Clearing Expo cache..."
rm -rf .expo
rm -rf .expo-shared

# Clear Android build cache
if [ -d "android" ]; then
    echo "Cleaning Android build..."
    cd android
    ./gradlew clean
    rm -rf .gradle
    rm -rf app/build
    cd ..
fi

# Clear iOS build cache
if [ -d "ios" ]; then
    echo "Cleaning iOS build..."
    cd ios
    rm -rf Pods
    rm -rf Podfile.lock
    rm -rf build
    cd ..
fi

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install --legacy-peer-deps

# Rebuild native modules
echo "Rebuilding native modules..."
npx expo prebuild --clean

echo "Clean and rebuild complete!"
echo "Now run: npx expo run:android or npx expo run:ios"

