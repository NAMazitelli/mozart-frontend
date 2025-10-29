# iOS Build Guide for Mozart Music Learning App

## Current Status ✅
- ✅ Capacitor iOS platform is installed
- ✅ iOS project is created and configured
- ✅ Web app is built and synced to iOS
- ✅ CocoaPods is installed and dependencies are resolved
- ❌ Xcode needs to be installed for building

## Prerequisites for Building iOS App

### Option 1: Install Xcode (Recommended)
1. **Download and Install Xcode**
   - Go to the Mac App Store
   - Search for "Xcode" and install it (requires macOS and Apple ID)
   - Size: ~15GB download
   - **OR** download from Apple Developer site (requires Apple Developer account)

2. **Set up Xcode Command Line Tools**
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

3. **Accept Xcode License**
   ```bash
   sudo xcodebuild -license accept
   ```

### Option 2: Xcode Command Line Tools Only (Limited)
- Command line tools are already installed
- Can build for iOS Simulator only
- Cannot build for physical devices or App Store

## Building the iOS App

### Method 1: Using Xcode (Recommended)
1. **Open the project in Xcode**:
   ```bash
   npx cap open ios
   ```
   This will open the project in Xcode.

2. **In Xcode**:
   - Select your target device (iOS Simulator or connected device)
   - Click the "Play" button to build and run
   - For App Store builds: Product → Archive

### Method 2: Command Line Build
Once Xcode is installed:

```bash
# Build for iOS Simulator
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' build

# Build for device (requires code signing)
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -destination 'generic/platform=iOS' build
```

## Current Project Structure
```
ios/
├── App/
│   ├── App.xcodeproj          # Xcode project file
│   ├── App.xcworkspace        # Xcode workspace (use this)
│   ├── Podfile               # CocoaPods dependencies
│   ├── Pods/                 # Installed dependencies
│   └── App/
│       ├── App/              # iOS source code
│       │   └── public/       # Your web app files
│       └── capacitor.config.json
```

## Quick Build Commands (After Xcode Setup)

From the frontend directory:

```bash
# Update web app and sync to iOS
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios

# Or build from command line
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' build
```

## App Configuration

Current settings in `capacitor.config.ts`:
- **App ID**: `com.mozart.musiclearning`
- **App Name**: Mozart Music Learning
- **Bundle ID**: Will be set in Xcode

## iOS-Specific Requirements

### For Device Testing:
1. **Apple Developer Account** (free or paid)
2. **Code Signing Certificate**
3. **Provisioning Profile**

### For App Store Distribution:
1. **Paid Apple Developer Account** ($99/year)
2. **App Store Connect setup**
3. **App Store metadata and assets**

## Troubleshooting

### Common Issues:

1. **"xcodebuild requires Xcode"**
   - Install full Xcode from Mac App Store
   - Run: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`

2. **Code signing errors**
   - Set up Apple Developer account
   - Configure signing in Xcode project settings

3. **Pod install fails**
   - Already resolved ✅
   - Dependencies are installed

### Verification Commands:
```bash
# Check Xcode installation
xcodebuild -version

# Check CocoaPods
pod --version

# Check iOS project
cd ios/App && ls -la
```

## Next Steps

### For Testing:
1. Install Xcode from Mac App Store
2. Open project: `npx cap open ios`
3. Run in iOS Simulator

### For Distribution:
1. Set up Apple Developer account
2. Configure code signing
3. Build for device/App Store

## Current Status Summary

✅ **Ready for Xcode**: The iOS project is fully configured and ready to be opened in Xcode
✅ **Dependencies Installed**: All Capacitor plugins and CocoaPods dependencies are ready
✅ **Web Content Synced**: Your React app is bundled and available in the iOS project

**Next Step**: Install Xcode and run `npx cap open ios` to start building! 🚀