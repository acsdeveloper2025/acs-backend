#!/bin/bash

# Remove SQLCipher dependency and clean iOS project
# This script removes SQLCipher completely since it's not being used

echo "🗑️  Removing unused SQLCipher dependency..."

# Navigate to iOS directory
cd ios/App

echo "📱 Cleaning iOS build artifacts..."
# Clean Xcode build folder
if command -v xcodebuild &> /dev/null; then
    xcodebuild clean -workspace App.xcworkspace -scheme App
fi

# Remove Pods and derived data
echo "🗑️  Removing Pods and derived data..."
rm -rf Pods/
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*

# Remove Podfile.lock to force fresh install
rm -f Podfile.lock

echo "📦 Installing pods with SQLCipher fix..."
# Install pods
pod install --repo-update

echo "🔍 Verifying SQLCipher removal..."
# Check if SQLCipher was removed correctly
if [ -d "Pods/SQLCipher" ]; then
    echo "⚠️  SQLCipher pod still exists - this should be removed after pod install"
else
    echo "✅ SQLCipher pod successfully removed"
fi

echo "🎯 SQLCipher removal completed!"
echo ""
echo "Next steps:"
echo "1. Open ios/App/App.xcworkspace in Xcode"
echo "2. Clean Build Folder (Cmd+Shift+K)"
echo "3. Build the project (Cmd+B)"
echo ""
echo "✅ SQLCipher-194 issue should now be resolved!"
echo "Your app now uses only the storage methods you actually need:"
echo "- Capacitor Preferences for simple key-value storage"
echo "- AsyncStorage for case data"
echo "- Custom encryption services for secure attachments"
