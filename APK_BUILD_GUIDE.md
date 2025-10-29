# APK Build Guide for Mozart Music Learning App

## Current Status ✅
- ✅ Capacitor is configured
- ✅ Android platform is added
- ✅ Web app is built and synced to Android
- ❌ Android SDK needs proper setup

## Prerequisites for Building APK

### Option 1: Android Studio (Recommended)
1. **Download and Install Android Studio**
   - Go to https://developer.android.com/studio
   - Download and install Android Studio
   - During setup, make sure to install the Android SDK

2. **Set Environment Variables**
   Add these to your `~/.zshrc` or `~/.bash_profile`:
   ```bash
   export ANDROID_HOME=~/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

3. **Reload your shell**:
   ```bash
   source ~/.zshrc
   ```

### Option 2: Command Line Tools Only
1. **Install Android SDK Command Line Tools**:
   ```bash
   brew install --cask android-commandlinetools
   ```

2. **Set up SDK**:
   ```bash
   export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
   export PATH=$PATH:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools
   ```

3. **Accept licenses and install required packages**:
   ```bash
   sdkmanager --licenses
   sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
   ```

## Building the APK

Once Android SDK is properly set up:

### 1. Build Debug APK
```bash
cd android
./gradlew assembleDebug
```

The APK will be created at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### 2. Build Release APK (Signed)
For a production-ready APK:

```bash
cd android
./gradlew assembleRelease
```

**Note**: Release builds require signing configuration.

## Quick Build Commands (After SDK Setup)

From the frontend directory:

```bash
# Build web app and sync
npm run build
npx cap sync android

# Build APK
cd android && ./gradlew assembleDebug

# The APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Common Issues:

1. **SDK location not found**
   - Make sure ANDROID_HOME is set correctly
   - Verify the path exists: `ls -la $ANDROID_HOME`

2. **Gradle build fails**
   - Make sure you have Java installed: `java -version`
   - Try cleaning: `./gradlew clean`

3. **Permission denied on gradlew**
   - Make it executable: `chmod +x gradlew`

### Verification Commands:
```bash
# Check Android SDK
echo $ANDROID_HOME
adb version

# Check Java
java -version

# Check Gradle
cd android && ./gradlew --version
```

## Alternative: Use Android Studio

1. Open the `android` folder in Android Studio
2. Wait for Gradle sync to complete
3. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. The APK will be generated and Android Studio will show you the location

## App Details

- **App ID**: `com.mozart.musiclearning`
- **App Name**: Mozart Music Learning
- **Target SDK**: Android 13+ (API 33)
- **Architecture**: Universal APK (supports all devices)

## Next Steps After Building

1. Install on device: `adb install app-debug.apk`
2. Test all features work correctly
3. For production: Set up signing keys and build release APK
4. Distribute via Google Play Store or direct download